import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, StyleSheet, ScrollView } from 'react-native';
import { useERP } from '../context/ERPContext';
import { useAuth } from '../context/AuthContext';
import { Role, Priority, User } from '../types';
import { Colors, Spacing, Radius, Shadows } from '../theme';
import { SearchableDropdown } from './ui/SearchableDropdown';
import { DatePickerInput } from './ui/DatePickerInput';

interface CreateTaskModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ visible, onClose }) => {
  const { orders, createTask } = useERP();
  const { users } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [assignedToDepartment, setAssignedToDepartment] = useState<Role>('PRODUCTION');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [orderId, setOrderId] = useState<string | undefined>(undefined);
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');

  const departments: Role[] = [
    'SALES',
    'PURCHASE',
    'PRODUCTION',
    'QUALITY_TESTING',
    'DISPATCH',
  ];

  const priorities: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

  // Filter users dynamically based on selected department
  const filteredUsers = users.filter((u) => u.role === assignedToDepartment && u.isActive);

  const handleDeptSelect = (dept: Role) => {
    setAssignedToDepartment(dept);
    setSelectedUser(null); // Reset user selection when department changes
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      setError('Task title is required.');
      return;
    }

    createTask({
      title,
      description,
      priority,
      assignedToDepartment,
      assignedToUserId: selectedUser?.id,
      assignedToName: selectedUser?.name,
      orderId,
      dueDate,
    });

    handleClose();
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setPriority('MEDIUM');
    setAssignedToDepartment('PRODUCTION');
    setSelectedUser(null);
    setOrderId(undefined);
    setError('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose}>
        <TouchableOpacity activeOpacity={1} style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>Task Assignment & Delegation</Text>
            <TouchableOpacity onPress={handleClose}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollForm} showsVerticalScrollIndicator={false}>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Text style={styles.label}>Task Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Verify CNC Lathe Machine Tool Sensors"
              placeholderTextColor="#94a3b8"
              value={title}
              onChangeText={setTitle}
            />

            {/* Target Department Dropdown */}
            <SearchableDropdown
              label="1. Select Target Department"
              placeholder="Select department..."
              options={departments.map((d) => ({
                id: d,
                label: d.replace(/_/g, ' '),
              }))}
              selectedValue={assignedToDepartment}
              onSelect={(id) => handleDeptSelect(id as Role)}
            />

            {/* Assign To User Dropdown */}
            <SearchableDropdown
              label="2. Assign To (Department vs Specific User)"
              placeholder="Search or select team member..."
              options={filteredUsers.map((u) => ({
                id: u.id,
                label: u.name,
                sublabel: `Role: ${u.role}`,
              }))}
              selectedValue={selectedUser?.id || ''}
              onSelect={(id) => {
                if (!id) {
                  setSelectedUser(null);
                } else {
                  const u = filteredUsers.find((user) => user.id === id);
                  setSelectedUser(u || null);
                }
              }}
              allowManual={true}
              manualLabel={`🏢 Entire ${assignedToDepartment.replace(/_/g, ' ')} Team`}
              manualId=""
            />

            {/* Link to Order Dropdown */}
            <SearchableDropdown
              label="Link to Order (Optional)"
              placeholder="Search or select order..."
              options={orders.map((o) => ({
                id: o.id,
                label: `Order ${o.orderNumber} (${o.clientCode})`,
                sublabel: `Status: ${o.status}`,
              }))}
              selectedValue={orderId || ''}
              onSelect={(id) => setOrderId(id || undefined)}
              allowManual={true}
              manualLabel="General Task"
              manualId=""
            />

            <Text style={styles.label}>Task Priority</Text>
            <View style={styles.deptGrid}>
              {priorities.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.deptChip, priority === p && styles.deptChipActive]}
                  onPress={() => setPriority(p)}
                >
                  <Text style={[styles.deptChipText, priority === p && styles.deptChipTextActive]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Due Date Picker */}
            <DatePickerInput
              label="Due Date"
              value={dueDate}
              onChangeDate={setDueDate}
              placeholder="YYYY-MM-DD"
            />

            <Text style={styles.label}>Task Description / Instructions</Text>
            <TextInput
              style={[styles.input, { height: 60 }]}
              placeholder="Provide detailed execution guidelines or acceptance criteria..."
              placeholderTextColor="#94a3b8"
              multiline
              value={description}
              onChangeText={setDescription}
            />

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
              <Text style={styles.submitBtnText}>Assign Task</Text>
            </TouchableOpacity>
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
  card: {
    width: '100%',
    maxWidth: 540,
    maxHeight: '90%',
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    ...Shadows.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDark,
    paddingBottom: 8,
  },
  title: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: '800',
  },
  close: {
    color: Colors.accentTeal,
    fontSize: 16,
    fontWeight: '800',
  },
  scrollForm: {
    maxHeight: 520,
  },
  label: {
    color: Colors.accentTeal,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 4,
  },
  input: {
    backgroundColor: Colors.inputBg,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: Colors.textLight,
    fontSize: 13,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  deptGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  deptChip: {
    backgroundColor: Colors.inputBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  deptChipActive: {
    backgroundColor: Colors.accentTeal,
    borderColor: Colors.accentTeal,
  },
  deptChipText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  deptChipTextActive: {
    color: Colors.white,
  },
  userGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  userChip: {
    backgroundColor: Colors.inputBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  userChipActive: {
    backgroundColor: Colors.industrialOrange,
    borderColor: Colors.industrialOrange,
  },
  userChipText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  userChipTextActive: {
    color: Colors.white,
  },
  orderGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  orderChip: {
    backgroundColor: Colors.inputBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  orderChipActive: {
    backgroundColor: Colors.accentTeal,
    borderColor: Colors.accentTeal,
  },
  orderChipText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  orderChipTextActive: {
    color: Colors.white,
  },
  submitBtn: {
    backgroundColor: Colors.industrialOrange,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 10,
    ...Shadows.glowOrange,
  },
  submitBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginBottom: 6,
  },
});
