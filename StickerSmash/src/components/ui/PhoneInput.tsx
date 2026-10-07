import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TextInputProps, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { Radius } from '../../theme';

export interface PhoneInputProps extends Omit<TextInputProps, 'onChangeText'> {
  onChangeText?: (text: string) => void;
  value?: string;
}

const COUNTRY_CODES = [
  { code: '+91', name: 'India', flag: '🇮🇳', regex: /^\d{10}$/ },
  { code: '+1', name: 'US/Canada', flag: '🇺🇸', regex: /^\d{10}$/ },
  { code: '+44', name: 'UK', flag: '🇬🇧', regex: /^\d{10,11}$/ },
  { code: '+61', name: 'Australia', flag: '🇦🇺', regex: /^\d{9}$/ },
  { code: '+971', name: 'UAE', flag: '🇦🇪', regex: /^\d{9}$/ },
  { code: '+49', name: 'Germany', flag: '🇩🇪', regex: /^\d{10,11}$/ },
  { code: '+65', name: 'Singapore', flag: '🇸🇬', regex: /^\d{8}$/ },
];

export const PhoneInput: React.FC<PhoneInputProps> = (props) => {
  const { value = '', onChangeText, style, ...rest } = props;
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
  const [localNumber, setLocalNumber] = useState('');
  
  useEffect(() => {
    let found = false;
    for (const c of COUNTRY_CODES) {
      if (value.startsWith(c.code + ' ')) {
        setSelectedCountry(c);
        setLocalNumber(value.replace(c.code + ' ', ''));
        found = true;
        break;
      }
    }
    if (!found && value) {
      setLocalNumber(value);
    }
  }, [value]);

  const handleNumberChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    setLocalNumber(cleaned);
    if (onChangeText) {
      onChangeText(`${selectedCountry.code} ${cleaned}`);
    }
  };
  
  const handleCountryChange = (country: typeof COUNTRY_CODES[0]) => {
    setSelectedCountry(country);
    setModalVisible(false);
    if (onChangeText) {
      onChangeText(`${country.code} ${localNumber}`);
    }
  };

  const isValid = localNumber === '' || selectedCountry.regex.test(localNumber);

  return (
    <View>
      <View style={[styles.container, !isValid && styles.invalidContainer, style]}>
        <TouchableOpacity 
          style={styles.countrySelector}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.flagText}>{selectedCountry.flag}</Text>
          <Text style={styles.codeText}>{selectedCountry.code}</Text>
        </TouchableOpacity>
        
        <TextInput
          {...rest}
          style={styles.input}
          keyboardType="phone-pad"
          value={localNumber}
          onChangeText={handleNumberChange}
          placeholderTextColor="#4b5563"
        />
      </View>
      {!isValid && (
        <Text style={styles.errorText}>Invalid number for {selectedCountry.name}</Text>
      )}

      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setModalVisible(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country Code</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeBtn}>Close</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={COUNTRY_CODES}
              keyExtractor={(item) => item.code}
              renderItem={({item}) => (
                <TouchableOpacity 
                  style={styles.countryItem}
                  onPress={() => handleCountryChange(item)}
                >
                  <Text style={styles.countryItemFlag}>{item.flag}</Text>
                  <Text style={styles.countryItemName}>{item.name}</Text>
                  <Text style={styles.countryItemCode}>{item.code}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: Radius.sm || 4,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  invalidContainer: {
    borderColor: '#ef4444',
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  flagText: {
    fontSize: 16,
    marginRight: 6,
  },
  codeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxWidth: 360,
    maxHeight: '70%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
  },
  countryItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    alignItems: 'center',
  },
  countryItemFlag: {
    fontSize: 24,
    width: 40,
  },
  countryItemName: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  countryItemCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  }
});
