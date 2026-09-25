import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useERP } from '../context/ERPContext';
import { useAuth } from '../context/AuthContext';
import { SalesWorkflowStage, DepartmentStatus } from '../types';
import { Colors, StatusColors, Spacing, Radius, Shadows } from '../theme';
import { OrderQuantityTracker } from './OrderQuantityTracker';

interface OrderOverviewModalProps {
  visible: boolean;
  onClose: () => void;
}

export const OrderOverviewModal: React.FC<OrderOverviewModalProps> = ({ visible, onClose }) => {
  const { selectedOrder } = useERP();
  const { currentUser } = useAuth();

  if (!selectedOrder) return null;

  const isRestrictedRole = currentUser
    ? ['PURCHASE', 'PRODUCTION', 'QUALITY_TESTING', 'DISPATCH'].includes(currentUser.role)
    : true;

  const salesWorkflowStages: SalesWorkflowStage[] = [
    'REQUIREMENT_RECEIVED',
    'QUOTATION_PREPARED',
    'QUOTATION_APPROVED',
    'DRAWING_SUBMITTED',
    'DRAWING_APPROVED',
    'QUALITY_TESTING_REQUIRED',
    'ORDER_CONFIRMED',
  ];

  const getStageIndex = (stage: SalesWorkflowStage) => salesWorkflowStages.indexOf(stage);
  const currentStageIdx = getStageIndex(selectedOrder.salesWorkflowStage);

  const calculateCompletionPercent = () => {
    let totalStages = 0;
    let completedStages = 0;

    // Sales 7-stage initiation
    totalStages += 1;
    if (selectedOrder.salesWorkflowStage === 'ORDER_CONFIRMED') completedStages += 1;

    // Purchase pipeline
    if (selectedOrder.purchaseRequired) {
      totalStages += 1;
      if (selectedOrder.purchaseStatus === 'COMPLETED') completedStages += 1;
    }

    // Production pipeline
    if (selectedOrder.productionRequired) {
      totalStages += 1;
      if (selectedOrder.productionStatus === 'COMPLETED') completedStages += 1;
    }

    // Quality Testing pipeline
    if (selectedOrder.qualityTestingRequired) {
      totalStages += 1;
      if (selectedOrder.qualityStatus === 'COMPLETED') completedStages += 1;
    }

    // Dispatch pipeline
    if (selectedOrder.dispatchRequired) {
      totalStages += 1;
      if (selectedOrder.dispatchStatus === 'COMPLETED') completedStages += 1;
    }

    // Final Sales Verification
    totalStages += 1;
    if (selectedOrder.salesVerification === 'COMPLETED') completedStages += 1;

    return Math.round((completedStages / totalStages) * 100);
  };

  const completionPct = calculateCompletionPercent();

  const getCardStyleForStatus = (status: DepartmentStatus) => {
    if (status === 'COMPLETED' || status === 'APPROVED') {
      return {
        borderColor: StatusColors.COMPLETED.border,
        borderLeftColor: StatusColors.COMPLETED.bg,
        borderLeftWidth: 4,
        badgeBg: StatusColors.COMPLETED.bg,
        badgeText: StatusColors.COMPLETED.text,
        badgeBorder: StatusColors.COMPLETED.border,
        label: status,
      };
    }
    if (status === 'IN_PROGRESS') {
      return {
        borderColor: StatusColors.IN_PROGRESS.border,
        borderLeftColor: StatusColors.IN_PROGRESS.bg,
        borderLeftWidth: 4,
        badgeBg: StatusColors.IN_PROGRESS.bg,
        badgeText: StatusColors.IN_PROGRESS.text,
        badgeBorder: StatusColors.IN_PROGRESS.border,
        label: 'IN PROGRESS',
      };
    }
    if (status === 'REJECTED') {
      return {
        borderColor: StatusColors.FAILED.border,
        borderLeftColor: StatusColors.FAILED.bg,
        borderLeftWidth: 4,
        badgeBg: StatusColors.FAILED.bg,
        badgeText: StatusColors.FAILED.text,
        badgeBorder: StatusColors.FAILED.border,
        label: 'REJECTED',
      };
    }
    return {
      borderColor: StatusColors.PENDING.border,
      borderLeftColor: StatusColors.PENDING.bg,
      borderLeftWidth: 4,
      badgeBg: StatusColors.PENDING.bg,
      badgeText: StatusColors.PENDING.text,
      badgeBorder: StatusColors.PENDING.border,
      label: 'PENDING',
    };
  };

  const mainOrderStatus = getCardStyleForStatus(selectedOrder.status);
  const purchaseCardStyle = getCardStyleForStatus(selectedOrder.purchaseStatus);
  const productionCardStyle = getCardStyleForStatus(selectedOrder.productionStatus);
  const qualityCardStyle = getCardStyleForStatus(selectedOrder.qualityStatus);
  const dispatchCardStyle = getCardStyleForStatus(selectedOrder.dispatchStatus);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <View style={styles.orderBadgeRow}>
                <Text style={styles.orderNumber}>{selectedOrder.orderNumber}</Text>
                <View style={[styles.statusBadge, { backgroundColor: mainOrderStatus.badgeBg, borderColor: mainOrderStatus.badgeBorder }]}>
                  <Text style={[styles.statusText, { color: mainOrderStatus.badgeText }]}>{mainOrderStatus.label}</Text>
                </View>
              </View>
              <Text style={styles.poNumberText}>PO Number: {selectedOrder.poNumber}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
            {/* Completion Progress Bar */}
            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <Text style={styles.cardTitle}>Total Workflow Progress</Text>
                <Text style={[styles.progressPct, { color: StatusColors.PROGRESS_BAR.completed }]}>{completionPct}%</Text>
              </View>
              <View style={[styles.progressBarTrack, { backgroundColor: StatusColors.PROGRESS_BAR.remaining }]}>
                <View style={[styles.progressBarFill, { width: `${completionPct}%`, backgroundColor: StatusColors.PROGRESS_BAR.completed }]} />
              </View>
            </View>

            {/* Live Quantity Tracking Panel */}
            <OrderQuantityTracker order={selectedOrder} />

            {/* Client & Technical Summary */}
            <View style={styles.gridRow}>
              <View style={styles.infoCard}>
                <Text style={styles.infoCardTitle}>Client Info (RBAC Filtered)</Text>
                <Text style={styles.infoLabel}>Client Code: <Text style={styles.infoValHighlight}>{selectedOrder.clientCode}</Text></Text>

                {isRestrictedRole ? (
                  <View style={styles.maskedAlert}>
                    <Text style={styles.maskedAlertText}>🔒 Client Name & Contact Details are masked for your role.</Text>
                  </View>
                ) : (
                  <>
                    <Text style={styles.infoLabel}>Client Name: <Text style={styles.infoVal}>{selectedOrder.clientName}</Text></Text>
                    <Text style={styles.infoLabel}>Contact: <Text style={styles.infoVal}>{selectedOrder.contactNo}</Text></Text>
                    <Text style={styles.infoLabel}>Budget: <Text style={styles.infoVal}>₹{selectedOrder.budget?.toLocaleString()}</Text></Text>
                  </>
                )}
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoCardTitle}>Order Specs & Material</Text>
                <Text style={styles.infoLabel}>Required Qty: <Text style={styles.infoValHighlight}>{selectedOrder.requiredQuantity} pcs</Text></Text>
                <Text style={styles.infoLabel}>Technical Specs: <Text style={styles.infoVal}>{selectedOrder.technicalRequirements || 'N/A'}</Text></Text>
                <Text style={styles.infoLabel}>Material Spec: <Text style={styles.infoVal}>{selectedOrder.materialRequirements || 'N/A'}</Text></Text>
              </View>
            </View>

            {/* 7-Stage Sales Initiation Stepper */}
            <View style={styles.stepperCard}>
              <Text style={styles.cardTitle}>Sales Initiation Workflow Stepper</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stepperScroll}>
                {salesWorkflowStages.map((stg, index) => {
                  const isDone = index < currentStageIdx;
                  const isCurrent = index === currentStageIdx;

                  let circleBg = StatusColors.STEPPER.pendingCircle;
                  let textColor = StatusColors.STEPPER.pendingText;
                  let connectorColor = StatusColors.STEPPER.pendingConnector;

                  if (isDone) {
                    circleBg = StatusColors.STEPPER.completedCircle;
                    textColor = StatusColors.STEPPER.completedText;
                    connectorColor = StatusColors.STEPPER.completedConnector;
                  } else if (isCurrent) {
                    circleBg = StatusColors.STEPPER.inProgressCircle;
                    textColor = StatusColors.STEPPER.inProgressText;
                    connectorColor = StatusColors.STEPPER.inProgressConnector;
                  }

                  return (
                    <View key={stg} style={styles.stepItem}>
                      <View style={[styles.stepCircle, { backgroundColor: circleBg, borderColor: isCurrent ? StatusColors.IN_PROGRESS.border : circleBg }]}>
                        <Text style={[styles.stepNumber, { color: textColor }]}>
                          {isDone ? '✓' : index + 1}
                        </Text>
                      </View>
                      <Text style={[styles.stepLabel, isDone && { color: Colors.textLight, fontWeight: '700' }, isCurrent && { color: Colors.textLight, fontWeight: '800' }]}>
                        {stg.replace(/_/g, ' ')}
                      </Text>
                      {index < salesWorkflowStages.length - 1 && (
                        <View style={[styles.stepConnector, { backgroundColor: connectorColor }]} />
                      )}
                    </View>
                  );
                })}
              </ScrollView>
            </View>

            {/* Department Workflow Summary Cards */}
            <View style={styles.deptSummaryRow}>
              <View style={[styles.deptBox, { borderLeftWidth: purchaseCardStyle.borderLeftWidth, borderLeftColor: purchaseCardStyle.borderLeftColor }]}>
                <Text style={styles.deptTitle}>Purchase</Text>
                <Text style={styles.deptPipelineLabel}>{selectedOrder.purchaseRequired ? '☑ Required' : '☐ Bypassed'}</Text>
                <View style={[styles.deptBadge, { backgroundColor: purchaseCardStyle.badgeBg, borderWidth: 1, borderColor: purchaseCardStyle.badgeBorder }]}>
                  <Text style={[styles.deptBadgeText, { color: purchaseCardStyle.badgeText }]}>{selectedOrder.purchaseStatus}</Text>
                </View>
                {selectedOrder.vendorSelected ? (
                  <Text style={styles.deptSubText}>Vendor: {selectedOrder.vendorSelected}</Text>
                ) : null}
              </View>

              <View style={[styles.deptBox, { borderLeftWidth: productionCardStyle.borderLeftWidth, borderLeftColor: productionCardStyle.borderLeftColor }]}>
                <Text style={styles.deptTitle}>Production</Text>
                <Text style={styles.deptPipelineLabel}>{selectedOrder.productionRequired ? '☑ Required' : '☐ Bypassed'}</Text>
                <View style={[styles.deptBadge, { backgroundColor: productionCardStyle.badgeBg, borderWidth: 1, borderColor: productionCardStyle.badgeBorder }]}>
                  <Text style={[styles.deptBadgeText, { color: productionCardStyle.badgeText }]}>{selectedOrder.productionStatus}</Text>
                </View>
              </View>

              <View style={[styles.deptBox, { borderLeftWidth: qualityCardStyle.borderLeftWidth, borderLeftColor: qualityCardStyle.borderLeftColor }]}>
                <Text style={styles.deptTitle}>Quality Testing</Text>
                <Text style={styles.deptPipelineLabel}>{selectedOrder.qualityTestingRequired ? '☑ Required' : '☐ Bypassed'}</Text>
                <View style={[styles.deptBadge, { backgroundColor: qualityCardStyle.badgeBg, borderWidth: 1, borderColor: qualityCardStyle.badgeBorder }]}>
                  <Text style={[styles.deptBadgeText, { color: qualityCardStyle.badgeText }]}>{selectedOrder.qualityStatus}</Text>
                </View>
                <Text style={styles.deptSubText}>QC Result: {selectedOrder.qcResult}</Text>
              </View>

              <View style={[styles.deptBox, { borderLeftWidth: dispatchCardStyle.borderLeftWidth, borderLeftColor: dispatchCardStyle.borderLeftColor }]}>
                <Text style={styles.deptTitle}>Dispatch</Text>
                <Text style={styles.deptPipelineLabel}>{selectedOrder.dispatchRequired ? '☑ Required' : '☐ Bypassed'}</Text>
                <View style={[styles.deptBadge, { backgroundColor: dispatchCardStyle.badgeBg, borderWidth: 1, borderColor: dispatchCardStyle.badgeBorder }]}>
                  <Text style={[styles.deptBadgeText, { color: dispatchCardStyle.badgeText }]}>{selectedOrder.dispatchStatus}</Text>
                </View>
              </View>
            </View>

            {/* Stage-Wise Quantity Movement Audit Logs */}
            {selectedOrder.quantityLogs && selectedOrder.quantityLogs.length > 0 && (
              <View style={styles.timelineCard}>
                <Text style={styles.cardTitle}>📦 Stage-Wise Quantity Movement History</Text>
                <View style={{ gap: 6, marginTop: Spacing.xs }}>
                  {selectedOrder.quantityLogs.map((qlog) => (
                    <View key={qlog.id} style={styles.qlogCard}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={styles.qlogStageText}>{qlog.stage} • <Text style={{ color: Colors.textLight, fontWeight: '800' }}>{qlog.actionLabel}</Text></Text>
                        <Text style={styles.qlogTimeText}>{new Date(qlog.createdAt).toLocaleDateString()} {new Date(qlog.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                        <Text style={styles.qlogSubText}>Accumulated: <Text style={{ fontWeight: '800', color: Colors.accentTeal }}>{qlog.accumulatedQty}/{qlog.totalQty} PCS</Text> • Remaining: <Text style={{ fontWeight: '800', color: Colors.industrialOrange }}>{qlog.remainingQty} PCS</Text></Text>
                        <Text style={styles.qlogUserText}>by {qlog.changedByName} ({qlog.changedByRole})</Text>
                      </View>
                      {qlog.remarks ? <Text style={styles.qlogRemarksText}>"{qlog.remarks}"</Text> : null}
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Workflow Timeline & Audit Logs */}
            <View style={styles.timelineCard}>
              <Text style={styles.cardTitle}>Department History & Audit Logs</Text>
              {selectedOrder.stageLogs.length === 0 ? (
                <Text style={styles.emptyText}>No activity recorded yet.</Text>
              ) : (
                selectedOrder.stageLogs.map((log) => (
                  <View key={log.id} style={styles.timelineItem}>
                    <View style={styles.timelineDot} />
                    <View style={styles.timelineContent}>
                      <View style={styles.timelineTopRow}>
                        <Text style={styles.timelineDept}>{log.department}</Text>
                        <Text style={styles.timelineTime}>{new Date(log.createdAt).toLocaleString()}</Text>
                      </View>
                      <Text style={styles.timelineAction}>{log.action}</Text>
                      {log.remarks ? <Text style={styles.timelineRemarks}>"{log.remarks}"</Text> : null}
                      <Text style={styles.timelineUser}>Updated by: {log.changedByName} ({log.changedByRole})</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
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
  modalContainer: {
    width: '100%',
    maxWidth: 850,
    maxHeight: '90%',
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    ...Shadows.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDark,
    paddingBottom: 16,
    marginBottom: 16,
  },
  orderBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  orderNumber: {
    color: Colors.textLight,
    fontSize: 20,
    fontWeight: '800',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '800',
  },
  poNumberText: {
    color: Colors.accentTeal,
    fontSize: 13,
    marginTop: 2,
  },
  closeBtn: {
    backgroundColor: Colors.inputBg,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  closeBtnText: {
    color: Colors.accentTeal,
    fontSize: 14,
    fontWeight: '700',
  },
  contentScroll: {
    flex: 1,
  },
  progressCard: {
    backgroundColor: Colors.inputBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    color: Colors.textLight,
    fontSize: 15,
    fontWeight: '700',
  },
  progressPct: {
    color: Colors.successBright,
    fontSize: 16,
    fontWeight: '800',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: Colors.borderMuted,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.successBright,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  infoCard: {
    flex: 1,
    backgroundColor: Colors.inputBg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    gap: 6,
  },
  infoCardTitle: {
    color: Colors.accentTeal,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  infoLabel: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  infoVal: {
    color: Colors.textLight,
    fontWeight: '600',
  },
  infoValHighlight: {
    color: Colors.accentTeal,
    fontWeight: '800',
  },
  maskedAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginTop: 4,
  },
  maskedAlertText: {
    color: Colors.dangerBright,
    fontSize: 11,
    fontWeight: '600',
  },
  stepperCard: {
    backgroundColor: Colors.inputBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  stepperScroll: {
    marginTop: 12,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.borderMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  stepDoneCircle: {
    backgroundColor: Colors.successBright,
  },
  stepCurrentCircle: {
    backgroundColor: Colors.accentTeal,
    borderWidth: 2,
    borderColor: Colors.primaryLight,
  },
  stepNumber: {
    color: Colors.textSubtle,
    fontSize: 12,
    fontWeight: '800',
  },
  stepDoneNumber: {
    color: Colors.white,
  },
  stepLabel: {
    color: Colors.textSubtle,
    fontSize: 11,
    fontWeight: '600',
  },
  stepDoneLabel: {
    color: Colors.textLight,
    fontWeight: '700',
  },
  stepConnector: {
    width: 20,
    height: 2,
    backgroundColor: Colors.borderMuted,
    marginLeft: 12,
  },
  stepDoneConnector: {
    backgroundColor: Colors.successBright,
  },
  deptSummaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  deptBox: {
    flex: 1,
    backgroundColor: Colors.inputBg,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    alignItems: 'center',
  },
  deptTitle: {
    color: Colors.textLight,
    fontSize: 13,
    fontWeight: '700',
  },
  deptPipelineLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    marginVertical: 4,
  },
  deptBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginVertical: 4,
  },
  deptBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '800',
  },
  deptSubText: {
    color: Colors.textSubtle,
    fontSize: 10,
    textAlign: 'center',
  },
  timelineCard: {
    backgroundColor: Colors.inputBg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  emptyText: {
    color: Colors.textSubtle,
    fontSize: 12,
    marginVertical: 10,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    borderLeftWidth: 2,
    borderLeftColor: Colors.accentTeal,
    paddingLeft: 12,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accentTeal,
    position: 'absolute',
    left: -5,
    top: 4,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timelineDept: {
    color: Colors.accentTeal,
    fontSize: 11,
    fontWeight: '800',
  },
  timelineTime: {
    color: Colors.textSubtle,
    fontSize: 10,
  },
  timelineAction: {
    color: Colors.textLight,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  timelineRemarks: {
    color: Colors.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 2,
  },
  timelineUser: {
    color: Colors.textSubtle,
    fontSize: 10,
    marginTop: 4,
  },
  qlogCard: {
    backgroundColor: Colors.inputBg,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  qlogStageText: {
    color: Colors.accentTeal,
    fontSize: 11,
    fontWeight: '800',
  },
  qlogTimeText: {
    color: Colors.textSubtle,
    fontSize: 10,
  },
  qlogSubText: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  qlogUserText: {
    color: Colors.textSubtle,
    fontSize: 10,
  },
  qlogRemarksText: {
    color: Colors.textLight,
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 2,
  },
});
