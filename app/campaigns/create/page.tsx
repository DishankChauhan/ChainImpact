'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

export default function CreateCampaignPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { publicKey, connected, connect } = useWallet();
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a campaign",
        variant: "destructive",
      });
      return;
    }

    if (!connected || !publicKey) {
      toast({
        title: "Error",
        description: "Please connect your wallet to create a campaign",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const campaignData = {
        title,
        description,
        goalAmount: Number(goalAmount),
        currentAmount: 0,
        imageUrl,
        creatorId: user.uid,
        createdAt: new Date().toISOString(),
        walletAddress: publicKey.toString(),
        milestones: [],
        status: 'active'
      };

      const docRef = await addDoc(collection(db, 'campaigns'), campaignData);

      // Create notification for the user
      await addDoc(collection(db, 'notifications'), {
        userId: user.uid,
        message: `Your campaign "${title}" has been created successfully!`,
        read: false,
        timestamp: new Date().toISOString(),
        type: 'system',
      });

      toast({
        title: "Success",
        description: "Campaign created successfully!",
      });
      
      router.push(`/campaigns/${docRef.id}`);
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast({
        title: "Error",
        description: "Failed to create campaign. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Create New Campaign</CardTitle>
          </CardHeader>
          <CardContent>
            {!connected ? (
              <div className="text-center py-6">
                <p className="mb-4">You need to connect your wallet to create a campaign</p>
                <Button onClick={connect}>Connect Wallet</Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Campaign Title</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Goal Amount (SOL)</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={goalAmount}
                    onChange={(e) => setGoalAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Campaign Image URL</label>
                  <Input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    required
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Campaign'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}