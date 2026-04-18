// Seal encryption service — real threshold encryption with time-lock + ownership
// Pattern: TLE + private_data (Capsule ownership enforced by Sui)

const PACKAGE_ID = process.env.EXPO_PUBLIC_CAPSULE_PACKAGE_ID || '';

const KEY_SERVER_CONFIGS = [
  { objectId: '0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75', weight: 1 },
  { objectId: '0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8', weight: 1 },
  { objectId: '0x6a0726a1ea3d62ba2f2ae51104f2c3633c003fb75621d06fde47f04dc930ba06', weight: 1 },
];

let _sealClient: any = null;
async function getSealClient() {
  if (!_sealClient) {
    const { SealClient } = await import('@mysten/seal');
    const { SuiGraphQLClient } = await import('@mysten/sui/graphql');
    const suiClient = new SuiGraphQLClient({ url: 'https://graphql.testnet.sui.io/graphql', network: 'testnet' });
    _sealClient = new SealClient({ suiClient, serverConfigs: KEY_SERVER_CONFIGS, verifyKeyServers: false });
  }
  return _sealClient;
}

export async function encrypt(plaintext: string, unlockTimeMs: number, recipientAddress?: string): Promise<{ encryptedData: Uint8Array; nonce: Uint8Array }> {
  const { bcs } = await import('@mysten/sui/bcs');
  const { toHex } = await import('@mysten/sui/utils');

  const timeBytes = bcs.u64().serialize(BigInt(unlockTimeMs)).toBytes();
  const nonce = new Uint8Array(32);
  crypto.getRandomValues(nonce);
  const idBytes = new Uint8Array(timeBytes.length + nonce.length);
  idBytes.set(timeBytes, 0);
  idBytes.set(nonce, timeBytes.length);
  const idHex = toHex(idBytes);

  let data = new TextEncoder().encode(plaintext);

  // PQ hybrid: if recipient has ML-KEM key, encrypt data with PQ first
  if (recipientAddress) {
    try {
      const { queryPQPublicKey, pqEncrypt } = await import('./pq-crypto');
      const recipientPK = await queryPQPublicKey(recipientAddress);
      if (recipientPK) {
        const { ciphertext, kemCiphertext } = await pqEncrypt(data, recipientPK);
        // Pack: [1 byte flag][4 bytes kem length][kemCiphertext][ciphertext]
        const packed = new Uint8Array(1 + 4 + kemCiphertext.length + ciphertext.length);
        packed[0] = 1; // PQ flag
        new DataView(packed.buffer).setUint32(1, kemCiphertext.length);
        packed.set(kemCiphertext, 5);
        packed.set(ciphertext, 5 + kemCiphertext.length);
        data = packed;
        console.log('PQ hybrid encryption applied');
      }
    } catch (err) {
      console.warn('PQ encryption skipped:', err);
    }
  }

  const client = await getSealClient();
  const result = await client.encrypt({ threshold: 2, packageId: PACKAGE_ID, id: idHex, data });

  console.log('Seal encrypted:', plaintext.length, '→', result.encryptedObject.length, 'bytes');
  return { encryptedData: result.encryptedObject, nonce };
}

export async function decrypt(encryptedData: Uint8Array, userAddress: string, capsuleObjectId?: string): Promise<string> {
  const { SessionKey, EncryptedObject } = await import('@mysten/seal');
  const { SuiGraphQLClient } = await import('@mysten/sui/graphql');
  const { Ed25519Keypair } = await import('@mysten/sui/keypairs/ed25519');
  const { Transaction } = await import('@mysten/sui/transactions');

  const suiClient = new SuiGraphQLClient({ url: 'https://graphql.testnet.sui.io/graphql', network: 'testnet' });
  const client = await getSealClient();

  const parsed = EncryptedObject.parse(encryptedData);
  const idHex = typeof parsed.id === 'string' ? parsed.id : Array.from(parsed.id as Uint8Array).map((b: number) => b.toString(16).padStart(2, '0')).join('');
  const idBytes: number[] = [];
  for (let i = 0; i < idHex.length; i += 2) {
    idBytes.push(parseInt(idHex.substring(i, i + 2), 16));
  }

  // Session key — need user's real keypair to sign
  const { getStoredKeypair, loadSession, signTransactionZkLogin } = await import('./auth');
  const session = await loadSession();
  const userKeypair = await getStoredKeypair();

  let sessionKey: any;
  if (session?.authMethod === 'wallet' && userKeypair) {
    // Wallet login: keypair address matches user address
    sessionKey = await SessionKey.create({
      address: userAddress,
      packageId: PACKAGE_ID,
      ttlMin: 10,
      signer: userKeypair,
      suiClient,
    });
  } else {
    // zkLogin: create without signer, sign personal message manually
    sessionKey = await SessionKey.create({
      address: userAddress,
      packageId: PACKAGE_ID,
      ttlMin: 10,
      suiClient,
    });
    // Sign personal message with ephemeral keypair
    if (userKeypair) {
      const msg = sessionKey.getPersonalMessage();
      const { signature } = await userKeypair.signPersonalMessage(msg);
      await sessionKey.setPersonalMessageSignature(signature);
    }
  }

  // Build seal_approve TX
  const tx = new Transaction();
  tx.setSender(userAddress);
  const args: any[] = [tx.pure.vector('u8', idBytes), tx.object('0x6')];
  if (capsuleObjectId) args.push(tx.object(capsuleObjectId));
  tx.moveCall({
    target: `${PACKAGE_ID}::seal_timelock::seal_approve`,
    arguments: args,
  });
  const txBytes = await tx.build({ client: suiClient, onlyTransactionKind: true });

  const decrypted = await client.decrypt({ data: encryptedData, sessionKey, txBytes });

  // Check PQ flag
  if (decrypted[0] === 1) {
    console.log('PQ hybrid decryption...');
    const { getLocalSecretKey, pqDecrypt } = await import('./pq-crypto');
    const sk = await getLocalSecretKey();
    if (!sk) throw new Error('PQ secret key không tìm thấy. Không thể giải mã.');
    const kemLen = new DataView(decrypted.buffer, decrypted.byteOffset).getUint32(1);
    const kemCiphertext = decrypted.slice(5, 5 + kemLen);
    const ciphertext = decrypted.slice(5 + kemLen);
    const plainBytes = await pqDecrypt(ciphertext, kemCiphertext, sk);
    return new TextDecoder().decode(plainBytes);
  }

  console.log('Seal decrypted:', encryptedData.length, '→', decrypted.length, 'bytes');
  return new TextDecoder().decode(decrypted);
}
