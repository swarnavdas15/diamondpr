import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, ScrollView, StyleSheet } from 'react-native';
import { useERP } from '../context/ERPContext';
import { Colors, Spacing, Radius, Shadows } from '../theme';
import { SearchableDropdown } from './ui/SearchableDropdown';
import { CreateClientModal } from './CreateClientModal';
import { Client } from '../types';

export interface InitialOrderData {
  clientId?: string;
  poNumber?: string;
  budget?: number;
  technicalRequirements?: string;
  materialRequirements?: string;
  requiredQuantity?: number;
  purchaseRequired?: boolean;
  productionRequired?: boolean;
  qualityTestingRequired?: boolean;
  dispatchRequired?: boolean;
  quotationNumber?: string;
}

interface CreateOrderModalProps {
  visible: boolean;
  onClose: () => void;
  initialData?: InitialOrderData | null;
}

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({ visible, onClose, initialData }) => {
  const { clients, createOrder } = useERP();

  const [createClientVisible, setCreateClientVisible] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [clientId, setClientId] = useState(clients[0]?.id || '');
  const [poNumber, setPoNumber] = useState('');
  const [budget, setBudget] = useState('');
  const [technicalRequirements, setTechnicalRequirements] = useState('');
  const [materialRequirements, setMaterialRequirements] = useState('');
  const [requiredQuantity, setRequiredQuantity] = useState('50');

  // Pipeline Customizer Options
  const [purchaseRequired, setPurchaseRequired] = useState(true);
  const [productionRequired, setProductionRequired] = useState(true);
  const [qualityTestingRequired, setQualityTestingRequired] = useState(true);
  const [dispatchRequired, setDispatchRequired] = useState(true);

  // Line item
  const [itemName, setItemName] = useState('SS316L Weld Neck Flange');
  const [size, setSize] = useState('6 inch 600# RF');
  const [unitPrice, setUnitPrice] = useState('4500');

  const [error, setError] = useState('');

  React.useEffect(() => {
    if (initialData) {
      if (initialData.clientId) setClientId(initialData.clientId);
      if (initialData.poNumber) setPoNumber(initialData.poNumber);
      if (initialData.budget) setBudget(String(initialData.budget));
      if (initialData.technicalRequirements) setTechnicalRequirements(initialData.technicalRequirements);
      if (initialData.materialRequirements) setMaterialRequirements(initialData.materialRequirements);
      if (initialData.requiredQuantity) setRequiredQuantity(String(initialData.requiredQuantity));
      if (initialData.purchaseRequired !== undefined) setPurchaseRequired(initialData.purchaseRequired);
      if (initialData.productionRequired !== undefined) setProductionRequired(initialData.productionRequired);
      if (initialData.qualityTestingRequired !== undefined) setQualityTestingRequired(initialData.qualityTestingRequired);
      if (initialData.dispatchRequired !== undefined) setDispatchRequired(initialData.dispatchRequired);
    }
  }, [initialData]);

  const handleClientCreated = (newClient: Client) => {
    setClientId(newClient.id);
    setSuccessMsg('Client Registered Successfully');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleSubmit = () => {
    if (!poNumber.trim() || !clientId) {
      setError('PO Number and Client selection are required.');
      return;
    }

    createOrder({
      poNumber,
      clientId,
      budget: budget ? parseFloat(budget) : undefined,
      technicalRequirements,
      materialRequirements,
      requiredQuantity: parseInt(requiredQuantity, 10) || 1,

      // Pipeline customizer selections
      purchaseRequired,
      productionRequired,
      qualityTestingRequired,
      dispatchRequired,

      items: [
        {
          itemName,
          size,
          quantity: parseInt(requiredQuantity, 10) || 1,
          unitPrice: unitPrice ? parseFloat(unitPrice) : undefined,
        },
      ],
    });

    handleClose();
  };

  const handleClose = () => {
    setPoNumber('');
    setBudget('');
    setTechnicalRequirements('');
    setMaterialRequirements('');
    setRequiredQuantity('50');
    setPurchaseRequired(true);
    setProductionRequired(true);
    setQualityTestingRequired(true);
    setDispatchRequired(true);
    setError('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose}>
        <TouchableOpacity activeOpacity={1} style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>Sales: Create Order & Custom Pipeline</Text>
            <TouchableOpacity onPress={handleClose}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {successMsg ? <Text style={[styles.errorText, { color: Colors.successBright, backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: Colors.successBright }]}>✅ {successMsg}</Text> : null}

            {/* Client Searchable Dropdown */}
            <SearchableDropdown
              label="Select Client"
              placeholder="Search or select a registered client..."
              options={clients.map((c) => ({
                id: c.id,
                label: c.companyName,
                code: c.clientCode,
                sublabel: c.contactName ? `Contact: ${c.contactName}` : undefined,
              }))}
              selectedValue={clientId}
              onSelect={(id) => setClientId(id)}
              allowManual={true}
              manualLabel="+ Manual / New Client"
              manualId=""
              onManualPress={() => setCreateClientVisible(true)}
              required
            />

            <Text style={styles.label}>PO Number (Purchase Order Ref) *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. PO-APEX-9981"
              placeholderTextColor="#94a3b8"
              value={poNumber}
              onChangeText={setPoNumber}
            />

            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text style={styles.label}>Required Quantity</Text>
                <TextInput
                  style={styles.input}
                  placeholder="50"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={requiredQuantity}
                  onChangeText={setRequiredQuantity}
                />
              </View>
              <View style={styles.flex1}>
                <Text style={styles.label}>Order Budget (₹)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="225000"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={budget}
                  onChangeText={setBudget}
                />
              </View>
            </View>

            {/* Pipeline Customizer Section */}
            <View style={styles.pipelineCustomizerBox}>
              <Text style={styles.customizerTitle}>PIPELINE CUSTOMIZER</Text>
              <Text style={styles.customizerSub}>
                Select required department workflows for this order. System will dynamically generate stage sequences.
              </Text>

              <View style={styles.checkboxGrid}>
                <TouchableOpacity
                  style={[styles.checkboxRow, purchaseRequired && styles.checkboxRowActive]}
                  onPress={() => setPurchaseRequired(!purchaseRequired)}
                >
                  <Text style={styles.checkIcon}>{purchaseRequired ? '☑' : '☐'}</Text>
                  <Text style={styles.checkLabel}>Purchase Required</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.checkboxRow, productionRequired && styles.checkboxRowActive]}
                  onPress={() => setProductionRequired(!productionRequired)}
                >
                  <Text style={styles.checkIcon}>{productionRequired ? '☑' : '☐'}</Text>
                  <Text style={styles.checkLabel}>In-House Production Required</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.checkboxRow, qualityTestingRequired && styles.checkboxRowActive]}
                  onPress={() => setQualityTestingRequired(!qualityTestingRequired)}
                >
                  <Text style={styles.checkIcon}>{qualityTestingRequired ? '☑' : '☐'}</Text>
                  <Text style={styles.checkLabel}>Quality Testing Required</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.checkboxRow, dispatchRequired && styles.checkboxRowActive]}
                  onPress={() => setDispatchRequired(!dispatchRequired)}
                >
                  <Text style={styles.checkIcon}>{dispatchRequired ? '☑' : '☐'}</Text>
                  <Text style={styles.checkLabel}>Dispatch Required</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.label}>Technical Specifications & Standards</Text>
            <TextInput
              style={[styles.input, { height: 50 }]}
              placeholder="e.g., High Pressure Stainless Steel Flanges SS316L, 600# Rating, Serrated Finish."
              placeholderTextColor="#94a3b8"
              multiline
              value={technicalRequirements}
              onChangeText={setTechnicalRequirements}
            />

            <Text style={styles.label}>Raw Material Requirements</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., SS316L Round Bars Dia 250mm"
              placeholderTextColor="#94a3b8"
              value={materialRequirements}
              onChangeText={setMaterialRequirements}
            />

            <View style={styles.lineItemBox}>
              <Text style={styles.lineItemTitle}>Primary Item Details</Text>
              <TextInput
                style={styles.input}
                placeholder="Item Name (e.g. SS316L Weld Neck Flange)"
                placeholderTextColor="#94a3b8"
                value={itemName}
                onChangeText={setItemName}
              />
              <View style={styles.row}>
                <View style={styles.flex1}>
                  <TextInput
                    style={styles.input}
                    placeholder="Size (e.g. 6 inch 600# RF)"
                    placeholderTextColor="#94a3b8"
                    value={size}
                    onChangeText={setSize}
                  />
                </View>
                <View style={styles.flex1}>
                  <TextInput
                    style={styles.input}
                    placeholder="Unit Price (₹)"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    value={unitPrice}
                    onChangeText={setUnitPrice}
                  />
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
              <Text style={styles.submitBtnText}>Initiate Order with Configured Pipeline</Text>
            </TouchableOpacity>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
      {/* Nested Register New Client Modal */}
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
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 620,
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
    marginBottom: 12,
  },
  title: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: '800',
  },
  close: {
    color: Colors.accentTeal,
    fontSize: 14,
  },
  scroll: {
    flex: 1,
  },
  label: {
    color: Colors.accentTeal,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 4,
  },
  input: {
    backgroundColor: Colors.inputBg,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: Colors.textLight,
    fontSize: 13,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  clientPickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  clientChip: {
    backgroundColor: Colors.inputBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  clientChipActive: {
    backgroundColor: Colors.accentTeal,
    borderColor: Colors.accentTeal,
  },
  clientChipText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  clientChipTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },
  pipelineCustomizerBox: {
    backgroundColor: Colors.inputBg,
    borderRadius: 10,
    padding: 12,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: Colors.accentTeal,
  },
  customizerTitle: {
    color: Colors.accentTeal,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  customizerSub: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
    marginBottom: 10,
  },
  checkboxGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBg,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    gap: 6,
  },
  checkboxRowActive: {
    borderColor: Colors.accentTeal,
  },
  checkIcon: {
    color: Colors.accentTeal,
    fontSize: 14,
    fontWeight: '800',
  },
  checkLabel: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '600',
  },
  lineItemBox: {
    backgroundColor: Colors.inputBg,
    borderRadius: 8,
    padding: 12,
    marginVertical: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  lineItemTitle: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '700',
  },
  errorText: {
    color: Colors.dangerBright,
    fontSize: 12,
    marginBottom: 8,
  },
  submitBtn: {
    backgroundColor: Colors.industrialOrange,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
    ...Shadows.glowOrange,
  },
  submitBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
});
