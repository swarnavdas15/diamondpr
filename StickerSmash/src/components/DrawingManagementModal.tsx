import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, TextInput, StyleSheet, Image } from 'react-native';
import { useERP } from '../context/ERPContext';
import { DrawingStatus, OrderDrawing } from '../types';
import { Colors, StatusColors, Spacing, Radius, Shadows } from '../theme';

interface DrawingManagementModalProps {
  visible: boolean;
  onClose: () => void;
  orderId: string;
}

export const DrawingManagementModal: React.FC<DrawingManagementModalProps> = ({ visible, onClose, orderId }) => {
  const { orders, uploadOrderDrawing, updateDrawingStatus, deleteOrderDrawing } = useERP();
  const order = orders.find((o) => o.id === orderId);

  const [drawingNumber, setDrawingNumber] = useState('');
  const [drawingName, setDrawingName] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState<'PDF' | 'PNG' | 'JPG' | 'JPEG' | 'DWG' | 'DXF'>('PDF');
  const [isUploading, setIsUploading] = useState(false);

  // Preview state
  const [previewDrawing, setPreviewDrawing] = useState<OrderDrawing | null>(null);

  // Status review remarks
  const [remarksMap, setRemarksMap] = useState<{ [key: string]: string }>({});

  if (!order) return null;

  const drawings = order.drawings || [];

  const handleUpload = () => {
    if (!drawingNumber.trim() || !drawingName.trim()) return;

    const actualFileName = fileName.trim() || `${drawingNumber.trim().toLowerCase()}_rev.pdf`;

    uploadOrderDrawing(orderId, {
      drawingNumber: drawingNumber.trim(),
      drawingName: drawingName.trim(),
      fileName: actualFileName,
      fileType,
      fileSize: '2.4 MB',
    });

    setDrawingNumber('');
    setDrawingName('');
    setFileName('');
    setIsUploading(false);
  };

  const getStatusBadgeStyle = (status: DrawingStatus) => {
    switch (status) {
      case 'APPROVED':
        return { bg: StatusColors.COMPLETED.bg, text: StatusColors.COMPLETED.text, border: StatusColors.COMPLETED.border, label: '✓ APPROVED' };
      case 'UNDER_REVIEW':
        return { bg: StatusColors.IN_PROGRESS.bg, text: StatusColors.IN_PROGRESS.text, border: StatusColors.IN_PROGRESS.border, label: '🔍 UNDER REVIEW' };
      case 'REJECTED':
        return { bg: StatusColors.FAILED.bg, text: StatusColors.FAILED.text, border: StatusColors.FAILED.border, label: '✕ REJECTED' };
      default:
        return { bg: StatusColors.PENDING.bg, text: StatusColors.PENDING.text, border: StatusColors.PENDING.border, label: '⏳ PENDING' };
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.titleRow}>
              <Text style={styles.titleIcon}>📐</Text>
              <View>
                <Text style={styles.modalTitle}>Drawing Upload & Management</Text>
                <Text style={styles.modalSubTitle}>Order: {order.orderNumber} • Client: {order.clientName}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Action Row */}
          <View style={styles.actionHeaderRow}>
            <Text style={styles.sectionTitle}>Drawing Files & Version History ({drawings.length})</Text>
            <TouchableOpacity style={styles.uploadToggleBtn} onPress={() => setIsUploading(!isUploading)}>
              <Text style={styles.uploadToggleText}>{isUploading ? 'Cancel' : '+ Upload New / Revision'}</Text>
            </TouchableOpacity>
          </View>

          {/* Upload Form */}
          {isUploading && (
            <View style={styles.uploadFormCard}>
              <Text style={styles.formHeading}>Upload Drawing / Engineering Revision</Text>
              
              <View style={styles.formRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Drawing # / Code *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. DWG-SS316-001"
                    placeholderTextColor="#94a3b8"
                    value={drawingNumber}
                    onChangeText={setDrawingNumber}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Drawing Title / Description *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 6 inch 600# Flange Assembly"
                    placeholderTextColor="#94a3b8"
                    value={drawingName}
                    onChangeText={setDrawingName}
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>File Name (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. flange_drawing_v1.pdf"
                    placeholderTextColor="#94a3b8"
                    value={fileName}
                    onChangeText={setFileName}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>File Format</Text>
                  <View style={styles.formatChipRow}>
                    {(['PDF', 'PNG', 'JPG', 'JPEG', 'DWG', 'DXF'] as const).map((fmt) => (
                      <TouchableOpacity
                        key={fmt}
                        style={[styles.formatChip, fileType === fmt && styles.formatChipActive]}
                        onPress={() => setFileType(fmt)}
                      >
                        <Text style={[styles.formatChipText, fileType === fmt && styles.formatChipTextActive]}>
                          {fmt}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <TouchableOpacity style={styles.submitUploadBtn} onPress={handleUpload}>
                <Text style={styles.submitUploadBtnText}>Save & Register Drawing</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Drawings List */}
          <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
            {drawings.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>📁</Text>
                <Text style={styles.emptyText}>No drawings uploaded for this order yet.</Text>
                <Text style={styles.emptySubText}>Click '+ Upload New / Revision' above to attach PDF, DWG, DXF or image drawings.</Text>
              </View>
            ) : (
              drawings.map((drw) => {
                const badge = getStatusBadgeStyle(drw.status);
                const isSelectedForPreview = previewDrawing?.id === drw.id;

                return (
                  <View key={drw.id} style={styles.drawingCard}>
                    <View style={styles.drawingCardHeader}>
                      <View style={styles.drawingInfoGroup}>
                        <View style={styles.verBadge}>
                          <Text style={styles.verBadgeText}>v{drw.versionNumber}</Text>
                        </View>
                        <Text style={styles.drawingNum}>{drw.drawingNumber}</Text>
                        <Text style={styles.drawingTitle}>— {drw.drawingName}</Text>
                      </View>

                      <View style={[styles.statusBadge, { backgroundColor: badge.bg, borderWidth: 1, borderColor: badge.border }]}>
                        <Text style={[styles.statusBadgeText, { color: badge.text }]}>{badge.label}</Text>
                      </View>
                    </View>

                    <View style={styles.metaRow}>
                      <Text style={styles.metaText}>File: <Text style={styles.metaHighlight}>{drw.fileName}</Text> ({drw.fileType} • {drw.fileSize})</Text>
                      <Text style={styles.metaText}>Uploaded by: <Text style={styles.metaHighlight}>{drw.uploadedBy}</Text> on {new Date(drw.uploadDate).toLocaleDateString()}</Text>
                    </View>

                    {drw.reviewRemarks ? (
                      <View style={styles.remarksBox}>
                        <Text style={styles.remarksLabel}>Review Remarks: <Text style={styles.remarksText}>"{drw.reviewRemarks}"</Text></Text>
                      </View>
                    ) : null}

                    {/* Interactive Review Remarks Input & Actions */}
                    <View style={styles.reviewInputRow}>
                      <TextInput
                        style={styles.remarksInput}
                        placeholder="Add review remarks before updating status..."
                        placeholderTextColor="#94a3b8"
                        value={remarksMap[drw.id] || ''}
                        onChangeText={(txt) => setRemarksMap({ ...remarksMap, [drw.id]: txt })}
                      />
                      <TouchableOpacity
                        style={styles.previewBtn}
                        onPress={() => setPreviewDrawing(isSelectedForPreview ? null : drw)}
                      >
                        <Text style={styles.previewBtnText}>{isSelectedForPreview ? 'Close Preview' : '👁 Preview'}</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Status Change Buttons */}
                    <View style={styles.statusActionRow}>
                      <TouchableOpacity
                        style={[styles.statusBtn, styles.btnUnderReview]}
                        onPress={() => updateDrawingStatus(orderId, drw.id, 'UNDER_REVIEW', remarksMap[drw.id])}
                      >
                        <Text style={styles.statusBtnText}>Under Review</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.statusBtn, styles.btnApprove]}
                        onPress={() => updateDrawingStatus(orderId, drw.id, 'APPROVED', remarksMap[drw.id])}
                      >
                        <Text style={styles.statusBtnText}>✓ Approve</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.statusBtn, styles.btnReject]}
                        onPress={() => updateDrawingStatus(orderId, drw.id, 'REJECTED', remarksMap[drw.id])}
                      >
                        <Text style={styles.statusBtnText}>✕ Reject</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.statusBtn, styles.btnDelete]}
                        onPress={() => deleteOrderDrawing(orderId, drw.id)}
                      >
                        <Text style={styles.statusBtnText}>🗑 Delete</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Inline Preview Panel */}
                    {isSelectedForPreview && (
                      <View style={styles.previewPanel}>
                        <Text style={styles.previewTitle}>📄 Drawing Preview: {drw.fileName}</Text>
                        <View style={styles.previewContentBox}>
                          {drw.fileType === 'PNG' || drw.fileType === 'JPG' || drw.fileType === 'JPEG' ? (
                            <View style={styles.imagePlaceholder}>
                              <Text style={styles.placeholderText}>[ IMAGE DRAWING PREVIEW ]</Text>
                              <Text style={styles.placeholderSub}>Resolution: 2400 x 1800 px • {drw.fileType}</Text>
                            </View>
                          ) : (
                            <View style={styles.docPlaceholder}>
                              <Text style={styles.docIcon}>{drw.fileType === 'PDF' ? '📕' : '📐'}</Text>
                              <Text style={styles.placeholderText}>{drw.fileType} Document View</Text>
                              <Text style={styles.placeholderSub}>{drw.drawingNumber} — {drw.drawingName} (Version {drw.versionNumber})</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    )}
                  </View>
                );
              })
            )}
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
    padding: Spacing.lg,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 780,
    maxHeight: '90%',
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    ...Shadows.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDark,
    paddingBottom: Spacing.md,
    marginBottom: Spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  titleIcon: {
    fontSize: 24,
  },
  modalTitle: {
    color: Colors.textLight,
    fontSize: 18,
    fontWeight: '800',
  },
  modalSubTitle: {
    color: Colors.accentTeal,
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    backgroundColor: Colors.inputBg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  closeBtnText: {
    color: Colors.accentTeal,
    fontSize: 14,
    fontWeight: '700',
  },
  actionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    color: Colors.textLight,
    fontSize: 14,
    fontWeight: '700',
  },
  uploadToggleBtn: {
    backgroundColor: Colors.industrialOrange,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    ...Shadows.glowOrange,
  },
  uploadToggleText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  uploadFormCard: {
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    gap: Spacing.md,
  },
  formHeading: {
    color: Colors.textLight,
    fontSize: 14,
    fontWeight: '800',
  },
  formRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  inputGroup: {
    flex: 1,
    gap: 4,
  },
  inputLabel: {
    color: Colors.accentTeal,
    fontSize: 11,
    fontWeight: '700',
  },
  input: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    color: Colors.textLight,
    fontSize: 12,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  formatChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  formatChip: {
    backgroundColor: Colors.cardBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  formatChipActive: {
    backgroundColor: Colors.accentTeal,
    borderColor: Colors.primaryLight,
  },
  formatChipText: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  formatChipTextActive: {
    color: Colors.white,
  },
  submitUploadBtn: {
    backgroundColor: Colors.secondary,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
  submitUploadBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  scrollList: {
    flex: 1,
  },
  emptyCard: {
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    marginVertical: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    color: Colors.textLight,
    fontSize: 14,
    fontWeight: '700',
  },
  emptySubText: {
    color: Colors.textSubtle,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  drawingCard: {
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  drawingCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  drawingInfoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  verBadge: {
    backgroundColor: Colors.accentTeal,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  verBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '800',
  },
  drawingNum: {
    color: Colors.textLight,
    fontSize: 14,
    fontWeight: '800',
  },
  drawingTitle: {
    color: Colors.primaryLight,
    fontSize: 13,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  metaRow: {
    marginBottom: 8,
  },
  metaText: {
    color: Colors.textSubtle,
    fontSize: 11,
  },
  metaHighlight: {
    color: Colors.accentTeal,
    fontWeight: '700',
  },
  remarksBox: {
    backgroundColor: Colors.cardBg,
    padding: Spacing.xs,
    borderRadius: Radius.xs,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accentTeal,
  },
  remarksLabel: {
    color: Colors.primaryLight,
    fontSize: 11,
    fontWeight: '700',
  },
  remarksText: {
    color: Colors.textLight,
    fontStyle: 'italic',
  },
  reviewInputRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: 8,
  },
  remarksInput: {
    flex: 1,
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    color: Colors.textLight,
    fontSize: 11,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  previewBtn: {
    backgroundColor: Colors.cardBg,
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.accentTeal,
  },
  previewBtnText: {
    color: Colors.accentTeal,
    fontSize: 11,
    fontWeight: '700',
  },
  statusActionRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  statusBtn: {
    flex: 1,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.xs,
    alignItems: 'center',
  },
  btnUnderReview: {
    backgroundColor: Colors.accentTeal,
  },
  btnApprove: {
    backgroundColor: Colors.secondary,
  },
  btnReject: {
    backgroundColor: Colors.industrialOrange,
  },
  btnDelete: {
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: Colors.industrialOrange,
  },
  statusBtnText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '800',
  },
  previewPanel: {
    marginTop: Spacing.md,
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.accentTeal,
  },
  previewTitle: {
    color: Colors.accentTeal,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: Spacing.sm,
  },
  previewContentBox: {
    height: 140,
    backgroundColor: Colors.darkBlue,
    borderRadius: Radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  imagePlaceholder: {
    alignItems: 'center',
    gap: 4,
  },
  docPlaceholder: {
    alignItems: 'center',
    gap: 4,
  },
  docIcon: {
    fontSize: 28,
  },
  placeholderText: {
    color: Colors.textLight,
    fontSize: 13,
    fontWeight: '700',
  },
  placeholderSub: {
    color: Colors.primaryLight,
    fontSize: 11,
  },
});
