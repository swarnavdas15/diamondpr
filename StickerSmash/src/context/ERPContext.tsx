import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Order,
  Client,
  Task,
  CalendarEvent,
  StageLog,
  QuantityLog,
  Role,
  DepartmentStatus,
  SalesWorkflowStage,
  QCResult,
  Priority,
  TaskStatus,
  CalendarEventType,
  OrderDrawing,
  DrawingStatus,
  Vendor,
  VendorStatus,
  Quotation,
  QuotationStatus,
  LostReason,
  FollowUpStatus,
  QuotationFollowUp,
  CompanyContact,
  CompanyImportantDate,
  CustomStage,
  PurchaseBatch,
} from '../types';
import { useAuth } from './AuthContext';
import { apiClient } from '../api/client';

interface ERPContextType {
  refreshData: () => Promise<void>;
  orders: Order[];
  getMaskedOrders: () => Order[];
  clients: Client[];
  companyContacts: CompanyContact[];
  addCompanyContact: (contact: Omit<CompanyContact, 'id' | 'createdAt'>) => Promise<CompanyContact>;
  uploadCompanyContactProfileImage: (contactId: string, uri: string, name: string, type: string) => Promise<void>;
  updateCompanyContact: (id: string, data: Partial<CompanyContact>) => void;
  deleteCompanyContact: (id: string) => void;
  companyImportantDates: CompanyImportantDate[];
  addCompanyImportantDate: (data: Omit<CompanyImportantDate, 'id' | 'createdAt'>) => CompanyImportantDate;
  deleteCompanyImportantDate: (id: string) => void;
  vendors: Vendor[];
  quotations: Quotation[];
  tasks: Task[];
  calendarEvents: CalendarEvent[];
  selectedOrder: Order | null;
  setSelectedOrder: (order: Order | null) => void;

  createQuotation: (data: {
    companyName: string;
    clientCode: string;
    clientId?: string;
    contactPerson: string;
    mobileNumber: string;
    email: string;
    inquiryRef?: string;
    quotationAmount: number;
    expectedOrderValue?: number;
    salesExecutive: string;
    followUpDate?: string;
    status?: QuotationStatus;
    remarks?: string;
  }) => Quotation;

  updateQuotation: (id: string, data: Partial<Quotation>) => void;

  addQuotationFollowUp: (
    quotationId: string,
    data: { followUpDate: string; notes: string; status: FollowUpStatus }
  ) => void;

  convertQuotationToOrder: (
    quotationId: string,
    data: {
      convertedOrderValue: number;
      poNumber?: string;
      technicalRequirements?: string;
      materialRequirements?: string;
      requiredQuantity?: number;
      purchaseRequired?: boolean;
      productionRequired?: boolean;
      qualityTestingRequired?: boolean;
      dispatchRequired?: boolean;
      customStages?: Omit<CustomStage, 'id' | 'createdAt' | 'status'>[];
      items?: Array<{ itemName: string; size: string; quantity: number; unitPrice?: number }>;
    }
  ) => Promise<Order>;

  markQuotationLost: (
    quotationId: string,
    data: {
      lostReason: LostReason;
      lostValue?: number;
      lostRemarks?: string;
      lostDate?: string;
    }
  ) => void;

  createVendor: (data: Omit<Vendor, 'id' | 'createdAt'>) => Vendor;
  updateVendor: (vendorId: string, data: Partial<Vendor>) => void;
  deleteVendor: (vendorId: string) => void;

  createClient: (data: {
    clientCode: string;
    companyName: string;
    contactName?: string;
    contactNo: string;
    email?: string;
    address?: string;
    gstNumber?: string;
    panNumber?: string;
    websiteUrl?: string;
    industry?: string;
    remarks?: string;
  }) => Promise<Client>;
  updateClient: (id: string, data: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  uploadClientProfileImage: (clientId: string, uri: string, name: string, type: string) => Promise<void>;
  uploadPrimaryContactProfileImage: (clientId: string, uri: string, name: string, type: string) => Promise<void>;
  updateOrder: (id: string, data: Partial<Order>) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  deleteQuotation: (id: string) => void;
  createOrder: (data: {
    poNumber: string;
    clientId: string;
    budget?: number;
    technicalRequirements?: string;
    materialRequirements?: string;
    requiredQuantity?: number;
    purchaseRequired: boolean;
    productionRequired: boolean;
    qualityTestingRequired: boolean;
    dispatchRequired: boolean;
    customStages?: CustomStage[];
    items?: Array<{ itemName: string; size: string; quantity: number; unitPrice?: number }>;
  }) => Promise<Order>;

  updateSalesWorkflowStage: (orderId: string, stage: SalesWorkflowStage, remarks?: string) => void;
  uploadOrderDrawing: (
    orderId: string,
    data: {
      drawingNumber: string;
      drawingName: string;
      fileName: string;
      fileType: 'PDF' | 'PNG' | 'JPG' | 'JPEG' | 'DWG' | 'DXF';
      fileUri?: string;
      fileSize?: string;
    }
  ) => OrderDrawing;
  updateDrawingStatus: (orderId: string, drawingId: string, status: DrawingStatus, remarks?: string) => void;
  deleteOrderDrawing: (orderId: string, drawingId: string) => void;

  updatePurchaseStage: (orderId: string, status: DepartmentStatus, vendorSelected?: string, procurementNotes?: string, processedQty?: number) => void;
  addPurchaseBatch: (orderId: string, batch: Omit<PurchaseBatch, 'id' | 'orderId' | 'createdByName' | 'createdAt'>) => PurchaseBatch;
  updateProductionStage: (orderId: string, status: DepartmentStatus, shopFloorNotes?: string, processedQty?: number, isRework?: boolean) => void;
  updateQualityStage: (orderId: string, status: DepartmentStatus, qcResult?: QCResult, qcRemarks?: string, processedQty?: number, passedQty?: number, failedQty?: number) => void;
  updateDispatchStage: (orderId: string, status: DepartmentStatus, logisticsEntry?: string, transportRef?: string, dispatchNotes?: string, processedQty?: number) => void;
  verifyAndCloseOrder: (orderId: string, remarks?: string) => void;

  createTask: (data: {
    title: string;
    description?: string;
    priority: Priority;
    assignedToDepartment?: Role;
    assignedToUserId?: string;
    assignedToName?: string;
    orderId?: string;
    dueDate?: string;
  }) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  deleteTask: (taskId: string) => void;

  createCalendarEvent: (data: { title: string; type: CalendarEventType; eventDate: string; description?: string }) => void;
  deleteCalendarEvent: (eventId: string) => void;
}

const INITIAL_CLIENTS: Client[] = [
  {
    id: 'cl-1',
    clientCode: 'CL-1001',
    companyName: 'Apex Heavy Engineering Pvt Ltd',
    contactName: 'Rajesh Mehta',
    contactNo: '+91 98765 43210',
    email: 'contact@apexheavy.com',
    address: 'Plot 42, Industrial Area Phase II, Pune',
    gstNumber: '27AAACA12341Z5',
    createdAt: '2026-09-01T10:00:00Z',
  },
  {
    id: 'cl-2',
    clientCode: 'CL-1002',
    companyName: 'Bharat Forgings & Piping Co.',
    contactName: 'Vikram Singh',
    contactNo: '+91 91234 56789',
    email: 'vikram@bharatforgings.com',
    address: 'GIDC Estate, Sector 5, Vadodara',
    gstNumber: '24AAACB98761Z2',
    createdAt: '2026-09-05T11:30:00Z',
  },
];

const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-101',
    orderNumber: 'ORD-2026-001',
    poNumber: 'PO-APEX-9981',
    clientId: 'cl-1',
    clientCode: 'CL-1001',
    clientName: 'Apex Heavy Engineering Pvt Ltd',
    contactNo: '+91 98765 43210',
    email: 'contact@apexheavy.com',
    address: 'Plot 42, Industrial Area Phase II, Pune',
    budget: 225000,
    technicalRequirements: 'High Pressure Stainless Steel Flanges SS316L, 600# Rating, Serrated Finish.',
    materialRequirements: 'SS316L Round Bars Dia 250mm',
    requiredQuantity: 50,
    purchaseQuantity: 50,
    productionQuantity: 30,
    qcQuantity: 25,
    dispatchQuantity: 10,
    status: 'IN_PROGRESS',
    drawingApproved: true,

