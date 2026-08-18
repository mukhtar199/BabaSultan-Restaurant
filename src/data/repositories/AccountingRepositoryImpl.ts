import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db, COLLECTIONS, addExpenseFirestore, getAuthToken } from '../../lib/firebase';
import {
  Account,
  AccountType,
  JournalEntry,
  JournalLine,
  LedgerEntry,
  AccountingExpense,
  AccountingRevenue,
  ReceivableItem,
  PayableItem,
  CashRegister,
  BankAccount,
  BankTransaction,
  TaxConfig,
  FinancialStatements,
  ARPayment,
  APPayment
} from '../../domain/entities/accounting';
import { IAccountingRepository } from '../../domain/repositories/IAccountingRepository';

const DEFAULT_ACCOUNTS: Omit<Account, 'id' | 'createdAt' | 'balance'>[] = [
  // Assets
  { code: '1010', name: 'Cash on Hand (Register)', type: 'Asset', isSystem: true, status: 'Active', currency: 'USD', description: 'Petty cash and till balances' },
  { code: '1020', name: 'Main Bank Account (Premier Bank)', type: 'Asset', isSystem: true, status: 'Active', currency: 'USD', description: 'Primary operational bank account' },
  { code: '1100', name: 'Accounts Receivable', type: 'Asset', isSystem: true, status: 'Active', currency: 'USD', description: 'Customer pending balances' },
  { code: '1200', name: 'Inventory Asset', type: 'Asset', isSystem: true, status: 'Active', currency: 'USD', description: 'Raw food & ingredient stock value' },

  // Liabilities
  { code: '2010', name: 'Accounts Payable', type: 'Liability', isSystem: true, status: 'Active', currency: 'USD', description: 'Supplier pending bills' },
  { code: '2020', name: 'Sales Tax Payable', type: 'Liability', isSystem: true, status: 'Active', currency: 'USD', description: 'Collected sales tax owed to govt' },
  { code: '2030', name: 'Salaries Payable', type: 'Liability', isSystem: true, status: 'Active', currency: 'USD', description: 'Accrued employee wages' },

  // Equity
  { code: '3010', name: "Owner's Equity", type: 'Equity', isSystem: true, status: 'Active', currency: 'USD', description: 'Owner capital investment' },
  { code: '3020', name: 'Retained Earnings', type: 'Equity', isSystem: true, status: 'Active', currency: 'USD', description: 'Accumulated business profits' },

  // Revenue
  { code: '4010', name: 'Restaurant Sales Revenue', type: 'Revenue', isSystem: true, status: 'Active', currency: 'USD', description: 'Dine-in and takeaway sales' },
  { code: '4020', name: 'Catering Revenue', type: 'Revenue', isSystem: true, status: 'Active', currency: 'USD', description: 'Event catering revenue' },
  { code: '4030', name: 'Delivery Service Revenue', type: 'Revenue', isSystem: true, status: 'Active', currency: 'USD', description: 'Delivery fees collected' },

  // COGS
  { code: '5010', name: 'Food & Beverage COGS', type: 'COGS', isSystem: true, status: 'Active', currency: 'USD', description: 'Direct food raw material costs' },
  { code: '5020', name: 'Packaging COGS', type: 'COGS', isSystem: true, status: 'Active', currency: 'USD', description: 'Takeaway boxes & consumables' },

  // Expenses
  { code: '6010', name: 'Rent Expense', type: 'Expense', isSystem: true, status: 'Active', currency: 'USD', description: 'Facility lease and rental fees' },
  { code: '6020', name: 'Salaries & Wages Expense', type: 'Expense', isSystem: true, status: 'Active', currency: 'USD', description: 'Staff payroll & bonuses' },
  { code: '6030', name: 'Electricity Expense', type: 'Expense', isSystem: true, status: 'Active', currency: 'USD', description: 'Electricity grid and generator diesel' },
  { code: '6040', name: 'Water Expense', type: 'Expense', isSystem: true, status: 'Active', currency: 'USD', description: 'Water utility bills' },
  { code: '6050', name: 'Internet & Telecom Expense', type: 'Expense', isSystem: true, status: 'Active', currency: 'USD', description: 'Fiber internet and mobile POS data' },
  { code: '6060', name: 'Gas & Cooking Fuel Expense', type: 'Expense', isSystem: true, status: 'Active', currency: 'USD', description: 'LPG gas cylinders for kitchen' },
  { code: '6070', name: 'Marketing Expense', type: 'Expense', isSystem: true, status: 'Active', currency: 'USD', description: 'Social media & flyer promotion' },
  { code: '6080', name: 'Maintenance Expense', type: 'Expense', isSystem: true, status: 'Active', currency: 'USD', description: 'Kitchen equipment & interior repairs' },
  { code: '6090', name: 'Transportation Expense', type: 'Expense', isSystem: true, status: 'Active', currency: 'USD', description: 'Fuel & transport costs' },
  { code: '6100', name: 'Miscellaneous Expense', type: 'Expense', isSystem: true, status: 'Active', currency: 'USD', description: 'General operational overheads' }
];

