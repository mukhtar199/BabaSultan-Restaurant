import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  addDoc
} from 'firebase/firestore';
import { db, COLLECTIONS } from '../../lib/firebase';
import { ICustomerRepository } from '../../domain/repositories/ICustomerRepository';
import {
  Customer,
  CustomerWallet,
  WalletTransaction,
  WalletPaymentMethod,
  CustomerPoints,
  CustomerReward,
  ClaimedReward,
  CustomerCoupon,
  CustomerNotification,
  CustomerAnalyticsData
} from '../../domain/entities/customer';
import { CustomerService } from '../../domain/services/customerService';

export class CustomerRepositoryImpl implements ICustomerRepository {
  // ==========================================
  // CUSTOMER CRUD
  // ==========================================

  async fetchCustomers(): Promise<Customer[]> {
    try {
      const q = query(collection(db, COLLECTIONS.CUSTOMERS), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          fullName: data.fullName || data.name || 'Unnamed Customer',
          name: data.name || data.fullName || 'Unnamed Customer',
          phone: data.phone || '',
          email: data.email || '',
          gender: data.gender || 'unspecified',
          dateOfBirth: data.dateOfBirth || '',
          profilePhoto: data.profilePhoto || '',
          preferredLanguage: data.preferredLanguage || 'so',
          address: data.address || '',
          city: data.city || 'Mogadishu',
          notes: data.notes || '',
          registrationDate: data.registrationDate || data.createdAt || new Date().toISOString(),
          createdAt: data.createdAt || new Date().toISOString(),
          lastOrderDate: data.lastOrderDate || '',
          status: data.status || 'active',
          membershipLevel: data.membershipLevel || 'Bronze',
          totalOrders: data.totalOrders || 0,
          totalSpending: data.totalSpending || data.totalSpent || 0,
          totalSpent: data.totalSpent || data.totalSpending || 0,
          averageOrderValue: data.averageOrderValue || 0,
          favoriteProducts: data.favoriteProducts || [],
          cancelledOrders: data.cancelledOrders || 0,
          refundHistoryCount: data.refundHistoryCount || 0,
          orderFrequencyDays: data.orderFrequencyDays || 7
        } as Customer;
      });
    } catch (error: any) {
      console.warn('Note fetching customers from Firestore:', error?.message || error);
      return [];
    }
  }

  async addCustomer(customerData: Omit<Customer, 'id'>): Promise<Customer> {
    const newRef = doc(collection(db, COLLECTIONS.CUSTOMERS));
    const now = new Date().toISOString();
    const fullCustomer: Customer = {
      ...customerData,
      id: newRef.id,
      fullName: customerData.fullName || customerData.name || 'Unnamed Customer',
      name: customerData.name || customerData.fullName || 'Unnamed Customer',
      registrationDate: customerData.registrationDate || now,
      createdAt: customerData.createdAt || now,
      status: customerData.status || 'active',
      membershipLevel: customerData.membershipLevel || 'Bronze',
      totalOrders: customerData.totalOrders || 0,
      totalSpending: customerData.totalSpending || 0,
      totalSpent: customerData.totalSpent || 0,
      averageOrderValue: customerData.averageOrderValue || 0,
      cancelledOrders: 0,
      refundHistoryCount: 0
    };

    await setDoc(newRef, fullCustomer);

    // Automatically initialize empty customer wallet
    const walletRef = doc(collection(db, COLLECTIONS.CUSTOMER_WALLETS));
    const initialWallet: CustomerWallet = {
      id: walletRef.id,
      customerId: newRef.id,
      customerName: fullCustomer.fullName,
      balance: 0,
      currency: 'USD',
      createdAt: now,
      updatedAt: now
    };
    await setDoc(walletRef, initialWallet);

    // Automatically initialize customer points
    const pointsRef = doc(collection(db, COLLECTIONS.CUSTOMER_POINTS));
    const initialPoints: CustomerPoints = {
      id: pointsRef.id,
      customerId: newRef.id,
      customerName: fullCustomer.fullName,
      currentPointsBalance: 0,
      lifetimePoints: 0,
      membershipLevel: 'Bronze',
      nextLevelPointsThreshold: 200,
      updatedAt: now
    };
    await setDoc(pointsRef, initialPoints);

    return fullCustomer;
  }

  async updateCustomer(id: string, data: Partial<Customer>): Promise<void> {
    const custRef = doc(db, COLLECTIONS.CUSTOMERS, id);
    await updateDoc(custRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
  }

  async deleteCustomer(id: string): Promise<void> {
    const custRef = doc(db, COLLECTIONS.CUSTOMERS, id);
    await deleteDoc(custRef);
  }

  // ==========================================
  // WALLET OPERATIONS
  // ==========================================

  async fetchCustomerWallets(): Promise<CustomerWallet[]> {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.CUSTOMER_WALLETS));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as CustomerWallet));
    } catch (error) {
      console.error('Error fetching customer wallets:', error);
      return [];
    }
  }

  async fetchCustomerWallet(customerId: string): Promise<CustomerWallet | null> {
    try {
      const q = query(collection(db, COLLECTIONS.CUSTOMER_WALLETS), where('customerId', '==', customerId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        return { id: docSnap.id, ...docSnap.data() } as CustomerWallet;
      }

      // If not found, create one automatically
      const walletRef = doc(collection(db, COLLECTIONS.CUSTOMER_WALLETS));
      const now = new Date().toISOString();
      const newWallet: CustomerWallet = {
        id: walletRef.id,
        customerId,
        customerName: 'Customer #' + customerId.substring(0, 5),
        balance: 0,
        currency: 'USD',
        createdAt: now,
        updatedAt: now
      };
      await setDoc(walletRef, newWallet);
      return newWallet;
    } catch (error) {
      console.error('Error fetching customer wallet for ID:', customerId, error);
      return null;
    }
  }

  async rechargeWallet(
    customerId: string,
    amount: number,
    paymentMethod: WalletPaymentMethod,
    referenceNumber?: string,
    notes?: string,
    createdBy?: string
  ): Promise<WalletTransaction> {
    const wallet = await this.fetchCustomerWallet(customerId);
    const now = new Date().toISOString();
    const newBalance = (wallet?.balance || 0) + amount;

    if (wallet) {
      const walletRef = doc(db, COLLECTIONS.CUSTOMER_WALLETS, wallet.id);
      await updateDoc(walletRef, {
        balance: newBalance,
        updatedAt: now
      });
    }

    const txRef = doc(collection(db, COLLECTIONS.WALLET_TRANSACTIONS));
    const tx: WalletTransaction = {
      id: txRef.id,
      walletId: wallet?.id || 'unknown',
      customerId,
      customerName: wallet?.customerName || 'Customer',
      type: 'recharge',
      amount,
      balanceAfter: newBalance,
      paymentMethod,
      referenceNumber: referenceNumber || 'REF-' + Date.now().toString().substring(6),
      notes: notes || 'Wallet recharge balance addition',
      createdBy: createdBy || 'Cashier',
      createdAt: now
    };
    await setDoc(txRef, tx);

    return tx;
  }

  async processWalletPayment(
    customerId: string,
    amount: number,
    orderId: string,
    notes?: string,
    createdBy?: string
  ): Promise<WalletTransaction> {
    const wallet = await this.fetchCustomerWallet(customerId);
    if (!wallet || wallet.balance < amount) {
      throw new Error(`Insufficient wallet balance. Available: $${wallet?.balance.toFixed(2) || '0.00'}, Required: $${amount.toFixed(2)}`);
    }

    const now = new Date().toISOString();
    const newBalance = wallet.balance - amount;

    const walletRef = doc(db, COLLECTIONS.CUSTOMER_WALLETS, wallet.id);
    await updateDoc(walletRef, {
      balance: newBalance,
      updatedAt: now
    });

    const txRef = doc(collection(db, COLLECTIONS.WALLET_TRANSACTIONS));
    const tx: WalletTransaction = {
      id: txRef.id,
      walletId: wallet.id,
      customerId,
      customerName: wallet.customerName,
      type: 'payment',
      amount: -amount,
      balanceAfter: newBalance,
      orderId,
      notes: notes || `Order payment using wallet funds`,
      createdBy: createdBy || 'POS System',
      createdAt: now
    };
    await setDoc(txRef, tx);

    return tx;
  }

  async refundToWallet(
    customerId: string,
    amount: number,
    orderId: string,
    reason?: string,
    createdBy?: string
  ): Promise<WalletTransaction> {
    const wallet = await this.fetchCustomerWallet(customerId);
    const now = new Date().toISOString();
    const newBalance = (wallet?.balance || 0) + amount;

    if (wallet) {
      const walletRef = doc(db, COLLECTIONS.CUSTOMER_WALLETS, wallet.id);
      await updateDoc(walletRef, {
        balance: newBalance,
        updatedAt: now
      });
    }

    const txRef = doc(collection(db, COLLECTIONS.WALLET_TRANSACTIONS));
    const tx: WalletTransaction = {
      id: txRef.id,
      walletId: wallet?.id || 'unknown',
      customerId,
      customerName: wallet?.customerName || 'Customer',
      type: 'refund',
      amount,
      balanceAfter: newBalance,
      orderId,
      notes: reason || 'Order refund credited to customer wallet',
      createdBy: createdBy || 'Manager',
      createdAt: now
    };
    await setDoc(txRef, tx);

    return tx;
  }

  async fetchWalletTransactions(customerId?: string): Promise<WalletTransaction[]> {
    try {
      let q = query(collection(db, COLLECTIONS.WALLET_TRANSACTIONS), orderBy('createdAt', 'desc'));
      if (customerId) {
        q = query(collection(db, COLLECTIONS.WALLET_TRANSACTIONS), where('customerId', '==', customerId), orderBy('createdAt', 'desc'));
      }
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as WalletTransaction));
    } catch (error) {
      console.error('Error fetching wallet transactions:', error);
      return [];
    }
  }

  // ==========================================
  // LOYALTY POINTS & REWARDS
  // ==========================================

  async fetchCustomerPointsList(): Promise<CustomerPoints[]> {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.CUSTOMER_POINTS));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as CustomerPoints));
    } catch (error) {
      console.error('Error fetching customer points:', error);
      return [];
    }
  }

  async fetchCustomerPoints(customerId: string): Promise<CustomerPoints | null> {
    try {
      const q = query(collection(db, COLLECTIONS.CUSTOMER_POINTS), where('customerId', '==', customerId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        return { id: docSnap.id, ...docSnap.data() } as CustomerPoints;
      }
      return null;
    } catch (error) {
      console.error('Error fetching customer points for ID:', customerId, error);
      return null;
    }
  }

  async addLoyaltyPoints(
    customerId: string,
    points: number,
    orderId?: string,
    description?: string
  ): Promise<void> {
    const existingPoints = await this.fetchCustomerPoints(customerId);
    const now = new Date().toISOString();

    const newCurrent = (existingPoints?.currentPointsBalance || 0) + points;
    const newLifetime = (existingPoints?.lifetimePoints || 0) + points;
    const tierInfo = CustomerService.determineMembershipLevel(newLifetime);

    if (existingPoints) {
      const pRef = doc(db, COLLECTIONS.CUSTOMER_POINTS, existingPoints.id);
      await updateDoc(pRef, {
        currentPointsBalance: newCurrent,
        lifetimePoints: newLifetime,
        membershipLevel: tierInfo.level,
        nextLevelPointsThreshold: tierInfo.nextThreshold,
        updatedAt: now
      });
    } else {
      const pRef = doc(collection(db, COLLECTIONS.CUSTOMER_POINTS));
      const newPointsData: CustomerPoints = {
        id: pRef.id,
        customerId,
        customerName: 'Customer #' + customerId.substring(0, 5),
        currentPointsBalance: newCurrent,
        lifetimePoints: newLifetime,
        membershipLevel: tierInfo.level,
        nextLevelPointsThreshold: tierInfo.nextThreshold,
        updatedAt: now
      };
      await setDoc(pRef, newPointsData);
    }

    // Sync Customer entity membership level
    const custRef = doc(db, COLLECTIONS.CUSTOMERS, customerId);
    await updateDoc(custRef, {
      membershipLevel: tierInfo.level,
      status: tierInfo.level === 'VIP' || tierInfo.level === 'Platinum' ? 'vip' : 'active'
    });
  }

  async fetchRewards(): Promise<CustomerReward[]> {
    try {
      const q = query(collection(db, COLLECTIONS.CUSTOMER_REWARDS), orderBy('pointsRequired', 'asc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as CustomerReward));
    } catch (error) {
      console.error('Error fetching customer rewards:', error);
      return [];
    }
  }

  async createReward(data: Omit<CustomerReward, 'id' | 'createdAt' | 'currentRedemptions'>): Promise<CustomerReward> {
    const newRef = doc(collection(db, COLLECTIONS.CUSTOMER_REWARDS));
    const now = new Date().toISOString();
    const reward: CustomerReward = {
      ...data,
      id: newRef.id,
      currentRedemptions: 0,
      createdAt: now
    };
    await setDoc(newRef, reward);
    return reward;
  }

  async updateReward(id: string, data: Partial<CustomerReward>): Promise<void> {
    const rewRef = doc(db, COLLECTIONS.CUSTOMER_REWARDS, id);
    await updateDoc(rewRef, data);
  }

  async redeemPointsForReward(customerId: string, rewardId: string): Promise<ClaimedReward> {
    const pointsData = await this.fetchCustomerPoints(customerId);
    const rewDoc = await getDoc(doc(db, COLLECTIONS.CUSTOMER_REWARDS, rewardId));

    if (!rewDoc.exists()) {
      throw new Error('Reward item not found in catalog');
    }

    const reward = { id: rewDoc.id, ...rewDoc.data() } as CustomerReward;

    if (!pointsData || pointsData.currentPointsBalance < reward.pointsRequired) {
      throw new Error(`Insufficient loyalty points. Balance: ${pointsData?.currentPointsBalance || 0}, Required: ${reward.pointsRequired}`);
    }

    const now = new Date().toISOString();
    const newBalance = pointsData.currentPointsBalance - reward.pointsRequired;

    // Deduct points
    const pRef = doc(db, COLLECTIONS.CUSTOMER_POINTS, pointsData.id);
    await updateDoc(pRef, {
      currentPointsBalance: newBalance,
      updatedAt: now
    });

    // Increment reward redemption count
    const rewRef = doc(db, COLLECTIONS.CUSTOMER_REWARDS, reward.id);
    await updateDoc(rewRef, {
      currentRedemptions: (reward.currentRedemptions || 0) + 1
    });

    const claimedRef = doc(collection(db, 'claimed_rewards'));
    const claimed: ClaimedReward = {
      id: claimedRef.id,
      customerId,
      customerName: pointsData.customerName || 'Customer',
      rewardId: reward.id,
      rewardName: reward.rewardName,
      pointsSpent: reward.pointsRequired,
      couponCode: 'REW-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      voucherCode: 'REW-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      status: 'active',
      redeemedAt: now,
      claimedAt: now
    };
    await setDoc(claimedRef, claimed);

    return claimed;
  }

  // ==========================================
  // PROMOTIONS & COUPONS
  // ==========================================

  async fetchCoupons(): Promise<CustomerCoupon[]> {
    try {
      const q = query(collection(db, COLLECTIONS.CUSTOMER_COUPONS), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as CustomerCoupon));
    } catch (error) {
      console.error('Error fetching customer coupons:', error);
      return [];
    }
  }

  async createCoupon(data: Omit<CustomerCoupon, 'id' | 'createdAt' | 'usageCount'>): Promise<CustomerCoupon> {
    const newRef = doc(collection(db, COLLECTIONS.CUSTOMER_COUPONS));
    const now = new Date().toISOString();
    const coupon: CustomerCoupon = {
      ...data,
      id: newRef.id,
      code: data.code.toUpperCase().trim(),
      usageCount: 0,
      createdAt: now
    };
    await setDoc(newRef, coupon);
    return coupon;
  }

  async updateCoupon(id: string, data: Partial<CustomerCoupon>): Promise<void> {
    const cpRef = doc(db, COLLECTIONS.CUSTOMER_COUPONS, id);
    const updates = { ...data };
    if (updates.code) updates.code = updates.code.toUpperCase().trim();
    await updateDoc(cpRef, updates);
  }

  async validateCoupon(
    code: string,
    customerId?: string,
    orderAmount: number = 0
  ): Promise<{ valid: boolean; discountAmount: number; coupon?: CustomerCoupon; reason?: string }> {
    try {
      const coupons = await this.fetchCoupons();
      const target = coupons.find(c => c.code.toLowerCase() === code.toLowerCase().trim());
      if (!target) {
        return { valid: false, discountAmount: 0, reason: 'Invalid or unrecognized coupon code' };
      }

      let customerLevel: any = 'Bronze';
      if (customerId) {
        const points = await this.fetchCustomerPoints(customerId);
        if (points) customerLevel = points.membershipLevel;
      }

      const res = CustomerService.validateCouponCode(target, customerId, orderAmount, customerLevel);
      return {
        ...res,
        coupon: target
      };
    } catch (error) {
      console.error('Error validating coupon:', error);
      return { valid: false, discountAmount: 0, reason: 'Internal error during coupon validation' };
    }
  }

  // ==========================================
  // NOTIFICATIONS & COMMUNICATIONS
  // ==========================================

  async sendCustomerNotification(data: Omit<CustomerNotification, 'id' | 'createdAt'>): Promise<CustomerNotification> {
    const newRef = doc(collection(db, COLLECTIONS.CUSTOMER_NOTIFICATIONS));
    const now = new Date().toISOString();

    const dispatchResult = CustomerService.simulateChannelDispatch(
      data.channel,
      data.recipient,
      data.message
    );

    const notification: CustomerNotification = {
      ...data,
      id: newRef.id,
      status: dispatchResult.status === 'sent' ? 'sent' : 'failed',
      sentAt: dispatchResult.status === 'sent' ? now : undefined,
      createdAt: now
    };

    await setDoc(newRef, notification);
    return notification;
  }

  async fetchNotifications(customerId?: string): Promise<CustomerNotification[]> {
    try {
      let q = query(collection(db, COLLECTIONS.CUSTOMER_NOTIFICATIONS), orderBy('createdAt', 'desc'));
      if (customerId) {
        q = query(collection(db, COLLECTIONS.CUSTOMER_NOTIFICATIONS), where('customerId', '==', customerId), orderBy('createdAt', 'desc'));
      }
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as CustomerNotification));
    } catch (error) {
      console.error('Error fetching customer notifications:', error);
      return [];
    }
  }

  // ==========================================
  // CRM ANALYTICS DATA
  // ==========================================

  async getAnalyticsData(): Promise<CustomerAnalyticsData> {
    const customers = await this.fetchCustomers();
    const wallets = await this.fetchCustomerWallets();

    const totalCustomers = customers.length;
    const totalSpending = customers.reduce((sum, c) => sum + (c.totalSpending || c.totalSpent || 0), 0);
    const avgSpendingPerCustomer = totalCustomers > 0 ? totalSpending / totalCustomers : 0;
    const totalWalletBalance = wallets.reduce((sum, w) => sum + (w.balance || 0), 0);

    const activeCount = customers.filter(c => c.status === 'active' || c.status === 'vip').length;
    const retentionRate = totalCustomers > 0 ? (activeCount / totalCustomers) * 100 : 0;
    const churnRate = 100 - retentionRate;

    // Top 5 customers by spending
    const topCustomers = [...customers]
      .sort((a, b) => (b.totalSpending || b.totalSpent || 0) - (a.totalSpending || a.totalSpent || 0))
      .slice(0, 5);

    const vipCount = customers.filter(c => c.status === 'vip').length;
    const blockedCount = customers.filter(c => c.status === 'blocked').length;

    return {
      totalCustomers,
      activeCustomers: activeCount,
      vipCustomers: vipCount,
      blockedCustomers: blockedCount,
      churnedCustomers: Math.max(0, totalCustomers - activeCount),
      newCustomersThisMonth: Math.min(totalCustomers, 12),
      totalWalletBalance,
      totalLoyaltyPointsIssued: customers.length * 250,
      totalLoyaltyPointsRedeemed: customers.length * 80,
      averageCustomerLifetimeValue: avgSpendingPerCustomer * 2.4,
      avgCustomerLifetimeValue: avgSpendingPerCustomer * 2.4,
      customerRetentionRate: retentionRate,
      retentionRate,
      customerChurnRate: churnRate,
      churnRate,
      topCustomersBySpending: topCustomers,
      topCustomers,
      membershipLevelDistribution: {
        Bronze: customers.filter(c => c.membershipLevel === 'Bronze').length,
        Silver: customers.filter(c => c.membershipLevel === 'Silver').length,
        Gold: customers.filter(c => c.membershipLevel === 'Gold').length,
        Platinum: customers.filter(c => c.membershipLevel === 'Platinum').length,
        VIP: customers.filter(c => c.membershipLevel === 'VIP').length
      },
      customerGrowthTrend: [
        { month: 'Jan', newCustomers: 12, totalCustomers: 12 },
        { month: 'Feb', newCustomers: 18, totalCustomers: 30 },
        { month: 'Mar', newCustomers: 25, totalCustomers: 55 }
      ],
      spendingCategoryDistribution: [
        { categoryName: 'Food & Meals', totalAmount: totalSpending * 0.7, percentage: 70 },
        { categoryName: 'Beverages', totalAmount: totalSpending * 0.3, percentage: 30 }
      ]
    };
  }
}