    quantityLogs: [
      {
        id: 'ql-1',
        orderId: 'ord-101',
        stage: 'PURCHASE',
        processedQty: 50,
        accumulatedQty: 50,
        remainingQty: 0,
        totalQty: 50,
        actionLabel: 'Received 50 PCS Raw Material',
        remarks: 'SS316L material procured from Jindal Stainless Steel Works',
        changedByName: 'Ramesh Patel',
        changedByRole: 'PURCHASE',
        createdAt: '2026-09-12T14:30:00Z',
      },
      {
        id: 'ql-2',
        orderId: 'ord-101',
        stage: 'PRODUCTION',
        processedQty: 30,
        accumulatedQty: 30,
        remainingQty: 20,
        totalQty: 50,
        actionLabel: 'Produced 30 PCS Finished Goods',
        remarks: 'Batch #1 machining completed on CNC unit #4',
        changedByName: 'Suresh Kumar',
        changedByRole: 'PRODUCTION',
        createdAt: '2026-09-15T11:00:00Z',
      },
      {
        id: 'ql-3',
        orderId: 'ord-101',
        stage: 'QUALITY_TESTING',
        processedQty: 25,
        accumulatedQty: 25,
        remainingQty: 5,
        totalQty: 50,
        actionLabel: 'QC Inspected 25 PCS (PASSED)',
        remarks: 'Hydrostatic testing & NDT inspection passed',
        changedByName: 'Anil Sharma',
        changedByRole: 'QUALITY_TESTING',
        createdAt: '2026-09-18T16:20:00Z',
      },
      {
        id: 'ql-4',
        orderId: 'ord-101',
        stage: 'DISPATCH',
        processedQty: 10,
        accumulatedQty: 10,
        remainingQty: 40,
        totalQty: 50,
        actionLabel: 'Dispatched 10 PCS Shipment',
        remarks: 'VRL Logistics Container Truck #MH-12-AB-9876',
        changedByName: 'Deepak Verma',
        changedByRole: 'DISPATCH',
        createdAt: '2026-09-20T10:15:00Z',
      },
    ],

    // Pipeline Customizer setup
    purchaseRequired: true,
    productionRequired: true,
    qualityTestingRequired: true,
    dispatchRequired: true,

    salesWorkflowStage: 'ORDER_CONFIRMED',

    purchaseStatus: 'COMPLETED',
    vendorSelected: 'Jindal Stainless Steel Works',
    procurementNotes: 'Raw material SS316L billets received and verified in stock.',

    productionStatus: 'IN_PROGRESS',
    shopFloorNotes: 'CNC Turning and Serration machining 60% completed on Unit 4 (30/50 PCS).',

    qualityStatus: 'IN_PROGRESS',
    qcResult: 'PASSED',

    dispatchStatus: 'IN_PROGRESS',
    salesVerification: 'PENDING',

    items: [
      { id: 'item-1', itemName: 'SS316L Weld Neck Flange', size: '6 inch 600# RF', quantity: 50, unitPrice: 4500 },
    ],
    stageLogs: [
      {
        id: 'log-1',
        department: 'SALES',
        action: 'Order Confirmed',
        currentStatus: 'ORDER_CONFIRMED',
        remarks: 'Client approved drawing & PO verified.',
        changedByName: 'Vikram Malhotra',
        changedByRole: 'SALES',
        createdAt: '2026-09-10T09:00:00Z',
      },
      {
        id: 'log-2',
        department: 'PURCHASE',
        action: 'Purchase Done',
        currentStatus: 'COMPLETED',
        remarks: 'SS316L material procured from Jindal Stainless Steel Works.',
        changedByName: 'Ramesh Patel',
        changedByRole: 'PURCHASE',
        createdAt: '2026-09-12T14:30:00Z',
      },
      {
        id: 'log-3',
        department: 'PRODUCTION',
        action: 'Start Production',
        currentStatus: 'IN_PROGRESS',
        remarks: 'Machining started on CNC lathe.',
        changedByName: 'Suresh Kumar',
        changedByRole: 'PRODUCTION',
        createdAt: '2026-09-14T08:15:00Z',
      },
    ],
    createdAt: '2026-09-10T09:00:00Z',
    updatedAt: '2026-09-14T08:15:00Z',
  },
  {
    id: 'ord-102',
    orderNumber: 'ORD-2026-002',
    poNumber: 'PO-BFP-5542',
    clientId: 'cl-2',
    clientCode: 'CL-1002',
    clientName: 'Bharat Forgings & Piping Co.',
    contactNo: '+91 91234 56789',
    email: 'vikram@bharatforgings.com',
    address: 'GIDC Estate, Sector 5, Vadodara',
    budget: 220000,
    technicalRequirements: 'Carbon Steel Blind Flanges A105, 300# Rating, Zinc Plated.',
    materialRequirements: 'A105 Forged Blanks',
    requiredQuantity: 100,
    status: 'IN_PROGRESS',
    drawingApproved: true,

    // Pipeline Customizer setup (No Quality Testing demo)
    purchaseRequired: true,
    productionRequired: true,
    qualityTestingRequired: false,
    dispatchRequired: true,

    salesWorkflowStage: 'ORDER_CONFIRMED',

    purchaseStatus: 'COMPLETED',
    vendorSelected: 'Global Steel Supply Inc.',

    productionStatus: 'COMPLETED',
    shopFloorNotes: 'Forging & machining 100% completed. Ready for dispatch.',

    qualityStatus: 'COMPLETED',
    qcResult: 'PASSED',

    dispatchStatus: 'PENDING',
    salesVerification: 'PENDING',

    items: [
      { id: 'item-2', itemName: 'A105 Blind Flange', size: '4 inch 300#', quantity: 100, unitPrice: 2200 },
    ],
    stageLogs: [
      {
        id: 'log-4',
        department: 'SALES',
        action: 'Order Confirmed',
        currentStatus: 'ORDER_CONFIRMED',
        remarks: 'Order initiated with direct dispatch pipeline.',
        changedByName: 'Vikram Malhotra',
        changedByRole: 'SALES',
        createdAt: '2026-09-11T10:00:00Z',
      },
      {
        id: 'log-5',
        department: 'PURCHASE',
        action: 'Purchase Verified',
        currentStatus: 'COMPLETED',
        remarks: 'Blanks delivered to shop floor.',
        changedByName: 'Ramesh Patel',
        changedByRole: 'PURCHASE',
        createdAt: '2026-09-13T11:00:00Z',
      },
      {
        id: 'log-6',
        department: 'PRODUCTION',
        action: 'Production Done',
        currentStatus: 'COMPLETED',
        remarks: 'Work order completed ahead of schedule.',
        changedByName: 'Suresh Kumar',
        changedByRole: 'PRODUCTION',
        createdAt: '2026-09-16T16:00:00Z',
      },
    ],
    createdAt: '2026-09-11T10:00:00Z',
    updatedAt: '2026-09-16T16:00:00Z',
  },
];

