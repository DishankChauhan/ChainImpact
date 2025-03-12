import { PublicKey } from '@solana/web3.js';
import { connection } from './solana';
import { doc, updateDoc, getDoc, addDoc, collection } from 'firebase/firestore';
import { db } from './firebase';
import axios from 'axios';
import { ORACLE_API_ENDPOINT, ORACLE_API_KEY } from './constants';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

// Oracle service for milestone verification
export class OracleService {
  // Verify milestone using external oracle service
  static async verifyMilestone(
    campaignId: string,
    milestoneIndex: number,
    proofUrl: string
  ): Promise<{ verified: boolean; reason?: string; txSignature?: string }> {
    try {
      console.log(`Oracle verifying milestone ${milestoneIndex} for campaign ${campaignId}`);
      
      // First validate the URL
      const isValidUrl = await this.validateProofUrl(proofUrl);
      if (!isValidUrl) {
        return { 
          verified: false, 
          reason: 'Invalid proof URL. The URL must be accessible and contain valid proof content.' 
        };
      }
      
      // In a real implementation, this would call an external oracle API
      // For now, we'll implement a more sophisticated verification system
      
      // 1. Analyze the proof URL content
      const analysisResult = await this.analyzeProofContent(proofUrl);
      
      if (!analysisResult.valid) {
        return {
          verified: false,
          reason: analysisResult.reason || 'Proof content analysis failed'
        };
      }
      
      // 2. Generate a verification signature (simulated for now)
      const verificationSignature = 'oracle_verification_' + Date.now().toString(36);
      
      // 3. Update the milestone status in Firebase
      const campaignRef = doc(db, 'campaigns', campaignId);
      const campaignDoc = await getDoc(campaignRef);
      
      if (campaignDoc.exists()) {
        const campaign = campaignDoc.data();
        const milestones = [...campaign.milestones];
        
        if (milestones[milestoneIndex]) {
          milestones[milestoneIndex] = {
            ...milestones[milestoneIndex],
            verificationStatus: 'verified',
            completed: true,
            verifiedAt: new Date().toISOString(),
            verifiedBy: 'ChainImpact Oracle',
            verificationTxSignature: verificationSignature,
            proofUrl: proofUrl,
            verificationDetails: {
              method: 'content-analysis',
              confidence: analysisResult.confidence,
              timestamp: new Date().toISOString()
            }
          };
          
          await updateDoc(campaignRef, { milestones });
          
          // Create notification for campaign creator
          await addDoc(collection(db, 'notifications'), {
            userId: campaign.creatorId,
            message: `Milestone "${milestones[milestoneIndex].title}" has been verified!`,
            read: false,
            timestamp: new Date().toISOString(),
            type: 'milestone',
            campaignId,
            milestoneIndex
          });
        }
      }
      
      return { 
        verified: true,
        txSignature: verificationSignature
      };
    } catch (error) {
      console.error('Oracle verification error:', error);
      return { 
        verified: false, 
        reason: 'An error occurred during verification. Please try again.' 
      };
    }
  }
  
  // Analyze proof content (simulated but more sophisticated)
  private static async analyzeProofContent(url: string): Promise<{ 
    valid: boolean; 
    reason?: string; 
    confidence: number;
  }> {
    try {
      // In a real implementation, this would use AI/ML to analyze the image/document
      // For now, we'll simulate a more sophisticated analysis
      
      // Simulate processing time for realism
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Extract file extension
      const fileExtension = url.split('.').pop()?.toLowerCase();
      
      // Different analysis based on file type
      if (fileExtension === 'jpg' || fileExtension === 'jpeg' || fileExtension === 'png') {
        // Simulate image analysis
        const imageAnalysisScore = Math.random() * 100;
        
        if (imageAnalysisScore < 60) {
          return {
            valid: false,
            reason: 'Image analysis score too low. The image does not clearly demonstrate milestone completion.',
            confidence: imageAnalysisScore / 100
          };
        }
        
        return {
          valid: true,
          confidence: imageAnalysisScore / 100
        };
      } 
      else if (fileExtension === 'pdf' || fileExtension === 'doc' || fileExtension === 'docx') {
        // Simulate document analysis
        const documentAnalysisScore = Math.random() * 100;
        
        if (documentAnalysisScore < 70) {
          return {
            valid: false,
            reason: 'Document analysis score too low. The document does not provide sufficient evidence of milestone completion.',
            confidence: documentAnalysisScore / 100
          };
        }
        
        return {
          valid: true,
          confidence: documentAnalysisScore / 100
        };
      }
      
      // Default case for other file types
      return {
        valid: Math.random() > 0.3, // 70% chance of success
        reason: 'Unsupported file type. Please provide an image or document.',
        confidence: 0.5
      };
    } catch (error) {
      console.error('Error analyzing proof content:', error);
      return {
        valid: false,
        reason: 'Error analyzing proof content',
        confidence: 0
      };
    }
  }
  
