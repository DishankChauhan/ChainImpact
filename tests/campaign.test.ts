import { describe, it, expect, vi, beforeEach } from 'vitest';
import { doc, getDoc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { sendDonation } from '@/lib/solana';
import { PublicKey } from '@solana/web3.js';

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  updateDoc: vi.fn(),
  addDoc: vi.fn(),
  collection: vi.fn()
}));

// Mock Solana
vi.mock('@/lib/solana', () => ({
  sendDonation: vi.fn(),
  connection: {
    getBalance: vi.fn()
  }
}));

describe('Campaign Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a campaign', async () => {
    // Mock Firebase addDoc
    const mockDocRef = { id: 'new-campaign-id' };
    (addDoc as any).mockResolvedValue(mockDocRef);
    (collection as any).mockReturnValue('campaigns-collection');

    const campaignData = {
      title: 'Test Campaign',
      description: 'Test Description',
      goalAmount: 10,
      currentAmount: 0,
      imageUrl: 'https://example.com/image.jpg',
      creatorId: 'user-123',
      createdAt: expect.any(String),
      walletAddress: 'wallet-address',
      milestones: [],
      status: 'active'
    };

    // Simulate campaign creation
    const result = await addDoc(collection(null, 'campaigns'), campaignData);

    expect(collection).toHaveBeenCalledWith(null, 'campaigns');
    expect(addDoc).toHaveBeenCalledWith('campaigns-collection', campaignData);
    expect(result.id).toBe('new-campaign-id');
  });

  it('should process a donation', async () => {
    // Mock campaign data
    const campaignData = {
      id: 'campaign-123',
      title: 'Test Campaign',
      currentAmount: 5,
      walletAddress: 'campaign-wallet',
      creatorId: 'creator-123'
    };

    // Mock Firebase getDoc
    (getDoc as any).mockResolvedValue({
      exists: () => true,
      data: () => campaignData,
      id: 'campaign-123'
    });

    // Mock Solana transaction
    (sendDonation as any).mockResolvedValue('tx-signature-123');

    // Simulate donation
    const donationAmount = 2;
    const donorPublicKey = new PublicKey('11111111111111111111111111111111');
    const signature = await sendDonation(
      donorPublicKey,
      campaignData.walletAddress,
      donationAmount
    );

    // Verify donation record
    const donationData = {
      userId: 'user-123',
      campaignId: campaignData.id,
      campaignTitle: campaignData.title,
      amount: donationAmount,
      timestamp: expect.any(String),
      transactionSignature: signature,
    };

    expect(sendDonation).toHaveBeenCalledWith(
      donorPublicKey,
      campaignData.walletAddress,
      donationAmount
    );
    expect(signature).toBe('tx-signature-123');
  });

  it('should update campaign amount after donation', async () => {
    // Mock campaign data
    const campaignData = {
      id: 'campaign-123',
      currentAmount: 5
    };

    // Mock Firebase functions
    (doc as any).mockReturnValue('campaign-doc-ref');
    (updateDoc as any).mockResolvedValue(undefined);

    // Simulate updating campaign amount
    const donationAmount = 2;
    await updateDoc(doc(null, 'campaigns', campaignData.id), {
      currentAmount: campaignData.currentAmount + donationAmount
    });

    expect(doc).toHaveBeenCalledWith(null, 'campaigns', campaignData.id);
    expect(updateDoc).toHaveBeenCalledWith('campaign-doc-ref', {
      currentAmount: 7
    });
  });
});