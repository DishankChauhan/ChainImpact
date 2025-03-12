'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import Link from 'next/link';
import { Loader2, Plus, ExternalLink } from 'lucide-react';

interface Donation {
  campaignId: string;
  amount: number;
  timestamp: string;
  campaignTitle: string;
  transactionSignature?: string;
}

interface Milestone {
  title: string;
  amount: number;
  completed: boolean;
  verificationStatus: 'pending' | 'verified' | 'rejected';
}

interface Campaign {
  id: string;
  title: string;
  currentAmount: number;
  goalAmount: number;
  milestones: Milestone[];
  imageUrl: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Fetch donations
        const donationsQuery = query(
          collection(db, 'donations'),
          where('userId', '==', user.uid),
          orderBy('timestamp', 'desc')
        );
        const donationsSnapshot = await getDocs(donationsQuery);
        const donationsData: Donation[] = [];
        donationsSnapshot.forEach((doc) => {
          donationsData.push(doc.data() as Donation);
        });
        setDonations(donationsData);

        // Fetch campaigns
        const campaignsQuery = query(
          collection(db, 'campaigns'),
          where('creatorId', '==', user.uid)
        );
        const campaignsSnapshot = await getDocs(campaignsQuery);
        const campaignsData: Campaign[] = [];
        campaignsSnapshot.forEach((doc) => {
          campaignsData.push({ id: doc.id, ...doc.data() } as Campaign);
        });
        setCampaigns(campaignsData);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-12 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-xl">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Track your donations, campaigns, and impact
            </p>
          </div>
          <Button asChild>
            <Link href="/campaigns/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Campaign
            </Link>
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Donated
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {donations.reduce((sum, donation) => sum + donation.amount, 0).toFixed(2)} SOL
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Campaigns Created
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {campaigns.length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Verified Milestones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {campaigns.reduce((sum, campaign) => 
                  sum + (campaign.milestones?.filter(m => m.verificationStatus === 'verified').length || 0), 
                  0
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Your Impact</CardTitle>
            </CardHeader>
            <CardContent>
             
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="campaigns" className="space-y-8">
          <TabsList>
            <TabsTrigger value="campaigns">My Campaigns</TabsTrigger>
            <TabsTrigger value="donations">My Donations</TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns">
            {campaigns.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns.map((campaign) => (
                  <Card key={campaign.id} className="overflow-hidden">
                    <div className="aspect-video relative">
                      <img
                        src={campaign.imageUrl}
                        alt={campaign.title}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <CardHeader>
                      <CardTitle className="line-clamp-1">{campaign.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <Progress
                            value={(campaign.currentAmount / campaign.goalAmount) * 100}
                          />
                          <div className="flex justify-between text-sm mt-2">
                            <span>{campaign.currentAmount.toFixed(2)} SOL raised</span>
                            <span>Goal: {campaign.goalAmount} SOL</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h3 className="font-semibold text-sm">Milestones</h3>
                          {campaign.milestones && campaign.milestones.length > 0 ? (
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                              {campaign.milestones.map((milestone, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-2 bg-muted rounded-lg"
                                >
                                  <p className="text-sm font-medium truncate max-w-[70%]">{milestone.title}</p>
                                  <Badge
                                    variant={
                                      milestone.verificationStatus === 'verified'
                                        ? 'default'
                                        : milestone.verificationStatus === 'rejected'
                                        ? 'destructive'
                                        : 'secondary'
                                    }
                                    className="text-xs"
                                  >
                                    {milestone.verificationStatus}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No milestones added yet</p>
                          )}
                        </div>
                        
                        <Button asChild className="w-full">
                          <Link href={`/campaigns/${campaign.id}`}>
                            Manage Campaign
                            <ExternalLink className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <p className="text-muted-foreground mb-4">You haven't created any campaigns yet</p>
                  <Button asChild>
                    <Link href="/campaigns/create">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Campaign
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="donations">
            {donations.length > 0 ? (
              <div className="space-y-4">
                {donations.map((donation, index) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-lg">{donation.campaignTitle}</h3>
                          <p className="text-sm text-muted-foreground">
                            Donated on {new Date(donation.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex flex-col items-end">
                          <p className="text-2xl font-bold">{donation.amount.toFixed(2)} SOL</p>
                          {donation.transactionSignature && (
                            <a 
                              href={`https://explorer.solana.com/tx/${donation.transactionSignature}?cluster=devnet`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline flex items-center mt-1"
                            >
                              View Transaction
                              <ExternalLink className="ml-1 h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <p className="text-muted-foreground mb-4">You haven't made any donations yet</p>
                  <Button asChild>
                    <Link href="/campaigns">
                      Browse Campaigns
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}