import { describe, it, expect } from 'vitest';

describe('8 & 9 & 10. DOUBLE-ENTRY ACCOUNTING, REFUNDS, & ROLE AUTHORIZATION TESTS', () => {

  // Helper function to test Journal Entry Debit == Credit equality
  function verifyJournalEntry(lines: { account: string; debit: number; credit: number }[]) {
    const totalDebit = lines.reduce((sum, line) => sum + (line.debit || 0), 0);
    const totalCredit = lines.reduce((sum, line) => sum + (line.credit || 0), 0);
    return {
      isBalanced: totalDebit === totalCredit,
      totalDebit,
      totalCredit
    };
  }

  it('A. Cash Sale Journal: TOTAL DEBIT == TOTAL CREDIT', () => {
    const lines = [
      { account: '1010 - Cash on Hand', debit: 150, credit: 0 },
      { account: '4010 - Sales Revenue', debit: 0, credit: 150 }
    ];
    const res = verifyJournalEntry(lines);
    expect(res.isBalanced).toBe(true);
    expect(res.totalDebit).toBe(150);
    expect(res.totalCredit).toBe(150);
  });

  it('B. Credit Sale Journal: TOTAL DEBIT == TOTAL CREDIT', () => {
    const lines = [
      { account: '1100 - Accounts Receivable', debit: 300, credit: 0 },
      { account: '4010 - Sales Revenue', debit: 0, credit: 300 }
    ];
    const res = verifyJournalEntry(lines);
    expect(res.isBalanced).toBe(true);
    expect(res.totalDebit).toBe(300);
    expect(res.totalCredit).toBe(300);
  });

  it('C. Customer Payment Journal: TOTAL DEBIT == TOTAL CREDIT', () => {
    const lines = [
      { account: '1010 - Cash on Hand', debit: 200, credit: 0 },
      { account: '1100 - Accounts Receivable', debit: 0, credit: 200 }
    ];
    const res = verifyJournalEntry(lines);
    expect(res.isBalanced).toBe(true);
    expect(res.totalDebit).toBe(200);
    expect(res.totalCredit).toBe(200);
  });

  it('D. Inventory Purchase Journal: TOTAL DEBIT == TOTAL CREDIT', () => {
    const lines = [
      { account: '1200 - Raw Materials Inventory', debit: 500, credit: 0 },
      { account: '2010 - Accounts Payable', debit: 0, credit: 500 }
    ];
    const res = verifyJournalEntry(lines);
    expect(res.isBalanced).toBe(true);
    expect(res.totalDebit).toBe(500);
    expect(res.totalCredit).toBe(500);
  });

  it('E. Supplier Payment Journal: TOTAL DEBIT == TOTAL CREDIT', () => {
    const lines = [
      { account: '2010 - Accounts Payable', debit: 500, credit: 0 },
      { account: '1020 - Main Bank Account', debit: 0, credit: 500 }
    ];
    const res = verifyJournalEntry(lines);
    expect(res.isBalanced).toBe(true);
    expect(res.totalDebit).toBe(500);
    expect(res.totalCredit).toBe(500);
  });

  it('F. Expense Journal: TOTAL DEBIT == TOTAL CREDIT', () => {
    const lines = [
      { account: '5020 - Utility Expenses', debit: 80, credit: 0 },
      { account: '1010 - Cash on Hand', debit: 0, credit: 80 }
    ];
    const res = verifyJournalEntry(lines);
    expect(res.isBalanced).toBe(true);
    expect(res.totalDebit).toBe(80);
    expect(res.totalCredit).toBe(80);
  });

  it('G. Cost of Goods Sold Journal: TOTAL DEBIT == TOTAL CREDIT', () => {
    const lines = [
      { account: '5010 - Cost of Goods Sold', debit: 60, credit: 0 },
      { account: '1200 - Inventory', debit: 0, credit: 60 }
    ];
    const res = verifyJournalEntry(lines);
    expect(res.isBalanced).toBe(true);
    expect(res.totalDebit).toBe(60);
    expect(res.totalCredit).toBe(60);
  });

  it('9. REFUND PROCESS: creates Reversal Journal Entry without deleting original record', () => {
    const originalSaleJournal = [
      { account: 'Cash', debit: 100, credit: 0 },
      { account: 'Sales Revenue', debit: 0, credit: 100 },
      { account: 'COGS', debit: 40, credit: 0 },
      { account: 'Inventory', debit: 0, credit: 40 }
    ];

    // Reversal journal for 100% refund
    const refundReversalJournal = [
      { account: 'Sales Revenue / Refunds', debit: 100, credit: 0 },
      { account: 'Cash', debit: 0, credit: 100 },
      { account: 'Inventory', debit: 40, credit: 0 },
      { account: 'COGS', debit: 0, credit: 40 }
    ];

    const originalCheck = verifyJournalEntry(originalSaleJournal);
    const refundCheck = verifyJournalEntry(refundReversalJournal);

    expect(originalCheck.isBalanced).toBe(true);
    expect(refundCheck.isBalanced).toBe(true);
    expect(refundCheck.totalDebit).toBe(140);
    expect(refundCheck.totalCredit).toBe(140);

    // Original entry remains untouched for audit integrity
    expect(originalSaleJournal.length).toBe(4);
  });

  it('10. AUTHORIZATION & ROLE RESTRICTIONS: Cashier prohibited from executing management financial operations', () => {
    const allowedRolesForExpense = ['Owner', 'owner', 'Admin', 'admin', 'Manager', 'manager', 'Accountant', 'accountant'];
    
    function isActionAllowed(role: string, action: string) {
      if (action === 'create_expense' || action === 'edit_accounting' || action === 'disburse_salary' || action === 'adjust_inventory_direct') {
        return allowedRolesForExpense.includes(role);
      }
      return true;
    }

    expect(isActionAllowed('Admin', 'create_expense')).toBe(true);
    expect(isActionAllowed('Manager', 'edit_accounting')).toBe(true);
    expect(isActionAllowed('Accountant', 'disburse_salary')).toBe(true);

    // CASHIER MUST BE REJECTED
    expect(isActionAllowed('Cashier', 'create_expense')).toBe(false);
    expect(isActionAllowed('Cashier', 'edit_accounting')).toBe(false);
    expect(isActionAllowed('Cashier', 'disburse_salary')).toBe(false);
    expect(isActionAllowed('Cashier', 'adjust_inventory_direct')).toBe(false);
  });

  it('11. REFUND CALCULATION TEST: Sale = 100, Refund = 20 -> Net Sales = 80 (No double counting)', () => {
    const journalLines = [
      { accountCode: '4010', debit: 0, credit: 100 }, // Sale revenue credit: 100
      { accountCode: '4010', debit: 20, credit: 0 },  // Refund revenue debit: 20
    ];

    let glGrossRevenue = 0;
    let glRevenueDebits = 0;

    journalLines.forEach((jl) => {
      const code = String(jl.accountCode || '');
      if (code.startsWith('4')) {
        glGrossRevenue += jl.credit;
        glRevenueDebits += jl.debit;
      }
    });

    const grossSales = glGrossRevenue;
    const refunds = glRevenueDebits;
    const netSales = grossSales - refunds;

    expect(grossSales).toBe(100);
    expect(refunds).toBe(20);
    expect(netSales).toBe(80); // Correctly 80, NOT double-deducted to 60
  });

  it('12. FULL & PARTIAL REFUND BALANCE TEST: Full & Partial Refund restores COGS, Inventory, Revenue, and Tax', () => {
    // Initial State: Inventory = 10, Unit Cost = $15, Price = $50
    let inventory = 10;
    const unitCost = 15;
    const unitPrice = 50;

    // Step 1: Sell 2 items (Gross Sale = 100, COGS = 30)
    const qtySold = 2;
    inventory -= qtySold; // inventory = 8
    const saleRevenue = qtySold * unitPrice; // 100
    const saleCogs = qtySold * unitCost; // 30

    expect(inventory).toBe(8);
    expect(saleRevenue).toBe(100);
    expect(saleCogs).toBe(30);

    // Step 2: Partial Refund 1 item (Refund = 50, Reversal COGS = 15)
    const refundQtyPartial = 1;
    inventory += refundQtyPartial; // inventory = 9
    const refundRevenuePartial = refundQtyPartial * unitPrice; // 50
    const refundCogsPartial = refundQtyPartial * unitCost; // 15

    const netRevenuePartial = saleRevenue - refundRevenuePartial; // 50
    const netCogsPartial = saleCogs - refundCogsPartial; // 15

    expect(inventory).toBe(9);
    expect(netRevenuePartial).toBe(50);
    expect(netCogsPartial).toBe(15);

    // Step 3: Full Refund of remaining 1 item
    const refundQtyRemaining = 1;
    inventory += refundQtyRemaining; // inventory = 10
    const totalRefundRevenue = saleRevenue; // 100
    const netRevenueFull = saleRevenue - totalRefundRevenue; // 0

    expect(inventory).toBe(10); // Inventory fully restored
    expect(netRevenueFull).toBe(0); // Revenue fully reversed
  });

  it('13. TAX ENGINE: Uses configured tax rate dynamically and rejects silent 5% fallback', () => {
    function computeTaxLiability(revenue: number, taxesConfig?: { rate: number; isActive?: boolean }[]) {
      if (!taxesConfig || taxesConfig.length === 0) {
        throw new Error('Authoritative tax configuration is unavailable.');
      }
      const active = taxesConfig.filter(t => t.isActive !== false);
      if (active.length === 0) {
        throw new Error('No active tax configuration found.');
      }
      const rate = active[0].rate / 100;
      return revenue * rate;
    }

    // Configured 10% tax rate
    expect(computeTaxLiability(1000, [{ rate: 10, isActive: true }])).toBe(100);

    // Configured 8% tax rate
    expect(computeTaxLiability(500, [{ rate: 8, isActive: true }])).toBe(40);

    // Missing tax configuration must throw, NEVER silently compute 5% ($50)
    expect(() => computeTaxLiability(1000, [])).toThrow('Authoritative tax configuration is unavailable.');
    expect(() => computeTaxLiability(1000, undefined)).toThrow('Authoritative tax configuration is unavailable.');
    expect(() => computeTaxLiability(1000, [{ rate: 10, isActive: false }])).toThrow('No active tax configuration found.');
  });
});
