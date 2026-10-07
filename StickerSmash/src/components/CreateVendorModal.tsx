import React, { useState, useEffect } from 'react';
import { View, Text, Platform, Modal, TouchableOpacity, TextInput, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { useERP } from '../context/ERPContext';
import { Vendor, VendorStatus } from '../types';
import { Colors, Spacing, Radius, Shadows } from '../theme';
import * as XLSX from 'xlsx';

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
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
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

  useEffect(() => {
    if (vendorToEdit) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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

  
  const [successMsg, setSuccessMsg] = useState('');

  const processExcelData = async (binaryStr: string) => {
    try {
      setSuccessMsg('Processing Excel Data...');
      const workbook = XLSX.read(binaryStr, { type: 'binary' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      let successCount = 0;
      const processedCodes = new Set<string>();


      for (const rawRow of data as any[]) {
        const row: any = {};
        for (const key in rawRow) {
          row[key.replace(/\s+/g, '').toLowerCase()] = rawRow[key];
        }

        const vCode = row['vendorcode'] || row['code'] || row['vendorid'];
        const vName = row['vendorname'] || row['name'] || row['companyname'];
        if (!vCode || !vName) {
          console.warn('Skipping row due to missing code or name:', rawRow);
          continue;
        }
          
        const normalizedCode = vCode.toString().trim().toLowerCase();
        if (processedCodes.has(normalizedCode)) continue;
        processedCodes.add(normalizedCode);

        try {
          await createVendor({
            vendorCode: vCode.toString().trim(),
            vendorName: vName.toString().trim(),
            companyName: row['companyname'] ? row['companyname'].toString().trim() : '',
            contactPerson: row['contactperson'] ? row['contactperson'].toString().trim() : 'N/A',
            mobileNumber: row['mobilenumber'] || row['contactno'] || row['phone'] ? (row['mobilenumber'] || row['contactno'] || row['phone']).toString().trim() : '0000000000',
            email: row['email'] ? row['email'].toString().trim() : 'N/A',
            materialSupplied: row['materialsupplied'] || row['material'] || row['supplied'] ? (row['materialsupplied'] || row['material'] || row['supplied']).toString().trim() : 'Various',
            vendorCategory: row['vendorcategory'] || row['category'] ? (row['vendorcategory'] || row['category']).toString().trim() : 'General',
            status: 'ACTIVE',
            website: row['website'] ? row['website'].toString().trim() : '',
            addressLine1: row['city'] || row['address'] ? (row['city'] || row['address']).toString().trim() : '',
            country: 'India',
          });
          successCount++;
        } catch (e: any) {
          console.warn('Skipping vendor duplicate or error:', e.message || e);
        }
      }

      if (successCount > 0) {
        setSuccessMsg(`Successfully imported ${successCount} vendors from Excel.`);
        setTimeout(() => {
          setSuccessMsg('');
          handleClose();
        }, 2000);
      } else {
        setError('No valid/new vendors found in the Excel file.');
        setSuccessMsg('');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to parse Excel file. Ensure it is a valid .xlsx or .xls file.');
      setSuccessMsg('');
    }
  };

  const handleFileUpload = (e: any) => {
    let file;
    const dt = e.dataTransfer || (e.nativeEvent && e.nativeEvent.dataTransfer);
    const target = e.target || (e.nativeEvent && e.nativeEvent.target);

    if (dt && dt.files && dt.files.length > 0) {
      file = dt.files[0];
    } else if (target && target.files && target.files.length > 0) {
      file = target.files[0];
    }

    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target?.result as string;
        processExcelData(bstr);
      };
      reader.readAsBinaryString(file);
    }
  };

  const handleSubmit = async () => {
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
        await updateVendor(vendorToEdit.id, {
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
        await createVendor({
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
      <TouchableOpacity style={[styles.backdrop, isMobile && { padding: 10 }]} activeOpacity={1} onPress={handleClose}>
        <TouchableOpacity activeOpacity={1} style={[styles.card, isMobile && { padding: 14, maxHeight: '95%' }]} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>{vendorToEdit ? 'Edit Vendor Details' : 'Register New Supplier Vendor'}</Text>
            <TouchableOpacity onPress={handleClose}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          
            </View>

            {error ? <Text style={styles.errorText}>⚠️ {error}</Text> : null}
            {successMsg ? <Text style={[styles.errorText, { color: Colors.successBright, backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: Colors.successBright }]}>✅ {successMsg}</Text> : null}

            <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
              <View style={{ paddingBottom: 10 }}>
                {Platform.OS === 'web' && !vendorToEdit && (
                  <View
                    // @ts-ignore
                    onDragOver={(e: any) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e: any) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleFileUpload(e);
                    }}
                    style={{
                      borderWidth: 2,
                      borderColor: '#0284c7',
                      borderStyle: 'dashed',
                      borderRadius: 8,
                      padding: 40,
                      minHeight: 160,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(2, 132, 199, 0.03)',
                      marginBottom: 16,
                    }}
                  >
                    <Text style={{ color: '#0284c7', fontWeight: 'bold', fontSize: 14, marginBottom: 8, textAlign: 'center' }}>
                      📁 Bulk Import via Excel
                    </Text>
                    <Text style={{ color: '#64748b', fontSize: 12, textAlign: 'center', lineHeight: 18, paddingHorizontal: 10 }}>
                      Drag & drop your Excel file here or click below to upload. {'\n'}
                      <Text style={{ fontWeight: '600' }}>Required Columns:</Text> VendorCode, VendorName
                    </Text>
                    
                    <TouchableOpacity
                      style={{
                        marginTop: 16,
                        backgroundColor: Colors.white,
                        borderWidth: 1,
                        borderColor: '#bae6fd',
                        paddingHorizontal: 20,
                        paddingVertical: 10,
                        borderRadius: 6,
                      }}
                      onPress={() => {
                        const el = document.getElementById('excel-upload-input-vendor');
                        if (el) el.click();
                      }}
                    >
                      <Text style={{ color: '#0284c7', fontSize: 13, fontWeight: '700' }}>Browse Files</Text>
                    </TouchableOpacity>
                    <input 
                      id="excel-upload-input-vendor"
                      type="file" 
                      accept=".xlsx, .xls" 
                      onChange={handleFileUpload} 
                      style={{ display: 'none' }} 
                    />
                  </View>
                )}
              </View>


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
