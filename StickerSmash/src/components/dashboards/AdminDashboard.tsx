import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { Colors, StatusColors, Spacing, Radius, Shadows } from '../../theme';
import { TaskKPICards } from './TaskKPICards';
import { OrderKPICards } from './OrderKPICards';

interface AdminDashboardProps {
  onOpenCreateUser?: () => void;
  isSuperAdmin?: boolean;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ isSuperAdmin = false }) => {
  const { orders, setSelectedOrder } = useERP();
  const { authAuditLogs, currentUser } = useAuth();

  // If currentUser is SUPER_ADMIN, enforce isSuperAdmin = true
  const effectiveSuperAdmin = isSuperAdmin || currentUser?.role === 'SUPER_ADMIN';

  const getPillStyle = (status: string) => {
    if (status === 'COMPLETED' || status === 'APPROVED' || status === 'PASSED') {
      return { bg: StatusColors.COMPLETED.bg, text: StatusColors.COMPLETED.text, border: StatusColors.COMPLETED.border };
    }
    if (status === 'IN_PROGRESS') {
      return { bg: StatusColors.IN_PROGRESS.bg, text: StatusColors.IN_PROGRESS.text, border: StatusColors.IN_PROGRESS.border };
    }
    if (status === 'FAILED' || status === 'REJECTED') {
      return { bg: StatusColors.FAILED.bg, text: StatusColors.FAILED.text, border: StatusColors.FAILED.border };
    }
    return { bg: StatusColors.PENDING.bg, text: StatusColors.PENDING.text, border: StatusColors.PENDING.border };
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Top Banner */}
      <View style={styles.topBanner}>
        <View>
          <Text style={styles.bannerTitle}>
            {effectiveSuperAdmin ? 'Super Admin Executive Dashboard' : 'Admin Operations & Workflow Dashboard'}
          </Text>
          <Text style={styles.bannerSub}>
            {effectiveSuperAdmin
              ? 'Full system access, global ERP performance overview, workflow monitoring, and security audit logs.'
              : 'Organization-wide workflow monitoring, department tracking, task management, and productivity reports.'}
          </Text>
        </View>
      </View>

      {/* Row 1: Global Order KPI Cards */}
      <OrderKPICards style={{ marginBottom: Spacing.md }} />

      {/* Row 2: Global Task Metrics KPI Cards */}
      <TaskKPICards style={{ marginBottom: Spacing.lg }} />

      {/* Global Orders Summary */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Global Orders Overview (Click Row for Overview Modal)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.table}>
            <View style={styles.thRow}>
              <Text style={[styles.th, { width: 120 }]}>Order Number</Text>
              <Text style={[styles.th, { width: 100 }]}>Client Code</Text>
              <Text style={[styles.th, { width: 180 }]}>Client Name</Text>
              <Text style={[styles.th, { width: 140 }]}>Sales Stage</Text>
              <Text style={[styles.th, { width: 110 }]}>Purchase</Text>
              <Text style={[styles.th, { width: 110 }]}>Production</Text>
              <Text style={[styles.th, { width: 110 }]}>QC Result</Text>
              <Text style={[styles.th, { width: 110 }]}>Dispatch</Text>
            </View>

            {orders.map((ord) => {
              const purStyle = getPillStyle(ord.purchaseStatus);
              const prodStyle = getPillStyle(ord.productionStatus);
              const qcStyle = getPillStyle(ord.qcResult);
              const dispStyle = getPillStyle(ord.dispatchStatus);

              return (
                <TouchableOpacity key={ord.id} style={styles.trRow} onPress={() => setSelectedOrder(ord)}>
                  <Text style={[styles.tdHighlight, { width: 120 }]}>{ord.orderNumber}</Text>
                  <Text style={[styles.td, { width: 100 }]}>{ord.clientCode}</Text>
                  <Text style={[styles.td, { width: 180 }]}>{ord.clientName}</Text>
                  <Text style={[styles.tdSmall, { width: 140 }]}>{ord.salesWorkflowStage.replace(/_/g, ' ')}</Text>

                  <View style={{ width: 110 }}>
                    <View style={{ backgroundColor: purStyle.bg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: purStyle.border, alignItems: 'center' }}>
                      <Text style={{ color: purStyle.text, fontSize: 10, fontWeight: '800' }}>{ord.purchaseStatus}</Text>
                    </View>
                  </View>

                  <View style={{ width: 110 }}>
                    <View style={{ backgroundColor: prodStyle.bg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: prodStyle.border, alignItems: 'center' }}>
                      <Text style={{ color: prodStyle.text, fontSize: 10, fontWeight: '800' }}>{ord.productionStatus}</Text>
                    </View>
                  </View>

                  <View style={{ width: 110 }}>
                    <View style={{ backgroundColor: qcStyle.bg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: qcStyle.border, alignItems: 'center' }}>
                      <Text style={{ color: qcStyle.text, fontSize: 10, fontWeight: '800' }}>{ord.qcResult}</Text>
                    </View>
                  </View>

                  <View style={{ width: 110 }}>
                    <View style={{ backgroundColor: dispStyle.bg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: dispStyle.border, alignItems: 'center' }}>
                      <Text style={{ color: dispStyle.text, fontSize: 10, fontWeight: '800' }}>{ord.dispatchStatus}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Security Audit Logs Section (Super Admin Exclusive Detail) */}
      {effectiveSuperAdmin && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Security & Authentication Activity Audit Logs</Text>
          <Text style={styles.sectionSub}>Real-time tracking of login, logout, password resets, and OTP verifications.</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
            <View style={styles.table}>
              <View style={styles.thRow}>
                <Text style={[styles.th, { width: 150 }]}>Event Type</Text>
                <Text style={[styles.th, { width: 130 }]}>User ID</Text>
                <Text style={[styles.th, { width: 180 }]}>Email Ref</Text>
                <Text style={[styles.th, { width: 220 }]}>Activity Details</Text>
                <Text style={[styles.th, { width: 160 }]}>Timestamp</Text>
              </View>

              {authAuditLogs.map((log) => (
                <View key={log.id} style={styles.trRow}>
                  <View style={{ width: 150 }}>
                    <View style={[styles.eventBadge, log.event.includes('FAILED') ? styles.failBadge : styles.successBadge]}>
                      <Text style={styles.eventBadgeText}>{log.event}</Text>
                    </View>
                  </View>
                  <Text style={[styles.tdBold, { width: 130 }]}>{log.username || 'N/A'}</Text>
                  <Text style={[styles.td, { width: 180 }]}>{log.email || 'N/A'}</Text>
                  <Text style={[styles.td, { width: 220 }]}>{log.details}</Text>
                  <Text style={[styles.tdSmall, { width: 160 }]}>{new Date(log.timestamp).toLocaleString()}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}
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
  bannerTitle: {
    color: Colors.textLight,
    fontSize: 18,
    fontWeight: '800',
  },
  bannerSub: {
    color: Colors.accentTeal,
    fontSize: 12,
    marginTop: 2,
  },
  createUserBtn: {
    backgroundColor: Colors.industrialOrange,
    paddingHorizontal: Spacing.px14,
    paddingVertical: Spacing.px10,
    borderRadius: Radius.md,
    ...Shadows.glowOrange,
  },
  createUserBtnText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  widgetGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  widgetCard: {
    flex: 1,
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    ...Shadows.sm,
  },
  widgetVal: {
    color: Colors.textLight,
    fontSize: 24,
    fontWeight: '900',
  },
  widgetLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  widgetBadge: {
    backgroundColor: Colors.inputBg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.xs,
    alignSelf: 'flex-start',
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  widgetBadgeText: {
    color: Colors.accentTeal,
    fontSize: 10,
    fontWeight: '700',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    color: Colors.textLight,
    fontSize: 15,
    fontWeight: '800',
  },
  sectionSub: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  smallBtn: {
    backgroundColor: Colors.accentTeal,
    paddingHorizontal: Spacing.px10,
    paddingVertical: Spacing.px6,
    borderRadius: Radius.sm,
  },
  smallBtnText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  table: {
    minWidth: 800,
  },
  thRow: {
    flexDirection: 'row',
    backgroundColor: Colors.inputBg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.px10,
    borderRadius: Radius.sm,
    marginBottom: Spacing.px6,
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
    paddingVertical: Spacing.px10,
    paddingHorizontal: Spacing.px10,
    borderRadius: Radius.sm,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  tdName: {
    color: Colors.textLight,
    fontSize: 13,
    fontWeight: '700',
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
  tdHighlight: {
    color: Colors.accentTeal,
    fontSize: 12,
    fontWeight: '700',
  },
  tdSmall: {
    color: Colors.textSubtle,
    fontSize: 11,
  },
  roleTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.xs,
    alignSelf: 'flex-start',
  },
  roleTagText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '800',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  activeText: {
    color: Colors.successBright,
  },
  inactiveText: {
    color: Colors.industrialOrange,
  },
  protectedText: {
    color: Colors.textSubtle,
    fontSize: 11,
    fontStyle: 'italic',
  },
  toggleBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.xs,
    alignItems: 'center',
  },
  deactBtn: {
    backgroundColor: 'rgba(179, 75, 32, 0.1)',
    borderWidth: 1,
    borderColor: Colors.industrialOrange,
  },
  actBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: Colors.successBright,
  },
  toggleBtnText: {
    color: Colors.industrialOrange,
    fontSize: 10,
    fontWeight: '700',
  },
  eventBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.xs,
    alignSelf: 'flex-start',
  },
  successBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  failBadge: {
    backgroundColor: 'rgba(179, 75, 32, 0.1)',
  },
  eventBadgeText: {
    color: Colors.accentTeal,
    fontSize: 10,
    fontWeight: '800',
  },
});
