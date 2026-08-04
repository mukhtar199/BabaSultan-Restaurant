import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where,
  writeBatch
} from 'firebase/firestore';
import { db, COLLECTIONS } from './firebase';
import { 
  DeliveryDriver, 
  DriverStatus, 
  DriverAvailability, 
  VehicleType, 
  DeliveryOrder, 
  DeliveryStatus, 
  DeliveryTracking, 
  DeliveryZone, 
  DeliveryNotification,
  DeliveryReportData 
} from '../types';

// Initial Seed Drivers
export const DEFAULT_DRIVERS: DeliveryDriver[] = [
  {
    id: 'drv_001',
    fullName: 'Mohamed Farah',
    employeeId: 'EMP-DRV-101',
    phoneNumber: '+252 61 888 1111',
    vehicleType: 'motorcycle',
    vehicleNumber: 'MOG-4492-MC',
    licenseNumber: 'DL-SO-99211',
    status: 'active',
    availability: 'available',
    currentLocation: {
      lat: 2.046937,
      lng: 45.318161,
      address: 'KM4 Junction, Mogadishu',
      lastUpdated: new Date().toISOString()
    },
    branchId: 'branch_hq_01',
    branchName: 'Headquarters - Mogadishu Main',
    rating: 4.9,
    totalDeliveries: 142,
    completedDeliveries: 139,
    failedDeliveries: 3,
    createdAt: new Date().toISOString()
  },
  {
    id: 'drv_002',
    fullName: 'Ahmed Hassan',
    employeeId: 'EMP-DRV-102',
    phoneNumber: '+252 61 777 2222',
    vehicleType: 'car',
    vehicleNumber: 'MOG-1102-CA',
    licenseNumber: 'DL-SO-88321',
    status: 'active',
    availability: 'on_delivery',
    currentLocation: {
      lat: 2.052100,
      lng: 45.324500,
      address: 'Taleex Street, Mogadishu',
      lastUpdated: new Date().toISOString()
    },
    branchId: 'branch_hq_01',
    branchName: 'Headquarters - Mogadishu Main',
    rating: 4.8,
    totalDeliveries: 98,
    completedDeliveries: 95,
    failedDeliveries: 3,
    createdAt: new Date().toISOString()
  },
  {
    id: 'drv_003',
    fullName: 'Ibrahim Warsame',
    employeeId: 'EMP-DRV-103',
    phoneNumber: '+252 63 444 3333',
    vehicleType: 'scooter',
    vehicleNumber: 'HAR-9923-SC',
    licenseNumber: 'DL-SL-44123',
    status: 'active',
    availability: 'available',
    currentLocation: {
      lat: 9.562389,
      lng: 44.064972,
      address: 'City Center, Hargeisa',
      lastUpdated: new Date().toISOString()
    },
    branchId: 'branch_hargeisa_01',
    branchName: 'Hargeisa Flagship Branch',
    rating: 4.7,
    totalDeliveries: 76,
    completedDeliveries: 74,
    failedDeliveries: 2,
    createdAt: new Date().toISOString()
  },
  {
    id: 'drv_004',
    fullName: 'Abdiqani Ali',
    employeeId: 'EMP-DRV-104',
    phoneNumber: '+252 61 555 4444',
    vehicleType: 'van',
    vehicleNumber: 'KIS-5521-VN',
    licenseNumber: 'DL-SO-33412',
    status: 'active',
    availability: 'on_delivery',
    currentLocation: {
      lat: -0.358178,
      lng: 42.545367,
      address: 'Port Boulevard, Kismayo',
      lastUpdated: new Date().toISOString()
    },
    branchId: 'branch_kismayo_01',
    branchName: 'Kismayo Coastal Express',
    rating: 4.9,
    totalDeliveries: 115,
    completedDeliveries: 112,
    failedDeliveries: 3,
    createdAt: new Date().toISOString()
  }
];

