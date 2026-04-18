import * as SecureStore from 'expo-secure-store';
import { upload, downloadBytes } from './walrus';
import { encrypt, decrypt } from './seal';
import { scheduleCapsuleUnlock, requestPermission } from './notifications';

const PACKAGE_ID = process.env.EXPO_PUBLIC_CAPSULE_PACKAGE_ID || '';
const GRAPHQL_URL = 'https://graphql.testnet.sui.io/graphql';

export interface CapsuleMetadata {
  id: string;
  blobId: string;
  senderAddress: string;
  recipientAddress: string;
  recipientName: string;
  unlockAt: string; // ISO date
  createdAt: string;
  objectId?: string; // on-chain Capsule object ID
}

const CAPSULES_KEY = 'marina_capsules';

async function loadCapsules(): Promise<CapsuleMetadata[]> {
  const raw = await SecureStore.getItemAsync(CAPSULES_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

async function saveCapsules(capsules: CapsuleMetadata[]): Promise<void> {
  await SecureStore.setItemAsync(CAPSULES_KEY, JSON.stringify(capsules));
}

export function isLocked(capsule: CapsuleMetadata): boolean {
  return new Date(capsule.unlockAt).getTime() > Date.now();
}

export function timeUntilUnlock(capsule: CapsuleMetadata): string {
  const diff = new Date(capsule.unlockAt).getTime() - Date.now();
  if (diff <= 0) return 'Ready to open';
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export async function createCapsule(params: {
  content: string;
  senderAddress: string;
  recipientAddress: string;
  recipientName: string;
  unlockAt: Date;
}): Promise<CapsuleMetadata> {
  const unlockTimeMs = params.unlockAt.getTime();

  // 1. Seal encrypt
  let encryptedData: Uint8Array;
  let nonce: Uint8Array;
  try {
    const result = await encrypt(params.content, unlockTimeMs, params.recipientAddress);
    encryptedData = result.encryptedData;
    nonce = result.nonce;
    console.log('Seal encrypted:', encryptedData.length, 'bytes');
  } catch (err) {
    console.error('Seal encrypt failed:', err);
    throw new Error('Unable to encrypt content. Please try again.');
  }

  // 2. Upload encrypted data to Walrus (via backend SDK)
  const { blobId, blobObjectId: walrusBlobObjectId } = await upload(encryptedData, params.senderAddress);
  console.log('Walrus uploaded, blobId:', blobId);

  // 3. Create on-chain Capsule (optional — if package deployed)
  let objectId: string | undefined;
  if (PACKAGE_ID) {
    try {
      objectId = await createCapsuleOnChain(blobId, nonce, unlockTimeMs, params.recipientAddress, params.senderAddress);
      console.log('On-chain capsule created:', objectId);
    } catch (err) {
      console.warn('On-chain capsule creation failed:', err instanceof Error ? err.message : err);
    }
  }

  // 4. Save metadata locally
  const capsule: CapsuleMetadata = {
    id: Date.now().toString(),
    blobId,
    senderAddress: params.senderAddress,
    recipientAddress: params.recipientAddress,
    recipientName: params.recipientName,
    unlockAt: params.unlockAt.toISOString(),
    createdAt: new Date().toISOString(),
    objectId,
  };

  const capsules = await loadCapsules();
  capsules.push(capsule);
  await saveCapsules(capsules);

  // 5. Schedule notification (only if capsule is for self)
  if (params.senderAddress === params.recipientAddress) {
    await requestPermission();
    await scheduleCapsuleUnlock(capsule).catch((err) => console.warn('Notification failed:', err));
  }
  console.log('Capsule created, unlock at:', capsule.unlockAt);

  return capsule;
}

async function createCapsuleOnChain(
  blobId: string, nonce: Uint8Array, unlockTimeMs: number, recipient: string, sender: string,
): Promise<string | undefined> {
  const { loadSession, signTransactionZkLogin, getStoredKeypair } = await import('./auth');
  const { Transaction } = await import('@mysten/sui/transactions');
  const { SuiGraphQLClient } = await import('@mysten/sui/graphql');
  const { toBase64 } = await import('@mysten/sui/utils');

  const session = await loadSession();
  const client = new SuiGraphQLClient({ url: GRAPHQL_URL, network: 'testnet' });

  const tx = new Transaction();
  tx.setSender(sender);
  tx.moveCall({
    target: `${PACKAGE_ID}::capsule::create_capsule`,
    arguments: [
      tx.pure.string(blobId),
      tx.pure.vector('u8', [...nonce]),
      tx.pure.u64(BigInt(unlockTimeMs)),
      tx.pure.address(recipient),
      tx.object('0x6'), // Clock
    ],
  });

  const txBytes = await tx.build({ client });
  console.log('Capsule TX built, bytes:', txBytes.length);

  // Sign
  let signature: string;
  if (session?.authMethod === 'zklogin') {
    signature = await signTransactionZkLogin(txBytes);
  } else {
    const keypair = await getStoredKeypair();
    if (!keypair) throw new Error('No keypair');
    signature = (await keypair.signTransaction(txBytes)).signature;
  }

  // Submit transaction
  const res = await fetch('https://fullnode.testnet.sui.io:443', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0', id: 1,
      method: 'sui_executeTransactionBlock',
      params: [toBase64(txBytes), [signature], { showEffects: true, showObjectChanges: true }, 'WaitForLocalExecution'],
    }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  const created = json.result?.objectChanges?.find((o: any) => o.type === 'created' && o.objectType?.includes('::capsule::Capsule'));
  return created?.objectId;
}

export async function getCapsules(ownerAddress?: string): Promise<CapsuleMetadata[]> {
  const local = await loadCapsules();

  if (!ownerAddress || !PACKAGE_ID) return local;

  // Query on-chain capsules + merge with local
  try {
    const res = await fetch('https://fullnode.testnet.sui.io:443', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0', id: 1,
        method: 'suix_getOwnedObjects',
        params: [ownerAddress, {
          filter: { StructType: `${PACKAGE_ID}::capsule::Capsule` },
          options: { showContent: true },
        }],
      }),
    });
    const json = await res.json();
    const objects = json.result?.data ?? [];

    const onChain: CapsuleMetadata[] = objects.map((obj: any) => {
      const fields = obj.data?.content?.fields;
      if (!fields) return null;
      const objectId = obj.data.objectId;
      const recipient = fields.recipient ?? '';
      const truncAddr = (a: string) => a ? `${a.slice(0, 6)}...${a.slice(-4)}` : '';
      return {
        id: objectId,
        blobId: fields.blob_id ?? '',
        senderAddress: fields.owner ?? '',
        recipientAddress: recipient,
        recipientName: truncAddr(recipient),
        unlockAt: new Date(Number(fields.unlock_date)).toISOString(),
        createdAt: new Date(Number(fields.created_at)).toISOString(),
        objectId,
      } as CapsuleMetadata;
    }).filter(Boolean);

    // On-chain is source of truth
    return onChain;
  } catch (err) {
    console.warn('On-chain query failed, using local:', err);
    return local;
  }
}

export async function unlockCapsule(capsule: CapsuleMetadata, userAddress: string): Promise<string> {
  if (isLocked(capsule)) {
    throw new Error(`Capsule is not yet ready to unlock. ${timeUntilUnlock(capsule)} remaining`);
  }

  // Download encrypted data from Walrus
  const encryptedData = await downloadBytes(capsule.blobId);

  // Decrypt with Seal (userAddress = current logged-in user)
  return await decrypt(encryptedData, userAddress, capsule.objectId);
}

export async function deleteCapsule(id: string): Promise<void> {
  const capsules = await loadCapsules();
  await saveCapsules(capsules.filter((c) => c.id !== id));
}

export async function clearLocalCapsules(): Promise<void> {
  await SecureStore.deleteItemAsync(CAPSULES_KEY);
}
