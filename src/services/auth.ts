import * as SecureStore from 'expo-secure-store';
import type { AuthSession } from '../types';

const SESSION_KEY = 'marina_auth_session';
const KEYPAIR_KEY = 'marina_keypair';
const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '';

// === Session ===

export async function saveSession(session: AuthSession): Promise<void> {
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
}

export async function loadSession(): Promise<AuthSession | null> {
  const raw = await SecureStore.getItemAsync(SESSION_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as AuthSession; } catch { return null; }
}

export async function logout(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_KEY);
  await SecureStore.deleteItemAsync(KEYPAIR_KEY);
}

// === Wallet Auth (seed phrase) ===

export async function loginWithSeedPhrase(seedPhrase: string): Promise<AuthSession> {
  const { Ed25519Keypair } = await import('@mysten/sui/keypairs/ed25519');
  const keypair = Ed25519Keypair.deriveKeypair(seedPhrase.trim());
  const address = keypair.getPublicKey().toSuiAddress();
  const publicKey = keypair.getPublicKey().toBase64();
  await SecureStore.setItemAsync(KEYPAIR_KEY, keypair.getSecretKey());
  const session: AuthSession = { walletAddress: address, authMethod: 'wallet', publicKey };
  await saveSession(session);
  return session;
}

export async function loginWithNewWallet(): Promise<AuthSession & { secretKey: string; mnemonic: string }> {
  const { Ed25519Keypair } = await import('@mysten/sui/keypairs/ed25519');
  const { generateMnemonic } = await import('@scure/bip39');
  const { wordlist } = await import('@scure/bip39/wordlists/english' as any);
  const mnemonic = generateMnemonic(wordlist, 128);
  const keypair = Ed25519Keypair.deriveKeypair(mnemonic);
  const address = keypair.getPublicKey().toSuiAddress();
  const publicKey = keypair.getPublicKey().toBase64();
  const secretKey = keypair.getSecretKey();
  await SecureStore.setItemAsync(KEYPAIR_KEY, secretKey);
  const session: AuthSession = { walletAddress: address, authMethod: 'wallet', publicKey };
  await saveSession(session);
  return { ...session, secretKey, mnemonic };
}

// === zkLogin (Google OAuth + Enoki) ===

async function getCurrentEpoch(): Promise<number> {
  try {
    const res = await fetch('https://graphql.testnet.sui.io/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '{ epoch { epochId } }' }),
    });
    const json = await res.json();
    return parseInt(json.data?.epoch?.epochId ?? '0');
  } catch { return 0; }
}

