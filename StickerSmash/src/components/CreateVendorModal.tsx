import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, StyleSheet, ScrollView } from 'react-native';
import { useERP } from '../context/ERPContext';
import { Vendor, VendorStatus } from '../types';
import { Colors, Spacing, Radius, Shadows } from '../theme';

interface CreateVendorModalProps {
  visible: boolean;
  onClose: () => void;
  vendorToEdit?: Vendor | null;
}

export const CreateVendorModal: React.FC<CreateVendorModalProps> = ({
  visible,
  onClose,
  vendorToEdit = null,
}) => {
  const { createVendor, updateVendor } = useERP();

  // Basic Info
  const [vendorCode, setVendorCode] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');

  // Contact Info
  const [contactPerson, setContactPerson] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [alternateMobile, setAlternateMobile] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');

  // Address Info
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [country, setCountry] = useState('India');

  // Business Info
  const [materialSupplied, setMaterialSupplied] = useState('');
  const [vendorCategory, setVendorCategory] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [leadTime, setLeadTime] = useState('7 Days');
  const [status, setStatus] = useState<VendorStatus>('ACTIVE');

  // Additional Info
  const [remarks, setRemarks] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (vendorToEdit) {
      setVendorCode(vendorToEdit.vendorCode || '');
      setVendorName(vendorToEdit.vendorName || '');
      setCompanyName(vendorToEdit.companyName || '');
      setGstNumber(vendorToEdit.gstNumber || '');
      setPanNumber(vendorToEdit.panNumber || '');

      setContactPerson(vendorToEdit.contactPerson || '');
      setMobileNumber(vendorToEdit.mobileNumber || '');
      setAlternateMobile(vendorToEdit.alternateMobile || '');
      setEmail(vendorToEdit.email || '');
      setWebsite(vendorToEdit.website || '');

      setAddressLine1(vendorToEdit.addressLine1 || '');
      setAddressLine2(vendorToEdit.addressLine2 || '');
      setCity(vendorToEdit.city || '');
      setState(vendorToEdit.state || '');
      setPinCode(vendorToEdit.pinCode || '');
      setCountry(vendorToEdit.country || 'India');

      setMaterialSupplied(vendorToEdit.materialSupplied || '');
      setVendorCategory(vendorToEdit.vendorCategory || '');
      setPaymentTerms(vendorToEdit.paymentTerms || 'Net 30');
      setLeadTime(vendorToEdit.leadTime || '7 Days');
      setStatus(vendorToEdit.status || 'ACTIVE');

      setRemarks(vendorToEdit.remarks || '');
      setNotes(vendorToEdit.notes || '');
    } else {
      resetForm();
    }
  }, [vendorToEdit, visible]);

  const resetForm = () => {
    setVendorCode('');
    setVendorName('');
    setCompanyName('');
    setGstNumber('');
    setPanNumber('');

    setContactPerson('');
    setMobileNumber('');
    setAlternateMobile('');
    setEmail('');
    setWebsite('');

    setAddressLine1('');
    setAddressLine2('');
    setCity('');
    setState('');
    setPinCode('');
    setCountry('India');

    setMaterialSupplied('');
    setVendorCategory('');
    setPaymentTerms('Net 30');
    setLeadTime('7 Days');
    setStatus('ACTIVE');

    setRemarks('');
    setNotes('');
    setError('');
  };

  const handleSubmit = () => {
    setError('');

    if (!vendorName.trim()) {
      setError('Vendor Name is required.');
      return;
    }
    if (!vendorCode.trim()) {
      setError('Vendor Code is required.');
      return;
    }
    if (!contactPerson.trim()) {
      setError('Contact Person Name is required.');
      return;
    }
    if (!mobileNumber.trim()) {
      setError('Mobile Number is required.');
      return;
    }
    if (!email.trim()) {
      setError('Email Address is required.');
      return;
    }

    try {
      if (vendorToEdit) {
        updateVendor(vendorToEdit.id, {
          vendorCode: vendorCode.trim(),
          vendorName: vendorName.trim(),
          companyName: companyName.trim(),
          gstNumber: gstNumber.trim(),
          panNumber: panNumber.trim(),

          contactPerson: contactPerson.trim(),
          mobileNumber: mobileNumber.trim(),
          alternateMobile: alternateMobile.trim(),
          email: email.trim(),
          website: website.trim(),

          addressLine1: addressLine1.trim(),
          addressLine2: addressLine2.trim(),
          city: city.trim(),
          state: state.trim(),
          pinCode: pinCode.trim(),
          country: country.trim(),

          materialSupplied: materialSupplied.trim() || 'General Procurement',
          vendorCategory: vendorCategory.trim(),
          paymentTerms: paymentTerms.trim(),
          leadTime: leadTime.trim(),
          status,

          remarks: remarks.trim(),
          notes: notes.trim(),
        });
      } else {
        createVendor({
          vendorCode: vendorCode.trim(),
          vendorName: vendorName.trim(),
          companyName: companyName.trim(),
          gstNumber: gstNumber.trim(),
          panNumber: panNumber.trim(),

          contactPerson: contactPerson.trim(),
          mobileNumber: mobileNumber.trim(),
          alternateMobile: alternateMobile.trim(),
          email: email.trim(),
          website: website.trim(),

          addressLine1: addressLine1.trim(),
          addressLine2: addressLine2.trim(),
          city: city.trim(),
          state: state.trim(),
          pinCode: pinCode.trim(),
          country: country.trim(),

          materialSupplied: materialSupplied.trim() || 'General Procurement',
          vendorCategory: vendorCategory.trim(),
          paymentTerms: paymentTerms.trim(),
          leadTime: leadTime.trim(),
          status,

          remarks: remarks.trim(),
          notes: notes.trim(),
        });
      }

      handleClose();
    } catch (err: any) {
      setError(err.message || 'Error processing vendor registration.');
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose}>
        <TouchableOpacity activeOpacity={1} style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>{vendorToEdit ? 'Edit Vendor Details' : 'Register New Supplier Vendor'}</Text>
            <TouchableOpacity onPress={handleClose}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {error ? <Text style={styles.errorText}>⚠️ {error}</Text> : null}

            {/* SECTION 1: BASIC INFORMATION */}
            <Text style={styles.sectionHeader}>1. Basic Information</Text>
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Vendor Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Jindal Stainless Steel Works"
                  placeholderTextColor="#94a3b8"
                  value={vendorName}
                  onChangeText={setVendorName}
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Vendor Code *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. VND-1004"
                  placeholderTextColor="#94a3b8"
                  value={vendorCode}
                  onChangeText={setVendorCode}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Company Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Legal Registered Entity Name"
                  placeholderTextColor="#94a3b8"
                  value={companyName}
                  onChangeText={setCompanyName}
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>GST Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="27AAACA12341Z5"
                  placeholderTextColor="#94a3b8"
                  value={gstNumber}
                  onChangeText={setGstNumber}
                />
              </View>
            </View>

            <Text style={styles.label}>PAN Number</Text>
            <TextInput
              style={styles.input}
              placeholder="AAACA1234A"
              placeholderTextColor="#94a3b8"
              value={panNumber}
              onChangeText={setPanNumber}
            />

            {/* SECTION 2: CONTACT INFORMATION */}
            <Text style={styles.sectionHeader}>2. Contact Information</Text>
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Contact Person Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Harish Jindal"
                  placeholderTextColor="#94a3b8"
                  value={contactPerson}
                  onChangeText={setContactPerson}
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Mobile Number *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+91 98120 11223"
                  placeholderTextColor="#94a3b8"
                  value={mobileNumber}
                  onChangeText={setMobileNumber}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Alternate Mobile</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+91 98120 99887"
                  placeholderTextColor="#94a3b8"
                  value={alternateMobile}
                  onChangeText={setAlternateMobile}
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Email Address *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="sales@supplier.com"
                  placeholderTextColor="#94a3b8"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            <Text style={styles.label}>Website URL</Text>
            <TextInput
              style={styles.input}
              placeholder="https://www.supplier.com"
              placeholderTextColor="#94a3b8"
              value={website}
              onChangeText={setWebsite}
            />

            {/* SECTION 3: ADDRESS INFORMATION */}
            <Text style={styles.sectionHeader}>3. Address Information</Text>
            <Text style={styles.label}>Address Line 1</Text>
            <TextInput
              style={styles.input}
              placeholder="Factory / Warehouse Address"
              placeholderTextColor="#94a3b8"
              value={addressLine1}
              onChangeText={setAddressLine1}
            />

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>City</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Hisar"
                  placeholderTextColor="#94a3b8"
                  value={city}
                  onChangeText={setCity}
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>State</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Haryana"
                  placeholderTextColor="#94a3b8"
                  value={state}
                  onChangeText={setState}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>PIN Code</Text>
                <TextInput
                  style={styles.input}
                  placeholder="125005"
                  placeholderTextColor="#94a3b8"
                  value={pinCode}
                  onChangeText={setPinCode}
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Country</Text>
                <TextInput
                  style={styles.input}
                  placeholder="India"
                  placeholderTextColor="#94a3b8"
                  value={country}
                  onChangeText={setCountry}
                />
              </View>
            </View>

            {/* SECTION 4: BUSINESS & MATERIAL INFORMATION */}
            <Text style={styles.sectionHeader}>4. Business & Material Information</Text>
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Material Supplied *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. SS Raw Billets & Forgings"
                  placeholderTextColor="#94a3b8"
                  value={materialSupplied}
                  onChangeText={setMaterialSupplied}
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Vendor Category</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Raw Material / Tooling / Fasteners"
                  placeholderTextColor="#94a3b8"
                  value={vendorCategory}
                  onChangeText={setVendorCategory}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Payment Terms</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Net 30 / Advance 20%"
                  placeholderTextColor="#94a3b8"
                  value={paymentTerms}
                  onChangeText={setPaymentTerms}
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Lead Time</Text>
                <TextInput
                  style={styles.input}
                  placeholder="7 Days"
                  placeholderTextColor="#94a3b8"
                  value={leadTime}
                  onChangeText={setLeadTime}
                />
              </View>
            </View>

            <Text style={styles.label}>Vendor Status</Text>
            <View style={styles.statusRow}>
              {(['ACTIVE', 'INACTIVE'] as VendorStatus[]).map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.statusChip, status === s && styles.statusChipActive]}
                  onPress={() => setStatus(s)}
                >
                  <Text style={[styles.statusChipText, status === s && styles.statusChipTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* SECTION 5: ADDITIONAL NOTES */}
            <Text style={styles.sectionHeader}>5. Additional Information</Text>
            <Text style={styles.label}>Remarks / Contract Notes</Text>
            <TextInput
              style={[styles.input, { height: 50 }]}
              placeholder="e.g. ISO 9001 certified supplier, TPI inspection approved..."
              placeholderTextColor="#94a3b8"
              multiline
              value={remarks}
              onChangeText={setRemarks}
            />

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
              <Text style={styles.submitBtnText}>{vendorToEdit ? 'Update Vendor Details' : '+ Register Supplier Vendor'}</Text>
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
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 580,
    maxHeight: '92%',
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
    fontWeight: '800',
  },
  formScroll: {
    maxHeight: 540,
  },
  sectionHeader: {
    color: Colors.accentTeal,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  label: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
    marginBottom: 2,
  },
  input: {
    backgroundColor: Colors.inputBg,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    color: Colors.textLight,
    fontSize: 12,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  col: {
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  statusChip: {
    backgroundColor: Colors.inputBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  statusChipActive: {
    backgroundColor: Colors.accentTeal,
    borderColor: Colors.accentTeal,
  },
  statusChipText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  statusChipTextActive: {
    color: Colors.white,
  },
  submitBtn: {
    backgroundColor: Colors.industrialOrange,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 10,
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
    marginBottom: 6,
  },
});
