// File storage service — upload files to Walrus, manage metadata locally
import * as SecureStore from 'expo-secure-store';

export interface StoredFile {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  blobId: string;
  createdAt: string;
}

async function getKey(): Promise<string> {
  const { loadSession } = await import('./auth');
  const s = await loadSession();
  const addr = s?.walletAddress?.slice(0, 10) || '';
  return `marina_files_${addr}`;
}

async function loadFiles(): Promise<StoredFile[]> {
  const raw = await SecureStore.getItemAsync(await getKey());
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

async function saveFiles(files: StoredFile[]): Promise<void> {
  await SecureStore.setItemAsync(await getKey(), JSON.stringify(files));
}

export async function getFiles(): Promise<StoredFile[]> {
  return loadFiles();
}

export async function uploadFile(uri: string, name: string, size: number, mimeType: string): Promise<StoredFile> {
  const { upload } = await import('./walrus');
  const { loadSession } = await import('./auth');
  const session = await loadSession();

  // Read file as bytes
  const res = await fetch(uri);
  const buf = await res.arrayBuffer();
  const data = new Uint8Array(buf);

  // Upload to Walrus
  const { blobId } = await upload(data, session?.walletAddress);

  const file: StoredFile = {
    id: Date.now().toString(),
    name,
    size,
    mimeType,
    blobId,
    createdAt: new Date().toISOString(),
  };

  const files = await loadFiles();
  files.unshift(file);
  await saveFiles(files);
  return file;
}

export async function deleteFile(id: string): Promise<void> {
  const files = await loadFiles();
  await saveFiles(files.filter(f => f.id !== id));
}
