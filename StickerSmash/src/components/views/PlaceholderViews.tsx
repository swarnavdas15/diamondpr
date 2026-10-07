import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet, Platform, useWindowDimensions, Image, Modal } from 'react-native';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { Colors, Spacing, Radius, Shadows } from '../../theme';
import { ExportButton } from '../ui/ExportButton';
import { ExportDataPayload } from '../../utils/exportUtils';

interface PlaceholderProps {
  onOpenCreateClient?: () => void;
  onOpenCreateOrder?: () => void;
  onOpenCreateTask?: () => void;
  onOpenCreateUser?: () => void;
}

import { CompanyDetailModal } from '../company-hierarchy/CompanyDetailModal';
import { SuperAdminAnalyticsView } from '../analytics/SuperAdminAnalyticsView';
import { Client } from '../../types';

// 1. Client Directory View
export const ClientDirectoryView: React.FC<PlaceholderProps> = ({ onOpenCreateClient, onOpenCreateOrder }) => {
  const { clients, orders, setSelectedOrder, deleteClient } = useERP();
  const { currentUser } = useAuth();
  const isMasked = currentUser?.clientDataVisibility === 'CODE_ONLY';
  const displayedClients = clients.map(c => isMasked ? {
    ...c,
    companyName: 'MASKED',
    contactName: 'MASKED',
    contactNo: 'MASKED',
    email: 'MASKED',
    address: 'MASKED'
  } : c);
  
  const [selectedClientForModal, setSelectedClientForModal] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const getClientExportPayload = (): ExportDataPayload => {
    return {
      title: 'Client Directory & Company Records Report',
      filename: 'Client_Directory_Report',
      headers: ['Client Code', 'Company Name', 'Contact Name', 'Contact No', 'Email', 'GST Number', 'Industry'],
      rows: displayedClients.map((c) => [
        c.clientCode,
        c.companyName,
        c.contactName || 'N/A',
        c.contactNo,
        c.email || 'N/A',
        c.gstNumber || 'N/A',
        c.industry || 'Manufacturing',
      ]),
    };
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Delete Confirmation Modal */}
      <Modal transparent visible={!!clientToDelete} animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <TouchableOpacity style={[StyleSheet.absoluteFill, { zIndex: 1 }]} activeOpacity={1} onPress={() => setClientToDelete(null)} />
          <View style={{ backgroundColor: '#fff', borderRadius: 12, width: '90%', maxWidth: 400, zIndex: 2, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, overflow: 'hidden' }}>
            
            <View style={{ backgroundColor: '#fff', padding: 24, paddingBottom: 16, alignItems: 'center' }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#fef2f2', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ fontSize: 28, color: '#ef4444' }}>⚠️</Text>
              </View>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8, textAlign: 'center' }}>Delete Client Record</Text>
              <Text style={{ fontSize: 15, color: '#4b5563', textAlign: 'center', lineHeight: 22 }}>
                You are about to permanently delete <Text style={{ fontWeight: 'bold', color: '#111827' }}>{clientToDelete?.companyName}</Text>. This will remove all associated data and cannot be undone.
              </Text>
            </View>

            <View style={{ flexDirection: 'row', padding: 20, paddingTop: 12, gap: 12, backgroundColor: '#f9fafb', borderTopWidth: 1, borderTopColor: '#f3f4f6' }}>
              <TouchableOpacity style={{ flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', alignItems: 'center' }} onPress={() => setClientToDelete(null)}>
                <Text style={{ color: '#374151', fontWeight: '600', fontSize: 15 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={{ flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: '#ef4444', alignItems: 'center', shadowColor: '#ef4444', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 }} 
                onPress={() => { 
                  if (clientToDelete) deleteClient(clientToDelete.id); 
                  setClientToDelete(null); 
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>Yes, Delete</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

      {/* Company Org Hierarchy Modal */}
      <CompanyDetailModal
        visible={!!selectedClientForModal}
        client={selectedClientForModal}
        onClose={() => setSelectedClientForModal(null)}
      />

      <View style={[styles.topBanner, isMobile && styles.topBannerMobile]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Client Directory & Organization Hierarchy</Text>
          <Text style={styles.subTitle}>Manage customer directories, sales leads, company contacts, and interactive organization charts.</Text>
        </View>
        <View style={[styles.btnGroup, isMobile && styles.btnGroupMobile]}>
          <ExportButton getData={getClientExportPayload} buttonText="Export Clients" />
          {onOpenCreateClient && (
            <TouchableOpacity style={styles.btnBlue} onPress={onOpenCreateClient}>
              <Text style={styles.btnText}>+ Register Client</Text>
            </TouchableOpacity>
          )}
          {onOpenCreateOrder && (
            <TouchableOpacity style={styles.btnGreen} onPress={onOpenCreateOrder}>
              <Text style={styles.btnText}>+ Initiate Sales Order</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.card}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm }}>
          <Text style={styles.cardTitle}>Registered Client Directory</Text>
          <Text style={{ color: Colors.accentTeal, fontSize: 11, fontWeight: '700' }}>
            💡 Click any company row to view detailed CRM Profile & Organization Tree Chart
          </Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.table}>
            <View style={styles.thRow}>
              <Text style={[styles.th, { width: 110 }]}>Client Code</Text>
              <Text style={[styles.th, { width: 220 }]}>Company Name</Text>
              <Text style={[styles.th, { width: 170 }]}>Contact Person</Text>
              <Text style={[styles.th, { width: 130 }]}>Phone</Text>
              <Text style={[styles.th, { width: 180 }]}>Email</Text>
              <Text style={[styles.th, { width: 140 }]}>GST Number</Text>
              <Text style={[styles.th, { width: 160 }]}>Org Hierarchy</Text>
              {currentUser?.role === 'SUPER_ADMIN' && <Text style={[styles.th, { width: 100 }]}>Actions</Text>}
            </View>

            {clients.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={styles.trRow}
                onPress={() => setSelectedClientForModal(c)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tdHighlight, { width: 110 }]}>{c.clientCode}</Text>
                <Text style={[styles.tdBold, { width: 220 }]}>{c.companyName}</Text>
                
                <View style={{ width: 170, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 }}>
                  {c.profileImage ? (
                    <Image source={{ uri: c.profileImage }} style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.borderDark }} />
                  ) : (
                    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.borderDark, justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ color: Colors.white, fontSize: 10, fontWeight: '700' }}>{c.contactName ? c.contactName[0].toUpperCase() : '?'}</Text>
                    </View>
                  )}
                  <Text style={[styles.td, { width: '100%', paddingHorizontal: 0 }]} numberOfLines={1}>{c.contactName || 'N/A'}</Text>
                </View>

                <Text style={[styles.td, { width: 130 }]}>{c.contactNo}</Text>
                <Text style={[styles.td, { width: 180 }]}>{c.email || 'N/A'}</Text>
                <Text style={[styles.td, { width: 140 }]}>{c.gstNumber || 'N/A'}</Text>
                <View style={[{ width: 160 }, { justifyContent: 'center' }]}>
                  <TouchableOpacity
                    style={{
                      backgroundColor: 'rgba(41, 88, 92, 0.1)',
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: Radius.xs,
                      borderWidth: 1,
                      borderColor: Colors.accentTeal,
                      alignSelf: 'flex-start',
                    }}
                    onPress={() => setSelectedClientForModal(c)}
                  >
                    <Text style={{ color: Colors.accentTeal, fontSize: 11, fontWeight: '800' }}>
                      🌳 View Hierarchy
                    </Text>
                  </TouchableOpacity>
                </View>

                {currentUser?.role === 'SUPER_ADMIN' && (
                  <View style={{ width: 100, flexDirection: 'row', gap: 8, paddingHorizontal: 12 }}>
                    <TouchableOpacity
                      style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: 6, borderRadius: 4 }}
                      onPress={(e) => {
                        e.stopPropagation();
                        setClientToDelete(c);
                      }}
                    >
                      <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: '800' }}>🗑 Delete</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    </ScrollView>
  );
};