// Initial Seed Delivery Zones
export const DEFAULT_DELIVERY_ZONES: DeliveryZone[] = [
  {
    id: 'zone_001',
    name: 'Mogadishu Central Business District',
    code: 'Z-MOG-CBD',
    city: 'Mogadishu',
    coverageRadiusKm: 3.5,
    baseDeliveryFee: 2.00,
    minOrderAmount: 15.00,
    estimatedTimeMinutes: 25,
    isActive: true,
    branchId: 'branch_hq_01',
    branchName: 'Headquarters - Mogadishu Main',
    createdAt: new Date().toISOString()
  },
  {
    id: 'zone_002',
    name: 'KM4 & Airport Corridor',
    code: 'Z-MOG-KM4',
    city: 'Mogadishu',
    coverageRadiusKm: 6.0,
    baseDeliveryFee: 3.50,
    minOrderAmount: 20.00,
    estimatedTimeMinutes: 35,
    isActive: true,
    branchId: 'branch_hq_01',
    branchName: 'Headquarters - Mogadishu Main',
    createdAt: new Date().toISOString()
  },
  {
    id: 'zone_003',
    name: 'Hargeisa Downtown & Independence Ave',
    code: 'Z-HAR-CENT',
    city: 'Hargeisa',
    coverageRadiusKm: 4.0,
    baseDeliveryFee: 2.50,
    minOrderAmount: 15.00,
    estimatedTimeMinutes: 30,
    isActive: true,
    branchId: 'branch_hargeisa_01',
    branchName: 'Hargeisa Flagship Branch',
    createdAt: new Date().toISOString()
  },
  {
    id: 'zone_004',
    name: 'Kismayo Ocean View & Port Zone',
    code: 'Z-KIS-PORT',
    city: 'Kismayo',
    coverageRadiusKm: 5.0,
    baseDeliveryFee: 3.00,
    minOrderAmount: 18.00,
    estimatedTimeMinutes: 30,
    isActive: true,
    branchId: 'branch_kismayo_01',
    branchName: 'Kismayo Coastal Express',
    createdAt: new Date().toISOString()
  }
];

