import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, useWindowDimensions } from 'react-native';
import { useERP } from '../context/ERPContext';
import { useAuth } from '../context/AuthContext';
import { TaskStatus, Role, Priority, Task } from '../types';
import { Colors, StatusColors, Spacing, Radius, Shadows } from '../theme';
import { ExportButton } from './ui/ExportButton';
import { ExportDataPayload } from '../utils/exportUtils';

interface TaskManagementProps {
  onOpenCreateTask: () => void;
}

type TaskViewFilter = 'ALL' | 'MY_TASKS' | 'DEPT_TASKS' | 'ASSIGNED_BY_ME';
type StatusFilter = 'ALL' | TaskStatus | 'OVERDUE';

export const TaskManagement: React.FC<TaskManagementProps> = ({ onOpenCreateTask }) => {
  const { tasks, updateTaskStatus, deleteTask } = useERP();
  const { currentUser, users } = useAuth();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [viewFilter, setViewFilter] = useState<TaskViewFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [error, setError] = useState('');
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});

  const toggleExpandTask = (id: string) => {
    setExpandedTasks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (!currentUser) return null;

  const isSuperAdminOrAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';
  const todayStr = new Date().toISOString().split('T')[0];

  // Step 1: All tasks are visible to everyone
  const accessibleTasks = tasks;

  // Helper to determine if current user is authorized to update a specific task's status
  const canUpdateTaskStatus = (task: Task): boolean => {
    if (isSuperAdminOrAdmin) return true;
    if (task.createdByUserId === currentUser.id || task.createdByName === currentUser.name) return true;
    if (task.assignedToUserId && task.assignedToUserId === currentUser.id) return true;
    if (task.assignedToName && currentUser.name && task.assignedToName.toLowerCase() === currentUser.name.toLowerCase()) return true;
    if (task.assignedToDepartment === currentUser.role) {
      if (!task.assignedToUserId || task.assignedToUserId === currentUser.id) return true;
    }
    return false;
  };

  // Step 2: Apply User Tab Filters (My Tasks, Department Tasks, Assigned By Me)
  let filteredTasks = accessibleTasks.filter((task) => {
    if (viewFilter === 'MY_TASKS') {
      return (
        task.assignedToUserId === currentUser.id ||
        (task.assignedToName && currentUser.name && task.assignedToName.toLowerCase() === currentUser.name.toLowerCase())
      );
    }
    if (viewFilter === 'DEPT_TASKS') {
      return task.assignedToDepartment === currentUser.role;
    }
    if (viewFilter === 'ASSIGNED_BY_ME') {
      return task.createdByUserId === currentUser.id || task.createdByName === currentUser.name;
    }
    return true;
  });

  // Step 3: Apply Status & Overdue Filters
  if (statusFilter !== 'ALL') {
    if (statusFilter === 'OVERDUE') {
      filteredTasks = filteredTasks.filter(
        (t) => t.dueDate && t.dueDate < todayStr && t.status !== 'COMPLETED'
      );
    } else {
      filteredTasks = filteredTasks.filter((t) => t.status === statusFilter);
    }
  }

  // Step 4: Apply Department & Priority Filters (For Admins / Oversights)
  if (deptFilter !== 'ALL') {
    filteredTasks = filteredTasks.filter((t) => t.assignedToDepartment === deptFilter);
  }
  if (priorityFilter !== 'ALL') {
    filteredTasks = filteredTasks.filter((t) => t.priority === priorityFilter);
  }

  // Step 5: Search Query Filter
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    filteredTasks = filteredTasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.orderNumber && t.orderNumber.toLowerCase().includes(q)) ||
        (t.assignedToName && t.assignedToName.toLowerCase().includes(q))
    );
  }

  const handleDelete = (taskId: string) => {
    setError('');
    try {
      deleteTask(taskId);
    } catch (err: any) {
      setError(err.message || 'Permission denied');
    }
  };

  const handleMarkAllComplete = () => {
    filteredTasks.forEach(task => {
      if (task.status !== 'COMPLETED') {
        updateTaskStatus(task.id, 'COMPLETED');
      }
    });
  };

  const getPriorityStyle = (p: string) => {
    switch (p) {
      case 'URGENT':
        return { bg: '#ef4444', text: '#fff' };
      case 'HIGH':
        return { bg: '#f97316', text: '#fff' };
      case 'MEDIUM':
        return { bg: '#eab308', text: '#000' };
      default:
        return { bg: '#64748b', text: '#fff' };
    }
  };

  const getStatusBadge = (s: TaskStatus) => {
    switch (s) {
      case 'COMPLETED':
        return { bg: StatusColors.COMPLETED.bg, text: StatusColors.COMPLETED.text, border: StatusColors.COMPLETED.border, label: 'COMPLETED' };
      case 'IN_PROGRESS':
        return { bg: StatusColors.IN_PROGRESS.bg, text: StatusColors.IN_PROGRESS.text, border: StatusColors.IN_PROGRESS.border, label: 'IN PROGRESS' };
      default:
        return { bg: StatusColors.PENDING.bg, text: StatusColors.PENDING.text, border: StatusColors.PENDING.border, label: 'PENDING' };
    }
  };

  const getTaskExportPayload = (): ExportDataPayload => {
    return {
      title: `Task Management Report (${viewFilter})`,
      filename: 'Tasks_Management_Report',
      headers: ['Task Title', 'Order Ref', 'Assigned User', 'Department', 'Priority', 'Status', 'Created By', 'Due Date'],
      rows: filteredTasks.map((t) => [
        t.title,
        t.orderNumber || 'N/A',
        t.assignedToName || 'Unassigned',
        t.assignedToDepartment || 'N/A',
        t.priority,
        t.status,
        t.createdByName,
        t.dueDate || 'N/A',
      ]),
    };
  };

  return (
    <View style={styles.card}>
      {/* Header & Quick Action */}
      <View style={[styles.header, isMobile && styles.headerMobile]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Task Management & Work Delegation</Text>
          <Text style={styles.subTitle}>
            {isSuperAdminOrAdmin
              ? 'Super Admin Oversight: View, filter, and assign cross-team & user-level tasks.'
              : `Department Dashboard: Viewing tasks for ${currentUser.name} (${currentUser.role.replace(/_/g, ' ')})`}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <TouchableOpacity style={styles.exportBtn} onPress={handleMarkAllComplete}>
            <Text style={styles.exportBtnText}>✓ Mark All Complete</Text>
          </TouchableOpacity>
          <ExportButton getData={getTaskExportPayload} buttonText="Export Tasks" />
          <TouchableOpacity style={styles.createBtn} onPress={onOpenCreateTask}>
            <Text style={styles.createBtnText}>+ Assign New Task</Text>
          </TouchableOpacity>
        </View>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      ) : null}

      {/* Main Filter Bar: Category Tabs */}
      <View style={[styles.filterRow, isMobile && styles.filterRowMobile]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ width: '100%' }}>
          <View style={styles.tabGroup}>
            {(['ALL', 'MY_TASKS', 'DEPT_TASKS', 'ASSIGNED_BY_ME'] as TaskViewFilter[]).map((tf) => {
              const labels: Record<TaskViewFilter, string> = {
                ALL: 'All Accessible',
                MY_TASKS: 'My Tasks',
                DEPT_TASKS: 'Department Tasks',
                ASSIGNED_BY_ME: 'Assigned By Me',
              };
              const isActive = viewFilter === tf;
              return (
                <TouchableOpacity
                  key={tf}
                  style={[styles.filterTab, isActive && styles.filterTabActive]}
                  onPress={() => setViewFilter(tf)}
                >
                  <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                    {labels[tf]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Search Field */}
        <TextInput
          style={[styles.searchInput, isMobile && { width: '100%' }]}
          placeholder="🔍 Search tasks, orders, assignees..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Status & Oversight Filters */}
      <View style={[styles.secondaryFilterRow, isMobile && { width: '100%' }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ width: '100%' }}>
          <View style={styles.chipsScroll}>
            <Text style={styles.filterLabelText}>Status:</Text>
            {(['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE'] as StatusFilter[]).map((sf) => (
              <TouchableOpacity
                key={sf}
                style={[styles.chip, statusFilter === sf && styles.chipActive]}
                onPress={() => setStatusFilter(sf)}
              >
                <Text style={[styles.chipText, statusFilter === sf && styles.chipTextActive]}>
                  {sf.replace(/_/g, ' ')}
                </Text>
              </TouchableOpacity>
            ))}

            {isSuperAdminOrAdmin && (
              <>
                <View style={styles.vDivider} />
                <Text style={styles.filterLabelText}>Department:</Text>
                {['ALL', 'SALES', 'PURCHASE', 'PRODUCTION', 'QUALITY_TESTING', 'DISPATCH'].map((dept) => (
                  <TouchableOpacity
                    key={dept}
                    style={[styles.chip, deptFilter === dept && styles.chipActive]}
                    onPress={() => setDeptFilter(dept)}
                  >
                    <Text style={[styles.chipText, deptFilter === dept && styles.chipTextActive]}>
                      {dept.replace(/_/g, ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </View>
        </ScrollView>
      </View>

      {/* Task List Table / Mobile Cards */}
      {isMobile ? (
        <View style={{ gap: Spacing.xs, marginTop: Spacing.sm }}>
          {filteredTasks.length === 0 ? (
            <Text style={styles.emptyText}>No tasks found matching the selected filters.</Text>
          ) : (
            filteredTasks.map((task) => {
              const pStyle = getPriorityStyle(task.priority);
              const sBadge = getStatusBadge(task.status);
              const isOverdue = task.dueDate && task.dueDate < todayStr && task.status !== 'COMPLETED';
              const isExpanded = !!expandedTasks[task.id];

              return (
                <View key={task.id} style={styles.mobileCard}>
                  <TouchableOpacity
                    style={styles.mobileCardHeader}
                    onPress={() => toggleExpandTask(task.id)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1, gap: 6 }}>
                      {/* Top Badges & Expand Row */}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <View style={[styles.priorityBadge, { backgroundColor: pStyle.bg }]}>
                            <Text style={[styles.priorityBadgeText, { color: pStyle.text }]}>{task.priority}</Text>
                          </View>
                          <View style={[styles.statusChip, { backgroundColor: sBadge.bg, borderColor: sBadge.border }]}>
                            <Text style={[styles.statusChipText, { color: sBadge.text, fontWeight: '800' }]}>
                              {sBadge.label}
                            </Text>
                          </View>
                        </View>
                        <Text style={{ color: Colors.textMuted, fontSize: 14 }}>{isExpanded ? '▲' : '▼'}</Text>
                      </View>

                      {/* Full Width Title */}
                      <Text style={styles.mobileCardTitle}>{task.title}</Text>

                      {/* Subtitle */}
                      <Text style={styles.mobileCardSubtitle}>
                        Assigned to: {task.assignedToName || (task.assignedToDepartment ? `${task.assignedToDepartment} Team` : 'All Depts')}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.mobileCardBody}>
                      {task.description ? <Text style={styles.mobileCardDetail}>Description: <Text style={styles.mobileCardVal}>{task.description}</Text></Text> : null}
                      <Text style={styles.mobileCardDetail}>Order Ref: <Text style={styles.mobileCardVal}>{task.orderNumber || 'General'}</Text></Text>
                      <Text style={styles.mobileCardDetail}>Due Date: <Text style={[styles.mobileCardVal, isOverdue && styles.overdueText]}>{task.dueDate || 'N/A'}</Text></Text>
                      <Text style={styles.mobileCardDetail}>Created By: <Text style={styles.mobileCardVal}>{task.createdByName} ({task.createdByRole.replace(/_/g, ' ')})</Text></Text>

                      {/* Status Toggle Row */}
                      <View style={{ marginTop: Spacing.xs }}>
                        <Text style={[styles.mobileCardDetail, { marginBottom: 4, fontWeight: '700' }]}>
                          {canUpdateTaskStatus(task) ? 'Update Task Status:' : 'Task Status (Read Only):'}
                        </Text>
                        {canUpdateTaskStatus(task) ? (
                          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                            {(['PENDING', 'IN_PROGRESS', 'COMPLETED'] as TaskStatus[]).map((st) => {
                              const active = task.status === st;
                              const badge = getStatusBadge(st);
                              return (
                                <TouchableOpacity
                                  key={st}
                                  style={[
                                    styles.statusChip,
                                    active && { backgroundColor: badge.bg, borderColor: badge.border },
                                  ]}
                                  onPress={() => updateTaskStatus(task.id, st)}
                                >
                                  <Text style={[styles.statusChipText, active && { color: badge.text, fontWeight: '800' }]}>
                                    {st === 'IN_PROGRESS' ? 'IN PROG' : st}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                            {isSuperAdminOrAdmin && (
                              <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(task.id)}>
                                <Text style={styles.deleteBtnText}>Delete Task</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        ) : (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <View style={[styles.statusChip, { backgroundColor: sBadge.bg, borderColor: sBadge.border }]}>
                              <Text style={[styles.statusChipText, { color: sBadge.text, fontWeight: '800' }]}>
                                {sBadge.label}
                              </Text>
                            </View>
                            <Text style={{ fontSize: 12, color: Colors.textMuted }}>
                              🔒 Assigned to {task.assignedToName || (task.assignedToDepartment ? `${task.assignedToDepartment} Team` : 'Other Team')}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.th, { width: 220 }]}>Task Title & Details</Text>
              <Text style={[styles.th, { width: 170 }]}>Assigned Target</Text>
              <Text style={[styles.th, { width: 110 }]}>Order Ref</Text>
              <Text style={[styles.th, { width: 85 }]}>Priority</Text>
              <Text style={[styles.th, { width: 100 }]}>Due Date</Text>
              <Text style={[styles.th, { width: 210 }]}>Status (Click to Update)</Text>
              <Text style={[styles.th, { width: 95 }]}>Actions</Text>
            </View>

            {/* Table Body */}
            {filteredTasks.length === 0 ? (
              <Text style={styles.emptyText}>No tasks found matching the selected filters.</Text>
            ) : (
              filteredTasks.map((task) => {
                const pStyle = getPriorityStyle(task.priority);
                const sBadge = getStatusBadge(task.status);
                const isOverdue = task.dueDate && task.dueDate < todayStr && task.status !== 'COMPLETED';

                return (
                  <View key={task.id} style={styles.tr}>
                    {/* Title & Creator */}
                    <View style={{ width: 220 }}>
                      <Text style={styles.tdTitle}>{task.title}</Text>
                      {task.description ? <Text style={styles.tdDesc}>{task.description}</Text> : null}
                      <Text style={styles.tdMeta}>By {task.createdByName} ({task.createdByRole.replace(/_/g, ' ')})</Text>
                    </View>

                    {/* Assigned Target (User vs Dept) */}
                    <View style={{ width: 170 }}>
                      {task.assignedToName ? (
                        <View>
                          <View style={styles.userBadgeTag}>
                            <Text style={styles.userBadgeTagText}>👤 {task.assignedToName}</Text>
                          </View>
                          <Text style={styles.tdDeptSub}>
                            {task.assignedToDepartment ? task.assignedToDepartment.replace(/_/g, ' ') : 'General'}
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.deptBadgeTag}>
                          <Text style={styles.deptBadgeTagText}>
                            🏢 {task.assignedToDepartment ? task.assignedToDepartment.replace(/_/g, ' ') : 'All Depts'} Team
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Order Ref */}
                    <View style={{ width: 110 }}>
                      <Text style={styles.tdOrder}>{task.orderNumber || 'General'}</Text>
                    </View>

                    {/* Priority */}
                    <View style={{ width: 85 }}>
                      <View style={[styles.priorityBadge, { backgroundColor: pStyle.bg }]}>
                        <Text style={[styles.priorityBadgeText, { color: pStyle.text }]}>{task.priority}</Text>
                      </View>
                    </View>

                    {/* Due Date & Overdue Tag */}
                    <View style={{ width: 100 }}>
                      <Text style={[styles.tdDate, isOverdue && styles.overdueText]}>
                        {task.dueDate || 'N/A'}
                      </Text>
                      {isOverdue && (
                        <View style={styles.overdueBadge}>
                          <Text style={styles.overdueBadgeText}>OVERDUE</Text>
                        </View>
                      )}
                    </View>

                    {/* Status Toggle Buttons */}
                    <View style={{ width: 210, flexDirection: 'row', gap: 4, alignItems: 'center' }}>
                      {canUpdateTaskStatus(task) ? (
                        (['PENDING', 'IN_PROGRESS', 'COMPLETED'] as TaskStatus[]).map((st) => {
                          const active = task.status === st;
                          const badge = getStatusBadge(st);
                          return (
                            <TouchableOpacity
                              key={st}
                              style={[
                                styles.statusChip,
                                active && { backgroundColor: badge.bg, borderColor: badge.border },
                              ]}
                              onPress={() => updateTaskStatus(task.id, st)}
                            >
                              <Text style={[styles.statusChipText, active && { color: badge.text, fontWeight: '800' }]}>
                                {st === 'IN_PROGRESS' ? 'IN PROG' : st}
                              </Text>
                            </TouchableOpacity>
                          );
                        })
                      ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <View style={[styles.statusChip, { backgroundColor: sBadge.bg, borderColor: sBadge.border }]}>
                            <Text style={[styles.statusChipText, { color: sBadge.text, fontWeight: '800' }]}>
                              {sBadge.label}
                            </Text>
                          </View>
                          <Text style={{ fontSize: 11, color: Colors.textMuted }}>🔒 Read Only</Text>
                        </View>
                      )}
                    </View>

                    {/* Actions (RBAC: Delete only Super Admin & Admin) */}
                    <View style={{ width: 95, justifyContent: 'center' }}>
                      {isSuperAdminOrAdmin ? (
                        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(task.id)}>
                          <Text style={styles.deleteBtnText}>Delete</Text>
                        </TouchableOpacity>
                      ) : (
                        <Text style={styles.deleteDisabled}>🔒 Protected</Text>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    marginVertical: Spacing.md,
    ...Shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerMobile: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 10,
  },
  title: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: '800',
  },
  subTitle: {
    color: Colors.accentTeal,
    fontSize: 11,
    marginTop: 2,
  },
  createBtn: {
    backgroundColor: Colors.industrialOrange,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    ...Shadows.glowOrange,
  },
  createBtnText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginBottom: 10,
  },
  errorText: {
    color: Colors.dangerBright,
    fontSize: 12,
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  filterRowMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 8,
  },
  tabGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  filterTab: {
    backgroundColor: Colors.inputBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  filterTabActive: {
    backgroundColor: Colors.accentTeal,
    borderColor: Colors.accentTeal,
  },
  filterTabText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  filterTabTextActive: {
    color: Colors.white,
  },
  searchInput: {
    backgroundColor: Colors.inputBg,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    color: Colors.textLight,
    fontSize: 12,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    width: 220,
  },
  secondaryFilterRow: {
    marginBottom: 12,
  },
  chipsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterLabelText: {
    color: Colors.accentTeal,
    fontSize: 11,
    fontWeight: '800',
  },
  chip: {
    backgroundColor: Colors.inputBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  chipActive: {
    backgroundColor: Colors.industrialOrange,
    borderColor: Colors.industrialOrange,
  },
  chipText: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  chipTextActive: {
    color: Colors.white,
  },
  vDivider: {
    width: 1,
    height: 16,
    backgroundColor: Colors.borderDark,
    marginHorizontal: 4,
  },
  table: {
    minWidth: 1000,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: Colors.inputBg,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  th: {
    color: Colors.accentTeal,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  tr: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBg,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  tdTitle: {
    color: Colors.textLight,
    fontSize: 13,
    fontWeight: '700',
  },
  tdDesc: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  tdMeta: {
    color: Colors.textSubtle,
    fontSize: 10,
    marginTop: 2,
  },
  userBadgeTag: {
    backgroundColor: 'rgba(41, 88, 92, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.accentTeal,
  },
  userBadgeTagText: {
    color: Colors.accentTeal,
    fontSize: 11,
    fontWeight: '800',
  },
  deptBadgeTag: {
    backgroundColor: Colors.inputBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  deptBadgeTagText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  tdDeptSub: {
    color: Colors.textSubtle,
    fontSize: 10,
    marginTop: 2,
  },
  tdOrder: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '600',
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  tdDate: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  overdueText: {
    color: '#ef4444',
    fontWeight: '800',
  },
  overdueBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  overdueBadgeText: {
    color: '#ef4444',
    fontSize: 8,
    fontWeight: '900',
  },
  statusChip: {
    backgroundColor: Colors.inputBg,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  statusChipText: {
    color: Colors.accentTeal,
    fontSize: 10,
    fontWeight: '700',
  },
  deleteBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  deleteBtnText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  deleteDisabled: {
    color: '#64748b',
    fontSize: 10,
    fontStyle: 'italic',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
    marginVertical: 12,
  },
  mobileCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  mobileCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    padding: Spacing.md,
    backgroundColor: Colors.cardBg,
  },
  mobileCardTitle: {
    color: Colors.accentTeal,
    fontSize: 14,
    fontWeight: '800',
  },
  mobileCardSubtitle: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  mobileCardBody: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderDark,
    backgroundColor: Colors.inputBg,
  },
  mobileCardDetail: {
    color: Colors.textMuted,
    fontSize: 12,
    marginBottom: 4,
  },
  mobileCardVal: {
    color: Colors.textLight,
    fontWeight: '700',
  },
  exportBtn: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.sm,
  },
  exportBtnText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
});
