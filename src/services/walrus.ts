// Walrus storage service — uses backend for write (WASM encoding), direct read via aggregator

const WALRUS_BACKEND = process.env.EXPO_PUBLIC_WALRUS_BACKEND || 'http://localhost:3001';
const WALRUS_AGGREGATOR = 'https://aggregator.walrus-testnet.walrus.space';

export async function upload(data: Uint8Array, ownerAddress?: string): Promise<{ blobId: string; blobObjectId?: string }> {
  const params = new URLSearchParams({ epochs: '3' });
  if (ownerAddress) params.set('owner', ownerAddress);

  const res = await fetch(`${WALRUS_BACKEND}/write?${params}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: data as any,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Walrus upload failed: ${err}`);
  }
  const json = await res.json();
  console.log('Walrus uploaded:', json.blobId, 'objectId:', json.blobObjectId);
  return { blobId: json.blobId, blobObjectId: json.blobObjectId };
}

export async function download(blobId: string): Promise<string> {
  const res = await fetch(`${WALRUS_AGGREGATOR}/v1/blobs/${blobId}`);
  if (!res.ok) throw new Error(`Walrus download failed: ${res.status}`);
  return res.text();
}

export async function downloadBytes(blobId: string): Promise<Uint8Array> {
  const res = await fetch(`${WALRUS_AGGREGATOR}/v1/blobs/${blobId}`);
  if (!res.ok) throw new Error(`Walrus download failed: ${res.status}`);
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}
