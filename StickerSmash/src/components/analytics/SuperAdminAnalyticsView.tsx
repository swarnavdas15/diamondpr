import React, { useState, useMemo } from 'react';
import { formatAppDate } from '../../utils/dateFormatter';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { Colors, StatusColors, Spacing, Radius, Shadows } from '../../theme';
import { Order, Quotation, Task, AuthAuditLog, Role } from '../../types';
import { ExportButton } from '../ui/ExportButton';
import { ExportDataPayload } from '../../utils/exportUtils';

export type TimeframeFilter = 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'ALL_TIME';
export type DepartmentFilter = 'ALL' | 'SALES' | 'PURCHASE' | 'PRODUCTION' | 'QUALITY_TESTING' | 'DISPATCH';
export type ReportType =
  | 'ORDER'
  | 'REVENUE'
  | 'SALES'
  | 'PURCHASE'
  | 'PRODUCTION'
  | 'QUALITY'
  | 'DISPATCH'
  | 'USER_PERFORMANCE'
  | 'INVENTORY'
  | 'QUOTATION'
  | 'LOST_BUSINESS'
  | 'AUDIT_LOG';

import { PieChart, BarChart } from 'react-native-chart-kit';
import { WebBarChart } from './WebBarChart';
import { WebRevenueChart, MonthlyRevenuePoint } from './WebRevenueChart';

interface PieChartItem {
  label: string;
  value: number;
  displayValue?: string;
  color: string;
}

interface VisualPieChartProps {
  title?: string;
  subtitle?: string;
  items: PieChartItem[];
  centerLabel?: string | number;
  centerSubLabel?: string;
}


interface BarChartItem {
  label: string;
  completed: number;
  pending: number;
}

interface VisualBarChartProps {
  title?: string;
  subtitle?: string;
  items: BarChartItem[];
}

