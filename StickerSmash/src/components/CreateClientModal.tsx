import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, StyleSheet, ScrollView } from 'react-native';
import { useERP } from '../context/ERPContext';
import { Colors, Spacing, Radius, Shadows } from '../theme';

interface CreateClientModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CreateClientModal: React.FC<CreateClientModalProps> = ({ visible, onClose }) => {
  const { clients, createClient } = useERP();

  const [clientCode, setClientCode] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    setError('');

    const trimmedCode = clientCode.trim();
    const trimmedCompany = companyName.trim();
    const trimmedContact = contactNo.trim();

    if (!trimmedCode) {
      setError('Client Code (Manual Entry) is required.');
      return;
    }

    if (!trimmedCompany || !trimmedContact) {
      setError('Company Name and Mobile/Contact Number are required.');
      return;
    }

    // Uniqueness validation
    const isDuplicate = clients.some(
      (c) => c.clientCode.trim().toLowerCase() === trimmedCode.toLowerCase()
    );

    if (isDuplicate) {
      setError(`Client Code "${trimmedCode}" already exists. Duplicate Client Codes are not allowed.`);
      return;
    }

    try {
      createClient({
        clientCode: trimmedCode,
        companyName: trimmedCompany,
        contactName: contactName.trim(),
        contactNo: trimmedContact,
        email: email.trim(),
        address: address.trim(),
        gstNumber: gstNumber.trim(),
        remarks: remarks.trim(),
      });

      handleClose();
    } catch (err: any) {
      setError(err.message || 'Failed to register client.');
    }
  };

  const handleClose = () => {
    setClientCode('');
    setCompanyName('');
    setContactName('');
    setContactNo('');
    setEmail('');
    setAddress('');
    setGstNumber('');
    setRemarks('');
    setError('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose}>
        <TouchableOpacity activeOpacity={1} style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>Register New Client</Text>
            <TouchableOpacity onPress={handleClose}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.errorText}>⚠️ {error}</Text> : null}

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.formContent}>
              <Text style={styles.label}>Client Code (Manual Entry) *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. CL-1001, DF-2026-001, APEX-001"
                placeholderTextColor="#94a3b8"
                value={clientCode}
                onChangeText={setClientCode}
                autoCapitalize="characters"
              />

              <Text style={styles.label}>Client Name / Company Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Apex Heavy Engineering Pvt Ltd"
                placeholderTextColor="#94a3b8"
                value={companyName}
                onChangeText={setCompanyName}
              />

              <Text style={styles.label}>Contact Person Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Rajesh Mehta"
                placeholderTextColor="#94a3b8"
                value={contactName}
                onChangeText={setContactName}
              />

              <Text style={styles.label}>Mobile / Contact Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. +91 98765 43210"
                placeholderTextColor="#94a3b8"
                value={contactNo}
                onChangeText={setContactNo}
              />

              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="contact@company.com"
                placeholderTextColor="#94a3b8"
                value={email}
                onChangeText={setEmail}
              />

              <Text style={styles.label}>GST Number</Text>
              <TextInput
                style={styles.input}
                placeholder="27AAACA12341Z5"
                placeholderTextColor="#94a3b8"
                value={gstNumber}
                onChangeText={setGstNumber}
                autoCapitalize="characters"
              />

              <Text style={styles.label}>Plant / Office Address</Text>
              <TextInput
                style={[styles.input, { height: 44 }]}
                placeholder="Plot 42, Industrial Area Phase II, Pune"
                placeholderTextColor="#94a3b8"
                multiline
                value={address}
                onChangeText={setAddress}
              />

              <Text style={styles.label}>Remarks / Client Notes</Text>
              <TextInput
                style={[styles.input, { height: 44 }]}
                placeholder="e.g. Preferred vendor for high pressure SS316L flanges"
                placeholderTextColor="#94a3b8"
                multiline
                value={remarks}
                onChangeText={setRemarks}
              />

              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                <Text style={styles.submitBtnText}>+ Register Client</Text>
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
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    ...Shadows.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDark,
    paddingBottom: 8,
  },
  title: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: '800',
  },
  close: {
    color: Colors.accentTeal,
    fontSize: 16,
    fontWeight: '700',
  },
  formScroll: {
    flex: 1,
  },
  formContent: {
    gap: 8,
  },
  label: {
    color: Colors.accentTeal,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  input: {
    backgroundColor: Colors.inputBg,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    color: Colors.textLight,
    fontSize: 12,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  submitBtn: {
    backgroundColor: Colors.industrialOrange,
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 12,
    ...Shadows.glowOrange,
  },
  submitBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
});
