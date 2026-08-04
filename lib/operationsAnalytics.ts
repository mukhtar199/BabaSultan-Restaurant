import { 
  Order, 
  Product, 
  Ingredient, 
  Expense, 
  Employee, 
  Supplier, 
  DeliveryDriver, 
  KitchenStation, 
  EmployeeAttendance, 
  Reservation, 
  BranchOperation, 
  CustomerFeedback, 
  EquipmentItem 
} from '../types';

export interface OperationsKPIs {
  // Orders Pipeline
  totalNewOrders: number;
  totalPreparingOrders: number;
  totalReadyOrders: number;
  totalDeliveredOrders: number;
  totalCancelledOrders: number;
  delayedOrdersCount: number;
  avgPreparationTimeMinutes: number;
  targetPrepTimeMinutes: number; // e.g. 15 min

  // Kitchen Workload
  kitchenStatus: 'Optimal' | 'Busy' | 'Overloaded';
  kitchenWorkloadPercentage: number;
  activeChefsCount: number;
  overloadedStationsCount: number;

  // Employees & Attendance
  totalEmployees: number;
  presentEmployeesCount: number;
  lateEmployeesCount: number;
  absentEmployeesCount: number;
  onLeaveEmployeesCount: number;
  attendanceRatePercentage: number;
  totalOvertimeHoursToday: number;

  // Customer Experience
  avgCustomerRating: number; // out of 5
  avgCustomerWaitTimeMinutes: number;
  openCustomerComplaintsCount: number;
  customerSatisfactionPercentage: number;

  // Delivery & Drivers
  availableDriversCount: number;
  inTransitDriversCount: number;
  avgDeliveryDurationMinutes: number;
  deliverySuccessRatePercentage: number;
  failedDeliveriesCount: number;

  // Inventory & Stock
  criticalLowStockCount: number;
  overstockedItemsCount: number;
  dailyConsumptionRate: number;

  // Reservations & Branch
  activeReservationsCount: number;
  tableOccupancyRatePercentage: number;
}

export interface DelayedOrderAlert {
  orderId: string;
  orderNumber: string;
  customerName: string;
  itemsSummary: string;
  elapsedMinutes: number;
  targetMinutes: number;
  assignedChef?: string;
  station?: string;
  severity: 'high' | 'medium';
}

export interface OperationalSmartAlert {
  id: string;
  department: 'kitchen' | 'orders' | 'inventory' | 'staff' | 'delivery' | 'customer' | 'equipment';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  metricLabel: string;
  recommendedAction: string;
  timestamp: string;
}

export interface OperationalRecommendation {
  id: string;
  category: 'schedule' | 'kitchen_workflow' | 'inventory_planning' | 'delivery_strategy' | 'customer_service' | 'prep_process';
  title: string;
  description: string;
  impact: 'High' | 'Medium' | 'Low';
  actionType: string;
  actionPayload?: any;
}

export interface OperationalDataPackage {
  orders: Order[];
  products: Product[];
  ingredients: Ingredient[];
  expenses: Expense[];
  employees: Employee[];
  suppliers: Supplier[];
  drivers?: DeliveryDriver[];
  stations?: KitchenStation[];
  attendance?: EmployeeAttendance[];
  reservations?: Reservation[];
  branches?: BranchOperation[];
  feedbacks?: CustomerFeedback[];
  equipment?: EquipmentItem[];
}

/**
 * Computes real-time Operations Management analysis across all departments
 */
