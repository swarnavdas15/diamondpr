import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { useERP } from '../context/ERPContext';
import { useAuth } from '../context/AuthContext';
import { Order, DepartmentStatus } from '../types';
import { Colors, StatusColors, Spacing, Radius, Shadows } from '../theme';
import { ExportButton } from './ui/ExportButton';
import { ExportDataPayload } from '../utils/exportUtils';
import { OrderOverviewModal } from './OrderOverviewModal';

interface OrdersManagementProps {
  onNavigateToQuotations?: () => void;
  onOpenCreateOrder?: () => void;
}

type StatusFilter = 'ALL' | 'ACTIVE' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'READY_FOR_DISPATCH' | 'DELAYED';
type DepartmentFilter = 'ALL' | 'SALES' | 'PURCHASE' | 'PRODUCTION' | 'QUALITY_TESTING' | 'DISPATCH';
type DateFilter = 'ALL' | 'TODAY' | 'LAST_7_DAYS' | 'LAST_30_DAYS';

export const OrdersManagement: React.FC<OrdersManagementProps> = ({
  onNavigateToQuotations,
  onOpenCreateOrder,
}) => {
  const { orders, setSelectedOrder, selectedOrder } = useERP();
  const { currentUser } = useAuth();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [deptFilter, setDeptFilter] = useState<DepartmentFilter>('ALL');
  const [dateFilter, setDateFilter] = useState<DateFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');



  // Helper to determine if an order is delayed
  const isOrderDelayed = (order: Order): boolean => {
    if (order.status === 'COMPLETED') return false;
    const now = new Date();
    const created = new Date(order.createdAt);
    const diffDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 3600 * 24));
    // If order is pending/in progress for more than 14 days or explicitly marked
    return diffDays > 14 || order.status === 'REJECTED';
  };

  // Helper to check if ready for dispatch
  const isReadyForDispatch = (order: Order): boolean => {
    return (
      order.currentStage === 'DISPATCH' ||
      order.dispatchStatus === 'APPROVED' ||
      order.dispatchStatus === 'IN_PROGRESS'
    );
  };

  // Calculate Summary KPI Metrics
  const metrics = useMemo(() => {
    const total = orders.length;
    const active = orders.filter((o) => o.status !== 'COMPLETED' && o.status !== 'REJECTED').length;
    const pending = orders.filter((o) => o.status === 'PENDING').length;
    const completed = orders.filter((o) => o.status === 'COMPLETED').length;
    const delayed = orders.filter((o) => isOrderDelayed(o)).length;
    const readyForDispatch = orders.filter((o) => isReadyForDispatch(o)).length;

    return { total, active, pending, completed, delayed, readyForDispatch };
  }, [orders]);

  // Filtering Logic
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Status Filter
      if (statusFilter === 'ACTIVE' && (order.status === 'COMPLETED' || order.status === 'REJECTED')) {
        return false;
      }
      if (statusFilter === 'PENDING' && order.status !== 'PENDING') return false;
      if (statusFilter === 'IN_PROGRESS' && order.status !== 'IN_PROGRESS') return false;
      if (statusFilter === 'COMPLETED' && order.status !== 'COMPLETED') return false;
      if (statusFilter === 'READY_FOR_DISPATCH' && !isReadyForDispatch(order)) return false;
      if (statusFilter === 'DELAYED' && !isOrderDelayed(order)) return false;

      // Department Filter
      if (deptFilter !== 'ALL') {
        const assignedDept = order.assignedDepartment || order.currentStage;
        if (assignedDept !== deptFilter) return false;
      }

      // Date Range Filter
      if (dateFilter !== 'ALL') {
        const createdDate = new Date(order.createdAt).getTime();
        const now = new Date().getTime();
        const oneDay = 24 * 60 * 60 * 1000;
        if (dateFilter === 'TODAY' && now - createdDate > oneDay) return false;
        if (dateFilter === 'LAST_7_DAYS' && now - createdDate > 7 * oneDay) return false;
        if (dateFilter === 'LAST_30_DAYS' && now - createdDate > 30 * oneDay) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchOrderNum = order.orderNumber.toLowerCase().includes(q);
        const matchPONum = (order.poNumber || '').toLowerCase().includes(q);
        const matchClientCode = order.clientCode.toLowerCase().includes(q);
        const matchClientName = (order.clientName || '').toLowerCase().includes(q);

        if (!matchOrderNum && !matchPONum && !matchClientCode && !matchClientName) {
          return false;
        }
      }

      return true;
    });
  }, [orders, statusFilter, deptFilter, dateFilter, searchQuery]);

  // Pagination Logic
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, deptFilter, dateFilter, searchQuery]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredOrders, currentPage]);

  // Open Order Detail Modal
  const handleViewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
  };

  // Format Order Value (Calculated budget or items sum)
  const getOrderValue = (order: Order): number => {
    if (order.budget && order.budget > 0) return order.budget;
    if (order.items && order.items.length > 0) {
      return order.items.reduce((acc, item) => acc + (item.quantity * (item.unitPrice || 0)), 0);
    }
    return 0;
  };

  // Status Badge Styling Helper
  const getBadgeProps = (order: Order) => {
    if (order.status === 'COMPLETED') {
      return { label: 'Completed', bg: '#15803d15', border: '#22c55e', text: '#22c55e', icon: '🟢' };
    }
    if (isReadyForDispatch(order)) {
      return { label: 'Ready For Dispatch', bg: '#1d4ed815', border: '#3b82f6', text: '#3b82f6', icon: '🔵' };
    }
    if (isOrderDelayed(order)) {
      return { label: 'Delayed', bg: '#b91c1c15', border: '#ef4444', text: '#ef4444', icon: '🔴' };
    }
    if (order.status === 'IN_PROGRESS') {
      return { label: 'In Progress', bg: '#b4530915', border: '#eab308', text: '#eab308', icon: '🟡' };
    }
    return { label: 'Pending', bg: '#37415115', border: '#9ca3af', text: '#9ca3af', icon: '⚫' };
  };

  // Export Data Payload Generator
  const getOrdersExportPayload = (): ExportDataPayload => {
    return {
      title: 'Diamond Flanges ERP - Orders Management Report',
      subtitle: `Exported on ${new Date().toLocaleDateString()} | Total Orders: ${filteredOrders.length}`,
      filename: 'Orders_Management_Report',
      headers: [
        'Order Number',
        'PO Number',
        'Client Code',
        'Client Name',
        'Order Date',
        'Required Qty',
        'Order Value (INR)',
        'Current Stage',
        'Current Department',
        'Status',
        'Involved Departments',
      ],
      rows: filteredOrders.map((o) => {
        const val = getOrderValue(o);
        const depts = [
          o.purchaseRequired ? 'Purchase' : null,
          o.productionRequired ? 'Production' : null,
          o.qualityTestingRequired ? 'QC' : null,
          o.dispatchRequired ? 'Dispatch' : null,
        ]
          .filter(Boolean)
          .join(', ');

        return [
          o.orderNumber,
          o.poNumber || 'N/A',
          o.clientCode,
          o.clientName || 'Masked',
          new Date(o.createdAt).toLocaleDateString(),
          `${o.requiredQuantity} pcs`,
          val ? `₹${val.toLocaleString()}` : 'N/A',
          (o.currentStage || 'SALES').replace(/_/g, ' '),
          o.assignedDepartment || o.currentStage || 'SALES',
          o.status,
          depts || 'General',
        ];
      }),
    };
  };

  if (!currentUser) return null;

  // RBAC Access Check: Super Admin, Admin, Sales only
  const isAllowed = ['SUPER_ADMIN', 'ADMIN', 'SALES'].includes(currentUser.role);
  if (!isAllowed) {
    return (
      <View style={styles.accessDeniedContainer}>
        <Text style={styles.accessDeniedTitle}>🔒 Access Denied</Text>
        <Text style={styles.accessDeniedSub}>
          The Orders module is strictly accessible to Super Admin, Admin, and Sales personnel.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Module Title Header */}
      <View style={[styles.headerRow, isMobile && styles.headerRowMobile]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.moduleTitle}>📦 Orders Management</Text>
          <Text style={styles.moduleSubtitle}>
            Central Order Overview, Live Workflow Pipeline & Quantity Movement Tracking
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <ExportButton getData={getOrdersExportPayload} buttonText="Export Orders" />
          {onOpenCreateOrder && (
            <TouchableOpacity style={styles.createOrderBtn} onPress={onOpenCreateOrder} activeOpacity={0.8}>
              <Text style={styles.createOrderBtnText}>➕ Create New Order</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Top Interactive Dashboard Summary Cards */}
      <View style={styles.kpiGrid}>
        <TouchableOpacity
          style={[styles.kpiCard, statusFilter === 'ALL' && styles.kpiCardActive]}
          onPress={() => setStatusFilter('ALL')}
          activeOpacity={0.8}
        >
          <View style={styles.kpiHeaderRow}>
            <Text style={styles.kpiIcon}>📦</Text>
            <Text style={[styles.kpiCount, { color: Colors.accentTeal }]}>{metrics.total}</Text>
          </View>
          <Text style={styles.kpiLabel}>Total Orders</Text>
          <Text style={styles.kpiSubText}>All System Orders</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.kpiCard, statusFilter === 'ACTIVE' && styles.kpiCardActive]}
          onPress={() => setStatusFilter('ACTIVE')}
          activeOpacity={0.8}
        >
          <View style={styles.kpiHeaderRow}>
            <Text style={styles.kpiIcon}>⚡</Text>
            <Text style={[styles.kpiCount, { color: '#38bdf8' }]}>{metrics.active}</Text>
          </View>
          <Text style={styles.kpiLabel}>Active Orders</Text>
          <Text style={styles.kpiSubText}>Ongoing Workflows</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.kpiCard, statusFilter === 'PENDING' && styles.kpiCardActive]}
          onPress={() => setStatusFilter('PENDING')}
          activeOpacity={0.8}
        >
          <View style={styles.kpiHeaderRow}>
            <Text style={styles.kpiIcon}>⚫</Text>
            <Text style={[styles.kpiCount, { color: '#9ca3af' }]}>{metrics.pending}</Text>
          </View>
          <Text style={styles.kpiLabel}>Pending Orders</Text>
          <Text style={styles.kpiSubText}>Awaiting Action</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.kpiCard, statusFilter === 'COMPLETED' && styles.kpiCardActive]}
          onPress={() => setStatusFilter('COMPLETED')}
          activeOpacity={0.8}
        >
          <View style={styles.kpiHeaderRow}>
            <Text style={styles.kpiIcon}>🟢</Text>
            <Text style={[styles.kpiCount, { color: '#22c55e' }]}>{metrics.completed}</Text>
          </View>
          <Text style={styles.kpiLabel}>Completed</Text>
          <Text style={styles.kpiSubText}>Fulfilled & Closed</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.kpiCard, statusFilter === 'DELAYED' && styles.kpiCardActive]}
          onPress={() => setStatusFilter('DELAYED')}
          activeOpacity={0.8}
        >
          <View style={styles.kpiHeaderRow}>
            <Text style={styles.kpiIcon}>🔴</Text>
            <Text style={[styles.kpiCount, { color: '#ef4444' }]}>{metrics.delayed}</Text>
          </View>
          <Text style={styles.kpiLabel}>Delayed Orders</Text>
          <Text style={styles.kpiSubText}>Requires Attention</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.kpiCard, statusFilter === 'READY_FOR_DISPATCH' && styles.kpiCardActive]}
          onPress={() => setStatusFilter('READY_FOR_DISPATCH')}
          activeOpacity={0.8}
        >
          <View style={styles.kpiHeaderRow}>
            <Text style={styles.kpiIcon}>🔵</Text>
            <Text style={[styles.kpiCount, { color: '#3b82f6' }]}>{metrics.readyForDispatch}</Text>
          </View>
          <Text style={styles.kpiLabel}>Ready For Dispatch</Text>
          <Text style={styles.kpiSubText}>In Dispatch Queue</Text>
        </TouchableOpacity>
      </View>

      {/* Search & Multi-Filter Control Bar */}
      <View style={styles.filterCard}>
        <View style={[styles.filterRow, isMobile && styles.filterRowMobile]}>
          {/* Search Box */}
          <View style={styles.searchBoxContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by Order #, PO #, Client Code, Name..."
              placeholderTextColor={Colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
                <Text style={{ color: Colors.textMuted, fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Quick Filter Badges */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
            <TouchableOpacity
              style={[styles.chip, statusFilter === 'ALL' && styles.chipActive]}
              onPress={() => setStatusFilter('ALL')}
            >
              <Text style={[styles.chipText, statusFilter === 'ALL' && styles.chipTextActive]}>All Status</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.chip, statusFilter === 'IN_PROGRESS' && styles.chipActive]}
              onPress={() => setStatusFilter('IN_PROGRESS')}
            >
              <Text style={[styles.chipText, statusFilter === 'IN_PROGRESS' && styles.chipTextActive]}>🟡 In Progress</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.chip, statusFilter === 'READY_FOR_DISPATCH' && styles.chipActive]}
              onPress={() => setStatusFilter('READY_FOR_DISPATCH')}
            >
              <Text style={[styles.chipText, statusFilter === 'READY_FOR_DISPATCH' && styles.chipTextActive]}>🔵 Ready Dispatch</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.chip, statusFilter === 'COMPLETED' && styles.chipActive]}
              onPress={() => setStatusFilter('COMPLETED')}
            >
              <Text style={[styles.chipText, statusFilter === 'COMPLETED' && styles.chipTextActive]}>🟢 Completed</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.chip, statusFilter === 'DELAYED' && styles.chipActive]}
              onPress={() => setStatusFilter('DELAYED')}
            >
              <Text style={[styles.chipText, statusFilter === 'DELAYED' && styles.chipTextActive]}>🔴 Delayed</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Secondary Department & Date Filter Selector */}
        <View style={styles.secondaryFilterRow}>
          <Text style={styles.filterMetaText}>
            Showing <Text style={{ color: Colors.accentTeal, fontWeight: '800' }}>{filteredOrders.length}</Text> of {orders.length} Orders
          </Text>

          {deptFilter !== 'ALL' || dateFilter !== 'ALL' || statusFilter !== 'ALL' || searchQuery ? (
            <TouchableOpacity
              onPress={() => {
                setStatusFilter('ALL');
                setDeptFilter('ALL');
                setDateFilter('ALL');
                setSearchQuery('');
              }}
              style={styles.clearFilterBtn}
            >
              <Text style={styles.clearFilterText}>Clear All Filters ✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Orders List / Table View */}
      {filteredOrders.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyTitle}>No Orders Found</Text>
          <Text style={styles.emptySub}>
            No orders match your current filter criteria. Try adjusting your search or filters.
          </Text>
        </View>
      ) : isMobile ? (
        /* Mobile Card Layout */
        <View style={styles.mobileCardList}>
          {paginatedOrders.map((order) => {
            const badge = getBadgeProps(order);
            const val = getOrderValue(order);
            return (
              <TouchableOpacity
                key={order.id}
                style={styles.orderMobileCard}
                onPress={() => handleViewOrderDetails(order)}
                activeOpacity={0.8}
              >
                <View style={styles.orderMobileHeader}>
                  <View>
                    <Text style={styles.orderNumText}>{order.orderNumber}</Text>
                    <Text style={styles.poNumText}>PO: {order.poNumber || 'N/A'}</Text>
                  </View>

                  <View style={[styles.statusBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                    <Text style={[styles.statusText, { color: badge.text }]}>
                      {badge.icon} {badge.label}
                    </Text>
                  </View>
                </View>

                <View style={styles.mobileCardBody}>
                  <View style={styles.mobilePropRow}>
                    <Text style={styles.propLabel}>Client:</Text>
                    <Text style={styles.propValueBold}>
                      {order.clientCode} - {order.clientName || 'Masked'}
                    </Text>
                  </View>

                  <View style={styles.mobilePropRow}>
                    <Text style={styles.propLabel}>Required Qty:</Text>
                    <Text style={styles.propValue}>{order.requiredQuantity} pcs</Text>
                  </View>

                  <View style={styles.mobilePropRow}>
                    <Text style={styles.propLabel}>Order Value:</Text>
                    <Text style={styles.propValueHighlight}>
                      {val ? `₹${val.toLocaleString()}` : 'N/A'}
                    </Text>
                  </View>

                  <View style={styles.mobilePropRow}>
                    <Text style={styles.propLabel}>Current Stage:</Text>
                    <Text style={styles.propValue}>
                      {(order.currentStage || 'SALES').replace(/_/g, ' ')}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.viewDetailsBtnMobile}
                  onPress={() => handleViewOrderDetails(order)}
                >
                  <Text style={styles.viewDetailsBtnText}>👁️ View Details & Pipeline ➔</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        /* Desktop Structured Table Layout */
        <View style={styles.tableCard}>
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View>
              {/* Table Header */}
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.th, { width: 140 }]}>ORDER NUMBER</Text>
                <Text style={[styles.th, { width: 110 }]}>PO NUMBER</Text>
                <Text style={[styles.th, { width: 110 }]}>CLIENT CODE</Text>
                <Text style={[styles.th, { width: 170 }]}>CLIENT NAME</Text>
                <Text style={[styles.th, { width: 110 }]}>ORDER DATE</Text>
                <Text style={[styles.th, { width: 100 }]}>QUANTITY</Text>
                <Text style={[styles.th, { width: 120 }]}>ORDER VALUE</Text>
                <Text style={[styles.th, { width: 150 }]}>CURRENT STAGE</Text>
                <Text style={[styles.th, { width: 150 }]}>ORDER STATUS</Text>
                <Text style={[styles.th, { width: 160 }]}>INVOLVED DEPTS</Text>
                <Text style={[styles.th, { width: 120, textAlign: 'center' }]}>ACTIONS</Text>
              </View>

              {/* Table Body */}
              {paginatedOrders.map((order, idx) => {
                const badge = getBadgeProps(order);
                const val = getOrderValue(order);

                return (
                  <TouchableOpacity
                    key={order.id}
                    style={[styles.tableBodyRow, idx % 2 === 1 && styles.tableRowAlt]}
                    onPress={() => handleViewOrderDetails(order)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.tdBold, { width: 140, color: Colors.accentTeal }]}>
                      {order.orderNumber}
                    </Text>

                    <Text style={[styles.td, { width: 110 }]}>{order.poNumber || 'N/A'}</Text>

                    <Text style={[styles.tdBold, { width: 110, color: Colors.textLight }]}>
                      {order.clientCode}
                    </Text>

                    <Text style={[styles.td, { width: 170 }]} numberOfLines={1}>
                      {order.clientName || 'Masked'}
                    </Text>

                    <Text style={[styles.td, { width: 110 }]}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </Text>

                    <Text style={[styles.tdBold, { width: 100, color: Colors.textLight }]}>
                      {order.requiredQuantity} pcs
                    </Text>

                    <Text style={[styles.tdHighlight, { width: 120 }]}>
                      {val ? `₹${val.toLocaleString()}` : 'N/A'}
                    </Text>

                    <View style={{ width: 150, justifyContent: 'center' }}>
                      <Text style={styles.stageTag}>
                        {(order.currentStage || 'SALES').replace(/_/g, ' ')}
                      </Text>
                    </View>

                    <View style={{ width: 150, justifyContent: 'center' }}>
                      <View style={[styles.statusBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                        <Text style={[styles.statusText, { color: badge.text }]}>
                          {badge.icon} {badge.label}
                        </Text>
                      </View>
                    </View>

                    <View style={{ width: 160, flexDirection: 'row', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                      {order.purchaseRequired && <Text style={styles.deptMiniPill}>PUR</Text>}
                      {order.productionRequired && <Text style={styles.deptMiniPill}>PROD</Text>}
                      {order.qualityTestingRequired && <Text style={styles.deptMiniPill}>QC</Text>}
                      {order.dispatchRequired && <Text style={styles.deptMiniPill}>DISP</Text>}
                    </View>

                    <View style={{ width: 120, alignItems: 'center', justifyContent: 'center' }}>
                      <TouchableOpacity
                        style={styles.viewActionBtn}
                        onPress={() => handleViewOrderDetails(order)}
                      >
                        <Text style={styles.viewActionBtnText}>👁️ Details</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <View style={styles.paginationRow}>
          <TouchableOpacity 
            style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]}
            disabled={currentPage === 1}
            onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          >
            <Text style={[styles.pageBtnText, currentPage === 1 && styles.pageBtnTextDisabled]}>Previous</Text>
          </TouchableOpacity>
          <Text style={styles.pageText}>Page {currentPage} of {totalPages}</Text>
          <TouchableOpacity 
            style={[styles.pageBtn, currentPage === totalPages && styles.pageBtnDisabled]}
            disabled={currentPage === totalPages}
            onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          >
            <Text style={[styles.pageBtnText, currentPage === totalPages && styles.pageBtnTextDisabled]}>Next</Text>
          </TouchableOpacity>
        </View>
      )}

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
  contentContainer: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  accessDeniedContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    margin: Spacing.lg,
  },
  accessDeniedTitle: {
    color: Colors.danger,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  accessDeniedSub: {
    color: Colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerRowMobile: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  moduleTitle: {
    color: Colors.textLight,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  moduleSubtitle: {
    color: Colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  createOrderBtn: {
    backgroundColor: Colors.accentTeal,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.md,
    ...Shadows.sm,
  },
  createOrderBtnText: {
    color: Colors.cardBg,
    fontWeight: '800',
    fontSize: 13,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  kpiCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    ...Shadows.sm,
  },
  kpiCardActive: {
    borderColor: Colors.accentTeal,
    backgroundColor: Colors.inputBg,
  },
  kpiHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  kpiIcon: {
    fontSize: 18,
  },
  kpiCount: {
    fontSize: 22,
    fontWeight: '800',
  },
  kpiLabel: {
    color: Colors.textLight,
    fontSize: 13,
    fontWeight: '700',
  },
  kpiSubText: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  filterCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    gap: 10,
    ...Shadows.sm,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filterRowMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  searchBoxContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  searchIcon: {
    marginRight: 8,
    fontSize: 14,
  },
  searchInput: {
    flex: 1,
    height: 38,
    color: Colors.textLight,
    fontSize: 13,
  },
  chipScroll: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  chipActive: {
    backgroundColor: Colors.accentTeal + '20',
    borderColor: Colors.accentTeal,
  },
  chipText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: Colors.accentTeal,
    fontWeight: '800',
  },
  secondaryFilterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.borderDark,
    paddingTop: 8,
  },
  filterMetaText: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  clearFilterBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearFilterText: {
    color: Colors.accentTeal,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyTitle: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: '700',
  },
  emptySub: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  mobileCardList: {
    gap: 12,
  },
  orderMobileCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    gap: 10,
    ...Shadows.sm,
  },
  orderMobileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDark,
    paddingBottom: 8,
  },
  orderNumText: {
    color: Colors.accentTeal,
    fontSize: 16,
    fontWeight: '800',
  },
  poNumText: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  mobileCardBody: {
    gap: 6,
  },
  mobilePropRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  propLabel: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  propValue: {
    color: Colors.textLight,
    fontSize: 12,
  },
  propValueBold: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '700',
  },
  propValueHighlight: {
    color: Colors.accentTeal,
    fontSize: 13,
    fontWeight: '800',
  },
  viewDetailsBtnMobile: {
    backgroundColor: Colors.inputBg,
    paddingVertical: 10,
    borderRadius: Radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderDark,
    marginTop: 4,
  },
  viewDetailsBtnText: {
    color: Colors.accentTeal,
    fontWeight: '800',
    fontSize: 12,
  },
  tableCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: Colors.inputBg,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDark,
    alignItems: 'center',
  },
  th: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tableBodyRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDark + '40',
    alignItems: 'center',
  },
  tableRowAlt: {
    backgroundColor: Colors.inputBg + '40',
  },
  td: {
    color: Colors.textLight,
    fontSize: 13,
  },
  tdBold: {
    fontSize: 13,
    fontWeight: '700',
  },
  tdHighlight: {
    color: Colors.accentTeal,
    fontSize: 13,
    fontWeight: '800',
  },
  stageTag: {
    color: Colors.textLight,
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: Colors.inputBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  deptMiniPill: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.accentTeal,
    backgroundColor: Colors.accentTeal + '20',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  viewActionBtn: {
    backgroundColor: Colors.accentTeal + '20',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.accentTeal + '60',
  },
  viewActionBtnText: {
    color: Colors.accentTeal,
    fontSize: 11,
    fontWeight: '800',
  },

  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  pageBtn: {
    backgroundColor: Colors.inputBg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  pageBtnDisabled: {
    opacity: 0.5,
  },
  pageBtnText: {
    color: Colors.accentTeal,
    fontSize: 13,
    fontWeight: '700',
  },
  pageBtnTextDisabled: {
    color: Colors.textMuted,
  },
  pageText: {
    color: Colors.textLight,
    fontSize: 14,
    fontWeight: '600',
  },
});
