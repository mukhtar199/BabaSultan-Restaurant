export type EmployeeRole =
  | 'Owner'
  | 'Admin'
  | 'Manager'
  | 'HR Manager'
  | 'Accountant'
  | 'Cashier'
  | 'Kitchen Staff'
  | 'Chef'
  | 'Waiter'
  | 'Delivery Driver'
  | 'Store Keeper'
  | 'Purchasing Officer'
  | 'Employee'
  | 'chef'
  | 'waiter'
  | 'cashier'
  | 'manager'
  | 'barista';

export type EmploymentStatus = 'Active' | 'On Leave' | 'Probation' | 'Terminated' | 'Suspended';

export type GenderType = 'Male' | 'Female' | 'Other';

export interface BankAccountDetails {
  bankName: string;
  accountName?: string;
  accountNumber: string;
  iban?: string;
  swiftCode?: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  alternatePhone?: string;
}

export interface Employee {
  id: string;
  employeeId: string; // e.g. EMP-1001
  fullName: string;
  name?: string; // Legacy field compatibility
  photo?: string;
  nationalIdOrPassport: string;
  phone: string;
  email: string;
  address: string;
  dateOfBirth: string;
  gender: GenderType;
  nationality: string;
  hireDate: string;
  jobTitle: string;
  department: string;
  branch: string;
  employmentStatus: EmploymentStatus;
  status?: string; // Legacy status compatibility
  role: EmployeeRole;
  salary: number;
  totalSales?: number; // Legacy analytics compatibility
  ordersCount?: number; // Legacy analytics compatibility
  bankAccount?: BankAccountDetails;
  emergencyContact: EmergencyContact;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'half_day' | 'on_leave';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  clockIn: string; // ISO string
  clockOut?: string; // ISO string
  breakTimeMinutes: number;
  workingHours: number;
  overtimeHours: number;
  isLate: boolean;
  isEarlyLeave: boolean;
  status: AttendanceStatus;
  notes?: string;
  createdAt: string;
}

export type ShiftType = 'morning' | 'evening' | 'night' | 'custom';

export interface Shift {
  id: string;
  name: string;
  type: ShiftType;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  workingHours: number;
  department?: string;
  branch?: string;
  assignedEmployeeIds: string[];
  status: 'active' | 'inactive';
  createdAt: string;
}

export type PayrollStatus = 'pending' | 'processed' | 'paid';

export interface PayrollRecord {
  id: string;
  payrollNumber: string;
  employeeId: string;
  employeeName: string;
  jobTitle?: string;
  department?: string;
  month: string; // YYYY-MM
  basicSalary: number;
  overtimePay: number;
  bonuses: number;
  deductions: number;
  advances: number;
  netSalary: number;
  paymentStatus: PayrollStatus;
  paymentDate?: string;
  paymentMethod?: string;
  notes?: string;
  createdAt: string;
}

export type LeaveType = 'Annual Leave' | 'Sick Leave' | 'Emergency Leave' | 'Unpaid Leave';

export type LeaveWorkflowStatus =
  | 'Request'
  | 'Manager Approval'
  | 'HR Approval'
  | 'Completed'
  | 'Rejected';

export interface LeaveApprovalStep {
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
}

export interface LeaveRequest {
  id: string;
  leaveNumber: string;
  employeeId: string;
  employeeName: string;
  department?: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  workflowStatus: LeaveWorkflowStatus;
  managerApproval?: LeaveApprovalStep;
  hrApproval?: LeaveApprovalStep;
  createdAt: string;
}

export interface PerformanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  jobTitle?: string;
  department?: string;
  period: string; // YYYY-MM
  attendanceRate: number; // 0 - 100%
  salesPerformance: number; // $ total
  customerRatings: number; // 1 - 5 rating
  productivity: number; // 0 - 100%
  completedOrders: number;
  averageServiceTimeMinutes: number;
  evaluatedBy: string;
  notes?: string;
  updatedAt: string;
}

export type DocumentType =
  | 'Employment Contract'
  | 'National ID'
  | 'Passport'
  | 'Driving License'
  | 'Certificates'
  | 'Other Documents';

export interface EmployeeDocument {
  id: string;
  employeeId: string;
  employeeName?: string;
  documentType: DocumentType;
  title: string;
  fileUrl: string;
  fileName: string;
  fileSize?: number;
  issueDate?: string;
  expiryDate?: string;
  uploadedAt: string;
  notes?: string;
}

export type HRNotificationType =
  | 'shift_reminder'
  | 'salary_processed'
  | 'contract_expiration'
  | 'leave_approval'
  | 'missing_attendance';

export interface HRNotification {
  id: string;
  employeeId?: string;
  type: HRNotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface HRMAnalyticsData {
  totalEmployees: number;
  activeEmployees: number;
  onLeaveEmployees: number;
  todayAttendanceRate: number;
  pendingLeaveRequests: number;
  monthlyPayrollTotal: number;
  departmentDistribution: Record<string, number>;
  roleDistribution: Record<string, number>;
}
