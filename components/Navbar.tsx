'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { WalletButton } from '@/components/WalletButton';
import { Notifications } from '@/components/Notifications';
import { useAuth } from '@/contexts/AuthContext';
import { Leaf } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  
  // Skip navbar on landing page
  if (pathname === '/') {
    return null;
  }

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <Leaf className="h-6 w-6 text-green-500" />
            <span className="hidden sm:inline">ChainImpact</span>
          </Link>
          
          <nav className="hidden md:flex gap-6">
            <Link 
              href="/campaigns" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname.startsWith('/campaigns') ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              Campaigns
            </Link>
            {user && (
              <Link 
                href="/dashboard" 
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname === '/dashboard' ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                Dashboard
              </Link>
            )}
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Notifications />
              <WalletButton />
              <Button variant="outline" size="sm" onClick={() => signOut()}>
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <WalletButton />
              <Button asChild variant="outline" size="sm">
                <Link href="/auth/login">Sign In</Link>
              </Button>
              <Button asChild size="sm" className="hidden sm:flex">
                <Link href="/auth/register">Register</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}