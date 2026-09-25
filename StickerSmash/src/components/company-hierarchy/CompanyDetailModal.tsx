import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { Client, CompanyContact } from '../../types';
import { CompanyOverview } from './CompanyOverview';
import { OrgChart } from './OrgChart';
import { ContactManagement } from './ContactManagement';
import { ContactFormModal } from './ContactFormModal';
import { ContactDrawer } from './ContactDrawer';
import { CompanyImportantDates } from './CompanyImportantDates';
import { Colors, Spacing, Radius, Shadows } from '../../theme';

interface CompanyDetailModalProps {
  visible: boolean;
  client: Client | null;
  onClose: () => void;
}

type TabType = 'OVERVIEW' | 'ORG_CHART' | 'CONTACTS_LIST' | 'IMPORTANT_DATES';

export const CompanyDetailModal: React.FC<CompanyDetailModalProps> = ({
  visible,
  client,
  onClose,
}) => {
  const {
    companyContacts,
    addCompanyContact,
    updateCompanyContact,
    deleteCompanyContact,
    companyImportantDates,
    addCompanyImportantDate,
    deleteCompanyImportantDate,
  } = useERP();
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>('ORG_CHART');

  // Modal / Drawer state
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [contactToEdit, setContactToEdit] = useState<CompanyContact | null>(null);

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedContact, setSelectedContact] = useState<CompanyContact | null>(null);

  if (!client) return null;

  // Filter contacts for this specific company
  const clientContacts = companyContacts.filter((c) => c.companyId === client.id);

  // Filter important dates for this specific company
  const clientDates = companyImportantDates.filter((d) => d.companyId === client.id);

  // RBAC Permission Check:
  // Super Admin, Admin, and Sales have full manage capabilities.
  // Purchase, Production, Quality Testing, Dispatch are view-only.
  const userRole = currentUser?.role || 'SALES';
  const canManage = ['SUPER_ADMIN', 'ADMIN', 'SALES'].includes(userRole);

  const handleOpenAddContact = () => {
    setContactToEdit(null);
    setFormModalVisible(true);
  };

  const handleOpenEditContact = (contact: CompanyContact) => {
    setContactToEdit(contact);
    setFormModalVisible(true);
  };

  const handleSelectContactNode = (contact: CompanyContact) => {
    setSelectedContact(contact);
    setDrawerVisible(true);
  };

  const handleFormSubmit = (data: Omit<CompanyContact, 'id' | 'createdAt'>) => {
    if (contactToEdit) {
      updateCompanyContact(contactToEdit.id, data);
    } else {
      addCompanyContact(data);
    }
  };

  const handleDeleteContact = (contactId: string) => {
    deleteCompanyContact(contactId);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.card} onPress={(e) => e.stopPropagation()}>
          {/* Header Banner */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.companyTitle}>{client.companyName}</Text>
              <View style={styles.codeBadge}>
                <Text style={styles.codeBadgeText}>{client.clientCode}</Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeTouch}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Navigation Tabs */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'ORG_CHART' && styles.tabBtnActive]}
              onPress={() => setActiveTab('ORG_CHART')}
            >
              <Text style={[styles.tabBtnText, activeTab === 'ORG_CHART' && styles.tabBtnTextActive]}>
                🌳 Interactive Org Hierarchy Chart
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'CONTACTS_LIST' && styles.tabBtnActive]}
              onPress={() => setActiveTab('CONTACTS_LIST')}
            >
              <Text style={[styles.tabBtnText, activeTab === 'CONTACTS_LIST' && styles.tabBtnTextActive]}>
                👥 Contact Directory ({clientContacts.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'OVERVIEW' && styles.tabBtnActive]}
              onPress={() => setActiveTab('OVERVIEW')}
            >
              <Text style={[styles.tabBtnText, activeTab === 'OVERVIEW' && styles.tabBtnTextActive]}>
                🏢 Company Overview & Details
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'IMPORTANT_DATES' && styles.tabBtnActive]}
              onPress={() => setActiveTab('IMPORTANT_DATES')}
            >
              <Text style={[styles.tabBtnText, activeTab === 'IMPORTANT_DATES' && styles.tabBtnTextActive]}>
                📅 Important Dates ({clientDates.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content Body */}
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {activeTab === 'ORG_CHART' && (
              <View style={styles.tabContent}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Organization Reporting Structure</Text>
                  {canManage && (
                    <TouchableOpacity style={styles.addContactHeaderBtn} onPress={handleOpenAddContact}>
                      <Text style={styles.addContactHeaderBtnText}>+ Add Contact Person</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <OrgChart
                  contacts={clientContacts}
                  onSelectNode={handleSelectContactNode}
                  selectedContactId={selectedContact?.id}
                />
              </View>
            )}

            {activeTab === 'CONTACTS_LIST' && (
              <View style={styles.tabContent}>
                <ContactManagement
                  contacts={clientContacts}
                  canManage={canManage}
                  onOpenAddContact={handleOpenAddContact}
                  onOpenEditContact={handleOpenEditContact}
                  onDeleteContact={handleDeleteContact}
                  onSelectContact={handleSelectContactNode}
                />
              </View>
            )}

            {activeTab === 'OVERVIEW' && (
              <View style={styles.tabContent}>
                <CompanyOverview client={client} contacts={clientContacts} />
              </View>
            )}

            {activeTab === 'IMPORTANT_DATES' && (
              <View style={styles.tabContent}>
                <CompanyImportantDates
                  companyId={client.id}
                  importantDates={clientDates}
                  canManage={canManage}
                  onAddImportantDate={addCompanyImportantDate}
                  onDeleteImportantDate={deleteCompanyImportantDate}
                />
              </View>
            )}
          </ScrollView>

          {/* Add / Edit Contact Form Modal */}
          <ContactFormModal
            visible={formModalVisible}
            companyId={client.id}
            contactToEdit={contactToEdit}
            existingContacts={clientContacts}
            onClose={() => {
              setFormModalVisible(false);
              setContactToEdit(null);
            }}
            onSubmit={handleFormSubmit}
          />

          {/* Node Details Profile Drawer / Modal */}
          <ContactDrawer
            visible={drawerVisible}
            contact={selectedContact}
            allCompanyContacts={clientContacts}
            canManage={canManage}
            onClose={() => {
              setDrawerVisible(false);
              setSelectedContact(null);
            }}
            onEdit={handleOpenEditContact}
            onDelete={handleDeleteContact}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  card: {
    width: '100%',
    maxWidth: 1040,
    height: '92%',
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    overflow: 'hidden',
    ...Shadows.md,
  },
  header: {
    backgroundColor: Colors.bgDark,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDark,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  companyTitle: {
    color: Colors.textLight,
    fontSize: 18,
    fontWeight: '800',
  },
  codeBadge: {
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: Colors.roles.SALES,
  },
  codeBadgeText: {
    color: Colors.roles.SALES,
    fontSize: 12,
    fontWeight: '800',
  },
  closeTouch: {
    padding: 4,
  },
  closeText: {
    color: Colors.textSubtle,
    fontSize: 20,
    fontWeight: '700',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDark,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  tabBtn: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: Colors.accentTeal,
  },
  tabBtnText: {
    color: Colors.textSubtle,
    fontSize: 13,
    fontWeight: '700',
  },
  tabBtnTextActive: {
    color: Colors.accentTeal,
    fontWeight: '800',
  },
  modalBody: {
    flex: 1,
    padding: Spacing.lg,
  },
  tabContent: {
    gap: Spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    color: Colors.textLight,
    fontSize: 15,
    fontWeight: '800',
  },
  addContactHeaderBtn: {
    backgroundColor: Colors.accentTeal,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.md,
    ...Shadows.sm,
  },
  addContactHeaderBtnText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
});
