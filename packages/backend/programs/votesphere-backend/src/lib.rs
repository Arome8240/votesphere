use anchor_lang::prelude::*;

declare_id!("3yvyZereyCJaYFDuGZ4J1PLrPMVdmCnirFWYT5VUXmXf");

#[program]
pub mod votesphere_backend {
    use super::*;

    /// Creates a new poll with specified question, options, and required SPL token.
    /// - `question`: The poll question (e.g., "Best programming language?").
    /// - `options`: List of voting options (e.g., ["Rust", "Python"]).
    /// - `required_token`: SPL token mint address required to vote.
    pub fn create_poll(
        ctx: Context<CreatePoll>,
        question: String,
        options: Vec<String>,
        required_token: Pubkey,
    ) -> Result<()> {
        let poll = &mut ctx.accounts.poll;
        // Set the poll creator as the authority
        poll.authority = *ctx.accounts.payer.key;
        // Store the required token mint address
        poll.required_token = required_token;
        // Store the poll question
        poll.question = question;
        // Store the voting options
        poll.options = options;
        // Initialize vote counts to zero for each option
        let num_options = poll.options.len() as usize;
        poll.vote_counts = vec![0u64; num_options];
        // Initialize empty voters list
        poll.voters = Vec::new();
        Ok(())
    }

    /// Allows a user to vote on a poll if they hold the required SPL token.
    /// - `option_index`: Index of the chosen option (e.g., 0 for first option).
    pub fn vote(ctx: Context<Vote>, option_index: u64) -> Result<()> {
        let poll = &mut ctx.accounts.poll;
        let voter_key = *ctx.accounts.voter.key;

        // Validate option index
        if option_index as usize >= poll.options.len() {
            return Err(error!(ErrorCode::InvalidOptionIndex));
        }

        // Check if voter has already voted
        if poll.voters.iter().any(|v| v == &voter_key) {
            return Err(error!(ErrorCode::AlreadyVoted));
        }

        // Increment vote count for the selected option
        poll.vote_counts[option_index as usize] += 1;
        // Add voter to the voters list to prevent double voting
        poll.voters.push(voter_key);

        Ok(())
    }
}

// Accounts for creating a poll
#[derive(Accounts)]
pub struct CreatePoll<'info> {
    /// New poll account to be initialized
    #[account(
        init,
        payer = payer,
        space = POLL_SIZE
    )]
    pub poll: Account<'info, Poll>,
    /// User creating the poll (pays for account creation)
    #[account(mut)]
    pub payer: Signer<'info>,
    /// System program for account creation
    pub system_program: Program<'info, System>,
}

// Accounts for voting
#[derive(Accounts)]
pub struct Vote<'info> {
    /// Poll account being voted on (mutable)
    #[account(mut)]
    pub poll: Account<'info, Poll>,
    /// User casting the vote (signer)
    pub voter: Signer<'info>,
    /// Voter's token account for the required SPL token
    #[account(
        mut,
        associated_token::mint = poll.required_token,
        associated_token::authority = voter,
        constraint = voter_token_account.amount > 0 @ ErrorCode::InsufficientTokens
    )]
    pub voter_token_account: Account<'info, TokenAccount>,
    /// SPL token program
    pub token_program: Program<'info, Token>,
    /// Associated token program
    pub associated_token_program: Program<'info, AssociatedToken>,
}

// Poll account structure
#[account]
pub struct Poll {
    /// Creator of the poll
    pub authority: Pubkey,
    /// Required SPL token mint address
    pub required_token: Pubkey,
    /// Poll question
    pub question: String,
    /// List of voting options
    pub options: Vec<String>,
    /// Vote counts for each option
    pub vote_counts: Vec<u64>,
    /// List of voters (to prevent double voting)
    pub voters: Vec<Pubkey>,
}

// Custom error codes
#[error_code]
pub enum ErrorCode {
    #[msg("Invalid option index")]
    InvalidOptionIndex,
    #[msg("Already voted")]
    AlreadyVoted,
    #[msg("Insufficient tokens to vote")]
    InsufficientTokens,
}

// Constants for maximum sizes
const MAX_QUESTION_LEN: usize = 256;
const MAX_OPTIONS: usize = 10;
const MAX_OPTION_LEN: usize = 256;
const MAX_VOTERS: usize = 1000;

// Calculate space for Poll account
const POLL_SIZE: usize = 8 // Discriminator
    + 32 // authority
    + 32 // required_token
    + 4 + MAX_QUESTION_LEN // question
    + 4 + MAX_OPTIONS * (4 + MAX_OPTION_LEN) // options
    + 4 + MAX_OPTIONS * 8 // vote_counts
    + 4 + MAX_VOTERS * 32; // voters