  // Method to check if a URL is valid and accessible
  static async validateProofUrl(url: string): Promise<boolean> {
    try {
      // Check if URL is properly formatted
      new URL(url);
      
      // Try to access the URL
      const response = await fetch(url, { method: 'HEAD' });
      
      // Check if response is OK and content type is appropriate
      if (response.ok) {
        const contentType = response.headers.get('content-type') || '';
        return contentType.includes('image/') || 
               contentType.includes('application/pdf') || 
               contentType.includes('application/msword') ||
               contentType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      }
      
      return false;
    } catch (error) {
      console.error('Error validating URL:', error);
      return false;
    }
  }
  
  // Method to register as a verifier
  static async registerVerifier(walletAddress: PublicKey): Promise<{ success: boolean; verifierId?: string; error?: string }> {
    try {
      console.log(`Registering ${walletAddress.toString()} as a verifier`);
      
      // In a real implementation, this would call the oracle API to register the verifier
      // For now, we'll simulate a more sophisticated registration process
      
      // Check if the wallet has sufficient SOL (simulated)
      const balance = await connection.getBalance(walletAddress);
      if (balance < 0.1 * LAMPORTS_PER_SOL) {
        return {
          success: false,
          error: 'Insufficient SOL balance. Verifiers need at least 0.1 SOL.'
        };
      }
      
      // Generate a unique verifier ID
      const verifierId = 'verifier_' + walletAddress.toString().substring(0, 8) + '_' + Date.now().toString(36);
      
      // In a real implementation, we would store this in a database
      
      return {
        success: true,
        verifierId
      };
    } catch (error) {
      console.error('Error registering verifier:', error);
      return {
        success: false,
        error: 'An unexpected error occurred'
      };
    }
  }
  
  // Method to check verification status with more details
  static async checkVerificationStatus(verificationId: string): Promise<{ 
    status: 'pending' | 'verified' | 'rejected'; 
    reason?: string;
    details?: {
      confidence: number;
      verifiedAt?: string;
      verifier?: string;
    }
  }> {
    try {
      // In a real implementation, this would call the oracle API
      // For now, we'll simulate a more detailed status response
      
      // Generate a random status for simulation
      const random = Math.random();
      let status: 'pending' | 'verified' | 'rejected';
      let details: any = {};
      
      if (random < 0.2) {
        status = 'pending';
        details = {
          confidence: 0,
          estimatedCompletionTime: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
        };
      } else if (random < 0.8) {
        status = 'verified';
        details = {
          confidence: 0.75 + (Math.random() * 0.25), // 75-100% confidence
          verifiedAt: new Date().toISOString(),
          verifier: 'ChainImpact Oracle'
        };
      } else {
        status = 'rejected';
        details = {
          confidence: Math.random() * 0.6, // 0-60% confidence
          verifiedAt: new Date().toISOString(),
          verifier: 'ChainImpact Oracle'
        };
      }
      
      return {
        status,
        reason: status === 'rejected' ? 'Verification evidence did not meet required confidence threshold.' : undefined,
        details
      };
    } catch (error) {
      console.error('Error checking verification status:', error);
      return {
        status: 'pending',
        reason: 'Error checking status'
      };
    }
  }
}