const INITIAL_TASKS: Task[] = [
  {
    id: 'tsk-1',
    orderId: 'ord-101',
    orderNumber: 'ORD-2026-001',
    title: 'Verify SS316L Mill Test Certificate (MTC)',
    description: 'Inspect material chemical & tensile test report from Jindal Stainless.',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    assignedToDepartment: 'QUALITY_TESTING',
    createdByName: 'Ramesh Patel',
    createdByRole: 'PURCHASE',
    dueDate: '2026-09-25',
    createdAt: '2026-09-12T15:00:00Z',
  },
  {
    id: 'tsk-2',
    orderId: 'ord-102',
    orderNumber: 'ORD-2026-002',
    title: 'Prepare Transport Vehicle & E-Way Bill',
    description: 'Arrange 10-ton container truck for shipment to Vadodara.',
    priority: 'MEDIUM',
    status: 'PENDING',
    assignedToDepartment: 'DISPATCH',
    createdByName: 'Suresh Kumar',
    createdByRole: 'PRODUCTION',
    dueDate: '2026-09-26',
    createdAt: '2026-09-16T17:00:00Z',
  },
  {
    id: 'tsk-3',
    title: 'Calibrate CNC Lathe Tool Sensors',
    description: 'Routine quarterly maintenance and sensor calibration.',
    priority: 'MEDIUM',
    status: 'PENDING',
    assignedToDepartment: 'PRODUCTION',
    createdByName: 'Plant Operations Admin',
    createdByRole: 'ADMIN',
    dueDate: '2026-09-28',
    createdAt: '2026-09-15T09:00:00Z',
  },
];

const INITIAL_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: 'cal-1',
    title: 'Third-Party Inspection (TPI) Meeting - ORD-2026-001',
    type: 'MEETING',
    eventDate: '2026-09-23',
    description: 'Lloyds Register inspector visiting plant for hydro-test verification.',
    createdByName: 'Super Admin',
  },
  {
    id: 'cal-2',
    title: 'Material Delivery Deadline - PO-BFP-5542',
    type: 'DEADLINE',
    eventDate: '2026-09-26',
    description: 'Final shipment delivery target for Bharat Forgings.',
    createdByName: 'Vikram Malhotra',
  },
  {
    id: 'cal-3',
    title: 'ISO 9001:2015 Recertification Audit Milestone',
    type: 'MILESTONE',
    eventDate: '2026-09-30',
    description: 'Annual quality assurance audit across all shop floors.',
    createdByName: 'Plant Operations Admin',
  },
];

const INITIAL_VENDORS: Vendor[] = [
  {
    id: 'vnd-1',
    vendorCode: 'VND-1001',
    vendorName: 'Jindal Stainless Steel Works',
    companyName: 'Jindal Stainless Ltd',
    gstNumber: '06AAACJ1234F1Z9',
    panNumber: 'AAACJ1234F',
    contactPerson: 'Harish Jindal',
    mobileNumber: '+91 98120 11223',
    alternateMobile: '+91 98120 99887',
    email: 'sales@jindalstainless.com',
    website: 'https://jindalstainless.com',
    addressLine1: 'Industrial Focal Point Phase 1',
    city: 'Hisar',
    state: 'Haryana',
    pinCode: '125005',
    country: 'India',
    materialSupplied: 'SS Raw Billets & Forgings',
    vendorCategory: 'Raw Material Supplier',
    paymentTerms: 'Net 30',
    leadTime: '7 Days',
    status: 'ACTIVE',
    remarks: 'Tier-1 Stainless Steel Forging Billet Supplier',
    createdAt: '2026-09-01T10:00:00Z',
  },
  {
    id: 'vnd-2',
    vendorCode: 'VND-1002',
    vendorName: 'Global Steel Supply Inc.',
    companyName: 'Global Steel Corp',
    gstNumber: '27AABCG5678H1Z2',
    panNumber: 'AABCG5678H',
    contactPerson: 'Sanjay Shah',
    mobileNumber: '+91 98200 44556',
    email: 'info@globalsteel.com',
    city: 'Mumbai',
    state: 'Maharashtra',
    pinCode: '400001',
    country: 'India',
    materialSupplied: 'Carbon Steel A105 Blanks',
    vendorCategory: 'Blank Supplier',
    paymentTerms: 'Net 15',
    leadTime: '5 Days',
    status: 'ACTIVE',
    remarks: 'Approved Carbon Steel Flange Blanks',
    createdAt: '2026-09-05T10:00:00Z',
  },
  {
    id: 'vnd-3',
    vendorCode: 'VND-1003',
    vendorName: 'Bharat Forgings Vendor Unit A',
    companyName: 'Bharat Forgings Ltd',
    gstNumber: '27AAACB9876K1Z4',
    panNumber: 'AAACB9876K',
    contactPerson: 'Pravin Kulkarni',
    mobileNumber: '+91 98900 12345',
    email: 'pune.sales@bharatforgings.com',
    city: 'Pune',
    state: 'Maharashtra',
    pinCode: '411014',
    country: 'India',
    materialSupplied: 'Heavy Machine Tools & Dies',
    vendorCategory: 'Tooling & Dies',
    paymentTerms: 'Advance 20%',
    leadTime: '14 Days',
    status: 'ACTIVE',
    remarks: 'Custom Die Casting & Heavy Machining Tooling',
    createdAt: '2026-09-10T10:00:00Z',
  },
];

const INITIAL_QUOTATIONS: Quotation[] = [
  {
    id: 'qt-101',
    quotationNumber: 'QT-2026-001',
    quotationDate: '2026-09-10',
    companyName: 'Apex Heavy Engineering Pvt Ltd',
    clientCode: 'CL-1001',
    clientId: 'cl-1',
    contactPerson: 'Rajesh Mehta',
    mobileNumber: '+91 98765 43210',
    email: 'contact@apexheavy.com',
    inquiryRef: 'INQ-APEX-554',
    quotationAmount: 1000000,
    expectedOrderValue: 1000000,
    salesExecutive: 'Vikram Malhotra',
    followUpDate: '2026-09-28',
    status: 'NEGOTIATION',
    remarks: 'High pressure SS316L forged flange supply quotation.',
    followUps: [
      {
        id: 'fup-1',
        quotationId: 'qt-101',
        followUpDate: '2026-09-15',
        notes: 'Initial quotation submitted via email. Client requested technical spec clarification.',
        status: 'COMPLETED',
        createdByName: 'Vikram Malhotra',
        createdAt: '2026-09-15T11:00:00Z',
      },
    ],
    createdAt: '2026-09-10T10:00:00Z',
    updatedAt: '2026-09-15T11:00:00Z',
  },
  {
    id: 'qt-102',
    quotationNumber: 'QT-2026-002',
    quotationDate: '2026-09-12',
    companyName: 'Bharat Forgings & Piping Co.',
    clientCode: 'CL-1002',
    clientId: 'cl-2',
    contactPerson: 'Vikram Singh',
    mobileNumber: '+91 91234 56789',
    email: 'vikram@bharatforgings.com',
    inquiryRef: 'INQ-BF-882',
    quotationAmount: 750000,
    expectedOrderValue: 750000,
    salesExecutive: 'Vikram Malhotra',
    followUpDate: '2026-09-26',
    status: 'APPROVED',
    remarks: 'Carbon Steel Blind Flanges batch quotation.',
    createdAt: '2026-09-12T14:30:00Z',
    updatedAt: '2026-09-20T09:00:00Z',
  },
  {
    id: 'qt-103',
    quotationNumber: 'QT-2026-003',
    quotationDate: '2026-09-18',
    companyName: 'Reliance Piping Systems',
    clientCode: 'CL-1003',
    contactPerson: 'Sunil Rao',
    mobileNumber: '+91 98111 22334',
    email: 'sunil.rao@reliancepiping.com',
    inquiryRef: 'INQ-RELIANCE-104',
    quotationAmount: 500000,
    expectedOrderValue: 350000,
    salesExecutive: 'Vikram Malhotra',
    followUpDate: '2026-09-22',
    status: 'LOST',
    remarks: 'Client selected local foundry due to lower freight cost.',
    lostValue: 500000,
    lostDate: '2026-09-22',
    lostReason: 'COMPETITOR_WON',
    lostRemarks: 'Competitor offered 8% lower price with free local delivery.',
    createdAt: '2026-09-18T09:15:00Z',
    updatedAt: '2026-09-22T16:00:00Z',
  },
];