const DEFAULT_TAXES: Omit<TaxConfig, 'id'>[] = [
  { name: 'VAT 5%', code: 'VAT5', rate: 5, type: 'Both', isDefault: true, status: 'Active' },
  { name: 'Sales Tax 10%', code: 'ST10', rate: 10, type: 'Sales', isDefault: false, status: 'Active' },
  { name: 'Zero Rated 0%', code: 'ZERO0', rate: 0, type: 'Both', isDefault: false, status: 'Active' }
];

async function authFetch(url: string, options: RequestInit = {}) {
  const token = await getAuthToken();
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export class AccountingRepositoryImpl implements IAccountingRepository {
  // --- CHART OF ACCOUNTS ---
  async getAccounts(): Promise<Account[]> {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.ACCOUNTS));
      if (snap.empty) {
        // Seed via backend API or return default account structures
        const seeded: Account[] = [];
        for (const item of DEFAULT_ACCOUNTS) {
          try {
            const res = await authFetch('/api/accounting/accounts', {
              method: 'POST',
              body: JSON.stringify({
                ...item,
                balance: 0
              })
            });
            seeded.push(res);
          } catch {
            seeded.push({
              id: `def-${item.code}`,
              ...item,
              balance: 0,
              createdAt: new Date().toISOString()
            });
          }
        }
        return seeded;
      }
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Account));
    } catch (err: any) {
      console.error('Error in getAccounts:', err?.message || err);
      throw err;
    }
  }

  async createAccount(accountData: Omit<Account, 'id' | 'createdAt' | 'balance'>): Promise<Account> {
    return authFetch('/api/accounting/accounts', {
      method: 'POST',
      body: JSON.stringify(accountData)
    });
  }

  async updateAccount(id: string, updates: Partial<Account>): Promise<void> {
    await authFetch(`/api/accounting/accounts/${id}`, {
      method: 'POST',
      body: JSON.stringify(updates)
    });
  }

  // --- JOURNAL ENTRIES & LEDGER ---
  async getJournalEntries(): Promise<JournalEntry[]> {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.JOURNAL_ENTRIES));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as JournalEntry));
    } catch (err: any) {
      console.error('Error in getJournalEntries:', err?.message || err);
      throw err;
    }
  }

  async createJournalEntry(entryData: Omit<JournalEntry, 'id' | 'createdAt' | 'entryNumber'>): Promise<JournalEntry> {
    return authFetch('/api/accounting/journal-entries', {
      method: 'POST',
      body: JSON.stringify(entryData)
    });
  }

  async getLedger(accountId?: string, startDate?: string, endDate?: string): Promise<LedgerEntry[]> {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.LEDGER));
      let entries = snap.docs.map(d => ({ id: d.id, ...d.data() } as LedgerEntry));

      if (accountId) {
        entries = entries.filter(e => e.accountId === accountId);
      }
      if (startDate) {
        entries = entries.filter(e => e.date >= startDate);
      }
      if (endDate) {
        entries = entries.filter(e => e.date <= endDate);
      }

      return entries.sort((a, b) => a.date.localeCompare(b.date));
    } catch (err: any) {
      console.error('Error in getLedger:', err?.message || err);
      throw err;
    }
  }

  // --- EXPENSES ---
  async getExpenses(): Promise<AccountingExpense[]> {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.EXPENSES));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as AccountingExpense));
    } catch (err: any) {
      console.error('Error in getExpenses:', err?.message || err);
      throw err;
    }
  }

  async createExpense(expenseData: Omit<AccountingExpense, 'id' | 'createdAt' | 'expenseNumber'>): Promise<AccountingExpense> {
    const expenseNumber = `EXP-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date().toISOString();

    const payload = {
      ...expenseData,
      expenseNumber,
      createdAt: now
    };

    const expenseId = await addExpenseFirestore(payload as any);
    return { id: expenseId, ...payload };
  }

  // --- REVENUES ---
  async getRevenues(): Promise<AccountingRevenue[]> {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.REVENUES));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as AccountingRevenue));
    } catch (err: any) {
      console.error('Error in getRevenues:', err?.message || err);
      throw err;
    }
  }

  async createRevenue(revenueData: Omit<AccountingRevenue, 'id' | 'createdAt' | 'revenueNumber'>): Promise<AccountingRevenue> {
    return authFetch('/api/accounting/revenues', {
      method: 'POST',
      body: JSON.stringify(revenueData)
    });
  }

  // --- ACCOUNTS RECEIVABLE ---
  async getReceivables(): Promise<ReceivableItem[]> {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.RECEIVABLES));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as ReceivableItem));
    } catch (err: any) {
      console.error('Error in getReceivables:', err?.message || err);
      throw err;
    }
  }

  async createReceivable(itemData: Omit<ReceivableItem, 'id' | 'createdAt' | 'paidAmount' | 'remainingBalance' | 'status' | 'payments'>): Promise<ReceivableItem> {
    return authFetch('/api/accounting/receivables', {
      method: 'POST',
      body: JSON.stringify(itemData)
    });
  }

  async recordARPayment(receivableId: string, payment: { amount: number; paymentMethod: 'Cash' | 'Bank'; date: string; reference?: string; notes?: string }): Promise<void> {
    await authFetch(`/api/accounting/receivables/${receivableId}/payment`, {
      method: 'POST',
      body: JSON.stringify(payment)
    });
  }

  // --- ACCOUNTS PAYABLE ---
  async getPayables(): Promise<PayableItem[]> {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.PAYABLES));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as PayableItem));
    } catch (err: any) {
      console.error('Error in getPayables:', err?.message || err);
      throw err;
    }
  }

  async createPayable(itemData: Omit<PayableItem, 'id' | 'createdAt' | 'paidAmount' | 'remainingBalance' | 'status' | 'payments'>): Promise<PayableItem> {
    return authFetch('/api/accounting/payables', {
      method: 'POST',
      body: JSON.stringify(itemData)
    });
  }

  async recordAPPayment(payableId: string, payment: { amount: number; paymentMethod: 'Cash' | 'Bank'; date: string; reference?: string; notes?: string }): Promise<void> {
    await authFetch(`/api/accounting/payables/${payableId}/payment`, {
      method: 'POST',
      body: JSON.stringify(payment)
    });
  }

  // --- CASH & BANK ---
  async getCashRegisters(): Promise<CashRegister[]> {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.CASH_REGISTERS));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as CashRegister));
    } catch (err: any) {
      console.error('Error in getCashRegisters:', err?.message || err);
      throw err;
    }
  }

  async openCashRegister(registerName: string, branchName: string, openingBalance: number, openedBy: string, branchId?: string): Promise<CashRegister> {
    return authFetch('/api/accounting/cash-registers/open', {
      method: 'POST',
      body: JSON.stringify({ registerName, branchName, openingBalance, openedBy, branchId })
    });
  }

  async closeCashRegister(id: string, actualClosingBalance: number, closedBy: string, notes?: string): Promise<void> {
    await authFetch('/api/accounting/cash-registers/close', {
      method: 'POST',
      body: JSON.stringify({ id, actualClosingBalance, closedBy, notes })
    });
  }

  async getBankAccounts(): Promise<BankAccount[]> {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.BANK_ACCOUNTS));
      if (snap.empty) {
        const item = {
          bankName: 'Premier Bank Corporate',
          accountNumber: '0100-889922-01',
          accountName: 'Enterprise Restaurant Ops',
          branchName: 'Main Branch',
          currentBalance: 0,
          currency: 'USD',
          status: 'Active' as const
        };
        try {
          const res = await authFetch('/api/accounting/bank-accounts', {
            method: 'POST',
            body: JSON.stringify(item)
          });
          return [res];
        } catch {
          return [{ id: 'def-bank-1', ...item, createdAt: new Date().toISOString() }];
        }
      }
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as BankAccount));
    } catch (err: any) {
      console.error('Error in getBankAccounts:', err?.message || err);
      throw err;
    }
  }

  async createBankAccount(accountData: Omit<BankAccount, 'id' | 'createdAt' | 'currentBalance'>, initialBalance = 0): Promise<BankAccount> {
    return authFetch('/api/accounting/bank-accounts', {
      method: 'POST',
      body: JSON.stringify({ ...accountData, initialBalance })
    });
  }

  async getBankTransactions(bankAccountId?: string): Promise<BankTransaction[]> {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.BANK_TRANSACTIONS));
      let items = snap.docs.map(d => ({ id: d.id, ...d.data() } as BankTransaction));
      if (bankAccountId) {
        items = items.filter(t => t.bankAccountId === bankAccountId);
      }
      return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch (err: any) {
      console.error('Error in getBankTransactions:', err?.message || err);
      throw err;
    }
  }

  async transferFunds(fromAccountId: string, toAccountId: string, amount: number, reference: string, description: string): Promise<void> {
    const accounts = await this.getAccounts();
    const fromAcc = accounts.find(a => a.id === fromAccountId);
    const toAcc = accounts.find(a => a.id === toAccountId);

    if (!fromAcc || !toAcc) {
      throw new Error('Invalid account selected for transfer');
    }

    if (fromAcc.balance < amount) {
      throw new Error(`Insufficient funds in source account ${fromAcc.name}! Balance: $${fromAcc.balance}`);
    }

    // Post balanced Journal Entry via server endpoint
    await this.createJournalEntry({
      date: new Date().toISOString().split('T')[0],
      reference,
      description: `Fund Transfer: ${fromAcc.name} -> ${toAcc.name} (${description})`,
      source: 'Manual',
      status: 'Posted',
      createdBy: 'Accounting System',
      totalDebit: amount,
      totalCredit: amount,
      lines: [
        { id: `l1-${Date.now()}`, journalEntryId: '', accountId: toAcc.id, accountCode: toAcc.code, accountName: toAcc.name, debit: amount, credit: 0, memo: `Deposit into ${toAcc.name}` },
        { id: `l2-${Date.now()}`, journalEntryId: '', accountId: fromAcc.id, accountCode: fromAcc.code, accountName: fromAcc.name, debit: 0, credit: amount, memo: `Transfer out from ${fromAcc.name}` }
      ]
    });
  }

  // --- TAX ---
  async getTaxes(): Promise<TaxConfig[]> {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.TAXES));
      if (snap.empty) {
        const seeded: TaxConfig[] = [];
        for (const item of DEFAULT_TAXES) {
          try {
            const res = await authFetch('/api/accounting/taxes', {
              method: 'POST',
              body: JSON.stringify(item)
            });
            seeded.push(res);
          } catch {
            seeded.push({ id: `def-tax-${item.code}`, ...item });
          }
        }
        return seeded;
      }
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as TaxConfig));
    } catch (err: any) {
      console.error('Error in getTaxes:', err?.message || err);
      throw err;
    }
  }

  async createTax(taxData: Omit<TaxConfig, 'id'>): Promise<TaxConfig> {
    return authFetch('/api/accounting/taxes', {
      method: 'POST',
      body: JSON.stringify(taxData)
    });
  }

  async updateTax(id: string, updates: Partial<TaxConfig>): Promise<void> {
    await authFetch(`/api/accounting/taxes/${id}`, {
      method: 'POST',
      body: JSON.stringify(updates)
    });
  }

  // --- FINANCIAL STATEMENTS ---
  async getFinancialStatements(startDate?: string, endDate?: string): Promise<FinancialStatements> {
    const accounts = await this.getAccounts();

    // Group accounts by type
    const revenuesList = accounts.filter(a => a.type === 'Revenue').map(a => ({ accountCode: a.code, accountName: a.name, amount: Math.abs(a.balance) }));
    const totalRevenue = revenuesList.reduce((s, r) => s + r.amount, 0);

    const cogsList = accounts.filter(a => a.type === 'COGS').map(a => ({ accountCode: a.code, accountName: a.name, amount: Math.abs(a.balance) }));
    const totalCOGS = cogsList.reduce((s, c) => s + c.amount, 0);

    const grossProfit = totalRevenue - totalCOGS;

    const expensesList = accounts.filter(a => a.type === 'Expense').map(a => ({ accountCode: a.code, accountName: a.name, amount: Math.abs(a.balance) }));
    const totalExpenses = expensesList.reduce((s, e) => s + e.amount, 0);

    const netProfit = grossProfit - totalExpenses;

    // Balance Sheet
    const assetsList = accounts.filter(a => a.type === 'Asset').map(a => ({ accountCode: a.code, accountName: a.name, amount: a.balance }));
    const totalAssets = assetsList.reduce((s, a) => s + a.amount, 0);

    const liabilitiesList = accounts.filter(a => a.type === 'Liability').map(a => ({ accountCode: a.code, accountName: a.name, amount: a.balance }));
    const totalLiabilities = liabilitiesList.reduce((s, l) => s + l.amount, 0);

    const equityList = accounts.filter(a => a.type === 'Equity').map(a => {
      let val = a.balance;
      if (a.code === '3020') {
        val += netProfit;
      }
      return { accountCode: a.code, accountName: a.name, amount: val };
    });
    const totalEquity = equityList.reduce((s, e) => s + e.amount, 0);

    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;
    const isBalanced = Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.05;

    // Trial Balance
    const trialBalance = accounts.map(a => {
      let debitBalance = 0;
      let creditBalance = 0;

      if (['Asset', 'COGS', 'Expense'].includes(a.type)) {
        if (a.balance >= 0) debitBalance = a.balance;
        else creditBalance = Math.abs(a.balance);
      } else {
        if (a.balance >= 0) creditBalance = a.balance;
        else debitBalance = Math.abs(a.balance);
      }

      return {
        accountCode: a.code,
        accountName: a.name,
        type: a.type,
        debitBalance,
        creditBalance
      };
    });

    const totalTrialDebit = trialBalance.reduce((s, t) => s + t.debitBalance, 0);
    const totalTrialCredit = trialBalance.reduce((s, t) => s + t.creditBalance, 0);
    const isTrialBalanced = Math.abs(totalTrialDebit - totalTrialCredit) < 0.05;

    return {
      profitAndLoss: {
        revenue: revenuesList,
        totalRevenue,
        cogs: cogsList,
        totalCOGS,
        grossProfit,
        expenses: expensesList,
        totalExpenses,
        netProfit
      },
      balanceSheet: {
        assets: assetsList,
        totalAssets,
        liabilities: liabilitiesList,
        totalLiabilities,
        equity: equityList,
        totalEquity,
        totalLiabilitiesAndEquity,
        isBalanced
      },
      trialBalance,
      totalTrialDebit,
      totalTrialCredit,
      isTrialBalanced
    };
  }
}
