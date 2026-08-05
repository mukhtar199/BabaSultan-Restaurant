import { NewEmployeePayload, NewSupplierPayload, SalaryPaymentPayload } from '../entities/staff';
import { Employee, Supplier, Salary } from '../../types';

export interface IStaffRepository {
  fetchEmployees(): Promise<Employee[]>;
  fetchSuppliers(): Promise<Supplier[]>;
  fetchSalaries(): Promise<Salary[]>;
  createEmployee(payload: NewEmployeePayload): Promise<Employee>;
  createSupplier(payload: NewSupplierPayload): Promise<Supplier>;
  processSalaryPayment(payload: SalaryPaymentPayload): Promise<Salary>;
}
