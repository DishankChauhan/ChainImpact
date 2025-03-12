'use client';

import { useWallet } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { requestAirdrop, getWalletBalance } from '@/lib/solana';
import { useToast } from '@/components/ui/use-toast';

export function WalletButton() {
  const { connected, connect, disconnect, publicKey } = useWallet();
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const { toast } = useToast();

  const handleConnect = async () => {
    try {
      setLoading(true);
      await connect();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      toast({
        title: "Error",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAirdrop = async () => {
    if (!publicKey) return;
    
    try {
      setLoading(true);
      const signature = await requestAirdrop(publicKey);
      
      toast({
        title: "Success",
        description: "Received 2 SOL airdrop!",
      });
      
      // Update balance
      const newBalance = await getWalletBalance(publicKey);
      setBalance(newBalance);
    } catch (error) {
      console.error('Failed to request airdrop:', error);
      toast({
        title: "Error",
        description: "Failed to request airdrop. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async () => {
    if (!publicKey) return;
    
    try {
      const walletBalance = await getWalletBalance(publicKey);
      setBalance(walletBalance);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  };

  // Fetch balance when connected
  if (connected && publicKey && balance === null) {
    fetchBalance();
  }

  if (loading) {
    return (
      <Button disabled className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Connecting...
      </Button>
    );
  }

  if (connected && publicKey) {
    return (
      <div className="flex gap-2">
        <Button 
          onClick={handleAirdrop}
          variant="outline"
          size="icon"
          title="Request devnet SOL"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button 
          onClick={disconnect}
          className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600"
        >
          {balance !== null ? `${balance.toFixed(2)} SOL` : ''} • {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
        </Button>
      </div>
    );
  }

  return (
    <Button 
      onClick={handleConnect}
      className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600"
    >
      Connect Wallet
    </Button>
  );
}