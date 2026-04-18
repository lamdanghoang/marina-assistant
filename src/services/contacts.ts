import * as SecureStore from 'expo-secure-store';

export interface Contact {
  id: string;
  name: string;
  walletAddress: string;
  createdAt: string;
}

const CONTACTS_KEY = 'marina_contacts';

async function load(): Promise<Contact[]> {
  const raw = await SecureStore.getItemAsync(CONTACTS_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

async function save(contacts: Contact[]): Promise<void> {
  await SecureStore.setItemAsync(CONTACTS_KEY, JSON.stringify(contacts));
}

export async function getContacts(): Promise<Contact[]> {
  return load();
}

export async function addContact(name: string, walletAddress: string): Promise<Contact> {
  const contacts = await load();
  const contact: Contact = {
    id: Date.now().toString(),
    name: name.trim(),
    walletAddress: walletAddress.trim(),
    createdAt: new Date().toISOString(),
  };
  contacts.push(contact);
  await save(contacts);
  return contact;
}

export async function deleteContact(id: string): Promise<void> {
  const contacts = await load();
  await save(contacts.filter((c) => c.id !== id));
}

export async function findByName(name: string): Promise<Contact | null> {
  const contacts = await load();
  const lower = name.toLowerCase();
  return contacts.find((c) => c.name.toLowerCase().includes(lower)) ?? null;
}
