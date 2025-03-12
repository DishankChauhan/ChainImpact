# ChainImpact Testing Guide

This document outlines the testing procedures for the ChainImpact platform.

## Unit Tests

Run the unit tests with:

```bash
npm run test
```

## Manual Testing Checklist

### Authentication

- [ ] User can register with email and password
- [ ] User can log in with existing credentials
- [ ] User can log out
- [ ] Protected routes redirect to login page

### Wallet Integration

- [ ] User can connect Phantom wallet
- [ ] Wallet address is displayed correctly
- [ ] User can disconnect wallet
- [ ] User can request devnet SOL airdrop

### Campaign Management

- [ ] User can create a new campaign
- [ ] Campaign details are displayed correctly
- [ ] Campaign creator can add milestones
- [ ] Campaign creator can verify milestones

### Donations

- [ ] User can donate SOL to a campaign
- [ ] Donation amount is added to campaign total
- [ ] Donation is recorded in user's history
- [ ] Transaction is visible on Solana explorer

### Notifications

- [ ] User receives notification for new donations
- [ ] User receives notification for milestone verification
- [ ] Notifications can be marked as read

## Testing on Devnet

1. Ensure your wallet is connected to Solana devnet
2. Request an airdrop of SOL if needed
3. Create a test campaign
4. Make a test donation
5. Verify the transaction appears on [Solana Explorer](https://explorer.solana.com/?cluster=devnet)

## Common Issues

- **Wallet Connection**: If the wallet doesn't connect, ensure Phantom is installed and set to devnet
- **Failed Transactions**: Check that you have enough SOL in your wallet
- **Missing Campaigns**: Verify Firebase permissions and database rules
- **Milestone Verification**: Ensure you're the campaign creator

## Reporting Bugs

When reporting bugs, please include:

1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Browser and wallet information
5. Any error messages from the console