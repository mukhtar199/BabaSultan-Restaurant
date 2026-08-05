import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db, COLLECTIONS } from '../../lib/firebase';
import { IFinancialsRepository } from '../../domain/repositories/IFinancialsRepository';
import { NewExpensePayload, BankTransactionPayload, FinancialSummary } from '../../domain/entities/financials';
import { Expense, Order } from '../../types';

export class FinancialsRepositoryImpl implements IFinancialsRepository {
  async fetchExpenses(): Promise<Expense[]> {
    const snap = await getDocs(collection(db, COLLECTIONS.EXPENSES));
    const list: Expense[] = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() } as Expense));
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createExpense(payload: NewExpensePayload): Promise<Expense> {
    const data = {
      ...payload,
      category: (payload.category.toLowerCase() as any) || 'other',
      createdAt: new Date().toISOString()
    };
    const docRef = await addDoc(collection(db, COLLECTIONS.EXPENSES), data);
    return { id: docRef.id, ...data } as Expense;
  }

  async fetchFinancialSummary(): Promise<FinancialSummary> {
    const ordersSnap = await getDocs(collection(db, COLLECTIONS.ORDERS));
    const expensesSnap = await getDocs(collection(db, COLLECTIONS.EXPENSES));

    let totalRevenue = 0;
    let totalCOGS = 0;
    ordersSnap.forEach(d => {
      const data = d.data() as Order;
      totalRevenue += data.totalAmount || 0;
      totalCOGS += data.cogs || (data.totalAmount * 0.45);
    });

    let totalExpenses = 0;
    expensesSnap.forEach(d => {
      const data = d.data() as Expense;
      totalExpenses += data.amount || 0;
    });

    const netProfit = totalRevenue - totalExpenses - totalCOGS;
    const profitMarginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const taxLiability = totalRevenue * 0.05;

    return {
      totalRevenue,
      totalExpenses,
      totalCOGS,
      netProfit,
      profitMarginPercent,
      taxLiability
    };
  }

  async addBankTransaction(payload: BankTransactionPayload): Promise<void> {
    await addDoc(collection(db, COLLECTIONS.BANK_TRANSACTIONS), {
      ...payload,
      createdAt: new Date().toISOString()
    });
  }
}
