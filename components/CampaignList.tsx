'use client';

import { useEffect, useState } from 'react';
import { collection, query, getDocs, orderBy, limit, startAfter } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import InfiniteScroll from 'react-infinite-scroll-component';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface Campaign {
  id: string;
  title: string;
  description: string;
  goalAmount: number;
  currentAmount: number;
  imageUrl: string;
}

export function CampaignList() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchCampaigns = async (isInitial = false) => {
    try {
      setLoading(true);
      const campaignsRef = collection(db, 'campaigns');
      let q = query(campaignsRef, orderBy('createdAt', 'desc'), limit(6));

      if (!isInitial && lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      const newCampaigns = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Campaign));

      if (isInitial) {
        setCampaigns(newCampaigns);
      } else {
        setCampaigns(prev => [...prev, ...newCampaigns]);
      }

      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === 6);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns(true);
  }, []);

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input
          type="text"
          placeholder="Search campaigns..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <InfiniteScroll
        dataLength={campaigns.length}
        next={() => fetchCampaigns(false)}
        hasMore={hasMore}
        loader={<h4>Loading...</h4>}
        className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {filteredCampaigns.map((campaign) => (
          <Card key={campaign.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-video relative">
              <img
                src={campaign.imageUrl}
                alt={campaign.title}
                className="object-cover w-full h-full"
              />
            </div>
            <CardHeader>
              <CardTitle className="line-clamp-2">{campaign.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                {campaign.description}
              </p>
              <div className="space-y-2">
                <Progress
                  value={(campaign.currentAmount / campaign.goalAmount) * 100}
                />
                <div className="flex justify-between text-sm">
                  <span>{campaign.currentAmount} SOL raised</span>
                  <span>Goal: {campaign.goalAmount} SOL</span>
                </div>
                <Button asChild className="w-full mt-4">
                  <Link href={`/campaigns/${campaign.id}`}>View Campaign</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </InfiniteScroll>
    </div>
  );
}