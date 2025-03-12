import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OracleService } from '@/lib/oracle';
import { PublicKey } from '@solana/web3.js';

// Mock Firebase
vi.mock('firebase/firestore', () => {
  return {
    doc: vi.fn(),
    getDoc: vi.fn().mockResolvedValue({
      exists: () => true,
      data: () => ({
        milestones: [
          {
            title: 'Test Milestone',
            amount: 1,
            completed: false,
            verificationStatus: 'pending'
          }
        ],
        creatorId: 'test-creator-id'
      })
    }),
    updateDoc: vi.fn().mockResolvedValue(undefined),
    addDoc: vi.fn().mockResolvedValue({ id: 'notification-id' }),
    collection: vi.fn().mockReturnValue('notifications-collection')
  };
});

// Mock axios
vi.mock('axios', () => ({
  default: {
    post: vi.fn().mockImplementation((url) => {
      if (url.includes('/verify')) {
        return Promise.resolve({
          data: {
            verified: true,
            txSignature: 'mock-tx-signature'
          }
        });
      }
      if (url.includes('/verifiers/register')) {
        return Promise.resolve({
          data: {
            success: true,
            verifierId: 'mock-verifier-id'
          }
        });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    }),
    get: vi.fn().mockImplementation((url) => {
      if (url.includes('/verifications/')) {
        return Promise.resolve({
          data: {
            status: 'verified'
          }
        });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    })
  }
}));

// Mock fetch for URL validation
global.fetch = vi.fn().mockImplementation((url) => {
  if (url.toString().includes('valid') || url.toString().endsWith('.jpg') || url.toString().endsWith('.pdf')) {
    return Promise.resolve({
      ok: true,
      headers: {
        get: (name: string) => {
          if (name === 'content-type') {
            if (url.toString().endsWith('.jpg')) return 'image/jpeg';
            if (url.toString().endsWith('.pdf')) return 'application/pdf';
            return 'image/png';
          }
          return null;
        }
      }
    });
  }
  return Promise.resolve({
    ok: false,
    headers: {
      get: () => null
    }
  });
});

describe('Oracle Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should validate a valid image URL', async () => {
    const result = await OracleService.validateProofUrl('https://valid-url.com/image.jpg');
    expect(result).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith('https://valid-url.com/image.jpg', { method: 'HEAD' });
  });

  it('should validate a valid PDF URL', async () => {
    const result = await OracleService.validateProofUrl('https://valid-url.com/document.pdf');
    expect(result).toBe(true);
  });

  it('should reject an invalid URL', async () => {
    const result = await OracleService.validateProofUrl('https://invalid-url.com/image.jpg');
    expect(result).toBe(false);
  });

  it('should reject a non-image/document URL', async () => {
    // Mock a text file response
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      headers: {
        get: () => 'text/plain'
      }
    });
    
    const result = await OracleService.validateProofUrl('https://valid-url.com/text.txt');
    expect(result).toBe(false);
  });

  it('should register a verifier', async () => {
    const publicKey = new PublicKey('11111111111111111111111111111111');
    const result = await OracleService.registerVerifier(publicKey);
    expect(result.success).toBe(true);
    expect(result.verifierId).toBeDefined();
  });

  it('should verify a milestone with valid proof', async () => {
    // Mock Math.random to always return 1 (100% success)
    const originalRandom = Math.random;
    Math.random = vi.fn().mockReturnValue(1);

    const result = await OracleService.verifyMilestone(
      'test-campaign-id',
      0,
      'https://valid-proof.com/image.jpg'
    );

    expect(result.verified).toBe(true);
    expect(result.txSignature).toBeDefined();
    
    // Restore original Math.random
    Math.random = originalRandom;
  });

  it('should reject a milestone with invalid proof URL', async () => {
    const result = await OracleService.verifyMilestone(
      'test-campaign-id',
      0,
      'http://insecure-url.com/image.jpg'
    );

    expect(result.verified).toBe(false);
    expect(result.reason).toContain('Invalid proof URL');
  });

  it('should check verification status', async () => {
    const result = await OracleService.checkVerificationStatus('test-verification-id');
    expect(result.status).toBeDefined();
  });
});