use anchor_lang::prelude::*;

use solana_program::system_instruction::transfer;
use anchor_lang::system_program::Transfer;
use anchor_lang::system_program::ID;

declare_id!("YOUR_ACTUAL_PROGRAM_ID_HERE");

#[program]
pub mod chain_impact {
    use super::*;

    pub fn create_campaign(
        ctx: Context<CreateCampaign>,
        title: String,
        description: String,
        image_url: String,
        amount_goal: u64,
    ) -> Result<()> {
        let campaign = &mut ctx.accounts.campaign;
        campaign.creator = ctx.accounts.creator.key();
        campaign.title = title;
        campaign.description = description;
        campaign.image_url = image_url;
        campaign.amount_goal = amount_goal;
        campaign.amount_donated = 0;
        campaign.is_completed = false;
        campaign.escrow_account = ctx.accounts.escrow.key();
        
        // Initialize milestone vector
        campaign.milestones = Vec::new();
        
        // Emit event
        emit!(CampaignCreatedEvent {
            campaign: campaign.key(),
            creator: campaign.creator,
            title: campaign.title.clone(),
            amount_goal,
        });
        
        Ok(())
    }

    pub fn add_milestone(
        ctx: Context<AddMilestone>,
        title: String,
        description: String,
        amount: u64,
    ) -> Result<()> {
        let campaign = &mut ctx.accounts.campaign;
        
        // Ensure only the creator can add milestones
        require!(
            campaign.creator == ctx.accounts.creator.key(),
            ErrorCode::Unauthorized
        );
        
        // Create new milestone
        let milestone = Milestone {
            title,
            description,
            amount,
            completed: false,
            verification_proof: String::new(),
        };
        
        // Add to campaign
        campaign.milestones.push(milestone.clone());
        
        // Emit event
        emit!(MilestoneAddedEvent {
            campaign: campaign.key(),
            milestone_index: campaign.milestones.len() as u8 - 1,
            title: milestone.title.clone(),
            amount,
        });
        
        Ok(())
    }

