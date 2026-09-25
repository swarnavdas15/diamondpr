import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, ScrollView, StyleSheet } from 'react-native';
import { useERP } from '../context/ERPContext';
import { useAuth } from '../context/AuthContext';
import { QuotationStatus } from '../types';
import { Colors, Spacing, Radius, Shadows } from '../theme';
import { SearchableDropdown } from './ui/SearchableDropdown';
import { DatePickerInput } from './ui/DatePickerInput';

interface CreateQuotationModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CreateQuotationModal: React.FC<CreateQuotationModalProps> = ({ visible, onClose }) => {
  const { clients, quotations, createQuotation } = useERP();
  const { currentUser } = useAuth();

  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [clientCode, setClientCode] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [inquiryRef, setInquiryRef] = useState('');
  const [quotationAmount, setQuotationAmount] = useState('');
  const [expectedOrderValue, setExpectedOrderValue] = useState('');
  const [salesExecutive, setSalesExecutive] = useState(currentUser?.name || '');
  const [followUpDate, setFollowUpDate] = useState('');
  const [status, setStatus] = useState<QuotationStatus>('SENT');
  const [remarks, setRemarks] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Auto-generate next Quotation Number preview
  const nextQNum = `QT-2026-${String(quotations.length + 1).padStart(3, '0')}`;

  const handleSelectClient = (cId: string) => {
    setSelectedClientId(cId);
    if (!cId) {
      setClientCode('');
      setCompanyName('');
      setContactPerson('');
      setMobileNumber('');
      setEmail('');
      return;
    }
    const found = clients.find((c) => c.id === cId);
    if (found) {
      setClientCode(found.clientCode);
      setCompanyName(found.companyName);
      setContactPerson(found.contactName || '');
      setMobileNumber(found.contactNo);
      setEmail(found.email || '');
    }
  };

