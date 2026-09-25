export type Role =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'SALES'
  | 'PURCHASE'
  | 'PRODUCTION'
  | 'QUALITY_TESTING'
  | 'DISPATCH';

export type NavMenuItem =
  | 'Dashboard'
  | 'ClientDirectory'
  | 'Orders'
  | 'Quotations'
  | 'WorkOrders'
  | 'PurchaseOrders'
  | 'DispatchQueue'
  | 'Logistics'
  | 'QualityControl'
  | 'Purchase'
  | 'Production'
  | 'Dispatch'
  | 'Vendors'
  | 'Tasks'
  | 'Calendar'
  | 'Notifications'
  | 'Users'
  | 'Reports'
  | 'Settings'
  | 'ActivityLogs'
  | 'Logout';

export type SalesWorkflowStage =
  | 'REQUIREMENT_RECEIVED'
  | 'QUOTATION_PREPARED'
  | 'QUOTATION_APPROVED'
  | 'DRAWING_SUBMITTED'
  | 'DRAWING_APPROVED'
  | 'QUALITY_TESTING_REQUIRED'
  | 'ORDER_CONFIRMED';

export type DepartmentStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'APPROVED'
  | 'REJECTED'
  | 'COMPLETED';

export type QCResult = 'PENDING' | 'PASSED' | 'FAILED';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export type CalendarEventType =
  | 'IMPORTANT_DATE'
  | 'MEETING'
  | 'FOLLOW_UP'
  | 'DEADLINE'
  | 'REMINDER'
  | 'MILESTONE'
  | 'BIRTHDAY'
  | 'ANNIVERSARY';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  mobileNumber?: string;
  employeeId?: string;
  password?: string;
  role: Role;
  isActive: boolean;
  createdAt?: string;
}

export type AuthAuditEvent =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'OTP_REQUESTED'
  | 'OTP_VERIFIED'
  | 'PASSWORD_CHANGED'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DELETED'
  | 'PASSWORD_RESET';

export interface AuthAuditLog {
  id: string;
  event: AuthAuditEvent;
  username?: string;
  email?: string;
  role?: Role;
  details: string;
  timestamp: string;
}

export interface Client {
  id: string;
  clientCode: string;
  companyName: string;
  contactName?: string;
  contactNo: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  panNumber?: string;
  industry?: string;
  website?: string;
  description?: string;
  logo?: string;
  remarks?: string;
  createdAt: string;
}

export interface CompanyContact {
  id: string;
  companyId: string;

  fullName: string;
  designation: string;
  department: string;

  email: string;
  mobile: string;
  whatsapp: string;

  profileImage?: string;
  reportsToId?: string;
  notes?: string;
  createdAt?: string;
}

export type CompanyDateType =
  | 'CONTRACT_RENEWAL'
  | 'AUDIT'
  | 'CERTIFICATION'
  | 'MEETING'
  | 'PAYMENT_DUE'
  | 'MILESTONE'
  | 'OTHER';

export interface CompanyImportantDate {
  id: string;
  companyId: string;
  title: string;
  dateType: CompanyDateType;
  eventDate: string;
  description?: string;
  createdByName?: string;
  createdAt?: string;
}

export type VendorStatus = 'ACTIVE' | 'INACTIVE';

export interface Vendor {
  id: string;
  vendorCode: string;
  vendorName: string;
  companyName?: string;
  gstNumber?: string;
  panNumber?: string;

  contactPerson: string;
  mobileNumber: string;
  alternateMobile?: string;
  email: string;
  website?: string;

  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  country?: string;

  materialSupplied: string;
  vendorCategory?: string;
  paymentTerms?: string;
  leadTime?: string;
  status: VendorStatus;

  remarks?: string;
  notes?: string;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  itemName: string;
  size: string;
  quantity: number;
  unitPrice?: number;
}

export interface StageLog {
  id: string;
  department: string;
  action: string;
  currentStatus: string;
  remarks?: string;
  changedByName: string;
  changedByRole: Role;
  createdAt: string;
}

export interface QuantityLog {
  id: string;
  orderId: string;
  stage: 'PURCHASE' | 'PRODUCTION' | 'QUALITY_TESTING' | 'DISPATCH';
  processedQty: number;
  accumulatedQty: number;
  remainingQty: number;
  totalQty: number;
  actionLabel: string;
  remarks?: string;
  changedByName: string;
  changedByRole: Role;
  createdAt: string;