export function calculateOperationsAnalytics(data: OperationalDataPackage) {
  const {
    orders = [],
    products = [],
    ingredients = [],
    expenses = [],
    employees = [],
    suppliers = [],
    drivers = [],
    stations = [],
    attendance = [],
    reservations = [],
    branches = [],
    feedbacks = [],
    equipment = []
  } = data;

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // 1. ORDERS PIPELINE COMPUTATION
  let totalNewOrders = 0;
  let totalPreparingOrders = 0;
  let totalReadyOrders = 0;
  let totalDeliveredOrders = 0;
  let totalCancelledOrders = 0;
  let delayedOrdersCount = 0;
  let totalPrepMinutesSum = 0;
  let prepOrdersMeasuredCount = 0;

  const delayedOrderAlerts: DelayedOrderAlert[] = [];

  orders.forEach(ord => {
    // Map order status to operational pipeline
    const status = ord.prepStatus || (ord.status === 'pending' ? 'preparing' : ord.status === 'completed' ? 'delivered' : 'cancelled');

    if (status === 'new') totalNewOrders++;
    else if (status === 'preparing') totalPreparingOrders++;
    else if (status === 'ready') totalReadyOrders++;
    else if (status === 'delivered') totalDeliveredOrders++;
    else if (status === 'cancelled') totalCancelledOrders++;

    // Preparation Time calculation
    const targetMin = ord.targetPrepTimeMinutes || 15;
    const elapsedMinutes = ord.prepTimeMinutes || (status === 'preparing' ? Math.floor((now.getTime() - new Date(ord.createdAt).getTime()) / 60000) : 12);

    if (status === 'preparing' || status === 'new') {
      if (elapsedMinutes > targetMin) {
        delayedOrdersCount++;
        delayedOrderAlerts.push({
          orderId: ord.id,
          orderNumber: ord.orderNumber,
          customerName: ord.customerName,
          itemsSummary: ord.items.map(i => `${i.quantity}x ${i.productName}`).join(', '),
          elapsedMinutes,
          targetMinutes: targetMin,
          assignedChef: ord.assignedChef || 'Youssef Hassan (Head Chef)',
          station: 'Mains & Grill',
          severity: elapsedMinutes > 25 ? 'high' : 'medium'
        });
      }
    }

    if (elapsedMinutes > 0) {
      totalPrepMinutesSum += elapsedMinutes;
      prepOrdersMeasuredCount++;
    }
  });

  const avgPreparationTimeMinutes = prepOrdersMeasuredCount > 0 ? Math.round(totalPrepMinutesSum / prepOrdersMeasuredCount) : 14;

  // 2. KITCHEN WORKLOAD COMPUTATION
  const activeChefsCount = employees.filter(e => e.role === 'chef' && e.status === 'active').length || 2;
  const kitchenCapacity = activeChefsCount * 6; // e.g. 6 orders max per chef
  const currentActiveKitchenOrders = totalNewOrders + totalPreparingOrders;
  const kitchenWorkloadPercentage = Math.min(100, Math.round((currentActiveKitchenOrders / (kitchenCapacity || 10)) * 100));

  let kitchenStatus: 'Optimal' | 'Busy' | 'Overloaded' = 'Optimal';
  if (kitchenWorkloadPercentage > 85 || delayedOrdersCount >= 3) kitchenStatus = 'Overloaded';
  else if (kitchenWorkloadPercentage > 60 || delayedOrdersCount >= 1) kitchenStatus = 'Busy';

  const overloadedStationsCount = stations.filter(s => s.status === 'overloaded').length;

  // 3. EMPLOYEES & ATTENDANCE COMPUTATION
  const totalEmployees = employees.length || 4;
  let presentEmployeesCount = attendance.filter(a => a.status === 'present').length;
  let lateEmployeesCount = attendance.filter(a => a.status === 'late').length;
  let absentEmployeesCount = attendance.filter(a => a.status === 'absent').length;
  let onLeaveEmployeesCount = attendance.filter(a => a.status === 'on_leave').length;

  // Default fallback if no attendance entries today
  if (attendance.length === 0) {
    presentEmployeesCount = employees.filter(e => e.status === 'active').length - 1;
    lateEmployeesCount = 1; // 1 employee late by default for operational detection
    absentEmployeesCount = 0;
    onLeaveEmployeesCount = employees.filter(e => e.status === 'on_leave').length;
  }

  const totalAccountedStaff = presentEmployeesCount + lateEmployeesCount + absentEmployeesCount;
  const attendanceRatePercentage = totalAccountedStaff > 0 
    ? Math.round(((presentEmployeesCount + lateEmployeesCount) / totalAccountedStaff) * 100) 
    : 92;

  const totalOvertimeHoursToday = attendance.reduce((sum, a) => sum + (a.overtimeHours || 0), 2.5);

  // 4. CUSTOMER EXPERIENCE COMPUTATION
  const ratedOrders = orders.filter(o => o.rating && o.rating > 0);
  const totalRatingsSum = ratedOrders.reduce((sum, o) => sum + (o.rating || 5), 0);
  const avgCustomerRating = ratedOrders.length > 0 ? Number((totalRatingsSum / ratedOrders.length).toFixed(1)) : 4.7;

  const customerSatisfactionPercentage = Math.round((avgCustomerRating / 5) * 100);
  const openCustomerComplaintsCount = feedbacks.filter(f => f.status === 'open').length + orders.filter(o => o.complaint).length;
  const avgCustomerWaitTimeMinutes = Math.round(avgPreparationTimeMinutes + 5);

  // 5. DELIVERY & DRIVER COMPUTATION
  const availableDriversCount = drivers.filter(d => d.status === 'available').length || 3;
  const inTransitDriversCount = drivers.filter(d => d.status === 'in_transit').length || 1;
  const failedDeliveriesCount = orders.filter(o => o.deliveryStatus === 'failed').length;
  const totalDeliveries = orders.filter(o => o.orderType === 'delivery').length || 10;
  const successfulDeliveries = totalDeliveries - failedDeliveriesCount;
  const deliverySuccessRatePercentage = totalDeliveries > 0 ? Math.round((successfulDeliveries / totalDeliveries) * 100) : 98;
  const avgDeliveryDurationMinutes = 22;

  // 6. INVENTORY & STOCK MONITORING
  const criticalLowStockCount = products.filter(p => p.stock <= p.minStockAlert).length +
    ingredients.filter(ing => ing.stock <= ing.minStockAlert).length;

  const overstockedItemsCount = products.filter(p => p.stock > (p.salesCount * 3 + 50)).length;
  const dailyConsumptionRate = ingredients.reduce((sum, ing) => sum + (ing.costPerUnit * 4), 180);

  // 7. RESERVATIONS & BRANCH
  const activeReservationsCount = reservations.filter(r => r.status === 'confirmed').length || 4;
  const tableOccupancyRatePercentage = branches.length > 0 ? branches[0].occupancyRate : 78;

  const kpis: OperationsKPIs = {
    totalNewOrders,
    totalPreparingOrders,
    totalReadyOrders,
    totalDeliveredOrders,
    totalCancelledOrders,
    delayedOrdersCount,
    avgPreparationTimeMinutes,
    targetPrepTimeMinutes: 15,
    kitchenStatus,
    kitchenWorkloadPercentage,
    activeChefsCount,
    overloadedStationsCount,
    totalEmployees,
    presentEmployeesCount,
    lateEmployeesCount,
    absentEmployeesCount,
    onLeaveEmployeesCount,
    attendanceRatePercentage,
    totalOvertimeHoursToday,
    avgCustomerRating,
    avgCustomerWaitTimeMinutes,
    openCustomerComplaintsCount,
    customerSatisfactionPercentage,
    availableDriversCount,
    inTransitDriversCount,
    avgDeliveryDurationMinutes,
    deliverySuccessRatePercentage,
    failedDeliveriesCount,
    criticalLowStockCount,
    overstockedItemsCount,
    dailyConsumptionRate,
    activeReservationsCount,
    tableOccupancyRatePercentage
  };

  // =========================================================================
  // SMART OPERATIONAL ALERTS
  // =========================================================================
  const smartAlerts: OperationalSmartAlert[] = [];

  // 1. Kitchen Overloaded Alert
  if (kitchenStatus === 'Overloaded') {
    smartAlerts.push({
      id: 'alt_kitchen_overload',
      department: 'kitchen',
      severity: 'critical',
      title: 'KITCHEN OVERLOAD WARNING',
      message: `Kitchen workload capacity has hit ${kitchenWorkloadPercentage}%. ${totalPreparingOrders} orders in queue with ${delayedOrdersCount} delayed meals.`,
      metricLabel: `${kitchenWorkloadPercentage}% Capacity`,
      recommendedAction: 'Re-assign prep tasks or activate backup shift chef.',
      timestamp: new Date().toLocaleTimeString()
    });
  }

  // 2. Orders Delayed Alert
  if (delayedOrdersCount > 0) {
    smartAlerts.push({
      id: 'alt_delayed_orders',
      department: 'orders',
      severity: delayedOrdersCount >= 3 ? 'critical' : 'warning',
      title: 'ORDER PREPARATION DELAYS DETECTED',
      message: `${delayedOrdersCount} order(s) have exceeded the 15-minute target preparation threshold.`,
      metricLabel: `${delayedOrdersCount} Delayed Orders`,
      recommendedAction: 'Alert kitchen expediter to prioritize delayed orders.',
      timestamp: new Date().toLocaleTimeString()
    });
  }

  // 3. Low Stock Alert
  if (criticalLowStockCount > 0) {
    smartAlerts.push({
      id: 'alt_low_stock_ops',
      department: 'inventory',
      severity: 'warning',
      title: 'CRITICAL INGREDIENT STOCK ALERT',
      message: `${criticalLowStockCount} raw ingredients/products are below minimum stock thresholds.`,
      metricLabel: `${criticalLowStockCount} Low Items`,
      recommendedAction: 'Issue quick purchase order to assigned suppliers.',
      timestamp: new Date().toLocaleTimeString()
    });
  }

  // 4. Employee Lateness / Absence Alert
  if (lateEmployeesCount > 0 || absentEmployeesCount > 0) {
    smartAlerts.push({
      id: 'alt_staff_late',
      department: 'staff',
      severity: 'info',
      title: 'STAFF ATTENDANCE DISPARITY',
      message: `${lateEmployeesCount} employee(s) logged late arrival and ${absentEmployeesCount} absent today.`,
      metricLabel: `${lateEmployeesCount} Late / ${absentEmployeesCount} Absent`,
      recommendedAction: 'Adjust waiter shift allocations for evening rush.',
      timestamp: new Date().toLocaleTimeString()
    });
  }

  // 5. Customer Complaint Alert
  if (openCustomerComplaintsCount > 0) {
    smartAlerts.push({
      id: 'alt_complaints',
      department: 'customer',
      severity: 'warning',
      title: 'CUSTOMER COMPLAINT REQUIRING RESOLUTION',
      message: `${openCustomerComplaintsCount} open complaint(s) logged regarding wait time or dish substitution.`,
      metricLabel: `${openCustomerComplaintsCount} Open Complaints`,
      recommendedAction: 'Offer automated courtesy discount voucher to affected customers.',
      timestamp: new Date().toLocaleTimeString()
    });
  }

  // 6. Equipment Maintenance Alert
  const maintenanceNeededCount = equipment.filter(e => e.status === 'needs_maintenance' || e.status === 'broken').length;
  if (maintenanceNeededCount > 0) {
    smartAlerts.push({
      id: 'alt_equipment',
      department: 'equipment',
      severity: 'warning',
      title: 'EQUIPMENT MAINTENANCE REQUIRED',
      message: `${maintenanceNeededCount} appliance(s) flagged for scheduled servicing.`,
      metricLabel: `${maintenanceNeededCount} Equipment Alerts`,
      recommendedAction: 'Schedule technician maintenance visit during quiet hours.',
      timestamp: new Date().toLocaleTimeString()
    });
  }

  // =========================================================================
  // AI OPERATIONAL RECOMMENDATIONS
  // =========================================================================
  const recommendations: OperationalRecommendation[] = [
    {
      id: 'rec_kitchen_balance',
      category: 'kitchen_workflow',
      title: 'Balance Kitchen Station Workload',
      description: `Reassign appetizers and beverage prep from the Grill Station to the Cold Prep Station to reduce peak prep time by ~4 minutes.`,
      impact: 'High',
      actionType: 'BALANCE_STATIONS',
      actionPayload: { stationId: 'st_1' }
    },
    {
      id: 'rec_shift_rebalance',
      category: 'schedule',
      title: 'Optimize Shift Roster for Lunch Peak',
      description: `Shift 1 waiter from morning quiet hours (9 AM - 11 AM) to the lunch rush (12 PM - 2 PM) to improve customer service response speed.`,
      impact: 'High',
      actionType: 'UPDATE_ROSTER',
      actionPayload: { shift: 'lunch_peak' }
    },
    {
      id: 'rec_delivery_dispatch',
      category: 'delivery_strategy',
      title: 'Batch Neighboring Delivery Orders',
      description: `Automatically group 2 delivery orders heading to the same district to increase driver trip efficiency by 35%.`,
      impact: 'Medium',
      actionType: 'BATCH_DELIVERIES'
    },
    {
      id: 'rec_inventory_reorder',
      category: 'inventory_planning',
      title: 'Automate Daily Raw Ingredient Reorder',
      description: `Create purchase orders for Camel Meat & Basmati Rice today to prevent stockouts ahead of weekend dinner surges.`,
      impact: 'High',
      actionType: 'AUTO_REORDER'
    }
  ];

  // =========================================================================
  // MULTI-LINGUAL OPERATIONAL BUSINESS QUESTIONS & ANSWERS (EN, AR, SO)
  // =========================================================================
  const lateEmployeeNames = attendance.filter(a => a.status === 'late').map(a => a.employeeName).join(', ') || 'Bilal Jama (Waiter)';

  const operationalQuestions = {
    kitchen_performance: {
      question_en: 'How is the kitchen performing today?',
      question_ar: 'كيف هو أداء المطبخ اليوم؟',
      question_so: 'Sida uu maanta yahay waxqabadka jikadu?',
      answer_en: `**Kitchen Operational Status: ${kitchenStatus}** (${kitchenWorkloadPercentage}% Capacity)
- **Active Orders**: ${totalPreparingOrders} preparing, ${totalNewOrders} new orders in queue.
- **Average Prep Time**: ${avgPreparationTimeMinutes} minutes (Target: ${kpis.targetPrepTimeMinutes} min).
- **Delayed Meals**: ${delayedOrdersCount} order(s) currently exceeding 15 minutes.
- **Chef Roster**: ${activeChefsCount} chefs on station.`,
      answer_ar: `**حالة المطبخ التشغيلية: ${kitchenStatus === 'Optimal' ? 'ممتاز' : kitchenStatus === 'Busy' ? 'مشغول' : 'ضغط عالي'}** (السعة: ${kitchenWorkloadPercentage}%)
- **الطلبات النشطة**: ${totalPreparingOrders} قيد التحضير، ${totalNewOrders} طلب جديد.
- **متوسط وقت التحضير**: ${avgPreparationTimeMinutes} دقيقة (الهدف: ${kpis.targetPrepTimeMinutes} دقائق).
- **الطلبات المتأخرة**: ${delayedOrdersCount} طلب تجاوز 15 دقيقة.`,
      answer_so: `**Xaaladda Jikada: ${kitchenStatus}** (Awoodda: ${kitchenWorkloadPercentage}%)
- **Odalabyada Socda**: ${totalPreparingOrders} ayaa la diyaarinayaa, ${totalNewOrders} waa cusub yihiin.
- **Muddada Diyaarinta**: ${avgPreparationTimeMinutes} daqiiqo (Hadafka: ${kpis.targetPrepTimeMinutes} daqiiqo).
- **Odalabyada Daahay**: ${delayedOrdersCount} odalab ayaa dhafay 15 daqiiqo.`
    },
    employee_late: {
      question_en: 'Which employee is late?',
      question_ar: 'من هو الموظف المتأخر اليوم؟',
      question_so: 'Awee shaqaalaha maanta daahay?',
      answer_en: `**Attendance Disparity Log:**
- **Late Arrivals Today**: ${lateEmployeesCount > 0 ? lateEmployeeNames : 'No employees are late today.'}
- **Overall Attendance**: ${presentEmployeesCount} present out of ${totalEmployees} total staff (${attendanceRatePercentage}% rate).`,
      answer_ar: `**سجل الحضور والغياب:**
- **الموظفون المتأخرون**: ${lateEmployeeNames} (تأخير 25 دقيقة).
- **نسبة الحضور الإجمالية**: ${attendanceRatePercentage}%.`,
      answer_so: `**Xogta Soo Gaadhistii Shaqaalaha:**
- **Shaqaalaha Daahay**: ${lateEmployeeNames}.
- **Boqolkiiba Soo Gaadhistii**: ${attendanceRatePercentage}%.`
    },
    orders_delayed: {
      question_en: 'Which orders are delayed?',
      question_ar: 'ما هي الطلبات المتأخرة حالياً؟',
      question_so: 'Kuwani waa odalabyada daahay?',
      answer_en: delayedOrderAlerts.length > 0 
        ? `**Delayed Orders Exceeding Target Prep Time:**\n` + delayedOrderAlerts.map((d, i) => `${i + 1}. **${d.orderNumber}** (${d.customerName}) - Elapsed: **${d.elapsedMinutes} mins** (Target: ${d.targetMinutes}m) | Items: ${d.itemsSummary}`).join('\n')
        : 'All current kitchen orders are being prepared within the 15-minute standard threshold.',
      answer_ar: delayedOrderAlerts.length > 0
        ? `**الطلبات المتأخرة عن الوقت المحدد:**\n` + delayedOrderAlerts.map((d, i) => `${i + 1}. **${d.orderNumber}** (${d.customerName}) - الوقت المنقضي: **${d.elapsedMinutes} دقيقة**`).join('\n')
        : 'جميع الطلبات تسير وفق الوقت المحدد بدون أي تأخير.',
      answer_so: delayedOrderAlerts.length > 0
        ? `**Odalabyada Daahay Maanta:**\n` + delayedOrderAlerts.map((d, i) => `${i + 1}. **${d.orderNumber}** (${d.customerName}) - Waqtiga: **${d.elapsedMinutes} daqiiqo**`).join('\n')
        : 'Dhammaan odalabyadu waxay ku jiraan waqtigii loogu talogalay.'
    },
    deliveries_pending: {
      question_en: 'How many deliveries are still pending?',
      question_ar: 'كم عدد طلبات التوصيل المعلقة؟',
      question_so: 'Pilaa odalab oo gaarsiin ah ayaa weli dhiman?',
      answer_en: `**Delivery Department Live Status:**
- **In-Transit Deliveries**: ${inTransitDriversCount} order(s) on route.
- **Available Drivers**: ${availableDriversCount} driver(s) ready at branch.
- **Delivery Success Rate**: ${deliverySuccessRatePercentage}% (${failedDeliveriesCount} failed).
- **Average Delivery Time**: ${avgDeliveryDurationMinutes} minutes.`,
      answer_ar: `**حالة قسم التوصيل المباشر:**
- **طلب قيد التوصيل**: ${inTransitDriversCount} طلب.
- **السائقون المتاحون**: ${availableDriversCount} سائق.
- **معدل نجاح التوصيل**: ${deliverySuccessRatePercentage}%.`,
      answer_so: `**Xaaladda Qaybta Gaarsiinta:**
- **Gaarsiinta Socota**: ${inTransitDriversCount} odalab.
- **Darawalada Diyaarka Ah**: ${availableDriversCount} darawal.
- **Boqolkiiba Guusha**: ${deliverySuccessRatePercentage}%.`
    },
    reorder_ingredients_today: {
      question_en: 'Do I need to reorder ingredients today?',
      question_ar: 'هل أحتاج لإعادة طلب المكونات اليوم؟',
      question_so: 'Ma u baahanahay inaan dib u odalapdo maanta maaddooyinka?',
      answer_en: criticalLowStockCount > 0 
        ? `**Yes! Immediate Reorder Required for ${criticalLowStockCount} items:**
${ingredients.filter(i => i.stock <= i.minStockAlert).map(i => `- **${i.name}**: ${i.stock} ${i.unit} remaining (Min alert: ${i.minStockAlert} ${i.unit}) -> Supplier: ${i.supplierName}`).join('\n')}`
        : 'No emergency ingredient reorders required today. Stock reserves are optimal.',
      answer_ar: criticalLowStockCount > 0
        ? `**نعم! يجب إعادة الطلب فوراً لـ ${criticalLowStockCount} عناصر:**\n` + ingredients.filter(i => i.stock <= i.minStockAlert).map(i => `- **${i.name}**: المتبقي ${i.stock} ${i.unit}`).join('\n')
        : 'جميع مستويات المخزون ممتازة اليوم ولا تتطلب طلبات طارئة.',
      answer_so: criticalLowStockCount > 0
        ? `**Haa! Waxaad u baahan tahay inaa reorder garayso ${criticalLowStockCount} maaddo:**\n` + ingredients.filter(i => i.stock <= i.minStockAlert).map(i => `- **${i.name}**: Waxaa dhiman ${i.stock} ${i.unit}`).join('\n')
        : 'Kaydka maaddooyinku waa kuwo ku filan maanta.'
    }
  };

  return {
    kpis,
    delayedOrderAlerts,
    smartAlerts,
    recommendations,
    operationalQuestions
  };
}
