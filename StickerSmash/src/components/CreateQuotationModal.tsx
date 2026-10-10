import React, { useState, useMemo } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, ScrollView, StyleSheet, useWindowDimensions, Keyboard } from 'react-native';
import { useERP } from '../context/ERPContext';
import { useAuth } from '../context/AuthContext';
import { QuotationStatus, Client } from '../types';
import { Colors, Spacing, Radius, Shadows } from '../theme';
import { SearchableDropdown } from './ui/SearchableDropdown';
import { DatePickerInput } from './ui/DatePickerInput';
import { CreateClientModal } from './CreateClientModal';

interface CreateQuotationModalProps {
  visible: boolean;
  onClose: () => void;
}

type ClientType = 'registered' | 'non_registered';

export const CreateQuotationModal: React.FC<CreateQuotationModalProps> = ({ visible, onClose }) => {
  const { clients, temporaryClients, quotations, createQuotation } = useERP();
  const { currentUser } = useAuth();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [clientType, setClientType] = useState<ClientType>('registered');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [companyName, setCompanyName] = useState('');
  const [clientCode, setClientCode] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [inquiryRef, setInquiryRef] = useState('');
  const [quotationAmount, setQuotationAmount] = useState('');
  const [expectedOrderValue, setExpectedOrderValue] = useState('');
  const [salesExecutive, setSalesExecutive] = useState(currentUser?.name || '');
  const [followUpDate, setFollowUpDate] = useState('');
  const [status, setStatus] = useState<QuotationStatus>('DRAFT');
  const [remarks, setRemarks] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [createClientVisible, setCreateClientVisible] = useState(false);

  const allRegisteredClients = useMemo(() => clients.filter(c => !c.isTemporary), [clients]);
  const allTemporaryClients = useMemo(() => temporaryClients || [], [temporaryClients]);
  const allKnownClients = useMemo(() => [...allRegisteredClients, ...allTemporaryClients], [allRegisteredClients, allTemporaryClients]);

  const nextQNum = `QT-2026-${String(quotations.length + 1).padStart(3, '0')}`;

  const selectedClient = useMemo(() => 
    allKnownClients.find(c => c.id === selectedClientId), 
    [allKnownClients, selectedClientId]
  );

  const handleClientTypeChange = (type: ClientType) => {
    setClientType(type);
    if (type === 'registered') {
      if (selectedClient) {
        setClientCode(selectedClient.clientCode);
        setCompanyName(selectedClient.companyName);
        setContactPerson(selectedClient.contactName || '');
        setMobileNumber(selectedClient.contactNo);
        setEmail(selectedClient.email || '');
      }
    } else {
      setSelectedClientId('');
      setClientCode('');
      setCompanyName('');
      setContactPerson('');
      setMobileNumber('');
      setEmail('');
    }
    Keyboard.dismiss();
  };

  const handleClientSelect = (cId: string) => {
    setSelectedClientId(cId);
    const client = allKnownClients.find(c => c.id === cId);
    if (client) {
      setClientCode(client.clientCode);
      setCompanyName(client.companyName);
      setContactPerson(client.contactName || '');
      setMobileNumber(client.contactNo);
      setEmail(client.email || '');
    }
    Keyboard.dismiss();
  };

  const handleClientCreated = (newClient: Client) => {
    setSelectedClientId(newClient.id);
    setClientCode(newClient.clientCode);
    setCompanyName(newClient.companyName);
    setContactPerson(newClient.contactName || '');
    setMobileNumber(newClient.contactNo);
    setEmail(newClient.email || '');
    setCreateClientVisible(false);
    setSuccessMsg('New client registered and selected');
    Keyboard.dismiss();
  };

  const handleAddNewClient = () => {
    setSelectedClientId('');
    setCreateClientVisible(true);
  };

  const handleSubmit = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!companyName.trim()) {
      setErrorMsg('Company / Client Name is required.');
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
      const finalClientId = clientType === 'registered' ? selectedClientId : undefined;
      const finalClientCode =
        clientType === 'registered'
          ? clientCode.trim()
          : clientCode.trim() || undefined;

      const created = await createQuotation({
        companyName: companyName.trim(),
        clientCode: finalClientCode,
        clientId: finalClientId,
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

      setSuccessMsg(`Quotation ${created.quotationNumber} successfully created!`);
      setTimeout(() => {
        handleReset();
      }, 1400);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create quotation.');
    }
  };

  const handleReset = () => {
    setClientType('registered');
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
    setStatus('DRAFT');
    setRemarks('');
    setErrorMsg('');
    setSuccessMsg('');
    onClose();
  };

  const statusOptions: QuotationStatus[] = ['DRAFT', 'SENT', 'UNDER_DISCUSSION', 'NEGOTIATION', 'APPROVED'];

  const registeredOptions = allRegisteredClients.map((c) => ({
    id: c.id,
    label: c.companyName,
    code: c.clientCode,
    sublabel: c.contactName ? `Contact: ${c.contactName}` : 'Registered Client',
  }));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleReset}>
      <TouchableOpacity style={[styles.backdrop, isMobile && { padding: 10 }]} activeOpacity={1} onPress={handleReset}>
        <TouchableOpacity activeOpacity={1} style={[styles.modalCard, isMobile && { padding: 14, maxHeight: '95%' }]} onPress={(e) => e.stopPropagation()}>
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

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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

              {/* Client Type Selector */}
              <View style={styles.clientTypeSelector}>
                <Text style={styles.label}>Client Type *</Text>
                <View style={styles.segmentedControl}>
                  <TouchableOpacity
                    style={[
                      styles.segmentButton,
                      clientType === 'registered' && styles.segmentButtonActive,
                    ]}
                    onPress={() => handleClientTypeChange('registered')}
                  >
                    <Text style={[
                      styles.segmentButtonText,
                      clientType === 'registered' && styles.segmentButtonTextActive,
                    ]}>
                      Registered
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.segmentButton,
                      clientType === 'non_registered' && styles.segmentButtonActive,
                    ]}
                    onPress={() => handleClientTypeChange('non_registered')}
                  >
                    <Text style={[
                      styles.segmentButtonText,
                      clientType === 'non_registered' && styles.segmentButtonTextActive,
                    ]}>
                      Non Registered
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Company / Client Name */}
              <View style={styles.formField}>
                <Text style={styles.label}>Company / Client Name *</Text>
                {clientType === 'registered' ? (
                  <SearchableDropdown
                    label=""
                    placeholder="Search and select a registered client..."
                    options={registeredOptions}
                    selectedValue={selectedClientId}
                    onSelect={handleClientSelect}
                    allowManual={true}
                    manualLabel="+ Add New Client"
                    onManualPress={handleAddNewClient}
                  />
                ) : (
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Apex Heavy Engineering"
                    placeholderTextColor="#94a3b8"
                    value={companyName}
                    onChangeText={setCompanyName}
                    autoCapitalize="words"
                  />
                )}
              </View>

              {/* Client Code */}
              <View style={styles.formField}>
                <Text style={styles.label}>Client Code *</Text>
                <TextInput
                  style={[
                    styles.input,
                    clientType === 'registered' && styles.inputDisabled,
                  ]}
                  placeholder={
                    clientType === 'registered'
                      ? 'Auto-filled from selected client'
                      : 'Leave blank for auto-generation (TMP-...)'
                  }
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="characters"
                  value={clientCode}
                  onChangeText={setClientCode}
                  editable={clientType === 'non_registered'}
                />
              </View>

              {/* Contact Person */}
              <View style={styles.formField}>
                <Text style={styles.label}>Contact Person *</Text>
                <TextInput
                  style={[styles.input, clientType === 'registered' && selectedClient && styles.inputDisabled]}
                  placeholder="e.g. Rajesh Mehta"
                  placeholderTextColor="#94a3b8"
                  value={contactPerson}
                  onChangeText={setContactPerson}
                  editable={clientType === 'non_registered'}
                />
              </View>

              {/* Mobile Number */}
              <View style={styles.formField}>
                <Text style={styles.label}>Mobile Number *</Text>
                <TextInput
                  style={[styles.input, clientType === 'registered' && selectedClient && styles.inputDisabled]}
                  placeholder="e.g. +91 98765 43210"
                  placeholderTextColor="#94a3b8"
                  keyboardType="phone-pad"
                  value={mobileNumber}
                  onChangeText={setMobileNumber}
                  editable={clientType === 'non_registered'}
                />
              </View>

              {/* Email Address */}
              <View style={styles.formField}>
                <Text style={styles.label}>Email Address *</Text>
                <TextInput
                  style={[styles.input, clientType === 'registered' && selectedClient && styles.inputDisabled]}
                  placeholder="e.g. contact@apexheavy.com"
                  placeholderTextColor="#94a3b8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                  editable={clientType === 'non_registered'}
                />
              </View>

              {/* Inquiry Reference */}
              <View style={styles.formField}>
                <Text style={styles.label}>Inquiry Reference</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. INQ-2026-88"
                  placeholderTextColor="#94a3b8"
                  value={inquiryRef}
                  onChangeText={setInquiryRef}
                />
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
              <View style={styles.formField}>
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
              </View>

              {/* Remarks */}
              <View style={styles.formField}>
                <Text style={styles.label}>Remarks & Technical Notes</Text>
                <TextInput
                  style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
                  placeholder="Enter quotation specifications, payment terms, or lead time notes..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  value={remarks}
                  onChangeText={setRemarks}
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                <Text style={styles.submitBtnText}>✓ Save & Generate Quotation</Text>
              </TouchableOpacity>
            </View>
</ScrollView>
        </TouchableOpacity>
       </TouchableOpacity>
       <CreateClientModal
         visible={createClientVisible}
         onClose={() => setCreateClientVisible(false)}
         onClientCreated={handleClientCreated}
       />
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
  formField: {
    gap: Spacing.xs,
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
    paddingVertical: 10,
    minHeight: 44,
    color: Colors.textLight,
    fontSize: 13,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  inputDisabled: {
    backgroundColor: Colors.inputBgDisabled,
    borderColor: Colors.borderDark,
    color: Colors.textMuted,
  },
  rowTwo: {
    flexDirection: 'row',
    gap: Spacing.px10,
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
  clientTypeSelector: {
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    overflow: 'hidden',
  },
  segmentButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
  },
  segmentButtonActive: {
    backgroundColor: Colors.accentTeal,
    borderColor: Colors.accentTeal,
  },
  segmentButtonText: {
    color: Colors.textSubtle,
    fontSize: 12,
    fontWeight: '700',
  },
  segmentButtonTextActive: {
    color: Colors.white,
    fontWeight: '800',
  },
});