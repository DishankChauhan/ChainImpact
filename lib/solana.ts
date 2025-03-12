import { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram, 
  LAMPORTS_PER_SOL, 
  Keypair,
  TransactionInstruction,
  sendAndConfirmTransaction,
  TransactionMessage,
  VersionedTransaction,
  Commitment
} from '@solana/web3.js';
import { toast } from '@/components/ui/use-toast';
import { ENDPOINT, PROGRAM_ID, MIN_DONATION_AMOUNT } from './constants';
import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';

export const connection = new Connection(ENDPOINT, 'confirmed');

// Updated confirmation options to use proper types
export const CONFIRMATION_OPTIONS = {
  commitment: 'confirmed' as Commitment,
  preflightCommitment: 'processed' as Commitment,
  skipPreflight: false
};

// Helper function to get program
export async function getProgram(wallet: any) {
  const provider = new anchor.AnchorProvider(
    connection,
    wallet,
    CONFIRMATION_OPTIONS
  );
  
  // Load the IDL from the deployed program
  const idl = await Program.fetchIdl(PROGRAM_ID, provider);
  if (!idl) throw new Error("IDL not found for program");
  
  return new Program(idl, PROGRAM_ID, provider);
}

// Create a new campaign
export async function createCampaign(
  wallet: any,
  title: string,
  description: string,
  imageUrl: string,
  goalAmount: number
): Promise<{ campaignAddress: PublicKey; signature: string }> {
  try {
    if (!wallet.publicKey) throw new Error("Wallet not connected");
    
    const program = await getProgram(wallet);
    
    // Generate a new keypair for the campaign account
    const campaignKeypair = anchor.web3.Keypair.generate();
    
    // Convert SOL to lamports
    const goalAmountLamports = goalAmount * LAMPORTS_PER_SOL;
    
    // Create the escrow account seed
    const [escrowPda] = await PublicKey.findProgramAddress(
      [Buffer.from("escrow"), campaignKeypair.publicKey.toBuffer()],
      PROGRAM_ID
    );
    
    // Call the program to create a campaign
    const signature = await program.methods
      .createCampaign(
        title,
        description,
        imageUrl,
        new anchor.BN(goalAmountLamports)
      )
      .accounts({
        campaign: campaignKeypair.publicKey,
        escrow: escrowPda,
        creator: wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([campaignKeypair])
      .rpc();
    
    // Wait for confirmation
    await connection.confirmTransaction(signature, 'confirmed');
    
    return {
      campaignAddress: campaignKeypair.publicKey,
      signature
    };
  } catch (error) {
    console.error('Error creating campaign:', error);
    throw error;
  }
}

// Add a milestone to a campaign
export async function createMilestone(
  campaignId: string,
  title: string,
  description: string,
  amount: number
): Promise<string> {
  try {
    // Check if window.solana exists (browser environment)
    if (typeof window !== 'undefined' && (window as any).solana) {
      const wallet = (window as any).solana;
      const program = await getProgram(wallet);
      
      // Get campaign public key
      const campaignPubkey = new PublicKey(campaignId);
      
      // Convert SOL to lamports
      const amountLamports = amount * LAMPORTS_PER_SOL;
      
      // Call the program to add a milestone
      const signature = await program.methods
        .addMilestone(
          title,
          description || '',
          new anchor.BN(amountLamports)
        )
        .accounts({
          campaign: campaignPubkey,
          creator: wallet.publicKey,
        })
        .rpc();
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');
      
      return signature;
    } else {
      // For testing/development, return a simulated signature
      return 'simulated_milestone_creation_' + Date.now().toString(36);
    }
  } catch (error) {
    console.error('Error creating milestone:', error);
    throw error;
  }
}

// Send a donation to a campaign
export async function sendDonation(
  fromPubkey: PublicKey,
  campaignAddress: string,
  amount: number
): Promise<string> {
  try {
    if (amount < MIN_DONATION_AMOUNT) {
      throw new Error(`Minimum donation amount is ${MIN_DONATION_AMOUNT} SOL`);
    }
    
    // Convert SOL to lamports
    const lamports = amount * LAMPORTS_PER_SOL;
    
    // Get campaign public key
    const campaignPubkey = new PublicKey(campaignAddress);
    
    // Find the escrow PDA
    const [escrowPda] = await PublicKey.findProgramAddress(
      [Buffer.from("escrow"), campaignPubkey.toBuffer()],
      PROGRAM_ID
    );
    
    // Check if window.solana exists (browser environment)
    if (typeof window !== 'undefined' && (window as any).solana) {
      const wallet = (window as any).solana;
      const program = await getProgram(wallet);
      
      // Call the program to donate
      const signature = await program.methods
        .donate(new anchor.BN(lamports))
        .accounts({
          campaign: campaignPubkey,
          escrow: escrowPda,
          donor: fromPubkey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');
      
      return signature;
    } else {
      throw new Error('Solana wallet not found');
    }
  } catch (error) {
    console.error('Error sending donation:', error);
    throw error;
  }
}

// Verify a milestone
export async function verifyMilestone(
  campaignAddress: string,
  milestoneIndex: number,
  proofUrl: string
): Promise<string> {
  try {
    // Check if window.solana exists (browser environment)
    if (typeof window !== 'undefined' && (window as any).solana) {
      const wallet = (window as any).solana;
      const program = await getProgram(wallet);
      
      // Get campaign public key
      const campaignPubkey = new PublicKey(campaignAddress);
      
      // Call the program to verify milestone
      const signature = await program.methods
        .verifyMilestone(
          milestoneIndex,
          proofUrl
        )
        .accounts({
          campaign: campaignPubkey,
          verifier: wallet.publicKey,
        })
        .rpc();
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');
      
      return signature;
    } else {
      // For testing/development, return a simulated signature
      return 'simulated_verification_signature_' + Date.now().toString(36);
    }
  } catch (error) {
    console.error('Error verifying milestone:', error);
    throw error;
  }
}

// Release funds for a verified milestone
export async function releaseFunds(
  wallet: any,
  campaignAddress: string,
  milestoneIndex: number
): Promise<string> {
  try {
    if (!wallet.publicKey) throw new Error("Wallet not connected");
    
    const program = await getProgram(wallet);
    const campaignPubkey = new PublicKey(campaignAddress);
    
    // Find the escrow PDA
    const [escrowPda] = await PublicKey.findProgramAddress(
      [Buffer.from("escrow"), campaignPubkey.toBuffer()],
      PROGRAM_ID
    );
    
    // Call the program to release funds
    const signature = await program.methods
      .releaseFunds(milestoneIndex)
      .accounts({
        campaign: campaignPubkey,
        escrow: escrowPda,
        creator: wallet.publicKey,
      })
      .rpc();
    
    // Wait for confirmation
    await connection.confirmTransaction(signature, 'confirmed');
    
    return signature;
  } catch (error) {
    console.error('Error releasing funds:', error);
    throw error;
  }
}

// Request a refund for a failed milestone
export async function requestRefund(
  wallet: any,
  campaignAddress: string,
  amount: number
): Promise<string> {
  try {
    if (!wallet.publicKey) throw new Error("Wallet not connected");
    
    const program = await getProgram(wallet);
    const campaignPubkey = new PublicKey(campaignAddress);
    
    // Convert SOL to lamports
    const lamports = amount * LAMPORTS_PER_SOL;
    
    // Find the escrow PDA
    const [escrowPda] = await PublicKey.findProgramAddress(
      [Buffer.from("escrow"), campaignPubkey.toBuffer()],
      PROGRAM_ID
    );
    
    // Call the program to request refund
    const signature = await program.methods
      .refund(new anchor.BN(lamports))
      .accounts({
        campaign: campaignPubkey,
        escrow: escrowPda,
        donor: wallet.publicKey,
      })
      .rpc();
    
    // Wait for confirmation
    await connection.confirmTransaction(signature, 'confirmed');
    
    return signature;
  } catch (error) {
    console.error('Error requesting refund:', error);
    throw error;
  }
}

// Get wallet balance
export async function getWalletBalance(publicKey: PublicKey): Promise<number> {
  try {
    const balance = await connection.getBalance(publicKey);
    return balance / LAMPORTS_PER_SOL;
  } catch (error) {
    console.error('Error getting wallet balance:', error);
    throw error;
  }
}

// Request an airdrop of SOL (for devnet testing)
export async function requestAirdrop(publicKey: PublicKey): Promise<string> {
  try {
    const signature = await connection.requestAirdrop(
      publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(signature);
    return signature;
  } catch (error) {
    console.error('Error requesting airdrop:', error);
    throw error;
  }
}

// Get campaign data from the blockchain
export async function getCampaignData(campaignAddress: string): Promise<any> {
  try {
    const program = await getProgram({
      publicKey: null,
      signTransaction: async (tx: any) => tx,
      signAllTransactions: async (txs: any) => txs,
    });
    
    const campaignPubkey = new PublicKey(campaignAddress);
    const campaignAccount = await program.account.campaign.fetch(campaignPubkey);
    
    return campaignAccount;
  } catch (error) {
    console.error('Error fetching campaign data:', error);
    throw error;
  }
}