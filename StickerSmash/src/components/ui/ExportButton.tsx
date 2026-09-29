import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TouchableWithoutFeedback } from 'react-native';
import { exportToExcel, exportToPDF, ExportDataPayload } from '../../utils/exportUtils';
import { Colors, Spacing, Radius, Shadows } from '../../theme';

interface ExportButtonProps {
  getData: () => ExportDataPayload;
  buttonText?: string;
  variant?: 'compact' | 'full';
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  getData,
  buttonText = 'Export Data',
  variant = 'compact',
}) => {
  const [menuVisible, setMenuVisible] = useState(false);

  const handleExportExcel = () => {
    setMenuVisible(false);
    const payload = getData();
    exportToExcel(payload);
  };

  const handleExportPDF = () => {
    setMenuVisible(false);
    const payload = getData();
    exportToPDF(payload);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.exportBtn, variant === 'compact' && styles.exportBtnCompact]}
        onPress={() => setMenuVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.exportBtnIcon}>📥</Text>
        <Text style={styles.exportBtnText}>{buttonText}</Text>
        <Text style={styles.dropdownArrow}>▼</Text>
      </TouchableOpacity>

      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.dropdownCard}>
                <Text style={styles.dropdownHeader}>SELECT EXPORT FORMAT</Text>

                <TouchableOpacity style={styles.optionRow} onPress={handleExportPDF}>
                  <Text style={styles.optionIcon}>📄</Text>
                  <View style={styles.optionTextContainer}>
                    <Text style={styles.optionTitle}>Export as PDF</Text>
                    <Text style={styles.optionSub}>Printable formatted report / PDF file</Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity style={styles.optionRow} onPress={handleExportExcel}>
                  <Text style={styles.optionIcon}>📊</Text>
                  <View style={styles.optionTextContainer}>
                    <Text style={styles.optionTitle}>Export as Excel (CSV)</Text>
                    <Text style={styles.optionSub}>Spreadsheet compatible CSV format</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    borderWidth: 1,
    borderColor: '#0284c7',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.md,
    gap: 6,
  },
  exportBtnCompact: {
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: Spacing.xs,
  },
  exportBtnIcon: {
    fontSize: 14,
  },
  exportBtnText: {
    color: '#0284c7',
    fontSize: 13,
    fontWeight: '600',
  },
  dropdownArrow: {
    color: '#0284c7',
    fontSize: 9,
    marginLeft: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  dropdownCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#0f172a',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: Spacing.md,
    ...Shadows.md,
  },
  dropdownHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  optionIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '600',
  },
  optionSub: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#1e293b',
    marginVertical: 6,
  },
});
