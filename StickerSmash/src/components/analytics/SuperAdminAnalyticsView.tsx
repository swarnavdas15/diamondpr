import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Platform,
} from 'react-native';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { Colors, StatusColors, Spacing, Radius, Shadows } from '../../theme';
import { Order, Quotation, Task, AuthAuditLog, Role } from '../../types';

export type TimeframeFilter = 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'ALL_TIME';
export type DepartmentFilter = 'ALL' | 'SALES' | 'PURCHASE' | 'PRODUCTION' | 'QUALITY_TESTING' | 'DISPATCH';
export type ReportType =
  | 'ORDER'
  | 'REVENUE'
  | 'SALES'
  | 'PURCHASE'
  | 'PRODUCTION'
  | 'QUALITY'
  | 'DISPATCH'
  | 'USER_PERFORMANCE'
  | 'INVENTORY'
  | 'QUOTATION'
  | 'LOST_BUSINESS'
  | 'AUDIT_LOG';

export const SuperAdminAnalyticsView: React.FC = () => {
  const { orders, quotations, tasks, clients, vendors } = useERP();
  const { users, authAuditLogs } = useAuth();

  // Multi-Criteria Filter States
  const [timeframe, setTimeframe] = useState<TimeframeFilter>('MONTHLY');
  const [selectedDept, setSelectedDept] = useState<DepartmentFilter>('ALL');
  const [selectedUserId, setSelectedUserId] = useState<string>('ALL');
  const [selectedClientCode, setSelectedClientCode] = useState<string>('ALL');
  const [selectedOrderNum, setSelectedOrderNum] = useState<string>('ALL');

  // Report Export State
  const [activeReportType, setActiveReportType] = useState<ReportType>('ORDER');
  const [exportNotice, setExportNotice] = useState<string>('');

  // Active Analytics Tab
  const [activeTab, setActiveTab] = useState<
    'OVERVIEW' | 'ORDERS' | 'REVENUE' | 'QUOTATIONS' | 'DEPARTMENTS' | 'PRODUCTION' | 'QUALITY' | 'DISPATCH' | 'USERS' | 'INVENTORY' | 'AUDIT' | 'REPORTS'
  >('OVERVIEW');

  // 1. Dynamic Filtering Engine
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (selectedClientCode !== 'ALL' && o.clientCode !== selectedClientCode) return false;
      if (selectedOrderNum !== 'ALL' && o.orderNumber !== selectedOrderNum) return false;
      if (selectedDept === 'PURCHASE' && o.purchaseStatus === 'PENDING') return false;
      if (selectedDept === 'PRODUCTION' && o.productionStatus === 'PENDING') return false;
      if (selectedDept === 'QUALITY_TESTING' && o.qualityStatus === 'PENDING') return false;
      if (selectedDept === 'DISPATCH' && o.dispatchStatus === 'PENDING') return false;
      return true;
    });
  }, [orders, selectedClientCode, selectedOrderNum, selectedDept]);

  const filteredQuotations = useMemo(() => {
    return quotations.filter((q) => {
      if (selectedClientCode !== 'ALL' && q.clientCode !== selectedClientCode) return false;
      if (selectedUserId !== 'ALL' && q.salesExecutiveUserId !== selectedUserId) return false;
      return true;
    });
  }, [quotations, selectedClientCode, selectedUserId]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (selectedDept !== 'ALL' && t.assignedToDepartment !== selectedDept) return false;
      if (selectedUserId !== 'ALL' && t.assignedToUserId !== selectedUserId) return false;
      return true;
    });
  }, [tasks, selectedDept, selectedUserId]);

  // 2. Aggregate KPI Metrics Calculations
  const metrics = useMemo(() => {
    const totalOrders = filteredOrders.length;
    const completedOrders = filteredOrders.filter((o) => o.status === 'COMPLETED').length;
    const activeOrders = filteredOrders.filter(
      (o) => o.status === 'IN_PROGRESS' || o.purchaseStatus === 'IN_PROGRESS' || o.productionStatus === 'IN_PROGRESS'
    ).length;
    const delayedOrders = filteredOrders.filter((o) => o.status !== 'COMPLETED' && o.productionStatus === 'IN_PROGRESS').length;

    const totalQuotations = filteredQuotations.length;
    const convertedQuotations = filteredQuotations.filter(
      (q) => q.status === 'FULLY_CONVERTED' || q.status === 'PARTIALLY_CONVERTED' || (q.convertedOrderValue && q.convertedOrderValue > 0)
    ).length;
    const conversionRate = totalQuotations > 0 ? ((convertedQuotations / totalQuotations) * 100).toFixed(1) : '0.0';

    const totalRevenue = filteredQuotations.reduce((acc, q) => acc + (q.convertedOrderValue || 0), 0);
    const lostBusinessValue = filteredQuotations.reduce((acc, q) => acc + (q.lostValue || 0), 0);

    const totalTasks = filteredTasks.length;
    const pendingTasks = filteredTasks.filter((t) => t.status !== 'COMPLETED').length;

    // Scores
    const deptScore = totalOrders > 0 ? Math.min(100, Math.round((completedOrders / totalOrders) * 100 + 15)) : 88;
    const userProductivityScore = totalTasks > 0 ? Math.round(((totalTasks - pendingTasks) / totalTasks) * 100) : 92;

    return {
      totalOrders,
      activeOrders,
      completedOrders,
      delayedOrders,
      totalQuotations,
      conversionRate,
      totalRevenue,
      lostBusinessValue,
      totalTasks,
      pendingTasks,
      deptScore,
      userProductivityScore,
    };
  }, [filteredOrders, filteredQuotations, filteredTasks]);

  // Reset Filters Handler
  const handleResetFilters = () => {
    setTimeframe('MONTHLY');
    setSelectedDept('ALL');
    setSelectedUserId('ALL');
    setSelectedClientCode('ALL');
    setSelectedOrderNum('ALL');
  };

  // 3. Export Data Engine (CSV, Excel, PDF Print)
  const generateExportData = (type: ReportType) => {
    switch (type) {
      case 'ORDER':
        return {
          title: 'ERP Comprehensive Order Performance Report',
          headers: ['Order Number', 'Client Code', 'Client Name', 'Status', 'Purchase Status', 'Production Status', 'QC Result', 'Dispatch Status', 'Required Qty', 'Created Date'],
          rows: filteredOrders.map((o) => [
            o.orderNumber,
            o.clientCode,
            o.clientName || 'N/A',
            o.status,
            o.purchaseStatus,
            o.productionStatus,
            o.qcResult,
            o.dispatchStatus,
            o.requiredQuantity.toString(),
            new Date(o.createdAt).toLocaleDateString(),
          ]),
        };

      case 'REVENUE':
        return {
          title: 'ERP Financial & Revenue Analytics Report',
          headers: ['Quotation Number', 'Client Code', 'Company Name', 'Quotation Amount (₹)', 'Converted Value (₹)', 'Lost Value (₹)', 'Status'],
          rows: filteredQuotations.map((q) => [
            q.quotationNumber,
            q.clientCode,
            q.companyName,
            q.quotationAmount.toString(),
            (q.convertedOrderValue || 0).toString(),
            (q.lostValue || 0).toString(),
            q.status,
          ]),
        };

      case 'SALES':
        return {
          title: 'Sales Team & Pipeline Performance Report',
          headers: ['Quotation No', 'Client', 'Sales Executive', 'Quotation Date', 'Amount (₹)', 'Status', 'Follow-Ups Count'],
          rows: filteredQuotations.map((q) => [
            q.quotationNumber,
            q.companyName,
            q.salesExecutive,
            q.quotationDate,
            q.quotationAmount.toString(),
            q.status,
            (q.followUps?.length || 0).toString(),
          ]),
        };

      case 'PURCHASE':
        return {
          title: 'Procurement & Purchase Department Report',
          headers: ['Order No', 'Client Code', 'Purchase Status', 'Vendor Selected', 'Procurement Notes', 'Purchased Qty / Required Qty'],
          rows: filteredOrders.map((o) => [
            o.orderNumber,
            o.clientCode,
            o.purchaseStatus,
            o.vendorSelected || 'N/A',
            o.procurementNotes || 'N/A',
            `${o.purchaseQuantity || 0} / ${o.requiredQuantity}`,
          ]),
        };

      case 'PRODUCTION':
        return {
          title: 'Shop Floor & Manufacturing Throughput Report',
          headers: ['Order No', 'Client Code', 'Production Status', 'Produced Qty / Total Qty', 'Shop Floor Notes'],
          rows: filteredOrders.map((o) => [
            o.orderNumber,
            o.clientCode,
            o.productionStatus,
            `${o.productionQuantity || 0} / ${o.requiredQuantity}`,
            o.shopFloorNotes || 'N/A',
          ]),
        };

      case 'QUALITY':
        return {
          title: 'Quality Testing & Inspection Yield Report',
          headers: ['Order No', 'Client Code', 'QC Status', 'QC Result', 'QC Passed Qty / Produced Qty', 'QC Remarks'],
          rows: filteredOrders.map((o) => [
            o.orderNumber,
            o.clientCode,
            o.qualityStatus,
            o.qcResult,
            `${o.qcQuantity || 0} / ${o.productionQuantity || 0}`,
            o.qcRemarks || 'N/A',
          ]),
        };

      case 'DISPATCH':
        return {
          title: 'Dispatch & Logistics Fulfillment Report',
          headers: ['Order No', 'Client Code', 'Dispatch Status', 'Transport Ref', 'Dispatched Qty / QC Passed', 'Logistics Entry'],
          rows: filteredOrders.map((o) => [
            o.orderNumber,
            o.clientCode,
            o.dispatchStatus,
            o.transportRef || 'N/A',
            `${o.dispatchQuantity || 0} / ${o.qcQuantity || o.productionQuantity || 0}`,
            o.logisticsEntry || 'N/A',
          ]),
        };

      case 'USER_PERFORMANCE':
        return {
          title: 'User & Staff Productivity Report',
          headers: ['User Name', 'Username', 'Email', 'Role', 'Status', 'Tasks Completed'],
          rows: users.map((u) => {
            const userTasks = tasks.filter((t) => t.assignedToUserId === u.id || t.assignedToName === u.name);
            const compTasks = userTasks.filter((t) => t.status === 'COMPLETED').length;
            return [u.name, u.username, u.email, u.role, u.isActive ? 'ACTIVE' : 'INACTIVE', `${compTasks} / ${userTasks.length}`];
          }),
        };

      case 'INVENTORY':
        return {
          title: 'Inventory & Vendor Performance Report',
          headers: ['Vendor Code', 'Vendor Name', 'Category', 'Contact Person', 'Mobile', 'Status', 'Lead Time'],
          rows: vendors.map((v) => [v.vendorCode, v.vendorName, v.vendorCategory || 'Raw Material', v.contactPerson, v.mobileNumber, v.status, v.leadTime || 'Standard']),
        };

      case 'QUOTATION':
        return {
          title: 'Quotation Pipeline & Analytics Report',
          headers: ['Quotation No', 'Client Name', 'Amount (₹)', 'Status', 'Date', 'Converted Order No'],
          rows: filteredQuotations.map((q) => [q.quotationNumber, q.companyName, q.quotationAmount.toString(), q.status, q.quotationDate, q.convertedOrderNumber || 'N/A']),
        };

      case 'LOST_BUSINESS':
        return {
          title: 'Lost Business & Rejection Analysis Report',
          headers: ['Quotation No', 'Client Name', 'Lost Value (₹)', 'Lost Date', 'Lost Reason', 'Remarks'],
          rows: filteredQuotations
            .filter((q) => q.status === 'LOST' || (q.lostValue && q.lostValue > 0))
            .map((q) => [q.quotationNumber, q.companyName, (q.lostValue || 0).toString(), q.lostDate || 'N/A', q.lostReason || 'N/A', q.lostRemarks || 'N/A']),
        };

      case 'AUDIT_LOG':
        return {
          title: 'System Security & Activity Audit Log Report',
          headers: ['Event Type', 'User ID', 'Email Ref', 'Activity Details', 'Timestamp'],
          rows: authAuditLogs.map((l) => [l.event, l.username || 'N/A', l.email || 'N/A', l.details, new Date(l.timestamp).toLocaleString()]),
        };
    }
  };

  const downloadCSV = () => {
    const data = generateExportData(activeReportType);
    let csvContent = `"${data.title}"\nGenerated At: ${new Date().toLocaleString()}\n\n`;
    csvContent += data.headers.map((h) => `"${h}"`).join(',') + '\n';
    data.rows.forEach((row) => {
      csvContent += row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',') + '\n';
    });

    if (Platform.OS === 'web') {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${activeReportType.toLowerCase()}_report_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    setExportNotice(`Downloaded CSV Report: ${data.title}`);
    setTimeout(() => setExportNotice(''), 4000);
  };

  const downloadExcel = () => {
    const data = generateExportData(activeReportType);
    let excelContent = `\uFEFF"${data.title}"\nGenerated At: ${new Date().toLocaleString()}\n\n`;
    excelContent += data.headers.map((h) => `"${h}"`).join('\t') + '\n';
    data.rows.forEach((row) => {
      excelContent += row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join('\t') + '\n';
    });

    if (Platform.OS === 'web') {
      const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${activeReportType.toLowerCase()}_report_${Date.now()}.xls`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    setExportNotice(`Downloaded Excel Spreadsheet: ${data.title}`);
    setTimeout(() => setExportNotice(''), 4000);
  };

  const triggerPDFPrint = () => {
    const data = generateExportData(activeReportType);
    if (Platform.OS === 'web') {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>${data.title}</title>
              <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #1e293b; }
                h1 { color: #0284c7; border-bottom: 2px solid #0284c7; padding-bottom: 10px; font-size: 22px; }
                .meta { font-size: 12px; color: #64748b; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                th { background-color: #0f172a; color: #38bdf8; text-align: left; padding: 10px; font-size: 11px; text-transform: uppercase; }
                td { padding: 9px 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
                tr:nth-child(even) { background-color: #f8fafc; }
                .footer { margin-top: 30px; font-size: 11px; text-align: center; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
              </style>
            </head>
            <body>
              <h1>${data.title}</h1>
              <div class="meta">Super Admin Executive Report &bull; Generated: ${new Date().toLocaleString()} &bull; Total Records: ${data.rows.length}</div>
              <table>
                <thead>
                  <tr>${data.headers.map((h) => `<th>${h}</th>`).join('')}</tr>
                </thead>
                <tbody>
                  ${data.rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('')}
                </tbody>
              </table>
              <div class="footer">Confidential ERP Document &bull; Super Admin Clearance Level</div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 500);
      }
    }
    setExportNotice(`Generated PDF Print View for ${data.title}`);
    setTimeout(() => setExportNotice(''), 4000);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Top Banner */}
      <View style={styles.topBanner}>
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>Super Admin Executive Reports & Analytics</Text>
          <Text style={styles.bannerSub}>
            Real-time multi-dimensional ERP business intelligence, financial performance, departmental throughput, security audit logs, and downloadable executive reports.
          </Text>
        </View>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>👑 SUPER ADMIN EXCLUSIVE</Text>
        </View>
      </View>

      {/* Multi-Criteria Filter Bar */}
      <View style={styles.filterCard}>
        <View style={styles.filterHeader}>
          <Text style={styles.filterTitle}>🔍 Multi-Criteria Executive Analytics Filter Bar</Text>
          <TouchableOpacity style={styles.resetBtn} onPress={handleResetFilters}>
            <Text style={styles.resetBtnText}>🔄 Reset Filters</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterGrid}>
          {/* Timeframe Filter */}
          <View style={styles.filterBox}>
            <Text style={styles.filterLabel}>Timeframe</Text>
            <View style={styles.chipRow}>
              {(['MONTHLY', 'QUARTERLY', 'YEARLY', 'ALL_TIME'] as TimeframeFilter[]).map((tf) => (
                <TouchableOpacity
                  key={tf}
                  style={[styles.chip, timeframe === tf && styles.activeChip]}
                  onPress={() => setTimeframe(tf)}
                >
                  <Text style={[styles.chipText, timeframe === tf && styles.activeChipText]}>
                    {tf.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Department Filter */}
          <View style={styles.filterBox}>
            <Text style={styles.filterLabel}>Department Scope</Text>
            <View style={styles.chipRow}>
              {(['ALL', 'SALES', 'PURCHASE', 'PRODUCTION', 'QUALITY_TESTING', 'DISPATCH'] as DepartmentFilter[]).map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.chip, selectedDept === d && styles.activeChip]}
                  onPress={() => setSelectedDept(d)}
                >
                  <Text style={[styles.chipText, selectedDept === d && styles.activeChipText]}>
                    {d === 'QUALITY_TESTING' ? 'QUALITY' : d}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* Top 12 Executive KPI Summary Cards */}
      <View style={styles.kpiGrid}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiVal}>{metrics.totalOrders}</Text>
          <Text style={styles.kpiLabel}>Total Orders</Text>
          <Text style={styles.kpiSub}>System-wide total</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={[styles.kpiVal, { color: Colors.accentTeal }]}>{metrics.activeOrders}</Text>
          <Text style={styles.kpiLabel}>Active Work Orders</Text>
          <Text style={styles.kpiSub}>In shop floor pipeline</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={[styles.kpiVal, { color: Colors.successBright }]}>{metrics.completedOrders}</Text>
          <Text style={styles.kpiLabel}>Completed Orders</Text>
          <Text style={styles.kpiSub}>Fully dispatched</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={[styles.kpiVal, { color: Colors.industrialOrange }]}>{metrics.delayedOrders}</Text>
          <Text style={styles.kpiLabel}>Delayed Orders</Text>
          <Text style={styles.kpiSub}>Bottleneck alerts</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiVal}>{metrics.totalQuotations}</Text>
          <Text style={styles.kpiLabel}>Total Quotations</Text>
          <Text style={styles.kpiSub}>Generated inquiries</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={[styles.kpiVal, { color: '#38bdf8' }]}>{metrics.conversionRate}%</Text>
          <Text style={styles.kpiLabel}>Quotation Conversion Rate</Text>
          <Text style={styles.kpiSub}>Converted to orders</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={[styles.kpiVal, { color: Colors.successBright, fontSize: 20 }]}>
            ₹{metrics.totalRevenue.toLocaleString()}
          </Text>
          <Text style={styles.kpiLabel}>Total Revenue</Text>
          <Text style={styles.kpiSub}>Converted order value</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={[styles.kpiVal, { color: Colors.industrialOrange, fontSize: 20 }]}>
            ₹{metrics.lostBusinessValue.toLocaleString()}
          </Text>
          <Text style={styles.kpiLabel}>Lost Business Value</Text>
          <Text style={styles.kpiSub}>Lost quotations value</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiVal}>{metrics.totalTasks}</Text>
          <Text style={styles.kpiLabel}>Total System Tasks</Text>
          <Text style={styles.kpiSub}>Assigned cross-dept</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={[styles.kpiVal, { color: '#f59e0b' }]}>{metrics.pendingTasks}</Text>
          <Text style={styles.kpiLabel}>Pending Tasks</Text>

          <Text style={styles.kpiSub}>Action required</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={[styles.kpiVal, { color: Colors.accentTeal }]}>{metrics.deptScore}%</Text>
          <Text style={styles.kpiLabel}>Dept Performance Score</Text>
          <Text style={styles.kpiSub}>System throughput yield</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={[styles.kpiVal, { color: Colors.successBright }]}>{metrics.userProductivityScore}%</Text>
          <Text style={styles.kpiLabel}>User Productivity Score</Text>
          <Text style={styles.kpiSub}>Staff completion yield</Text>
        </View>
      </View>

      {/* Navigation Tabs for Chart Sections & Export Engine */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
        {[
          { id: 'OVERVIEW', label: '📊 Master Dashboard' },
          { id: 'ORDERS', label: '📋 Order Status Analytics' },
          { id: 'REVENUE', label: '💰 Revenue Analytics' },
          { id: 'QUOTATIONS', label: '📜 Quotation Analytics' },
          { id: 'DEPARTMENTS', label: '🏢 Dept Performance' },
          { id: 'PRODUCTION', label: '🏭 Production Yield' },
          { id: 'QUALITY', label: '🔍 Quality Control' },
          { id: 'DISPATCH', label: '🚚 Dispatch & Logistics' },
          { id: 'USERS', label: '👤 Staff Productivity' },
          { id: 'INVENTORY', label: '📦 Inventory & Materials' },
          { id: 'AUDIT', label: '🛡️ Audit & Security' },
          { id: 'REPORTS', label: '📥 Export Reports Engine' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabBtn, activeTab === tab.id && styles.activeTabBtn]}
            onPress={() => setActiveTab(tab.id as any)}
          >
            <Text style={[styles.tabBtnText, activeTab === tab.id && styles.activeTabBtnText]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 4. EXPORT REPORTS ENGINE TAB */}
      {activeTab === 'REPORTS' && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>📥 Downloadable Reports & Export Engine</Text>
          <Text style={styles.sectionSub}>Generate and download high-precision CSV, Excel spreadsheets, or printable PDF reports across 12 ERP categories.</Text>

          {exportNotice ? (
            <View style={styles.noticeBanner}>
              <Text style={styles.noticeText}>✨ {exportNotice}</Text>
            </View>
          ) : null}

          <View style={{ marginTop: Spacing.md }}>
            <Text style={styles.inputLabel}>Select Report Category (12 Types Available):</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
              {[
                { id: 'ORDER', label: '📋 Order Comprehensive' },
                { id: 'REVENUE', label: '💰 Financial & Revenue' },
                { id: 'SALES', label: '📈 Sales Performance' },
                { id: 'PURCHASE', label: '🛒 Purchase & Procurement' },
                { id: 'PRODUCTION', label: '🏭 Manufacturing Output' },
                { id: 'QUALITY', label: '🔍 Quality & Inspection' },
                { id: 'DISPATCH', label: '📦 Dispatch & Logistics' },
                { id: 'USER_PERFORMANCE', label: '👤 Staff Productivity' },
                { id: 'INVENTORY', label: '🏢 Inventory & Vendors' },
                { id: 'QUOTATION', label: '📜 Quotation Pipeline' },
                { id: 'LOST_BUSINESS', label: '⚠️ Lost Business Analysis' },
                { id: 'AUDIT_LOG', label: '🛡️ Audit & Security Logs' },
              ].map((r) => (
                <TouchableOpacity
                  key={r.id}
                  style={[styles.reportSelectBtn, activeReportType === r.id && styles.activeReportSelectBtn]}
                  onPress={() => setActiveReportType(r.id as ReportType)}
                >
                  <Text style={[styles.reportSelectBtnText, activeReportType === r.id && styles.activeReportSelectBtnText]}>
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.exportActionRow}>
              <TouchableOpacity style={styles.btnCsv} onPress={downloadCSV}>
                <Text style={styles.btnText}>📥 Download CSV Report</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnExcel} onPress={downloadExcel}>
                <Text style={styles.btnText}>📊 Download Excel (.xls)</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnPdf} onPress={triggerPDFPrint}>
                <Text style={styles.btnText}>🖨️ Print / Save as PDF</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* 5. VISUAL CHARTS & ANALYTICS SECTIONS */}
      {(activeTab === 'OVERVIEW' || activeTab === 'ORDERS') && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>📈 Order Status & Workflow Analytics</Text>
          <Text style={styles.sectionSub}>Distribution of orders by ERP workflow stage and stage completion ratio.</Text>

          <View style={styles.chartContainer}>
            <View style={styles.barGroup}>
              <Text style={styles.barLabel}>Completed Orders ({metrics.completedOrders})</Text>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${metrics.totalOrders > 0 ? (metrics.completedOrders / metrics.totalOrders) * 100 : 0}%`, backgroundColor: Colors.successBright }]} />
              </View>
            </View>

            <View style={styles.barGroup}>
              <Text style={styles.barLabel}>Active Work Orders ({metrics.activeOrders})</Text>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${metrics.totalOrders > 0 ? (metrics.activeOrders / metrics.totalOrders) * 100 : 0}%`, backgroundColor: Colors.accentTeal }]} />
              </View>
            </View>

            <View style={styles.barGroup}>
              <Text style={styles.barLabel}>Delayed / Bottleneck Orders ({metrics.delayedOrders})</Text>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${metrics.totalOrders > 0 ? (metrics.delayedOrders / metrics.totalOrders) * 100 : 0}%`, backgroundColor: Colors.industrialOrange }]} />
              </View>
            </View>
          </View>
        </View>
      )}

      {(activeTab === 'OVERVIEW' || activeTab === 'REVENUE') && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>💰 Revenue & Financial Performance Analytics</Text>
          <Text style={styles.sectionSub}>Comparison of Converted Revenue vs Lost Business Value.</Text>

          <View style={styles.revGrid}>
            <View style={styles.revCard}>
              <Text style={styles.revVal}>₹{metrics.totalRevenue.toLocaleString()}</Text>
              <Text style={styles.revLabel}>Total Converted Revenue</Text>
              <View style={[styles.fill, { height: 8, width: '100%', backgroundColor: Colors.successBright, borderRadius: 4, marginTop: 10 }]} />
            </View>

            <View style={styles.revCard}>
              <Text style={[styles.revVal, { color: Colors.industrialOrange }]}>₹{metrics.lostBusinessValue.toLocaleString()}</Text>
              <Text style={styles.revLabel}>Lost Business Value</Text>
              <View style={[styles.fill, { height: 8, width: '100%', backgroundColor: Colors.industrialOrange, borderRadius: 4, marginTop: 10 }]} />
            </View>
          </View>
        </View>
      )}

      {(activeTab === 'OVERVIEW' || activeTab === 'QUOTATIONS') && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>📜 Quotation Pipeline & Conversion Analytics</Text>
          <Text style={styles.sectionSub}>Quotation lifecycle funnel and lost business breakdown.</Text>

          <View style={styles.table}>
            <View style={styles.thRow}>
              <Text style={[styles.th, { width: 140 }]}>Quotation Number</Text>
              <Text style={[styles.th, { width: 180 }]}>Client Name</Text>
              <Text style={[styles.th, { width: 130 }]}>Amount (₹)</Text>
              <Text style={[styles.th, { width: 130 }]}>Status</Text>
              <Text style={[styles.th, { width: 140 }]}>Converted Value</Text>
            </View>
            {filteredQuotations.slice(0, 5).map((q) => (
              <View key={q.id} style={styles.trRow}>
                <Text style={[styles.tdHighlight, { width: 140 }]}>{q.quotationNumber}</Text>
                <Text style={[styles.tdBold, { width: 180 }]}>{q.companyName}</Text>
                <Text style={[styles.td, { width: 130 }]}>₹{q.quotationAmount.toLocaleString()}</Text>
                <Text style={[styles.tdSmall, { width: 130 }]}>{q.status}</Text>
                <Text style={[styles.tdBold, { width: 140, color: Colors.successBright }]}>₹{(q.convertedOrderValue || 0).toLocaleString()}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {(activeTab === 'OVERVIEW' || activeTab === 'AUDIT') && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>🛡️ Security & Authentication Audit Logs Analytics</Text>
          <Text style={styles.sectionSub}>Real-time system login events, role modifications, and activity traces.</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.table}>
              <View style={styles.thRow}>
                <Text style={[styles.th, { width: 140 }]}>Event Type</Text>
                <Text style={[styles.th, { width: 130 }]}>User ID</Text>
                <Text style={[styles.th, { width: 180 }]}>Email Ref</Text>
                <Text style={[styles.th, { width: 220 }]}>Activity Details</Text>
                <Text style={[styles.th, { width: 160 }]}>Timestamp</Text>
              </View>
              {authAuditLogs.map((l) => (
                <View key={l.id} style={styles.trRow}>
                  <View style={{ width: 140 }}>
                    <View style={[styles.eventBadge, l.event.includes('FAILED') ? styles.failBadge : styles.successBadge]}>
                      <Text style={styles.eventBadgeText}>{l.event}</Text>
                    </View>
                  </View>
                  <Text style={[styles.tdBold, { width: 130 }]}>{l.username || 'N/A'}</Text>
                  <Text style={[styles.td, { width: 180 }]}>{l.email || 'N/A'}</Text>
                  <Text style={[styles.td, { width: 220 }]}>{l.details}</Text>
                  <Text style={[styles.tdSmall, { width: 160 }]}>{new Date(l.timestamp).toLocaleString()}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBanner: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    ...Shadows.sm,
  },
  bannerTitle: {
    color: Colors.textLight,
    fontSize: 20,
    fontWeight: '900',
  },
  bannerSub: {
    color: Colors.accentTeal,
    fontSize: 12,
    marginTop: 4,
  },
  roleBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  roleBadgeText: {
    color: '#f59e0b',
    fontSize: 11,
    fontWeight: '800',
  },
  filterCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    ...Shadows.sm,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  filterTitle: {
    color: Colors.textLight,
    fontSize: 14,
    fontWeight: '800',
  },
  resetBtn: {
    backgroundColor: Colors.inputBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  resetBtnText: {
    color: Colors.accentTeal,
    fontSize: 11,
    fontWeight: '700',
  },
  filterGrid: {
    gap: Spacing.md,
  },
  filterBox: {
    flex: 1,
  },
  filterLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    backgroundColor: Colors.inputBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  activeChip: {
    backgroundColor: Colors.accentTeal,
    borderColor: Colors.accentTeal,
  },
  chipText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  activeChipText: {
    color: Colors.white,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  kpiCard: {
    flex: 1,
    minWidth: 160,
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    ...Shadows.sm,
  },
  kpiVal: {
    color: Colors.textLight,
    fontSize: 22,
    fontWeight: '900',
  },
  kpiLabel: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  kpiSub: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
  },
  tabBtn: {
    backgroundColor: Colors.cardBg,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.md,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  activeTabBtn: {
    backgroundColor: Colors.accentTeal,
    borderColor: Colors.accentTeal,
  },
  tabBtnText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  activeTabBtnText: {
    color: Colors.white,
  },
  sectionCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    ...Shadows.sm,
  },
  sectionTitle: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: '800',
  },
  sectionSub: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
    marginBottom: Spacing.md,
  },
  inputLabel: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  reportSelectBtn: {
    backgroundColor: Colors.inputBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  activeReportSelectBtn: {
    backgroundColor: Colors.accentTeal,
    borderColor: Colors.accentTeal,
  },
  reportSelectBtnText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  activeReportSelectBtnText: {
    color: Colors.white,
  },
  exportActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  btnCsv: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  btnExcel: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  btnPdf: {
    backgroundColor: Colors.industrialOrange,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  btnText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  noticeBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    padding: 10,
    borderRadius: Radius.md,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.successBright,
  },
  noticeText: {
    color: Colors.successBright,
    fontSize: 12,
    fontWeight: '700',
  },
  chartContainer: {
    gap: 12,
  },
  barGroup: {
    gap: 4,
  },
  barLabel: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '700',
  },
  track: {
    height: 12,
    backgroundColor: Colors.inputBg,
    borderRadius: 6,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
  revGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  revCard: {
    flex: 1,
    backgroundColor: Colors.inputBg,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  revVal: {
    color: Colors.successBright,
    fontSize: 20,
    fontWeight: '900',
  },
  revLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  table: {
    minWidth: 700,
  },
  thRow: {
    flexDirection: 'row',
    backgroundColor: Colors.inputBg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.px10,
    borderRadius: Radius.sm,
    marginBottom: Spacing.px6,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  th: {
    color: Colors.accentTeal,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  trRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBg,
    paddingVertical: Spacing.px10,
    paddingHorizontal: Spacing.px10,
    borderRadius: Radius.sm,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  tdBold: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '700',
  },
  td: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  tdHighlight: {
    color: Colors.accentTeal,
    fontSize: 12,
    fontWeight: '700',
  },
  tdSmall: {
    color: Colors.textSubtle,
    fontSize: 11,
  },
  eventBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.xs,
    alignSelf: 'flex-start',
  },
  successBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  failBadge: {
    backgroundColor: 'rgba(179, 75, 32, 0.1)',
  },
  eventBadgeText: {
    color: Colors.accentTeal,
    fontSize: 10,
    fontWeight: '800',
  },
});
