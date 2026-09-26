import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, Shadows } from '../../theme';

interface DatePickerInputProps {
  label?: string;
  value?: string; // YYYY-MM-DD
  onChangeDate: (dateStr: string) => void;
  placeholder?: string;
  required?: boolean;
}

export const DatePickerInput: React.FC<DatePickerInputProps> = ({
  label,
  value,
  onChangeDate,
  placeholder = 'Select Follow-Up Date...',
  required = false,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  // Parse initial date or default to Sept 2026 / current date
  const parseInitialDate = () => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date(2026, 8, 15); // Sept 15, 2026 default
  };

  const [viewDate, setViewDate] = useState<Date>(parseInitialDate());

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthName = viewDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  // Navigation handlers
  const prevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const prevYear = () => {
    setViewDate(new Date(year - 1, month, 1));
  };

  const nextYear = () => {
    setViewDate(new Date(year + 1, month, 1));
  };

  // Build days grid
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const daysGrid: Array<{ dayNum: number | null; dateStr: string | null }> = [];
  for (let i = 0; i < firstDayIndex; i++) {
    daysGrid.push({ dayNum: null, dateStr: null });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    daysGrid.push({ dayNum: d, dateStr });
  }

  const handleSelectDay = (dateStr: string) => {
    onChangeDate(dateStr);
    setModalVisible(false);
  };

  const handleClear = () => {
    onChangeDate('');
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {label ? (
        <Text style={styles.label}>
          {label} {required ? '*' : ''}
        </Text>
      ) : null}

      <TouchableOpacity
        style={[styles.triggerBtn, modalVisible && styles.triggerBtnActive]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.calendarIcon}>📅</Text>
        <Text style={[styles.triggerText, !value && styles.placeholderText]}>
          {value ? value : placeholder}
        </Text>
        {value ? (
          <TouchableOpacity onPress={handleClear} style={{ paddingLeft: 6 }}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </TouchableOpacity>

      {/* Date Picker Popover Modal */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📅 Select Follow-Up Date</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Navigation bar (Month & Year) */}
            <View style={styles.navRow}>
              <View style={styles.navGroup}>
                <TouchableOpacity onPress={prevYear} style={styles.navBtn}>
                  <Text style={styles.navBtnText}>« Yr</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
                  <Text style={styles.navBtnText}>◀</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.monthTitle}>{monthName}</Text>

              <View style={styles.navGroup}>
                <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
                  <Text style={styles.navBtnText}>▶</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={nextYear} style={styles.navBtn}>
                  <Text style={styles.navBtnText}>Yr »</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Weekday Labels */}
            <View style={styles.weekRow}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((w) => (
                <Text key={w} style={styles.weekText}>
                  {w}
                </Text>
              ))}
            </View>

            {/* Days Grid */}
            <View style={styles.grid}>
              {daysGrid.map((item, idx) => {
                if (!item.dayNum || !item.dateStr) {
                  return <View key={`blank-${idx}`} style={styles.dayCellEmpty} />;
                }

                const isSelected = value === item.dateStr;

                return (
                  <TouchableOpacity
                    key={item.dateStr}
                    style={[styles.dayCell, isSelected && styles.dayCellSelected]}
                    onPress={() => handleSelectDay(item.dateStr!)}
                  >
                    <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
                      {item.dayNum}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Quick Actions */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.todayBtn}
                onPress={() => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  handleSelectDay(todayStr);
                }}
              >
                <Text style={styles.todayBtnText}>Select Today</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
                <Text style={styles.clearBtnText}>Clear Date</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  label: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  triggerBtn: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  triggerBtnActive: {
    borderColor: Colors.accentTeal,
    backgroundColor: Colors.cardBg,
  },
  calendarIcon: {
    fontSize: 14,
  },
  triggerText: {
    color: Colors.textLight,
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  placeholderText: {
    color: '#94a3b8',
    fontWeight: '500',
  },
  clearIcon: {
    color: Colors.textSubtle,
    fontSize: 13,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    ...Shadows.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDark,
    paddingBottom: Spacing.xs,
  },
  modalTitle: {
    color: Colors.textLight,
    fontSize: 14,
    fontWeight: '800',
  },
  closeBtn: {
    color: Colors.textSubtle,
    fontSize: 16,
    fontWeight: '700',
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  navGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  navBtn: {
    backgroundColor: Colors.inputBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  navBtnText: {
    color: Colors.textLight,
    fontSize: 11,
    fontWeight: '800',
  },
  monthTitle: {
    color: Colors.accentTeal,
    fontSize: 13,
    fontWeight: '800',
  },
  weekRow: {
    flexDirection: 'row',
    marginVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDark,
    paddingBottom: 4,
  },
  weekText: {
    flex: 1,
    textAlign: 'center',
    color: Colors.textSubtle,
    fontSize: 11,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCellEmpty: {
    width: `${100 / 7}%`,
    height: 34,
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Radius.xs,
    marginVertical: 1,
  },
  dayCellSelected: {
    backgroundColor: Colors.accentTeal,
  },
  dayText: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '600',
  },
  dayTextSelected: {
    color: Colors.white,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.borderDark,
  },
  todayBtn: {
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.xs,
  },
  todayBtnText: {
    color: Colors.roles.SALES,
    fontSize: 11,
    fontWeight: '800',
  },
  clearBtn: {
    backgroundColor: Colors.inputBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.xs,
  },
  clearBtnText: {
    color: Colors.textSubtle,
    fontSize: 11,
    fontWeight: '700',
  },
});
