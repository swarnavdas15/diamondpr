import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, ScrollView, StyleSheet } from 'react-native';
import { CompanyContact } from '../../types';
import { Colors, Spacing, Radius, Shadows } from '../../theme';
import { SearchableDropdown } from '../ui/SearchableDropdown';

interface ContactFormModalProps {
  visible: boolean;
  companyId: string;
  contactToEdit?: CompanyContact | null;
  existingContacts: CompanyContact[];
  onClose: () => void;
  onSubmit: (data: Omit<CompanyContact, 'id' | 'createdAt'>) => void;
}

const DEPARTMENTS = [
  'Executive Board',
  'Operations',
  'Sales',
  'Purchase',
  'Quality Control',
  'Production',
  'Logistics',
  'General Management',
];

export const ContactFormModal: React.FC<ContactFormModalProps> = ({
  visible,
  companyId,
  contactToEdit,
  existingContacts,
  onClose,
  onSubmit,
}) => {
  const [fullName, setFullName] = useState('');
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [reportsToId, setReportsToId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (contactToEdit) {
      setFullName(contactToEdit.fullName);
      setDesignation(contactToEdit.designation);
      setDepartment(contactToEdit.department || DEPARTMENTS[0]);
      setEmail(contactToEdit.email || '');
      setMobile(contactToEdit.mobile || '');
      setWhatsapp(contactToEdit.whatsapp || '');
      setReportsToId(contactToEdit.reportsToId || '');
      setNotes(contactToEdit.notes || '');
    } else {
      resetForm();
    }
  }, [contactToEdit, visible]);

  const resetForm = () => {
    setFullName('');
    setDesignation('');
    setDepartment(DEPARTMENTS[0]);
    setEmail('');
    setMobile('');
    setWhatsapp('');
    setReportsToId('');
    setNotes('');
    setError('');
  };

  const handleSubmit = () => {
    setError('');
    if (!fullName.trim()) {
      setError('Full Name is required.');
      return;
    }
    if (!designation.trim()) {
      setError('Designation is required.');
      return;
    }
    if (!mobile.trim()) {
      setError('Mobile Number is required.');
      return;
    }

    // Standardize WhatsApp number (digits only or raw string)
    const cleanWa = whatsapp.trim() || mobile.replace(/\D/g, '');

    onSubmit({
      companyId,
      fullName: fullName.trim(),
      designation: designation.trim(),
      department,
      email: email.trim(),
      mobile: mobile.trim(),
      whatsapp: cleanWa,
      reportsToId: reportsToId || undefined,
      notes: notes.trim(),
    });

    handleClose();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Potential managers list (excluding self if editing)
  const managerCandidates = existingContacts.filter((c) => !contactToEdit || c.id !== contactToEdit.id);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose}>
        <TouchableOpacity activeOpacity={1} style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {contactToEdit ? '✏ Edit Contact Person' : '👤 Add Contact Person & Reporting Manager'}
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.errorText}>⚠️ {error}</Text> : null}

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {/* Full Name */}
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Rajesh Mehta, Aniket Verma"
              placeholderTextColor="#94a3b8"
              value={fullName}
              onChangeText={setFullName}
            />

            {/* Designation & Department Row */}
            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text style={styles.label}>Designation / Role *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. General Manager, Purchase Head"
                  placeholderTextColor="#94a3b8"
                  value={designation}
                  onChangeText={setDesignation}
                />
              </View>
              <View style={styles.flex1}>
                <Text style={styles.label}>Department</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                  {DEPARTMENTS.map((dept) => (
                    <TouchableOpacity
                      key={dept}
                      style={[styles.deptChip, department === dept && styles.deptChipActive]}
                      onPress={() => setDepartment(dept)}
                    >
                      <Text style={[styles.deptChipText, department === dept && styles.deptChipTextActive]}>
                        {dept}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* Mobile & WhatsApp Row */}
            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text style={styles.label}>Mobile Number *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+91 98765 43210"
                  placeholderTextColor="#94a3b8"
                  keyboardType="phone-pad"
                  value={mobile}
                  onChangeText={setMobile}
                />
              </View>
              <View style={styles.flex1}>
                <Text style={styles.label}>WhatsApp Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="919876543210"
                  placeholderTextColor="#94a3b8"
                  keyboardType="phone-pad"
                  value={whatsapp}
                  onChangeText={setWhatsapp}
                />
              </View>
            </View>

            {/* Email */}
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="name@company.com"
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />

            {/* Reporting Structure Selector ("Reports To") */}
            <View style={styles.reportingBox}>
              <Text style={styles.reportingTitle}>🌳 REPORTING STRUCTURE (REPORTS TO)</Text>
              <Text style={styles.reportingSub}>
                Select reporting manager to position this contact in the interactive Organization Chart tree.
              </Text>

              <SearchableDropdown
                label="Reporting Manager"
                placeholder="Search or select reporting manager..."
                options={managerCandidates.map((m) => ({
                  id: m.id,
                  label: m.fullName,
                  sublabel: m.designation,
                }))}
                selectedValue={reportsToId}
                onSelect={(id) => setReportsToId(id)}
                allowManual={true}
                manualLabel="👑 Top Level Contact (No Manager)"
                manualId=""
              />
            </View>

            {/* Notes */}
            <Text style={styles.label}>Notes & Special Instructions</Text>
            <TextInput
              style={[styles.input, { height: 60 }]}
              placeholder="Enter contact authorization notes or specific RFQ responsibilities..."
              placeholderTextColor="#94a3b8"
              multiline
              value={notes}
              onChangeText={setNotes}
            />

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
              <Text style={styles.submitBtnText}>
                {contactToEdit ? 'Save Contact Changes' : 'Add Contact & Rebuild Hierarchy'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  card: {
    width: '100%',
    maxWidth: 620,
    maxHeight: '90%',
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    ...Shadows.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDark,
    paddingBottom: Spacing.sm,
  },
  title: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: '800',
  },
  close: {
    color: Colors.textSubtle,
    fontSize: 18,
    fontWeight: '700',
  },
  errorText: {
    color: Colors.status.FAILED.bg,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: Spacing.sm,
    borderRadius: Radius.md,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  formScroll: {
    flex: 1,
  },
  label: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '700',
    marginTop: Spacing.xs,
    marginBottom: 4,
  },
  input: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    color: Colors.textLight,
    fontSize: 13,
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  flex1: {
    flex: 1,
  },
  chipRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  deptChip: {
    backgroundColor: Colors.inputBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    marginRight: 6,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  deptChipActive: {
    backgroundColor: Colors.accentTeal,
    borderColor: Colors.accentTeal,
  },
  deptChipText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  deptChipTextActive: {
    color: Colors.white,
    fontWeight: '800',
  },
  reportingBox: {
    backgroundColor: Colors.bgDark,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderMuted,
    marginVertical: Spacing.sm,
  },
  reportingTitle: {
    color: Colors.accentTeal,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  reportingSub: {
    color: Colors.textSubtle,
    fontSize: 11,
    marginTop: 2,
    marginBottom: Spacing.sm,
  },
  managerListContainer: {
    gap: 6,
  },
  managerChip: {
    backgroundColor: Colors.cardBg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  managerChipActive: {
    backgroundColor: 'rgba(41, 88, 92, 0.1)',
    borderColor: Colors.accentTeal,
    borderWidth: 1.5,
  },
  managerChipText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  managerChipTextActive: {
    color: Colors.accentTeal,
    fontWeight: '800',
  },
  submitBtn: {
    backgroundColor: Colors.accentTeal,
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  submitBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
});
