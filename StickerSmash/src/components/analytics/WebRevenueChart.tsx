import React from 'react';
import { View, Platform, Text } from 'react-native';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';

export interface MonthlyRevenuePoint {
  month: string;          // e.g. "Oct 26"
  quoted: number;         // Original quotation amount (of converted deals)
  converted: number;      // Final converted order value (actual revenue)
  negotiation: number;    // quoted - converted (bargaining discount)
  lost: number;           // Lost business value
}

const formatINR = (v: number) => {
  const n = Number(v) || 0;
  if (Math.abs(n) >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (Math.abs(n) >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (Math.abs(n) >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n}`;
};

export const WebRevenueChart = ({ data }: { data: MonthlyRevenuePoint[] }) => {
  if (Platform.OS !== 'web') {
    return <Text style={{ color: '#64748b' }}>Interactive revenue chart is available on web.</Text>;
  }

  return (
    <View style={{ height: 360, width: '100%', marginTop: 16 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 16, left: 8, bottom: 10 }} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#64748b' }}
            tickFormatter={formatINR}
            width={70}
          />
          <Tooltip
            cursor={{ fill: '#f1f5f9' }}
            formatter={(value: any, name: any) => [`₹${(Number(value) || 0).toLocaleString('en-IN')}`, name]}
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              padding: '12px',
            }}
            itemStyle={{ fontSize: 13, fontWeight: 500 }}
            labelStyle={{ fontSize: 14, fontWeight: 600, marginBottom: '8px', color: '#0f172a' }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
          <Bar dataKey="quoted" name="Quoted Amount" fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Bar dataKey="converted" name="Converted Revenue" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Bar dataKey="negotiation" name="Negotiation Discount" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Line type="monotone" dataKey="lost" name="Lost Business" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </View>
  );
};