    pub fn donate(ctx: Context<Donate>, amount: u64) -> Result<()> {
        let campaign = &mut ctx.accounts.campaign;
        let donor = &ctx.accounts.donor;
        let escrow = &ctx.accounts.escrow;
        
        // Transfer SOL from donor to escrow account
        transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                Transfer {
                    from: donor.to_account_info(),
                    to: escrow.to_account_info(),
                },
            ),
            amount,
        )?;

        campaign.amount_donated = campaign.amount_donated.checked_add(amount)
            .ok_or(ErrorCode::AmountOverflow)?;

        // Emit event
        emit!(DonationEvent {
            campaign: campaign.key(),
            donor: donor.key(),
            amount,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    pub fn verify_milestone(
        ctx: Context<VerifyMilestone>,
        milestone_index: u8,
        proof: String,
    ) -> Result<()> {
        let campaign = &mut ctx.accounts.campaign;
        
        // Check if milestone index is valid
        require!(
            milestone_index < campaign.milestones.len() as u8,
            ErrorCode::InvalidMilestoneIndex
        );

        // Get milestone
        let milestone = &mut campaign.milestones[milestone_index as usize];
        
        // Update milestone
        milestone.verification_proof = proof;
        milestone.completed = true;

        // Emit event
        emit!(MilestoneVerifiedEvent {
            campaign: campaign.key(),
            milestone_index,
            verifier: ctx.accounts.verifier.key(),
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    pub fn release_funds(
        ctx: Context<ReleaseFunds>,
        milestone_index: u8,
    ) -> Result<()> {
        let campaign = &mut ctx.accounts.campaign;
        let escrow = &ctx.accounts.escrow;
        
        // Check if milestone index is valid
        require!(
            milestone_index < campaign.milestones.len() as u8,
            ErrorCode::InvalidMilestoneIndex
        );

        // Get milestone
        let milestone = &campaign.milestones[milestone_index as usize];
        
        // Ensure milestone is completed
        require!(milestone.completed, ErrorCode::MilestoneNotCompleted);
        
        // Calculate amount to release
        let release_amount = milestone.amount;
        
        // Ensure escrow has enough funds
        require!(
            escrow.to_account_info().lamports() >= release_amount,
            ErrorCode::InsufficientFunds
        );

        // Transfer funds from escrow to creator
        **escrow.to_account_info().try_borrow_mut_lamports()? = escrow
            .to_account_info()
            .lamports()
            .checked_sub(release_amount)
            .ok_or(ErrorCode::InsufficientFunds)?;
        
        **ctx.accounts.creator.try_borrow_mut_lamports()? = ctx
            .accounts.creator
            .lamports()
            .checked_add(release_amount)
            .ok_or(ErrorCode::AmountOverflow)?;

        // Emit event
        emit!(FundsReleasedEvent {
            campaign: campaign.key(),
            milestone_index,
            amount: release_amount,
            recipient: ctx.accounts.creator.key(),
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    pub fn refund(ctx: Context<Refund>, amount: u64) -> Result<()> {
        let campaign = &mut ctx.accounts.campaign;
        let escrow = &ctx.accounts.escrow;
        let donor = &ctx.accounts.donor;
        
        // Verify refund conditions (e.g., milestone failed or campaign expired)
        // This would typically involve checking timestamps and milestone status
        
        // Ensure escrow has enough funds
        require!(
            escrow.to_account_info().lamports() >= amount,
            ErrorCode::InsufficientFunds
        );
        
        // Transfer funds from escrow to donor
        **escrow.to_account_info().try_borrow_mut_lamports()? = escrow
            .to_account_info()
            .lamports()
            .checked_sub(amount)
            .ok_or(ErrorCode::InsufficientFunds)?;
        
        **donor.try_borrow_mut_lamports()? = donor
            .lamports()
            .checked_add(amount)
            .ok_or(ErrorCode::AmountOverflow)?;
            
        // Update campaign amount
        campaign.amount_donated = campaign.amount_donated.checked_sub(amount)
            .ok_or(ErrorCode::AmountOverflow)?;

        // Emit event
        emit!(RefundEvent {
            campaign: campaign.key(),
            donor: donor.key(),
            amount,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateCampaign<'info> {
    #[account(init, payer = creator, space = Campaign::LEN)]
    pub campaign: Account<'info, Campaign>,
    
    #[account(init, payer = creator, space = 8 + 32, seeds = [b"escrow", campaign.key().as_ref()], bump)]
    pub escrow: Account<'info, Escrow>,
    
    #[account(mut)]
    pub creator: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AddMilestone<'info> {
    #[account(mut)]
    pub campaign: Account<'info, Campaign>,
    
    pub creator: Signer<'info>,
}

#[derive(Accounts)]
pub struct Donate<'info> {
    #[account(mut)]
    pub campaign: Account<'info, Campaign>,
    
    #[account(mut, seeds = [b"escrow", campaign.key().as_ref()], bump)]
    pub escrow: Account<'info, Escrow>,
    
    #[account(mut)]
    pub donor: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct VerifyMilestone<'info> {
    #[account(mut)]
    pub campaign: Account<'info, Campaign>,
    
    pub verifier: Signer<'info>,
}

#[derive(Accounts)]
pub struct ReleaseFunds<'info> {
    #[account(mut)]
    pub campaign: Account<'info, Campaign>,
    
    #[account(mut, seeds = [b"escrow", campaign.key().as_ref()], bump)]
    pub escrow: Account<'info, Escrow>,
    
    #[account(mut)]
    pub creator: Signer<'info>,
}

#[derive(Accounts)]
pub struct Refund<'info> {
    #[account(mut)]
    pub campaign: Account<'info, Campaign>,
    
    #[account(mut, seeds = [b"escrow", campaign.key().as_ref()], bump)]
    pub escrow: Account<'info, Escrow>,
    
    #[account(mut)]
    pub donor: Signer<'info>,
}

#[account]
pub struct Campaign {
    pub creator: Pubkey,
    pub title: String,
    pub description: String,
    pub image_url: String,
    pub amount_goal: u64,
    pub amount_donated: u64,
    pub milestones: Vec<Milestone>,
    pub is_completed: bool,
    pub escrow_account: Pubkey,
}

#[account]
pub struct Escrow {
    pub campaign: Pubkey,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct Milestone {
    pub title: String,
    pub description: String,
    pub amount: u64,
    pub completed: bool,
    pub verification_proof: String,
}

impl Campaign {
    pub const LEN: usize = 8 + // discriminator
        32 + // creator
        64 + // title
        256 + // description
        128 + // image_url
        8 + // amount_goal
        8 + // amount_donated
        32 + // milestones vec
        1 + // is_completed
        32; // escrow_account
}

// Events
#[event]
pub struct CampaignCreatedEvent {
    pub campaign: Pubkey,
    pub creator: Pubkey,
    pub title: String,
    pub amount_goal: u64,
}

#[event]
pub struct MilestoneAddedEvent {
    pub campaign: Pubkey,
    pub milestone_index: u8,
    pub title: String,
    pub amount: u64,
}

#[event]
pub struct DonationEvent {
    pub campaign: Pubkey,
    pub donor: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct MilestoneVerifiedEvent {
    pub campaign: Pubkey,
    pub milestone_index: u8,
    pub verifier: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct FundsReleasedEvent {
    pub campaign: Pubkey,
    pub milestone_index: u8,
    pub amount: u64,
    pub recipient: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct RefundEvent {
    pub campaign: Pubkey,
    pub donor: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Amount overflow")]
    AmountOverflow,
    #[msg("Invalid milestone index")]
    InvalidMilestoneIndex,
    #[msg("Milestone not completed")]
    MilestoneNotCompleted,
    #[msg("Insufficient funds")]
    InsufficientFunds,
    #[msg("Unauthorized action")]
    Unauthorized,
}