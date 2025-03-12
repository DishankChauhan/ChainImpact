'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';

interface WalletContextType {
  connected: boolean;
  publicKey: PublicKey | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType>({} as WalletContextType);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);

  useEffect(() => {
    const checkWallet = async () => {
      if (typeof window !== 'undefined' && (window as any).solana) {
        try {
          const response = await (window as any).solana.connect({ onlyIfTrusted: true });
          setPublicKey(new PublicKey(response.publicKey.toString()));
          setConnected(true);
        } catch (error) {
          // Not connected
        }
      }
    };
    checkWallet();
  }, []);

  const connect = async () => {
    if (typeof window !== 'undefined' && (window as any).solana) {
      try {
        const response = await (window as any).solana.connect();
        setPublicKey(new PublicKey(response.publicKey.toString()));
        setConnected(true);
      } catch (error) {
        console.error('Error connecting wallet:', error);
      }
    } else {
      window.open('https://phantom.app/', '_blank');
    }
  };

  const disconnect = async () => {
    if (typeof window !== 'undefined' && (window as any).solana) {
      await (window as any).solana.disconnect();
      setPublicKey(null);
      setConnected(false);
    }
  };

  return (
    <WalletContext.Provider value={{ connected, publicKey, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => useContext(WalletContext);