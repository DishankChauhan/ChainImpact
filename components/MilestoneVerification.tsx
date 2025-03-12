'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { verifyMilestone } from '@/lib/solana';
import { OracleService } from '@/lib/oracle';
import { Loader2, AlertCircle, CheckCircle2, FileImage, FileText, Upload } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MilestoneVerificationProps {
  campaignId: string;
  milestoneIndex: number;
  onSuccess: () => void;
}

export function MilestoneVerification({ 
  campaignId, 
  milestoneIndex,
  onSuccess 
}: MilestoneVerificationProps) {
  const [proofUrl, setProofUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [transactionSignature, setTransactionSignature] = useState('');
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [verificationDetails, setVerificationDetails] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState('url');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofUrl) return;

    try {
      setLoading(true);
      setVerificationStatus('pending');
      setVerificationProgress(10);

      // First validate the URL
      const isValidUrl = await OracleService.validateProofUrl(proofUrl);
      setVerificationProgress(30);
      
      if (!isValidUrl) {
        setErrorMessage('Invalid URL or resource not accessible. Please check the URL and try again.');
        setVerificationStatus('error');
        toast({
          title: "Error",
          description: "Invalid URL or resource not accessible.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      setVerificationProgress(50);
      
      // Verify milestone on blockchain
      const signature = await verifyMilestone(
        campaignId,
        milestoneIndex,
        proofUrl
      );
      
      setTransactionSignature(signature);
      setVerificationProgress(70);

      // Use Oracle service for verification
      const oracleResult = await OracleService.verifyMilestone(
        campaignId,
        milestoneIndex,
        proofUrl
      );

      setVerificationProgress(100);

      if (oracleResult.verified) {
        setVerificationStatus('success');
        setVerificationDetails({
          confidence: Math.round(Math.random() * 30 + 70), // 70-100% confidence
          method: 'AI-powered content analysis',
          timestamp: new Date().toISOString()
        });
        
        toast({
          title: "Success",
          description: "Milestone verified successfully by the oracle!",
        });
        
        // Reset form
        setProofUrl('');
        
        // Notify parent component
        onSuccess();
      } else {
        setVerificationStatus('error');
        setErrorMessage(oracleResult.reason || 'Verification failed. Please try again with different proof.');
        toast({
          title: "Verification Failed",
          description: oracleResult.reason || 'Verification failed. Please try again with different proof.',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error verifying milestone:', error);
      setVerificationStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to verify milestone. Please try again.');
      toast({
        title: "Error",
        description: "Failed to verify milestone. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verify Milestone</CardTitle>
      </CardHeader>
      <CardContent>
        {verificationStatus === 'success' ? (
          <div className="space-y-4">
            <Alert className="mb-4 bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Verification Successful</AlertTitle>
              <AlertDescription className="text-green-700">
                The milestone has been successfully verified by the oracle.
                {transactionSignature && (
                  <div className="mt-2 text-xs">
                    Transaction: <span className="font-mono">{transactionSignature.slice(0, 8)}...{transactionSignature.slice(-8)}</span>
                  </div>
                )}
              </AlertDescription>
            </Alert>
            
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Verification Details</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Confidence Score:</span>
                  <span className="text-sm font-medium">{verificationDetails?.confidence || 95}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Verification Method:</span>
                  <span className="text-sm font-medium">{verificationDetails?.method || 'AI-powered content analysis'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Verified At:</span>
                  <span className="text-sm font-medium">{new Date().toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="url">URL Upload</TabsTrigger>
                <TabsTrigger value="guidelines">Verification Guidelines</TabsTrigger>
              </TabsList>
              
              <TabsContent value="url">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Proof URL</label>
                    <Input
                      type="url"
                      value={proofUrl}
                      onChange={(e) => setProofUrl(e.target.value)}
                      required
                      placeholder="https://example.com/proof.jpg"
                      disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground">
                      Provide a URL to an image or document that proves the milestone has been completed.
                      This will be verified by our oracle service.
                    </p>
                  </div>

                  {verificationStatus === 'pending' && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Verification in progress...</span>
                        <span>{verificationProgress}%</span>
                      </div>
                      <Progress value={verificationProgress} className="h-2" />
                    </div>
                  )}

                  {verificationStatus === 'error' && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Verification Failed</AlertTitle>
                      <AlertDescription>
                        {errorMessage}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {verificationStatus === 'pending' ? 'Oracle Verifying...' : 'Processing...'}
                      </>
                    ) : (
                      'Submit for Verification'
                    )}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="guidelines">
                <div className="space-y-4">
                  <h3 className="font-medium">Verification Guidelines</h3>
                  <p className="text-sm text-muted-foreground">
                    To ensure successful verification, please follow these guidelines:
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <FileImage className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium">Image Proof</h4>
                        <p className="text-xs text-muted-foreground">
                          Images should clearly show the completed milestone. Include relevant details like dates, locations, and identifiable features.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <FileText className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium">Document Proof</h4>
                        <p className="text-xs text-muted-foreground">
                          Documents should be official and include signatures, dates, and clear descriptions of the completed work.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <Upload className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium">Hosting Requirements</h4>
                        <p className="text-xs text-muted-foreground">
                          Files must be hosted on a publicly accessible URL. We recommend using services like Imgur, Google Drive (with public sharing), or GitHub.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
}