  const handleSubmit = () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!companyName.trim()) {
      setErrorMsg('Company / Client Name is required.');
      return;
    }
    if (!clientCode.trim()) {
      setErrorMsg('Client Code is required.');
      return;
    }
    if (!contactPerson.trim()) {
      setErrorMsg('Contact Person is required.');
      return;
    }
    if (!mobileNumber.trim()) {
      setErrorMsg('Mobile Number is required.');
      return;
    }
    if (!email.trim()) {
      setErrorMsg('Email Address is required.');
      return;
    }
    if (!quotationAmount.trim() || isNaN(Number(quotationAmount)) || Number(quotationAmount) <= 0) {
      setErrorMsg('Please enter a valid Total Quotation Amount (numeric).');
      return;
    }

    try {
      const created = createQuotation({
        companyName: companyName.trim(),
        clientCode: clientCode.trim(),
        clientId: selectedClientId || undefined,
        contactPerson: contactPerson.trim(),
        mobileNumber: mobileNumber.trim(),
        email: email.trim(),
        inquiryRef: inquiryRef.trim() || undefined,
        quotationAmount: Number(quotationAmount),
        expectedOrderValue: expectedOrderValue ? Number(expectedOrderValue) : Number(quotationAmount),
        salesExecutive: salesExecutive.trim() || currentUser?.name || 'Sales Executive',
        followUpDate: followUpDate.trim() || undefined,
        status,
        remarks: remarks.trim() || undefined,
      });

      setSuccessMsg(`Quotation ${created.quotationNumber} created successfully!`);
      setTimeout(() => {
        handleReset();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create quotation.');
    }
  };

  const handleReset = () => {
    setSelectedClientId('');
    setClientCode('');
    setCompanyName('');
    setContactPerson('');
    setMobileNumber('');
    setEmail('');
    setInquiryRef('');
    setQuotationAmount('');
    setExpectedOrderValue('');
    setSalesExecutive(currentUser?.name || '');
    setFollowUpDate('');
    setStatus('SENT');
    setRemarks('');
    setErrorMsg('');
    setSuccessMsg('');
    onClose();
  };

  const statusOptions: QuotationStatus[] = ['DRAFT', 'SENT', 'UNDER_DISCUSSION', 'NEGOTIATION', 'APPROVED'];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleReset}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleReset}>
        <TouchableOpacity activeOpacity={1} style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Create Sales Quotation</Text>
              <Text style={styles.subTitle}>
                Quotation Number: <Text style={styles.autoNum}>{nextQNum}</Text> (Auto Generated)
              </Text>
            </View>
            <TouchableOpacity onPress={handleReset}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>
              {errorMsg ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
                </View>
              ) : null}
              {successMsg ? (
                <View style={styles.successBanner}>
                  <Text style={styles.successText}>✅ {successMsg}</Text>
                </View>
              ) : null}

              {/* Registered Client Searchable Dropdown */}
              <SearchableDropdown
                label="Select Registered Client (Optional Pre-fill)"
                placeholder="Search or select a registered client..."
                options={clients.map((c) => ({
                  id: c.id,
                  label: c.companyName,
                  code: c.clientCode,
                  sublabel: c.contactName ? `Contact: ${c.contactName}` : undefined,
                }))}
                selectedValue={selectedClientId}
                onSelect={handleSelectClient}
                allowManual={true}
                manualLabel="+ Manual / New Client"
                manualId=""
              />

              {/* Company Name & Client Code */}
              <View style={styles.rowTwo}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Company / Client Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Apex Heavy Engineering"
                    placeholderTextColor="#94a3b8"
                    value={companyName}
                    onChangeText={setCompanyName}
                  />
                </View>
                <View style={{ width: 140 }}>
                  <Text style={styles.label}>Client Code *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. CL-1001"
                    placeholderTextColor="#94a3b8"
                    autoCapitalize="characters"
                    value={clientCode}
                    onChangeText={setClientCode}
                  />
                </View>
              </View>

              {/* Contact Person & Mobile */}
              <View style={styles.rowTwo}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Contact Person *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Rajesh Mehta"
                    placeholderTextColor="#94a3b8"
                    value={contactPerson}
                    onChangeText={setContactPerson}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Mobile Number *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. +91 98765 43210"
                    placeholderTextColor="#94a3b8"
                    keyboardType="phone-pad"
                    value={mobileNumber}
                    onChangeText={setMobileNumber}
                  />
                </View>
              </View>

              {/* Email & Inquiry Ref */}
              <View style={styles.rowTwo}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Email Address *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. contact@apexheavy.com"
                    placeholderTextColor="#94a3b8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Inquiry Reference</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. INQ-2026-88"
                    placeholderTextColor="#94a3b8"
                    value={inquiryRef}
                    onChangeText={setInquiryRef}
                  />
                </View>
              </View>

              {/* Quotation Amount & Expected Order Value */}
              <View style={styles.rowTwo}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Total Quotation Amount (₹) *</Text>
                  <TextInput
                    style={[styles.input, { color: Colors.accentTeal, fontWeight: '800' }]}
                    placeholder="e.g. 1000000"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    value={quotationAmount}
                    onChangeText={setQuotationAmount}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Expected Order Value (₹)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 750000"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    value={expectedOrderValue}
                    onChangeText={setExpectedOrderValue}
                  />
                </View>
              </View>

              {/* Sales Executive & Follow-up Date */}
              <View style={styles.rowTwo}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Sales Executive</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Vikram Malhotra"
                    placeholderTextColor="#94a3b8"
                    value={salesExecutive}
                    onChangeText={setSalesExecutive}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <DatePickerInput
                    label="Follow-Up Date"
                    value={followUpDate}
                    onChangeDate={setFollowUpDate}
                    placeholder="YYYY-MM-DD"
                  />
                </View>
              </View>

              {/* Initial Status */}
              <Text style={styles.label}>Initial Quotation Status</Text>
              <View style={styles.statusChipsRow}>
                {statusOptions.map((st) => {
                  const isSel = status === st;
                  return (
                    <TouchableOpacity
                      key={st}
                      style={[styles.statusChip, isSel && styles.statusChipActive]}
                      onPress={() => setStatus(st)}
                    >
                      <Text style={[styles.statusChipText, isSel && styles.statusChipTextActive]}>
                        {st.replace(/_/g, ' ')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Remarks */}
              <Text style={styles.label}>Remarks & Technical Notes</Text>
              <TextInput
                style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
                placeholder="Enter quotation specifications, payment terms, or lead time notes..."
                placeholderTextColor="#94a3b8"
                multiline
                value={remarks}
                onChangeText={setRemarks}
              />

              {/* Submit Button */}
              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                <Text style={styles.submitBtnText}>✓ Save & Generate Quotation</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 620,
    maxHeight: '90%',
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    ...Shadows.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.px14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDark,
    paddingBottom: Spacing.px10,
  },
  title: {
    color: Colors.textLight,
    fontSize: 18,
    fontWeight: '800',
  },
  subTitle: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  autoNum: {
    color: Colors.accentTeal,
    fontWeight: '800',
  },
  closeText: {
    color: Colors.accentTeal,
    fontSize: 16,
    fontWeight: '800',
  },
  formScroll: {
    flex: 1,
  },
  formGroup: {
    gap: Spacing.px10,
  },
  clientSelectSection: {
    marginBottom: 4,
  },
  label: {
    color: Colors.accentTeal,
    fontSize: 12,
    fontWeight: '700',
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
  rowTwo: {
    flexDirection: 'row',
    gap: Spacing.px10,
  },
  clientChip: {
    backgroundColor: Colors.inputBg,
    paddingHorizontal: Spacing.px10,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  clientChipActive: {
    backgroundColor: Colors.accentTeal,
    borderColor: Colors.accentTeal,
  },
  clientChipText: {
    color: Colors.textSubtle,
    fontSize: 11,
    fontWeight: '700',
  },
  clientChipTextActive: {
    color: Colors.white,
    fontWeight: '800',
  },
  statusChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  statusChip: {
    backgroundColor: Colors.inputBg,
    paddingHorizontal: Spacing.px10,
    paddingVertical: 5,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  statusChipActive: {
    backgroundColor: Colors.accentTeal,
    borderColor: Colors.accentTeal,
  },
  statusChipText: {
    color: Colors.textSubtle,
    fontSize: 10,
    fontWeight: '700',
  },
  statusChipTextActive: {
    color: Colors.white,
    fontWeight: '800',
  },
  submitBtn: {
    backgroundColor: Colors.industrialOrange,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.md,
    ...Shadows.glowOrange,
  },
  submitBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  errorBanner: {
    backgroundColor: 'rgba(179, 75, 32, 0.1)',
    padding: Spacing.px10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.industrialOrange,
  },
  errorText: {
    color: Colors.industrialOrange,
    fontSize: 12,
    fontWeight: '700',
  },
  successBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: Spacing.px10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.successBright,
  },
  successText: {
    color: Colors.successBright,
    fontSize: 12,
    fontWeight: '700',
  },
});
