import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PublicKey } from '@solana/web3.js';
import { sendDonation, getWalletBalance, requestAirdrop } from '@/lib/solana';

// Mock the @solana/web3.js module
vi.mock('@solana/web3.js', () => {
  const mockConnection = {
    getLatestBlockhash: vi.fn().mockResolvedValue({ blockhash: 'mock-blockhash' }),
    sendRawTransaction: vi.fn().mockResolvedValue('mock-signature'),
    confirmTransaction: vi.fn().mockResolvedValue(true),
    getBalance: vi.fn().mockResolvedValue(5000000000), // 5 SOL in lamports
    requestAirdrop: vi.fn().mockResolvedValue('mock-airdrop-signature'),
  };

  return {
    Connection: vi.fn(() => mockConnection),
    PublicKey: vi.fn((key) => ({ toString: () => key })),
    Transaction: vi.fn(() => ({
      add: vi.fn().mockReturnThis(),
      recentBlockhash: null,
      feePayer: null,
      serialize: vi.fn().mockReturnValue(new Uint8Array()),
    })),
    SystemProgram: {
      transfer: vi.fn().mockReturnValue({}),
    },
    LAMPORTS_PER_SOL: 1000000000,
  };
});

// Mock window.solana
beforeEach(() => {
  global.window = {
    solana: {
      signTransaction: vi.fn().mockResolvedValue({
        serialize: vi.fn().mockReturnValue(new Uint8Array()),
      }),
    },
  } as any;
});

describe('Solana Utility Functions', () => {
  it('should send a donation', async () => {
    const fromPubkey = new PublicKey('sender123');
    const campaignPubkey = 'receiver456';
    const amount = 1.5;

    const signature = await sendDonation(fromPubkey, campaignPubkey, amount);
    
    expect(signature).toBe('mock-signature');
  });

  it('should get wallet balance', async () => {
    const publicKey = new PublicKey('wallet123');
    
    const balance = await getWalletBalance(publicKey);
    
    expect(balance).toBe(5); // 5 SOL
  });

  it('should request an airdrop', async () => {
    const publicKey = new PublicKey('wallet123');
    
    const signature = await requestAirdrop(publicKey);
    
    expect(signature).toBe('mock-airdrop-signature');
  });
});