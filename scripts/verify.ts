import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import fs from 'fs';
import path from 'path';
import { PROGRAM_ID } from "../lib/constants";

async function main() {
  try {
    // Configure the connection
    const connection = new Connection("https://api.devnet.solana.com", "confirmed");
    
    // Create a provider with a dummy wallet (for read-only operations)
    const provider = new anchor.AnchorProvider(
      connection,
      {
        publicKey: PublicKey.default,
        signTransaction: async (tx) => tx,
        signAllTransactions: async (txs) => txs,
      },
      { commitment: 'confirmed' }
    );
    
    console.log("Verifying program deployment...");
    console.log("Program ID:", PROGRAM_ID.toString());
    
    // Check if the program exists
    const programInfo = await connection.getAccountInfo(PROGRAM_ID);
    
    if (!programInfo) {
      console.error("❌ Program not found on devnet. Please deploy the program first.");
      process.exit(1);
    }
    
    console.log("✅ Program found on devnet!");
    console.log(`Program size: ${programInfo.data.length} bytes`);
    
    // Try to fetch the program's IDL
    try {
      const idl = await Program.fetchIdl(PROGRAM_ID, provider);
      if (idl) {
        console.log("✅ Successfully fetched program IDL!");
        console.log("Program instructions:");
        idl.instructions.forEach((ix, i) => {
          console.log(`  ${i+1}. ${ix.name}`);
        });
      } else {
        console.warn("⚠️ Could not fetch program IDL. This may be normal for newly deployed programs.");
      }
    } catch (error) {
      console.warn("⚠️ Error fetching program IDL:", error);
    }
    
    // Check program balance
    const balance = await connection.getBalance(PROGRAM_ID);
    console.log(`Program account balance: ${balance / LAMPORTS_PER_SOL} SOL`);
    
    console.log("\nVerification complete!");
    console.log("Your ChainImpact smart contract is deployed and ready to use.");
    
  } catch (error) {
    console.error("Error verifying program:", error);
    process.exit(1);
  }
}

main();