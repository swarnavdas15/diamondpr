import React, { useState, useMemo } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, TextInput, StyleSheet } from 'react-native';
import { useERP } from '../../context/ERPContext';
import { Quotation, QuotationStatus, LostReason } from '../../types';
import { Colors, Spacing, Radius, Shadows } from '../../theme';

interface SalesKPIDetailsModalProps {
  visible: boolean;
  activeTab: 'TOTAL' | 'CONVERTED' | 'LOST';
  onClose: () => void;
  onSelectTab: (tab: 'TOTAL' | 'CONVERTED' | 'LOST') => void;
}

const LOST_REASON_LABELS: Record<LostReason, string> = {
  PRICE_TOO_HIGH: 'Price Too High',
  COMPETITOR_WON: 'Competitor Won',
  CLIENT_BUDGET_ISSUE: 'Client Budget Issue',
  TECHNICAL_REQUIREMENT_CHANGE: 'Technical Requirement Change',
  PROJECT_CANCELLED: 'Project Cancelled',
  DELAYED_RESPONSE: 'Delayed Response',
  OTHER: 'Other / Custom Reason',
};

const STATUS_COLORS: Record<QuotationStatus, { bg: string; text: string; border: string }> = {
  DRAFT: { bg: 'rgba(148, 163, 184, 0.15)', text: '#94a3b8', border: '#64748b' },
  SENT: { bg: 'rgba(56, 189, 248, 0.15)', text: '#38bdf8', border: '#38bdf8' },
  UNDER_DISCUSSION: { bg: 'rgba(234, 179, 8, 0.15)', text: '#eab308', border: '#eab308' },
  NEGOTIATION: { bg: 'rgba(249, 115, 22, 0.15)', text: '#f97316', border: '#f97316' },
  APPROVED: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: '#10b981' },
  PARTIALLY_CONVERTED: { bg: 'rgba(168, 85, 247, 0.15)', text: '#a855f7', border: '#a855f7' },
  FULLY_CONVERTED: { bg: 'rgba(34, 197, 94, 0.2)', text: '#22c55e', border: '#22c55e' },
  LOST: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: '#ef4444' },
};

