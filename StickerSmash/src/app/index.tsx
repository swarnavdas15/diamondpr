import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';

import { useERP } from '../context/ERPContext';
import { NavMenuItem } from '../types';

import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { CompactCalendarModal } from '../components/CompactCalendarModal';
import { OrderOverviewModal } from '../components/OrderOverviewModal';
import { CreateUserModal } from '../components/CreateUserModal';
import { CreateClientModal } from '../components/CreateClientModal';
import { CreateOrderModal } from '../components/CreateOrderModal';
import { CreateTaskModal } from '../components/CreateTaskModal';
import { CreateQuotationModal } from '../components/CreateQuotationModal';

import { AdminDashboard } from '../components/dashboards/AdminDashboard';
import { SalesDashboard } from '../components/dashboards/SalesDashboard';
import { PurchaseDashboard } from '../components/dashboards/PurchaseDashboard';
import { ProductionDashboard } from '../components/dashboards/ProductionDashboard';
import { QualityDashboard } from '../components/dashboards/QualityDashboard';
import { DispatchDashboard } from '../components/dashboards/DispatchDashboard';
import { TaskManagement } from '../components/TaskManagement';
import { OrdersManagement } from '../components/OrdersManagement';
import { MobileBottomNav } from '../components/MobileBottomNav';

import { LoginScreen } from '../components/auth/LoginScreen';
import { Colors } from '../theme';
import { SuperAdminAnalyticsView } from '../components/analytics/SuperAdminAnalyticsView';

import {
  ClientDirectoryView,
  ProjectsView,
  VendorsView,
  ReportsView,
  FilesView,
  UsersView,
  QuotationsView,
  SettingsView,
} from '../components/views/PlaceholderViews';

