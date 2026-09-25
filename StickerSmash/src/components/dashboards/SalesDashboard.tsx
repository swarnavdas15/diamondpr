import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useERP } from '../../context/ERPContext';
import { Colors, StatusColors, Spacing, Radius, Shadows } from '../../theme';
import { TaskKPICards } from './TaskKPICards';
import { OrderKPICards } from './OrderKPICards';
import { SalesKPICards } from './SalesKPICards';
import { SalesKPIDetailsModal } from './SalesKPIDetailsModal';

interface SalesDashboardProps {
  onOpenCreateClient: () => void;
  onOpenCreateOrder: () => void;
  onOpenCreateQuotation?: () => void;
}

export const SalesDashboard: React.FC<SalesDashboardProps> = ({
  onOpenCreateClient,
  onOpenCreateOrder,
  onOpenCreateQuotation,
}) => {
  const { quotations } = useERP();

  const [salesModalVisible, setSalesModalVisible] = useState(false);
  const [salesModalTab, setSalesModalTab] = useState<'TOTAL' | 'CONVERTED' | 'LOST'>('TOTAL');

  const handleOpenSalesModal = (tab: 'TOTAL' | 'CONVERTED' | 'LOST') => {
    setSalesModalTab(tab);
    setSalesModalVisible(true);
  };

  const pendingFollowUps = quotations.filter(
    (q) => q.followUpDate && q.status !== 'FULLY_CONVERTED' && q.status !== 'LOST'
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Top Banner & Quick Actions */}
      <View style={styles.topBanner}>
        <View style={{ flex: 1, paddingRight: Spacing.md }}>
          <Text style={styles.title}>Sales Department Dashboard</Text>
          <Text style={styles.subTitle}>Manage client registrations, quotations, sales order initiation, and task metrics.</Text>
        </View>
        <View style={styles.btnRow}>
          {onOpenCreateQuotation && (
            <TouchableOpacity style={styles.quoteBtn} onPress={onOpenCreateQuotation}>
              <Text style={styles.btnText}>+ Create Quotation</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.clientBtn} onPress={onOpenCreateClient}>
            <Text style={styles.btnText}>+ Register Client</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.orderBtn} onPress={onOpenCreateOrder}>
            <Text style={styles.btnText}>+ Initiate Sales Order</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Row 1: Global Order KPI Cards */}
      <OrderKPICards style={{ marginBottom: Spacing.md }} />

      {/* Row 2: Global Task Metrics KPI Cards */}
      <TaskKPICards style={{ marginBottom: Spacing.lg }} />

      {/* Quotation Pipeline Overview Widgets */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Sales Quotation & Conversion Pipeline</Text>
        <SalesKPICards onCardPress={handleOpenSalesModal} />
      </View>

      {/* Pending Follow-Up Reminders Card */}
      {pendingFollowUps.length > 0 && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>📅 Pending Quotation Follow-Up Reminders</Text>
          <Text style={styles.sectionSub}>Action required for scheduled sales negotiations and inquiry follow-ups.</Text>

          <View style={{ marginTop: Spacing.sm, gap: Spacing.xs }}>
            {pendingFollowUps.map((q) => (
              <View key={q.id} style={styles.fupReminderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fupCompText}>
                    {q.quotationNumber} • <Text style={{ fontWeight: '800', color: Colors.textLight }}>{q.companyName}</Text> ({q.clientCode})
                  </Text>
                  <Text style={styles.fupSubText}>
                    Contact: {q.contactPerson} ({q.mobileNumber}) • Executive: {q.salesExecutive}
                  </Text>
                </View>
                <View style={styles.fupDateBadge}>
                  <Text style={styles.fupDateBadgeText}>📅 {q.followUpDate}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Sales KPI Details Modal */}
      <SalesKPIDetailsModal
        visible={salesModalVisible}
        activeTab={salesModalTab}
        onClose={() => setSalesModalVisible(false)}
        onSelectTab={setSalesModalTab}
      />
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
    padding: Spacing.px18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
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
  btnRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  quoteBtn: {
    backgroundColor: Colors.industrialOrange,
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
    borderRadius: Radius.md,
    ...Shadows.glowOrange,
  },
  clientBtn: {
    backgroundColor: Colors.accentTeal,
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
    borderRadius: Radius.md,
  },
  orderBtn: {
    backgroundColor: Colors.roles.SALES,
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
    borderRadius: Radius.md,
    ...Shadows.sm,
  },
  btnText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  sectionCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  sectionTitle: {
    color: Colors.textLight,
    fontSize: 15,
    fontWeight: '800',
  },
  sectionSub: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
    marginBottom: 4,
  },
  metricsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginVertical: Spacing.sm,
  },
  metricCard: {
    flex: 1,
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    borderLeftWidth: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadows.sm,
  },
  metricIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricIconText: {
    fontSize: 18,
    color: Colors.white,
  },
  metricVal: {
    color: Colors.textLight,
    fontSize: 18,
    fontWeight: '800',
  },
  metricLbl: {
    color: Colors.textSubtle,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  fupReminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.inputBg,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  fupCompText: {
    color: Colors.accentTeal,
    fontSize: 13,
  },
  fupSubText: {
    color: Colors.textSubtle,
    fontSize: 11,
    marginTop: 2,
  },
  fupDateBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: Colors.accentTeal,
  },
  fupDateBadgeText: {
    color: Colors.accentTeal,
    fontSize: 11,
    fontWeight: '800',
  },
});
