# Marina Assistant

**AI-powered blockchain assistant on Sui Network**

Marina is a mobile AI assistant (React Native/Expo) that makes Sui blockchain accessible through natural conversation — voice or text. Instead of navigating complex wallet UIs, users simply talk to Marina.

## Problems Solved

- **Blockchain complexity** — Sending tokens, managing wallets, and interacting with smart contracts require technical knowledge. Marina handles it through conversation: "Send 0.5 SUI to Alice."

- **Data privacy on-chain** — Sensitive messages and files lack time-based access control. Marina's Time Capsules encrypt data with Seal (threshold encryption) and store on Walrus (decentralized storage), only decryptable after a chosen unlock time.

- **Quantum threat readiness** — Current encryption will be vulnerable to quantum computers. Marina offers optional post-quantum encryption (ML-KEM-768) with on-chain key registry, future-proofing encrypted data today.

- **Web3 onboarding friction** — Seed phrases scare new users. Marina supports zkLogin (Google sign-in → Sui wallet) — no seed phrase needed.

## Key Features

- 🤖 AI agent with function calling (send SUI, create capsules, check balance, manage contacts, ...)
- 🔐 Time Capsules: Seal encryption + Walrus storage + on-chain metadata
- 🛡️ Post-quantum encryption (ML-KEM-768) with on-chain key registry
- 🔑 Dual auth: seed phrase wallet + zkLogin (Google)
- 🎙️ Voice interface: speech-to-text + text-to-speech
- 📁 Decentralized file storage on Walrus
- 🎭 2D animated character companion

## Tech Stack

- **Frontend**: React Native (Expo SDK 55), TypeScript, Zustand
- **Blockchain**: Sui Network (Move smart contracts)
- **AI**: Amazon Bedrock (Claude Sonnet) with function calling
- **Encryption**: Mysten Seal (threshold encryption), ML-KEM-768 (post-quantum)
- **Storage**: Walrus (decentralized blob storage)
- **Auth**: zkLogin (Google OAuth + Enoki) + Ed25519 seed phrase wallet