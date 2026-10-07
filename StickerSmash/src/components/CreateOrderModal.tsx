import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, ScrollView, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import * as XLSX from 'xlsx';
import { apiClient } from '../api/client';
import { useERP } from '../context/ERPContext';
import { useAuth } from '../context/AuthContext';
import { Colors, Spacing, Radius, Shadows } from '../theme';
import { SearchableDropdown } from './ui/SearchableDropdown';
import { CreateClientModal } from './CreateClientModal';
import { Client, CustomStage } from '../types';

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
  const { clients, createOrder, refreshData } = useERP();
  const { users } = useAuth();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [createClientVisible, setCreateClientVisible] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [clientId, setClientId] = useState(clients[0]?.id || '');
  const [poNumber, setPoNumber] = useState('');
  const [budget, setBudget] = useState('');
  const [technicalRequirements, setTechnicalRequirements] = useState('');
  const [materialRequirements, setMaterialRequirements] = useState('');
  const [requiredQuantity, setRequiredQuantity] = useState('');

  // Pipeline Customizer Options
  const [purchaseRequired, setPurchaseRequired] = useState(true);
  const [productionRequired, setProductionRequired] = useState(true);
  const [qualityTestingRequired, setQualityTestingRequired] = useState(true);
  const [dispatchRequired, setDispatchRequired] = useState(true);

  // Custom Stages State
  const [customStages, setCustomStages] = useState<CustomStage[]>([]);
  const [addStageModalVisible, setAddStageModalVisible] = useState(false);
  const [newStageName, setNewStageName] = useState('');
  const [newStageDesc, setNewStageDesc] = useState('');
  const [newStageDept, setNewStageDept] = useState('PRODUCTION');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Line item
  const [itemName, setItemName] = useState('');
  const [size, setSize] = useState('');
  const [unitPrice, setUnitPrice] = useState('');

  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  React.useEffect(() => {
    if (Platform.OS !== 'web' || !visible) {
      setIsDragging(false);
      return;
    }
    
    const preventDefaults = (e: any) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDragEnter = (e: any) => {
      preventDefaults(e);
      setIsDragging(true);
    };

    const handleDragLeave = (e: any) => {
      preventDefaults(e);
      // Only hide overlay if we are leaving the window entirely
      if (!e.relatedTarget || e.relatedTarget === document.documentElement) {
        setIsDragging(false);
      }
    };

    const handleDrop = (e: any) => {
      preventDefaults(e);
      setIsDragging(false);
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragover', preventDefaults);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragover', preventDefaults);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
      setIsDragging(false);
    };
  }, [visible]);


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

  const handleAddStage = () => {
    if (!newStageName.trim()) return;
    const assignedUserNames = users
      .filter((u) => selectedUserIds.includes(u.id))
      .map((u) => u.name);

    const newStage: CustomStage = {
      id: `cs-${Date.now()}`,
      stageName: newStageName.trim(),
      description: newStageDesc.trim(),
      department: newStageDept,
      assignedUserIds: selectedUserIds,
      assignedUserNames,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    setCustomStages((prev) => [...prev, newStage]);
    setNewStageName('');
    setNewStageDesc('');
    setSelectedUserIds([]);
    setAddStageModalVisible(false);
  };

  const handleRemoveCustomStage = (id: string) => {
    setCustomStages((prev) => prev.filter((s) => s.id !== id));
  };

  const processExcelData = async (data: any[]) => {
      setSuccessMsg('Processing Excel Data...');
      let successCount = 0;
      let errCount = 0;
      
      const validOrders: any[] = [];
      data.forEach((row) => {
        const client = clients.find(c => 
          (row.ClientCode && (c.clientCode || '').toLowerCase() === String(row.ClientCode).toLowerCase()) || 
          (row.ClientCode && (c.companyName || '').toLowerCase() === String(row.ClientCode).toLowerCase())
        );
        if (!client) {
          errCount++;
          return;
        }
        validOrders.push({
          clientId: client.id,
          poNumber: row.PONumber ? row.PONumber.toString() : '',
          convertedOrderValue: row.Budget ? parseFloat(row.Budget) : 0,
          technicalRequirements: row.TechnicalRequirements || '',
          materialRequirements: row.MaterialRequirements || '',
          requiredQuantity: row.RequiredQuantity ? parseInt(row.RequiredQuantity, 10) : 1,
          purchaseRequired: true,
          productionRequired: true,
          qualityTestingRequired: true,
          dispatchRequired: true,
          items: [{
             itemName: row.ItemName || 'Bulk Imported Item',
             size: row.Size || '',
             quantity: row.RequiredQuantity ? parseInt(row.RequiredQuantity, 10) : 1,
             unitPrice: row.UnitPrice ? parseFloat(row.UnitPrice) : undefined,
          }]
        });
      });
      
      const chunkSize = 20;
      for (let i = 0; i < validOrders.length; i += chunkSize) {
        const chunk = validOrders.slice(i, i + chunkSize);
        await Promise.all(
          chunk.map((orderData) =>
            apiClient.post(`/orders`, orderData).then(() => { successCount++; }).catch(e => { errCount++; console.error(e); })
          )
        );
      }
      
      if (successCount > 0) {
        await refreshData();
        
      setSuccessMsg(`Successfully imported ${successCount} orders from Excel.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      if (errCount === 0) handleClose();
    } else {
      setError(`Failed to import orders. Check if ClientCode matches your registered clients.`);
    }
  };

  const handleFileUpload = (e: any) => {
    const file = e.target?.files?.[0] || e.dataTransfer?.files?.[0] || (e.nativeEvent && e.nativeEvent.dataTransfer && e.nativeEvent.dataTransfer.files?.[0]) || (e.nativeEvent && e.nativeEvent.target && e.nativeEvent.target.files?.[0]);
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      processExcelData(data);
    };
    reader.readAsBinaryString(file);
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
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
      customStages,

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
    setRequiredQuantity('');
    setPurchaseRequired(true);
    setProductionRequired(true);
    setQualityTestingRequired(true);
    setDispatchRequired(true);
    setCustomStages([]);
    setError('');
    onClose();
  };

  const activeUsers = users.filter((u) => u.isActive !== false);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View
        // @ts-ignore
        onDragEnter={(e: any) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
        onDragOver={(e: any) => { e.preventDefault(); e.stopPropagation(); }}
        style={{ flex: 1 }}
      >
        {Platform.OS === 'web' && isDragging && (
          <View
            // @ts-ignore
            onDragOver={(e: any) => { e.preventDefault(); e.stopPropagation(); }}
            onDragLeave={(e: any) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
            onDrop={(e: any) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(false);
              handleClose();
              handleFileUpload(e);
            }}
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(2, 132, 199, 0.95)',
              zIndex: 999999,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 6,
              borderColor: '#fff',
              borderStyle: 'dashed',
            }}
          >
            <Text pointerEvents="none" style={{ color: '#fff', fontSize: 32, fontWeight: 'bold' }}>Drop Excel File Here</Text>
            <Text pointerEvents="none" style={{ color: '#bae6fd', fontSize: 16, marginTop: 12 }}>Release to immediately parse & close</Text>
          </View>
        )}
        <TouchableOpacity style={[styles.backdrop, isMobile && { padding: 10 }]} activeOpacity={1} onPress={handleClose}>
        <TouchableOpacity activeOpacity={1} style={[styles.card, isMobile && { padding: 14, maxHeight: '95%' }]} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>Sales: Create Order & Custom Pipeline</Text>
            <TouchableOpacity onPress={handleClose}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {successMsg ? <Text style={[styles.errorText, { color: Colors.successBright, backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: Colors.successBright }]}>✅ {successMsg}</Text> : null}

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
                  backgroundColor: 'rgba(2, 132, 199, 0.05)',
                  marginVertical: 12,
                }}
              >
                <Text style={{ color: '#0284c7', fontWeight: 'bold', marginBottom: 4 }}>
                  📥 Drag & Drop Excel File Here to Bulk Create Orders
                </Text>
                <Text style={{ color: '#94a3b8', fontSize: 11, textAlign: 'center' }}>
                  Required Columns: ClientCode, PONumber, Budget, RequiredQuantity{'\n'}
                  Optional Columns: ItemName, Size, UnitPrice, TechnicalRequirements, MaterialRequirements
                </Text>
                {/* Fallback File Input for clicking */}
                <TouchableOpacity
                  style={{
                    marginTop: 12,
                    backgroundColor: Colors.white,
                    borderWidth: 1,
                    borderColor: Colors.borderDark,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: Radius.sm,
                    ...Shadows.sm
                  }}
                  onPress={() => {
                    const el = document.getElementById('excel-upload-input-order');
                    if (el) el.click();
                  }}
                >
                  <Text style={{ color: Colors.textMuted, fontSize: 12, fontWeight: '700' }}>Upload Excel File</Text>
                </TouchableOpacity>
                <input 
                  id="excel-upload-input-order"
                  type="file" 
                  accept=".xlsx, .xls" 
                  onChange={handleFileUpload} 
                  style={{ display: 'none' }} 
                />
              </View>
            )}

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

            <View style={[styles.row, isMobile && { flexDirection: 'column', gap: 0 }]}>
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
              <View style={styles.customizerHeaderRow}>
                <Text style={styles.customizerTitle}>PIPELINE CUSTOMIZER</Text>
                <TouchableOpacity
                  style={styles.addStageBtn}
                  onPress={() => setAddStageModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.addStageBtnText}>➕ Add New Stage</Text>
                </TouchableOpacity>
              </View>
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

              {/* Render Custom Stages */}
              {customStages.length > 0 && (
                <View style={styles.customStagesListContainer}>
                  <Text style={styles.customStagesListTitle}>Configured Custom Workflow Stages:</Text>
                  {customStages.map((stg) => (
                    <View key={stg.id} style={styles.customStageCard}>
                      <View style={styles.customStageCardInfo}>
                        <View style={styles.customStageBadgeRow}>
                          <Text style={styles.customStageName}>{stg.stageName}</Text>
                          <View style={styles.deptBadge}>
                            <Text style={styles.deptBadgeText}>{stg.department}</Text>
                          </View>
                        </View>
                        {stg.description ? (
                          <Text style={styles.customStageDesc}>{stg.description}</Text>
                        ) : null}
                        {stg.assignedUserNames.length > 0 && (
                          <Text style={styles.customStageUsers}>
                            👤 Assigned Users: {stg.assignedUserNames.join(', ')}
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity
                        onPress={() => handleRemoveCustomStage(stg.id)}
                        style={styles.removeStageBtn}
                      >
                        <Text style={styles.removeStageText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
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

      {/* Add Custom Workflow Stage Modal */}
      <Modal visible={addStageModalVisible} transparent animationType="fade" onRequestClose={() => setAddStageModalVisible(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setAddStageModalVisible(false)}>
          <TouchableOpacity activeOpacity={1} style={[styles.card, { maxWidth: 500 }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.header}>
              <Text style={styles.title}>➕ Create New Custom Workflow Stage</Text>
              <TouchableOpacity onPress={() => setAddStageModalVisible(false)}>
                <Text style={styles.close}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 450 }}>
              <Text style={styles.label}>Stage Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Ultrasonic Flange Testing / Heat Treatment"
                placeholderTextColor="#94a3b8"
                value={newStageName}
                onChangeText={setNewStageName}
              />

              <Text style={styles.label}>Stage Description</Text>
              <TextInput
                style={[styles.input, { height: 50 }]}
                placeholder="Operational requirements or quality specifications for this stage"
                placeholderTextColor="#94a3b8"
                multiline
                value={newStageDesc}
                onChangeText={setNewStageDesc}
              />

              <Text style={styles.label}>Assign Department *</Text>
              <View style={styles.deptPillContainer}>
                {['PRODUCTION', 'PURCHASE', 'QUALITY_TESTING', 'DISPATCH', 'SALES'].map((dept) => (
                  <TouchableOpacity
                    key={dept}
                    style={[styles.deptPill, newStageDept === dept && styles.deptPillActive]}
                    onPress={() => setNewStageDept(dept)}
                  >
                    <Text style={[styles.deptPillText, newStageDept === dept && styles.deptPillTextActive]}>
                      {dept}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Assign User(s) from Directory (Multi-Select)</Text>
              <Text style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>
                Select active users who will automatically receive dashboard task assignments for this stage.
              </Text>

              <ScrollView
                style={styles.userSelectionContainer}
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
              >
                {activeUsers.map((u) => {
                  const isSelected = selectedUserIds.includes(u.id);
                  return (
                    <TouchableOpacity
                      key={u.id}
                      style={[styles.userRowItem, isSelected && styles.userRowItemActive]}
                      onPress={() => toggleUserSelection(u.id)}
                    >
                      <Text style={styles.userCheckIcon}>{isSelected ? '☑' : '☐'}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.userRowName, isSelected && { color: '#0284c7' }]}>{u.name}</Text>
                        <Text style={styles.userRowRole}>{u.role} • {u.email}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <TouchableOpacity style={[styles.submitBtn, { marginTop: 16 }]} onPress={handleAddStage}>
                <Text style={styles.submitBtnText}>Add Stage to Pipeline</Text>
              </TouchableOpacity>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
    paddingVertical: 10,
    minHeight: 44,
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
  customizerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  addStageBtn: {
    backgroundColor: 'rgba(2, 132, 199, 0.2)',
    borderWidth: 1,
    borderColor: '#0284c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    flexShrink: 0,
  },
  addStageBtnText: {
    color: '#0284c7',
    fontSize: 12,
    fontWeight: '700',
  },
  customStagesListContainer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  customStagesListTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38bdf8',
    marginBottom: 8,
  },
  customStageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 6,
  },
  customStageCardInfo: {
    flex: 1,
  },
  customStageBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customStageName: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '700',
  },
  deptBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  deptBadgeText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '700',
  },
  customStageDesc: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  customStageUsers: {
    color: '#cbd5e1',
    fontSize: 10,
    marginTop: 4,
  },
  removeStageBtn: {
    padding: 6,
  },
  removeStageText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '700',
  },
  deptPillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 6,
  },
  deptPill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  deptPillActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  deptPillText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '600',
  },
  deptPillTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  userSelectionContainer: {
    maxHeight: 200,
    flexGrow: 0,
    borderWidth: 1.5,
    borderColor: '#0284c7',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    ...(Platform.OS === 'web' ? { overflowY: 'auto' as any } : {}),
  },
  userRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  userRowItemActive: {
    backgroundColor: '#e0f2fe',
  },
  userCheckIcon: {
    fontSize: 14,
    color: '#0284c7',
  },
  userRowName: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '600',
  },
  userRowRole: {
    color: '#475569',
    fontSize: 10,
  },
});
