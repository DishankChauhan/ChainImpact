import { PublicKey } from '@solana/web3.js';

// Program ID will be updated after deployment
export const PROGRAM_ID = new PublicKey("11111111111111111111111111111111");

// Network configuration
export const NETWORK = "devnet";
export const ENDPOINT = "https://api.devnet.solana.com";

// Oracle configuration
export const ORACLE_API_ENDPOINT = "https://api.chainimpact-oracle.com";
export const ORACLE_API_KEY = process.env.NEXT_PUBLIC_ORACLE_API_KEY || "";

// Timeouts and limits
export const VERIFICATION_TIMEOUT_DAYS = 14; // Days before a milestone verification times out
export const MAX_MILESTONES_PER_CAMPAIGN = 10;
export const MIN_DONATION_AMOUNT = 0.01; // SOL
export const MAX_CAMPAIGN_DURATION_DAYS = 180; // 6 months

// Error messages
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: "Please connect your wallet to continue",
  INSUFFICIENT_FUNDS: "Insufficient funds in your wallet",
  TRANSACTION_FAILED: "Transaction failed. Please try again",
  MILESTONE_VERIFICATION_FAILED: "Failed to verify milestone",
  CAMPAIGN_NOT_FOUND: "Campaign not found",
  UNAUTHORIZED: "You are not authorized to perform this action",
  INVALID_AMOUNT: `Minimum donation amount is ${MIN_DONATION_AMOUNT} SOL`,
  MILESTONE_LIMIT_REACHED: `Maximum ${MAX_MILESTONES_PER_CAMPAIGN} milestones allowed per campaign`,
  CAMPAIGN_DURATION_EXCEEDED: `Campaign duration cannot exceed ${MAX_CAMPAIGN_DURATION_DAYS} days`,
};

// Transaction confirmation settings
export const CONFIRMATION_OPTIONS = {
  commitment: 'confirmed',
  preflightCommitment: 'processed',
  skipPreflight: false,
};