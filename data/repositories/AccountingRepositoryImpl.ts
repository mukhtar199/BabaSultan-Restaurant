import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db, COLLECTIONS } from '../../lib/firebase';
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

export class AccountingRepositoryImpl implements IAccountingRepository {
  // --- CHART OF ACCOUNTS ---
  async getAccounts(): Promise<Account[]> {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.ACCOUNTS));
      if (snap.empty) {
        // Seed default accounts
        const seeded: Account[] = [];
        for (const item of DEFAULT_ACCOUNTS) {
          const docRef = await addDoc(collection(db, COLLECTIONS.ACCOUNTS), {
            ...item,
            balance: item.type === 'Asset' || item.type === 'COGS' || item.type === 'Expense' ? 1000 : 0,
            createdAt: new Date().toISOString()
          });
          seeded.push({
            id: docRef.id,
            ...item,
            balance: item.type === 'Asset' || item.type === 'COGS' || item.type === 'Expense' ? 1000 : 0,
            createdAt: new Date().toISOString()
          });
        }
        return seeded;
      }
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Account));
    } catch (err: any) {
      console.warn('Note in getAccounts:', err?.message || err);
      return [];
    }
  }

  async createAccount(accountData: Omit<Account, 'id' | 'createdAt' | 'balance'>): Promise<Account> {
    const payload = {
      ...accountData,
      balance: 0,
      createdAt: new Date().toISOString()
    };
    const docRef = await addDoc(collection(db, COLLECTIONS.ACCOUNTS), payload);
    return { id: docRef.id, ...payload };
  }

  async updateAccount(id: string, updates: Partial<Account>): Promise<void> {
    const ref = doc(db, COLLECTIONS.ACCOUNTS, id);
    await updateDoc(ref, updates);
  }

  // --- JOURNAL ENTRIES & LEDGER ---
  async getJournalEntries(): Promise<JournalEntry[]> {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.JOURNAL_ENTRIES));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as JournalEntry));
    } catch (err: any) {
      console.warn('Note in getJournalEntries:', err?.message || err);
      return [];
    }
  }

  async createJournalEntry(entryData: Omit<JournalEntry, 'id' | 'createdAt' | 'entryNumber'>): Promise<JournalEntry> {
    // 1. Enforce balance check
    const totalDebit = entryData.lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
    const totalCredit = entryData.lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(`Journal Entry is unbalanced! Total Debit: $${totalDebit.toFixed(2)}, Total Credit: $${totalCredit.toFixed(2)}`);
    }

    const entryNumber = `JE-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const now = new Date().toISOString();

    const newEntryPayload = {
      ...entryData,
      entryNumber,
      totalDebit,
      totalCredit,
      createdAt: now
    };

    const docRef = await addDoc(collection(db, COLLECTIONS.JOURNAL_ENTRIES), newEntryPayload);
    const entryId = docRef.id;

    // 2. Post to Ledger and update account balances
    const accounts = await this.getAccounts();

    for (const line of entryData.lines) {
      const account = accounts.find(a => a.id === line.accountId || a.code === line.accountCode);
      if (account) {
        // Calculate balance adjustment based on account type
        // Debit increases Assets, COGS, Expenses. Credit increases Liabilities, Equity, Revenue.
        let balanceDelta = 0;
        if (['Asset', 'COGS', 'Expense'].includes(account.type)) {
          balanceDelta = (Number(line.debit) || 0) - (Number(line.credit) || 0);
        } else {
          balanceDelta = (Number(line.credit) || 0) - (Number(line.debit) || 0);
        }

        const newBalance = (account.balance || 0) + balanceDelta;
        await this.updateAccount(account.id, { balance: newBalance });

        // Add Ledger entry
        await addDoc(collection(db, COLLECTIONS.LEDGER), {
          accountId: account.id,
          accountCode: account.code,
          accountName: account.name,
          journalEntryId: entryId,
          entryNumber,
          date: entryData.date,
          reference: entryData.reference || '',
          description: line.memo || entryData.description,
          debit: Number(line.debit) || 0,
          credit: Number(line.credit) || 0,
          runningBalance: newBalance,
          createdAt: now
        });
      }
    }

    return { id: entryId, ...newEntryPayload };
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
      console.warn('Note in getLedger:', err?.message || err);
      return [];
    }
  }

  // --- EXPENSES ---
  async getExpenses(): Promise<AccountingExpense[]> {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.EXPENSES));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as AccountingExpense));
    } catch (err: any) {
      console.warn('Note in getExpenses:', err?.message || err);
      return [];
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

    const docRef = await addDoc(collection(db, COLLECTIONS.EXPENSES), payload);
    const createdExpense = { id: docRef.id, ...payload };

    // Auto-create balanced Journal Entry
    // Debit: Expense Account (e.g. 6010 Rent)
    // Credit: Cash/Bank Account (e.g. 1010 or 1020)
    try {
      const accounts = await this.getAccounts();
      const expAcc = accounts.find(a => a.id === expenseData.expenseAccountId) || accounts.find(a => a.type === 'Expense');
      const payAcc = accounts.find(a => a.id === expenseData.paidFromAccountId) || accounts.find(a => a.code === (expenseData.paymentMethod === 'Bank' ? '1020' : '1010'));

      if (expAcc && payAcc) {
        await this.createJournalEntry({
          date: expenseData.date,
          reference: expenseNumber,
          description: `Expense: ${expenseData.title} (${expenseData.category})`,
          source: 'Expense',
          status: 'Posted',
          createdBy: 'Accounting System',
          totalDebit: expenseData.amount,
          totalCredit: expenseData.amount,
          lines: [
            {
              id: `l1-${Date.now()}`,
              journalEntryId: '',
              accountId: expAcc.id,
              accountCode: expAcc.code,
              accountName: expAcc.name,
              debit: expenseData.amount,
              credit: 0,
              memo: expenseData.notes || expenseData.title
            },
            {
              id: `l2-${Date.now()}`,
              journalEntryId: '',
              accountId: payAcc.id,
              accountCode: payAcc.code,
              accountName: payAcc.name,
              debit: 0,
              credit: expenseData.amount,
              memo: `Paid via ${expenseData.paymentMethod}`
            }
          ]
        });
      }
    } catch (jErr) {
      console.error('Failed to post auto-journal entry for expense:', jErr);
    }

    return createdExpense;
  }

  // --- REVENUES ---
  async getRevenues(): Promise<AccountingRevenue[]> {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.REVENUES));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as AccountingRevenue));
    } catch (err: any) {
      console.warn('Note in getRevenues:', err?.message || err);
      return [];
    }
  }

  async createRevenue(revenueData: Omit<AccountingRevenue, 'id' | 'createdAt' | 'revenueNumber'>): Promise<AccountingRevenue> {
    const revenueNumber = `REV-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date().toISOString();

    const payload = {
      ...revenueData,
      revenueNumber,
      createdAt: now
    };

    const docRef = await addDoc(collection(db, COLLECTIONS.REVENUES), payload);

    // Auto Journal Entry
    try {
      const accounts = await this.getAccounts();
      const revAcc = accounts.find(a => a.id === revenueData.revenueAccountId) || accounts.find(a => a.code === '4010');
      const depAcc = accounts.find(a => a.id === revenueData.depositToAccountId) || accounts.find(a => a.code === (revenueData.paymentMethod === 'Bank' ? '1020' : '1010'));

      if (revAcc && depAcc) {
        await this.createJournalEntry({
          date: revenueData.date,
          reference: revenueNumber,
          description: `Revenue: ${revenueData.category} (${revenueData.customerName || 'Walk-in'})`,
          source: 'Sales',
          status: 'Posted',
          createdBy: 'Accounting System',
          totalDebit: revenueData.amount,
          totalCredit: revenueData.amount,
          lines: [
            {
              id: `l1-${Date.now()}`,
              journalEntryId: '',
              accountId: depAcc.id,
              accountCode: depAcc.code,
              accountName: depAcc.name,
              debit: revenueData.amount,
              credit: 0,
              memo: `Deposit via ${revenueData.paymentMethod}`
            },
            {
              id: `l2-${Date.now()}`,
              journalEntryId: '',
              accountId: revAcc.id,
              accountCode: revAcc.code,
              accountName: revAcc.name,
              debit: 0,
              credit: revenueData.amount,
              memo: revenueData.notes || revenueData.category
            }
          ]
        });
      }
    } catch (jErr) {
      console.error('Failed to post auto-journal entry for revenue:', jErr);
    }

    return { id: docRef.id, ...payload };
  }

  // --- ACCOUNTS RECEIVABLE ---
  async getReceivables(): Promise<ReceivableItem[]> {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.RECEIVABLES));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as ReceivableItem));
    } catch (err: any) {
      console.warn('Note in getReceivables:', err?.message || err);
      return [];
    }
  }

  async createReceivable(itemData: Omit<ReceivableItem, 'id' | 'createdAt' | 'paidAmount' | 'remainingBalance' | 'status' | 'payments'>): Promise<ReceivableItem> {
    const payload = {
      ...itemData,
      paidAmount: 0,
      remainingBalance: itemData.totalAmount,
      status: 'Unpaid' as const,
      payments: [],
      createdAt: new Date().toISOString()
    };
    const docRef = await addDoc(collection(db, COLLECTIONS.RECEIVABLES), payload);

    // Auto Journal Entry: Debit Accounts Receivable (1100), Credit Restaurant Sales (4010)
    try {
      const accounts = await this.getAccounts();
      const arAcc = accounts.find(a => a.code === '1100');
      const salesAcc = accounts.find(a => a.code === '4010');

      if (arAcc && salesAcc) {
        await this.createJournalEntry({
          date: itemData.issueDate,
          reference: itemData.invoiceNumber,
          description: `AR Invoice to ${itemData.customerName}`,
          source: 'Sales',
          status: 'Posted',
          createdBy: 'Accounting System',
          totalDebit: itemData.totalAmount,
          totalCredit: itemData.totalAmount,
          lines: [
            { id: `l1-${Date.now()}`, journalEntryId: '', accountId: arAcc.id, accountCode: arAcc.code, accountName: arAcc.name, debit: itemData.totalAmount, credit: 0, memo: `Invoice ${itemData.invoiceNumber}` },
            { id: `l2-${Date.now()}`, journalEntryId: '', accountId: salesAcc.id, accountCode: salesAcc.code, accountName: salesAcc.name, debit: 0, credit: itemData.totalAmount, memo: `Sales for Invoice ${itemData.invoiceNumber}` }
          ]
        });
      }
    } catch (e) {
      console.error('AR journal entry error:', e);
    }

    return { id: docRef.id, ...payload };
  }

  async recordARPayment(receivableId: string, payment: { amount: number; paymentMethod: 'Cash' | 'Bank'; date: string; reference?: string; notes?: string }): Promise<void> {
    const ref = doc(db, COLLECTIONS.RECEIVABLES, receivableId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    const item = snap.data() as ReceivableItem;
    const newPaidAmount = (item.paidAmount || 0) + payment.amount;
    const newRemaining = Math.max(0, item.totalAmount - newPaidAmount);
    const newStatus = newRemaining === 0 ? 'Paid' : 'Partial';

    const newPayment: ARPayment = {
      id: `pay-${Date.now()}`,
      date: payment.date,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      reference: payment.reference,
      notes: payment.notes
    };

    await updateDoc(ref, {
      paidAmount: newPaidAmount,
      remainingBalance: newRemaining,
      status: newStatus,
      payments: [...(item.payments || []), newPayment]
    });

    // Auto Journal Entry: Debit Cash/Bank (1010/1020), Credit Accounts Receivable (1100)
    try {
      const accounts = await this.getAccounts();
      const arAcc = accounts.find(a => a.code === '1100');
      const assetAcc = accounts.find(a => a.code === (payment.paymentMethod === 'Bank' ? '1020' : '1010'));

      if (arAcc && assetAcc) {
        await this.createJournalEntry({
          date: payment.date,
          reference: payment.reference || item.invoiceNumber,
          description: `AR Payment from ${item.customerName}`,
          source: 'Sales',
          status: 'Posted',
          createdBy: 'Accounting System',
          totalDebit: payment.amount,
          totalCredit: payment.amount,
          lines: [
            { id: `l1-${Date.now()}`, journalEntryId: '', accountId: assetAcc.id, accountCode: assetAcc.code, accountName: assetAcc.name, debit: payment.amount, credit: 0, memo: `Payment via ${payment.paymentMethod}` },
            { id: `l2-${Date.now()}`, journalEntryId: '', accountId: arAcc.id, accountCode: arAcc.code, accountName: arAcc.name, debit: 0, credit: payment.amount, memo: `Clear AR Invoice ${item.invoiceNumber}` }
          ]
        });
      }
    } catch (e) {
      console.error('AR Payment journal error:', e);
    }
  }

  // --- ACCOUNTS PAYABLE ---
  async getPayables(): Promise<PayableItem[]> {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.PAYABLES));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as PayableItem));
    } catch (err: any) {
      console.warn('Note in getPayables:', err?.message || err);
      return [];
    }
  }

  async createPayable(itemData: Omit<PayableItem, 'id' | 'createdAt' | 'paidAmount' | 'remainingBalance' | 'status' | 'payments'>): Promise<PayableItem> {
    const payload = {
      ...itemData,
      paidAmount: 0,
      remainingBalance: itemData.totalAmount,
      status: 'Unpaid' as const,
      payments: [],
      createdAt: new Date().toISOString()
    };
    const docRef = await addDoc(collection(db, COLLECTIONS.PAYABLES), payload);

    // Auto Journal Entry: Debit Food & Beverage COGS (5010) or Inventory Asset (1200), Credit Accounts Payable (2010)
    try {
      const accounts = await this.getAccounts();
      const apAcc = accounts.find(a => a.code === '2010');
      const cogsAcc = accounts.find(a => a.code === '5010');

      if (apAcc && cogsAcc) {
        await this.createJournalEntry({
          date: itemData.issueDate,
          reference: itemData.billNumber,
          description: `AP Bill from ${itemData.supplierName}`,
          source: 'Purchases',
          status: 'Posted',
          createdBy: 'Accounting System',
          totalDebit: itemData.totalAmount,
          totalCredit: itemData.totalAmount,
          lines: [
            { id: `l1-${Date.now()}`, journalEntryId: '', accountId: cogsAcc.id, accountCode: cogsAcc.code, accountName: cogsAcc.name, debit: itemData.totalAmount, credit: 0, memo: `Purchase bill ${itemData.billNumber}` },
            { id: `l2-${Date.now()}`, journalEntryId: '', accountId: apAcc.id, accountCode: apAcc.code, accountName: apAcc.name, debit: 0, credit: itemData.totalAmount, memo: `Accounts Payable to ${itemData.supplierName}` }
          ]
        });
      }
    } catch (e) {
      console.error('AP bill journal entry error:', e);
    }

    return { id: docRef.id, ...payload };
  }

  async recordAPPayment(payableId: string, payment: { amount: number; paymentMethod: 'Cash' | 'Bank'; date: string; reference?: string; notes?: string }): Promise<void> {
    const ref = doc(db, COLLECTIONS.PAYABLES, payableId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    const item = snap.data() as PayableItem;
    const newPaidAmount = (item.paidAmount || 0) + payment.amount;
    const newRemaining = Math.max(0, item.totalAmount - newPaidAmount);
    const newStatus = newRemaining === 0 ? 'Paid' : 'Partial';

    const newPayment: APPayment = {
      id: `pay-${Date.now()}`,
      date: payment.date,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      reference: payment.reference,
      notes: payment.notes
    };

    await updateDoc(ref, {
      paidAmount: newPaidAmount,
      remainingBalance: newRemaining,
      status: newStatus,
      payments: [...(item.payments || []), newPayment]
    });

    // Auto Journal Entry: Debit Accounts Payable (2010), Credit Cash/Bank (1010/1020)
    try {
      const accounts = await this.getAccounts();
      const apAcc = accounts.find(a => a.code === '2010');
      const assetAcc = accounts.find(a => a.code === (payment.paymentMethod === 'Bank' ? '1020' : '1010'));

      if (apAcc && assetAcc) {
        await this.createJournalEntry({
          date: payment.date,
          reference: payment.reference || item.billNumber,
          description: `AP Payment to ${item.supplierName}`,
          source: 'SupplierPayment',
          status: 'Posted',
          createdBy: 'Accounting System',
          totalDebit: payment.amount,
          totalCredit: payment.amount,
          lines: [
            { id: `l1-${Date.now()}`, journalEntryId: '', accountId: apAcc.id, accountCode: apAcc.code, accountName: apAcc.name, debit: payment.amount, credit: 0, memo: `Clear AP Bill ${item.billNumber}` },
            { id: `l2-${Date.now()}`, journalEntryId: '', accountId: assetAcc.id, accountCode: assetAcc.code, accountName: assetAcc.name, debit: 0, credit: payment.amount, memo: `Payment via ${payment.paymentMethod}` }
          ]
        });
      }
    } catch (e) {
      console.error('AP Payment journal error:', e);
    }
  }

  // --- CASH & BANK ---
  async getCashRegisters(): Promise<CashRegister[]> {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.CASH_REGISTERS));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as CashRegister));
    } catch (err: any) {
      console.warn('Note in getCashRegisters:', err?.message || err);
      return [];
    }
  }

  async openCashRegister(registerName: string, branchName: string, openingBalance: number, openedBy: string): Promise<CashRegister> {
    const payload: Omit<CashRegister, 'id'> = {
      registerName,
      branchName,
      openedBy,
      openedAt: new Date().toISOString(),
      openingBalance,
      cashSales: 0,
      cashPayouts: 0,
      expectedClosingBalance: openingBalance,
      status: 'Open'
    };
    const docRef = await addDoc(collection(db, COLLECTIONS.CASH_REGISTERS), payload);
    return { id: docRef.id, ...payload };
  }

  async closeCashRegister(id: string, actualClosingBalance: number, closedBy: string, notes?: string): Promise<void> {
    const ref = doc(db, COLLECTIONS.CASH_REGISTERS, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    const reg = snap.data() as CashRegister;
    const diff = actualClosingBalance - reg.expectedClosingBalance;

    await updateDoc(ref, {
      closedBy,
      closedAt: new Date().toISOString(),
      actualClosingBalance,
      difference: diff,
      status: 'Closed',
      notes: notes || ''
    });
  }

  async getBankAccounts(): Promise<BankAccount[]> {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.BANK_ACCOUNTS));
      if (snap.empty) {
        const seeded: BankAccount[] = [];
        const item = {
          bankName: 'Premier Bank Corporate',
          accountNumber: '0100-889922-01',
          accountName: 'Enterprise Restaurant Ops',
          branchName: 'Main Branch',
          currentBalance: 25000,
          currency: 'USD',
          status: 'Active' as const,
          createdAt: new Date().toISOString()
        };
        const docRef = await addDoc(collection(db, COLLECTIONS.BANK_ACCOUNTS), item);
        seeded.push({ id: docRef.id, ...item });
        return seeded;
      }
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as BankAccount));
    } catch (err: any) {
      console.warn('Note in getBankAccounts:', err?.message || err);
      return [];
    }
  }

  async createBankAccount(accountData: Omit<BankAccount, 'id' | 'createdAt' | 'currentBalance'>, initialBalance = 0): Promise<BankAccount> {
    const payload = {
      ...accountData,
      currentBalance: initialBalance,
      createdAt: new Date().toISOString()
    };
    const docRef = await addDoc(collection(db, COLLECTIONS.BANK_ACCOUNTS), payload);
    return { id: docRef.id, ...payload };
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
      console.warn('Note in getBankTransactions:', err?.message || err);
      return [];
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

    // Post balanced Journal Entry
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
          const docRef = await addDoc(collection(db, COLLECTIONS.TAXES), item);
          seeded.push({ id: docRef.id, ...item });
        }
        return seeded;
      }
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as TaxConfig));
    } catch (err: any) {
      console.warn('Note in getTaxes:', err?.message || err);
      return [];
    }
  }

  async createTax(taxData: Omit<TaxConfig, 'id'>): Promise<TaxConfig> {
    const docRef = await addDoc(collection(db, COLLECTIONS.TAXES), taxData);
    return { id: docRef.id, ...taxData };
  }

  async updateTax(id: string, updates: Partial<TaxConfig>): Promise<void> {
    const ref = doc(db, COLLECTIONS.TAXES, id);
    await updateDoc(ref, updates);
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
        // Add current net profit to Retained Earnings
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
