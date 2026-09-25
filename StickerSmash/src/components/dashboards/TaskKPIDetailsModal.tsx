import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, TextInput, StyleSheet } from 'react-native';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { Task, Priority } from '../../types';
import { Colors, Spacing, Radius, Shadows } from '../../theme';

interface TaskKPIDetailsModalProps {
  visible: boolean;
  activeTab: 'TOTAL' | 'DUE' | 'COMPLETED';
  onClose: () => void;
  onSelectTab: (tab: 'TOTAL' | 'DUE' | 'COMPLETED') => void;
}

export const TaskKPIDetailsModal: React.FC<TaskKPIDetailsModalProps> = ({
  visible,
  activeTab,
  onClose,
  onSelectTab,
}) => {
  const { tasks } = useERP();
  const { currentUser } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  if (!currentUser) return null;

  const isSuperAdminOrAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';

  // Role-based task filtering
  const roleFilteredTasks = tasks.filter((t) => {
    if (isSuperAdminOrAdmin) return true;
    return (
      (t.assignedToDepartment && t.assignedToDepartment === currentUser.role) ||
      (t.assignedToUserId && t.assignedToUserId === currentUser.id)
    );
  });

  const todayStr = new Date().toISOString().split('T')[0];

  // Derive counts for tabs
  const totalCount = roleFilteredTasks.length;
  const dueCount = roleFilteredTasks.filter((t) => t.status === 'PENDING' || t.status === 'IN_PROGRESS').length;
  const completedCount = roleFilteredTasks.filter((t) => t.status === 'COMPLETED').length;

  // Filter tasks based on search, status, and priority (for Total Tasks View)
  const applyFilters = (taskList: Task[]) => {
    return taskList.filter((t) => {
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesUser = (t.assignedToName || '').toLowerCase().includes(q);
        const matchesDept = (t.assignedToDepartment || '').toLowerCase().includes(q);
        const matchesPriority = t.priority.toLowerCase().includes(q);
        const matchesStatus = t.status.toLowerCase().includes(q);
        return matchesTitle || matchesUser || matchesDept || matchesPriority || matchesStatus;
      }
      return true;
    });
  };

  const getPriorityColor = (p: Priority) => {
    switch (p) {
      case 'URGENT':
        return '#ef4444';
      case 'HIGH':
        return '#f97316';
      case 'MEDIUM':
        return '#3b82f6';
      case 'LOW':
        return '#10b981';
      default:
        return Colors.accentTeal;
    }
  };

  const getDueDateStatus = (dueDateStr?: string) => {
    if (!dueDateStr) return 'UPCOMING';
    if (dueDateStr < todayStr) return 'OVERDUE';
    if (dueDateStr === todayStr) return 'DUE_TODAY';
    return 'UPCOMING';
  };

  const renderTotalTasksContent = () => {
    const list = applyFilters(roleFilteredTasks);

    return (
      <View style={{ flex: 1 }}>
        {/* Search & Filter Bar */}
        <View style={styles.filterCard}>
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by title, assigned user, department, priority..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.clearSearch}>✕</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Status & Priority Filter Chips */}
          <View style={styles.filterChipRow}>
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Status:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED'].map((st) => (
                  <TouchableOpacity
                    key={st}
                    style={[styles.chip, statusFilter === st && styles.chipActive]}
                    onPress={() => setStatusFilter(st)}
                  >
                    <Text style={[styles.chipText, statusFilter === st && styles.chipTextActive]}>
                      {st.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={styles.filterChipRow}>
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Priority:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {['ALL', 'LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((pr) => (
                  <TouchableOpacity
                    key={pr}
                    style={[styles.chip, priorityFilter === pr && styles.chipActive]}
                    onPress={() => setPriorityFilter(pr)}
                  >
                    <Text style={[styles.chipText, priorityFilter === pr && styles.chipTextActive]}>
                      {pr}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>

        {/* Task List */}
        <ScrollView style={styles.listScroll} showsVerticalScrollIndicator={false}>
          {list.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No tasks found matching your filters.</Text>
            </View>
          ) : (
            list.map((t) => {
              const pColor = getPriorityColor(t.priority);
              const deptName = t.assignedToDepartment ? t.assignedToDepartment.replace(/_/g, ' ') : 'General';
              return (
                <View key={t.id} style={styles.taskCard}>
                  <View style={styles.taskCardTop}>
                    <Text style={styles.taskTitle}>{t.title}</Text>
                    <View style={[styles.priorityBadge, { backgroundColor: pColor }]}>
                      <Text style={styles.priorityBadgeText}>{t.priority}</Text>
                    </View>
                  </View>

                  {t.description ? <Text style={styles.taskDesc}>{t.description}</Text> : null}

                  <View style={styles.taskMetaRow}>
                    <Text style={styles.metaItem}>
                      🏢 Dept: <Text style={styles.metaVal}>{deptName}</Text>
                    </Text>
                    <Text style={styles.metaItem}>
                      👤 Assigned: <Text style={styles.metaVal}>{t.assignedToName || 'Entire Team'}</Text>
                    </Text>
                    <Text style={styles.metaItem}>
                      📅 Due: <Text style={styles.metaVal}>{t.dueDate || 'N/A'}</Text>
                    </Text>
                  </View>

                  <View style={styles.taskFooterRow}>
                    <View style={[styles.statusTag, { backgroundColor: t.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)', borderColor: t.status === 'COMPLETED' ? Colors.successBright : Colors.accentTeal }]}>
                      <Text style={[styles.statusTagText, { color: t.status === 'COMPLETED' ? Colors.successBright : Colors.accentTeal }]}>
                        {t.status.replace('_', ' ')}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    );
  };

  const renderDueTasksContent = () => {
    const dueTasksList = roleFilteredTasks.filter((t) => t.status === 'PENDING' || t.status === 'IN_PROGRESS');

    const overdueTasks = dueTasksList.filter((t) => getDueDateStatus(t.dueDate) === 'OVERDUE');
    const dueTodayTasks = dueTasksList.filter((t) => getDueDateStatus(t.dueDate) === 'DUE_TODAY');
    const upcomingTasks = dueTasksList.filter((t) => getDueDateStatus(t.dueDate) === 'UPCOMING');

    return (
      <ScrollView style={styles.listScroll} showsVerticalScrollIndicator={false}>
        {/* Section 1: Overdue Tasks (Red Highlight) */}
        <View style={styles.dueSection}>
          <View style={styles.dueSectionHeader}>
            <Text style={[styles.dueSectionTitle, { color: '#ef4444' }]}>
              🚨 Overdue Tasks ({overdueTasks.length})
            </Text>
            <View style={[styles.badgePill, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: '#ef4444' }]}>
              <Text style={{ color: '#ef4444', fontSize: 10, fontWeight: '800' }}>HIGH PRIORITY ACTION</Text>
            </View>
          </View>

          {overdueTasks.length === 0 ? (
            <Text style={styles.noSectionText}>✓ No overdue tasks.</Text>
          ) : (
            overdueTasks.map((t) => (
              <View key={t.id} style={[styles.taskCard, { borderLeftWidth: 4, borderLeftColor: '#ef4444' }]}>
                <View style={styles.taskCardTop}>
                  <Text style={styles.taskTitle}>{t.title}</Text>
                  <View style={[styles.dateBadge, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
                    <Text style={{ color: '#ef4444', fontSize: 11, fontWeight: '800' }}>📅 {t.dueDate} (Overdue)</Text>
                  </View>
                </View>
                <Text style={styles.metaItem}>👤 Assigned: <Text style={styles.metaVal}>{t.assignedToName || t.assignedToDepartment || 'Team'}</Text></Text>
                <Text style={styles.metaItem}>Status: <Text style={styles.metaVal}>{t.status.replace('_', ' ')}</Text></Text>
              </View>
            ))
          )}
        </View>

        {/* Section 2: Due Today Tasks (Yellow Highlight) */}
        <View style={styles.dueSection}>
          <View style={styles.dueSectionHeader}>
            <Text style={[styles.dueSectionTitle, { color: '#f59e0b' }]}>
              ⏳ Due Today ({dueTodayTasks.length})
            </Text>
            <View style={[styles.badgePill, { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: '#f59e0b' }]}>
              <Text style={{ color: '#f59e0b', fontSize: 10, fontWeight: '800' }}>DUE BY TODAY EOD</Text>
            </View>
          </View>

          {dueTodayTasks.length === 0 ? (
            <Text style={styles.noSectionText}>No tasks due today.</Text>
          ) : (
            dueTodayTasks.map((t) => (
              <View key={t.id} style={[styles.taskCard, { borderLeftWidth: 4, borderLeftColor: '#f59e0b' }]}>
                <View style={styles.taskCardTop}>
                  <Text style={styles.taskTitle}>{t.title}</Text>
                  <View style={[styles.dateBadge, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
                    <Text style={{ color: '#f59e0b', fontSize: 11, fontWeight: '800' }}>📅 TODAY ({t.dueDate})</Text>
                  </View>
                </View>
                <Text style={styles.metaItem}>👤 Assigned: <Text style={styles.metaVal}>{t.assignedToName || t.assignedToDepartment || 'Team'}</Text></Text>
                <Text style={styles.metaItem}>Status: <Text style={styles.metaVal}>{t.status.replace('_', ' ')}</Text></Text>
              </View>
            ))
          )}
        </View>

        {/* Section 3: Upcoming Due Tasks (Green Highlight) */}
        <View style={styles.dueSection}>
          <View style={styles.dueSectionHeader}>
            <Text style={[styles.dueSectionTitle, { color: '#10b981' }]}>
              🟢 Upcoming Due Tasks ({upcomingTasks.length})
            </Text>
          </View>

          {upcomingTasks.length === 0 ? (
            <Text style={styles.noSectionText}>No upcoming tasks scheduled.</Text>
          ) : (
            upcomingTasks.map((t) => (
              <View key={t.id} style={[styles.taskCard, { borderLeftWidth: 4, borderLeftColor: '#10b981' }]}>
                <View style={styles.taskCardTop}>
                  <Text style={styles.taskTitle}>{t.title}</Text>
                  <View style={[styles.dateBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                    <Text style={{ color: '#10b981', fontSize: 11, fontWeight: '800' }}>📅 {t.dueDate}</Text>
                  </View>
                </View>
                <Text style={styles.metaItem}>👤 Assigned: <Text style={styles.metaVal}>{t.assignedToName || t.assignedToDepartment || 'Team'}</Text></Text>
                <Text style={styles.metaItem}>Status: <Text style={styles.metaVal}>{t.status.replace('_', ' ')}</Text></Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    );
  };

  const renderTasksCompletedContent = () => {
    const completedList = roleFilteredTasks.filter((t) => t.status === 'COMPLETED');

    return (
      <ScrollView style={styles.listScroll} showsVerticalScrollIndicator={false}>
        {completedList.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No completed tasks recorded yet.</Text>
          </View>
        ) : (
          completedList.map((t) => {
            const deptName = t.assignedToDepartment ? t.assignedToDepartment.replace(/_/g, ' ') : 'General';
            return (
              <View key={t.id} style={[styles.taskCard, { borderLeftWidth: 4, borderLeftColor: Colors.successBright }]}>
                <View style={styles.taskCardTop}>
                  <Text style={styles.taskTitle}>{t.title}</Text>
                  <View style={[styles.dateBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                    <Text style={{ color: Colors.successBright, fontSize: 11, fontWeight: '800' }}>✓ COMPLETED</Text>
                  </View>
                </View>

                {t.description ? <Text style={styles.taskDesc}>{t.description}</Text> : null}

                <View style={styles.taskMetaRow}>
                  <Text style={styles.metaItem}>
                    🏢 Dept: <Text style={styles.metaVal}>{deptName}</Text>
                  </Text>
                  <Text style={styles.metaItem}>
                    👤 Completed By: <Text style={styles.metaVal}>{t.assignedToName || 'Team User'}</Text>
                  </Text>
                  <Text style={styles.metaItem}>
                    📅 Timestamp: <Text style={styles.metaVal}>{t.dueDate || 'Recently'}</Text>
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.modalTitle}>
                📋 Task Metrics & Performance Analytics
              </Text>
              <Text style={styles.modalSub}>
                Role View: <Text style={{ color: Colors.accentTeal, fontWeight: '800' }}>{currentUser.role}</Text>{' '}
                ({isSuperAdminOrAdmin ? 'All Department Tasks' : `${currentUser.role} Department Scope`})
              </Text>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Navigation Tabs */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'TOTAL' && styles.tabBtnActive]}
              onPress={() => onSelectTab('TOTAL')}
            >
              <Text style={[styles.tabText, activeTab === 'TOTAL' && styles.tabTextActive]}>
                📋 Total Tasks ({totalCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'DUE' && styles.tabBtnActiveDue]}
              onPress={() => onSelectTab('DUE')}
            >
              <Text style={[styles.tabText, activeTab === 'DUE' && styles.tabTextActive]}>
                ⏳ Due Tasks ({dueCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'COMPLETED' && styles.tabBtnActiveDone]}
              onPress={() => onSelectTab('COMPLETED')}
            >
              <Text style={[styles.tabText, activeTab === 'COMPLETED' && styles.tabTextActive]}>
                ✓ Completed ({completedCount})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Body Content Based on Active Tab */}
          <View style={styles.modalBody}>
            {activeTab === 'TOTAL' && renderTotalTasksContent()}
            {activeTab === 'DUE' && renderDueTasksContent()}
            {activeTab === 'COMPLETED' && renderTasksCompletedContent()}
          </View>
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
  modalCard: {
    width: '100%',
    maxWidth: 720,
    maxHeight: '88%',
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    ...Shadows.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDark,
    paddingBottom: Spacing.xs,
  },
  modalTitle: {
    color: Colors.textLight,
    fontSize: 17,
    fontWeight: '800',
  },
  modalSub: {
    color: Colors.textSubtle,
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    backgroundColor: Colors.inputBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  closeBtnText: {
    color: Colors.accentTeal,
    fontSize: 14,
    fontWeight: '800',
  },
  tabRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  tabBtn: {
    flex: 1,
    backgroundColor: Colors.inputBg,
    paddingVertical: 9,
    borderRadius: Radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  tabBtnActive: {
    backgroundColor: Colors.accentTeal,
    borderColor: Colors.accentTeal,
  },
  tabBtnActiveDue: {
    backgroundColor: Colors.roles.SALES,
    borderColor: Colors.roles.SALES,
  },
  tabBtnActiveDone: {
    backgroundColor: Colors.status.COMPLETED.bg,
    borderColor: Colors.status.COMPLETED.bg,
  },
  tabText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  tabTextActive: {
    color: Colors.white,
    fontWeight: '800',
  },
  modalBody: {
    flex: 1,
  },
  filterCard: {
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    gap: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  searchIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    color: Colors.textLight,
    fontSize: 12,
  },
  clearSearch: {
    color: Colors.textSubtle,
    fontSize: 12,
  },
  filterChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterLabel: {
    color: Colors.textSubtle,
    fontSize: 11,
    fontWeight: '700',
    width: 55,
  },
  chip: {
    backgroundColor: Colors.cardBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.xs,
    marginRight: 4,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  chipActive: {
    backgroundColor: Colors.accentTeal,
    borderColor: Colors.accentTeal,
  },
  chipText: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  chipTextActive: {
    color: Colors.white,
    fontWeight: '800',
  },
  listScroll: {
    flex: 1,
  },
  emptyBox: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textSubtle,
    fontSize: 13,
  },
  taskCard: {
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    gap: 4,
  },
  taskCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskTitle: {
    color: Colors.textLight,
    fontSize: 13,
    fontWeight: '800',
    flex: 1,
    paddingRight: 6,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  priorityBadgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '800',
  },
  taskDesc: {
    color: Colors.textMuted,
    fontSize: 11,
    marginVertical: 2,
  },
  taskMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 4,
  },
  metaItem: {
    color: Colors.textSubtle,
    fontSize: 11,
  },
  metaVal: {
    color: Colors.textLight,
    fontWeight: '700',
  },
  taskFooterRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.xs,
    borderWidth: 1,
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  dueSection: {
    marginBottom: Spacing.lg,
  },
  dueSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  dueSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  noSectionText: {
    color: Colors.textSubtle,
    fontSize: 12,
    fontStyle: 'italic',
    marginVertical: 4,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.xs,
    borderWidth: 1,
  },
  dateBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
});