export async function loginWithGoogle(): Promise<AuthSession> {
  const { Ed25519Keypair } = await import('@mysten/sui/keypairs/ed25519');
  const { generateNonce, generateRandomness, jwtToAddress, genAddressSeed, getExtendedEphemeralPublicKey } = await import('@mysten/sui/zklogin');

  const currentEpoch = await getCurrentEpoch();
  const maxEpoch = currentEpoch + 10;
  const ephemeralKeyPair = new Ed25519Keypair();
  const randomness = generateRandomness();
  const nonce = generateNonce(ephemeralKeyPair.getPublicKey(), maxEpoch, randomness);

  // Google OAuth
  const { openAuthSessionAsync } = await import('expo-web-browser');
  const reversedClientId = GOOGLE_CLIENT_ID.split('.').reverse().join('.');
  const redirectUri = `${reversedClientId}:/oauth2callback`;
  const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid&nonce=${nonce}&prompt=select_account`;

  const result = await openAuthSessionAsync(oauthUrl, redirectUri);
  if (result.type !== 'success' || !result.url) throw new Error('Google login failed or cancelled');

  const code = new URL(result.url).searchParams.get('code');
  if (!code) throw new Error('No authorization code received');

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `code=${code}&client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&grant_type=authorization_code&nonce=${nonce}`,
  });
  if (!tokenRes.ok) throw new Error(`Token exchange error: ${tokenRes.status}`);
  const { id_token: jwt } = await tokenRes.json();
  if (!jwt) throw new Error('No id_token received');

  // Enoki salt + address
  const jwtPayload = JSON.parse(atob(jwt.split('.')[1]));
  const sub = jwtPayload.sub;
  const aud = typeof jwtPayload.aud === 'string' ? jwtPayload.aud : jwtPayload.aud[0];
  const enokiApiKey = process.env.EXPO_PUBLIC_ENOKI_API_KEY || '';

  let salt: string;
  let address: string;
  try {
    const enokiRes = await fetch('https://api.enoki.mystenlabs.com/v1/zklogin', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${enokiApiKey}`, 'zklogin-jwt': jwt },
    });
    if (!enokiRes.ok) throw new Error(`Enoki: ${enokiRes.status}`);
    const enokiData = (await enokiRes.json()).data;
    salt = enokiData.salt;
    address = enokiData.address;
  } catch (err) {
    console.warn('Enoki failed, computing locally:', err);
    salt = generateRandomness();
    address = jwtToAddress(jwt, salt, false);
  }

  let addressSeed = genAddressSeed(BigInt(salt), 'sub', sub, aud).toString();

  // Enoki zkProof
  let zkProof: string | null = null;
  try {
    const proofRes = await fetch('https://api.enoki.mystenlabs.com/v1/zklogin/zkp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${enokiApiKey}`, 'zklogin-jwt': jwt },
      body: JSON.stringify({ ephemeralPublicKey: ephemeralKeyPair.getPublicKey().toSuiPublicKey(), maxEpoch, randomness, network: 'testnet' }),
    });
    if (proofRes.ok) {
      const resp = await proofRes.json();
      // Use Enoki's addressSeed if available — it must match the proof
      if (resp.data?.addressSeed) {
        addressSeed = resp.data.addressSeed;
      }
      zkProof = JSON.stringify(resp.data);
      console.log('zkProof obtained from Enoki');
    }
  } catch (err) {
    console.warn('Enoki proof failed:', err);
  }

  // Store
  await SecureStore.setItemAsync(KEYPAIR_KEY, ephemeralKeyPair.getSecretKey());
  await SecureStore.setItemAsync('marina_zklogin_jwt', jwt);
  await SecureStore.setItemAsync('marina_zklogin_salt', salt);
  await SecureStore.setItemAsync('marina_zklogin_randomness', randomness);
  await SecureStore.setItemAsync('marina_zklogin_max_epoch', maxEpoch.toString());
  await SecureStore.setItemAsync('marina_zklogin_address_seed', addressSeed);
  if (zkProof) await SecureStore.setItemAsync('marina_zklogin_proof', zkProof);

  const session: AuthSession = { walletAddress: address, authMethod: 'zklogin', publicKey: ephemeralKeyPair.getPublicKey().toBase64() };
  await saveSession(session);
  return session;
}

// === Keypair + Signing ===

export async function getStoredKeypair() {
  const secretKey = await SecureStore.getItemAsync(KEYPAIR_KEY);
  if (!secretKey) return null;
  const { Ed25519Keypair } = await import('@mysten/sui/keypairs/ed25519');
  return Ed25519Keypair.fromSecretKey(secretKey);
}

export async function signTransactionZkLogin(txBytes: Uint8Array): Promise<string> {
  const keypair = await getStoredKeypair();
  if (!keypair) throw new Error('No ephemeral keypair found');

  const jwt = await SecureStore.getItemAsync('marina_zklogin_jwt');
  const proofStr = await SecureStore.getItemAsync('marina_zklogin_proof');
  const maxEpochStr = await SecureStore.getItemAsync('marina_zklogin_max_epoch');
  const addressSeed = await SecureStore.getItemAsync('marina_zklogin_address_seed');

  if (!jwt || !proofStr || !maxEpochStr || !addressSeed) throw new Error('zkLogin session expired. Please login again.');

  const maxEpoch = parseInt(maxEpochStr);
  const currentEpoch = await getCurrentEpoch();
  if (currentEpoch >= maxEpoch) throw new Error('zkLogin session expired (epoch). Please login again.');

  const { getZkLoginSignature } = await import('@mysten/sui/zklogin');
  const { signature: ephemeralSignature } = await keypair.signTransaction(txBytes);
  const zkProof = JSON.parse(proofStr);

  return getZkLoginSignature({ inputs: { ...zkProof, addressSeed }, maxEpoch, userSignature: ephemeralSignature });
}
