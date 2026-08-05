import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db, COLLECTIONS } from '../../lib/firebase';
import { IStaffRepository } from '../../domain/repositories/IStaffRepository';
import { NewEmployeePayload, NewSupplierPayload, SalaryPaymentPayload } from '../../domain/entities/staff';
import { Employee, Supplier, Salary } from '../../types';

export class StaffRepositoryImpl implements IStaffRepository {
  async fetchEmployees(): Promise<Employee[]> {
    const snap = await getDocs(collection(db, COLLECTIONS.EMPLOYEES));
    const list: Employee[] = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() } as Employee));
    return list;
  }

  async fetchSuppliers(): Promise<Supplier[]> {
    const snap = await getDocs(collection(db, COLLECTIONS.SUPPLIERS));
    const list: Supplier[] = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() } as Supplier));
    return list;
  }

  async fetchSalaries(): Promise<Salary[]> {
    const snap = await getDocs(collection(db, COLLECTIONS.SALARIES));
    const list: Salary[] = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() } as Salary));
    return list;
  }

  async createEmployee(payload: NewEmployeePayload): Promise<Employee> {
    const now = new Date().toISOString();
    const data = {
      fullName: payload.name,
      name: payload.name,
      employeeId: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      email: payload.email || '',
      phone: '+252 61 000 0000',
      address: 'Mogadishu',
      nationalIdOrPassport: 'N/A',
      dateOfBirth: '1995-01-01',
      gender: 'Male' as const,
      nationality: 'Somali',
      hireDate: now.split('T')[0],
      jobTitle: payload.role || 'Staff',
      department: 'Operations',
      branch: 'Main Branch',
      employmentStatus: 'Active' as const,
      status: 'active',
      role: (payload.role as any) || 'Employee',
      salary: Number(payload.salary) || 500,
      totalSales: 0,
      ordersCount: 0,
      emergencyContact: { name: 'Emergency', relationship: 'Family', phone: '' },
      createdAt: now
    };
    const docRef = await addDoc(collection(db, COLLECTIONS.EMPLOYEES), data);
    return { id: docRef.id, ...data };
  }

  async createSupplier(payload: NewSupplierPayload): Promise<Supplier> {
    const data = {
      ...payload,
      overdueAmount: 0,
      createdAt: new Date().toISOString()
    };
    const docRef = await addDoc(collection(db, COLLECTIONS.SUPPLIERS), data);
    return { id: docRef.id, ...data };
  }

  async processSalaryPayment(payload: SalaryPaymentPayload): Promise<Salary> {
    const data = {
      ...payload,
      status: 'paid' as const,
      paidDate: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    const docRef = await addDoc(collection(db, COLLECTIONS.SALARIES), data);
    
    // Log as expense
    await addDoc(collection(db, COLLECTIONS.EXPENSES), {
      title: `Payroll: ${payload.employeeName} (${payload.period})`,
      amount: payload.amount,
      category: 'Payroll & Wages',
      description: `Disbursed monthly salary payout for ${payload.employeeName}`,
      createdBy: 'HR Payroll Manager',
      createdAt: new Date().toISOString()
    });

    return { id: docRef.id, ...data };
  }
}
