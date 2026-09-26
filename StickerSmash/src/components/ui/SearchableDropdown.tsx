import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, ScrollView, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, Shadows } from '../../theme';

export interface DropdownOption {
  id: string;
  label: string;
  sublabel?: string;
  code?: string;
  icon?: string;
}

interface SearchableDropdownProps {
  label?: string;
  placeholder?: string;
  options: DropdownOption[];
  selectedValue?: string;
  onSelect?: (id: string) => void;

  isMulti?: boolean;
  selectedValues?: string[];
  onMultiSelect?: (ids: string[]) => void;

  allowManual?: boolean;
  manualLabel?: string;
  manualId?: string;

  required?: boolean;
  disabled?: boolean;
}

export const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  label,
  placeholder = 'Select an option...',
  options,
  selectedValue,
  onSelect,
  isMulti = false,
  selectedValues = [],
  onMultiSelect,
  allowManual = false,
  manualLabel = '+ Manual / New Item',
  manualId = '',
  required = false,
  disabled = false,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Find currently selected option for single-select display
  const selectedOption = options.find((o) => o.id === selectedValue);

  // Filter options based on search query
  const filteredOptions = options.filter((o) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      o.label.toLowerCase().includes(q) ||
      (o.code && o.code.toLowerCase().includes(q)) ||
      (o.sublabel && o.sublabel.toLowerCase().includes(q))
    );
  });

  const handleSelectSingle = (id: string) => {
    if (onSelect) {
      onSelect(id);
    }
    setModalVisible(false);
    setSearchQuery('');
  };

  const handleToggleMulti = (id: string) => {
    if (!onMultiSelect) return;
    if (selectedValues.includes(id)) {
      onMultiSelect(selectedValues.filter((v) => v !== id));
    } else {
      onMultiSelect([...selectedValues, id]);
    }
  };

  const renderTriggerText = () => {
    if (isMulti) {
      if (selectedValues.length === 0) return placeholder;
      const selectedLabels = options
        .filter((o) => selectedValues.includes(o.id))
        .map((o) => o.label);
      return `${selectedValues.length} Selected (${selectedLabels.join(', ')})`;
    }

    if (selectedValue === manualId && allowManual) {
      return manualLabel;
    }

    if (selectedOption) {
      return selectedOption.code
        ? `${selectedOption.code} - ${selectedOption.label}`
        : selectedOption.label;
    }

    return placeholder;
  };

  return (
    <View style={styles.container}>
      {label ? (
        <Text style={styles.label}>
          {label} {required ? '*' : ''}
        </Text>
      ) : null}

      <TouchableOpacity
        style={[
          styles.triggerBtn,
          disabled && styles.disabledBtn,
          modalVisible && styles.triggerBtnActive,
        ]}
        onPress={() => !disabled && setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.triggerText,
            !selectedValue && (!selectedValues || selectedValues.length === 0) && styles.placeholderText,
          ]}
          numberOfLines={1}
        >
          {renderTriggerText()}
        </Text>

        <View style={styles.iconBox}>
          <Text style={styles.dropdownArrow}>▼</Text>
        </View>
      </TouchableOpacity>

      {/* Popover Selection Modal */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label || 'Select Item'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Typeahead Search Input */}
            <View style={styles.searchBox}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Type to search..."
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Text style={styles.clearSearch}>✕</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
              {/* Optional Manual Entry option */}
              {allowManual && (
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    !isMulti && selectedValue === manualId && styles.optionItemActive,
                  ]}
                  onPress={() => handleSelectSingle(manualId)}
                >
                  <Text
                    style={[
                      styles.optionLabelBold,
                      !isMulti && selectedValue === manualId && styles.optionLabelActive,
                      { color: Colors.roles.SALES },
                    ]}
                  >
                    {manualLabel}
                  </Text>
                </TouchableOpacity>
              )}

              {filteredOptions.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>No matching options found.</Text>
                </View>
              ) : (
                filteredOptions.map((item) => {
                  const isSelected = isMulti
                    ? selectedValues.includes(item.id)
                    : selectedValue === item.id;

                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.optionItem, isSelected && styles.optionItemActive]}
                      onPress={() =>
                        isMulti ? handleToggleMulti(item.id) : handleSelectSingle(item.id)
                      }
                    >
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          {item.icon ? <Text>{item.icon}</Text> : null}
                          {item.code ? (
                            <View style={styles.codeTag}>
                              <Text style={styles.codeTagText}>{item.code}</Text>
                            </View>
                          ) : null}
                          <Text
                            style={[
                              styles.optionLabel,
                              isSelected && styles.optionLabelActive,
                            ]}
                          >
                            {item.label}
                          </Text>
                        </View>

                        {item.sublabel ? (
                          <Text style={styles.optionSub}>{item.sublabel}</Text>
                        ) : null}
                      </View>

                      {isSelected ? (
                        <Text style={styles.checkIcon}>✓</Text>
                      ) : isMulti ? (
                        <Text style={styles.plusIcon}>+</Text>
                      ) : null}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>

            {isMulti && (
              <TouchableOpacity
                style={styles.doneBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.doneBtnText}>Confirm Selection ({selectedValues.length})</Text>
              </TouchableOpacity>
            )}
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
    justifyContent: 'space-between',
  },
  triggerBtnActive: {
    borderColor: Colors.accentTeal,
    backgroundColor: Colors.cardBg,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  triggerText: {
    color: Colors.textLight,
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    paddingRight: 6,
  },
  placeholderText: {
    color: '#94a3b8',
    fontWeight: '500',
  },
  iconBox: {
    paddingLeft: 4,
  },
  dropdownArrow: {
    fontSize: 10,
    color: Colors.textSubtle,
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
    maxWidth: 500,
    maxHeight: '80%',
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
    fontSize: 15,
    fontWeight: '800',
  },
  closeBtn: {
    color: Colors.textSubtle,
    fontSize: 18,
    fontWeight: '700',
    padding: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    marginBottom: Spacing.sm,
  },
  searchIcon: {
    fontSize: 13,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    color: Colors.textLight,
    fontSize: 13,
  },
  clearSearch: {
    color: Colors.textSubtle,
    fontSize: 14,
    paddingHorizontal: 4,
  },
  optionsList: {
    flex: 1,
  },
  emptyBox: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textSubtle,
    fontSize: 12,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionItemActive: {
    backgroundColor: 'rgba(41, 88, 92, 0.08)',
    borderColor: Colors.accentTeal,
  },
  optionLabel: {
    color: Colors.textLight,
    fontSize: 13,
    fontWeight: '700',
  },
  optionLabelBold: {
    fontSize: 13,
    fontWeight: '800',
  },
  optionLabelActive: {
    color: Colors.accentTeal,
  },
  optionSub: {
    color: Colors.textSubtle,
    fontSize: 11,
    marginTop: 2,
  },
  codeTag: {
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.xs,
  },
  codeTagText: {
    color: Colors.roles.SALES,
    fontSize: 10,
    fontWeight: '800',
  },
  checkIcon: {
    color: Colors.status.COMPLETED.bg,
    fontSize: 14,
    fontWeight: '800',
  },
  plusIcon: {
    color: Colors.textSubtle,
    fontSize: 14,
    fontWeight: '700',
  },
  doneBtn: {
    backgroundColor: Colors.accentTeal,
    paddingVertical: 10,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  doneBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
});
