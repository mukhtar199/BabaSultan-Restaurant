import {
  Account,
  JournalEntry,
  LedgerEntry,
  AccountingExpense,
  AccountingRevenue,
  ReceivableItem,
  PayableItem,
  CashRegister,
  BankAccount,
  BankTransaction,
  TaxConfig,
  FinancialStatements
} from '../entities/accounting';

export interface IAccountingRepository {
  // Chart of Accounts
  getAccounts(): Promise<Account[]>;
  createAccount(account: Omit<Account, 'id' | 'createdAt' | 'balance'>): Promise<Account>;
  updateAccount(id: string, updates: Partial<Account>): Promise<void>;
  
  // Journal Entries & Ledger
  getJournalEntries(): Promise<JournalEntry[]>;
  createJournalEntry(entry: Omit<JournalEntry, 'id' | 'createdAt' | 'entryNumber'>): Promise<JournalEntry>;
  getLedger(accountId?: string, startDate?: string, endDate?: string): Promise<LedgerEntry[]>;
  
  // Expenses
  getExpenses(): Promise<AccountingExpense[]>;
  createExpense(expense: Omit<AccountingExpense, 'id' | 'createdAt' | 'expenseNumber'>): Promise<AccountingExpense>;
  
  // Revenues
  getRevenues(): Promise<AccountingRevenue[]>;
  createRevenue(revenue: Omit<AccountingRevenue, 'id' | 'createdAt' | 'revenueNumber'>): Promise<AccountingRevenue>;
  
  // Accounts Receivable
  getReceivables(): Promise<ReceivableItem[]>;
  createReceivable(item: Omit<ReceivableItem, 'id' | 'createdAt' | 'paidAmount' | 'remainingBalance' | 'status' | 'payments'>): Promise<ReceivableItem>;
  recordARPayment(receivableId: string, payment: { amount: number; paymentMethod: 'Cash' | 'Bank'; date: string; reference?: string; notes?: string }): Promise<void>;
  
  // Accounts Payable
  getPayables(): Promise<PayableItem[]>;
  createPayable(item: Omit<PayableItem, 'id' | 'createdAt' | 'paidAmount' | 'remainingBalance' | 'status' | 'payments'>): Promise<PayableItem>;
  recordAPPayment(payableId: string, payment: { amount: number; paymentMethod: 'Cash' | 'Bank'; date: string; reference?: string; notes?: string }): Promise<void>;
  
  // Cash & Bank
  getCashRegisters(): Promise<CashRegister[]>;
  openCashRegister(registerName: string, branchName: string, openingBalance: number, openedBy: string): Promise<CashRegister>;
  closeCashRegister(id: string, actualClosingBalance: number, closedBy: string, notes?: string): Promise<void>;
  
  getBankAccounts(): Promise<BankAccount[]>;
  createBankAccount(account: Omit<BankAccount, 'id' | 'createdAt' | 'currentBalance'>, initialBalance?: number): Promise<BankAccount>;
  getBankTransactions(bankAccountId?: string): Promise<BankTransaction[]>;
  transferFunds(fromAccountId: string, toAccountId: string, amount: number, reference: string, description: string): Promise<void>;
  
  // Tax
  getTaxes(): Promise<TaxConfig[]>;
  createTax(tax: Omit<TaxConfig, 'id'>): Promise<TaxConfig>;
  updateTax(id: string, updates: Partial<TaxConfig>): Promise<void>;
  
  // Financial Statements & Reports
  getFinancialStatements(startDate?: string, endDate?: string): Promise<FinancialStatements>;
}
