'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { createMilestone } from '@/lib/solana';
import { Loader2 } from 'lucide-react';

interface MilestoneFormProps {
  campaignId: string;
  onSuccess: () => void;
}

export function MilestoneForm({ campaignId, onSuccess }: MilestoneFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;

    try {
      setLoading(true);

      // Create milestone on blockchain (simulated for now)
      await createMilestone(
        campaignId,
        title,
        description,
        parseFloat(amount)
      );

      // Update Firebase
      const campaignRef = doc(db, 'campaigns', campaignId);
      const campaignDoc = await getDoc(campaignRef);
      
      if (campaignDoc.exists()) {
        await updateDoc(campaignRef, {
          milestones: arrayUnion({
            title,
            description,
            amount: parseFloat(amount),
            completed: false,
            verificationStatus: 'pending',
            createdAt: new Date().toISOString()
          })
        });

        toast({
          title: "Success",
          description: "Milestone added successfully!",
        });

        // Reset form
        setTitle('');
        setDescription('');
        setAmount('');
        
        // Notify parent component
        onSuccess();
      }
    } catch (error) {
      console.error('Error adding milestone:', error);
      toast({
        title: "Error",
        description: "Failed to add milestone. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Milestone</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Milestone Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g., Build 5 wells"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide details about this milestone"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Amount (SOL)</label>
            <Input
              type="number"
              step="0.1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              placeholder="1.5"
            />
            <p className="text-xs text-muted-foreground">
              This is the amount that will be released when this milestone is verified.
            </p>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              'Add Milestone'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}