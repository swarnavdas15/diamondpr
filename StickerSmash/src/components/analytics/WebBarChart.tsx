import React from 'react';
import { View, Platform, Text } from 'react-native';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

export const WebBarChart = ({ data }: { data: any[] }) => {
  if (Platform.OS !== 'web') {
    return <Text>Not supported on mobile</Text>;
  }
  
  return (
    <View style={{ height: 320, width: '100%', marginTop: 20 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
          <Tooltip 
            cursor={{ fill: '#f1f5f9' }} 
            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', padding: '12px' }}
            itemStyle={{ fontSize: 13, fontWeight: '500' }}
            labelStyle={{ fontSize: 14, fontWeight: '600', marginBottom: '8px', color: '#0f172a' }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
          <Bar dataKey="completed" name="Completed Tasks" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={40} />
          <Bar dataKey="pending" name="Pending Tasks" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </View>
  );
};
