import { Program, web3, BN } from '@project-serum/anchor';
import { PROGRAM_ID, ENDPOINT } from './constants';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';

export class ProgramUtils {
  private static connection = new Connection(ENDPOINT);
  private static program: Program;

  static async createCampaign(
    title: string,
    description: string,
    imageUrl: string,
    goalAmount: number,
    creator: PublicKey
  ) {
    try {
      const campaign = web3.Keypair.generate();
      
      const tx = await this.program.methods
        .createCampaign(title, description, imageUrl, new BN(goalAmount))
        .accounts({
          campaign: campaign.publicKey,
          creator,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([campaign])
        .rpc();

      return { campaignAddress: campaign.publicKey, tx };
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }
  }

  static async verifyMilestone(
    campaignAddress: PublicKey,
    milestoneIndex: number,
    proof: string,
    verifier: PublicKey
  ) {
    try {
      const tx = await this.program.methods
        .verifyMilestone(milestoneIndex, proof)
        .accounts({
          campaign: campaignAddress,
          verifier,
        })
        .rpc();

      return tx;
    } catch (error) {
      console.error('Error verifying milestone:', error);
      throw error;
    }
  }

  static async donate(
    campaignAddress: PublicKey,
    amount: number,
    donor: PublicKey
  ) {
    try {
      const tx = await this.program.methods
        .donate(new BN(amount))
        .accounts({
          campaign: campaignAddress,
          donor,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      return tx;
    } catch (error) {
      console.error('Error processing donation:', error);
      throw error;
    }
  }
}