const INITIAL_COMPANY_CONTACTS: CompanyContact[] = [
  // Apex Heavy Engineering (cl-1)
  {
    id: 'cnt-1',
    companyId: 'cl-1',
    fullName: 'Rajesh Mehta',
    designation: 'Managing Director & CEO',
    department: 'Executive Board',
    email: 'rajesh.mehta@apexheavy.com',
    mobile: '+91 98765 43210',
    whatsapp: '919876543210',
    notes: 'Primary executive decision maker and founder.',
    createdAt: '2026-09-01T10:00:00Z',
  },
  {
    id: 'cnt-2',
    companyId: 'cl-1',
    fullName: 'Sanjay Malhotra',
    designation: 'General Manager',
    department: 'Operations',
    email: 'sanjay.m@apexheavy.com',
    mobile: '+91 98765 43211',
    whatsapp: '919876543211',
    reportsToId: 'cnt-1',
    notes: 'Handles plant operations and overall supply agreements.',
    createdAt: '2026-09-02T10:00:00Z',
  },
  {
    id: 'cnt-3',
    companyId: 'cl-1',
    fullName: 'Amit Joshi',
    designation: 'VP - Sales & Business Dev',
    department: 'Sales',
    email: 'amit.j@apexheavy.com',
    mobile: '+91 98765 43212',
    whatsapp: '919876543212',
    reportsToId: 'cnt-1',
    notes: 'Coordinates heavy forging component RFQs.',
    createdAt: '2026-09-02T11:00:00Z',
  },
  {
    id: 'cnt-4',
    companyId: 'cl-1',
    fullName: 'Priya Kulkarni',
    designation: 'Head of Quality Assurance',
    department: 'Quality Control',
    email: 'priya.k@apexheavy.com',
    mobile: '+91 98765 43213',
    whatsapp: '919876543213',
    reportsToId: 'cnt-2',
    notes: 'Strict MTR / NDT certificate testing inspector.',
    createdAt: '2026-09-03T09:00:00Z',
  },
  {
    id: 'cnt-5',
    companyId: 'cl-1',
    fullName: 'Rohan Sharma',
    designation: 'Senior Procurement Manager',
    department: 'Purchase',
    email: 'rohan.s@apexheavy.com',
    mobile: '+91 98765 43214',
    whatsapp: '919876543214',
    reportsToId: 'cnt-2',
    notes: 'Commercial Purchase Order release authority.',
    createdAt: '2026-09-03T10:00:00Z',
  },
  {
    id: 'cnt-6',
    companyId: 'cl-1',
    fullName: 'Aniket Verma',
    designation: 'Flange Purchase Officer',
    department: 'Purchase',
    email: 'aniket.v@apexheavy.com',
    mobile: '+91 98765 43215',
    whatsapp: '919876543215',
    reportsToId: 'cnt-5',
    notes: 'Handles regular SS316L and Carbon Steel flange line item POs.',
    createdAt: '2026-09-04T12:00:00Z',
  },

  // Bharat Forgings (cl-2)
  {
    id: 'cnt-10',
    companyId: 'cl-2',
    fullName: 'Vikram Singh',
    designation: 'Chief Operations Officer',
    department: 'Executive',
    email: 'vikram@bharatforgings.com',
    mobile: '+91 91234 56789',
    whatsapp: '919123456789',
    notes: 'Chief operating officer leading Vadodara unit.',
    createdAt: '2026-09-05T11:30:00Z',
  },
  {
    id: 'cnt-11',
    companyId: 'cl-2',
    fullName: 'Deepak Patel',
    designation: 'Procurement Head',
    department: 'Purchase',
    email: 'deepak.p@bharatforgings.com',
    mobile: '+91 91234 56790',
    whatsapp: '919123456790',
    reportsToId: 'cnt-10',
    notes: 'Manages raw material and valve flange vendor contracts.',
    createdAt: '2026-09-06T10:00:00Z',
  },
];

const INITIAL_COMPANY_IMPORTANT_DATES: CompanyImportantDate[] = [
  {
    id: 'cid-1',
    companyId: 'cl-1',
    title: 'Annual Heavy Flange Supply Rate Contract Renewal',
    dateType: 'CONTRACT_RENEWAL',
    eventDate: '2026-10-15',
    description: 'Annual rate contract review for SS316L and Carbon Steel forged flanges with Apex Heavy Engineering.',
    createdByName: 'Vikram Malhotra',
    createdAt: '2026-09-10T10:00:00Z',
  },
  {
    id: 'cid-2',
    companyId: 'cl-1',
    title: 'Joint Technical ISO Quality & Plant Audit',
    dateType: 'AUDIT',
    eventDate: '2026-11-05',
    description: 'Third-party joint quality inspector audit for high-pressure 600# rating flange certifications.',
    createdByName: 'Priya Kulkarni',
    createdAt: '2026-09-12T11:00:00Z',
  },
  {
    id: 'cid-3',
    companyId: 'cl-1',
    title: 'Founder & MD Rajesh Mehta Birthday',
    dateType: 'MILESTONE',
    eventDate: '2026-11-20',
    description: 'Send formal corporate congratulations and industrial calendar gift package.',
    createdByName: 'Sales Admin',
    createdAt: '2026-09-15T09:00:00Z',
  },
  {
    id: 'cid-4',
    companyId: 'cl-2',
    title: 'Vadodara Plant Expansion Rate Contract Review',
    dateType: 'CONTRACT_RENEWAL',
    eventDate: '2026-10-30',
    description: 'Contract discussion for quarterly forging raw material supplies.',
    createdByName: 'Vikram Singh',
    createdAt: '2026-09-14T14:00:00Z',
  },
];

const ERPContext = createContext<ERPContextType | undefined>(undefined);

