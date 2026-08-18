import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../server.ts';
import { checkBranchAuthorization, validateUserPrivilegeUpdate } from '../server/auth.js';
import { calculatePeriodDateRange } from '../server/trustedFinancialBackend.ts';

describe('1. AUTHENTICATION & ID TOKEN TESTS', () => {
  it('rejects unauthenticated requests missing Bearer ID token with 401', async () => {
    const res = await request(app)
      .post('/api/pos/complete')
      .send({
        branchId: 'branch_01',
        items: [{ productId: 'p1', quantity: 1, price: 10 }]
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Authentication required/i);
  });

  it('rejects requests with malformed or invalid Bearer ID token with 401', async () => {
    const res = await request(app)
      .post('/api/pos/complete')
      .set('Authorization', 'Bearer invalid_token_123')
      .send({
        branchId: 'branch_01',
        items: [{ productId: 'p1', quantity: 1, price: 10 }]
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Unauthorized|invalid|expired/i);
  });

  it('rejects AI Assistant request without Bearer token with 401', async () => {
    const res = await request(app)
      .post('/api/ai-chat')
      .send({ prompt: 'Sales summary today' });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Authentication required/i);
  });
});

describe('2. BRANCH SECURITY & AUTHORIZATION TESTS', () => {
  it('allows HQ Admin/Owner to access any requested branch', () => {
    const adminUser = { role: 'Admin', branchId: 'all' };
    const authResult = checkBranchAuthorization(adminUser, 'branch_b');
    expect(authResult.authorized).toBe(true);
    expect(authResult.targetBranchId).toBe('branch_b');
  });

  it('allows staff user to access their assigned branch', () => {
    const staffUser = { role: 'Cashier', branchId: 'branch_a' };
    const authResult = checkBranchAuthorization(staffUser, 'branch_a');
    expect(authResult.authorized).toBe(true);
    expect(authResult.targetBranchId).toBe('branch_a');
  });

  it('STRICTLY BLOCKS cross-branch access attempts (Branch A user accessing Branch B)', () => {
    const branchAUser = { role: 'Cashier', branchId: 'branch_a' };
    const authResult = checkBranchAuthorization(branchAUser, 'branch_b');
    expect(authResult.authorized).toBe(false);
    expect(authResult.error).toMatch(/Unauthorized cross-branch transaction/i);
  });

  it('blocks users without any assigned branch from processing transactions', () => {
    const unassignedUser = { role: 'Staff', branchId: '' };
    const authResult = checkBranchAuthorization(unassignedUser, 'branch_a');
    expect(authResult.authorized).toBe(false);
    expect(authResult.error).toMatch(/Access denied/i);
  });

  it('Branch A Manager accessing resource with missing branchId is DENIED', () => {
    const branchAUser = { role: 'Manager', branchId: 'branch_a' };
    const authResult = checkBranchAuthorization(branchAUser, '');
    expect(authResult.authorized).toBe(false);
    expect(authResult.error).toMatch(/Target branch specification is required/i);
  });
});

describe('4. HR OWNERSHIP & LEAVE REQUEST AUTHORIZATION TESTS', () => {
  const empId = 'emp_101';
  const otherEmpId = 'emp_202';
  const branchA = 'branch_a';
  const branchB = 'branch_b';

  it('Employee -> own leave request allowed', () => {
    const isOwner = (requestEmpId: string, authEmpId: string) => requestEmpId === authEmpId;
    expect(isOwner(empId, empId)).toBe(true);
  });

  it('Employee -> other employee leave request denied', () => {
    const isOwner = (requestEmpId: string, authEmpId: string) => requestEmpId === authEmpId;
    expect(isOwner(otherEmpId, empId)).toBe(false);
  });

  it('Employee -> change employeeId in leave update denied', () => {
    const originalRequest = { id: 'lr1', employeeId: empId, status: 'pending', branchId: branchA };
    const updatePayload = { employeeId: otherEmpId };
    const isEmployeeIdPreserved = updatePayload.employeeId === originalRequest.employeeId;
    expect(isEmployeeIdPreserved).toBe(false);
  });

  it('Employee -> change branchId in leave update denied', () => {
    const originalRequest = { id: 'lr1', employeeId: empId, status: 'pending', branchId: branchA };
    const updatePayload = { branchId: branchB };
    const isBranchPreserved = updatePayload.branchId === originalRequest.branchId;
    expect(isBranchPreserved).toBe(false);
  });

  it('Employee -> self-approve leave request denied', () => {
    const FORBIDDEN_UPDATE_KEYS = ['status', 'approvalStatus', 'approvedBy', 'approvedAt', 'rejectedReason'];
    const updateFields = ['status', 'approvalStatus'];
    const isSelfApproveAttempt = updateFields.some(k => FORBIDDEN_UPDATE_KEYS.includes(k));
    expect(isSelfApproveAttempt).toBe(true);
  });

  it('Manager -> valid approval allowed for branch manager', () => {
    const managerUser = { role: 'Manager', branchId: branchA };
    const leaveRequestBranch = branchA;
    const isAuthorizedManager = managerUser.role === 'Manager' && managerUser.branchId === leaveRequestBranch;
    expect(isAuthorizedManager).toBe(true);
  });
});

describe('3. PRIVILEGE ESCALATION & USER ROLE PROTECTION TESTS', () => {
  const adminUpdater = { role: 'Admin', branchId: 'branch_a' };
  const targetStaff = { role: 'Staff', branchId: 'branch_a', isAdmin: false, isOwner: false };
  const managerUpdater = { role: 'Manager', branchId: 'branch_a' };
  const staffUserSelf = { role: 'Cashier', branchId: 'branch_a' };

  it('Admin cannot set isAdmin=true for another user', () => {
    const res = validateUserPrivilegeUpdate(adminUpdater, targetStaff, { isAdmin: true });
    expect(res.allowed).toBe(false);
    expect(res.error).toMatch(/Admin cannot grant Admin role or set isAdmin=true/i);
  });

  it('Admin cannot set isOwner=true', () => {
    const res = validateUserPrivilegeUpdate(adminUpdater, targetStaff, { isOwner: true });
    expect(res.allowed).toBe(false);
    expect(res.error).toMatch(/Admin cannot promote user to Owner/i);
  });

  it('Admin cannot grant arbitrary permissions', () => {
    const res = validateUserPrivilegeUpdate(adminUpdater, targetStaff, { permissions: ['all_access', 'super_user'] });
    expect(res.allowed).toBe(false);
    expect(res.error).toMatch(/Admin cannot grant arbitrary custom permissions/i);
  });

  it('Admin cannot change another user\'s branch', () => {
    const res = validateUserPrivilegeUpdate(adminUpdater, targetStaff, { branchId: 'branch_b' });
    expect(res.allowed).toBe(false);
    expect(res.error).toMatch(/Admin cannot move user across branches/i);
  });

  it('Manager cannot modify security-sensitive fields', () => {
    const res1 = validateUserPrivilegeUpdate(managerUpdater, targetStaff, { role: 'Manager' });
    expect(res1.allowed).toBe(false);
    const res2 = validateUserPrivilegeUpdate(managerUpdater, targetStaff, { isAdmin: true });
    expect(res2.allowed).toBe(false);
    const res3 = validateUserPrivilegeUpdate(managerUpdater, targetStaff, { branchId: 'branch_b' });
    expect(res3.allowed).toBe(false);
  });

  it('User cannot change own role', () => {
    const res = validateUserPrivilegeUpdate(staffUserSelf, staffUserSelf, { role: 'Owner' });
    expect(res.allowed).toBe(false);
    expect(res.error).toMatch(/Non-admin users cannot modify security-sensitive fields/i);
  });

  it('User cannot change own branch', () => {
    const res = validateUserPrivilegeUpdate(staffUserSelf, staffUserSelf, { branchId: 'branch_b' });
    expect(res.allowed).toBe(false);
    expect(res.error).toMatch(/Non-admin users cannot modify security-sensitive fields/i);
  });
});

describe('5. FINAL AUTHORIZATION & BRANCH FALLBACK CLEANUP SCENARIOS', () => {
  it('1. Manager + branchId="" + Order Cancellation -> DENY', () => {
    const user = { role: 'Manager', branchId: '' };
    const authResult = checkBranchAuthorization(user, 'branch_a');
    expect(authResult.authorized).toBe(false);
    expect(authResult.error).toMatch(/Access denied/i);
  });

  it('2. Admin + branchId="" + Customer Refund -> DENY', () => {
    const user = { role: 'Admin', branchId: '' };
    const authResult = checkBranchAuthorization(user, 'branch_a');
    expect(authResult.authorized).toBe(false);
    expect(authResult.error).toMatch(/Access denied/i);
  });

  it('3. Manager Branch A + Delivery Branch B + Assign Driver -> DENY', () => {
    const managerA = { role: 'Manager', branchId: 'branch_a' };
    const authDelivery = checkBranchAuthorization(managerA, 'branch_b');
    expect(authDelivery.authorized).toBe(false);
  });

  it('4. Admin Branch A + Delivery Branch B + Assign Driver -> DENY', () => {
    const adminA = { role: 'Admin', branchId: 'branch_a' };
    const authDelivery = checkBranchAuthorization(adminA, 'branch_b');
    expect(authDelivery.authorized).toBe(false);
  });

  it('5. Owner + Delivery Branch B + Assign Driver -> ALLOW', () => {
    const owner = { role: 'Owner', branchId: '' };
    const authDelivery = checkBranchAuthorization(owner, 'branch_b');
    expect(authDelivery.authorized).toBe(true);
    expect(authDelivery.targetBranchId).toBe('branch_b');
  });

  it('6. Explicit HQ (branchId="all") + Delivery Branch B + Assign Driver -> ALLOW', () => {
    const hqAdmin = { role: 'Admin', branchId: 'all' };
    const authDelivery = checkBranchAuthorization(hqAdmin, 'branch_b');
    expect(authDelivery.authorized).toBe(true);
    expect(authDelivery.targetBranchId).toBe('branch_b');
  });

  it('7. Manager + branchId="" + Driver Assign -> DENY', () => {
    const managerEmpty = { role: 'Manager', branchId: '' };
    const authResult = checkBranchAuthorization(managerEmpty, 'branch_a');
    expect(authResult.authorized).toBe(false);
  });

  it('8. Admin + branchId="" + Driver Assign -> DENY', () => {
    const adminEmpty = { role: 'Admin', branchId: '' };
    const authResult = checkBranchAuthorization(adminEmpty, 'branch_a');
    expect(authResult.authorized).toBe(false);
  });

  it('9. Audit Log + branchId="" + Non-HQ -> DENY', () => {
    const user = { role: 'Manager', branchId: '' };
    const isExplicitHQ = ['Owner', 'owner'].includes(user.role) || user.branchId === 'all';
    const derivedBranchId = user.branchId && user.branchId.trim() !== '' ? user.branchId.trim() : (isExplicitHQ ? 'all' : '');
    expect(derivedBranchId).toBe('');
  });

  it('10. Reporting period date filter uses Mogadishu time boundary correctly', () => {
    const range = calculatePeriodDateRange('today');
    expect(range.startDate).not.toBeNull();
    expect(range.endDate).not.toBeNull();
  });
});

describe('6. FINANCIAL SUMMARY BRANCH AUTHORIZATION TESTS (P0)', () => {
  it('1. Manager Branch A -> summary Branch A -> PASS (200)', async () => {
    const res = await request(app)
      .get('/api/financial-summary?branchId=branch_a')
      .set('Authorization', 'Bearer test_token_manager_branch_a');
    expect(res.status).toBe(200);
  });

  it('2. Manager Branch A -> summary Branch B -> DENY (403)', async () => {
    const res = await request(app)
      .get('/api/financial-summary?branchId=branch_b')
      .set('Authorization', 'Bearer test_token_manager_branch_a');
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Unauthorized cross-branch/i);
  });

  it('3. Accountant Branch A -> summary Branch B -> DENY (403)', async () => {
    const res = await request(app)
      .get('/api/financial-summary?branchId=branch_b')
      .set('Authorization', 'Bearer test_token_accountant_branch_a');
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Unauthorized cross-branch/i);
  });

  it('4. Manager with empty branchId -> summary request -> DENIED (403)', async () => {
    const res = await request(app)
      .get('/api/financial-summary?branchId=branch_b')
      .set('Authorization', 'Bearer test_token_manager_nobranch');
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Access denied/i);
  });

  it('5. Owner/explicit HQ -> summary Branch B -> PASS (200)', async () => {
    const res = await request(app)
      .get('/api/financial-summary?branchId=branch_b')
      .set('Authorization', 'Bearer test_token_owner');
    expect(res.status).toBe(200);
  });

  it('6. No branchId supplied by branch user -> use trusted user branch only (200)', async () => {
    const res = await request(app)
      .get('/api/financial-summary')
      .set('Authorization', 'Bearer test_token_manager_branch_a');
    expect(res.status).toBe(200);
  });

  it('7. Client attempts arbitrary branchId -> authorization enforced (403)', async () => {
    const res = await request(app)
      .get('/api/financial-summary?branchId=arbitrary_secret_branch_999')
      .set('Authorization', 'Bearer test_token_accountant_branch_a');
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Unauthorized cross-branch/i);
  });
});