// Initial Seed Deliveries
export const DEFAULT_DELIVERIES: DeliveryOrder[] = [
  {
    id: 'del_001',
    deliveryNumber: 'DEL-9081',
    orderId: 'ORD-10081',
    customerName: 'Jama Duale',
    customerPhone: '+252 61 999 0011',
    deliveryAddress: 'House #44, Hodan District, Near KM5, Mogadishu',
    deliveryZoneId: 'zone_001',
    deliveryZoneName: 'Mogadishu Central Business District',
    gpsLocation: { lat: 2.051200, lng: 45.321000 },
    driverId: 'drv_002',
    driverName: 'Ahmed Hassan',
    driverPhone: '+252 61 777 2222',
    branchId: 'branch_hq_01',
    branchName: 'Headquarters - Mogadishu Main',
    status: 'on_the_way',
    subtotal: 39.00,
    deliveryFee: 3.50,
    tipAmount: 2.00,
    totalAmount: 44.50,
    paymentMethod: 'evc_plus',
    paymentStatus: 'paid',
    itemsCount: 4,
    itemsSummary: '2x Somali Goat Platter, 2x Mango Juice',
    assignedAt: new Date(Date.now() - 1800000).toISOString(),
    acceptedAt: new Date(Date.now() - 1500000).toISOString(),
    pickedUpAt: new Date(Date.now() - 900000).toISOString(),
    onTheWayAt: new Date(Date.now() - 600000).toISOString(),
    estimatedDeliveryTimeMinutes: 30,
    createdAt: new Date(Date.now() - 2400000).toISOString()
  },
  {
    id: 'del_002',
    deliveryNumber: 'DEL-9082',
    orderId: 'ORD-10082',
    customerName: 'Sundus Omer',
    customerPhone: '+252 63 888 2211',
    deliveryAddress: 'Villa 12, Massala Area, Hargeisa',
    deliveryZoneId: 'zone_003',
    deliveryZoneName: 'Hargeisa Downtown & Independence Ave',
    gpsLocation: { lat: 9.564100, lng: 44.067200 },
    driverId: 'drv_003',
    driverName: 'Ibrahim Warsame',
    driverPhone: '+252 63 444 3333',
    branchId: 'branch_hargeisa_01',
    branchName: 'Hargeisa Flagship Branch',
    status: 'assigned',
    subtotal: 25.50,
    deliveryFee: 2.50,
    totalAmount: 28.00,
    paymentMethod: 'zaad',
    paymentStatus: 'paid',
    itemsCount: 3,
    itemsSummary: '1x Camel Steak Ribs, 2x Fresh Lemonade',
    assignedAt: new Date(Date.now() - 600000).toISOString(),
    estimatedDeliveryTimeMinutes: 25,
    createdAt: new Date(Date.now() - 900000).toISOString()
  },
  {
    id: 'del_003',
    deliveryNumber: 'DEL-9083',
    orderId: 'ORD-10083',
    customerName: 'Hamza Abdi',
    customerPhone: '+252 61 333 9988',
    deliveryAddress: 'Port View Hotel Suite 304, Kismayo',
    deliveryZoneId: 'zone_004',
    deliveryZoneName: 'Kismayo Ocean View & Port Zone',
    gpsLocation: { lat: -0.356200, lng: 42.548100 },
    driverId: 'drv_004',
    driverName: 'Abdiqani Ali',
    driverPhone: '+252 61 555 4444',
    branchId: 'branch_kismayo_01',
    branchName: 'Kismayo Coastal Express',
    status: 'picked_up',
    subtotal: 52.00,
    deliveryFee: 3.00,
    tipAmount: 3.00,
    totalAmount: 58.00,
    paymentMethod: 'cash',
    paymentStatus: 'pending',
    itemsCount: 5,
    itemsSummary: '3x Seafood Platter, 2x Spicy Bariis',
    assignedAt: new Date(Date.now() - 2100000).toISOString(),
    acceptedAt: new Date(Date.now() - 1800000).toISOString(),
    pickedUpAt: new Date(Date.now() - 300000).toISOString(),
    estimatedDeliveryTimeMinutes: 30,
    createdAt: new Date(Date.now() - 2700000).toISOString()
  },
  {
    id: 'del_004',
    deliveryNumber: 'DEL-9084',
    orderId: 'ORD-10084',
    customerName: 'Amina Said',
    customerPhone: '+252 61 111 4455',
    deliveryAddress: 'Apartment 5B, Wadajir District, Mogadishu',
    deliveryZoneId: 'zone_001',
    deliveryZoneName: 'Mogadishu Central Business District',
    driverId: 'drv_001',
    driverName: 'Mohamed Farah',
    driverPhone: '+252 61 888 1111',
    branchId: 'branch_hq_01',
    branchName: 'Headquarters - Mogadishu Main',
    status: 'delivered',
    subtotal: 32.00,
    deliveryFee: 2.00,
    totalAmount: 34.00,
    paymentMethod: 'evc_plus',
    paymentStatus: 'paid',
    itemsCount: 2,
    itemsSummary: '2x Grilled Chicken Suqaar',
    assignedAt: new Date(Date.now() - 4000000).toISOString(),
    acceptedAt: new Date(Date.now() - 3800000).toISOString(),
    pickedUpAt: new Date(Date.now() - 3000000).toISOString(),
    onTheWayAt: new Date(Date.now() - 2500000).toISOString(),
    deliveredAt: new Date(Date.now() - 1200000).toISOString(),
    estimatedDeliveryTimeMinutes: 25,
    actualDeliveryTimeMinutes: 22,
    customerRating: 5,
    customerFeedback: 'Fast and polite delivery driver! Food arrived hot.',
    createdAt: new Date(Date.now() - 4500000).toISOString()
  },
  {
    id: 'del_005',
    deliveryNumber: 'DEL-9085',
    orderId: 'ORD-10085',
    customerName: 'Layla Yusuf',
    customerPhone: '+252 61 666 7788',
    deliveryAddress: 'Waberi Sector 3, Mogadishu',
    deliveryZoneId: 'zone_002',
    deliveryZoneName: 'KM4 & Airport Corridor',
    branchId: 'branch_hq_01',
    branchName: 'Headquarters - Mogadishu Main',
    status: 'pending',
    subtotal: 16.00,
    deliveryFee: 3.50,
    totalAmount: 19.50,
    paymentMethod: 'evc_plus',
    paymentStatus: 'paid',
    itemsCount: 2,
    itemsSummary: '1x Sambusa Plate, 1x Somaliland Chai',
    estimatedDeliveryTimeMinutes: 35,
    createdAt: new Date(Date.now() - 300000).toISOString()
  }
];