export const ERPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, users, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  // Remaining arrays can stay as mock data for now or empty if you prefer, but I'll empty them since user said remove mock data.
  const [companyContacts, setCompanyContacts] = useState<CompanyContact[]>([]);
  const [companyImportantDates, setCompanyImportantDates] = useState<CompanyImportantDate[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Live Backend Fetch
  useEffect(() => {
    if (isAuthenticated) {
      fetchLiveDashboardData();
    }
  }, [isAuthenticated]);

  const fetchLiveDashboardData = async () => {
    try {
      const [clientsRes, ordersRes, contactsRes] = await Promise.all([
        apiClient.get('/clients'),
        apiClient.get('/orders'),
        apiClient.get('/clients/contacts')
      ]);
      const clientsArray = clientsRes.data.clients || clientsRes.data;
      const normalizedClients = Array.isArray(clientsArray) 
        ? clientsArray.map((c: any) => ({ ...c, clientCode: c.clientCode || c.clientcode })) 
        : [];
      setClients(normalizedClients);
      setOrders(ordersRes.data.orders || ordersRes.data);
      setCompanyContacts(contactsRes.data.contacts || []);
    } catch (error) {
      console.error('Failed to fetch ERP data from backend API:', error);
    }
  };

  const addCompanyImportantDate = (data: Omit<CompanyImportantDate, 'id' | 'createdAt'>): CompanyImportantDate => {
    const newDateItem: CompanyImportantDate = {
      ...data,
      id: `cid-${Date.now()}`,
      createdByName: currentUser?.name || 'Sales User',
      createdAt: new Date().toISOString(),
    };
    setCompanyImportantDates((prev) => [newDateItem, ...prev]);
    return newDateItem;
  };

  const deleteCompanyImportantDate = (id: string) => {
    setCompanyImportantDates((prev) => prev.filter((d) => d.id !== id));
  };

  const addCompanyContact = async (data: Omit<CompanyContact, 'id' | 'createdAt'>): Promise<CompanyContact> => {
    try {
      const res = await apiClient.post('/clients/contacts', data);
      await fetchLiveDashboardData();
      return res.data.contact;
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const uploadCompanyContactProfileImage = async (contactId: string, uri: string, name: string, type: string) => {
    try {
      const formData = new FormData();
      const response = await fetch(uri);
      const blob = await response.blob();
      formData.append('profileImage', blob, name);

      await apiClient.patch(`/clients/contacts/${contactId}/profile-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await fetchLiveDashboardData();
    } catch (e) {
      console.error('Failed to upload contact profile image:', e);
    }
  };

  const updateCompanyContact = (id: string, data: Partial<CompanyContact>) => {
    setCompanyContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...data } : c))
    );
  };

  const deleteCompanyContact = (id: string) => {
    setCompanyContacts((prev) => prev.filter((c) => c.id !== id));
  };

  const createVendor = (data: Omit<Vendor, 'id' | 'createdAt'>): Vendor => {
    const trimmedCode = data.vendorCode.trim();
    if (!trimmedCode) {
      throw new Error('Vendor Code is required.');
    }

    const isDuplicate = vendors.some(
      (v) => v.vendorCode.trim().toLowerCase() === trimmedCode.toLowerCase()
    );

    if (isDuplicate) {
      throw new Error(`Vendor Code "${trimmedCode}" already exists. Duplicate Vendor Codes are not allowed.`);
    }

    const newVendor: Vendor = {
      ...data,
      id: `vnd-${Date.now()}`,
      vendorCode: trimmedCode,
      createdAt: new Date().toISOString(),
    };

    setVendors((prev) => [newVendor, ...prev]);
    return newVendor;
  };

  const updateVendor = (vendorId: string, data: Partial<Vendor>) => {
    setVendors((prev) =>
      prev.map((v) => (v.id === vendorId ? { ...v, ...data } : v))
    );
  };

  const deleteVendor = (vendorId: string) => {
    const role = currentUser?.role;
    if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
      throw new Error('Permission Denied: Only Super Admin and Admin are authorized to delete vendors.');
    }
    setVendors((prev) => prev.filter((v) => v.id !== vendorId));
  };

  /**
   * STRICT DATA MASKING ENGINE:
   * Purchase, Production, Quality Testing, Dispatch roles must NEVER see:
   * - Client Name
   * - Client Contact Details
   * - Budget
   *
   * Only see: Client Code, Order Number, PO Number, Technical Requirements.
   */
  const getMaskedOrders = (): Order[] => {
    const userRole = currentUser?.role || 'SUPER_ADMIN';
    const isRestricted = ['PURCHASE', 'PRODUCTION', 'QUALITY_TESTING', 'DISPATCH'].includes(userRole);
    const isQC = userRole === 'QUALITY_TESTING';

    let filtered = orders;

    // Quality Testing Queue strictly displays orders where Quality Testing Required = YES
    if (isQC) {
      filtered = filtered.filter((o) => o.qualityTestingRequired);
    }

    return filtered.map((order) => {
      if (isRestricted) {
        return {
          ...order,
          clientName: '🔒 MASKED (Confidential)',
          contactNo: '🔒 MASKED',
          email: '🔒 MASKED',
          address: '🔒 MASKED',
          budget: undefined,
        };
      }
      return order;
    });
  };

  const createClient = async (data: {
    clientCode: string;
    companyName: string;
    contactName?: string;
    contactNo: string;
    email?: string;
    address?: string;
    gstNumber?: string;
    panNumber?: string;
    websiteUrl?: string;
    industry?: string;
    remarks?: string;
  }) => {
      try { const res = await apiClient.post(`/orders/client`, data); await fetchLiveDashboardData(); return res.data.client; } catch (e) { console.error(e); throw e; }
  };

  const uploadClientProfileImage = async (clientId: string, uri: string, name: string, type: string) => {
    try {
      const formData = new FormData();
      // On web, fetch the blob from the URI first
      const response = await fetch(uri);
      const blob = await response.blob();
      formData.append('profileImage', blob, name);

      await apiClient.patch(`/clients/${clientId}/profile-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await fetchLiveDashboardData();
    } catch (e) {
      console.error('Failed to upload profile image:', e);
    }
  };

  const uploadPrimaryContactProfileImage = async (clientId: string, uri: string, name: string, type: string) => {
    try {
      const formData = new FormData();
      const response = await fetch(uri);
      const blob = await response.blob();
      formData.append('profileImage', blob, name);

      await apiClient.patch(`/clients/${clientId}/primary-contact-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await fetchLiveDashboardData();
    } catch (e) {
      console.error('Failed to upload primary contact profile image:', e);
    }
  };

  const updateClient = async (id: string, data: Partial<Client>) => {
    try {
      await apiClient.patch(`/clients/${id}`, data);
      await fetchLiveDashboardData();
    } catch (e) {
      console.error(e);
      // Fallback for missing backend route
      setClients(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
    }
  };

  const deleteClient = async (id: string) => {
    try {
      await apiClient.delete(`/clients/${id}`);
      await fetchLiveDashboardData();
    } catch (e: any) {
      if (e.response?.status === 404) {
        alert('Action Failed: The delete route is missing on the production server. Please wait for the Render deployment to complete.');
      } else {
        alert('Failed to delete client at DB level.');
      }
    }
  };

  const updateOrder = async (id: string, data: Partial<Order>) => {
    try {
      await apiClient.patch(`/orders/${id}`, data);
      await fetchLiveDashboardData();
    } catch (e) {
      console.error(e);
      // Fallback
      setOrders(prev => prev.map(o => o.id === id ? { ...o, ...data } : o));
    }
  };

  const deleteOrder = async (id: string) => {
    try {
      await apiClient.delete(`/admin/orders/${id}`); // backend has /admin/orders/:orderId
      await fetchLiveDashboardData();
    } catch (e) {
      console.error(e);
      // Fallback
      setOrders(prev => prev.filter(o => o.id !== id));
    }
  };

  const deleteQuotation = (id: string) => {
    setQuotations(prev => prev.filter(q => q.id !== id));
  };

  const createOrder = async (data: {
    poNumber: string;
    clientId: string;
    budget?: number;
    technicalRequirements?: string;
    materialRequirements?: string;
    requiredQuantity?: number;
    purchaseRequired: boolean;
    productionRequired: boolean;
    qualityTestingRequired: boolean;
    dispatchRequired: boolean;
    clientObj?: any; // To pass newly created client before state updates
    customStages?: CustomStage[];
    items?: Array<{ itemName: string; size: string; quantity: number; unitPrice?: number }>;
  }) => {
      try { const res = await apiClient.post(`/orders`, data); await fetchLiveDashboardData(); return res.data.order; } catch (e) { console.error(e); throw e; }
  };

  const addStageLog = (order: Order, department: string, action: string, currentStatus: string, remarks?: string): StageLog => {
    return {
      id: `log-${Date.now()}`,
      department,
      action,
      currentStatus,
      remarks: remarks || '',
      changedByName: currentUser?.name || 'System',
      changedByRole: currentUser?.role || 'SUPER_ADMIN',
      createdAt: new Date().toISOString(),
    };
  };

  const updateSalesWorkflowStage = async (orderId: string, stage: SalesWorkflowStage, remarks?: string) => {
      try { await apiClient.patch(`/orders/${orderId}/sales-workflow`, { stage, remarks }); await fetchLiveDashboardData(); } catch (e) { console.error(e); }
  };

  const uploadOrderDrawing = (
    orderId: string,
    data: {
      drawingNumber: string;
      drawingName: string;
      fileName: string;
      fileType: 'PDF' | 'PNG' | 'JPG' | 'JPEG' | 'DWG' | 'DXF';
      fileUri?: string;
      fileSize?: string;
    }
  ): OrderDrawing => {
    let createdDrawing: OrderDrawing | undefined;

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const existingDrawings = o.drawings || [];
          const sameNumDrawings = existingDrawings.filter((d) => d.drawingNumber.toLowerCase() === data.drawingNumber.toLowerCase());
          const versionNumber = sameNumDrawings.length + 1;

          const newDrawing: OrderDrawing = {
            id: `drw-${Date.now()}`,
            orderId,
            drawingNumber: data.drawingNumber,
            drawingName: data.drawingName,
            fileName: data.fileName,
            fileType: data.fileType,
            fileUri: data.fileUri,
            fileSize: data.fileSize || '1.5 MB',
            versionNumber,
            uploadedBy: currentUser?.name || 'Sales Representative',
            uploadDate: new Date().toISOString(),
            status: 'PENDING',
          };

          createdDrawing = newDrawing;
          const log = addStageLog(o, 'SALES', `Drawing Uploaded (${data.drawingNumber} v${versionNumber})`, 'DRAWING_SUBMITTED', `File: ${data.fileName}`);

          return {
            ...o,
            drawings: [newDrawing, ...existingDrawings],
            activeDrawingId: newDrawing.id,
            stageLogs: [log, ...o.stageLogs],
            updatedAt: new Date().toISOString(),
          };
        }
        return o;
      })
    );

    return createdDrawing!;
  };

  const updateDrawingStatus = (orderId: string, drawingId: string, status: DrawingStatus, remarks?: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const updatedDrawings = (o.drawings || []).map((d) =>
            d.id === drawingId ? { ...d, status, reviewRemarks: remarks || d.reviewRemarks } : d
          );

          const isAnyApproved = updatedDrawings.some((d) => d.status === 'APPROVED');
          const log = addStageLog(o, 'SALES', `Drawing Status Updated -> ${status}`, status, remarks || `Drawing ID ${drawingId} marked as ${status}`);

          return {
            ...o,
            drawings: updatedDrawings,
            drawingApproved: isAnyApproved,
            salesWorkflowStage: isAnyApproved && o.salesWorkflowStage === 'DRAWING_SUBMITTED' ? 'DRAWING_APPROVED' : o.salesWorkflowStage,
            stageLogs: [log, ...o.stageLogs],
            updatedAt: new Date().toISOString(),
          };
        }
        return o;
      })
    );
  };

  const deleteOrderDrawing = (orderId: string, drawingId: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const updatedDrawings = (o.drawings || []).filter((d) => d.id !== drawingId);
          const isAnyApproved = updatedDrawings.some((d) => d.status === 'APPROVED');
          return {
            ...o,
            drawings: updatedDrawings,
            drawingApproved: isAnyApproved,
            activeDrawingId: updatedDrawings[0]?.id,
            updatedAt: new Date().toISOString(),
          };
        }
        return o;
      })
    );
  };

  const updatePurchaseStage = async (
    orderId: string,
    status: DepartmentStatus,
    vendorSelected?: string,
    procurementNotes?: string,
    processedQty?: number
  ) => {
      try { await apiClient.patch(`/orders/${orderId}/purchase`, { status, processedQty, vendorSelected, procurementNotes }); await fetchLiveDashboardData(); } catch (e) { console.error(e); }
  };

  const addPurchaseBatch = (
    orderId: string,
    batchData: Omit<PurchaseBatch, 'id' | 'orderId' | 'createdByName' | 'createdAt'>
  ): PurchaseBatch => {
    if (!currentUser || !['PURCHASE', 'ADMIN', 'SUPER_ADMIN'].includes(currentUser.role)) {
      throw new Error('Permission Denied: Only Purchase personnel can add purchase batches.');
    }
    let createdBatch: PurchaseBatch | undefined;

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const newBatch: PurchaseBatch = {
            ...batchData,
            id: `pb-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            orderId,
            createdByName: currentUser?.name || 'System',
            createdAt: new Date().toISOString(),
          };
          createdBatch = newBatch;

          // Also update total purchase quantity
          const newPurchaseQty = (o.purchaseQuantity || 0) + batchData.quantityReceived;
          const calcStatus: DepartmentStatus =
            newPurchaseQty >= o.requiredQuantity ? 'COMPLETED' : newPurchaseQty > 0 ? 'IN_PROGRESS' : o.purchaseStatus;

          const log = addStageLog(
            o,
            'PURCHASE',
            `Purchase Batch Added → ${batchData.quantityReceived} PCS from ${batchData.vendorName}`,
            calcStatus,
            batchData.remarks || `Vendor: ${batchData.vendorName}`
          );

          const qLog: QuantityLog = {
            id: `ql-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            orderId,
            stage: 'PURCHASE',
            processedQty: batchData.quantityReceived,
            accumulatedQty: newPurchaseQty,
            remainingQty: Math.max(0, o.requiredQuantity - newPurchaseQty),
            totalQty: o.requiredQuantity,
            actionLabel: `Received ${batchData.quantityReceived} PCS Batch`,
            remarks: batchData.remarks || `Vendor: ${batchData.vendorName}`,
            changedByName: currentUser?.name || 'System Admin',
            changedByRole: currentUser?.role || 'PURCHASE',
            createdAt: new Date().toISOString(),
          };

          const isCompleted = calcStatus === 'COMPLETED';
          let currentStageVal: any = o.currentStage || 'PURCHASE';
          let assignedDeptVal: any = o.assignedDepartment || 'PURCHASE';
          let nextStageVal: any = o.nextStage || 'PRODUCTION';
          let prodStatusVal = o.productionStatus;

          const extraLogs: StageLog[] = [];

          if (isCompleted) {
            if (o.productionRequired) {
              currentStageVal = 'PRODUCTION';
              assignedDeptVal = 'PRODUCTION';
              nextStageVal = o.qualityTestingRequired ? 'QUALITY_TESTING' : 'DISPATCH';
              extraLogs.push(addStageLog(o, 'PURCHASE', 'Purchase Completed -> Moved to Production Department', 'PRODUCTION_PENDING'));
            } else if (o.qualityTestingRequired) {
              currentStageVal = 'QUALITY_TESTING';
              assignedDeptVal = 'QUALITY_TESTING';
              nextStageVal = 'DISPATCH';
              extraLogs.push(addStageLog(o, 'PURCHASE', 'Purchase Completed -> Moved to Quality Testing', 'QC_PENDING'));
            } else {
              currentStageVal = 'DISPATCH';
              assignedDeptVal = 'DISPATCH';
              nextStageVal = 'COMPLETED';
              extraLogs.push(addStageLog(o, 'PURCHASE', 'Purchase Completed -> Moved to Dispatch', 'READY_FOR_DISPATCH'));
            }
          }

          return {
            ...o,
            purchaseQuantity: newPurchaseQty,
            purchaseStatus: calcStatus,
            productionStatus: prodStatusVal,
            currentStage: currentStageVal,
            assignedDepartment: assignedDeptVal,
            nextStage: nextStageVal,
            purchaseBatches: [...(o.purchaseBatches || []), newBatch],
            vendorSelected: batchData.vendorName,
            quantityLogs: [qLog, ...(o.quantityLogs || [])],
            stageLogs: [...extraLogs, log, ...o.stageLogs],
            updatedAt: new Date().toISOString(),
          };
        }
        return o;
      })
    );

    return createdBatch!;
  };


  const updateProductionStage = async (
    orderId: string,
    status: DepartmentStatus,
    shopFloorNotes?: string,
    processedQty?: number,
    isRework?: boolean
  ) => {
      try { await apiClient.patch(`/orders/${orderId}/production`, { status, processedQty, isRework, shopFloorNotes }); await fetchLiveDashboardData(); } catch (e) { console.error(e); }
  };

  const updateQualityStage = async (
    orderId: string,
    status: DepartmentStatus,
    qcResult?: QCResult,
    qcRemarks?: string,
    processedQty?: number,
    passedQty?: number,
    failedQty?: number
  ) => {
      try { await apiClient.patch(`/orders/${orderId}/quality`, { status, qcResult, processedQty, qcRemarks }); await fetchLiveDashboardData(); } catch (e) { console.error(e); }
  };


  const updateDispatchStage = async (
    orderId: string,
    status: DepartmentStatus,
    logisticsEntry?: string,
    transportRef?: string,
    dispatchNotes?: string,
    processedQty?: number
  ) => {
      try { await apiClient.patch(`/orders/${orderId}/dispatch`, { status, processedQty, logisticsEntry, transportRef, dispatchNotes }); await fetchLiveDashboardData(); } catch (e) { console.error(e); }
  };

  const verifyAndCloseOrder = async (orderId: string, remarks?: string) => {
      try { await apiClient.patch(`/orders/${orderId}/verify-completion`, { remarks }); await fetchLiveDashboardData(); } catch (e) { console.error(e); }
  };

  const createTask = (data: {
    title: string;
    description?: string;
    priority: Priority;
    assignedToDepartment?: Role;
    assignedToUserId?: string;
    assignedToName?: string;
    orderId?: string;
    dueDate?: string;
  }) => {
    const orderObj = orders.find((o) => o.id === data.orderId);
    const newTask: Task = {
      id: `tsk-${Date.now()}`,
      orderId: data.orderId,
      orderNumber: orderObj?.orderNumber,
      title: data.title,
      description: data.description,
      priority: data.priority,
      status: 'PENDING',
      assignedToDepartment: data.assignedToDepartment,
      assignedToUserId: data.assignedToUserId,
      assignedToName: data.assignedToName,
      createdByName: currentUser?.name || 'System',
      createdByRole: currentUser?.role || 'SUPER_ADMIN',
      createdByUserId: currentUser?.id,
      dueDate: data.dueDate,
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);
  };

  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status } : t))
    );
  };

  const deleteTask = (taskId: string) => {
    // STRICT RULE: Only SUPER_ADMIN and ADMIN can delete tasks
    const role = currentUser?.role;
    if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
      throw new Error('Permission Denied: Only Super Admin and Admin are authorized to delete tasks.');
    }
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const createCalendarEvent = (data: { title: string; type: CalendarEventType; eventDate: string; description?: string }) => {
    const newEvent: CalendarEvent = {
      id: `cal-${Date.now()}`,
      title: data.title,
      type: data.type,
      eventDate: data.eventDate,
      description: data.description,
      createdByName: currentUser?.name || 'System',
    };
    setCalendarEvents((prev) => [...prev, newEvent].sort((a, b) => a.eventDate.localeCompare(b.eventDate)));
  };

  const deleteCalendarEvent = (eventId: string) => {
    setCalendarEvents((prev) => prev.filter((e) => e.id !== eventId));
  };

  const createQuotation = (data: {
    companyName: string;
    clientCode: string;
    clientId?: string;
    contactPerson: string;
    mobileNumber: string;
    email: string;
    inquiryRef?: string;
    quotationAmount: number;
    expectedOrderValue?: number;
    salesExecutive: string;
    followUpDate?: string;
    status?: QuotationStatus;
    remarks?: string;
  }): Quotation => {
    const qCount = quotations.length + 1;
    const qNumStr = String(qCount).padStart(3, '0');
    const quotationNumber = `QT-2026-${qNumStr}`;

    const newQuotation: Quotation = {
      id: `qt-${Date.now()}`,
      quotationNumber,
      quotationDate: new Date().toISOString().split('T')[0],
      companyName: data.companyName.trim(),
      clientCode: data.clientCode.trim().toUpperCase(),
      clientId: data.clientId,
      contactPerson: data.contactPerson.trim(),
      mobileNumber: data.mobileNumber.trim(),
      email: data.email.trim(),
      inquiryRef: data.inquiryRef ? data.inquiryRef.trim() : undefined,
      quotationAmount: Number(data.quotationAmount) || 0,
      expectedOrderValue: data.expectedOrderValue ? Number(data.expectedOrderValue) : Number(data.quotationAmount) || 0,
      salesExecutive: data.salesExecutive || currentUser?.name || 'Sales Executive',
      salesExecutiveUserId: currentUser?.id,
      followUpDate: data.followUpDate || undefined,
      status: data.status || 'DRAFT',
      remarks: data.remarks ? data.remarks.trim() : undefined,
      followUps: data.followUpDate
        ? [
            {
              id: `fup-${Date.now()}`,
              quotationId: `qt-${Date.now()}`,
              followUpDate: data.followUpDate,
              notes: 'Initial follow-up scheduled upon quotation creation.',
              status: 'PENDING',
              createdByName: currentUser?.name || 'Sales Executive',
              createdAt: new Date().toISOString(),
            },
          ]
        : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setQuotations((prev) => [newQuotation, ...prev]);

    // Auto-create ERP Calendar Event for Follow-Up Date
    if (data.followUpDate) {
      const calEvent: CalendarEvent = {
        id: `cal-fup-${newQuotation.id}`,
        title: `Follow-Up: ${data.companyName} (${quotationNumber})`,
        type: 'FOLLOW_UP',
        eventDate: data.followUpDate,
        description: `Quotation Follow-Up with ${data.contactPerson} (${data.mobileNumber}). Sales Executive: ${newQuotation.salesExecutive}. Status: ${newQuotation.status}`,
        createdByName: newQuotation.salesExecutive,
      };
      setCalendarEvents((prev) => [...prev.filter((e) => e.id !== calEvent.id), calEvent].sort((a, b) => a.eventDate.localeCompare(b.eventDate)));
    }

    return newQuotation;
  };

  const updateQuotation = (id: string, data: Partial<Quotation>) => {
    setQuotations((prev) =>
      prev.map((q) => {
        if (q.id === id) {
          const updated = {
            ...q,
            ...data,
            updatedAt: new Date().toISOString(),
          };

          // Auto-sync calendar event if followUpDate was updated
          if (data.followUpDate) {
            const calEvent: CalendarEvent = {
              id: `cal-fup-${q.id}`,
              title: `Follow-Up: ${updated.companyName} (${updated.quotationNumber})`,
              type: 'FOLLOW_UP',
              eventDate: data.followUpDate,
              description: `Quotation Follow-Up with ${updated.contactPerson} (${updated.mobileNumber}). Sales Executive: ${updated.salesExecutive}. Status: ${updated.status}`,
              createdByName: updated.salesExecutive,
            };
            setCalendarEvents((prevEvents) =>
              [...prevEvents.filter((e) => e.id !== calEvent.id), calEvent].sort((a, b) => a.eventDate.localeCompare(b.eventDate))
            );
          }

          return updated;
        }
        return q;
      })
    );
  };

  const addQuotationFollowUp = (
    quotationId: string,
    data: { followUpDate: string; notes: string; status: FollowUpStatus }
  ) => {
    const newFollowUp: QuotationFollowUp = {
      id: `fup-${Date.now()}`,
      quotationId,
      followUpDate: data.followUpDate,
      notes: data.notes.trim(),
      status: data.status,
      createdByName: currentUser?.name || 'Sales Executive',
      createdAt: new Date().toISOString(),
    };

    setQuotations((prev) =>
      prev.map((q) => {
        if (q.id === quotationId) {
          const updatedFollowUps = [newFollowUp, ...(q.followUps || [])];

          // Auto-sync calendar event
          if (data.followUpDate) {
            const calEvent: CalendarEvent = {
              id: `cal-fup-${q.id}`,
              title: `Follow-Up: ${q.companyName} (${q.quotationNumber})`,
              type: 'FOLLOW_UP',
              eventDate: data.followUpDate,
              description: `Follow-Up Notes: ${data.notes}. Sales Executive: ${q.salesExecutive}. Status: ${data.status}`,
              createdByName: q.salesExecutive,
            };
            setCalendarEvents((prevEvents) =>
              [...prevEvents.filter((e) => e.id !== calEvent.id), calEvent].sort((a, b) => a.eventDate.localeCompare(b.eventDate))
            );
          }

          return {
            ...q,
            followUpDate: data.followUpDate,
            followUps: updatedFollowUps,
            updatedAt: new Date().toISOString(),
          };
        }
        return q;
      })
    );
  };

  const convertQuotationToOrder = async (
    quotationId: string,
    data: {
      convertedOrderValue: number;
      poNumber?: string;
      technicalRequirements?: string;
      materialRequirements?: string;
      requiredQuantity?: number;
      purchaseRequired?: boolean;
      productionRequired?: boolean;
      qualityTestingRequired?: boolean;
      dispatchRequired?: boolean;
      customStages?: Omit<CustomStage, 'id' | 'createdAt' | 'status'>[];
      items?: Array<{ itemName: string; size: string; quantity: number; unitPrice?: number }>;
    }
  ): Order => {
    const targetQuotation = quotations.find((q) => q.id === quotationId);
    if (!targetQuotation) {
      throw new Error('Quotation not found.');
    }
    if (targetQuotation.status === 'FULLY_CONVERTED' || targetQuotation.status === 'LOST') {
      throw new Error('Cannot convert a quotation that is already fully converted or lost.');
    }

    let targetClient = clients.find(
      (c) => c.clientCode.toLowerCase() === targetQuotation.clientCode.toLowerCase()
    );

    if (!targetClient) {
      targetClient = await createClient({
        clientCode: targetQuotation.clientCode,
        companyName: targetQuotation.companyName,
        contactName: targetQuotation.contactPerson,
        contactNo: targetQuotation.mobileNumber,
        email: targetQuotation.email,
      });
    }

    const additionalConvertedVal = Number(data.convertedOrderValue) || targetQuotation.quotationAmount;
    const totalConvertedVal = (targetQuotation.convertedOrderValue || 0) + additionalConvertedVal;
    const lostVal = Math.max(0, targetQuotation.quotationAmount - totalConvertedVal);
    const nextStatus: QuotationStatus = totalConvertedVal >= targetQuotation.quotationAmount ? 'FULLY_CONVERTED' : 'PARTIALLY_CONVERTED';

    const newOrder = await createOrder({
      poNumber: data.poNumber ? data.poNumber.trim() : `PO-QT-${targetQuotation.quotationNumber.replace('QT-', '')}`,
      clientId: targetClient.id,
      clientObj: targetClient,
      budget: additionalConvertedVal,
      technicalRequirements: data.technicalRequirements ? data.technicalRequirements.trim() : (targetQuotation.remarks || `Converted from Quotation ${targetQuotation.quotationNumber}`),
      materialRequirements: data.materialRequirements ? data.materialRequirements.trim() : 'Standard Forged Flange Spec',
      requiredQuantity: data.requiredQuantity || 1,
      purchaseRequired: data.purchaseRequired ?? true,
      productionRequired: data.productionRequired ?? true,
      qualityTestingRequired: data.qualityTestingRequired ?? true,
      dispatchRequired: data.dispatchRequired ?? true,
      customStages: data.customStages?.map((cs, idx) => ({
        ...cs,
        id: `cs-${Date.now()}-${idx}`,
        status: 'PENDING',
        createdAt: new Date().toISOString()
      })) || [],
      items: data.items && data.items.length > 0 ? data.items : [
        {
          itemName: `Flange Assembly Batch (${targetQuotation.quotationNumber})`,
          size: 'Standard Rating',
          quantity: data.requiredQuantity || 1,
          unitPrice: Math.round(additionalConvertedVal / (data.requiredQuantity || 1)),
        },
      ],
    });

    setQuotations((prev) =>
      prev.map((q) =>
        q.id === quotationId
          ? {
            ...q,
            status: nextStatus,
            convertedOrderValue: totalConvertedVal,
            lostValue: lostVal,
            convertedOrderId: q.convertedOrderId ? `${q.convertedOrderId},${newOrder.id}` : newOrder.id,
            convertedOrderNumber: q.convertedOrderNumber ? `${q.convertedOrderNumber},${newOrder.orderNumber}` : newOrder.orderNumber,
            updatedAt: new Date().toISOString(),
          }
          : q
      )
    );

    return newOrder;
  };

  const markQuotationLost = (
    quotationId: string,
    data: {
      lostReason: LostReason;
      lostValue?: number;
      lostRemarks?: string;
      lostDate?: string;
    }
  ) => {
    setQuotations((prev) =>
      prev.map((q) => {
        if (q.id === quotationId) {
          const lostVal = data.lostValue !== undefined ? Number(data.lostValue) : q.quotationAmount;
          return {
            ...q,
            status: 'LOST',
            lostReason: data.lostReason,
            lostValue: lostVal,
            lostDate: data.lostDate || new Date().toISOString().split('T')[0],
            lostRemarks: data.lostRemarks ? data.lostRemarks.trim() : undefined,
            updatedAt: new Date().toISOString(),
          };
        }
        return q;
      })
    );
  };

  return (
    <ERPContext.Provider
      value={{
        refreshData: fetchLiveDashboardData,
        orders,
        getMaskedOrders,
        clients,
        companyContacts,
        addCompanyContact,
        uploadCompanyContactProfileImage,
        updateCompanyContact,
        deleteCompanyContact,
        companyImportantDates,
        addCompanyImportantDate,
        deleteCompanyImportantDate,
        vendors,
        quotations,
        tasks,
        calendarEvents,
        selectedOrder,
        setSelectedOrder,

        createQuotation,
        updateQuotation,
        addQuotationFollowUp,
        convertQuotationToOrder,
        markQuotationLost,

        createClient,
        updateClient,
        deleteClient,
        uploadClientProfileImage,
    uploadPrimaryContactProfileImage,
        createVendor,
        updateVendor,
        deleteVendor,
        createOrder,
        updateOrder,
        deleteOrder,
        deleteQuotation,

        updateSalesWorkflowStage,
        uploadOrderDrawing,
        updateDrawingStatus,
        deleteOrderDrawing,

        updatePurchaseStage,
        addPurchaseBatch,
        updateProductionStage,
        updateQualityStage,
        updateDispatchStage,
        verifyAndCloseOrder,

        createTask,
        updateTaskStatus,
        deleteTask,

        createCalendarEvent,
        deleteCalendarEvent,
      }}
    >
      {children}
    </ERPContext.Provider>
  );
};

export const useERP = () => {
  const context = useContext(ERPContext);
  if (!context) {
    throw new Error('useERP must be used within an ERPProvider');
  }
  return context;
};