// 2. Projects & Work Orders View
export const ProjectsView: React.FC<PlaceholderProps> = () => {
  const { orders, setSelectedOrder } = useERP();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.topBanner}>
        <View>
          <Text style={styles.title}>Manufacturing Projects & Work Orders</Text>
          <Text style={styles.subTitle}>Track active production batches, forging specifications, and manufacturing progress.</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Active Work Projects</Text>
        {orders.map((ord) => (
          <TouchableOpacity key={ord.id} style={styles.projectCard} onPress={() => setSelectedOrder(ord)}>
            <View style={styles.projectHeader}>
              <View>
                <Text style={styles.projectTitle}>{ord.orderNumber} ({ord.clientCode})</Text>
                <Text style={styles.projectSub}>PO Number: {ord.poNumber} • Required Qty: {ord.requiredQuantity} pcs</Text>
              </View>
              <View style={styles.stageTag}>
                <Text style={styles.stageTagText}>{(ord.salesWorkflowStage || 'INITIATION').replace(/_/g, ' ')}</Text>
              </View>
            </View>
            <Text style={styles.specText}>Technical Spec: {ord.technicalRequirements || 'Standard Flange Spec'}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

import { CreateVendorModal } from '../CreateVendorModal';
import { Vendor } from '../../types';

// 3. Vendors & Material Supply View
export const VendorsView: React.FC = () => {
  const { vendors, deleteVendor } = useERP();
  const { currentUser } = useAuth();

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [vendorToEdit, setVendorToEdit] = useState<Vendor | null>(null);
  const [vendorToView, setVendorToView] = useState<Vendor | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [error, setError] = useState('');

  const isSuperAdminOrAdmin = currentUser ? (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN') : false;

  // Derive unique categories & material types for dynamic filtering
  const categories = Array.from(new Set(vendors.map((v) => v.vendorCategory).filter(Boolean)));

  // Filter vendors
  const filteredVendors = vendors.filter((v) => {
    // Status Filter
    if (statusFilter !== 'ALL' && v.status !== statusFilter) {
      return false;
    }
    // Category Filter
    if (categoryFilter !== 'ALL' && v.vendorCategory !== categoryFilter) {
      return false;
    }
    // Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        v.vendorCode.toLowerCase().includes(q) ||
        v.vendorName.toLowerCase().includes(q) ||
        v.contactPerson.toLowerCase().includes(q) ||
        v.mobileNumber.toLowerCase().includes(q) ||
        v.email.toLowerCase().includes(q) ||
        v.materialSupplied.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleDelete = (vendorId: string) => {
    setError('');
    try {
      deleteVendor(vendorId);
    } catch (err: any) {
      setError(err.message || 'Permission denied.');
    }
  };

  const getVendorExportPayload = (): ExportDataPayload => {
    return {
      title: 'Vendors & Material Suppliers Directory Report',
      filename: 'Vendors_Directory_Report',
      headers: ['Vendor Code', 'Vendor Name', 'Contact Person', 'Mobile', 'Email', 'Material Supplied', 'Status'],
      rows: vendors.map((v) => [
        v.vendorCode,
        v.vendorName,
        v.contactPerson,
        v.mobileNumber,
        v.email,
        v.materialSupplied,
        v.status,
      ]),
    };
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Modals */}
      <CreateVendorModal
        visible={createModalVisible}
        vendorToEdit={vendorToEdit}
        onClose={() => {
          setCreateModalVisible(false);
          setVendorToEdit(null);
        }}
      />

      {/* Vendor Details View Modal */}
      {vendorToView && (
        <Modal transparent={true} visible={true} animationType="fade" onRequestClose={() => setVendorToView(null)}>
          <View style={styles.viewModalOverlay}>
          <TouchableOpacity style={styles.modalBackdropTouch} activeOpacity={1} onPress={() => setVendorToView(null)} />
          <View style={styles.viewModalCard}>
            {/* Clean, Unclipped Header */}
            <View style={styles.viewModalHeader}>
              <View style={styles.viewModalHeaderTitleRow}>
                <Text style={styles.viewModalIcon}>🏭</Text>
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.viewModalTitle}>Supplier Vendor Details</Text>
                    <View style={styles.codeBadge}>
                      <Text style={styles.codeBadgeText}>{vendorToView.vendorCode}</Text>
                    </View>
                  </View>
                  <Text style={styles.viewModalSub}>Approved ERP Raw Material & Service Provider</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.iconCloseBtn} onPress={() => setVendorToView(null)}>
                <Text style={styles.iconCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Scrollable Organised Detail Cards */}
            <ScrollView style={{ maxHeight: '75%' }} showsVerticalScrollIndicator={true} nestedScrollEnabled={true}>
              {/* Card 1: Identity & Tax Credentials */}
              <View style={styles.detailSectionCard}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionCardTitle}>🏢 Supplier Identity & Tax Info</Text>
                  <View
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor: vendorToView.status === 'ACTIVE' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                        borderColor: vendorToView.status === 'ACTIVE' ? Colors.successBright : '#ef4444',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        { color: vendorToView.status === 'ACTIVE' ? Colors.successBright : '#ef4444' },
                      ]}
                    >
                      ● {vendorToView.status}
                    </Text>
                  </View>
                </View>

                <Text style={styles.vendorMainName}>{vendorToView.vendorName}</Text>
                {vendorToView.companyName ? (
                  <Text style={styles.vendorSubCompany}>Legal Entity: {vendorToView.companyName}</Text>
                ) : null}

                <View style={styles.infoGridTwoCol}>
                  <View style={styles.infoBoxItem}>
                    <Text style={styles.infoBoxLabel}>GST Identification No.</Text>
                    <Text style={styles.infoBoxValCode}>{vendorToView.gstNumber || 'N/A'}</Text>
                  </View>

                  <View style={styles.infoBoxItem}>
                    <Text style={styles.infoBoxLabel}>PAN Card Number</Text>
                    <Text style={styles.infoBoxValCode}>{vendorToView.panNumber || 'N/A'}</Text>
                  </View>
                </View>
              </View>

              {/* Card 2 and 3 in Grid */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
                  <View style={{ flex: 1, minWidth: 300 }}>
                    <View style={[styles.detailSectionCard, { height: '100%', marginBottom: 0 }]}>
                      <Text style={styles.sectionCardTitle}>📞 Key Contact Person & Communication</Text>
                      <View style={styles.infoGridTwoCol}>
                        <View style={styles.infoItemRow}><Text style={styles.infoFieldLabel}>Contact Person:</Text><Text style={styles.infoFieldValBold}>{vendorToView.contactPerson || 'N/A'}</Text></View>
                        <View style={styles.infoItemRow}><Text style={styles.infoFieldLabel}>Mobile Number:</Text><Text style={styles.infoFieldValTeal}>{vendorToView.mobileNumber || 'N/A'}</Text></View>
                        <View style={styles.infoItemRow}><Text style={styles.infoFieldLabel}>Alt. Phone:</Text><Text style={styles.infoFieldVal}>{vendorToView.alternateMobile || 'N/A'}</Text></View>
                        <View style={styles.infoItemRow}><Text style={styles.infoFieldLabel}>Email Address:</Text><Text style={styles.infoFieldVal}>{vendorToView.email || 'N/A'}</Text></View>
                      </View>
                      {vendorToView.website ? (
                        <View style={[styles.infoItemRow, { marginTop: 6 }]}><Text style={styles.infoFieldLabel}>Official Website:</Text><Text style={[styles.infoFieldVal, { color: '#0284c7' }]}>{vendorToView.website}</Text></View>
                      ) : null}
                    </View>
                  </View>

                  <View style={{ flex: 1, minWidth: 300 }}>
                    <View style={[styles.detailSectionCard, { height: '100%', marginBottom: 0 }]}>
                      <Text style={styles.sectionCardTitle}>📦 Material Sourcing & Commercial Terms</Text>
                      <View style={styles.materialBanner}>
                        <Text style={styles.materialBannerLabel}>Primary Material Supplied:</Text>
                        <Text style={styles.materialBannerVal}>{vendorToView.materialSupplied || 'N/A'}</Text>
                      </View>
                      <View style={[styles.infoItemRow, { marginTop: 12 }]}><Text style={styles.infoFieldLabel}>Vendor Category:</Text><Text style={styles.infoFieldVal}>{vendorToView.vendorCategory || 'General'}</Text></View>
                      <View style={styles.infoItemRow}><Text style={styles.infoFieldLabel}>Primary Location:</Text><Text style={styles.infoFieldVal}>{vendorToView.addressLine1 || 'N/A'}</Text></View>
                      {vendorToView.remarks ? (
                        <View style={{ marginTop: 12, padding: 8, backgroundColor: '#fffbeb', borderRadius: 4 }}>
                          <Text style={styles.infoFieldLabel}>Operational Remarks:</Text>
                          <Text style={styles.remarksTextVal}>{vendorToView.remarks}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </View>
              </ScrollView>

            {/* Footer Action Buttons */}
            <View style={styles.viewModalFooterRow}>
              <TouchableOpacity
                style={styles.editModalBtn}
                onPress={() => {
                  const targetVendor = vendorToView;
                  setVendorToView(null);
                  setVendorToEdit(targetVendor);
                  setCreateModalVisible(true);
                }}
              >
                <Text style={styles.editModalBtnText}>✏️ Edit Vendor</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.closeModalBtnNew} onPress={() => setVendorToView(null)}>
                <Text style={styles.closeModalBtnTextNew}>Close</Text>
              </TouchableOpacity>
            </View>
                      </View>
          </View>
        </Modal>
        )}

        {/* Top Banner */}
      <View style={styles.topBanner}>
        <View style={{ flex: 1, paddingRight: Spacing.md }}>
          <Text style={styles.title}>Vendors & Material Supply Directory</Text>
          <Text style={styles.subTitle}>Manage approved raw material suppliers, forge foundries, and vendor contracts.</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <ExportButton getData={getVendorExportPayload} buttonText="Export Vendors" />
          <TouchableOpacity
            style={styles.btnGreen}
            onPress={() => {
              setVendorToEdit(null);
              setCreateModalVisible(true);
            }}
          >
            <Text style={styles.btnText}>+ Add Vendor</Text>
          </TouchableOpacity>
        </View>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      ) : null}

      {/* Search & Filters */}
      <View style={styles.card}>
        <View style={styles.filterHeaderRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="🔍 Search vendor code, name, contact, material..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <View style={styles.filterChipGroup}>
            <Text style={styles.filterLabel}>Status:</Text>
            {['ALL', 'ACTIVE', 'INACTIVE'].map((st) => (
              <TouchableOpacity
                key={st}
                style={[styles.filterChip, statusFilter === st && styles.filterChipActive]}
                onPress={() => setStatusFilter(st)}
              >
                <Text style={[styles.filterChipText, statusFilter === st && styles.filterChipTextActive]}>{st}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Dynamic Category Filter */}
        {categories.length > 0 && (
          <View style={styles.categoryFilterRow}>
            <Text style={styles.filterLabel}>Category:</Text>
            <TouchableOpacity
              style={[styles.filterChip, categoryFilter === 'ALL' && styles.filterChipActive]}
              onPress={() => setCategoryFilter('ALL')}
            >
              <Text style={[styles.filterChipText, categoryFilter === 'ALL' && styles.filterChipTextActive]}>All Categories</Text>
            </TouchableOpacity>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.filterChip, categoryFilter === cat && styles.filterChipActive]}
                onPress={() => setCategoryFilter(cat!)}
              >
                <Text style={[styles.filterChipText, categoryFilter === cat && styles.filterChipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Vendor List Table */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
          <View style={styles.table}>
            {/* Header */}
            <View style={styles.thRow}>
              <Text style={[styles.th, { width: 110 }]}>Vendor Code</Text>
              <Text style={[styles.th, { width: 200 }]}>Vendor Name</Text>
              <Text style={[styles.th, { width: 140 }]}>Contact Person</Text>
              <Text style={[styles.th, { width: 130 }]}>Mobile</Text>
              <Text style={[styles.th, { width: 180 }]}>Email</Text>
              <Text style={[styles.th, { width: 180 }]}>Material Supplied</Text>
              <Text style={[styles.th, { width: 90 }]}>Status</Text>
              <Text style={[styles.th, { width: 160 }]}>Actions</Text>
            </View>

            {/* Body */}
            {filteredVendors.length === 0 ? (
              <Text style={styles.emptyText}>No supplier vendors found matching criteria.</Text>
            ) : (
              filteredVendors.map((v) => (
                <View key={v.id} style={styles.trRow}>
                  <Text style={[styles.tdHighlight, { width: 110 }]}>{v.vendorCode}</Text>
                  <View style={{ width: 200 }}>
                    <Text style={styles.tdBold}>{v.vendorName}</Text>
                    {v.companyName ? <Text style={styles.tdSub}>{v.companyName}</Text> : null}
                  </View>
                  <Text style={[styles.td, { width: 140 }]}>{v.contactPerson}</Text>
                  <Text style={[styles.td, { width: 130 }]}>{v.mobileNumber}</Text>
                  <Text style={[styles.td, { width: 180 }]}>{v.email}</Text>
                  <Text style={[styles.tdBold, { width: 180, color: Colors.accentTeal }]}>{v.materialSupplied}</Text>

                  {/* Status Badge */}
                  <View style={{ width: 90 }}>
                    <View style={[styles.statusTag, { backgroundColor: v.status === 'ACTIVE' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)', borderColor: v.status === 'ACTIVE' ? Colors.successBright : '#ef4444' }]}>
                      <Text style={[styles.statusTagText, { color: v.status === 'ACTIVE' ? Colors.successBright : '#ef4444' }]}>{v.status}</Text>
                    </View>
                  </View>

                  {/* Actions (View, Edit, Delete) */}
                  <View style={{ width: 160, flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity style={styles.viewActionBtn} onPress={() => setVendorToView(v)}>
                      <Text style={styles.actionBtnText}>View</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.editActionBtn}
                      onPress={() => {
                        setVendorToEdit(v);
                        setCreateModalVisible(true);
                      }}
                    >
                      <Text style={styles.actionBtnText}>Edit</Text>
                    </TouchableOpacity>
                    {isSuperAdminOrAdmin && (
                      <TouchableOpacity style={styles.deleteActionBtn} onPress={() => handleDelete(v.id)}>
                        <Text style={styles.deleteActionText}>Delete</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </ScrollView>
  );
};

// 4. Reports & Industrial Analytics View
export const ReportsView: React.FC = () => {
  return <SuperAdminAnalyticsView />;
};

// 5. Engineering Files & Drawings View
export const FilesView: React.FC = () => {
  const sampleFiles = [
    { name: 'SS316L-WeldNeck-Flange-6inch-600.dwg', type: 'CAD Drawing', size: '4.2 MB', date: '2026-09-10' },
    { name: 'A105-BlindFlange-4inch-300.pdf', type: 'Technical Spec Sheet', size: '1.8 MB', date: '2026-09-11' },
    { name: 'MillTestCertificate-Jindal-Batch9981.pdf', type: 'MTC Report', size: '2.5 MB', date: '2026-09-12' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.topBanner}>
        <View>
          <Text style={styles.title}>Engineering Drawings & Document Repository</Text>
          <Text style={styles.subTitle}>Centralized store for CAD drawings, technical spec sheets, and Mill Test Certificates (MTC).</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Document Archive</Text>
        {sampleFiles.map((f, idx) => (
          <View key={idx} style={styles.fileRow}>
            <Text style={styles.fileIcon}>📄</Text>
            <View style={styles.fileInfo}>
              <Text style={styles.fileName}>{f.name}</Text>
              <Text style={styles.fileMeta}>{f.type} • {f.size} • Uploaded {f.date}</Text>
            </View>
            <TouchableOpacity style={styles.downloadBtn}>
              <Text style={styles.downloadText}>Download</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

// 6. Users Directory & Access View
export { UsersView } from './UsersView';

// 6b. Sales Quotations View
export { QuotationsView } from './QuotationsView';

// 7. Settings View
export const SettingsView: React.FC = () => {
  const { currentUser, users, toggleUserMasking } = useAuth();

  if (currentUser?.role !== 'SUPER_ADMIN') {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 18, color: Colors.industrialOrange, fontWeight: 'bold' }}>o" Access Denied</Text>
        <Text style={{ color: Colors.textMuted, marginTop: 10 }}>Only Super Admin can access the settings panel.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.topBanner}>
        <View>
          <Text style={styles.title}>ERP System & Data Security Settings</Text>
          <Text style={styles.subTitle}>Configure plant security parameters, client data visibility, and system rules.</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>User Client Data Masking</Text>
        <Text style={styles.settingSub} style={{ marginBottom: 15, color: Colors.textMuted, fontSize: 11 }}>
          Toggle masking for individual users. If masked, they will only see the "Client Code". Names and contacts will be hidden.
        </Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ minWidth: 600 }}>
            <View style={{ flexDirection: 'row', backgroundColor: Colors.inputBg, padding: 10, borderRadius: 6, marginBottom: 8, borderWidth: 1, borderColor: Colors.borderDark }}>
              <Text style={[styles.th, { width: 140 }]}>User Name</Text>
              <Text style={[styles.th, { width: 120 }]}>Role</Text>
              <Text style={[styles.th, { width: 120 }]}>Status</Text>
              <Text style={[styles.th, { width: 150, textAlign: 'center' }]}>Mask Client Data</Text>
            </View>

            {users.map((u) => {
              const isMasked = u.clientDataVisibility === 'CODE_ONLY';
              return (
                <View key={u.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.cardBg, padding: 10, borderRadius: 6, marginBottom: 4, borderWidth: 1, borderColor: Colors.borderDark }}>
                  <Text style={{ width: 140, color: Colors.textLight, fontWeight: '700', fontSize: 13 }}>{u.name}</Text>
                  <Text style={{ width: 120, color: Colors.accentTeal, fontSize: 11 }}>{u.role.replace('_', ' ')}</Text>
                  
                  <View style={{ width: 120 }}>
                    <Text style={{ color: u.isActive ? Colors.successBright : Colors.industrialOrange, fontSize: 11, fontWeight: 'bold' }}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </Text>
                  </View>

                  <View style={{ width: 150, alignItems: 'center' }}>
                    {u.role === 'SUPER_ADMIN' ? (
                      <Text style={{ color: Colors.textSubtle, fontSize: 11, fontStyle: 'italic' }}>Protected</Text>
                    ) : (
                      <TouchableOpacity
                        style={{
                          backgroundColor: isMasked ? 'rgba(249, 115, 22, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                          borderWidth: 1,
                          borderColor: isMasked ? '#f97316' : Colors.successBright,
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: Radius.xs,
                        }}
                        onPress={() => toggleUserMasking(u.id, isMasked ? 'FULL' : 'CODE_ONLY')}
                      >
                        <Text style={{ color: isMasked ? '#f97316' : Colors.successBright, fontSize: 11, fontWeight: '800' }}>
                          {isMasked ? 'MASKED' : 'UNMASKED'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBanner: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    ...Shadows.sm,
  },
  topBannerMobile: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
  },
  title: {
    color: Colors.textLight,
    fontSize: 18,
    fontWeight: '800',
  },
  subTitle: {
    color: Colors.accentTeal,
    fontSize: 12,
    marginTop: 2,
  },
  btnGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  btnGroupMobile: {
    flexWrap: 'wrap',
    width: '100%',
    marginTop: 6,
  },
  btnBlue: {
    backgroundColor: Colors.accentTeal,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnGreen: {
    backgroundColor: Colors.industrialOrange,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    ...Shadows.glowOrange,
  },
  btnPurple: {
    backgroundColor: Colors.accentTeal,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    marginBottom: 16,
    ...Shadows.sm,
  },
  cardTitle: {
    color: Colors.textLight,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 12,
  },
  table: {
    minWidth: 800,
  },
  thRow: {
    flexDirection: 'row',
    backgroundColor: Colors.inputBg,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  th: {
    color: Colors.accentTeal,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  trRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBg,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  tdHighlight: {
    color: Colors.accentTeal,
    fontSize: 12,
    fontWeight: '800',
  },
  tdBold: {
    color: Colors.textLight,
    fontSize: 13,
    fontWeight: '700',
  },
  td: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  tdGreen: {
    color: Colors.successBright,
    fontSize: 12,
    fontWeight: '700',
  },
  projectCard: {
    backgroundColor: Colors.inputBg,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  projectTitle: {
    color: Colors.accentTeal,
    fontSize: 15,
    fontWeight: '800',
  },
  projectSub: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  stageTag: {
    backgroundColor: Colors.accentTeal,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  stageTagText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  specText: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    ...Shadows.sm,
  },
  kpiVal: {
    color: Colors.textLight,
    fontSize: 26,
    fontWeight: '900',
  },
  kpiLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBg,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  fileIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    color: Colors.textLight,
    fontSize: 13,
    fontWeight: '700',
  },
  fileMeta: {
    color: Colors.textSubtle,
    fontSize: 11,
  },
  downloadBtn: {
    backgroundColor: Colors.accentTeal,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  downloadText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  settingItem: {
    backgroundColor: Colors.inputBg,
    padding: 14,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  settingTitle: {
    color: Colors.textLight,
    fontSize: 14,
    fontWeight: '700',
  },
  settingSub: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  badgeActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.successBright,
  },
  badgeText: {
    color: Colors.successBright,
    fontSize: 10,
    fontWeight: '800',
  },
  // Vendor Management Styles
  modalBackdropTouch: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  viewModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: 16,
  },
  viewModalCard: {
    width: '100%',
    maxWidth: 580,
    maxHeight: '90%',
    backgroundColor: '#ffffff',
    borderRadius: Radius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Shadows.md,
  },
  viewModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  viewModalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  viewModalIcon: {
    fontSize: 24,
  },
  viewModalTitle: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
  viewModalSub: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
  },
  codeBadge: {
    backgroundColor: 'rgba(41, 88, 92, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.accentTeal,
  },
  codeBadgeText: {
    color: Colors.accentTeal,
    fontSize: 11,
    fontWeight: '800',
  },
  iconCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  iconCloseText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '800',
  },
  detailSectionCard: {
    backgroundColor: '#f8fafc',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionCardTitle: {
    color: Colors.accentTeal,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.xs,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  vendorMainName: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '900',
  },
  vendorSubCompany: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
    marginBottom: 8,
  },
  infoGridTwoCol: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  infoGridThreeCol: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  infoBoxItem: {
    flex: 1,
    minWidth: 130,
    backgroundColor: '#ffffff',
    padding: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  infoBoxLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
  },
  infoBoxValCode: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 2,
  },
  infoBoxValText: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  infoItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 200,
    flex: 1,
  },
  infoFieldLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
  },
  infoFieldVal: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '600',
  },
  infoFieldValBold: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '800',
  },
  infoFieldValTeal: {
    color: Colors.accentTeal,
    fontSize: 12,
    fontWeight: '800',
  },
  materialBanner: {
    backgroundColor: 'rgba(41, 88, 92, 0.08)',
    padding: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(41, 88, 92, 0.2)',
    marginVertical: 4,
  },
  materialBannerLabel: {
    color: Colors.accentTeal,
    fontSize: 10,
    fontWeight: '700',
  },
  materialBannerVal: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 2,
  },
  addressTextVal: {
    color: '#334155',
    fontSize: 12,
    lineHeight: 18,
  },
  remarksTextVal: {
    color: '#475569',
    fontSize: 12,
    fontStyle: 'italic',
  },
  viewModalFooterRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  editModalBtn: {
    backgroundColor: Colors.industrialOrange,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: Radius.md,
  },
  editModalBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  closeModalBtnNew: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  closeModalBtnTextNew: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '800',
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginBottom: 12,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '700',
  },
  filterHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: Colors.inputBg,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    color: Colors.textLight,
    fontSize: 12,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  filterChipGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  filterLabel: {
    color: Colors.accentTeal,
    fontSize: 11,
    fontWeight: '800',
  },
  filterChip: {
    backgroundColor: Colors.inputBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  filterChipActive: {
    backgroundColor: Colors.accentTeal,
    borderColor: Colors.accentTeal,
  },
  filterChipText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: Colors.white,
  },
  tdSub: {
    color: Colors.textSubtle,
    fontSize: 10,
  },
  statusTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  viewActionBtn: {
    backgroundColor: Colors.accentTeal,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  editActionBtn: {
    backgroundColor: Colors.industrialOrange,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  deleteActionBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  actionBtnText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '800',
  },
  deleteActionText: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: '800',
  },
  emptyText: {
    color: Colors.textSubtle,
    fontSize: 12,
    textAlign: 'center',
    marginVertical: 14,
  },
});