// Seed Firestore if empty
export async function seedInitialDeliveryData() {
  try {
    const driversSnap = await getDocs(collection(db, COLLECTIONS.DRIVERS));
    if (driversSnap.empty) {
      const batch = writeBatch(db);
      for (const drv of DEFAULT_DRIVERS) {
        batch.set(doc(db, COLLECTIONS.DRIVERS, drv.id), drv);
      }
      for (const z of DEFAULT_DELIVERY_ZONES) {
        batch.set(doc(db, COLLECTIONS.DELIVERY_ZONES, z.id), z);
      }
      for (const d of DEFAULT_DELIVERIES) {
        batch.set(doc(db, COLLECTIONS.DELIVERIES, d.id), d);
      }
      await batch.commit();
    }
  } catch (err: any) {
    console.warn('Delivery data seeding skipped:', err?.message || err);
  }
}

// Driver Actions
export async function createDriver(driverData: Omit<DeliveryDriver, 'id' | 'createdAt'>): Promise<string> {
  const newRef = doc(collection(db, COLLECTIONS.DRIVERS));
  const newDriver: DeliveryDriver = {
    ...driverData,
    id: newRef.id,
    rating: 5.0,
    totalDeliveries: 0,
    completedDeliveries: 0,
    failedDeliveries: 0,
    createdAt: new Date().toISOString()
  };
  await setDoc(newRef, newDriver);
  return newRef.id;
}

export async function updateDriver(driverId: string, updates: Partial<DeliveryDriver>): Promise<void> {
  const ref = doc(db, COLLECTIONS.DRIVERS, driverId);
  await updateDoc(ref, {
    ...updates,
    updatedAt: new Date().toISOString()
  });
}

export async function deleteDriver(driverId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.DRIVERS, driverId));
}

export async function updateDriverLocation(
  driverId: string, 
  lat: number, 
  lng: number, 
  address?: string
): Promise<void> {
  await updateDriver(driverId, {
    currentLocation: {
      lat,
      lng,
      address,
      lastUpdated: new Date().toISOString()
    }
  });
}

export async function setDriverAvailability(driverId: string, availability: DriverAvailability): Promise<void> {
  await updateDriver(driverId, { availability });
}