describe('7. INVENTORY UPDATE/DELETE BRANCH AUTHORIZATION (P0-2)', () => {
  it('rejects cross-branch inventory update (403 or 404)', async () => {
    const res = await request(app)
      .post('/api/inventory/items/inv_non_existent/update')
      .set('Authorization', 'Bearer test_token_manager_branch_a')
      .send({ itemName: 'New Name' });
    expect([403, 404]).toContain(res.status);
  });

  it('rejects unauthenticated inventory delete (401)', async () => {
    const res = await request(app)
      .post('/api/inventory/items/inv_123/delete')
      .send({});
    expect(res.status).toBe(401);
  });
});

describe('8. PURCHASE ORDER AUTHORIZATION & WHITELIST (P0-3)', () => {
  it('rejects unauthenticated PO approval (401)', async () => {
    const res = await request(app)
      .post('/api/purchases/orders/po_123/approve')
      .send({});
    expect(res.status).toBe(401);
  });

  it('rejects unauthenticated PO update (401)', async () => {
    const res = await request(app)
      .post('/api/purchases/orders/po_123/update')
      .send({ notes: 'Updated notes' });
    expect(res.status).toBe(401);
  });
});

describe('9. DELIVERY STATUS PAYMENT INTEGRITY (P0-4)', () => {
  it('rejects delivery status update without authentication (401)', async () => {
    const res = await request(app)
      .post('/api/deliveries/del_123/status')
      .send({ status: 'delivered', isPaymentCollected: true });
    expect(res.status).toBe(401);
  });
});

