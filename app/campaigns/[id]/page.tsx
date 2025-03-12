'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useWallet } from '@/contexts/WalletContext';
import { useAuth } from '@/contexts/AuthContext';
import { sendDonation } from '@/lib/solana';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { MilestoneForm } from '@/components/MilestoneForm';
import { MilestoneVerification } from '@/components/MilestoneVerification';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Calendar, Users, BarChart3, CheckCircle2 } from 'lucide-react';

interface Milestone {
  title: string;
  description?: string;
  amount: number;
  completed: boolean;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  createdAt?: string;
}

interface Campaign {
  id: string;
  title: string;
  description: string;
  goalAmount: number;
  currentAmount: number;
  imageUrl: string;
  walletAddress: string;
  milestones: Milestone[];
  creatorId: string;
  createdAt: string;
}

export default function CampaignPage() {
  const { id } = useParams();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [donationAmount, setDonationAmount] = useState('');
  const [isCreator, setIsCreator] = useState(false);
  const [loading, setLoading] = useState(true);
  const [donating, setDonating] = useState(false);
  const { connected, connect, publicKey } = useWallet();
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const fetchCampaign = async () => {
      const docRef = doc(db, 'campaigns', id as string);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const campaignData = { id: docSnap.id, ...docSnap.data() } as Campaign;
        setCampaign(campaignData);
        
        // Check if current user is the creator
        if (user && campaignData.creatorId === user.uid) {
          setIsCreator(true);
        }
        
        setLoading(false);
      } else {
        toast({
          title: "Error",
          description: "Campaign not found",
          variant: "destructive",
        });
        router.push('/campaigns');
      }
    };

    if (id) {
      fetchCampaign();
    }
  }, [id, user, router, toast]);

  const handleDonate = async () => {
    if (!campaign || !user || !publicKey) return;

    try {
      setDonating(true);
      const amount = parseFloat(donationAmount);
      if (isNaN(amount) || amount <= 0) {
        toast({
          title: "Error",
          description: "Please enter a valid donation amount",
          variant: "destructive",
        });
        return;
      }

      // Send donation via Solana
      const signature = await sendDonation(
        publicKey,
        campaign.walletAddress || publicKey.toString(), // Fallback to sender if no wallet address
        amount
      );

      // Record donation in Firebase
      await addDoc(collection(db, 'donations'), {
        userId: user.uid,
        campaignId: campaign.id,
        campaignTitle: campaign.title,
        amount,
        timestamp: new Date().toISOString(),
        transactionSignature: signature,
      });

      // Update campaign amount
      await updateDoc(doc(db, 'campaigns', campaign.id), {
        currentAmount: campaign.currentAmount + amount,
      });

      // Create notification for campaign creator
      await addDoc(collection(db, 'notifications'), {
        userId: campaign.creatorId,
        message: `You received a donation of ${amount} SOL for campaign "${campaign.title}"`,
        read: false,
        timestamp: new Date().toISOString(),
        type: 'donation',
      });

      toast({
        title: "Success",
        description: "Donation successful! Thank you for your contribution.",
      });

      setDonationAmount('');
      
      // Refresh campaign data
      const updatedDoc = await getDoc(doc(db, 'campaigns', campaign.id));
      setCampaign({ id: updatedDoc.id, ...updatedDoc.data() } as Campaign);
    } catch (error) {
      console.error('Error processing donation:', error);
      toast({
        title: "Error",
        description: "Failed to process donation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDonating(false);
    }
  };

  const handleMilestoneSuccess = async () => {
    if (!campaign) return;
    
    // Refresh campaign data
    const updatedDoc = await getDoc(doc(db, 'campaigns', campaign.id));
    setCampaign({ id: updatedDoc.id, ...updatedDoc.data() } as Campaign);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-xl">Loading campaign details...</div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-xl">Campaign not found</div>
      </div>
    );
  }

  const percentFunded = (campaign.currentAmount / campaign.goalAmount) * 100;
  const formattedDate = new Date(campaign.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl md:text-3xl">{campaign.title}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Created on {formattedDate}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="aspect-video relative mb-6 rounded-lg overflow-hidden">
                  <img
                    src={campaign.imageUrl}
                    alt={campaign.title}
                    className="object-cover w-full h-full"
                  />
                </div>

                <div className="space-y-6">
                  <div>
                    <Progress
                      value={percentFunded > 100 ? 100 : percentFunded}
                      className="h-2"
                    />
                    <div className="flex justify-between text-sm mt-2">
                      <span>{campaign.currentAmount.toFixed(2)} SOL raised</span>
                      <span>Goal: {campaign.goalAmount} SOL</span>
                    </div>
                  </div>

                  <div className="prose max-w-none">
                    <p>{campaign.description}</p>
                  </div>

                  <Tabs defaultValue="milestones">
                    <TabsList>
                      <TabsTrigger value="milestones">
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Milestones
                      </TabsTrigger>
                      <TabsTrigger value="impact">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Impact
                      </TabsTrigger>
                      {isCreator && (
                        <TabsTrigger value="manage">
                          <Users className="h-4 w-4 mr-2" />
                          Manage
                        </TabsTrigger>
                      )}
                    </TabsList>
                    
                    <TabsContent value="milestones" className="space-y-4 pt-4">
                      <h3 className="text-xl font-semibold">Milestones</h3>
                      {campaign.milestones && campaign.milestones.length > 0 ? (
                        <div className="space-y-3">
                          {campaign.milestones.map((milestone, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-4 bg-muted rounded-lg"
                            >
                              <div>
                                <p className="font-medium">{milestone.title}</p>
                                {milestone.description && (
                                  <p className="text-sm text-muted-foreground mt-1">{milestone.description}</p>
                                )}
                                <p className="text-sm text-muted-foreground mt-1">
                                  {milestone.amount} SOL
                                </p>
                              </div>
                              <Badge
                                variant={
                                  milestone.verificationStatus === 'verified'
                                    ? 'default'
                                    : milestone.verificationStatus === 'rejected'
                                    ? 'destructive'
                                    : 'secondary'
                                }
                              >
                                {milestone.verificationStatus}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No milestones have been added yet.</p>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="impact" className="pt-4">
                      
                    </TabsContent>
                    
                    {isCreator && (
                      <TabsContent value="manage" className="space-y-6 pt-4">
                        <MilestoneForm 
                          campaignId={campaign.id} 
                          onSuccess={handleMilestoneSuccess} 
                        />
                        
                        {campaign.milestones && campaign.milestones.length > 0 && (
                          <div className="space-y-4">
                            <h3 className="text-xl font-semibold">Verify Milestones</h3>
                            {campaign.milestones
                              .filter(m => m.verificationStatus === 'pending')
                              .map((milestone, index) => (
                                <MilestoneVerification
                                  key={index}
                                  campaignId={campaign.id}
                                  milestoneIndex={index}
                                  onSuccess={handleMilestoneSuccess}
                                />
                              ))}
                            
                            {campaign.milestones.filter(m => m.verificationStatus === 'pending').length === 0 && (
                              <p className="text-muted-foreground">No pending milestones to verify.</p>
                            )}
                          </div>
                        )}
                      </TabsContent>
                    )}
                  </Tabs>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Make a Donation</CardTitle>
              </CardHeader>
              <CardContent>
                {connected ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Amount (SOL)</label>
                      <Input
                        type="number"
                        placeholder="Amount in SOL"
                        value={donationAmount}
                        onChange={(e) => setDonationAmount(e.target.value)}
                        step="0.1"
                        min="0"
                      />
                    </div>
                    <Button 
                      onClick={handleDonate} 
                      className="w-full" 
                      disabled={donating}
                    >
                      {donating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Donate'
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="mb-4 text-muted-foreground">Connect your wallet to donate</p>
                    <Button onClick={connect} className="w-full">Connect Wallet</Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Campaign Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{percentFunded.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Milestones</span>
                    <span className="font-medium">{campaign.milestones?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Verified Milestones</span>
                    <span className="font-medium">
                      {campaign.milestones?.filter(m => m.verificationStatus === 'verified').length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span className="font-medium">{formattedDate}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Share Campaign</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Help this campaign reach its goal by sharing it with your network.
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        toast({
                          title: "Link Copied",
                          description: "Campaign link copied to clipboard",
                        });
                      }}
                    >
                      Copy Link
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => {
                        window.open(`https://twitter.com/intent/tweet?text=Support this campaign: ${campaign.title}&url=${encodeURIComponent(window.location.href)}`, '_blank');
                      }}
                    >
                      Tweet
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}