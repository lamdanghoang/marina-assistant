// Post-Quantum encryption service using ML-KEM-768
// Hybrid: Seal (time-lock + ownership) + ML-KEM (quantum-resistant)
import * as SecureStore from 'expo-secure-store';

const PACKAGE_ID = process.env.EXPO_PUBLIC_CAPSULE_PACKAGE_ID || '';

function pqKey(suffix: string): string {
  // Per-wallet PQ keys — caller should pass address or we read from auth
  return `marina_pq_${suffix}`;
}

async function getCurrentAddr(): Promise<string> {
  const { loadSession } = await import('./auth');
  const s = await loadSession();
  return s?.walletAddress?.slice(0, 10) || '';
}

// === Key Management ===

export async function generatePQKeypair(): Promise<{ publicKey: Uint8Array; secretKey: Uint8Array }> {
  const { ml_kem768 } = await import('@noble/post-quantum/ml-kem.js');
  const { publicKey, secretKey } = ml_kem768.keygen();
  return { publicKey, secretKey };
}

export async function hasLocalPQKey(): Promise<boolean> {
  const addr = await getCurrentAddr();
  const sk = await SecureStore.getItemAsync(`marina_pq_sk_${addr}`);
  return !!sk;
}

export async function savePQKeypair(publicKey: Uint8Array, secretKey: Uint8Array): Promise<void> {
  const { toBase64 } = await import('@mysten/sui/utils');
  const addr = await getCurrentAddr();
  await SecureStore.setItemAsync(`marina_pq_sk_${addr}`, toBase64(secretKey));
  await SecureStore.setItemAsync(`marina_pq_pk_${addr}`, toBase64(publicKey));
}

export async function getLocalSecretKey(): Promise<Uint8Array | null> {
  const { fromBase64 } = await import('@mysten/sui/utils');
  const addr = await getCurrentAddr();
  const sk = await SecureStore.getItemAsync(`marina_pq_sk_${addr}`);
  if (!sk) return null;
  return fromBase64(sk);
}

export async function getLocalPublicKey(): Promise<Uint8Array | null> {
  const { fromBase64 } = await import('@mysten/sui/utils');
  const addr = await getCurrentAddr();
  const pk = await SecureStore.getItemAsync(`marina_pq_pk_${addr}`);
  if (!pk) return null;
  return fromBase64(pk);
}

// === On-chain Registry ===

export async function registerPQKeyOnChain(publicKey: Uint8Array, senderAddress: string): Promise<string | undefined> {
  const { loadSession, signTransactionZkLogin, getStoredKeypair } = await import('./auth');
  const { Transaction } = await import('@mysten/sui/transactions');
  const { SuiGraphQLClient } = await import('@mysten/sui/graphql');
  const { toBase64 } = await import('@mysten/sui/utils');

  const session = await loadSession();
  const client = new SuiGraphQLClient({ url: 'https://graphql.testnet.sui.io/graphql', network: 'testnet' });

  const tx = new Transaction();
  tx.setSender(senderAddress);
  tx.moveCall({
    target: `${PACKAGE_ID}::pq_registry::register_key`,
    arguments: [tx.pure.vector('u8', [...publicKey])],
  });

  const txBytes = await tx.build({ client });

  let signature: string;
  if (session?.authMethod === 'zklogin') {
    signature = await signTransactionZkLogin(txBytes);
  } else {
    const keypair = await getStoredKeypair();
    if (!keypair) throw new Error('No keypair');
    signature = (await keypair.signTransaction(txBytes)).signature;
  }

  const res = await fetch('https://fullnode.testnet.sui.io:443', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0', id: 1,
      method: 'sui_executeTransactionBlock',
      params: [toBase64(txBytes), [signature], { showEffects: true }, 'WaitForLocalExecution'],
    }),
  });
  const json = await res.json();
  console.log('PQ key registered on-chain:', json.result?.effects?.status?.status);
  return json.result?.digest;
}

