import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, StyleSheet, ScrollView, useWindowDimensions, Image, Platform } from 'react-native';
import * as XLSX from 'xlsx';
import * as ImagePicker from 'expo-image-picker';
import { useERP } from '../context/ERPContext';
import { Colors, Spacing, Radius, Shadows } from '../theme';

import { Client } from '../types';
import { PhoneInput } from './ui/PhoneInput';

interface CreateClientModalProps {
  visible: boolean;
  onClose: () => void;
  onClientCreated?: (client: Client) => void;
}

export const CreateClientModal: React.FC<CreateClientModalProps> = ({ visible, onClose, onClientCreated }) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const { clients, createClient, uploadClientProfileImage, uploadPrimaryContactProfileImage } = useERP();

  const [clientCode, setClientCode] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [industry, setIndustry] = useState('');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  

  const processExcelData = async (binaryStr: string) => {
    try {
      const workbook = XLSX.read(binaryStr, { type: 'binary' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      let successCount = 0;
      const processedCodes = new Set<string>();

      for (const row of data as any[]) {
        const clientCode = row['ClientCode'];
        const companyName = row['CompanyName'];
        const contactNo = row['ContactNo'];
        
        if (!clientCode || !companyName || !contactNo) {
          continue; // Skip invalid rows
        }

        const normalizedCode = clientCode.toString().trim().toLowerCase();

        const isDuplicateInState = clients.some(
          (c) => (c.clientCode || c.clientCode || '').trim().toLowerCase() === normalizedCode
        );

        if (!isDuplicateInState && !processedCodes.has(normalizedCode)) {
          processedCodes.add(normalizedCode);
          try {
            await createClient({
              clientCode: clientCode.toString(),
              companyName: companyName.toString(),
              contactNo: contactNo.toString(),
              contactName: row['ContactName'] ? row['ContactName'].toString() : '',
              email: row['Email'] ? row['Email'].toString() : '',
              address: row['Address'] ? row['Address'].toString() : '',
              gstNumber: row['GSTNumber'] ? row['GSTNumber'].toString() : '',
              industry: row['Industry'] ? row['Industry'].toString() : '',
              remarks: row['Remarks'] ? row['Remarks'].toString() : '',
            });
            successCount++;
          } catch (e) {
            console.error('Failed to create client from Excel row:', row, e);
          }
        }
      }

      if (successCount > 0) {
        setSuccessMsg(`Successfully imported ${successCount} clients from Excel.`);
        setTimeout(() => handleClose(), 2000);
      } else {
        setError('No valid/new clients found in the Excel file.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to parse Excel file.');
    }
  };

  const handleFileUpload = (e: any) => {
    let file;
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      file = e.dataTransfer.files[0];
    } else if (e.target && e.target.files && e.target.files.length > 0) {
      file = e.target.files[0];
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

  const [companyImageUri, setCompanyImageUri] = useState<string | null>(null);
  const [contactImageUri, setContactImageUri] = useState<string | null>(null);

  const pickCompanyImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setCompanyImageUri(result.assets[0].uri);
    }
  };

  const pickContactImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setContactImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    setError('');
    setSuccessMsg('');

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
      (c) => (c.clientCode || c.clientCode || '').trim().toLowerCase() === trimmedCode.toLowerCase()
    );

    if (isDuplicate) {
      setError(`Client Code "${trimmedCode}" already exists. Duplicate Client Codes are not allowed.`);
      return;
    }

    try {
      const newClient = await createClient({
        clientCode: trimmedCode,
        companyName: trimmedCompany,
        contactName: contactName.trim(),
        contactNo: trimmedContact,
        email: email.trim(),
        address: address.trim(),
        gstNumber: gstNumber.trim(),
        panNumber: panNumber.trim(),
        websiteUrl: websiteUrl.trim(),
        industry: industry.trim(),
        remarks: remarks.trim(),
      });

      if (companyImageUri || contactImageUri) {
        setSuccessMsg('Uploading images...');
        
        if (companyImageUri) {
          let filename = companyImageUri.split('/').pop() || 'company.jpg';
          if (!/\.(jpg|jpeg|png|webp)$/i.test(filename)) { filename = `${filename}.jpg`; }
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : `image/jpeg`;
          try {
            await uploadClientProfileImage(newClient.id, companyImageUri, filename, type);
          } catch (err) {
            console.error(err);
          }
        }
        
        if (contactImageUri) {
          let filename = contactImageUri.split('/').pop() || 'contact.jpg';
          if (!/\.(jpg|jpeg|png|webp)$/i.test(filename)) { filename = `${filename}.jpg`; }
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : `image/jpeg`;
          try {
            await uploadPrimaryContactProfileImage(newClient.id, contactImageUri, filename, type);
          } catch (err) {
            console.error('Failed to upload primary contact image:', err);
          }
        }
      }

      if (onClientCreated) {
        onClientCreated(newClient);
      }

      setSuccessMsg('Client Registered Successfully');
      setTimeout(() => {
        handleClose();
      }, 500);
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
    setPanNumber('');
    setWebsiteUrl('');
    setIndustry('');
    setRemarks('');
    setError('');
    setSuccessMsg('');
    setCompanyImageUri(null);
    setContactImageUri(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View
        // @ts-ignore
        onDragEnter={(e: any) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
        style={{ flex: 1 }}
      >
        <TouchableOpacity style={[styles.backdrop, isMobile && { padding: 10 }]} activeOpacity={1} onPress={handleClose}>
          <TouchableOpacity activeOpacity={1} style={[styles.card, isMobile && { padding: 14, maxHeight: '95%' }]} onPress={(e) => e.stopPropagation()}>
            
            {Platform.OS === 'web' && isDragging && (
              <View
                // @ts-ignore
                onDragOver={(e: any) => { e.preventDefault(); e.stopPropagation(); }}
                onDragLeave={(e: any) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
                onDrop={(e: any) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(false);
                  handleClose(); // Close modal immediately
                  handleFileUpload(e); // Process file
                }}
                style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: 'rgba(2, 132, 199, 0.9)',
                  zIndex: 9999,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 4,
                  borderColor: '#fff',
                  borderStyle: 'dashed',
                  borderRadius: 12
                }}
              >
                <Text style={{ color: '#fff', fontSize: 32, fontWeight: 'bold' }}>Drop Excel File Here</Text>
                <Text style={{ color: '#bae6fd', fontSize: 16, marginTop: 12 }}>Release to immediately parse & close</Text>
              </View>
            )}

            <View style={styles.header}>
            <Text style={styles.title}>Register New Client</Text>
            <TouchableOpacity onPress={handleClose}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.errorText}>⚠️ {error}</Text> : null}
          {successMsg ? <Text style={[styles.errorText, { color: Colors.successBright, backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: Colors.successBright }]}>✅ {successMsg}</Text> : null}

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.formContent}>
              {Platform.OS === 'web' && (
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
                    📥 Bulk Import via Excel
                  </Text>
                  <Text style={{ color: '#64748b', fontSize: 12, textAlign: 'center', lineHeight: 18, paddingHorizontal: 10 }}>
                    Drag & drop your Excel file here or click below to upload. {'\n'}
                    <Text style={{ fontWeight: '600' }}>Required Columns:</Text> ClientCode, CompanyName, ContactNo
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
                      const el = document.getElementById('excel-upload-input');
                      if (el) el.click();
                    }}
                  >
                    <Text style={{ color: '#0284c7', fontSize: 13, fontWeight: '700' }}>Browse Files</Text>
                  </TouchableOpacity>
                  <input 
                    id="excel-upload-input"
                    type="file" 
                    accept=".xlsx, .xls" 
                    onChange={handleFileUpload} 
                    style={{ display: 'none' }} 
                  />
                </View>
              )}
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

              <Text style={styles.label}>Company Profile Image / Logo</Text>
              <TouchableOpacity style={styles.imagePickerBtn} onPress={pickCompanyImage}>
                {companyImageUri ? (
                  <Image source={{ uri: companyImageUri }} style={styles.previewImage} />
                ) : (
                  <Text style={styles.imagePickerText}>+ Select Company Logo</Text>
                )}
              </TouchableOpacity>

              <Text style={styles.label}>Contact Profile Image</Text>
              <TouchableOpacity style={styles.imagePickerBtn} onPress={pickContactImage}>
                {contactImageUri ? (
                  <Image source={{ uri: contactImageUri }} style={styles.previewImage} />
                ) : (
                  <Text style={styles.imagePickerText}>+ Select Contact Image</Text>
                )}
              </TouchableOpacity>

              <Text style={styles.label}>Contact Person Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Rajesh Mehta"
                placeholderTextColor="#94a3b8"
                value={contactName}
                onChangeText={setContactName}
              />

              <Text style={styles.label}>Mobile / Contact Number *</Text>
              <PhoneInput
                style={{ marginBottom: 12 }}
                placeholder="e.g. 98765 43210"
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

              <Text style={styles.label}>PAN Number</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. AAACA12341"
                placeholderTextColor="#94a3b8"
                value={panNumber}
                onChangeText={setPanNumber}
                autoCapitalize="characters"
              />

              <Text style={styles.label}>Website URL</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. www.apex-heavy.com"
                placeholderTextColor="#94a3b8"
                value={websiteUrl}
                onChangeText={setWebsiteUrl}
              />

              <Text style={styles.label}>Industry Type</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Oil & Gas, Valve Manufacturing, Aerospace"
                placeholderTextColor="#94a3b8"
                value={industry}
                onChangeText={setIndustry}
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
      </View>
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
    paddingVertical: 10,
    minHeight: 44,
    color: Colors.textLight,
    fontSize: 12,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },

  imagePickerBtn: {
    backgroundColor: Colors.inputBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    borderStyle: 'dashed',
    height: 100,
    width: 100,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 8,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePickerText: {
    color: Colors.accentTeal,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
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
