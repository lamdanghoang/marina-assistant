import * as SecureStore from 'expo-secure-store';

export interface Contact {
  id: string;
  name: string;
  walletAddress: string;
  createdAt: string;
}

const CONTACTS_KEY_PREFIX = 'marina_contacts_';

function contactsKey(ownerAddress?: string): string {
  return ownerAddress ? `${CONTACTS_KEY_PREFIX}${ownerAddress.slice(0, 10)}` : 'marina_contacts';
}

async function load(ownerAddress?: string): Promise<Contact[]> {
  const raw = await SecureStore.getItemAsync(contactsKey(ownerAddress));
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

async function save(contacts: Contact[], ownerAddress?: string): Promise<void> {
  await SecureStore.setItemAsync(contactsKey(ownerAddress), JSON.stringify(contacts));
}

export async function getContacts(ownerAddress?: string): Promise<Contact[]> {
  return load(ownerAddress);
}

export async function addContact(name: string, walletAddress: string, ownerAddress?: string): Promise<Contact> {
  const contacts = await load(ownerAddress);
  const contact: Contact = {
    id: Date.now().toString(),
    name: name.trim(),
    walletAddress: walletAddress.trim(),
    createdAt: new Date().toISOString(),
  };
  contacts.push(contact);
  await save(contacts, ownerAddress);
  return contact;
}

export async function deleteContact(id: string, ownerAddress?: string): Promise<void> {
  const contacts = await load(ownerAddress);
  await save(contacts.filter((c) => c.id !== id), ownerAddress);
}

export async function findByName(name: string, ownerAddress?: string): Promise<Contact | null> {
  const contacts = await load(ownerAddress);
  const lower = name.toLowerCase();
  return contacts.find((c) => c.name.toLowerCase().includes(lower)) ?? null;
}
