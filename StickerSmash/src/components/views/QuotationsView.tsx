import { DatePickerInput } from '../ui/DatePickerInput';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal, StyleSheet, useWindowDimensions } from 'react-native';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { Quotation, QuotationStatus, LostReason, FollowUpStatus } from '../../types';
import { Colors, Spacing, Radius, Shadows } from '../../theme';
import { SalesKPIDetailsModal } from '../dashboards/SalesKPIDetailsModal';
import { QuotationSentModal } from '../quotations/QuotationSentModal';
import { QuotationFollowUpModal } from '../quotations/QuotationFollowUpModal';
import { QuotationConversionModal, QuotationConversionData } from '../quotations/QuotationConversionModal';
import { ExportButton } from '../ui/ExportButton';
import { ExportDataPayload } from '../../utils/exportUtils';
import { formatDate } from '../../utils/formatUtils';

interface QuotationsViewProps {
  onOpenCreateQuotation?: () => void;
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

export const QuotationsView: React.FC<QuotationsViewProps> = ({ onOpenCreateQuotation }) => {
  const {
    quotations,
    updateQuotation,
    addQuotationFollowUp,
    convertQuotationToOrder,
    markQuotationLost,
    setSelectedOrder,
    deleteQuotation,
  } = useERP();
  const { currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [expandedQuotations, setExpandedQuotations] = useState<Record<string, boolean>>({});

  const toggleExpandQuotation = (id: string) => {
    setExpandedQuotations((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals State
  const [viewQuotation, setViewQuotation] = useState<Quotation | null>(null);
  const [editQuotation, setEditQuotation] = useState<Quotation | null>(null);
  const [lostQuotation, setLostQuotation] = useState<Quotation | null>(null);
  const [statusQuotation, setStatusQuotation] = useState<Quotation | null>(null);
  const [salesModalVisible, setSalesModalVisible] = useState(false);
  const [salesModalTab, setSalesModalTab] = useState<'TOTAL' | 'CONVERTED' | 'LOST'>('TOTAL');

  // Workflow Automation Modals
  const [sentModalQuotation, setSentModalQuotation] = useState<Quotation | null>(null);
  const [followUpModalQuotation, setFollowUpModalQuotation] = useState<Quotation | null>(null);
  const [followUpTargetStatus, setFollowUpTargetStatus] = useState<'UNDER_DISCUSSION' | 'NEGOTIATION'>('UNDER_DISCUSSION');
  const [conversionModalQuotation, setConversionModalQuotation] = useState<Quotation | null>(null);
  const [conversionError, setConversionError] = useState<string>('');
  const [competitorName, setCompetitorName] = useState('');

  const handleOpenSalesModal = (tab: 'TOTAL' | 'CONVERTED' | 'LOST') => {
    setSalesModalTab(tab);
    setSalesModalVisible(true);
  };

  // Edit Quotation Form State
  const [editCompanyName, setEditCompanyName] = useState('');
  const [editContact, setEditContact] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editExpVal, setEditExpVal] = useState('');
  const [editStatus, setEditStatus] = useState<QuotationStatus>('SENT');
  const [editFollowUpDate, setEditFollowUpDate] = useState('');
  const [editRemarks, setEditRemarks] = useState('');
  const [editError, setEditError] = useState('');

  // Lost Form State
  const [lostReason, setLostReason] = useState<LostReason>('PRICE_TOO_HIGH');
  const [lostValue, setLostValue] = useState('');
  const [lostDate, setLostDate] = useState(new Date().toISOString().split('T')[0]);
  const [lostRemarks, setLostRemarks] = useState('');
  const [lostError, setLostError] = useState('');

  // Formatting currency helper
  const formatCurrency = (val: number | string) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  // Analytics Calculations
  const totalQuotations = quotations.length;
  const totalQuotationValue = quotations.reduce((acc, q) => acc + Number(q.quotationAmount || 0), 0);

  const convertedQuotationsList = quotations.filter(
    (q) => q.status === 'FULLY_CONVERTED' || q.status === 'PARTIALLY_CONVERTED'
  );
  const convertedCount = convertedQuotationsList.length;
  const convertedValue = quotations.reduce((acc, q) => acc + Number(q.convertedOrderValue || 0), 0);
  const conversionRate = totalQuotations > 0 ? Math.round((convertedCount / totalQuotations) * 100) : 0;

  const lostQuotationsList = quotations.filter((q) => q.status === 'LOST');
  const lostCount = lostQuotationsList.length;
  const lostBusinessValue = quotations.reduce((acc, q) => acc + Number(q.lostValue || 0), 0);

  const negotiationCount = quotations.filter((q) => q.status === 'NEGOTIATION' || q.status === 'UNDER_DISCUSSION').length;
  const pendingFollowUpCount = quotations.filter(
    (q) => q.followUpDate && q.status !== 'FULLY_CONVERTED' && q.status !== 'LOST'
  ).length;

  // Filter Quotations
  const filteredQuotations = quotations.filter((q) => {
    if (statusFilter !== 'ALL' && q.status !== statusFilter) {
      return false;
    }
    if (debouncedQuery.trim()) {
      const query = debouncedQuery.toLowerCase().trim();
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

  // Handlers
  const handleOpenEdit = (q: Quotation) => {
    setEditQuotation(q);
    setEditCompanyName(q.companyName);
    setEditContact(q.contactPerson);
    setEditMobile(q.mobileNumber);
    setEditEmail(q.email);
    setEditAmount(String(q.quotationAmount));
    setEditExpVal(q.expectedOrderValue ? String(q.expectedOrderValue) : '');
    setEditStatus(q.status);
    setEditFollowUpDate(q.followUpDate || '');
    setEditRemarks(q.remarks || '');
    setEditError('');
  };

  const handleSaveEdit = async () => {
    if (!editQuotation) return;
    setEditError('');

    if (!editCompanyName.trim()) {
      setEditError('Company Name is required.');
      return;
    }
    if (!editAmount.trim() || isNaN(Number(editAmount))) {
      setEditError('Valid Quotation Amount is required.');
      return;
    }

    try {
      await updateQuotation(editQuotation.id, {
        companyName: editCompanyName.trim(),
        contactPerson: editContact.trim(),
        mobileNumber: editMobile.trim(),
        email: editEmail.trim(),
        quotationAmount: Number(editAmount),
        expectedOrderValue: editExpVal ? Number(editExpVal) : Number(editAmount),
        status: editStatus,
        followUpDate: editFollowUpDate.trim() || undefined,
        remarks: editRemarks.trim() || undefined,
      });
      setEditQuotation(null);
    } catch (err: any) {
      setEditError(err.message || 'Failed to update quotation.');
    }
  };


  const handleOpenLost = (q: Quotation) => {
    setLostQuotation(q);
    setLostReason('PRICE_TOO_HIGH');
    setLostValue(String(q.quotationAmount));
    setLostDate(new Date().toISOString().split('T')[0]);
    setCompetitorName(q.competitorName || '');
    setLostRemarks('');
    setLostError('');
  };

  const handleSaveLost = async () => {
    if (!lostQuotation) return;
    setLostError('');

    try {
      await markQuotationLost(lostQuotation.id, {
        lostReason,
        lostValue: lostValue ? Number(lostValue) : lostQuotation.quotationAmount,
        lostDate,
        lostRemarks: competitorName ? `Competitor: ${competitorName}. ${lostRemarks}` : lostRemarks,
      });
      await updateQuotation(lostQuotation.id, { competitorName });
      setLostQuotation(null);
    } catch (err: any) {
      setLostError(err.message || 'Failed to mark quotation as lost.');
    }
  };

  const handleSelectStatusChange = async (q: Quotation, newSt: QuotationStatus) => {
    setStatusQuotation(null);
    if (newSt === 'SENT') {
      setSentModalQuotation(q);
    } else if (newSt === 'UNDER_DISCUSSION') {
      setFollowUpTargetStatus('UNDER_DISCUSSION');
      setFollowUpModalQuotation(q);
    } else if (newSt === 'NEGOTIATION') {
      setFollowUpTargetStatus('NEGOTIATION');
      setFollowUpModalQuotation(q);
    } else if (newSt === 'APPROVED') {
      setConversionError('');
      setConversionModalQuotation(q);
    } else {
      await updateQuotation(q.id, { status: newSt });
    }
  };

  const handleSaveSentDetails = async (data: { sentVia: any; sentAt: string; sentNotes: string }) => {
    if (!sentModalQuotation) return;
    await updateQuotation(sentModalQuotation.id, {
      status: 'SENT',
      sentVia: data.sentVia,
      sentAt: data.sentAt,
      sentNotes: data.sentNotes,
    });
    setSentModalQuotation(null);
  };

  const handleSaveFollowUpDetails = async (data: {
    targetStatus: QuotationStatus;
    followUpDate: string;
    followUpTime?: string;
    notes: string;
    nextAction?: string;
    negotiationDate?: string;
    expectedClosureDate?: string;
  }) => {
    if (!followUpModalQuotation) return;
    await updateQuotation(followUpModalQuotation.id, {
      status: data.targetStatus,
      followUpDate: data.followUpDate,
      negotiationDate: data.negotiationDate,
      expectedClosureDate: data.expectedClosureDate,
    });

    await addQuotationFollowUp(followUpModalQuotation.id, {
      followUpDate: data.followUpDate,
      notes: data.notes,
      status: 'PENDING',
    });

    setFollowUpModalQuotation(null);
  };

  const handleSaveConversion = async (data: QuotationConversionData) => {
    if (!conversionModalQuotation) return;
    const q = conversionModalQuotation;

    try {
      // Directly call convertQuotationToOrder which properly:
      // 1. Sets quotation status to FULLY_CONVERTED or PARTIALLY_CONVERTED
      // 2. Stores convertedOrderValue, lostValue, convertedOrderId, convertedOrderNumber
      // 3. Creates the linked Order with correct pipeline flags
      const newOrder = await convertQuotationToOrder(q.id, {
        convertedOrderValue: data.approvedAmount,
        poNumber: `PO-${q.quotationNumber}`,
        technicalRequirements: q.remarks || data.finalRemarks,
        materialRequirements: data.finalRemarks || q.remarks || 'As per quotation specifications',
        requiredQuantity: data.requiredQuantity,
        purchaseRequired: data.purchaseRequired,
        productionRequired: data.productionRequired,
        qualityTestingRequired: data.qualityTestingRequired,
        dispatchRequired: data.dispatchRequired,
        customStages: data.customStages,
      });

      // If partial conversion, also log the lost reason
      if (data.lostReason) {
        await updateQuotation(q.id, {
          lostRemarks: data.lostRemarks || `Partial conversion — approved ${data.approvedAmount} of ${q.quotationAmount}`,
          competitorName: undefined,
        });
      }

      // Navigate to the new order
      if (newOrder) {
        setConversionModalQuotation(null);
        setSelectedOrder(newOrder);
      }
    } catch (err: any) {
      console.warn('Quotation conversion error:', err?.message);
      setConversionError(err?.message || 'Failed to convert quotation.');
    }
  };

  const handleUnlockQuotation = async (q: Quotation) => {
    await updateQuotation(q.id, { isLocked: false, status: 'DRAFT' });
  };

  const getQuotationsExportPayload = (): ExportDataPayload => {
    return {
      title: 'Quotations Management Report',
      filename: 'Quotations_Report',
      headers: ['Quotation No', 'Company Name', 'Contact Person', 'Mobile', 'Amount (₹)', 'Sales Exec', 'Status', 'Follow-up Date'],
      rows: filteredQuotations.map((q) => [
        q.quotationNumber,
        q.companyName,
        q.contactPerson,
        q.mobileNumber,
        q.quotationAmount,
        q.salesExecutive,
        q.status,
        q.followUpDate || 'N/A',
      ]),
    };
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Top Banner */}
      <View style={[styles.topBanner, isMobile && styles.topBannerMobile]}>
        <View style={{ flex: 1, paddingRight: isMobile ? 0 : Spacing.md }}>
          <Text style={styles.title}>Sales Quotation Management</Text>
          <Text style={styles.subTitle}>
            Inquiry tracking, quotation generation, follow-ups, order conversions, and lost business analytics.
          </Text>
        </View>
        <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 10 }, isMobile && { flexWrap: 'wrap', width: '100%', marginTop: 8 }]}>
          <ExportButton getData={getQuotationsExportPayload} buttonText="Export Quotations" />
          {onOpenCreateQuotation && (
            <TouchableOpacity style={styles.btnOrange} onPress={onOpenCreateQuotation}>
              <Text style={styles.btnText}>+ Create Quotation</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Analytics KPI Summary Grid */}
      <View style={[styles.kpiGrid, isMobile && { flexWrap: 'wrap', gap: Spacing.xs }]}>
        {/* Total Quotations */}
        <TouchableOpacity
          style={[styles.kpiCard, isMobile && { flex: undefined, width: '48%', padding: Spacing.md }]}
          activeOpacity={0.7}
          onPress={() => handleOpenSalesModal('TOTAL')}
        >
          <Text style={styles.kpiVal}>{totalQuotations}</Text>
          <Text style={styles.kpiValSub}>{formatCurrency(totalQuotationValue)}</Text>
          <Text style={styles.kpiLabel}>Total Pipeline ↗</Text>
          <View style={styles.kpiBadge}>
            <Text style={styles.kpiBadgeText}>{negotiationCount} Negotiation</Text>
          </View>
        </TouchableOpacity>

        {/* Converted Orders */}
        <TouchableOpacity
          style={[styles.kpiCard, isMobile && { flex: undefined, width: '48%', padding: Spacing.md }]}
          activeOpacity={0.7}
          onPress={() => handleOpenSalesModal('CONVERTED')}
        >
          <Text style={[styles.kpiVal, { color: Colors.successBright }]}>{convertedCount}</Text>
          <Text style={[styles.kpiValSub, { color: Colors.successBright }]}>{formatCurrency(convertedValue)}</Text>
          <Text style={styles.kpiLabel}>Converted ↗</Text>
          <View style={[styles.kpiBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: Colors.successBright }]}>
            <Text style={[styles.kpiBadgeText, { color: Colors.successBright }]}>{conversionRate}% Rate</Text>
          </View>
        </TouchableOpacity>

        {/* Lost Business */}
        <TouchableOpacity
          style={[styles.kpiCard, isMobile && { flex: undefined, width: '48%', padding: Spacing.md }]}
          activeOpacity={0.7}
          onPress={() => handleOpenSalesModal('LOST')}
        >
          <Text style={[styles.kpiVal, { color: Colors.industrialOrange }]}>{lostCount}</Text>
          <Text style={[styles.kpiValSub, { color: Colors.industrialOrange }]}>{formatCurrency(lostBusinessValue)}</Text>
          <Text style={styles.kpiLabel}>Lost Business ↗</Text>
          <View style={[styles.kpiBadge, { backgroundColor: 'rgba(179, 75, 32, 0.15)', borderColor: Colors.industrialOrange }]}>
            <Text style={[styles.kpiBadgeText, { color: Colors.industrialOrange }]}>Lost Recorded</Text>
          </View>
        </TouchableOpacity>

        {/* Pending Follow-Ups */}
        <TouchableOpacity
          style={[styles.kpiCard, isMobile && { flex: undefined, width: '48%', padding: Spacing.md }]}
          activeOpacity={0.7}
          onPress={() => handleOpenSalesModal('TOTAL')}
        >
          <Text style={[styles.kpiVal, { color: Colors.accentTeal }]}>{pendingFollowUpCount}</Text>
          <Text style={styles.kpiLabel}>Follow-Ups ↗</Text>
          <View style={[styles.kpiBadge, { backgroundColor: 'rgba(56, 189, 248, 0.15)', borderColor: Colors.accentTeal }]}>
            <Text style={[styles.kpiBadgeText, { color: Colors.accentTeal }]}>Action Req.</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Search & Filter Card */}
      <View style={styles.card}>
        <View style={styles.filterRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="🔍 Search quotation #, client code, company name..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <View style={styles.filterChipGroup}>
            <Text style={styles.filterLabel}>Status:</Text>
            <TouchableOpacity
              style={[styles.filterChip, statusFilter === 'ALL' && styles.filterChipActive]}
              onPress={() => setStatusFilter('ALL')}
            >
              <Text style={[styles.filterChipText, statusFilter === 'ALL' && styles.filterChipTextActive]}>ALL</Text>
            </TouchableOpacity>
            {['DRAFT', 'SENT', 'NEGOTIATION', 'APPROVED', 'FULLY_CONVERTED', 'LOST'].map((st) => (
              <TouchableOpacity
                key={st}
                style={[styles.filterChip, statusFilter === st && styles.filterChipActive]}
                onPress={() => setStatusFilter(st)}
              >
                <Text style={[styles.filterChipText, statusFilter === st && styles.filterChipTextActive]}>
                  {st.replace(/_/g, ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Table / Mobile Cards */}
        {isMobile ? (
          <View style={{ gap: Spacing.xs, marginTop: Spacing.md }}>
            {filteredQuotations.length === 0 ? (
              <Text style={styles.emptyText}>No quotations found matching selected filter.</Text>
            ) : (
              filteredQuotations.map((q) => {
                const stStyle = STATUS_COLORS[q.status] || STATUS_COLORS.SENT;
                const isExpanded = !!expandedQuotations[q.id];

                return (
                  <View key={q.id} style={styles.mobileCard}>
                    <TouchableOpacity
                      style={styles.mobileCardHeader}
                      onPress={() => toggleExpandQuotation(q.id)}
                      activeOpacity={0.7}
                    >
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.mobileCardTitle}>{q.quotationNumber}</Text>
                          <Text style={styles.mobileCardSubBadge}>{q.clientCode}</Text>
                        </View>
                        <Text style={styles.mobileCardSubtitle}>{q.companyName}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 4 }}>
                        <Text style={{ fontSize: 13, color: Colors.accentTeal, fontWeight: '800' }}>
                          {formatCurrency(q.quotationAmount)}
                        </Text>
                        <View style={[styles.statusBadge, { backgroundColor: stStyle.bg, borderColor: stStyle.border }]}>
                          <Text style={[styles.statusBadgeText, { color: stStyle.text, fontSize: 9 }]}>
                            {q.status.replace(/_/g, ' ')}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>

                    {isExpanded && (
                      <View style={styles.mobileCardBody}>
                        <Text style={styles.mobileCardDetail}>Contact: <Text style={styles.mobileCardVal}>{q.contactPerson} ({q.mobileNumber})</Text></Text>
                        <Text style={styles.mobileCardDetail}>Sales Exec: <Text style={styles.mobileCardVal}>{q.salesExecutive}</Text></Text>
                        <Text style={styles.mobileCardDetail}>Follow-Up: <Text style={styles.mobileCardVal}>{formatDate(q.followUpDate)}</Text></Text>
                        <Text style={styles.mobileCardDetail}>Date: <Text style={styles.mobileCardVal}>{formatDate(q.quotationDate)}</Text></Text>

                        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: Spacing.sm }}>
                          <TouchableOpacity style={styles.actBtnView} onPress={() => setViewQuotation(q)}>
                            <Text style={styles.actBtnText}>View</Text>
                          </TouchableOpacity>
                          {(!q.isLocked && q.status !== 'APPROVED' && q.status !== 'FULLY_CONVERTED') || isSuperAdmin ? (
                            <TouchableOpacity style={styles.actBtnEdit} onPress={() => handleOpenEdit(q)}>
                              <Text style={styles.actBtnText}>Edit</Text>
                            </TouchableOpacity>
                          ) : null}
                          {q.status !== 'LOST' && q.status !== 'FULLY_CONVERTED' && !q.isLocked && (
                            <TouchableOpacity style={styles.actBtnLost} onPress={() => handleOpenLost(q)}>
                              <Text style={styles.actBtnTextLost}>Mark Lost</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: Spacing.md }}>
            <View style={styles.table}>
              {/* Table Header */}
              <View style={styles.thRow}>
                <Text style={[styles.th, { width: 120 }]}>Quotation #</Text>
                <Text style={[styles.th, { width: 95 }]}>Date</Text>
                <Text style={[styles.th, { width: 95 }]}>Client Code</Text>
                <Text style={[styles.th, { width: 180 }]}>Client / Company Name</Text>
                <Text style={[styles.th, { width: 130 }]}>Quotation Amount</Text>
                <Text style={[styles.th, { width: 130 }]}>Sales Executive</Text>
                <Text style={[styles.th, { width: 130 }]}>Status</Text>
                <Text style={[styles.th, { width: 100 }]}>Follow-Up</Text>
                <Text style={[styles.th, { width: 270 }]}>Actions</Text>
              </View>

              {/* Body */}
              {filteredQuotations.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No quotations found matching selected filter.</Text>
                </View>
              ) : (
                filteredQuotations.map((q) => {
                  const stStyle = STATUS_COLORS[q.status] || STATUS_COLORS.SENT;

                  return (
                    <View key={q.id} style={styles.trRow}>
                      <Text style={[styles.tdHighlight, { width: 120 }]}>{q.quotationNumber}</Text>
                      <Text style={[styles.tdSmall, { width: 95 }]}>{formatDate(q.quotationDate)}</Text>
                      <Text style={[styles.tdBold, { width: 95 }]}>{q.clientCode}</Text>

                      <View style={{ width: 180 }}>
                        <Text style={styles.tdBold} numberOfLines={1}>{q.companyName}</Text>
                        <Text style={styles.tdSub} numberOfLines={1}>{q.contactPerson} ({q.mobileNumber})</Text>
                      </View>

                      <View style={{ width: 130 }}>
                        <Text style={[styles.tdAmount]}>{formatCurrency(q.quotationAmount)}</Text>
                        {q.convertedOrderValue ? (
                          <Text style={styles.convertedText}>Ord: {formatCurrency(q.convertedOrderValue)}</Text>
                        ) : null}
                      </View>

                      <Text style={[styles.td, { width: 130 }]} numberOfLines={1}>{q.salesExecutive}</Text>

                      {/* Status Badge */}
                      <View style={{ width: 130 }}>
                        {q.isLocked || q.status === 'APPROVED' || q.status === 'FULLY_CONVERTED' ? (
                          <View style={[styles.statusBadge, { backgroundColor: 'rgba(34, 197, 94, 0.15)', borderColor: '#22c55e' }]}>
                            <Text style={[styles.statusBadgeText, { color: '#22c55e' }]}>
                              {q.status.replace(/_/g, ' ')} 🔒
                            </Text>
                          </View>
                        ) : (
                          <TouchableOpacity onPress={() => setStatusQuotation(q)}>
                            <View style={[styles.statusBadge, { backgroundColor: stStyle.bg, borderColor: stStyle.border }]}>
                              <Text style={[styles.statusBadgeText, { color: stStyle.text }]}>
                                {q.status.replace(/_/g, ' ')} ▾
                              </Text>
                            </View>
                          </TouchableOpacity>
                        )}
                        {q.sentVia ? (
                          <Text style={{ fontSize: 10, color: Colors.accentTeal, fontWeight: '700', marginTop: 2 }}>
                            Sent via {q.sentVia}
                          </Text>
                        ) : null}
                      </View>

                      {/* Follow-Up Date */}
                      <Text style={[styles.tdSmall, { width: 100 }]}>{formatDate(q.followUpDate)}</Text>

                      {/* Actions Column (Cleaned Up: View, Edit/Locked, Mark Lost, Unlock) */}
                      <View style={{ width: 270, flexDirection: 'row', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                        <TouchableOpacity style={styles.actBtnView} onPress={() => setViewQuotation(q)}>
                          <Text style={styles.actBtnText}>View</Text>
                        </TouchableOpacity>

                        {(!q.isLocked && q.status !== 'APPROVED' && q.status !== 'FULLY_CONVERTED') || isSuperAdmin ? (
                          <TouchableOpacity style={styles.actBtnEdit} onPress={() => handleOpenEdit(q)}>
                            <Text style={styles.actBtnText}>Edit</Text>
                          </TouchableOpacity>
                        ) : (
                          <View style={{ backgroundColor: 'rgba(148, 163, 184, 0.1)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: Radius.xs, borderWidth: 1, borderColor: Colors.borderDark }}>
                            <Text style={{ color: Colors.textMuted, fontSize: 10, fontWeight: '700' }}>
                              Converted To Order - Locked
                            </Text>
                          </View>
                        )}

                        {q.status !== 'LOST' && q.status !== 'FULLY_CONVERTED' && !q.isLocked && (
                          <TouchableOpacity style={styles.actBtnLost} onPress={() => handleOpenLost(q)}>
                            <Text style={styles.actBtnTextLost}>Mark Lost</Text>
                          </TouchableOpacity>
                        )}

                        {isSuperAdmin && (q.isLocked || q.status === 'APPROVED' || q.status === 'FULLY_CONVERTED') && (
                          <TouchableOpacity
                            style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.xs, borderWidth: 1, borderColor: '#f59e0b' }}
                            onPress={() => handleUnlockQuotation(q)}
                          >
                            <Text style={{ color: '#f59e0b', fontSize: 10, fontWeight: '800' }}>🔓 Unlock</Text>
                          </TouchableOpacity>
                        )}
                        
                        {isSuperAdmin && (
                          <TouchableOpacity
                            style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.xs, borderWidth: 1, borderColor: '#ef4444', marginLeft: 4 }}
                            onPress={async (e) => {
                              e.stopPropagation();
                              if (window.confirm(`Delete quotation ${q.quotationNumber}?`)) {
                                await deleteQuotation(q.id);
                              }
                            }}
                          >
                            <Text style={{ color: '#ef4444', fontSize: 10, fontWeight: '800' }}>🗑 Delete</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </ScrollView>
        )}
      </View>

      {/* MODAL 1: VIEW QUOTATION DETAILS */}
      {viewQuotation && (
        <Modal visible={!!viewQuotation} transparent animationType="fade" onRequestClose={() => setViewQuotation(null)}>
          <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setViewQuotation(null)}>
            <TouchableOpacity activeOpacity={1} style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Quotation Record: {viewQuotation.quotationNumber}</Text>
                <TouchableOpacity onPress={() => setViewQuotation(null)}>
                  <Text style={styles.closeBtn}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 460 }}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Client Code & Name:</Text>
                  <Text style={styles.detailValBold}>{viewQuotation.clientCode} - {viewQuotation.companyName}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Contact Person & Mobile:</Text>
                  <Text style={styles.detailVal}>{viewQuotation.contactPerson} ({viewQuotation.mobileNumber})</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email & Inquiry Ref:</Text>
                  <Text style={styles.detailVal}>{viewQuotation.email} • {viewQuotation.inquiryRef || 'N/A'}</Text>
                </View>

                <View style={styles.modalDivider} />

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total Quotation Value:</Text>
                  <Text style={styles.detailValHighlight}>{formatCurrency(viewQuotation.quotationAmount)}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Expected Order Value:</Text>
                  <Text style={styles.detailVal}>{formatCurrency(viewQuotation.expectedOrderValue || viewQuotation.quotationAmount)}</Text>
                </View>

                {viewQuotation.convertedOrderValue !== undefined && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Converted Order Value:</Text>
                    <Text style={[styles.detailValBold, { color: Colors.successBright }]}>
                      {formatCurrency(viewQuotation.convertedOrderValue)}
                    </Text>
                  </View>
                )}

                {viewQuotation.lostValue !== undefined && viewQuotation.lostValue > 0 && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Lost Value:</Text>
                    <Text style={[styles.detailValBold, { color: Colors.industrialOrange }]}>
                      {formatCurrency(viewQuotation.lostValue)}
                    </Text>
                  </View>
                )}

                {viewQuotation.lostReason && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Lost Reason:</Text>
                    <Text style={[styles.detailValBold, { color: Colors.industrialOrange }]}>
                      {LOST_REASON_LABELS[viewQuotation.lostReason]}
                    </Text>
                  </View>
                )}

                {viewQuotation.lostRemarks && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Lost Remarks:</Text>
                    <Text style={styles.detailVal}>{viewQuotation.lostRemarks}</Text>
                  </View>
                )}

                <View style={styles.modalDivider} />

                <Text style={styles.sectionHeaderTitle}>Follow-Up History & Activity Log</Text>
                {viewQuotation.followUps && viewQuotation.followUps.length > 0 ? (
                  viewQuotation.followUps.map((f, i) => (
                    <View key={i} style={styles.fupHistoryCard}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={styles.fupDateText}>📅 Date: {f.followUpDate} ({f.status})</Text>
                        <Text style={styles.fupByText}>by {f.createdByName}</Text>
                      </View>
                      <Text style={styles.fupNotesText}>&quot;{f.notes}&quot;</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptySubText}>No follow-up logs recorded yet.</Text>
                )}
              </ScrollView>

              <TouchableOpacity style={styles.closeModalBtn} onPress={() => setViewQuotation(null)}>
                <Text style={styles.closeModalBtnText}>Close Record</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}

      {/* MODAL 2: EDIT QUOTATION */}
      {editQuotation && (
        <Modal visible={!!editQuotation} transparent animationType="fade" onRequestClose={() => setEditQuotation(null)}>
          <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setEditQuotation(null)}>
            <TouchableOpacity activeOpacity={1} style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Quotation: {editQuotation.quotationNumber}</Text>
                <TouchableOpacity onPress={() => setEditQuotation(null)}>
                  <Text style={styles.closeBtn}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 440 }}>
                {editError ? (
                  <View style={styles.errorBox}><Text style={styles.errorText}>⚠️ {editError}</Text></View>
                ) : null}

                <Text style={styles.inputLabel}>Company Name *</Text>
                <TextInput style={styles.input} value={editCompanyName} onChangeText={setEditCompanyName} />

                <Text style={styles.inputLabel}>Contact Person</Text>
                <TextInput style={styles.input} value={editContact} onChangeText={setEditContact} />

                <Text style={styles.inputLabel}>Mobile Number</Text>
                <TextInput style={styles.input} value={editMobile} onChangeText={setEditMobile} keyboardType="phone-pad" />

                <Text style={styles.inputLabel}>Email Address</Text>
                <TextInput style={styles.input} value={editEmail} onChangeText={setEditEmail} keyboardType="email-address" />

                <Text style={styles.inputLabel}>Total Quotation Amount (₹) *</Text>
                <TextInput style={styles.input} value={editAmount} onChangeText={setEditAmount} keyboardType="numeric" />

                <Text style={styles.inputLabel}>Expected Order Value (₹)</Text>
                <TextInput style={styles.input} value={editExpVal} onChangeText={setEditExpVal} keyboardType="numeric" />

                <Text style={styles.inputLabel}>Next Follow-Up Date</Text>
                <DatePickerInput value={editFollowUpDate} onChangeDate={setEditFollowUpDate} />

                <Text style={styles.inputLabel}>Remarks & Notes</Text>
                <TextInput style={[styles.input, { height: 50 }]} multiline value={editRemarks} onChangeText={setEditRemarks} />

                <TouchableOpacity style={styles.submitBtn} onPress={handleSaveEdit}>
                  <Text style={styles.submitBtnText}>✓ Save Quotation Changes</Text>
                </TouchableOpacity>
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}



      {/* MODAL 5: MARK LOST */}
      {lostQuotation && (
        <Modal visible={!!lostQuotation} transparent animationType="fade" onRequestClose={() => setLostQuotation(null)}>
          <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setLostQuotation(null)}>
            <TouchableOpacity activeOpacity={1} style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Mark Lost: {lostQuotation.quotationNumber}</Text>
                <TouchableOpacity onPress={() => setLostQuotation(null)}>
                  <Text style={styles.closeBtn}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 440 }}>
                {lostError ? <View style={styles.errorBox}><Text style={styles.errorText}>⚠️ {lostError}</Text></View> : null}

                <Text style={styles.inputLabel}>Primary Lost Reason *</Text>
                <View style={styles.reasonGrid}>
                  {(Object.keys(LOST_REASON_LABELS) as LostReason[]).map((r) => {
                    const isSel = lostReason === r;
                    return (
                      <TouchableOpacity
                        key={r}
                        style={[styles.chip, isSel && styles.chipLostActive]}
                        onPress={() => setLostReason(r)}
                      >
                        <Text style={[styles.chipText, isSel && styles.chipTextActive]}>{LOST_REASON_LABELS[r]}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.inputLabel}>Competitor Name (If Lost To Competitor)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Jindal Steel, L&T Valves, Precision Forge"
                  placeholderTextColor="#94a3b8"
                  value={competitorName}
                  onChangeText={setCompetitorName}
                />

                <Text style={styles.inputLabel}>Lost Business Value (₹)</Text>
                <TextInput style={styles.input} value={lostValue} onChangeText={setLostValue} keyboardType="numeric" />

                <Text style={styles.inputLabel}>Lost Date</Text>
                <DatePickerInput value={lostDate} onChangeDate={setLostDate} />

                <Text style={styles.inputLabel}>Detailed Lost Remarks & Competitor Feedback</Text>
                <TextInput style={[styles.input, { height: 60 }]} multiline value={lostRemarks} onChangeText={setLostRemarks} />

                <TouchableOpacity style={styles.submitBtnRed} onPress={handleSaveLost}>
                  <Text style={styles.submitBtnText}>❌ Confirm & Log Lost Quotation</Text>
                </TouchableOpacity>
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}

      {/* MODAL 6: QUICK STATUS SELECTOR */}
      {statusQuotation && (
        <Modal visible={!!statusQuotation} transparent animationType="fade" onRequestClose={() => setStatusQuotation(null)}>
          <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setStatusQuotation(null)}>
            <TouchableOpacity activeOpacity={1} style={[styles.modalCard, { maxWidth: 360 }]} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Update Status: {statusQuotation.quotationNumber}</Text>
                <TouchableOpacity onPress={() => setStatusQuotation(null)}>
                  <Text style={styles.closeBtn}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={{ gap: Spacing.xs }}>
                {(['DRAFT', 'SENT', 'UNDER_DISCUSSION', 'NEGOTIATION', 'APPROVED'] as const).map((st) => (
                  <TouchableOpacity
                    key={st}
                    style={[styles.statusOptionBtn, statusQuotation.status === st && styles.statusOptionBtnActive]}
                    onPress={() => handleSelectStatusChange(statusQuotation, st)}
                  >
                    <Text style={[styles.statusOptionText, statusQuotation.status === st && styles.statusOptionTextActive]}>
                      {st.replace(/_/g, ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Workflow Automation Popup Modals */}
      <QuotationSentModal
        visible={!!sentModalQuotation}
        quotation={sentModalQuotation}
        onClose={() => setSentModalQuotation(null)}
        onSave={handleSaveSentDetails}
      />

      <QuotationFollowUpModal
        visible={!!followUpModalQuotation}
        quotation={followUpModalQuotation}
        targetStatus={followUpTargetStatus}
        onClose={() => setFollowUpModalQuotation(null)}
        onSave={handleSaveFollowUpDetails}
      />

      <QuotationConversionModal
        visible={!!conversionModalQuotation}
        quotation={conversionModalQuotation}
        onClose={() => setConversionModalQuotation(null)}
        onSubmitConversion={handleSaveConversion}
        externalError={conversionError}
      />

      {/* Sales KPI Details Modal */}
      <SalesKPIDetailsModal
        visible={salesModalVisible}
        activeTab={salesModalTab}
        onClose={() => setSalesModalVisible(false)}
        onSelectTab={setSalesModalTab}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBanner: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    padding: Spacing.px18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    ...Shadows.sm,
  },
  topBannerMobile: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  title: {
    color: Colors.textLight,
    fontSize: 18,
    fontWeight: '800',
  },
  subTitle: {
    color: Colors.accentTeal,
    fontSize: 12,
    marginTop: 2,
  },
  btnOrange: {
    backgroundColor: Colors.industrialOrange,
    paddingHorizontal: Spacing.px14,
    paddingVertical: Spacing.px10,
    borderRadius: Radius.md,
    ...Shadows.glowOrange,
  },
  btnText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    ...Shadows.sm,
  },
  kpiVal: {
    color: Colors.textLight,
    fontSize: 22,
    fontWeight: '900',
  },
  kpiValSub: {
    color: Colors.accentTeal,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  kpiLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  kpiBadge: {
    backgroundColor: Colors.inputBg,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 3,
    borderRadius: Radius.xs,
    alignSelf: 'flex-start',
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  kpiBadgeText: {
    color: Colors.accentTeal,
    fontSize: 10,
    fontWeight: '700',
  },
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  searchInput: {
    flex: 1,
    minWidth: 260,
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
    color: Colors.textLight,
    fontSize: 13,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  filterChipGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  filterLabel: {
    color: Colors.accentTeal,
    fontSize: 11,
    fontWeight: '700',
    marginRight: 4,
  },
  filterChip: {
    backgroundColor: Colors.inputBg,
    paddingHorizontal: Spacing.px10,
    paddingVertical: Spacing.px6,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  filterChipActive: {
    backgroundColor: Colors.accentTeal,
    borderColor: Colors.accentTeal,
  },
  filterChipText: {
    color: Colors.textSubtle,
    fontSize: 11,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: Colors.white,
    fontWeight: '800',
  },
  table: {
    minWidth: 1180,
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
  tdHighlight: {
    color: Colors.accentTeal,
    fontSize: 12,
    fontWeight: '800',
  },
  tdBold: {
    color: Colors.textLight,
    fontSize: 13,
    fontWeight: '700',
  },
  tdSub: {
    color: Colors.textSubtle,
    fontSize: 10,
  },
  tdAmount: {
    color: Colors.textLight,
    fontSize: 13,
    fontWeight: '800',
  },
  convertedText: {
    color: Colors.successBright,
    fontSize: 10,
    fontWeight: '700',
  },
  td: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  tdSmall: {
    color: Colors.textSubtle,
    fontSize: 11,
  },
  statusBadge: {
    paddingHorizontal: Spacing.px6,
    paddingVertical: 3,
    borderRadius: Radius.xs,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  emptyContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  actBtnView: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: Colors.accentTeal,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },
  actBtnEdit: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    borderWidth: 1,
    borderColor: '#eab308',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },
  actBtnFup: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderWidth: 1,
    borderColor: '#a855f7',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },
  actBtnConvert: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderWidth: 1,
    borderColor: Colors.successBright,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },
  actBtnLost: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#ef4444',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },
  actBtnText: {
    color: Colors.textLight,
    fontSize: 10,
    fontWeight: '700',
  },
  actBtnTextBold: {
    color: Colors.successBright,
    fontSize: 10,
    fontWeight: '800',
  },
  actBtnTextLost: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: '700',
  },
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    maxHeight: '90%',
    width: '100%',
    maxWidth: 560,
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    ...Shadows.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDark,
    paddingBottom: Spacing.sm,
  },
  modalTitle: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: '800',
  },
  closeBtn: {
    color: Colors.accentTeal,
    fontSize: 16,
    fontWeight: '800',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  detailLabel: {
    color: Colors.accentTeal,
    fontSize: 12,
    fontWeight: '700',
  },
  detailVal: {
    color: Colors.textLight,
    fontSize: 12,
  },
  detailValBold: {
    color: Colors.textLight,
    fontSize: 13,
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
    marginVertical: Spacing.md,
  },
  sectionHeaderTitle: {
    color: Colors.textLight,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: Spacing.xs,
  },
  fupHistoryCard: {
    backgroundColor: Colors.inputBg,
    padding: Spacing.sm,
    borderRadius: Radius.sm,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  fupDateText: {
    color: Colors.accentTeal,
    fontSize: 11,
    fontWeight: '700',
  },
  fupByText: {
    color: Colors.textSubtle,
    fontSize: 10,
  },
  fupNotesText: {
    color: Colors.textLight,
    fontSize: 12,
    marginTop: 2,
    fontStyle: 'italic',
  },
  emptySubText: {
    color: Colors.textSubtle,
    fontSize: 11,
  },
  closeModalBtn: {
    backgroundColor: Colors.inputBg,
    paddingVertical: Spacing.px10,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  closeModalBtnText: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '700',
  },
  inputLabel: {
    color: Colors.accentTeal,
    fontSize: 12,
    fontWeight: '700',
    marginTop: Spacing.xs,
    marginBottom: 2,
  },
  input: {
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
    color: Colors.textLight,
    fontSize: 13,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  statusChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  chip: {
    backgroundColor: Colors.inputBg,
    paddingHorizontal: Spacing.px10,
    paddingVertical: 5,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  chipActive: {
    backgroundColor: Colors.accentTeal,
    borderColor: Colors.accentTeal,
  },
  chipLostActive: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  chipText: {
    color: Colors.textSubtle,
    fontSize: 10,
    fontWeight: '700',
  },
  chipTextActive: {
    color: Colors.white,
    fontWeight: '800',
  },
  submitBtn: {
    backgroundColor: Colors.industrialOrange,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: Spacing.md,
    ...Shadows.glowOrange,
  },
  submitBtnGreen: {
    backgroundColor: Colors.successBright,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  submitBtnRed: {
    backgroundColor: '#ef4444',
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  submitBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  infoBanner: {
    backgroundColor: Colors.inputBg,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    marginBottom: Spacing.sm,
  },
  infoBannerText: {
    color: Colors.textLight,
    fontSize: 12,
  },
  partialBox: {
    backgroundColor: 'rgba(179, 75, 32, 0.1)',
    padding: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.industrialOrange,
    marginVertical: Spacing.xs,
  },
  partialText: {
    color: Colors.textLight,
    fontSize: 11,
  },
  reasonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginVertical: 4,
  },
  statusOptionBtn: {
    backgroundColor: Colors.inputBg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    alignItems: 'center',
  },
  statusOptionBtnActive: {
    backgroundColor: Colors.accentTeal,
    borderColor: Colors.accentTeal,
  },
  statusOptionText: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '700',
  },
  statusOptionTextActive: {
    color: Colors.white,
    fontWeight: '800',
  },
  errorBox: {
    backgroundColor: 'rgba(179, 75, 32, 0.1)',
    padding: Spacing.px10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.industrialOrange,
    marginBottom: Spacing.sm,
  },
  errorText: {
    color: Colors.industrialOrange,
    fontSize: 12,
    fontWeight: '700',
  },
  successBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: Spacing.px10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.successBright,
    marginBottom: Spacing.sm,
  },
  successText: {
    color: Colors.successBright,
    fontSize: 12,
    fontWeight: '700',
  },
  mobileCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  mobileCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    backgroundColor: Colors.cardBg,
  },
  mobileCardTitle: {
    color: Colors.accentTeal,
    fontSize: 14,
    fontWeight: '800',
  },
  mobileCardSubBadge: {
    color: Colors.textLight,
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: Colors.inputBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  mobileCardSubtitle: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  mobileCardBody: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderDark,
    backgroundColor: Colors.inputBg,
  },
  mobileCardDetail: {
    color: Colors.textMuted,
    fontSize: 12,
    marginBottom: 4,
  },
  mobileCardVal: {
    color: Colors.textLight,
    fontWeight: '700',
  },
});
