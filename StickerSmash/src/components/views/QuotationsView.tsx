import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal, StyleSheet } from 'react-native';
import { useERP } from '../../context/ERPContext';
import { Quotation, QuotationStatus, LostReason, FollowUpStatus } from '../../types';
import { Colors, Spacing, Radius, Shadows } from '../../theme';
import { SalesKPIDetailsModal } from '../dashboards/SalesKPIDetailsModal';

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
  } = useERP();

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals State
  const [viewQuotation, setViewQuotation] = useState<Quotation | null>(null);
  const [editQuotation, setEditQuotation] = useState<Quotation | null>(null);
  const [followUpQuotation, setFollowUpQuotation] = useState<Quotation | null>(null);
  const [convertQuotation, setConvertQuotation] = useState<Quotation | null>(null);
  const [lostQuotation, setLostQuotation] = useState<Quotation | null>(null);
  const [statusQuotation, setStatusQuotation] = useState<Quotation | null>(null);
  const [salesModalVisible, setSalesModalVisible] = useState(false);
  const [salesModalTab, setSalesModalTab] = useState<'TOTAL' | 'CONVERTED' | 'LOST'>('TOTAL');

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

  // Follow Up Form State
  const [fupDate, setFupDate] = useState(new Date().toISOString().split('T')[0]);
  const [fupNotes, setFupNotes] = useState('');
  const [fupStatus, setFupStatus] = useState<FollowUpStatus>('COMPLETED');
  const [fupError, setFupError] = useState('');

  // Convert Form State
  const [convertVal, setConvertVal] = useState('');
  const [convertPoNum, setConvertPoNum] = useState('');
  const [convertQty, setConvertQty] = useState('50');
  const [convertTech, setConvertTech] = useState('');
  const [convertError, setConvertError] = useState('');
  const [convertSuccess, setConvertSuccess] = useState('');

  // Lost Form State
  const [lostReason, setLostReason] = useState<LostReason>('PRICE_TOO_HIGH');
  const [lostValue, setLostValue] = useState('');
  const [lostDate, setLostDate] = useState(new Date().toISOString().split('T')[0]);
  const [lostRemarks, setLostRemarks] = useState('');
  const [lostError, setLostError] = useState('');

  // Formatting currency helper
  const formatCurrency = (val: number) => `₹${val.toLocaleString('en-IN')}`;

  // Analytics Calculations
  const totalQuotations = quotations.length;
  const totalQuotationValue = quotations.reduce((acc, q) => acc + q.quotationAmount, 0);

  const convertedQuotationsList = quotations.filter(
    (q) => q.status === 'FULLY_CONVERTED' || q.status === 'PARTIALLY_CONVERTED'
  );
  const convertedCount = convertedQuotationsList.length;
  const convertedValue = quotations.reduce((acc, q) => acc + (q.convertedOrderValue || 0), 0);
  const conversionRate = totalQuotations > 0 ? Math.round((convertedCount / totalQuotations) * 100) : 0;

  const lostQuotationsList = quotations.filter((q) => q.status === 'LOST');
  const lostCount = lostQuotationsList.length;
  const lostBusinessValue = quotations.reduce((acc, q) => acc + (q.lostValue || 0), 0);

  const negotiationCount = quotations.filter((q) => q.status === 'NEGOTIATION' || q.status === 'UNDER_DISCUSSION').length;
  const pendingFollowUpCount = quotations.filter(
    (q) => q.followUpDate && q.status !== 'FULLY_CONVERTED' && q.status !== 'LOST'
  ).length;

  // Filter Quotations
  const filteredQuotations = quotations.filter((q) => {
    if (statusFilter !== 'ALL' && q.status !== statusFilter) {
      return false;
    }
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

  const handleSaveEdit = () => {
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
      updateQuotation(editQuotation.id, {
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

  const handleOpenFollowUp = (q: Quotation) => {
    setFollowUpQuotation(q);
    setFupDate(new Date().toISOString().split('T')[0]);
    setFupNotes('');
    setFupStatus('COMPLETED');
    setFupError('');
  };

  const handleSaveFollowUp = () => {
    if (!followUpQuotation) return;
    setFupError('');
    if (!fupNotes.trim()) {
      setFupError('Follow-up notes are required.');
      return;
    }

    try {
      addQuotationFollowUp(followUpQuotation.id, {
        followUpDate: fupDate,
        notes: fupNotes,
        status: fupStatus,
      });
      setFollowUpQuotation(null);
    } catch (err: any) {
      setFupError(err.message || 'Failed to record follow-up.');
    }
  };

  const handleOpenConvert = (q: Quotation) => {
    setConvertQuotation(q);
    setConvertVal(String(q.quotationAmount));
    setConvertPoNum(`PO-${q.quotationNumber.replace('QT-', '')}`);
    setConvertQty('50');
    setConvertTech(q.remarks || '');
    setConvertError('');
    setConvertSuccess('');
  };

  const handleSaveConvert = () => {
    if (!convertQuotation) return;
    setConvertError('');
    setConvertSuccess('');

    const val = Number(convertVal);
    if (isNaN(val) || val <= 0) {
      setConvertError('Please enter a valid converted order value.');
      return;
    }

    try {
      const createdOrd = convertQuotationToOrder(convertQuotation.id, {
        convertedOrderValue: val,
        poNumber: convertPoNum.trim() || undefined,
        requiredQuantity: Number(convertQty) || 50,
        technicalRequirements: convertTech.trim() || undefined,
      });

      setConvertSuccess(`Successfully created Order ${createdOrd.orderNumber}!`);
      setTimeout(() => {
        setConvertQuotation(null);
        setSelectedOrder(createdOrd);
      }, 1000);
    } catch (err: any) {
      setConvertError(err.message || 'Failed to convert quotation to order.');
    }
  };

  const handleOpenLost = (q: Quotation) => {
    setLostQuotation(q);
    setLostReason('PRICE_TOO_HIGH');
    setLostValue(String(q.quotationAmount));
    setLostDate(new Date().toISOString().split('T')[0]);
    setLostRemarks('');
    setLostError('');
  };

  const handleSaveLost = () => {
    if (!lostQuotation) return;
    setLostError('');

    try {
      markQuotationLost(lostQuotation.id, {
        lostReason,
        lostValue: lostValue ? Number(lostValue) : lostQuotation.quotationAmount,
        lostDate,
        lostRemarks,
      });
      setLostQuotation(null);
    } catch (err: any) {
      setLostError(err.message || 'Failed to mark quotation as lost.');
    }
  };

  const handleSaveStatus = (newSt: QuotationStatus) => {
    if (!statusQuotation) return;
    updateQuotation(statusQuotation.id, { status: newSt });
    setStatusQuotation(null);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Top Banner */}
      <View style={styles.topBanner}>
        <View style={{ flex: 1, paddingRight: Spacing.md }}>
          <Text style={styles.title}>Sales Quotation Management</Text>
          <Text style={styles.subTitle}>
            Inquiry tracking, quotation generation, follow-ups, order conversions, and lost business analytics.
          </Text>
        </View>
        {onOpenCreateQuotation && (
          <TouchableOpacity style={styles.btnOrange} onPress={onOpenCreateQuotation}>
            <Text style={styles.btnText}>+ Create Quotation</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Analytics KPI Summary Grid */}
      <View style={styles.kpiGrid}>
        {/* Total Quotations */}
        <TouchableOpacity
          style={styles.kpiCard}
          activeOpacity={0.7}
          onPress={() => handleOpenSalesModal('TOTAL')}
        >
          <Text style={styles.kpiVal}>{totalQuotations}</Text>
          <Text style={styles.kpiValSub}>{formatCurrency(totalQuotationValue)}</Text>
          <Text style={styles.kpiLabel}>Total Quotations Pipeline ↗</Text>
          <View style={styles.kpiBadge}>
            <Text style={styles.kpiBadgeText}>{negotiationCount} Under Negotiation</Text>
          </View>
        </TouchableOpacity>

        {/* Converted Orders */}
        <TouchableOpacity
          style={styles.kpiCard}
          activeOpacity={0.7}
          onPress={() => handleOpenSalesModal('CONVERTED')}
        >
          <Text style={[styles.kpiVal, { color: Colors.successBright }]}>{convertedCount}</Text>
          <Text style={[styles.kpiValSub, { color: Colors.successBright }]}>{formatCurrency(convertedValue)}</Text>
          <Text style={styles.kpiLabel}>Converted to Sales Orders ↗</Text>
          <View style={[styles.kpiBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: Colors.successBright }]}>
            <Text style={[styles.kpiBadgeText, { color: Colors.successBright }]}>{conversionRate}% Conversion Rate</Text>
          </View>
        </TouchableOpacity>

        {/* Lost Business */}
        <TouchableOpacity
          style={styles.kpiCard}
          activeOpacity={0.7}
          onPress={() => handleOpenSalesModal('LOST')}
        >
          <Text style={[styles.kpiVal, { color: Colors.industrialOrange }]}>{lostCount}</Text>
          <Text style={[styles.kpiValSub, { color: Colors.industrialOrange }]}>{formatCurrency(lostBusinessValue)}</Text>
          <Text style={styles.kpiLabel}>Lost Business Value ↗</Text>
          <View style={[styles.kpiBadge, { backgroundColor: 'rgba(179, 75, 32, 0.15)', borderColor: Colors.industrialOrange }]}>
            <Text style={[styles.kpiBadgeText, { color: Colors.industrialOrange }]}>Lost Tracking Recorded</Text>
          </View>
        </TouchableOpacity>

        {/* Pending Follow-Ups */}
        <TouchableOpacity
          style={styles.kpiCard}
          activeOpacity={0.7}
          onPress={() => handleOpenSalesModal('TOTAL')}
        >
          <Text style={[styles.kpiVal, { color: Colors.accentTeal }]}>{pendingFollowUpCount}</Text>
          <Text style={styles.kpiLabel}>Active Follow-Up Reminders ↗</Text>
          <View style={[styles.kpiBadge, { backgroundColor: 'rgba(56, 189, 248, 0.15)', borderColor: Colors.accentTeal }]}>
            <Text style={[styles.kpiBadgeText, { color: Colors.accentTeal }]}>Requires Action</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Search & Filter Card */}
      <View style={styles.card}>
        <View style={styles.filterRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="🔍 Search quotation #, client code, company name, executive, inquiry ref..."
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
            {['SENT', 'NEGOTIATION', 'APPROVED', 'FULLY_CONVERTED', 'LOST'].map((st) => (
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

        {/* Table */}
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
                    <Text style={[styles.tdSmall, { width: 95 }]}>{q.quotationDate}</Text>
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
                    <TouchableOpacity style={{ width: 130 }} onPress={() => setStatusQuotation(q)}>
                      <View style={[styles.statusBadge, { backgroundColor: stStyle.bg, borderColor: stStyle.border }]}>
                        <Text style={[styles.statusBadgeText, { color: stStyle.text }]}>
                          {q.status.replace(/_/g, ' ')} ▾
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* Follow-Up Date */}
                    <Text style={[styles.tdSmall, { width: 100 }]}>{q.followUpDate || 'None'}</Text>

                    {/* Actions */}
                    <View style={{ width: 270, flexDirection: 'row', gap: 4, flexWrap: 'wrap' }}>
                      <TouchableOpacity style={styles.actBtnView} onPress={() => setViewQuotation(q)}>
                        <Text style={styles.actBtnText}>View</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.actBtnEdit} onPress={() => handleOpenEdit(q)}>
                        <Text style={styles.actBtnText}>Edit</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.actBtnFup} onPress={() => handleOpenFollowUp(q)}>
                        <Text style={styles.actBtnText}>Follow-Up</Text>
                      </TouchableOpacity>

                      {q.status !== 'FULLY_CONVERTED' && q.status !== 'LOST' && (
                        <TouchableOpacity style={styles.actBtnConvert} onPress={() => handleOpenConvert(q)}>
                          <Text style={styles.actBtnTextBold}>Convert</Text>
                        </TouchableOpacity>
                      )}

                      {q.status !== 'LOST' && q.status !== 'FULLY_CONVERTED' && (
                        <TouchableOpacity style={styles.actBtnLost} onPress={() => handleOpenLost(q)}>
                          <Text style={styles.actBtnTextLost}>Mark Lost</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
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
                      <Text style={styles.fupNotesText}>"{f.notes}"</Text>
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
                <TextInput style={styles.input} value={editFollowUpDate} onChangeText={setEditFollowUpDate} placeholder="YYYY-MM-DD" />

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

      {/* MODAL 3: ADD FOLLOW-UP */}
      {followUpQuotation && (
        <Modal visible={!!followUpQuotation} transparent animationType="fade" onRequestClose={() => setFollowUpQuotation(null)}>
          <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setFollowUpQuotation(null)}>
            <TouchableOpacity activeOpacity={1} style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Record Follow-Up: {followUpQuotation.quotationNumber}</Text>
                <TouchableOpacity onPress={() => setFollowUpQuotation(null)}>
                  <Text style={styles.closeBtn}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={{ gap: Spacing.md }}>
                {fupError ? <View style={styles.errorBox}><Text style={styles.errorText}>⚠️ {fupError}</Text></View> : null}

                <Text style={styles.inputLabel}>Follow-Up Date *</Text>
                <TextInput style={styles.input} value={fupDate} onChangeText={setFupDate} placeholder="YYYY-MM-DD" />

                <Text style={styles.inputLabel}>Follow-Up Status</Text>
                <View style={styles.statusChipsRow}>
                  {(['PENDING', 'COMPLETED', 'NO_RESPONSE', 'AWAITING_DECISION'] as const).map((st) => (
                    <TouchableOpacity
                      key={st}
                      style={[styles.chip, fupStatus === st && styles.chipActive]}
                      onPress={() => setFupStatus(st)}
                    >
                      <Text style={[styles.chipText, fupStatus === st && styles.chipTextActive]}>{st}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>Follow-Up Discussion Notes *</Text>
                <TextInput
                  style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
                  placeholder="Enter notes from call/meeting with client..."
                  multiline
                  value={fupNotes}
                  onChangeText={setFupNotes}
                />

                <TouchableOpacity style={styles.submitBtn} onPress={handleSaveFollowUp}>
                  <Text style={styles.submitBtnText}>✓ Save Follow-Up Log</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}

      {/* MODAL 4: CONVERT QUOTATION TO ORDER */}
      {convertQuotation && (
        <Modal visible={!!convertQuotation} transparent animationType="fade" onRequestClose={() => setConvertQuotation(null)}>
          <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setConvertQuotation(null)}>
            <TouchableOpacity activeOpacity={1} style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Convert Quotation to ERP Order</Text>
                <TouchableOpacity onPress={() => setConvertQuotation(null)}>
                  <Text style={styles.closeBtn}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 460 }}>
                {convertError ? <View style={styles.errorBox}><Text style={styles.errorText}>⚠️ {convertError}</Text></View> : null}
                {convertSuccess ? <View style={styles.successBox}><Text style={styles.successText}>✅ {convertSuccess}</Text></View> : null}

                <View style={styles.infoBanner}>
                  <Text style={styles.infoBannerText}>
                    ℹ️ Pre-filling customer data for <Text style={{ fontWeight: '800' }}>{convertQuotation.companyName} ({convertQuotation.clientCode})</Text>. Original Quotation Value: <Text style={{ fontWeight: '800' }}>{formatCurrency(convertQuotation.quotationAmount)}</Text>.
                  </Text>
                </View>

                <Text style={styles.inputLabel}>Confirmed Order Received Value (₹) *</Text>
                <TextInput
                  style={[styles.input, { color: Colors.successBright, fontWeight: '800' }]}
                  value={convertVal}
                  onChangeText={setConvertVal}
                  keyboardType="numeric"
                />

                {/* Partial Conversion Calculation Display */}
                {Number(convertVal) < convertQuotation.quotationAmount && (
                  <View style={styles.partialBox}>
                    <Text style={styles.partialText}>
                      ⚠️ Partial Conversion Detected: Converted = {formatCurrency(Number(convertVal))}, Lost Portion = <Text style={{ fontWeight: '800', color: Colors.industrialOrange }}>{formatCurrency(convertQuotation.quotationAmount - Number(convertVal))}</Text>
                    </Text>
                  </View>
                )}

                <Text style={styles.inputLabel}>Customer Purchase Order (PO) Number</Text>
                <TextInput style={styles.input} value={convertPoNum} onChangeText={setConvertPoNum} />

                <Text style={styles.inputLabel}>Required Batch Quantity (pcs)</Text>
                <TextInput style={styles.input} value={convertQty} onChangeText={setConvertQty} keyboardType="numeric" />

                <Text style={styles.inputLabel}>Technical Specifications & Order Notes</Text>
                <TextInput style={[styles.input, { height: 60 }]} multiline value={convertTech} onChangeText={setConvertTech} />

                <TouchableOpacity style={styles.submitBtnGreen} onPress={handleSaveConvert}>
                  <Text style={styles.submitBtnText}>⚡ Convert & Generate Sales Order</Text>
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

                <Text style={styles.inputLabel}>Lost Business Value (₹)</Text>
                <TextInput style={styles.input} value={lostValue} onChangeText={setLostValue} keyboardType="numeric" />

                <Text style={styles.inputLabel}>Lost Date</Text>
                <TextInput style={styles.input} value={lostDate} onChangeText={setLostDate} placeholder="YYYY-MM-DD" />

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
                    onPress={() => handleSaveStatus(st)}
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
});
