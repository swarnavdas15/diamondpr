import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet } from 'react-native';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { Colors, Spacing, Radius, Shadows } from '../../theme';

interface PlaceholderProps {
  onOpenCreateClient?: () => void;
  onOpenCreateOrder?: () => void;
  onOpenCreateTask?: () => void;
  onOpenCreateUser?: () => void;
}

import { CompanyDetailModal } from '../company-hierarchy/CompanyDetailModal';
import { Client } from '../../types';

// 1. Client Directory View
export const ClientDirectoryView: React.FC<PlaceholderProps> = ({ onOpenCreateClient, onOpenCreateOrder }) => {
  const { clients, orders, setSelectedOrder } = useERP();
  const [selectedClientForModal, setSelectedClientForModal] = useState<Client | null>(null);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Company Org Hierarchy Modal */}
      <CompanyDetailModal
        visible={!!selectedClientForModal}
        client={selectedClientForModal}
        onClose={() => setSelectedClientForModal(null)}
      />

      <View style={styles.topBanner}>
        <View>
          <Text style={styles.title}>Client Directory & Organization Hierarchy</Text>
          <Text style={styles.subTitle}>Manage customer directories, sales leads, company contacts, and interactive organization charts.</Text>
        </View>
        <View style={styles.btnGroup}>
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
              <Text style={[styles.th, { width: 140 }]}>Contact Person</Text>
              <Text style={[styles.th, { width: 130 }]}>Phone</Text>
              <Text style={[styles.th, { width: 180 }]}>Email</Text>
              <Text style={[styles.th, { width: 140 }]}>GST Number</Text>
              <Text style={[styles.th, { width: 160 }]}>Org Hierarchy</Text>
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
                <Text style={[styles.td, { width: 140 }]}>{c.contactName || 'N/A'}</Text>
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
                <Text style={styles.stageTagText}>{ord.salesWorkflowStage.replace(/_/g, ' ')}</Text>
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
        <View style={styles.viewModalOverlay}>
          <View style={styles.viewModalCard}>
            <View style={styles.viewModalHeader}>
              <Text style={styles.viewModalTitle}>Supplier Vendor Record: {vendorToView.vendorCode}</Text>
              <TouchableOpacity onPress={() => setVendorToView(null)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }}>
              <Text style={styles.viewLabel}>Vendor Name: <Text style={styles.viewVal}>{vendorToView.vendorName}</Text></Text>
              <Text style={styles.viewLabel}>Company Name: <Text style={styles.viewVal}>{vendorToView.companyName || 'N/A'}</Text></Text>
              <Text style={styles.viewLabel}>GST Number: <Text style={styles.viewVal}>{vendorToView.gstNumber || 'N/A'}</Text></Text>
              <Text style={styles.viewLabel}>PAN Number: <Text style={styles.viewVal}>{vendorToView.panNumber || 'N/A'}</Text></Text>

              <View style={styles.modalDivider} />

              <Text style={styles.viewLabel}>Contact Person: <Text style={styles.viewVal}>{vendorToView.contactPerson}</Text></Text>
              <Text style={styles.viewLabel}>Mobile Number: <Text style={styles.viewVal}>{vendorToView.mobileNumber}</Text></Text>
              <Text style={styles.viewLabel}>Alternate Mobile: <Text style={styles.viewVal}>{vendorToView.alternateMobile || 'N/A'}</Text></Text>
              <Text style={styles.viewLabel}>Email Address: <Text style={styles.viewVal}>{vendorToView.email}</Text></Text>
              <Text style={styles.viewLabel}>Website: <Text style={styles.viewVal}>{vendorToView.website || 'N/A'}</Text></Text>

              <View style={styles.modalDivider} />

              <Text style={styles.viewLabel}>Material Supplied: <Text style={styles.viewValBold}>{vendorToView.materialSupplied}</Text></Text>
              <Text style={styles.viewLabel}>Category: <Text style={styles.viewVal}>{vendorToView.vendorCategory || 'General'}</Text></Text>
              <Text style={styles.viewLabel}>Payment Terms: <Text style={styles.viewVal}>{vendorToView.paymentTerms || 'Net 30'}</Text></Text>
              <Text style={styles.viewLabel}>Lead Time: <Text style={styles.viewVal}>{vendorToView.leadTime || '7 Days'}</Text></Text>
              <Text style={styles.viewLabel}>Status: <Text style={[styles.viewVal, { color: vendorToView.status === 'ACTIVE' ? Colors.successBright : '#ef4444' }]}>{vendorToView.status}</Text></Text>

              <View style={styles.modalDivider} />

              <Text style={styles.viewLabel}>Address: <Text style={styles.viewVal}>{[vendorToView.addressLine1, vendorToView.city, vendorToView.state, vendorToView.pinCode].filter(Boolean).join(', ') || 'N/A'}</Text></Text>
              <Text style={styles.viewLabel}>Remarks: <Text style={styles.viewVal}>{vendorToView.remarks || 'None'}</Text></Text>
            </ScrollView>

            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setVendorToView(null)}>
              <Text style={styles.closeModalBtnText}>Close Record View</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Top Banner */}
      <View style={styles.topBanner}>
        <View style={{ flex: 1, paddingRight: Spacing.md }}>
          <Text style={styles.title}>Vendors & Material Supply Directory</Text>
          <Text style={styles.subTitle}>Manage approved raw material suppliers, forge foundries, and vendor contracts.</Text>
        </View>
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
  const { orders } = useERP();
  const total = orders.length;
  const completed = orders.filter((o) => o.status === 'COMPLETED').length;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.topBanner}>
        <View>
          <Text style={styles.title}>Industrial Analytics & Performance Reports</Text>
          <Text style={styles.subTitle}>Plant throughput, department lead times, quality pass yields, and bottleneck analysis.</Text>
        </View>
      </View>

      <View style={styles.gridRow}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiVal}>{total}</Text>
          <Text style={styles.kpiLabel}>Total Orders Initiated</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={[styles.kpiVal, { color: '#10b981' }]}>{completed}</Text>
          <Text style={styles.kpiLabel}>Completed & Dispatched</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={[styles.kpiVal, { color: '#38bdf8' }]}>98.5%</Text>
          <Text style={styles.kpiLabel}>Quality First-Pass Yield</Text>
        </View>
      </View>
    </ScrollView>
  );
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
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.topBanner}>
        <View>
          <Text style={styles.title}>ERP System & Data Security Settings</Text>
          <Text style={styles.subTitle}>Configure plant security parameters, client data visibility, and system rules.</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>System Configuration</Text>
        <View style={styles.settingItem}>
          <Text style={styles.settingTitle}>Strict Client Data Masking Policy</Text>
          <Text style={styles.settingSub}>Enforces masking of client names & contacts for Purchase, Production, Quality, and Dispatch roles.</Text>
          <View style={styles.badgeActive}><Text style={styles.badgeText}>ENABLED (STRICT)</Text></View>
        </View>
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
  viewModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    padding: 20,
  },
  viewModalCard: {
    width: '100%',
    maxWidth: 540,
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    ...Shadows.md,
  },
  viewModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDark,
    paddingBottom: 8,
  },
  viewModalTitle: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: '800',
  },
  closeBtn: {
    color: Colors.accentTeal,
    fontSize: 16,
    fontWeight: '800',
  },
  viewLabel: {
    color: Colors.accentTeal,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  viewVal: {
    color: Colors.textLight,
    fontWeight: '500',
  },
  viewValBold: {
    color: Colors.textLight,
    fontWeight: '800',
  },
  modalDivider: {
    height: 1,
    backgroundColor: Colors.borderDark,
    marginVertical: 8,
  },
  closeModalBtn: {
    backgroundColor: Colors.accentTeal,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  closeModalBtnText: {
    color: Colors.white,
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