export const SalesKPIDetailsModal: React.FC<SalesKPIDetailsModalProps> = ({
  visible,
  activeTab,
  onClose,
  onSelectTab,
}) => {
  const { quotations } = useERP();

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [execFilter, setExecFilter] = useState<string>('ALL');

  // Detail View Submodal State
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);

  const formatCurrency = (val: number) => `₹${val.toLocaleString('en-IN')}`;

  // Unique list of Sales Executives
  const salesExecutives = useMemo(() => {
    const set = new Set<string>();
    quotations.forEach((q) => {
      if (q.salesExecutive) set.add(q.salesExecutive);
    });
    return Array.from(set);
  }, [quotations]);

  // General Metrics
  const totalQuotationsCount = quotations.length;
  const totalQuotationValue = quotations.reduce((acc, q) => acc + q.quotationAmount, 0);

  const convertedQuotations = useMemo(
    () => quotations.filter((q) => q.status === 'FULLY_CONVERTED' || q.status === 'PARTIALLY_CONVERTED' || (q.convertedOrderValue && q.convertedOrderValue > 0)),
    [quotations]
  );
  const totalConvertedValue = convertedQuotations.reduce((acc, q) => acc + (q.convertedOrderValue || 0), 0);
  const conversionRate = totalQuotationsCount > 0 ? Math.round((convertedQuotations.length / totalQuotationsCount) * 100) : 0;

  const lostQuotations = useMemo(
    () => quotations.filter((q) => q.status === 'LOST' || (q.lostValue && q.lostValue > 0)),
    [quotations]
  );
  const totalLostValue = lostQuotations.reduce((acc, q) => acc + (q.lostValue || 0), 0);

  const underNegotiationCount = quotations.filter((q) => q.status === 'NEGOTIATION' || q.status === 'UNDER_DISCUSSION').length;

  // Monthly Converted Trend
  const monthlyConvertedTrend = useMemo(() => {
    const monthlyMap: Record<string, { count: number; value: number }> = {};
    convertedQuotations.forEach((q) => {
      const month = q.quotationDate ? q.quotationDate.substring(0, 7) : 'Unknown';
      if (!monthlyMap[month]) monthlyMap[month] = { count: 0, value: 0 };
      monthlyMap[month].count += 1;
      monthlyMap[month].value += q.convertedOrderValue || 0;
    });
    return Object.entries(monthlyMap).sort((a, b) => b[0].localeCompare(a[0]));
  }, [convertedQuotations]);

  // Executive Converted Performance
  const executivePerformance = useMemo(() => {
    const execMap: Record<string, { total: number; convertedCount: number; convertedVal: number }> = {};
    quotations.forEach((q) => {
      const exec = q.salesExecutive || 'Unassigned';
      if (!execMap[exec]) execMap[exec] = { total: 0, convertedCount: 0, convertedVal: 0 };
      execMap[exec].total += 1;
      if (q.status === 'FULLY_CONVERTED' || q.status === 'PARTIALLY_CONVERTED' || (q.convertedOrderValue && q.convertedOrderValue > 0)) {
        execMap[exec].convertedCount += 1;
        execMap[exec].convertedVal += q.convertedOrderValue || 0;
      }
    });
    return Object.entries(execMap).map(([exec, data]) => ({
      executive: exec,
      total: data.total,
      convertedCount: data.convertedCount,
      convertedVal: data.convertedVal,
      rate: data.total > 0 ? Math.round((data.convertedCount / data.total) * 100) : 0,
    }));
  }, [quotations]);

  // Loss Reason Frequency Analysis
  const lossReasonBreakdown = useMemo(() => {
    const reasonMap: Record<LostReason, { count: number; value: number }> = {
      PRICE_TOO_HIGH: { count: 0, value: 0 },
      COMPETITOR_WON: { count: 0, value: 0 },
      CLIENT_BUDGET_ISSUE: { count: 0, value: 0 },
      TECHNICAL_REQUIREMENT_CHANGE: { count: 0, value: 0 },
      PROJECT_CANCELLED: { count: 0, value: 0 },
      DELAYED_RESPONSE: { count: 0, value: 0 },
      OTHER: { count: 0, value: 0 },
    };

    lostQuotations.forEach((q) => {
      const reason = q.lostReason || 'OTHER';
      if (reasonMap[reason]) {
        reasonMap[reason].count += 1;
        reasonMap[reason].value += q.lostValue || q.quotationAmount || 0;
      }
    });

    return Object.entries(reasonMap).map(([reason, data]) => ({
      reason: reason as LostReason,
      label: LOST_REASON_LABELS[reason as LostReason] || reason,
      count: data.count,
      value: data.value,
      pct: totalLostValue > 0 ? Math.round((data.value / totalLostValue) * 100) : 0,
    })).sort((a, b) => b.value - a.value);
  }, [lostQuotations, totalLostValue]);

  // Most Common Loss Reason
  const mostCommonLossReason = useMemo(() => {
    if (lossReasonBreakdown.length === 0 || lossReasonBreakdown[0].count === 0) return 'None';
    return lossReasonBreakdown[0].label;
  }, [lossReasonBreakdown]);

  // Monthly Lost Business Trend
  const monthlyLostTrend = useMemo(() => {
    const monthlyMap: Record<string, { count: number; value: number }> = {};
    lostQuotations.forEach((q) => {
      const dateStr = q.lostDate || q.quotationDate || 'Unknown';
      const month = dateStr.length >= 7 ? dateStr.substring(0, 7) : 'Unknown';
      if (!monthlyMap[month]) monthlyMap[month] = { count: 0, value: 0 };
      monthlyMap[month].count += 1;
      monthlyMap[month].value += q.lostValue || q.quotationAmount || 0;
    });
    return Object.entries(monthlyMap).sort((a, b) => b[0].localeCompare(a[0]));
  }, [lostQuotations]);

  // Filtered Quotation List for Tab 1 (Total Pipeline)
  const filteredTotalQuotations = useMemo(() => {
    return quotations.filter((q) => {
      if (statusFilter !== 'ALL' && q.status !== statusFilter) return false;
      if (execFilter !== 'ALL' && q.salesExecutive !== execFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        return (
          q.quotationNumber.toLowerCase().includes(query) ||
          q.clientCode.toLowerCase().includes(query) ||
          q.companyName.toLowerCase().includes(query) ||
          q.salesExecutive.toLowerCase().includes(query) ||
          (q.inquiryRef && q.inquiryRef.toLowerCase().includes(query)) ||
          q.contactPerson.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [quotations, statusFilter, execFilter, searchQuery]);

  // Filtered Converted List for Tab 2
  const filteredConvertedQuotations = useMemo(() => {
    return convertedQuotations.filter((q) => {
      if (execFilter !== 'ALL' && q.salesExecutive !== execFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        return (
          q.quotationNumber.toLowerCase().includes(query) ||
          q.clientCode.toLowerCase().includes(query) ||
          q.companyName.toLowerCase().includes(query) ||
          q.salesExecutive.toLowerCase().includes(query) ||
          (q.convertedOrderNumber && q.convertedOrderNumber.toLowerCase().includes(query))
        );
      }
      return true;
    });
  }, [convertedQuotations, execFilter, searchQuery]);

  // Filtered Lost List for Tab 3
  const filteredLostQuotations = useMemo(() => {
    return lostQuotations.filter((q) => {
      if (execFilter !== 'ALL' && q.salesExecutive !== execFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        return (
          q.quotationNumber.toLowerCase().includes(query) ||
          q.clientCode.toLowerCase().includes(query) ||
          q.companyName.toLowerCase().includes(query) ||
          q.salesExecutive.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [lostQuotations, execFilter, searchQuery]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Sales Quotation & Conversion Analytics</Text>
              <Text style={styles.headerSubTitle}>
                In-depth breakdown of quotations pipeline, converted sales revenue, and lost business metrics.
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Navigation Tabs Bar */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'TOTAL' && styles.tabItemActiveTeal]}
              onPress={() => onSelectTab('TOTAL')}
            >
              <Text style={[styles.tabText, activeTab === 'TOTAL' && styles.tabTextActiveTeal]}>
                📜 Total Quotations ({totalQuotationsCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'CONVERTED' && styles.tabItemActiveGreen]}
              onPress={() => onSelectTab('CONVERTED')}
            >
              <Text style={[styles.tabText, activeTab === 'CONVERTED' && styles.tabTextActiveGreen]}>
                💰 Converted Value ({formatCurrency(totalConvertedValue)})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'LOST' && styles.tabItemActiveOrange]}
              onPress={() => onSelectTab('LOST')}
            >
              <Text style={[styles.tabText, activeTab === 'LOST' && styles.tabTextActiveOrange]}>
                📉 Lost Business ({formatCurrency(totalLostValue)})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Body Content */}
          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* TAB 1: TOTAL QUOTATIONS */}
            {activeTab === 'TOTAL' && (
              <View style={{ gap: Spacing.md }}>
                {/* 4 Summary Cards */}
                <View style={styles.summaryGrid}>
                  <View style={[styles.summaryCard, { borderLeftColor: Colors.accentTeal }]}>
                    <Text style={styles.summaryVal}>{totalQuotationsCount}</Text>
                    <Text style={styles.summarySubVal}>{formatCurrency(totalQuotationValue)}</Text>
                    <Text style={styles.summaryLbl}>Total Pipeline</Text>
                  </View>

                  <View style={[styles.summaryCard, { borderLeftColor: Colors.roles.SALES }]}>
                    <Text style={[styles.summaryVal, { color: Colors.roles.SALES }]}>{underNegotiationCount}</Text>
                    <Text style={styles.summaryLbl}>Under Negotiation</Text>
                  </View>

                  <View style={[styles.summaryCard, { borderLeftColor: Colors.successBright }]}>
                    <Text style={[styles.summaryVal, { color: Colors.successBright }]}>{convertedQuotations.length}</Text>
                    <Text style={styles.summaryLbl}>Approved / Converted</Text>
                  </View>

                  <View style={[styles.summaryCard, { borderLeftColor: Colors.industrialOrange }]}>
                    <Text style={[styles.summaryVal, { color: Colors.industrialOrange }]}>{lostQuotations.length}</Text>
                    <Text style={styles.summaryLbl}>Lost Quotations</Text>
                  </View>
                </View>

                {/* Filters */}
                <View style={styles.filterCard}>
                  <View style={styles.filterRow}>
                    <TextInput
                      style={styles.searchInput}
                      placeholder="🔍 Search quotation #, client code, company name, executive..."
                      placeholderTextColor="#94a3b8"
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                  </View>

                  {/* Status & Executive Chips */}
                  <View style={{ gap: Spacing.xs, marginTop: Spacing.xs }}>
                    <View style={styles.chipRow}>
                      <Text style={styles.chipLabel}>Status:</Text>
                      <TouchableOpacity
                        style={[styles.chip, statusFilter === 'ALL' && styles.chipActive]}
                        onPress={() => setStatusFilter('ALL')}
                      >
                        <Text style={[styles.chipText, statusFilter === 'ALL' && styles.chipTextActive]}>ALL</Text>
                      </TouchableOpacity>
                      {['SENT', 'NEGOTIATION', 'APPROVED', 'FULLY_CONVERTED', 'LOST'].map((st) => (
                        <TouchableOpacity
                          key={st}
                          style={[styles.chip, statusFilter === st && styles.chipActive]}
                          onPress={() => setStatusFilter(st)}
                        >
                          <Text style={[styles.chipText, statusFilter === st && styles.chipTextActive]}>
                            {st.replace(/_/g, ' ')}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {salesExecutives.length > 0 && (
                      <View style={styles.chipRow}>
                        <Text style={styles.chipLabel}>Executive:</Text>
                        <TouchableOpacity
                          style={[styles.chip, execFilter === 'ALL' && styles.chipActive]}
                          onPress={() => setExecFilter('ALL')}
                        >
                          <Text style={[styles.chipText, execFilter === 'ALL' && styles.chipTextActive]}>ALL</Text>
                        </TouchableOpacity>
                        {salesExecutives.map((exec) => (
                          <TouchableOpacity
                            key={exec}
                            style={[styles.chip, execFilter === exec && styles.chipActive]}
                            onPress={() => setExecFilter(exec)}
                          >
                            <Text style={[styles.chipText, execFilter === exec && styles.chipTextActive]}>{exec}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </View>

                {/* Data Table */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.table}>
                    <View style={styles.thRow}>
                      <Text style={[styles.th, { width: 120 }]}>Quotation #</Text>
                      <Text style={[styles.th, { width: 95 }]}>Date</Text>
                      <Text style={[styles.th, { width: 100 }]}>Client Code</Text>
                      <Text style={[styles.th, { width: 180 }]}>Company Name</Text>
                      <Text style={[styles.th, { width: 130 }]}>Amount</Text>
                      <Text style={[styles.th, { width: 130 }]}>Executive</Text>
                      <Text style={[styles.th, { width: 130 }]}>Status</Text>
                      <Text style={[styles.th, { width: 100 }]}>Follow-Up</Text>
                      <Text style={[styles.th, { width: 80 }]}>Details</Text>
                    </View>

                    {filteredTotalQuotations.length === 0 ? (
                      <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No quotation records found matching search filters.</Text>
                      </View>
                    ) : (
                      filteredTotalQuotations.map((q) => {
                        const stStyle = STATUS_COLORS[q.status] || STATUS_COLORS.SENT;
                        return (
                          <View key={q.id} style={styles.trRow}>
                            <Text style={[styles.tdHighlight, { width: 120 }]}>{q.quotationNumber}</Text>
                            <Text style={[styles.tdSmall, { width: 95 }]}>{q.quotationDate}</Text>
                            <Text style={[styles.tdBold, { width: 100 }]}>{q.clientCode}</Text>

                            <View style={{ width: 180 }}>
                              <Text style={styles.tdBold} numberOfLines={1}>{q.companyName}</Text>
                              <Text style={styles.tdSub} numberOfLines={1}>{q.contactPerson}</Text>
                            </View>

                            <Text style={[styles.tdAmount, { width: 130 }]}>{formatCurrency(q.quotationAmount)}</Text>
                            <Text style={[styles.td, { width: 130 }]} numberOfLines={1}>{q.salesExecutive}</Text>

                            <View style={{ width: 130 }}>
                              <View style={[styles.statusBadge, { backgroundColor: stStyle.bg, borderColor: stStyle.border }]}>
                                <Text style={[styles.statusBadgeText, { color: stStyle.text }]}>
                                  {q.status.replace(/_/g, ' ')}
                                </Text>
                              </View>
                            </View>

                            <Text style={[styles.tdSmall, { width: 100 }]}>{q.followUpDate || 'None'}</Text>

                            <TouchableOpacity style={styles.viewBtn} onPress={() => setSelectedQuotation(q)}>
                              <Text style={styles.viewBtnText}>View ↗</Text>
                            </TouchableOpacity>
                          </View>
                        );
                      })
                    )}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* TAB 2: CONVERTED ORDERS VALUE */}
            {activeTab === 'CONVERTED' && (
              <View style={{ gap: Spacing.md }}>
                {/* 3 Summary Cards */}
                <View style={styles.summaryGrid}>
                  <View style={[styles.summaryCard, { borderLeftColor: Colors.successBright }]}>
                    <Text style={[styles.summaryVal, { color: Colors.successBright }]}>{formatCurrency(totalConvertedValue)}</Text>
                    <Text style={styles.summaryLbl}>Total Converted Revenue</Text>
                  </View>

                  <View style={[styles.summaryCard, { borderLeftColor: Colors.successBright }]}>
                    <Text style={[styles.summaryVal, { color: Colors.successBright }]}>{convertedQuotations.length}</Text>
                    <Text style={styles.summaryLbl}>Converted Orders Count</Text>
                  </View>

                  <View style={[styles.summaryCard, { borderLeftColor: Colors.accentTeal }]}>
                    <Text style={[styles.summaryVal, { color: Colors.accentTeal }]}>{conversionRate}%</Text>
                    <Text style={styles.summaryLbl}>Overall Conversion Rate</Text>
                  </View>
                </View>

                {/* Monthly & Executive Analytics Cards */}
                <View style={styles.analyticsSectionRow}>
                  {/* Monthly Trend */}
                  <View style={styles.analyticsCard}>
                    <Text style={styles.cardHeaderTitle}>📅 Monthly Conversion Trend</Text>
                    {monthlyConvertedTrend.length === 0 ? (
                      <Text style={styles.emptySubText}>No converted order history available yet.</Text>
                    ) : (
                      monthlyConvertedTrend.map(([month, data]) => (
                        <View key={month} style={styles.trendRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.trendMonthText}>{month}</Text>
                            <Text style={styles.trendSubText}>{data.count} Orders Converted</Text>
                          </View>
                          <Text style={styles.trendValText}>{formatCurrency(data.value)}</Text>
                        </View>
                      ))
                    )}
                  </View>

                  {/* Executive Performance */}
                  <View style={styles.analyticsCard}>
                    <Text style={styles.cardHeaderTitle}>👨‍💼 Sales Executive Conversion Rate</Text>
                    {executivePerformance.length === 0 ? (
                      <Text style={styles.emptySubText}>No executive records.</Text>
                    ) : (
                      executivePerformance.map((exec) => (
                        <View key={exec.executive} style={styles.trendRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.trendMonthText}>{exec.executive}</Text>
                            <Text style={styles.trendSubText}>{exec.convertedCount} of {exec.total} Converted ({exec.rate}%)</Text>
                          </View>
                          <Text style={styles.trendValGreen}>{formatCurrency(exec.convertedVal)}</Text>
                        </View>
                      ))
                    )}
                  </View>
                </View>

                {/* Converted Orders Table */}
                <View style={styles.filterCard}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="🔍 Search converted quotation #, PO #, client code, company name..."
                    placeholderTextColor="#94a3b8"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.table}>
                    <View style={styles.thRow}>
                      <Text style={[styles.th, { width: 120 }]}>Quotation #</Text>
                      <Text style={[styles.th, { width: 120 }]}>Order / PO #</Text>
                      <Text style={[styles.th, { width: 95 }]}>Date</Text>
                      <Text style={[styles.th, { width: 180 }]}>Company Name</Text>
                      <Text style={[styles.th, { width: 120 }]}>Quoted Amount</Text>
                      <Text style={[styles.th, { width: 130 }]}>Converted Value</Text>
                      <Text style={[styles.th, { width: 130 }]}>Executive</Text>
                      <Text style={[styles.th, { width: 80 }]}>Details</Text>
                    </View>

                    {filteredConvertedQuotations.length === 0 ? (
                      <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No converted quotation records found.</Text>
                      </View>
                    ) : (
                      filteredConvertedQuotations.map((q) => (
                        <View key={q.id} style={styles.trRow}>
                          <Text style={[styles.tdHighlight, { width: 120 }]}>{q.quotationNumber}</Text>
                          <Text style={[styles.tdBold, { width: 120, color: Colors.successBright }]}>
                            {q.convertedOrderNumber || `PO-${q.quotationNumber.replace('QT-', '')}`}
                          </Text>
                          <Text style={[styles.tdSmall, { width: 95 }]}>{q.quotationDate}</Text>
                          <View style={{ width: 180 }}>
                            <Text style={styles.tdBold} numberOfLines={1}>{q.companyName}</Text>
                            <Text style={styles.tdSub}>{q.clientCode}</Text>
                          </View>
                          <Text style={[styles.td, { width: 120 }]}>{formatCurrency(q.quotationAmount)}</Text>
                          <Text style={[styles.tdAmount, { width: 130, color: Colors.successBright }]}>
                            {formatCurrency(q.convertedOrderValue || q.quotationAmount)}
                          </Text>
                          <Text style={[styles.td, { width: 130 }]} numberOfLines={1}>{q.salesExecutive}</Text>
                          <TouchableOpacity style={styles.viewBtn} onPress={() => setSelectedQuotation(q)}>
                            <Text style={styles.viewBtnText}>View ↗</Text>
                          </TouchableOpacity>
                        </View>
                      ))
                    )}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* TAB 3: LOST BUSINESS VALUE */}
            {activeTab === 'LOST' && (
              <View style={{ gap: Spacing.md }}>
                {/* 3 Summary Cards */}
                <View style={styles.summaryGrid}>
                  <View style={[styles.summaryCard, { borderLeftColor: Colors.industrialOrange }]}>
                    <Text style={[styles.summaryVal, { color: Colors.industrialOrange }]}>{formatCurrency(totalLostValue)}</Text>
                    <Text style={styles.summaryLbl}>Total Lost Business Value</Text>
                  </View>

                  <View style={[styles.summaryCard, { borderLeftColor: Colors.industrialOrange }]}>
                    <Text style={[styles.summaryVal, { color: Colors.industrialOrange }]}>{lostQuotations.length}</Text>
                    <Text style={styles.summaryLbl}>Lost Quotations Count</Text>
                  </View>

                  <View style={[styles.summaryCard, { borderLeftColor: Colors.accentTeal }]}>
                    <Text style={[styles.summaryVal, { color: Colors.accentTeal, fontSize: 16 }]} numberOfLines={1}>
                      {mostCommonLossReason}
                    </Text>
                    <Text style={styles.summaryLbl}>Primary Cause of Loss</Text>
                  </View>
                </View>

                {/* Loss Reason Breakdown Analytics Cards */}
                <View style={styles.analyticsSectionRow}>
                  {/* Frequency per Reason */}
                  <View style={styles.analyticsCard}>
                    <Text style={styles.cardHeaderTitle}>📊 Loss Reason Breakdown</Text>
                    {lossReasonBreakdown.map((r) => (
                      <View key={r.reason} style={styles.reasonBreakdownRow}>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                            <Text style={styles.reasonLabelText}>{r.label}</Text>
                            <Text style={styles.reasonValText}>
                              {r.count} Lost • {formatCurrency(r.value)} ({r.pct}%)
                            </Text>
                          </View>
                          {/* Progress bar */}
                          <View style={styles.progressBarTrack}>
                            <View style={[styles.progressBarFill, { width: `${Math.min(100, Math.max(2, r.pct))}%` }]} />
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>

                  {/* Monthly Lost Trend */}
                  <View style={styles.analyticsCard}>
                    <Text style={styles.cardHeaderTitle}>📅 Monthly Loss Trend</Text>
                    {monthlyLostTrend.length === 0 ? (
                      <Text style={styles.emptySubText}>No lost quotations recorded.</Text>
                    ) : (
                      monthlyLostTrend.map(([month, data]) => (
                        <View key={month} style={styles.trendRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.trendMonthText}>{month}</Text>
                            <Text style={styles.trendSubText}>{data.count} Quotations Lost</Text>
                          </View>
                          <Text style={styles.trendValOrange}>{formatCurrency(data.value)}</Text>
                        </View>
                      ))
                    )}
                  </View>
                </View>

                {/* Lost Quotations Table */}
                <View style={styles.filterCard}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="🔍 Search lost quotation #, client code, company name, executive..."
                    placeholderTextColor="#94a3b8"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.table}>
                    <View style={styles.thRow}>
                      <Text style={[styles.th, { width: 120 }]}>Quotation #</Text>
                      <Text style={[styles.th, { width: 95 }]}>Date / Lost</Text>
                      <Text style={[styles.th, { width: 180 }]}>Company Name</Text>
                      <Text style={[styles.th, { width: 120 }]}>Original Quoted</Text>
                      <Text style={[styles.th, { width: 130 }]}>Lost Amount</Text>
                      <Text style={[styles.th, { width: 160 }]}>Primary Lost Reason</Text>
                      <Text style={[styles.th, { width: 130 }]}>Executive</Text>
                      <Text style={[styles.th, { width: 80 }]}>Details</Text>
                    </View>

                    {filteredLostQuotations.length === 0 ? (
                      <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No lost quotation records found.</Text>
                      </View>
                    ) : (
                      filteredLostQuotations.map((q) => (
                        <View key={q.id} style={styles.trRow}>
                          <Text style={[styles.tdHighlight, { width: 120 }]}>{q.quotationNumber}</Text>
                          <Text style={[styles.tdSmall, { width: 95 }]}>{q.lostDate || q.quotationDate}</Text>
                          <View style={{ width: 180 }}>
                            <Text style={styles.tdBold} numberOfLines={1}>{q.companyName}</Text>
                            <Text style={styles.tdSub}>{q.clientCode}</Text>
                          </View>
                          <Text style={[styles.td, { width: 120 }]}>{formatCurrency(q.quotationAmount)}</Text>
                          <Text style={[styles.tdAmount, { width: 130, color: Colors.industrialOrange }]}>
                            {formatCurrency(q.lostValue || q.quotationAmount)}
                          </Text>
                          <Text style={[styles.tdOrange, { width: 160 }]} numberOfLines={1}>
                            {q.lostReason ? LOST_REASON_LABELS[q.lostReason] : 'N/A'}
                          </Text>
                          <Text style={[styles.td, { width: 130 }]} numberOfLines={1}>{q.salesExecutive}</Text>
                          <TouchableOpacity style={styles.viewBtn} onPress={() => setSelectedQuotation(q)}>
                            <Text style={styles.viewBtnText}>View ↗</Text>
                          </TouchableOpacity>
                        </View>
                      ))
                    )}
                  </View>
                </ScrollView>
              </View>
            )}
          </ScrollView>

          {/* Submodal for Detailed View */}
          {selectedQuotation && (
            <Modal visible={!!selectedQuotation} transparent animationType="fade" onRequestClose={() => setSelectedQuotation(null)}>
              <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setSelectedQuotation(null)}>
                <TouchableOpacity activeOpacity={1} style={styles.subModalCard} onPress={(e) => e.stopPropagation()}>
                  <View style={styles.header}>
                    <Text style={styles.headerTitle}>Quotation Detail: {selectedQuotation.quotationNumber}</Text>
                    <TouchableOpacity onPress={() => setSelectedQuotation(null)}>
                      <Text style={styles.closeBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={{ maxHeight: 420 }}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Client Info:</Text>
                      <Text style={styles.detailValBold}>{selectedQuotation.clientCode} - {selectedQuotation.companyName}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Contact Person:</Text>
                      <Text style={styles.detailVal}>{selectedQuotation.contactPerson} ({selectedQuotation.mobileNumber})</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Sales Executive:</Text>
                      <Text style={styles.detailVal}>{selectedQuotation.salesExecutive}</Text>
                    </View>
                    <View style={styles.modalDivider} />
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Quotation Amount:</Text>
                      <Text style={styles.detailValHighlight}>{formatCurrency(selectedQuotation.quotationAmount)}</Text>
                    </View>

                    {selectedQuotation.convertedOrderValue !== undefined && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Converted Value:</Text>
                        <Text style={[styles.detailValBold, { color: Colors.successBright }]}>
                          {formatCurrency(selectedQuotation.convertedOrderValue)}
                        </Text>
                      </View>
                    )}

                    {selectedQuotation.lostValue !== undefined && selectedQuotation.lostValue > 0 && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Lost Value & Reason:</Text>
                        <Text style={[styles.detailValBold, { color: Colors.industrialOrange }]}>
                          {formatCurrency(selectedQuotation.lostValue)} • {selectedQuotation.lostReason ? LOST_REASON_LABELS[selectedQuotation.lostReason] : 'N/A'}
                        </Text>
                      </View>
                    )}

                    {selectedQuotation.lostRemarks && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Lost Remarks:</Text>
                        <Text style={styles.detailVal}>{selectedQuotation.lostRemarks}</Text>
                      </View>
                    )}
                  </ScrollView>

                  <TouchableOpacity style={styles.closeSubModalBtn} onPress={() => setSelectedQuotation(null)}>
                    <Text style={styles.closeSubModalText}>Close Record</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              </TouchableOpacity>
            </Modal>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalContainer: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    width: '100%',
    maxWidth: 950,
    maxHeight: '90%',
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    ...Shadows.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  headerTitle: {
    color: Colors.textLight,
    fontSize: 18,
    fontWeight: '800',
  },
  headerSubTitle: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  closeBtnText: {
    color: Colors.textSubtle,
    fontSize: 18,
    fontWeight: '800',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    backgroundColor: Colors.inputBg,
    padding: 4,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemActiveTeal: {
    backgroundColor: Colors.accentTeal,
  },
  tabItemActiveGreen: {
    backgroundColor: Colors.successBright,
  },
  tabItemActiveOrange: {
    backgroundColor: Colors.industrialOrange,
  },
  tabText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  tabTextActiveTeal: {
    color: Colors.white,
    fontWeight: '800',
  },
  tabTextActiveGreen: {
    color: Colors.white,
    fontWeight: '800',
  },
  tabTextActiveOrange: {
    color: Colors.white,
    fontWeight: '800',
  },
  scrollBody: {
    flex: 1,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    borderLeftWidth: 4,
    ...Shadows.sm,
  },
  summaryVal: {
    color: Colors.textLight,
    fontSize: 18,
    fontWeight: '800',
  },
  summarySubVal: {
    color: Colors.accentTeal,
    fontSize: 12,
    fontWeight: '700',
  },
  summaryLbl: {
    color: Colors.textSubtle,
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  filterCard: {
    backgroundColor: Colors.inputBg,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    fontSize: 12,
    color: Colors.textLight,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  chipLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    marginRight: 4,
  },
  chip: {
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    borderRadius: Radius.xs,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipActive: {
    backgroundColor: Colors.accentTeal,
    borderColor: Colors.accentTeal,
  },
  chipText: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  chipTextActive: {
    color: Colors.white,
  },
  table: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    overflow: 'hidden',
  },
  thRow: {
    flexDirection: 'row',
    backgroundColor: Colors.inputBg,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: 1,
    borderColor: Colors.borderDark,
  },
  th: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
  },
  trRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: 1,
    borderColor: Colors.borderDark,
  },
  tdHighlight: {
    color: Colors.accentTeal,
    fontSize: 12,
    fontWeight: '800',
  },
  tdSmall: {
    color: Colors.textSubtle,
    fontSize: 11,
  },
  tdBold: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '700',
  },
  tdSub: {
    color: Colors.textSubtle,
    fontSize: 10,
  },
  tdAmount: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '800',
  },
  tdOrange: {
    color: Colors.industrialOrange,
    fontSize: 11,
    fontWeight: '700',
  },
  td: {
    color: Colors.textLight,
    fontSize: 11,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  viewBtn: {
    backgroundColor: 'rgba(41, 88, 92, 0.12)',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 4,
    borderRadius: Radius.xs,
  },
  viewBtnText: {
    color: Colors.accentTeal,
    fontSize: 10,
    fontWeight: '800',
  },
  emptyContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textSubtle,
    fontSize: 12,
  },
  analyticsSectionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  analyticsCard: {
    flex: 1,
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  cardHeaderTitle: {
    color: Colors.textLight,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: Spacing.sm,
  },
  trendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: Colors.borderDark,
  },
  trendMonthText: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '700',
  },
  trendSubText: {
    color: Colors.textSubtle,
    fontSize: 10,
  },
  trendValText: {
    color: Colors.accentTeal,
    fontSize: 12,
    fontWeight: '800',
  },
  trendValGreen: {
    color: Colors.successBright,
    fontSize: 12,
    fontWeight: '800',
  },
  trendValOrange: {
    color: Colors.industrialOrange,
    fontSize: 12,
    fontWeight: '800',
  },
  reasonBreakdownRow: {
    marginBottom: Spacing.xs,
  },
  reasonLabelText: {
    color: Colors.textLight,
    fontSize: 11,
    fontWeight: '700',
  },
  reasonValText: {
    color: Colors.industrialOrange,
    fontSize: 10,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: Colors.inputBg,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.industrialOrange,
    borderRadius: 3,
  },
  emptySubText: {
    color: Colors.textSubtle,
    fontSize: 11,
    fontStyle: 'italic',
  },
  subModalCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    width: '100%',
    maxWidth: 500,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    ...Shadows.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  detailLabel: {
    color: Colors.textSubtle,
    fontSize: 12,
  },
  detailVal: {
    color: Colors.textLight,
    fontSize: 12,
  },
  detailValBold: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '700',
  },
  detailValHighlight: {
    color: Colors.accentTeal,
    fontSize: 14,
    fontWeight: '800',
  },
  modalDivider: {
    height: 1,
    backgroundColor: Colors.borderDark,
    marginVertical: Spacing.sm,
  },
  closeSubModalBtn: {
    backgroundColor: Colors.inputBg,
    paddingVertical: 10,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  closeSubModalText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
  },
});
