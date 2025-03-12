'use client';

import { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DonationData {
  date: string;
  amount: number;
}

interface DonationChartProps {
  campaignId: string;
}

export function DonationChart({ campaignId }: DonationChartProps) {
  const [data, setData] = useState<DonationData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDonationData = async () => {
      try {
        // Fetch donation data from your backend
        // This is a placeholder data
        const mockData = [
          { date: '2024-01', amount: 1.2 },
          { date: '2024-02', amount: 2.8 },
          { date: '2024-03', amount: 4.5 },
        ];
        setData(mockData);
      } catch (error) {
        console.error('Error fetching donation data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDonationData();
  }, [campaignId]);

  if (loading) {
    return <div>Loading chart...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Donation History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#8B5CF6"
                fillOpacity={1}
                fill="url(#colorAmount)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}