export async function revokePQKey(ownerAddress: string): Promise<void> {
  const { loadSession, signTransactionZkLogin, getStoredKeypair } = await import('./auth');
  const { Transaction } = await import('@mysten/sui/transactions');
  const { SuiGraphQLClient } = await import('@mysten/sui/graphql');
  const { toBase64 } = await import('@mysten/sui/utils');

  // Find PQ key object
  const res = await fetch('https://fullnode.testnet.sui.io:443', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0', id: 1,
      method: 'suix_getOwnedObjects',
      params: [ownerAddress, { filter: { StructType: `${PACKAGE_ID}::pq_registry::PQKey` }, options: { showContent: true } }],
    }),
  });
  const json = await res.json();
  const objectId = json.result?.data?.[0]?.data?.objectId;
  if (!objectId) throw new Error('No PQ key found on-chain');

  const session = await loadSession();
  const client = new SuiGraphQLClient({ url: 'https://graphql.testnet.sui.io/graphql', network: 'testnet' });
  const tx = new Transaction();
  tx.setSender(ownerAddress);
  tx.moveCall({ target: `${PACKAGE_ID}::pq_registry::revoke_key`, arguments: [tx.object(objectId)] });
  const txBytes = await tx.build({ client });

  let signature: string;
  if (session?.authMethod === 'zklogin') {
    signature = await signTransactionZkLogin(txBytes);
  } else {
    const keypair = await getStoredKeypair();
    if (!keypair) throw new Error('No keypair');
    signature = (await keypair.signTransaction(txBytes)).signature;
  }

  const submitRes = await fetch('https://fullnode.testnet.sui.io:443', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0', id: 1,
      method: 'sui_executeTransactionBlock',
      params: [toBase64(txBytes), [signature], { showEffects: true }, 'WaitForLocalExecution'],
    }),
  });
  const submitJson = await submitRes.json();
  if (submitJson.error) throw new Error(submitJson.error.message);

  // Clear local keys
  const addr = await getCurrentAddr();
  await SecureStore.deleteItemAsync(`marina_pq_sk_${addr}`);
  await SecureStore.deleteItemAsync(`marina_pq_pk_${addr}`);
  console.log('PQ key revoked');
}

export async function queryPQPublicKey(ownerAddress: string): Promise<Uint8Array | null> {
  const res = await fetch('https://fullnode.testnet.sui.io:443', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0', id: 1,
      method: 'suix_getOwnedObjects',
      params: [ownerAddress, {
        filter: { StructType: `${PACKAGE_ID}::pq_registry::PQKey` },
        options: { showContent: true },
      }],
    }),
  });
  const json = await res.json();
  const obj = json.result?.data?.[0];
  if (!obj) return null;
  const pkBytes = obj.data?.content?.fields?.public_key;
  if (!pkBytes || !Array.isArray(pkBytes)) return null;
  return new Uint8Array(pkBytes);
}

// === Hybrid Encryption (ML-KEM + AES-GCM) ===

export async function pqEncrypt(data: Uint8Array, recipientPQPublicKey: Uint8Array): Promise<{ ciphertext: Uint8Array; kemCiphertext: Uint8Array }> {
  const { ml_kem768 } = await import('@noble/post-quantum/ml-kem.js');
  const { gcm } = require('@noble/ciphers/aes');

  // ML-KEM encapsulate → shared secret
  const { cipherText: kemCiphertext, sharedSecret } = ml_kem768.encapsulate(recipientPQPublicKey);

  // AES-GCM encrypt data with shared secret (first 32 bytes)
  const key = sharedSecret.slice(0, 32);
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);

  const cipher = gcm(key, iv);
  const encrypted = cipher.encrypt(data);

  // Combine: iv (12) + encrypted
  const ciphertext = new Uint8Array(12 + encrypted.length);
  ciphertext.set(iv, 0);
  ciphertext.set(encrypted, 12);

  return { ciphertext, kemCiphertext };
}

export async function pqDecrypt(ciphertext: Uint8Array, kemCiphertext: Uint8Array, secretKey: Uint8Array): Promise<Uint8Array> {
  const { ml_kem768 } = await import('@noble/post-quantum/ml-kem.js');
  const { gcm } = require('@noble/ciphers/aes');

  // ML-KEM decapsulate → shared secret
  const sharedSecret = ml_kem768.decapsulate(kemCiphertext, secretKey);

  // AES-GCM decrypt
  const key = sharedSecret.slice(0, 32);
  const iv = ciphertext.slice(0, 12);
  const encrypted = ciphertext.slice(12);

  const cipher = gcm(key, iv);
  return cipher.decrypt(encrypted);
}

// === Setup (call on first login) ===

export async function setupPQIfNeeded(userAddress: string): Promise<void> {
  if (await hasLocalPQKey()) return;

  console.log('Generating PQ keypair...');
  const { publicKey, secretKey } = await generatePQKeypair();
  await savePQKeypair(publicKey, secretKey);

  console.log('Registering PQ key on-chain...');
  await registerPQKeyOnChain(publicKey, userAddress).catch(err =>
    console.warn('PQ key registration failed:', err)
  );
  console.log('PQ setup complete');
}