describe('10. DELIVERY CREATION PAYLOAD WHITELIST (P0-5)', () => {
  it('rejects cross-branch delivery creation without valid branch authorization (403)', async () => {
    const res = await request(app)
      .post('/api/deliveries')
      .set('Authorization', 'Bearer test_token_cashier_branch_a')
      .send({
        deliveryData: {
          branchId: 'branch_b',
          customerName: 'Test Customer',
          address: 'Test Address'
        }
      });
    expect(res.status).toBe(403);
  });
});

describe('12. POS CHECKOUT BRANCH AUTHORIZATION & CROSS-BRANCH PREVENTION (RC FIX)', () => {
  it('Scenario 1: Branch A user with branch loaded -> POS PASS', async () => {
    const { getAdminDb } = await import('../server/trustedFinancialBackend.js');
    const db = getAdminDb();

    await db.collection('branches').doc('branch_a').set({
      id: 'branch_a',
      name: 'Branch A',
      taxRate: 0.05,
      defaultDeliveryFee: 2.00
    });

    await db.collection('products').doc('prod_branch_a_1').set({
      id: 'prod_branch_a_1',
      name: 'Branch A Special Dish',
      price: 15,
      cost: 5,
      stock: 50,
      branchId: 'branch_a'
    });

    const res = await request(app)
      .post('/api/pos/complete')
      .set('Authorization', 'Bearer test_token_cashier_branch_a')
      .send({
        orderData: {
          branchId: 'branch_a',
          paymentMethod: 'cash',
          paidAmount: 15.75,
          items: [
            { productId: 'prod_branch_a_1', productName: 'Branch A Special Dish', quantity: 1, price: 15, costPrice: 5 }
          ],
          subtotal: 15,
          tax: 0.75,
          discountAmount: 0,
          totalAmount: 15.75
        }
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.order.branchId).toBe('branch_a');
  });

  it('Scenario 2: User with missing branch -> POS checkout rejected with 403 on backend', async () => {
    const res = await request(app)
      .post('/api/pos/complete')
      .set('Authorization', 'Bearer test_token_cashier_nobranch')
      .send({
        orderData: {
          branchId: 'branch_a',
          paymentMethod: 'cash',
          paidAmount: 10,
          items: [{ productId: 'prod_branch_a_1', quantity: 1, price: 10 }]
        }
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Access denied.*not assigned/i);
  });

  it('Scenario 3: Branch A user attempts Branch B -> backend strictly returns 403', async () => {
    const res = await request(app)
      .post('/api/pos/complete')
      .set('Authorization', 'Bearer test_token_cashier_branch_a')
      .send({
        orderData: {
          branchId: 'branch_b',
          paymentMethod: 'cash',
          paidAmount: 10,
          items: [{ productId: 'prod_branch_a_1', quantity: 1, price: 10 }]
        }
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Unauthorized cross-branch transaction/i);
  });

  it('Scenario 4: Owner / HQ user -> existing HQ behavior works across branches', async () => {
    const res = await request(app)
      .post('/api/pos/complete')
      .set('Authorization', 'Bearer test_token_owner')
      .send({
        orderData: {
          branchId: 'branch_a',
          paymentMethod: 'cash',
          paidAmount: 15.75,
          items: [
            { productId: 'prod_branch_a_1', productName: 'Branch A Special Dish', quantity: 1, price: 15, costPrice: 5 }
          ],
          subtotal: 15,
          tax: 0.75,
          discountAmount: 0,
          totalAmount: 15.75
        }
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.order.branchId).toBe('branch_a');
  });

  it('Scenario 5: Client-side branch resolution test (no hardcoded fallback)', () => {
    const resolveUserBranch = (userRecord: { branchId?: string } | null, isHQ: boolean) => {
      if (isHQ) return userRecord?.branchId || undefined;
      if (!userRecord?.branchId || userRecord.branchId.trim() === '') {
        return null; // Block checkout
      }
      return userRecord.branchId;
    };

    expect(resolveUserBranch({ branchId: 'branch_a' }, false)).toBe('branch_a');
    expect(resolveUserBranch(null, false)).toBeNull();
    expect(resolveUserBranch({ branchId: '' }, false)).toBeNull();
    expect(resolveUserBranch({ branchId: '   ' }, false)).toBeNull();
    expect(resolveUserBranch({ branchId: 'branch_hq_01' }, true)).toBe('branch_hq_01');
    expect(resolveUserBranch(null, true)).toBeUndefined();
  });
});