  // Future Ready Architecture fields
  batchNumber?: string;
  skuNumber?: string;
  serialNumbers?: string[];
}

export type DrawingStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';

export interface OrderDrawing {
  id: string;
  orderId: string;
  drawingNumber: string;
  drawingName: string;
  fileUri?: string;
  fileName: string;
  fileType: 'PDF' | 'PNG' | 'JPG' | 'JPEG' | 'DWG' | 'DXF';
  fileSize?: string;
  versionNumber: number;
  uploadedBy: string;
  uploadDate: string;
  status: DrawingStatus;
  reviewRemarks?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  poNumber: string;
  clientId: string;
  clientCode: string;
  clientName?: string; // Masked for non-Sales roles
  contactNo?: string;  // Masked for non-Sales roles
  email?: string;      // Masked for non-Sales roles
  address?: string;    // Masked for non-Sales roles
  budget?: number;     // Masked for non-Sales roles

  technicalRequirements?: string;
  materialRequirements?: string;
  requiredQuantity: number;
  status: DepartmentStatus;
  drawingApproved: boolean;

  // Partial Quantity Tracking Properties
  purchaseQuantity?: number;
  productionQuantity?: number;
  qcQuantity?: number;
  dispatchQuantity?: number;
  quantityLogs?: QuantityLog[];

  // Drawing Upload Feature
  drawings?: OrderDrawing[];
  activeDrawingId?: string;

  // Pipeline Customizer Flags
  purchaseRequired: boolean;
  productionRequired: boolean;
  qualityTestingRequired: boolean;
  dispatchRequired: boolean;

  // Sales 7-stage initiation workflow
  salesWorkflowStage: SalesWorkflowStage;

  // Department Stages
  purchaseStatus: DepartmentStatus;
  vendorSelected?: string;
  procurementNotes?: string;

  productionStatus: DepartmentStatus;
  shopFloorNotes?: string;

  qualityStatus: DepartmentStatus;
  qcResult: QCResult;
  qcRemarks?: string;

  dispatchStatus: DepartmentStatus;
  logisticsEntry?: string;
  transportRef?: string;
  dispatchNotes?: string;

  salesVerification: DepartmentStatus;

  items: OrderItem[];
  stageLogs: StageLog[];
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  orderId?: string;
  orderNumber?: string;
  title: string;
  description?: string;
  priority: Priority;
  status: TaskStatus;
  assignedToDepartment?: Role;
  assignedToUserId?: string;
  assignedToName?: string;
  createdByName: string;
  createdByRole: Role;
  createdByUserId?: string;
  dueDate?: string;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  type: CalendarEventType;
  eventDate: string;
  description?: string;
  createdByName: string;
}

export type QuotationStatus =
  | 'DRAFT'
  | 'SENT'
  | 'UNDER_DISCUSSION'
  | 'NEGOTIATION'
  | 'APPROVED'
  | 'PARTIALLY_CONVERTED'
  | 'FULLY_CONVERTED'
  | 'LOST';

export type LostReason =
  | 'PRICE_TOO_HIGH'
  | 'COMPETITOR_WON'
  | 'CLIENT_BUDGET_ISSUE'
  | 'TECHNICAL_REQUIREMENT_CHANGE'
  | 'PROJECT_CANCELLED'
  | 'DELAYED_RESPONSE'
  | 'OTHER';

export type FollowUpStatus = 'PENDING' | 'COMPLETED' | 'NO_RESPONSE' | 'AWAITING_DECISION';

export interface QuotationFollowUp {
  id: string;
  quotationId: string;
  followUpDate: string;
  notes: string;
  status: FollowUpStatus;
  createdByName: string;
  createdAt: string;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  quotationDate: string;
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
  salesExecutiveUserId?: string;
  followUpDate?: string;
  status: QuotationStatus;
  remarks?: string;

  convertedOrderValue?: number;
  lostValue?: number;
  convertedOrderId?: string;
  convertedOrderNumber?: string;
  lostDate?: string;
  lostReason?: LostReason;
  lostRemarks?: string;

  followUps?: QuotationFollowUp[];
  createdAt: string;
  updatedAt: string;
}
