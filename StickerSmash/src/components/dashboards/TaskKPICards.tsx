import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { Colors, StatusColors, Spacing, Radius, Shadows } from '../../theme';
import { TaskKPIDetailsModal } from './TaskKPIDetailsModal';

interface TaskKPICardsProps {
  style?: any;
}

export const TaskKPICards: React.FC<TaskKPICardsProps> = ({ style }) => {
  const { tasks } = useERP();
  const { currentUser } = useAuth();

  const [modalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'TOTAL' | 'DUE' | 'COMPLETED'>('TOTAL');

  if (!currentUser) return null;

  const isSuperAdminOrAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';

  // Role-based task filtering logic
  const roleFilteredTasks = tasks.filter((t) => {
    if (isSuperAdminOrAdmin) return true;
    return (
      (t.assignedToDepartment && t.assignedToDepartment === currentUser.role) ||
      (t.assignedToUserId && t.assignedToUserId === currentUser.id)
    );
  });

  const totalTasks = roleFilteredTasks.length;
  const dueTasks = roleFilteredTasks.filter((t) => t.status === 'PENDING' || t.status === 'IN_PROGRESS').length;
  const completedTasks = roleFilteredTasks.filter((t) => t.status === 'COMPLETED').length;

  const handleOpenTab = (tab: 'TOTAL' | 'DUE' | 'COMPLETED') => {
    setActiveTab(tab);
    setModalVisible(true);
  };

  return (
    <View style={[styles.container, style]}>
      {/* 1. Total Tasks Card */}
      <TouchableOpacity
        style={[styles.metricCard, { borderLeftColor: StatusColors.PENDING.bg }]}
        onPress={() => handleOpenTab('TOTAL')}
        activeOpacity={0.8}
      >
        <View style={[styles.metricIconBg, { backgroundColor: StatusColors.PENDING.bg }]}>
          <Text style={styles.metricIconText}>📋</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.metricVal}>{totalTasks}</Text>
          <Text style={styles.metricLbl}>Total Tasks</Text>
        </View>
        <Text style={styles.arrowIcon}>➔</Text>
      </TouchableOpacity>

      {/* 2. Due Tasks Card */}
      <TouchableOpacity
        style={[styles.metricCard, { borderLeftColor: StatusColors.IN_PROGRESS.bg }]}
        onPress={() => handleOpenTab('DUE')}
        activeOpacity={0.8}
      >
        <View style={[styles.metricIconBg, { backgroundColor: StatusColors.IN_PROGRESS.bg }]}>
          <Text style={styles.metricIconText}>⏳</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.metricVal}>{dueTasks}</Text>
          <Text style={styles.metricLbl}>Due Tasks</Text>
        </View>
        <Text style={styles.arrowIcon}>➔</Text>
      </TouchableOpacity>

      {/* 3. Tasks Completed Card */}
      <TouchableOpacity
        style={[styles.metricCard, { borderLeftColor: StatusColors.COMPLETED.bg }]}
        onPress={() => handleOpenTab('COMPLETED')}
        activeOpacity={0.8}
      >
        <View style={[styles.metricIconBg, { backgroundColor: StatusColors.COMPLETED.bg }]}>
          <Text style={styles.metricIconText}>✓</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.metricVal}>{completedTasks}</Text>
          <Text style={styles.metricLbl}>Tasks Completed</Text>
        </View>
        <Text style={styles.arrowIcon}>➔</Text>
      </TouchableOpacity>

      {/* Task KPI Details Modal */}
      <TaskKPIDetailsModal
        visible={modalVisible}
        activeTab={activeTab}
        onClose={() => setModalVisible(false)}
        onSelectTab={setActiveTab}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
  arrowIcon: {
    color: Colors.textSubtle,
    fontSize: 12,
  },
});