// Delivery Order Workflow Actions
export async function createDeliveryOrder(
  deliveryData: Omit<DeliveryOrder, 'id' | 'deliveryNumber' | 'createdAt' | 'status'>
): Promise<string> {
  const newRef = doc(collection(db, COLLECTIONS.DELIVERIES));
  const deliveryNumber = `DEL-${Math.floor(1000 + Math.random() * 9000)}`;
  
  const newDelivery: DeliveryOrder = {
    ...deliveryData,
    id: newRef.id,
    deliveryNumber,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  await setDoc(newRef, newDelivery);
  return newRef.id;
}

export async function assignDriverToDelivery(
  deliveryId: string, 
  driverId: string, 
  driverName: string, 
  driverPhone: string
): Promise<void> {
  const ref = doc(db, COLLECTIONS.DELIVERIES, deliveryId);
  const now = new Date().toISOString();

  await updateDoc(ref, {
    driverId,
    driverName,
    driverPhone,
    status: 'assigned',
    assignedAt: now,
    updatedAt: now
  });

  // Set driver status to on_delivery
  await setDriverAvailability(driverId, 'on_delivery');

  // Add Notification
  await sendDeliveryNotification({
    deliveryId,
    title: 'Driver Assigned',
    message: `Driver ${driverName} has been assigned to Delivery ${deliveryId.slice(-6)}.`,
    type: 'driver_assigned',
    targetUser: 'customer'
  });
}

export async function updateDeliveryStatus(
  deliveryId: string,
  newStatus: DeliveryStatus,
  driverId?: string,
  failureReason?: string
): Promise<void> {
  const ref = doc(db, COLLECTIONS.DELIVERIES, deliveryId);
  const now = new Date().toISOString();

  const updates: Partial<DeliveryOrder> = {
    status: newStatus,
    updatedAt: now
  };

  if (newStatus === 'accepted') updates.acceptedAt = now;
  if (newStatus === 'picked_up') updates.pickedUpAt = now;
  if (newStatus === 'on_the_way') updates.onTheWayAt = now;
  if (newStatus === 'arrived') {
    updates.arrivedAt = now;
    await sendDeliveryNotification({
      deliveryId,
      title: 'Driver Arrived',
      message: 'Your delivery driver has arrived at your destination!',
      type: 'driver_arrived',
      targetUser: 'customer'
    });
  }
  if (newStatus === 'delivered') {
    updates.deliveredAt = now;
    updates.paymentStatus = 'paid';
    if (driverId) {
      await setDriverAvailability(driverId, 'available');
    }
    await sendDeliveryNotification({
      deliveryId,
      title: 'Order Delivered',
      message: 'Your order has been successfully delivered. Thank you!',
      type: 'order_delivered',
      targetUser: 'customer'
    });
  }
  if (newStatus === 'failed' || newStatus === 'returned' || newStatus === 'cancelled') {
    updates.failedAt = now;
    updates.failureReason = failureReason || 'Delivery issue encountered';
    if (driverId) {
      await setDriverAvailability(driverId, 'available');
    }
  }

  await updateDoc(ref, updates);

  // Record tracking history point
  if (driverId) {
    await addTrackingPoint(deliveryId, driverId, 2.0469, 45.3181, newStatus);
  }
}

export async function rateDelivery(deliveryId: string, rating: number, feedback?: string): Promise<void> {
  const ref = doc(db, COLLECTIONS.DELIVERIES, deliveryId);
  await updateDoc(ref, {
    customerRating: rating,
    customerFeedback: feedback,
    updatedAt: new Date().toISOString()
  });
}

// Tracking History
export async function addTrackingPoint(
  deliveryId: string, 
  driverId: string, 
  lat: number, 
  lng: number, 
  statusUpdate?: DeliveryStatus,
  note?: string
): Promise<void> {
  const newRef = doc(collection(db, COLLECTIONS.DELIVERY_TRACKING));
  const tracking: DeliveryTracking = {
    id: newRef.id,
    deliveryId,
    driverId,
    lat,
    lng,
    speedKmH: Math.floor(20 + Math.random() * 25),
    heading: Math.floor(Math.random() * 360),
    timestamp: new Date().toISOString(),
    statusUpdate,
    note
  };
  await setDoc(newRef, tracking);
}

// Delivery Zones CRUD
export async function createDeliveryZone(zoneData: Omit<DeliveryZone, 'id' | 'createdAt'>): Promise<string> {
  const newRef = doc(collection(db, COLLECTIONS.DELIVERY_ZONES));
  const newZone: DeliveryZone = {
    ...zoneData,
    id: newRef.id,
    createdAt: new Date().toISOString()
  };
  await setDoc(newRef, newZone);
  return newRef.id;
}

export async function updateDeliveryZone(zoneId: string, updates: Partial<DeliveryZone>): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.DELIVERY_ZONES, zoneId), updates);
}

export async function deleteDeliveryZone(zoneId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.DELIVERY_ZONES, zoneId));
}