const VisualBarChart: React.FC<VisualBarChartProps> = ({ title, subtitle, items }) => {
  const maxVal = Math.max(...items.map(d => d.completed + d.pending), 1);
  
  return (
    <View style={styles.pieChartCard}>
      {title ? <Text style={styles.pieChartTitle}>{title}</Text> : null}
      {subtitle ? <Text style={styles.pieChartSubtitle}>{subtitle}</Text> : null}
      
      {/* Legend */}
      <View style={{ flexDirection: 'row', gap: 16, marginTop: 10, marginBottom: 20, paddingHorizontal: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#22c55e' }} />
          <Text style={{ fontSize: 13, color: '#475569', fontWeight: '500' }}>Completed Tasks</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#f59e0b' }} />
          <Text style={{ fontSize: 13, color: '#475569', fontWeight: '500' }}>Pending Tasks</Text>
        </View>
      </View>

      <View style={{ paddingHorizontal: 4 }}>
        {Platform.OS === 'web' && items.length > 0 ? (
          <WebBarChart data={items.map(i => ({ name: i.label.split(' ')[0], completed: i.completed, pending: i.pending }))} />
        ) : items.length === 0 ? (
          <View style={{ padding: 30, alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 8 }}>
            <Text style={{ color: '#64748b' }}>No task data available for staff comparison.</Text>
          </View>
        ) : (
          items.map((item, idx) => {
            const completedPct = (item.completed / maxVal) * 100;
            const pendingPct = (item.pending / maxVal) * 100;
            const completionRate = (item.completed + item.pending) > 0 
              ? Math.round((item.completed / (item.completed + item.pending)) * 100) 
              : 0;

            return (
              <View key={idx} style={{ marginBottom: 18 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, alignItems: 'flex-end' }}>
                  <Text style={{ fontWeight: '600', color: '#1e293b', fontSize: 14 }}>{item.label}</Text>
                  <Text style={{ fontSize: 12, color: '#64748b', fontWeight: '500' }}>
                    {item.completed} / {item.completed + item.pending} Tasks ({completionRate}% Yield)
                  </Text>
                </View>
                <View style={{ height: 12, backgroundColor: '#f1f5f9', borderRadius: 6, flexDirection: 'row', overflow: 'hidden' }}>
                  <View style={{ width: `${completedPct}%`, backgroundColor: '#22c55e' }} />
                  <View style={{ width: `${pendingPct}%`, backgroundColor: '#f59e0b' }} />
                </View>
              </View>
            );
          })
        )}
      </View>
    </View>
  );
};

const VisualPieChart: React.FC<VisualPieChartProps> = ({
  title,
  subtitle,
  items,
  centerLabel,
  centerSubLabel,
}) => {
  const totalValue = items.reduce(
    (sum, item) => sum + (typeof item.value === 'number' && !isNaN(item.value) ? item.value : 0),
    0
  );

  const chartData = items.map(item => ({
    name: item.label,
    population: typeof item.value === 'number' && !isNaN(item.value) ? item.value : 0,
    color: item.color,
  }));

  const renderDonutChart = () => {
    const size = 160;
    const strokeWidth = 20;
    const radius = (size - strokeWidth) / 2; // 70
    const circumference = 2 * Math.PI * radius; // 439.82

    if (totalValue === 0) {
      return (
        <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
          {Platform.OS === 'web' ? (
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth={strokeWidth}
              />
            </svg>
          ) : (
            <PieChart
              data={[{ name: 'Empty', population: 1, color: '#e2e8f0' }]}
              width={size}
              height={size}
              chartConfig={{ color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})` }}
              accessor={"population"}
              backgroundColor={"transparent"}
              paddingLeft={"0"}
              hasLegend={false}
              absolute
            />
          )}
          <View style={[styles.donutCenter, { position: 'absolute' }]}>
            <Text style={styles.donutCenterValue}>{centerLabel !== undefined ? centerLabel : 0}</Text>
            <Text style={styles.donutCenterSub}>{centerSubLabel !== undefined ? centerSubLabel : 'Total'}</Text>
          </View>
        </View>
      );
    }

    if (Platform.OS === 'web') {
      let accumulatedLength = 0;
      return (
        <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {chartData.map((item, index) => {
              if (item.population <= 0) return null;
              const strokeLength = (item.population / totalValue) * circumference;
              const strokeOffset = -accumulatedLength;
              accumulatedLength += strokeLength;

              return (
                <circle
                  key={index}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={item.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${strokeLength} ${circumference - strokeLength}`}
                  strokeDashoffset={strokeOffset}
                  transform={`rotate(-90 ${size / 2} ${size / 2})`}
                  style={{ transition: 'stroke-dasharray 0.4s ease' }}
                />
              );
            })}
          </svg>
          <View style={[styles.donutCenter, { position: 'absolute' }]}>
            <Text style={styles.donutCenterValue}>
              {centerLabel !== undefined ? centerLabel : totalValue}
            </Text>
            <Text style={styles.donutCenterSub}>
              {centerSubLabel !== undefined ? centerSubLabel : 'Total'}
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
        <PieChart
          data={chartData.map(d => ({ ...d, legendFontColor: '#7F7F7F', legendFontSize: 15 }))}
          width={size}
          height={size}
          chartConfig={{ color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})` }}
          accessor={"population"}
          backgroundColor={"transparent"}
          paddingLeft={"0"}
          hasLegend={false}
          absolute
        />
        <View style={[styles.donutCenter, { position: 'absolute' }]}>
          <Text style={styles.donutCenterValue}>
            {centerLabel !== undefined ? centerLabel : totalValue}
          </Text>
          <Text style={styles.donutCenterSub}>
            {centerSubLabel !== undefined ? centerSubLabel : 'Total'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.pieChartCard}>
      {title ? <Text style={styles.pieChartTitle}>{title}</Text> : null}
      {subtitle ? <Text style={styles.pieChartSubtitle}>{subtitle}</Text> : null}

      <View style={styles.pieChartBodyRow}>
        <View style={styles.pieWrapper}>
          <View style={styles.pieCircle}>
            {renderDonutChart()}
          </View>
        </View>

        <View style={styles.legendContainer}>
          {items.map((item, idx) => {
            const valNum = typeof item.value === 'number' && !isNaN(item.value) ? item.value : 0;
            const pct = totalValue > 0 ? Math.round((valNum / totalValue) * 100) : 0;
            return (
              <View key={idx} style={styles.legendItemRow}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <View style={{ flex: 1 }}>
                  <View style={styles.legendTextHeader}>
                    <Text style={styles.legendLabelText}>{item.label}</Text>
                    <Text style={[styles.legendValueText, { color: item.color }]}>
                      {item.displayValue !== undefined ? item.displayValue : item.value}
                    </Text>
                  </View>
                  <View style={styles.legendProgressBarTrack}>
                    <View
                      style={[
                        styles.legendProgressBarFill,
                        { width: `${pct}%`, backgroundColor: item.color },
                      ]}
                    />
                  </View>
                </View>
                <View
                  style={[
                    styles.legendPctBadge,
                    { backgroundColor: `${item.color}15`, borderColor: item.color },
                  ]}
                >
                  <Text style={[styles.legendPctText, { color: item.color }]}>{pct}%</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

export const SuperAdminAnalyticsView: React.FC = () => {
  const { orders, quotations, tasks, clients, vendors } = useERP();
  const { users, authAuditLogs } = useAuth();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  // Multi-Criteria Filter States
  const [timeframe, setTimeframe] = useState<TimeframeFilter>('MONTHLY');
  const [selectedDept, setSelectedDept] = useState<DepartmentFilter>('ALL');
  const [selectedUserId, setSelectedUserId] = useState<string>('ALL');
  const [selectedClientCode, setSelectedClientCode] = useState<string>('ALL');
  const [selectedOrderNum, setSelectedOrderNum] = useState<string>('ALL');

  // Report Export State
  const [activeReportType, setActiveReportType] = useState<ReportType>('ORDER');
  const [exportNotice, setExportNotice] = useState<string>('');

  // Active Analytics Tab (Cleaned up to 8 core graph analytics tabs)
  const [activeTab, setActiveTab] = useState<
    'ORDERS' | 'SALES' | 'PURCHASE' | 'PRODUCTION' | 'QUALITY' | 'DISPATCH' | 'USERS' | 'REVENUE'
  >('ORDERS');

  // 1. Dynamic Filtering Engine
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (selectedClientCode !== 'ALL' && o.clientCode !== selectedClientCode) return false;
      if (selectedOrderNum !== 'ALL' && o.orderNumber !== selectedOrderNum) return false;
      if (selectedDept === 'PURCHASE' && o.purchaseStatus === 'PENDING') return false;
      if (selectedDept === 'PRODUCTION' && o.productionStatus === 'PENDING') return false;
      if (selectedDept === 'QUALITY_TESTING' && o.qualityStatus === 'PENDING') return false;
      if (selectedDept === 'DISPATCH' && o.dispatchStatus === 'PENDING') return false;
      return true;
    });
  }, [orders, selectedClientCode, selectedOrderNum, selectedDept]);

  const filteredQuotations = useMemo(() => {
    return quotations.filter((q) => {
      if (selectedClientCode !== 'ALL' && q.clientCode !== selectedClientCode) return false;
      if (selectedUserId !== 'ALL' && q.salesExecutiveUserId !== selectedUserId) return false;
      return true;
    });
  }, [quotations, selectedClientCode, selectedUserId]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (selectedDept !== 'ALL' && t.assignedToDepartment !== selectedDept) return false;
      if (selectedUserId !== 'ALL' && t.assignedToUserId !== selectedUserId) return false;
      return true;
    });
  }, [tasks, selectedDept, selectedUserId]);

  // 2. Aggregate KPI Metrics Calculations
  const metrics = useMemo(() => {
    const totalOrders = filteredOrders.length;
    const completedOrders = filteredOrders.filter((o) =>
      o.currentStage === 'COMPLETED' || o.dispatchStatus === 'COMPLETED' || o.status === 'COMPLETED'
    ).length;

    const activeOrders = totalOrders - completedOrders;

    const productionOrders = filteredOrders.filter((o) =>
      (o.currentStage === 'PRODUCTION' || o.productionStatus === 'IN_PROGRESS') &&
      o.currentStage !== 'COMPLETED' && o.dispatchStatus !== 'COMPLETED'
    ).length;

    const pendingPurchaseOrders = filteredOrders.filter((o) =>
      (o.currentStage === 'PURCHASE' || o.purchaseStatus === 'IN_PROGRESS' || o.purchaseStatus === 'PENDING') &&
      o.productionStatus === 'PENDING' && o.currentStage !== 'PRODUCTION' && o.currentStage !== 'QUALITY_TESTING' && o.currentStage !== 'DISPATCH' && o.currentStage !== 'COMPLETED'
    ).length;

    const testingOrders = filteredOrders.filter((o) =>
      (o.currentStage === 'QUALITY_TESTING' || o.qualityStatus === 'IN_PROGRESS') &&
      o.currentStage !== 'COMPLETED' && o.dispatchStatus !== 'COMPLETED'
    ).length;

    const dispatchOrders = filteredOrders.filter((o) =>
      (o.currentStage === 'DISPATCH' || o.dispatchStatus === 'IN_PROGRESS') &&
      o.currentStage !== 'COMPLETED' && o.dispatchStatus !== 'COMPLETED'
    ).length;

    const delayedOrders = filteredOrders.filter((o) => {
      if (o.status === 'COMPLETED' || o.currentStage === 'COMPLETED' || o.dispatchStatus === 'COMPLETED') return false;
      const daysActive = (new Date().getTime() - new Date(o.createdAt).getTime()) / (1000 * 3600 * 24);
      return daysActive > 14;
    }).length;

    const totalQuotations = filteredQuotations.length;
    const convertedQuotations = filteredQuotations.filter(
      (q) => q.status === 'FULLY_CONVERTED' || q.status === 'PARTIALLY_CONVERTED' || (q.convertedOrderValue && q.convertedOrderValue > 0)
    ).length;
    const conversionRate = totalQuotations > 0 ? ((convertedQuotations / totalQuotations) * 100).toFixed(1) : '0.0';

    const totalRevenue = filteredQuotations.reduce((acc, q) => acc + Number(q.convertedOrderValue || 0), 0);
    const lostBusinessValue = filteredQuotations.reduce((acc, q) => acc + Number(q.lostValue || 0), 0);

    const totalTasks = filteredTasks.length;
    const pendingTasks = filteredTasks.filter((t) => t.status !== 'COMPLETED').length;

    // Scores
    const deptScore = totalOrders > 0 ? Math.min(100, Math.round((completedOrders / totalOrders) * 100)) : 0;
    const userProductivityScore = totalTasks > 0 ? Math.round(((totalTasks - pendingTasks) / totalTasks) * 100) : 0;

    return {
      totalOrders,
      activeOrders,
      productionOrders,
      completedOrders,
      pendingPurchaseOrders,
      testingOrders,
      dispatchOrders,
      delayedOrders,
      totalQuotations,
      conversionRate,
      totalRevenue,
      lostBusinessValue,
      totalTasks,
      pendingTasks,
      deptScore,
      userProductivityScore,
    };
  }, [filteredOrders, filteredQuotations, filteredTasks]);


  // 2b. Monthly Revenue & Negotiation (Bargaining) Analytics
  const revenueAnalytics = useMemo(() => {
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const buckets: (MonthlyRevenuePoint & { key: string; deals: number })[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        month: `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
        quoted: 0, converted: 0, negotiation: 0, lost: 0, deals: 0,
      });
    }
    const byKey = new Map(buckets.map((b) => [b.key, b]));

    let totalQuoted = 0, totalConverted = 0, totalNegotiation = 0, totalLost = 0, convertedDeals = 0;

    filteredQuotations.forEach((q) => {
      const rawDate = q.quotationDate || q.createdAt;
      const d = rawDate ? new Date(rawDate) : null;
      const bucket = d && !isNaN(d.getTime()) ? byKey.get(`${d.getFullYear()}-${d.getMonth()}`) : undefined;

      const quotedAmt = Number(q.quotationAmount) || 0;
      const convertedAmt = Number(q.convertedOrderValue) || 0;
      const isConverted = q.status === 'FULLY_CONVERTED' || q.status === 'PARTIALLY_CONVERTED' || convertedAmt > 0;
      const isLost = q.status === 'LOST';

      if (isConverted) {
        const finalAmt = convertedAmt > 0 ? convertedAmt : quotedAmt;
        const discount = Math.max(0, quotedAmt - finalAmt);
        totalQuoted += quotedAmt;
        totalConverted += finalAmt;
        totalNegotiation += discount;
        convertedDeals += 1;
        if (bucket) {
          bucket.quoted += quotedAmt;
          bucket.converted += finalAmt;
          bucket.negotiation += discount;
          bucket.deals += 1;
        }
      } else if (isLost) {
        const lostAmt = Number(q.lostValue) || quotedAmt;
        totalLost += lostAmt;
        if (bucket) bucket.lost += lostAmt;
      }
    });

    const avgDiscountPct = totalQuoted > 0 ? ((totalNegotiation / totalQuoted) * 100).toFixed(1) : '0.0';
    return { monthly: buckets, totalQuoted, totalConverted, totalNegotiation, totalLost, convertedDeals, avgDiscountPct };
  }, [filteredQuotations]);

  // Reset Filters Handler
  const handleResetFilters = () => {
    setTimeframe('MONTHLY');
    setSelectedDept('ALL');
    setSelectedUserId('ALL');
    setSelectedClientCode('ALL');
    setSelectedOrderNum('ALL');
  };

  // 3. Export Data Engine (CSV, Excel, PDF Print)
  const generateExportData = (type: ReportType) => {
    switch (type) {
      case 'ORDER':
        return {
          title: 'ERP Comprehensive Order Performance Report',
          headers: ['Order Number', 'Client Code', 'Client Name', 'Status', 'Purchase Status', 'Production Status', 'QC Result', 'Dispatch Status', 'Required Qty', 'Created Date'],
          rows: filteredOrders.map((o) => [
            o.orderNumber,
            o.clientCode,
            o.clientName || 'N/A',
            o.status,
            o.purchaseStatus,
            o.productionStatus,
            o.qcResult,
            o.dispatchStatus,
            o.requiredQuantity.toString(),
            formatAppDate(o.createdAt),
          ]),
        };

      case 'REVENUE':
        return {
          title: 'ERP Financial & Revenue Analytics Report',
          headers: ['Quotation Number', 'Client Code', 'Company Name', 'Quotation Amount (₹)', 'Converted Value (₹)', 'Lost Value (₹)', 'Status'],
          rows: filteredQuotations.map((q) => [
            q.quotationNumber,
            q.clientCode,
            q.companyName,
            q.quotationAmount.toString(),
            (q.convertedOrderValue || 0).toString(),
            (q.lostValue || 0).toString(),
            q.status,
          ]),
        };

      case 'SALES':
        return {
          title: 'Sales Team & Pipeline Performance Report',
          headers: ['Quotation No', 'Client', 'Sales Executive', 'Quotation Date', 'Amount (₹)', 'Status', 'Follow-Ups Count'],
          rows: filteredQuotations.map((q) => [
            q.quotationNumber,
            q.companyName,
            q.salesExecutive,
            q.quotationDate,
            q.quotationAmount.toString(),
            q.status,
            (q.followUps?.length || 0).toString(),
          ]),
        };

      case 'PURCHASE':
        return {
          title: 'Procurement & Purchase Department Report',
          headers: ['Order No', 'Client Code', 'Purchase Status', 'Vendor Selected', 'Procurement Notes', 'Purchased Qty / Required Qty'],
          rows: filteredOrders.map((o) => [
            o.orderNumber,
            o.clientCode,
            o.purchaseStatus,
            o.vendorSelected || 'N/A',
            o.procurementNotes || 'N/A',
            `${o.purchaseQuantity || 0} / ${o.requiredQuantity}`,
          ]),
        };

      case 'PRODUCTION':
        return {
          title: 'Shop Floor & Manufacturing Throughput Report',
          headers: ['Order No', 'Client Code', 'Production Status', 'Produced Qty / Total Qty', 'Shop Floor Notes'],
          rows: filteredOrders.map((o) => [
            o.orderNumber,
            o.clientCode,
            o.productionStatus,
            `${o.productionQuantity || 0} / ${o.requiredQuantity}`,
            o.shopFloorNotes || 'N/A',
          ]),
        };

      case 'QUALITY':
        return {
          title: 'Quality Testing & Inspection Yield Report',
          headers: ['Order No', 'Client Code', 'QC Status', 'QC Result', 'QC Passed Qty / Produced Qty', 'QC Remarks'],
          rows: filteredOrders.map((o) => [
            o.orderNumber,
            o.clientCode,
            o.qualityStatus,
            o.qcResult,
            `${o.qcQuantity || 0} / ${o.productionQuantity || 0}`,
            o.qcRemarks || 'N/A',
          ]),
        };

      case 'DISPATCH':
        return {
          title: 'Dispatch & Logistics Fulfillment Report',
          headers: ['Order No', 'Client Code', 'Dispatch Status', 'Transport Ref', 'Dispatched Qty / QC Passed', 'Logistics Entry'],
          rows: filteredOrders.map((o) => [
            o.orderNumber,
            o.clientCode,
            o.dispatchStatus,
            o.transportRef || 'N/A',
            `${o.dispatchQuantity || 0} / ${o.qcQuantity || o.productionQuantity || 0}`,
            o.logisticsEntry || 'N/A',
          ]),
        };

      case 'USER_PERFORMANCE':
        return {
          title: 'User & Staff Productivity Report',
          headers: ['User Name', 'Username', 'Email', 'Role', 'Status', 'Tasks Completed'],
          rows: users.map((u) => {
            const userTasks = tasks.filter((t) => t.assignedToUserId === u.id || t.assignedToName === u.name);
            const compTasks = userTasks.filter((t) => t.status === 'COMPLETED').length;
            return [u.name, u.username, u.email, u.role, u.isActive ? 'ACTIVE' : 'INACTIVE', `${compTasks} / ${userTasks.length}`];
          }),
        };

      case 'INVENTORY':
        return {
          title: 'Inventory & Vendor Performance Report',
          headers: ['Vendor Code', 'Vendor Name', 'Category', 'Contact Person', 'Mobile', 'Status', 'Lead Time'],
          rows: vendors.map((v) => [v.vendorCode, v.vendorName, v.vendorCategory || 'Raw Material', v.contactPerson, v.mobileNumber, v.status, v.leadTime || 'Standard']),
        };

      case 'QUOTATION':
        return {
          title: 'Quotation Pipeline & Analytics Report',
          headers: ['Quotation No', 'Client Name', 'Amount (₹)', 'Status', 'Date', 'Converted Order No'],
          rows: filteredQuotations.map((q) => [q.quotationNumber, q.companyName, q.quotationAmount.toString(), q.status, q.quotationDate, q.convertedOrderNumber || 'N/A']),
        };

      case 'LOST_BUSINESS':
        return {
          title: 'Lost Business & Rejection Analysis Report',
          headers: ['Quotation No', 'Client Name', 'Lost Value (₹)', 'Lost Date', 'Lost Reason', 'Remarks'],
          rows: filteredQuotations
            .filter((q) => q.status === 'LOST' || (q.lostValue && q.lostValue > 0))
            .map((q) => [q.quotationNumber, q.companyName, (q.lostValue || 0).toString(), q.lostDate || 'N/A', q.lostReason || 'N/A', q.lostRemarks || 'N/A']),
        };

      case 'AUDIT_LOG':
        return {
          title: 'System Security & Activity Audit Log Report',
          headers: ['Event Type', 'User ID', 'Email Ref', 'Activity Details', 'Timestamp'],
          rows: authAuditLogs.map((l) => [l.event, l.username || 'N/A', l.email || 'N/A', l.details, new Date(l.timestamp).toLocaleString()]),
        };
    }
  };

  const downloadCSV = () => {
    const data = generateExportData(activeReportType);
    let csvContent = `"${data.title}"\nGenerated At: ${new Date().toLocaleString()}\n\n`;
    csvContent += data.headers.map((h) => `"${h}"`).join(',') + '\n';
    data.rows.forEach((row) => {
      csvContent += row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',') + '\n';
    });

    if (Platform.OS === 'web') {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${activeReportType.toLowerCase()}_report_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    setExportNotice(`Downloaded CSV Report: ${data.title}`);
    setTimeout(() => setExportNotice(''), 4000);
  };

  const downloadExcel = () => {
    const data = generateExportData(activeReportType);
    let excelContent = `\uFEFF"${data.title}"\nGenerated At: ${new Date().toLocaleString()}\n\n`;
    excelContent += data.headers.map((h) => `"${h}"`).join('\t') + '\n';
    data.rows.forEach((row) => {
      excelContent += row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join('\t') + '\n';
    });

    if (Platform.OS === 'web') {
      const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${activeReportType.toLowerCase()}_report_${Date.now()}.xls`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    setExportNotice(`Downloaded Excel Spreadsheet: ${data.title}`);
    setTimeout(() => setExportNotice(''), 4000);
  };

  const triggerPDFPrint = () => {
    const data = generateExportData(activeReportType);
    if (Platform.OS === 'web') {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>${data.title}</title>
              <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #1e293b; }
                h1 { color: #0284c7; border-bottom: 2px solid #0284c7; padding-bottom: 10px; font-size: 22px; }
                .meta { font-size: 12px; color: #64748b; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                th { background-color: #0f172a; color: #38bdf8; text-align: left; padding: 10px; font-size: 11px; text-transform: uppercase; }
                td { padding: 9px 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
                tr:nth-child(even) { background-color: #f8fafc; }
                .footer { margin-top: 30px; font-size: 11px; text-align: center; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
              </style>
            </head>
            <body>
              <h1>${data.title}</h1>
              <div class="meta">Super Admin Executive Report &bull; Generated: ${new Date().toLocaleString()} &bull; Total Records: ${data.rows.length}</div>
              <table>
                <thead>
                  <tr>${data.headers.map((h) => `<th>${h}</th>`).join('')}</tr>
                </thead>
                <tbody>
                  ${data.rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('')}
                </tbody>
              </table>
              <div class="footer">Confidential ERP Document &bull; Super Admin Clearance Level</div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 500);
      }
    }
    setExportNotice(`Generated PDF Print View for ${data.title}`);
    setTimeout(() => setExportNotice(''), 4000);
  };

  const getAnalyticsExportPayload = (): ExportDataPayload => {
    return {
      title: `Executive Analytics & Operational Performance Report (${activeTab})`,
      subtitle: `Timeframe: ${timeframe} | Department: ${selectedDept}`,
      filename: `ERP_Analytics_Report_${activeTab}`,
      headers: ['Order Number', 'Client Code', 'Client Name', 'Status', 'Purchase', 'Production', 'QC', 'Dispatch', 'Required Qty', 'Created Date'],
      rows: filteredOrders.map((o) => [
        o.orderNumber,
        o.clientCode,
        o.clientName || 'N/A',
        o.status,
        o.purchaseStatus,
        o.productionStatus,
        o.qcResult,
        o.dispatchStatus,
        o.requiredQuantity,
        formatAppDate(o.createdAt),
      ]),
    };
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContentContainer}
      nestedScrollEnabled={true}
      showsVerticalScrollIndicator={true}
    >
      {/* Top Banner */}
      <View style={styles.topBanner}>
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>Super Admin Executive Reports & Analytics</Text>
          <Text style={styles.bannerSub}>
            Real-time multi-dimensional ERP business intelligence, financial performance, departmental throughput, security audit logs, and downloadable executive reports.
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <ExportButton getData={getAnalyticsExportPayload} buttonText="Export Reports" />
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>👑 SUPER ADMIN EXCLUSIVE</Text>
          </View>
        </View>
      </View>

      {/* Multi-Criteria Filter Bar */}
      <View style={styles.filterCard}>
        <View style={styles.filterHeader}>
          <Text style={styles.filterTitle}>🔍 Multi-Criteria Executive Analytics Filter Bar</Text>
          <TouchableOpacity style={styles.resetBtn} onPress={handleResetFilters}>
            <Text style={styles.resetBtnText}>🔄 Reset Filters</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterGrid}>
          {/* Timeframe Filter */}
          <View style={styles.filterBox}>
            <Text style={styles.filterLabel}>Timeframe</Text>
            <View style={styles.chipRow}>
              {(['MONTHLY', 'QUARTERLY', 'YEARLY', 'ALL_TIME'] as TimeframeFilter[]).map((tf) => (
                <TouchableOpacity
                  key={tf}
                  style={[styles.chip, timeframe === tf && styles.activeChip]}
                  onPress={() => setTimeframe(tf)}
                >
                  <Text style={[styles.chipText, timeframe === tf && styles.activeChipText]}>
                    {tf.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Department Filter */}
          <View style={styles.filterBox}>
            <Text style={styles.filterLabel}>Department Scope</Text>
            <View style={styles.chipRow}>
              {(['ALL', 'SALES', 'PURCHASE', 'PRODUCTION', 'QUALITY_TESTING', 'DISPATCH'] as DepartmentFilter[]).map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.chip, selectedDept === d && styles.activeChip]}
                  onPress={() => setSelectedDept(d)}
                >
                  <Text style={[styles.chipText, selectedDept === d && styles.activeChipText]}>
                    {d === 'QUALITY_TESTING' ? 'QUALITY' : d}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* Top 12 Executive KPI Summary Cards */}
      <View style={[styles.kpiGrid, isMobile && styles.kpiGridMobile]}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiVal}>{metrics.totalOrders}</Text>
          <Text style={styles.kpiLabel}>Total Orders</Text>
          <Text style={styles.kpiSub}>System-wide total</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={[styles.kpiVal, { color: Colors.accentTeal }]}>{metrics.activeOrders}</Text>
          <Text style={styles.kpiLabel}>Active Work Orders</Text>
          <Text style={styles.kpiSub}>System-wide active pipeline</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={[styles.kpiVal, { color: Colors.successBright }]}>{metrics.completedOrders}</Text>
          <Text style={styles.kpiLabel}>Completed Orders</Text>
          <Text style={styles.kpiSub}>Fully dispatched</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={[styles.kpiVal, { color: Colors.industrialOrange }]}>{metrics.delayedOrders}</Text>
          <Text style={styles.kpiLabel}>Delayed Orders</Text>
          <Text style={styles.kpiSub}>Active {'>'} 14 Days</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiVal}>{metrics.totalQuotations}</Text>
          <Text style={styles.kpiLabel}>Total Quotations</Text>
          <Text style={styles.kpiSub}>Generated inquiries</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={[styles.kpiVal, { color: '#38bdf8' }]}>{metrics.conversionRate}%</Text>
          <Text style={styles.kpiLabel}>Quotation Conversion Rate</Text>
          <Text style={styles.kpiSub}>Converted to orders</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={[styles.kpiVal, { color: Colors.successBright, fontSize: 20 }]}>
            ₹{metrics.totalRevenue.toLocaleString()}
          </Text>
          <Text style={styles.kpiLabel}>Total Revenue</Text>
          <Text style={styles.kpiSub}>Converted order value</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={[styles.kpiVal, { color: Colors.industrialOrange, fontSize: 20 }]}>
            ₹{metrics.lostBusinessValue.toLocaleString()}
          </Text>
          <Text style={styles.kpiLabel}>Lost Business Value</Text>
          <Text style={styles.kpiSub}>Lost quotations value</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiVal}>{metrics.totalTasks}</Text>
          <Text style={styles.kpiLabel}>Total System Tasks</Text>
          <Text style={styles.kpiSub}>Assigned cross-dept</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={[styles.kpiVal, { color: '#f59e0b' }]}>{metrics.pendingTasks}</Text>
          <Text style={styles.kpiLabel}>Pending Tasks</Text>

          <Text style={styles.kpiSub}>Action required</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={[styles.kpiVal, { color: Colors.accentTeal }]}>{metrics.deptScore}%</Text>
          <Text style={styles.kpiLabel}>Dept Performance Score</Text>
          <Text style={styles.kpiSub}>System throughput yield</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={[styles.kpiVal, { color: Colors.successBright }]}>{metrics.userProductivityScore}%</Text>
          <Text style={styles.kpiLabel}>User Productivity Score</Text>
          <Text style={styles.kpiSub}>Staff completion yield</Text>
        </View>
      </View>

      {/* Cleaned up 8 Core Operational Graph Analytics Navigation Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
        {[
          { id: 'ORDERS', label: '📋 Orders Analytics' },
          { id: 'SALES', label: '🎯 Sales & Quotations' },
          { id: 'PURCHASE', label: '🛒 Purchase & Procurement' },
          { id: 'PRODUCTION', label: '🏭 Production Yield' },
          { id: 'QUALITY', label: '🔍 Quality Control' },
          { id: 'DISPATCH', label: '🚚 Dispatch & Logistics' },
          { id: 'USERS', label: '👤 Staff Productivity' },
          { id: 'REVENUE', label: '💰 Revenue Analytics' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabBtn, activeTab === tab.id && styles.activeTabBtn]}
            onPress={() => setActiveTab(tab.id as any)}
          >
            <Text style={[styles.tabBtnText, activeTab === tab.id && styles.activeTabBtnText]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 1. ORDERS GRAPH ANALYTICS TAB */}
      {activeTab === 'ORDERS' && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>📋 Orders Workflow & Stage Pipeline Analytics</Text>
          <Text style={styles.sectionSub}>Real-time distribution of orders across active stages and completion throughput.</Text>

          <VisualPieChart
            title="📊 Order Distribution Pie Chart"
            subtitle="Real-time breakdown of orders across manufacturing pipeline stages."
            centerLabel={metrics.totalOrders}
            centerSubLabel="Total Orders"
            items={[
              { label: 'Completed Orders', value: metrics.completedOrders, color: '#22c55e' },
              { label: 'Active Shop Floor Production', value: metrics.productionOrders, color: '#0284c7' },
              { label: 'Pending Sourcing & Procurement', value: metrics.pendingPurchaseOrders, color: '#f59e0b' },
              { label: 'Quality Testing & Inspection', value: metrics.testingOrders, color: '#8b5cf6' },
              { label: 'Ready for Dispatch / Shipping', value: metrics.dispatchOrders, color: '#ec4899' },
            ]}
          />
        </View>
      )}

      {/* 2. SALES & QUOTATIONS GRAPH ANALYTICS TAB */}
      {activeTab === 'SALES' && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>🎯 Sales Pipeline & Quotation Conversion Analytics</Text>
          <Text style={styles.sectionSub}>Inquiry conversion rates, total quotation value generated vs converted order value.</Text>

          <VisualPieChart
            title="📊 Sales Quotations & Financial Win/Loss Pie Chart"
            subtitle="Ratio of converted revenue value vs lost quotation value and issued quotations."
            centerLabel={`${metrics.conversionRate}%`}
            centerSubLabel="Win Rate"
            items={[
              { label: 'Converted Order Value', value: metrics.totalRevenue, displayValue: `₹${metrics.totalRevenue.toLocaleString()}`, color: '#22c55e' },
              { label: 'Lost Business Value', value: metrics.lostBusinessValue, displayValue: `₹${metrics.lostBusinessValue.toLocaleString()}`, color: '#f97316' },
              { label: 'Issued Quotations Pool', value: metrics.totalQuotations, displayValue: `${metrics.totalQuotations} Issued`, color: '#0284c7' },
            ]}
          />
        </View>
      )}

      {/* 3. PURCHASE GRAPH ANALYTICS TAB */}
      {activeTab === 'PURCHASE' && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>🛒 Purchase & Procurement Workflow Analytics</Text>
          <Text style={styles.sectionSub}>Raw material procurement status, vendor assignments, and purchase completion rate.</Text>

          {(() => {
            const totalProc = filteredOrders.filter((o) => o.purchaseRequired).length;
            const completedProc = filteredOrders.filter((o) => o.purchaseRequired && o.purchaseStatus === 'COMPLETED').length;
            const inProgProc = filteredOrders.filter((o) => o.purchaseRequired && o.purchaseStatus === 'IN_PROGRESS').length;
            const pendingProc = filteredOrders.filter((o) => o.purchaseRequired && o.purchaseStatus === 'PENDING').length;
            const yieldPct = totalProc > 0 ? Math.round((completedProc / totalProc) * 100) : 0;

            return (
              <VisualPieChart
                title="🛒 Procurement & Sourcing Fulfillment Pie Chart"
                subtitle="Distribution of raw material sourcing statuses across purchase orders."
                centerLabel={`${yieldPct}%`}
                centerSubLabel="Fulfilled"
                items={[
                  { label: 'Procurement Completed', value: completedProc, color: '#22c55e' },
                  { label: 'Sourcing in Progress', value: inProgProc, color: '#0284c7' },
                  { label: 'Pending Sourcing', value: pendingProc, color: '#f59e0b' },
                ]}
              />
            );
          })()}
        </View>
      )}

      {/* 4. PRODUCTION GRAPH ANALYTICS TAB */}
      {activeTab === 'PRODUCTION' && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>🏭 Manufacturing Yield & Shop Floor Analytics</Text>
          <Text style={styles.sectionSub}>Flange machining output, active work order status, and production completion yield.</Text>

          {(() => {
            const totalProd = filteredOrders.filter((o) => o.productionRequired).length;
            const completedProd = filteredOrders.filter((o) => o.productionRequired && o.productionStatus === 'COMPLETED').length;
            const inProgProd = filteredOrders.filter((o) => o.productionRequired && o.productionStatus === 'IN_PROGRESS').length;
            const pendingProd = filteredOrders.filter((o) => o.productionRequired && o.productionStatus === 'PENDING').length;
            const yieldPct = totalProd > 0 ? Math.round((completedProd / totalProd) * 100) : 0;

            return (
              <VisualPieChart
                title="🏭 Shop Floor Machining Yield Pie Chart"
                subtitle="Distribution of manufacturing output: completed production, active machining, and queued orders."
                centerLabel={`${yieldPct}%`}
                centerSubLabel="Machined"
                items={[
                  { label: 'Production Completed', value: completedProd, color: '#22c55e' },
                  { label: 'Active Machining', value: inProgProd, color: '#38bdf8' },
                  { label: 'Queued Work Orders', value: pendingProd, color: '#f59e0b' },
                ]}
              />
            );
          })()}
        </View>
      )}

      {/* 5. QUALITY GRAPH ANALYTICS TAB */}
      {activeTab === 'QUALITY' && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>🔍 Quality Control & Inspection Analytics</Text>
          <Text style={styles.sectionSub}>ISO Quality testing results, hydrostatic/ultrasonic inspection pass rates.</Text>

          {(() => {
            const totalQc = filteredOrders.filter((o) => o.qualityTestingRequired).length;
            const passedQc = filteredOrders.filter((o) => o.qualityTestingRequired && o.qcResult === 'PASSED').length;
            const failedQc = filteredOrders.filter((o) => o.qualityTestingRequired && o.qcResult === 'FAILED').length;
            const pendingQc = filteredOrders.filter((o) => o.qualityTestingRequired && (o.qcResult === 'PENDING' || !o.qcResult)).length;
            const passPct = totalQc > 0 ? Math.round((passedQc / totalQc) * 100) : 0;

            return (
              <VisualPieChart
                title="🔍 ISO Quality Inspection Results Pie Chart"
                subtitle="Hydrostatic/Ultrasonic testing results breakdown: Passed, Rejections, and Pending inspection."
                centerLabel={`${passPct}%`}
                centerSubLabel="Pass Rate"
                items={[
                  { label: 'QC Passed Orders', value: passedQc, color: '#22c55e' },
                  { label: 'Inspection Rejections', value: failedQc, color: '#ef4444' },
                  { label: 'Awaiting Inspection', value: pendingQc, color: '#f59e0b' },
                ]}
              />
            );
          })()}
        </View>
      )}

      {/* 6. DISPATCH GRAPH ANALYTICS TAB */}
      {activeTab === 'DISPATCH' && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>🚚 Dispatch & Logistics Analytics</Text>
          <Text style={styles.sectionSub}>Logistics tracking, shipped order throughput, and pending dispatch queue.</Text>

          {(() => {
            const totalDisp = filteredOrders.filter((o) => o.dispatchRequired).length;
            const completedDisp = filteredOrders.filter((o) => o.dispatchRequired && o.dispatchStatus === 'COMPLETED').length;
            const inProgDisp = filteredOrders.filter((o) => o.dispatchRequired && o.dispatchStatus === 'IN_PROGRESS').length;
            const pendingDisp = filteredOrders.filter((o) => o.dispatchRequired && o.dispatchStatus === 'PENDING').length;
            const dispPct = totalDisp > 0 ? Math.round((completedDisp / totalDisp) * 100) : 0;

            return (
              <VisualPieChart
                title="🚚 Dispatch & Shipping Fulfillment Pie Chart"
                subtitle="Status distribution of logistics orders: Shipped & Delivered, In Transit, and Queued."
                centerLabel={`${dispPct}%`}
                centerSubLabel="Shipped"
                items={[
                  { label: 'Shipped & Delivered', value: completedDisp, color: '#22c55e' },
                  { label: 'In Transit / Dispatch Prep', value: inProgDisp, color: '#0284c7' },
                  { label: 'Queued for Dispatch', value: pendingDisp, color: '#f59e0b' },
                ]}
              />
            );
          })()}
        </View>
      )}

      {/* 7. USER PRODUCTIVITY GRAPH ANALYTICS TAB */}
      {activeTab === 'USERS' && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>dY`  Staff & User Productivity Analytics</Text>
          <Text style={styles.sectionSub}>Task completion yields and cross-departmental staff performance scores.</Text>

          {(() => {
            const staffStats = users.map((u) => {
              const uTasks = filteredTasks.filter((t) => t.assignedToUserId === u.id || t.assignedToName === u.name);
              const comp = uTasks.filter((t) => t.status === 'COMPLETED').length;
              return { label: u.name, completed: comp, pending: uTasks.length - comp, total: uTasks.length };
            }).sort((a, b) => b.completed - a.completed);
            
            // Only show staff who have at least 1 assigned task (or top 5 if many)
            const activeStaff = staffStats.filter(s => s.total > 0);

            return (
              <VisualBarChart
                title="📊 Staff Task Performance & Yield Comparison"
                subtitle="Comparative horizontal breakdown of completed vs pending tasks across active staff members."
                items={activeStaff.length > 0 ? activeStaff : staffStats} 
              />
            );
          })()}
        </View>
      )}

      {/* 8. REVENUE GRAPH ANALYTICS TAB */}
      {activeTab === 'REVENUE' && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>💰 Revenue & Financial Performance Analytics</Text>
          <Text style={styles.sectionSub}>Monthly revenue trend with quotation vs converted value and negotiation (bargaining) discount.</Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16 }}>
            {[
              { label: 'Quoted (Converted Deals)', value: `₹${revenueAnalytics.totalQuoted.toLocaleString('en-IN')}`, color: '#475569' },
              { label: 'Converted Revenue', value: `₹${revenueAnalytics.totalConverted.toLocaleString('en-IN')}`, color: '#16a34a' },
              { label: 'Negotiation Discount', value: `₹${revenueAnalytics.totalNegotiation.toLocaleString('en-IN')}`, color: '#d97706' },
              { label: 'Avg. Discount Given', value: `${revenueAnalytics.avgDiscountPct}%`, color: '#d97706' },
              { label: 'Lost Business', value: `₹${revenueAnalytics.totalLost.toLocaleString('en-IN')}`, color: '#dc2626' },
              { label: 'Converted Deals', value: String(revenueAnalytics.convertedDeals), color: '#0284c7' },
            ].map((c) => (
              <View key={c.label} style={{ flexGrow: 1, flexBasis: 160, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: c.color }}>{c.value}</Text>
                <Text style={{ fontSize: 12, color: '#64748b', marginTop: 4, fontWeight: '500' }}>{c.label}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.pieChartCard, { marginTop: 16 }]}>
            <Text style={styles.pieChartTitle}>📊 Monthly Revenue vs Quotation (Last 12 Months)</Text>
            <Text style={styles.pieChartSubtitle}>
              Grey = original quoted amount, Green = final converted revenue, Amber = negotiation discount (Quoted − Converted), Red line = lost business.
            </Text>
            {revenueAnalytics.monthly.some((m) => m.quoted || m.converted || m.lost) ? (
              <WebRevenueChart data={revenueAnalytics.monthly} />
            ) : (
              <View style={{ padding: 30, alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 8, marginTop: 16 }}>
                <Text style={{ color: '#64748b' }}>No converted or lost quotations in the last 12 months yet.</Text>
              </View>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 80,
    ...(Platform.OS === 'web' ? ({ minHeight: '100vh', overflowY: 'auto' } as any) : {}),
  },
  topBanner: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    ...Shadows.sm,
  },
  bannerTitle: {
    color: Colors.textLight,
    fontSize: 20,
    fontWeight: '900',
  },
  bannerSub: {
    color: Colors.accentTeal,
    fontSize: 12,
    marginTop: 4,
  },
  roleBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  roleBadgeText: {
    color: '#f59e0b',
    fontSize: 11,
    fontWeight: '800',
  },
  filterCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    ...Shadows.sm,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  filterTitle: {
    color: Colors.textLight,
    fontSize: 14,
    fontWeight: '800',
  },
  resetBtn: {
    backgroundColor: Colors.inputBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  resetBtnText: {
    color: Colors.accentTeal,
    fontSize: 11,
    fontWeight: '700',
  },
  filterGrid: {
    gap: Spacing.md,
  },
  filterBox: {
    flex: 1,
  },
  filterLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    backgroundColor: Colors.inputBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  activeChip: {
    backgroundColor: Colors.accentTeal,
    borderColor: Colors.accentTeal,
  },
  chipText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  activeChipText: {
    color: Colors.white,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  kpiGridMobile: {
    gap: Spacing.xs,
  },
  kpiCard: {
    flex: 1,
    minWidth: 160,
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    ...Shadows.sm,
  },
  kpiVal: {
    color: Colors.textLight,
    fontSize: 22,
    fontWeight: '900',
  },
  kpiLabel: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  kpiSub: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
  },
  tabBtn: {
    backgroundColor: Colors.cardBg,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.md,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  activeTabBtn: {
    backgroundColor: Colors.accentTeal,
    borderColor: Colors.accentTeal,
  },
  tabBtnText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  activeTabBtnText: {
    color: Colors.white,
  },
  sectionCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    ...Shadows.sm,
  },
  sectionTitle: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: '800',
  },
  sectionSub: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
    marginBottom: Spacing.md,
  },
  inputLabel: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  reportSelectBtn: {
    backgroundColor: Colors.inputBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  activeReportSelectBtn: {
    backgroundColor: Colors.accentTeal,
    borderColor: Colors.accentTeal,
  },
  reportSelectBtnText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  activeReportSelectBtnText: {
    color: Colors.white,
  },
  exportActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  btnCsv: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  btnExcel: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  btnPdf: {
    backgroundColor: Colors.industrialOrange,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  btnText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  noticeBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    padding: 10,
    borderRadius: Radius.md,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.successBright,
  },
  noticeText: {
    color: Colors.successBright,
    fontSize: 12,
    fontWeight: '700',
  },
  chartContainer: {
    gap: 16,
  },
  barGroup: {
    gap: 6,
  },
  barLabel: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '700',
  },
  track: {
    height: 12,
    backgroundColor: Colors.inputBg,
    borderRadius: 6,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
  // Column Chart Styles
  // Light Mode Pie Chart Styles
  pieChartCard: {
    backgroundColor: '#ffffff',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Shadows.sm,
  },
  pieChartTitle: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  pieChartSubtitle: {
    color: '#64748b',
    fontSize: 11,
    marginBottom: Spacing.md,
  },
  pieChartBodyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  pieWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  pieCircle: {
    width: 170,
    height: 170,
    borderRadius: 85,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.08)',
  },
  donutCenter: {
    width: 105,
    height: 105,
    borderRadius: 55,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    paddingHorizontal: 4,
  },
  donutCenterValue: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  donutCenterSub: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 2,
    textAlign: 'center',
  },
  legendContainer: {
    flex: 1,
    minWidth: 240,
    gap: 10,
  },
  legendItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendTextHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendLabelText: {
    color: '#1e293b',
    fontSize: 12,
    fontWeight: '700',
  },
  legendValueText: {
    fontSize: 12,
    fontWeight: '900',
  },
  legendProgressBarTrack: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  legendProgressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  legendPctBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.xs,
    borderWidth: 1,
    minWidth: 42,
    alignItems: 'center',
  },
  legendPctText: {
    fontSize: 11,
    fontWeight: '900',
  },
  revGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  revCard: {
    flex: 1,
    backgroundColor: Colors.inputBg,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  revVal: {
    color: Colors.successBright,
    fontSize: 20,
    fontWeight: '900',
  },
  revLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  table: {
    minWidth: 700,
  },
  thRow: {
    flexDirection: 'row',
    backgroundColor: Colors.inputBg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.px10,
    borderRadius: Radius.sm,
    marginBottom: Spacing.px6,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  th: {
    color: Colors.accentTeal,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  trRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBg,
    paddingVertical: Spacing.px10,
    paddingHorizontal: Spacing.px10,
    borderRadius: Radius.sm,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  tdBold: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '700',
  },
  td: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  tdHighlight: {
    color: Colors.accentTeal,
    fontSize: 12,
    fontWeight: '700',
  },
  tdSmall: {
    color: Colors.textSubtle,
    fontSize: 11,
  },
  eventBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.xs,
    alignSelf: 'flex-start',
  },
  successBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  failBadge: {
    backgroundColor: 'rgba(179, 75, 32, 0.1)',
  },
  eventBadgeText: {
    color: Colors.accentTeal,
    fontSize: 10,
    fontWeight: '800',
  },
});
