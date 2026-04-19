import express from 'express';
import cors from 'cors';
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { walrus } from '@mysten/walrus';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';

const app = express();
app.use(cors());
app.use(express.raw({ type: 'application/octet-stream', limit: '10mb' }));

const client = new SuiGrpcClient({
  network: 'testnet',
  baseUrl: 'https://fullnode.testnet.sui.io:443',
}).$extend(
  walrus({
    uploadRelay: {
      host: 'https://upload-relay.testnet.walrus.space',
      sendTip: { max: 1000 },
    },
  }),
);

const SERVICE_MNEMONIC = process.env.SERVICE_MNEMONIC;
if (!SERVICE_MNEMONIC) { console.error('SERVICE_MNEMONIC env required'); process.exit(1); }
const serviceKp = Ed25519Keypair.deriveKeypair(SERVICE_MNEMONIC);
const serviceAddr = serviceKp.getPublicKey().toSuiAddress();
console.log('Service address:', serviceAddr);

// POST /write - write blob + transfer to owner
// Body: raw bytes
// Query: ?epochs=3&owner=0x...
app.post('/write', async (req, res) => {
  try {
    const data = new Uint8Array(req.body);
    if (!data.length) return res.status(400).json({ error: 'No data' });

    const epochs = parseInt(req.query.epochs) || 3;
    const owner = req.query.owner;

    const r = await client.walrus.writeBlob({ blob: data, epochs, deletable: true, signer: serviceKp });

    let transferred = false;
    if (owner && owner !== serviceAddr) {
      const tx = new Transaction();
      tx.setSender(serviceAddr);
      tx.transferObjects([tx.object(r.blobObject.id)], owner);
      const txBytes = await tx.build({ client });
      const { signature } = await serviceKp.signTransaction(txBytes);
      await client.core.executeTransaction({ transaction: txBytes, signatures: [signature] });
      transferred = true;
    }

    res.json({ blobId: r.blobId, blobObjectId: r.blobObject?.id, endEpoch: r.blobObject?.storage?.endEpoch, transferred });
  } catch (err) {
    console.error('Write error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /read/:blobId
app.get('/read/:blobId', async (req, res) => {
  try {
    const data = await client.walrus.readBlob({ blobId: req.params.blobId });
    res.set('Content-Type', 'application/octet-stream');
    res.send(Buffer.from(data));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (_, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Walrus service on :${PORT}`));
