'use client';

import { CampaignList } from '@/components/CampaignList';
import { WalletButton } from '@/components/WalletButton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function CampaignsPage() {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Active Campaigns</h1>
          <div className="flex gap-4">
            <WalletButton />
            <Button asChild>
              <Link href="/campaigns/create">Create Campaign</Link>
            </Button>
          </div>
        </div>

        <CampaignList />
      </div>
    </div>
  );
}