import {
  Program,
  web3,
  BN,
  AnchorProvider,
} from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';

export interface CampaignAccount {
  creator: PublicKey;
  title: string;
  description: string;
  imageUrl: string;
  amountGoal: BN;
  amountDonated: BN;
  milestones: MilestoneData[];
  isCompleted: boolean;
}

export interface MilestoneData {
  title: string;
  description: string;
  amount: BN;
  completed: boolean;
  verificationProof: string;
}

export class CampaignProgram {
  constructor(
    private program: Program,
    private provider: AnchorProvider
  ) {}

  async createCampaign(
    title: string,
    description: string,
    imageUrl: string,
    amountGoal: number,
    milestones: { title: string; description: string; amount: number }[]
  ) {
    const campaign = web3.Keypair.generate();
    
    try {
      const tx = await this.program.methods
        .createCampaign(title, description, imageUrl, new BN(amountGoal))
        .accounts({
          campaign: campaign.publicKey,
          creator: this.provider.wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([campaign])
        .rpc();

      // Add milestones
      for (const milestone of milestones) {
        await this.addMilestone(
          campaign.publicKey,
          milestone.title,
          milestone.description,
          milestone.amount
        );
      }

      return { campaignAddress: campaign.publicKey, tx };
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw new Error('Failed to create campaign');
    }
  }

  async donate(campaignAddress: PublicKey, amount: number) {
    try {
      const tx = await this.program.methods
        .donate(new BN(amount))
        .accounts({
          campaign: campaignAddress,
          donor: this.provider.wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      return tx;
    } catch (error) {
      console.error('Error donating:', error);
      throw new Error('Failed to process donation');
    }
  }

  async verifyMilestone(
    campaignAddress: PublicKey,
    milestoneIndex: number,
    proof: string
  ) {
    try {
      const tx = await this.program.methods
        .verifyMilestone(milestoneIndex, proof)
        .accounts({
          campaign: campaignAddress,
          verifier: this.provider.wallet.publicKey,
        })
        .rpc();

      return tx;
    } catch (error) {
      console.error('Error verifying milestone:', error);
      throw new Error('Failed to verify milestone');
    }
  }

  async releaseFunds(campaignAddress: PublicKey, milestoneIndex: number) {
    try {
      const tx = await this.program.methods
        .releaseFunds(milestoneIndex)
        .accounts({
          campaign: campaignAddress,
          creator: this.provider.wallet.publicKey,
        })
        .rpc();

      return tx;
    } catch (error) {
      console.error('Error releasing funds:', error);
      throw new Error('Failed to release funds');
    }
  }

  async addMilestone(
    campaignAddress: PublicKey,
    title: string,
    description: string,
    amount: number
  ) {
    // Implementation for adding a milestone
    const tx = await this.program.methods
      .addMilestone(title, description, new BN(amount))
      .accounts({
        campaign: campaignAddress,
        creator: this.provider.wallet.publicKey,
      })
      .rpc();

    return tx;
  }
}