// Delivery Notifications
export async function sendDeliveryNotification(
  notifData: Omit<DeliveryNotification, 'id' | 'createdAt' | 'read'>
): Promise<void> {
  const newRef = doc(collection(db, COLLECTIONS.DELIVERY_NOTIFICATIONS));
  const notif: DeliveryNotification = {
    ...notifData,
    id: newRef.id,
    createdAt: new Date().toISOString(),
    read: false
  };
  await setDoc(newRef, notif);
}

// Delivery Analytics Calculation Engine
export function calculateDeliveryAnalytics(deliveries: DeliveryOrder[], drivers: DeliveryDriver[]) {
  const totalCount = deliveries.length;
  const completed = deliveries.filter((d) => d.status === 'delivered');
  const failed = deliveries.filter((d) => d.status === 'failed' || d.status === 'returned' || d.status === 'cancelled');
  const active = deliveries.filter((d) => ['assigned', 'accepted', 'picked_up', 'on_the_way', 'arrived'].includes(d.status));
  const pending = deliveries.filter((d) => d.status === 'pending');

  const totalFees = deliveries.reduce((sum, d) => sum + (d.deliveryFee || 0), 0);
  const totalTips = deliveries.reduce((sum, d) => sum + (d.tipAmount || 0), 0);
  const totalVolume = deliveries.reduce((sum, d) => sum + d.totalAmount, 0);

  // Avg Delivery Time calculation
  const completedWithTimes = completed.filter((d) => d.actualDeliveryTimeMinutes || (d.deliveredAt && d.createdAt));
  const avgDeliveryTime = completedWithTimes.length > 0
    ? Math.round(
        completedWithTimes.reduce((sum, d) => {
          if (d.actualDeliveryTimeMinutes) return sum + d.actualDeliveryTimeMinutes;
          if (d.deliveredAt && d.createdAt) {
            const mins = (new Date(d.deliveredAt).getTime() - new Date(d.createdAt).getTime()) / 60000;
            return sum + Math.min(60, Math.max(10, mins));
          }
          return sum + 25;
        }, 0) / completedWithTimes.length
      )
    : 26;

  // On Time Rate %
  const onTimeCount = completed.filter((d) => {
    const timeTaken = d.actualDeliveryTimeMinutes || 25;
    return timeTaken <= (d.estimatedDeliveryTimeMinutes || 30);
  }).length;
  const onTimeRate = completed.length > 0 ? Math.round((onTimeCount / completed.length) * 100) : 94;

  // Driver Performance Leaderboard
  const driverPerformance = drivers.map((drv) => {
    const drvDeliveries = deliveries.filter((d) => d.driverId === drv.id);
    const drvCompleted = drvDeliveries.filter((d) => d.status === 'delivered');
    const drvFailed = drvDeliveries.filter((d) => d.status === 'failed' || d.status === 'returned');
    const totalFeesEarned = drvCompleted.reduce((sum, d) => sum + (d.deliveryFee * 0.7), 0); // 70% to driver
    const ratings = drvCompleted.filter((d) => d.customerRating).map((d) => d.customerRating!);
    const avgRating = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : (drv.rating || 4.8).toFixed(1);

    return {
      driverId: drv.id,
      driverName: drv.fullName,
      employeeId: drv.employeeId,
      vehicleType: drv.vehicleType,
      status: drv.status,
      availability: drv.availability,
      totalAssigned: drvDeliveries.length,
      completedCount: drvCompleted.length,
      failedCount: drvFailed.length,
      earnings: totalFeesEarned,
      rating: parseFloat(avgRating as string)
    };
  }).sort((a, b) => b.completedCount - a.completedCount);

  return {
    totalCount,
    completedCount: completed.length,
    failedCount: failed.length,
    activeCount: active.length,
    pendingCount: pending.length,
    totalFees,
    totalTips,
    totalVolume,
    avgDeliveryTime,
    onTimeRate,
    driverPerformance,
    topDriver: driverPerformance[0] || null
  };
}
