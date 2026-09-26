import React from 'react';
import { ProductionDashboard } from './ProductionDashboard';

export const QualityDashboard: React.FC = () => {
  return <ProductionDashboard isQCMode={true} />;
};
