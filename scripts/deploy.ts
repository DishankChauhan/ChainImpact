import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import fs from 'fs';
import path from 'path';

// Load keypair from file or create a new one
async function loadOrCreateKeypair(filePath: string): Promise<Keypair> {
  try {
    if (fs.existsSync(filePath)) {
      const keypairData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      return Keypair.fromSecretKey(new Uint8Array(keypairData));
    } else {
      // Create a new keypair
      const keypair = Keypair.generate();
      
      // Save to file
      fs.writeFileSync(
        filePath, 
        JSON.stringify(Array.from(keypair.secretKey)),
        { encoding: 'utf-8' }
      );
      
      return keypair;
    }
  } catch (error) {
    console.error('Error loading or creating keypair:', error);
    throw error;
  }
}

// Update constants file with program ID
function updateConstantsFile(programId: string): void {
  const constantsPath = path.join(__dirname, '../lib/constants.ts');
  
  try {
    let content = fs.readFileSync(constantsPath, 'utf-8');
    
    // Replace program ID
    content = content.replace(
      /export const PROGRAM_ID = new PublicKey\(".*?"\);/,
      `export const PROGRAM_ID = new PublicKey("${programId}");`
    );
    
    fs.writeFileSync(constantsPath, content, 'utf-8');
    console.log(`Updated program ID in constants file to: ${programId}`);
  } catch (error) {
    console.error('Error updating constants file:', error);
  }
}

// Update lib.rs file with program ID
function updateLibRsFile(programId: string): void {
  const libRsPath = path.join(__dirname, '../program/src/lib.rs');
  
  try {
    let content = fs.readFileSync(libRsPath, 'utf-8');
    
    // Replace declare_id!
    content = content.replace(
      /declare_id!\(".*?"\);/,
      `declare_id!("${programId}");`
    );
    
    fs.writeFileSync(libRsPath, content, 'utf-8');
    console.log(`Updated program ID in lib.rs file to: ${programId}`);
  } catch (error) {
    console.error('Error updating lib.rs file:', error);
  }
}

async function main() {
  // Configure the client
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  
  // Load or create program keypair
  const programKeypairPath = path.join(__dirname, '../program-keypair.json');
  const programKeypair = await loadOrCreateKeypair(programKeypairPath);
  
  console.log("Program ID:", programKeypair.publicKey.toString());
  
  // Update program ID in constants and lib.rs
  updateConstantsFile(programKeypair.publicKey.toString());
  updateLibRsFile(programKeypair.publicKey.toString());
  
  // Check if the program account has enough SOL
  const balance = await connection.getBalance(programKeypair.publicKey);
  console.log(`Program account balance: ${balance / LAMPORTS_PER_SOL} SOL`);
  
  if (balance < 0.5 * LAMPORTS_PER_SOL) {
    console.log("Requesting airdrop for program account...");
    const signature = await connection.requestAirdrop(
      programKeypair.publicKey,
      1 * LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(signature);
    console.log("Airdrop successful!");
  }
  
  console.log("\nDeployment Instructions:");
  console.log("1. Build the program:");
  console.log("   cd program && cargo build-bpf");
  console.log("\n2. Deploy the program:");
  console.log(`   solana program deploy --program-id ${programKeypairPath} ./target/deploy/chain_impact.so --url devnet`);
  
  console.log("\nAfter deployment, test the program by creating a campaign:");
  console.log("   npm run test:campaign");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});