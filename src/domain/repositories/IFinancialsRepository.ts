import { NewExpensePayload, BankTransactionPayload, FinancialSummary } from '../entities/financials';
import { Expense } from '../../types';

export interface IFinancialsRepository {
  fetchExpenses(): Promise<Expense[]>;
  createExpense(payload: NewExpensePayload): Promise<Expense>;
  fetchFinancialSummary(): Promise<FinancialSummary>;
  addBankTransaction(payload: BankTransactionPayload): Promise<void>;
}