export default function MainScreen() {
  const { currentUser, isAuthenticated, logout } = useAuth();
  const { selectedOrder, setSelectedOrder } = useERP();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  // Navigation Sidebar State — auto-collapse on mobile (< 768) and tablet (< 1024)
  const [activeMenuItem, setActiveMenuItem] = useState<NavMenuItem>('Dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(width < 1024);

  useEffect(() => {
    if (width < 768) {
      setSidebarCollapsed(true);
    }
  }, [width < 768]);

  // Modal visibility states
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [createUserVisible, setCreateUserVisible] = useState(false);
  const [createClientVisible, setCreateClientVisible] = useState(false);
  const [createOrderVisible, setCreateOrderVisible] = useState(false);
  const [orderInitialData, setOrderInitialData] = useState<any>(null);
  const [createTaskVisible, setCreateTaskVisible] = useState(false);
  const [createQuotationVisible, setCreateQuotationVisible] = useState(false);

  // Protected Route Check
  if (!isAuthenticated || !currentUser) {
    return <LoginScreen />;
  }

  const isSuperAdminOrAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';

  const renderDashboardByRole = () => {
    switch (currentUser.role) {
      case 'SUPER_ADMIN':
        return <AdminDashboard isSuperAdmin={true} onOpenCreateUser={() => setCreateUserVisible(true)} />;
      case 'ADMIN':
        return <AdminDashboard isSuperAdmin={false} />;
      case 'SALES':
        return (
          <SalesDashboard
            onOpenCreateClient={() => setCreateClientVisible(true)}
            onOpenCreateOrder={() => { setOrderInitialData(null); setCreateOrderVisible(true); }}
            onOpenCreateQuotation={() => setCreateQuotationVisible(true)}
          />
        );
      case 'PURCHASE':
        return <PurchaseDashboard />;
      case 'PRODUCTION':
        return <ProductionDashboard isQCMode={false} />;
      case 'QUALITY_TESTING':
        return <ProductionDashboard isQCMode={true} />;
      case 'DISPATCH':
        return <DispatchDashboard />;
      default:
        return <AdminDashboard isSuperAdmin={false} />;
    }
  };

  const handleSelectMenuItem = (item: NavMenuItem) => {
    if (item === 'Logout') {
      logout();
      return;
    }
    // Open calendar for calendar/notification items
    if (item === 'Calendar' || item === 'Notifications') {
      setCalendarVisible(true);
      return;
    }
    setActiveMenuItem(item);
  };

  const renderActiveScreenContent = () => {
    switch (activeMenuItem) {
      case 'Dashboard':
        return renderDashboardByRole();

      case 'ClientDirectory':
        return (
          <ClientDirectoryView
            onOpenCreateClient={() => setCreateClientVisible(true)}
            onOpenCreateOrder={() => { setOrderInitialData(null); setCreateOrderVisible(true); }}
          />
        );

      case 'Orders':
        if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN' && currentUser.role !== 'SALES') {
          return renderDashboardByRole();
        }
        return (
          <OrdersManagement
            onNavigateToQuotations={() => setActiveMenuItem('Quotations')}
            onOpenCreateOrder={() => { setOrderInitialData(null); setCreateOrderVisible(true); }}
          />
        );

      case 'WorkOrders':
        if (currentUser.role === 'SALES') {
          return renderDashboardByRole();
        }
        return <ProductionDashboard isQCMode={false} />;

      case 'PurchaseOrders':
        if (currentUser.role === 'PURCHASE') {
          return renderDashboardByRole();
        }
        return <PurchaseDashboard />;

      case 'Purchase':
        return <PurchaseDashboard />;

      case 'Production':
        return <ProductionDashboard isQCMode={false} />;

      case 'QualityControl':
        return <ProductionDashboard isQCMode={true} />;

      case 'DispatchQueue':
      case 'Dispatch':
      case 'Logistics':
        if (currentUser.role === 'DISPATCH') {
          return renderDashboardByRole();
        }
        return <DispatchDashboard />;

      case 'Vendors':
        return <VendorsView />;

      case 'Quotations':
        if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN' && currentUser.role !== 'SALES') {
          return renderDashboardByRole();
        }
        return <QuotationsView onOpenCreateQuotation={() => setCreateQuotationVisible(true)} onOpenCreateOrderWithData={(data) => { setOrderInitialData(data); setCreateOrderVisible(true); }} />;

      case 'Tasks':
        return <TaskManagement onOpenCreateTask={() => setCreateTaskVisible(true)} />;

      case 'Users':
        if (!isSuperAdminOrAdmin) return renderDashboardByRole();
        return <UsersView onOpenCreateUser={() => setCreateUserVisible(true)} />;

      case 'ActivityLogs':
        if (!isSuperAdminOrAdmin) return renderDashboardByRole();
        return <AdminDashboard isSuperAdmin={currentUser.role === 'SUPER_ADMIN'} />;

      case 'Reports':
        // STRICT RULE: Reports & Analytics module is exclusively accessible by Super Admin
        if (currentUser.role !== 'SUPER_ADMIN') {
          return renderDashboardByRole();
        }
        return <SuperAdminAnalyticsView />;

      case 'Settings':
        // STRICT RULE: ERP Settings is ONLY accessible by Super Admin
        if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
          return renderDashboardByRole();
        }
        return <SettingsView />;

      default:
        return renderDashboardByRole();
    }
  };

  return (
    <View style={styles.safeArea}>
      <View style={styles.appContainer}>
        {/* Top Corporate Header */}
        <Header
          onOpenCalendar={() => setCalendarVisible(true)}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Main Body: Collapsible Sidebar + Main Content View */}
        <View style={styles.bodyRow}>
          {/* ERP Collapsible Sidebar Navigation */}
          <Sidebar
            activeMenuItem={activeMenuItem}
            onSelectMenuItem={handleSelectMenuItem}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />

          {/* Main ERP Work Area */}
          <View style={styles.mainContentArea}>
            {/* Active Navigation Screen Content */}
            <View style={[styles.screenViewContainer, isMobile && styles.screenViewContainerMobile]}>
              {renderActiveScreenContent()}
            </View>
          </View>
        </View>

        {/* Mobile Fixed Bottom Navigation Bar */}
        {isMobile && (
          <MobileBottomNav
            activeMenuItem={activeMenuItem}
            onSelectMenuItem={handleSelectMenuItem}
            onOpenMenu={() => setSidebarCollapsed(false)}
            userRole={currentUser?.role}
          />
        )}

        {/* Modals */}
        <CompactCalendarModal visible={calendarVisible} onClose={() => setCalendarVisible(false)} />
        <OrderOverviewModal visible={!!selectedOrder} onClose={() => setSelectedOrder(null)} />
        <CreateUserModal visible={createUserVisible} onClose={() => setCreateUserVisible(false)} />
        <CreateClientModal visible={createClientVisible} onClose={() => setCreateClientVisible(false)} />
        <CreateOrderModal visible={createOrderVisible} onClose={() => { setCreateOrderVisible(false); setOrderInitialData(null); }} initialData={orderInitialData} />
        <CreateTaskModal visible={createTaskVisible} onClose={() => setCreateTaskVisible(false)} />
        <CreateQuotationModal visible={createQuotationVisible} onClose={() => setCreateQuotationVisible(false)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
  appContainer: {
    flex: 1,
    minHeight: (Platform.OS === 'web' ? ('100dvh' as any) : undefined),
    backgroundColor: Colors.bgDark,
  },
  bodyRow: {
    flex: 1,
    flexDirection: 'row',
  },
  mainContentArea: {
    flex: 1,
    backgroundColor: Colors.bgDark,
    flexDirection: 'column',
  },
  breadcrumbBar: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  breadcrumbLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  breadcrumbCategory: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  breadcrumbActive: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '800',
  },
  quickActionBtn: {
    backgroundColor: '#2563eb', // Corporate Blue
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    ...Platform.select({
      web: { boxShadow: '0px 4px 6px rgba(37, 99, 235, 0.3)' },
      default: {
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
    }),
  },
  quickActionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  screenViewContainer: {
    flex: 1,
    padding: 20,
  },
  screenViewContainerMobile: {
    padding: 10,
    paddingBottom: (Platform.OS === 'web' ? ('calc(env(safe-area-inset-bottom, 8px) + 68px)' as any) : 72),
  },
});
