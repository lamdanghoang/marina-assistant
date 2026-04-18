import { getStoredKeypair, loadSession, signTransactionZkLogin } from './auth';

const GRAPHQL_URL = 'https://graphql.testnet.sui.io/graphql';
const JSON_RPC_URL = 'https://fullnode.testnet.sui.io:443';

export async function getBalance(address: string): Promise<string> {
  try {
    const { SuiGraphQLClient } = await import('@mysten/sui/graphql');
    const client = new SuiGraphQLClient({ url: GRAPHQL_URL, network: 'testnet' });
    const result = await client.query({
      query: `{ address(address: "${address}") { balance(coinType: "0x2::sui::SUI") { totalBalance } } }`,
    } as any);
    const balance = (result.data as any)?.address?.balance?.totalBalance ?? '0';
    return (Number(balance) / 1_000_000_000).toFixed(4);
  } catch (err) {
    console.warn('getBalance error:', err);
    return '0.0000';
  }
}

// === Build transaction (shared) ===

async function buildTransferTx(senderAddress: string, recipient: string, amountSui: number) {
  const { Transaction } = await import('@mysten/sui/transactions');
  const { SuiGraphQLClient } = await import('@mysten/sui/graphql');

  const client = new SuiGraphQLClient({ url: GRAPHQL_URL, network: 'testnet' });
  const tx = new Transaction();
  tx.setSender(senderAddress);

  const amountMist = BigInt(Math.round(amountSui * 1_000_000_000));
  const [coin] = tx.splitCoins(tx.gas, [amountMist]);
  tx.transferObjects([coin], recipient);

  const txBytes = await tx.build({ client });
  return txBytes;
}

// === Sign with wallet (seed phrase) ===

async function signWithWallet(txBytes: Uint8Array): Promise<string> {
  const keypair = await getStoredKeypair();
  if (!keypair) throw new Error('Keypair not found. Please log in again.');
  const { signature } = await keypair.signTransaction(txBytes);
  return signature;
}

// === Sign with zkLogin (Google OAuth) ===

async function signWithZkLogin(txBytes: Uint8Array): Promise<string> {
  return await signTransactionZkLogin(txBytes);
}

// === Submit transaction via JSON RPC ===

async function submitTransaction(txBytes: Uint8Array, signature: string): Promise<{ digest: string; success: boolean; error?: string }> {
  const { toBase64 } = await import('@mysten/sui/utils');
  const res = await fetch(JSON_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'sui_executeTransactionBlock',
      params: [toBase64(txBytes), [signature], { showEffects: true }, 'WaitForLocalExecution'],
    }),
  });

  const json = await res.json();
  if (json.error) return { digest: '', success: false, error: json.error.message };

  const digest = json.result?.digest ?? '';
  const status = json.result?.effects?.status?.status;
  return { digest, success: status === 'success', error: status !== 'success' ? `Transaction failed: ${status}` : undefined };
}

// === Public API: Send SUI ===

export async function sendSui(
  recipient: string,
  amountSui: number,
  senderAddress: string,
): Promise<{ digest: string; success: boolean; error?: string }> {
  try {
    const session = await loadSession();
    const txBytes = await buildTransferTx(senderAddress, recipient, amountSui);

    // Sign based on auth method
    const signature = session?.authMethod === 'zklogin'
      ? await signWithZkLogin(txBytes)
      : await signWithWallet(txBytes);

    // Submit
    return await submitTransaction(txBytes, signature);
  } catch (err) {
    console.warn('sendSui error:', err);
    return { digest: '', success: false, error: err instanceof Error ? err.message : 'Failed to send SUI' };
  }
}

// === Transaction History ===

export interface TxRecord {
  digest: string;
  status: string;
  gasFee: string;
  sender: string;
  timestamp: string;
  txType: string;
}

export async function getTransactionHistory(address: string, limit = 10): Promise<TxRecord[]> {
  try {
    const { SuiGraphQLClient } = await import('@mysten/sui/graphql');
    const client = new SuiGraphQLClient({ url: GRAPHQL_URL, network: 'testnet' });
    const result = await client.query({
      query: `{ address(address: "${address}") { transactions(last: ${limit}) { nodes { digest sender { address } kind { __typename ... on ProgrammableTransaction { commands { edges { node { __typename ... on MoveCallCommand { function { name module { name } } } } } } } } effects { status timestamp gasEffects { gasSummary { computationCost storageCost } } } } } } }`,
    } as any);
    const nodes = (result.data as any)?.address?.transactions?.nodes ?? [];
    return nodes.map((n: any) => {
      const comp = Number(n.effects?.gasEffects?.gasSummary?.computationCost ?? 0);
      const stor = Number(n.effects?.gasEffects?.gasSummary?.storageCost ?? 0);
      const commands = n.kind?.commands?.edges?.map((e: any) => e.node) ?? [];
      return {
        digest: n.digest,
        status: n.effects?.status ?? 'UNKNOWN',
        gasFee: ((comp + stor) / 1_000_000_000).toFixed(6),
        sender: n.sender?.address ?? '',
        timestamp: n.effects?.timestamp ?? '',
        txType: classifyTx(commands, n.sender?.address, address),
      };
    }).reverse();
  } catch (err) {
    console.warn('getTransactionHistory error:', err);
    return [];
  }
}

function classifyTx(commands: any[], sender: string, myAddress: string): string {
  const types = commands.map((c: any) => c.__typename);
  const moveCall = commands.find((c: any) => c.__typename === 'MoveCallCommand');

  if (moveCall) {
    const fn = moveCall.function?.name ?? '';
    const mod = moveCall.function?.module?.name ?? '';

    // Walrus storage
    if (fn === 'certify_blob' || fn === 'certify_blob_v2') return 'Certify Blob';
    if (fn === 'reserve_space') return 'Walrus Storage';
    if (fn === 'extend_blob') return 'Extend Blob';

    // Luna capsule
    if (fn === 'create_capsule') return 'Create Capsule';
    if (fn === 'seal_approve') return 'Open Capsule';

    // Common
    if (mod === 'sui_system' || fn.includes('stake')) return 'Stake';
    if (fn.includes('swap') || fn.includes('exchange')) return 'Swap';
    if (fn.includes('mint')) return 'Mint';
    if (fn === 'transfer') return 'Send';

    return `${mod}::${fn}`;
  }

  if (types.includes('TransferObjectsCommand')) {
    return sender === myAddress ? 'Send' : 'Receive';
  }
  if (types.includes('MergeCoinsCommand')) return 'Merge Coins';
  if (types.includes('PublishCommand')) return 'Deploy';
  if (types.includes('UpgradeCommand')) return 'Upgrade';

  return sender === myAddress ? 'Send' : 'Receive';
}
