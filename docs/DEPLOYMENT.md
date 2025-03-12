# ChainImpact Deployment Guide

This guide explains how to deploy the ChainImpact application to Solana devnet and host the frontend.

## Prerequisites

- Node.js 16+ and npm
- Solana CLI tools
- Phantom wallet or another Solana wallet
- Firebase account

## Deploying the Smart Contract

1. **Install Solana CLI tools**

   Follow the [official guide](https://docs.solana.com/cli/install-solana-cli-tools) to install Solana CLI tools.

2. **Generate a new keypair**

   ```bash
   solana-keygen new -o program-keypair.json
   ```

3. **Fund your keypair with devnet SOL**

   ```bash
   solana airdrop 2 $(solana-keygen pubkey program-keypair.json) --url devnet
   ```

4. **Build the program**

   ```bash
   cd program
   cargo build-bpf
   ```

5. **Deploy to devnet**

   ```bash
   solana program deploy --program-id program-keypair.json ./target/deploy/chain_impact.so --url devnet
   ```

6. **Update program ID**

   Copy the program ID from the deployment output and update it in:
   - `lib/constants.ts`
   - `program/src/lib.rs`

## Setting up Firebase

1. Create a new Firebase project
2. Enable Authentication (Email/Password)
3. Create a Firestore database
4. Set up the security rules for Firestore
5. Create a web app in the Firebase project
6. Copy the Firebase configuration to your `.env` file

## Deploying the Frontend

1. **Build the Next.js application**

   ```bash
   npm run build
   ```

2. **Deploy to your preferred hosting provider**

   For example, using Vercel:

   ```bash
   npx vercel
   ```

## Testing the Deployment

1. Visit your deployed frontend
2. Connect your Solana wallet (set to devnet)
3. Create an account and log in
4. Create a campaign
5. Test donations and milestone verification

## Troubleshooting

- If transactions fail, ensure your wallet has enough SOL on devnet
- Check browser console for any errors
- Verify that your program ID is correctly set in the application
- Ensure Firebase security rules allow the necessary operations