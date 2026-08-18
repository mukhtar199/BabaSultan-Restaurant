import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  where,
  writeBatch
} from 'firebase/firestore';
import { db, COLLECTIONS, assignDeliveryDriverFirestore, updateDeliveryStatusFirestore, getAuthToken } from './firebase';
import { getCanonicalBranchId, getBranchDisplayName } from './branchUtils';
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
    status: 'unassigned',
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
  if (import.meta.env.VITE_DEMO_MODE !== 'true') {
    return;
  }
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
export async function createDriver(driverData: Omit<DeliveryDriver, 'id' | 'createdAt'> & { id?: string }): Promise<string> {
  const newRef = driverData.id ? doc(db, COLLECTIONS.DRIVERS, driverData.id) : doc(collection(db, COLLECTIONS.DRIVERS));
  const canonicalBranch = getCanonicalBranchId((driverData as any).branchId || (driverData as any).branch);
  const canonicalBranchName = (driverData as any).branchName || getBranchDisplayName(canonicalBranch);

  const newDriver: DeliveryDriver = {
    ...driverData,
    branchId: canonicalBranch,
    branchName: canonicalBranchName,
    id: newRef.id,
    rating: driverData.rating ?? 5.0,
    totalDeliveries: driverData.totalDeliveries ?? 0,
    completedDeliveries: driverData.completedDeliveries ?? 0,
    failedDeliveries: driverData.failedDeliveries ?? 0,
    createdAt: new Date().toISOString()
  };
  await setDoc(newRef, newDriver, { merge: true });
  return newRef.id;
}

export async function updateDriver(driverId: string, updates: Partial<DeliveryDriver>): Promise<void> {
  const ref = doc(db, COLLECTIONS.DRIVERS, driverId);
  const normalizedUpdates = { ...updates };
  if (updates.branchId || (updates as any)?.branch) {
    normalizedUpdates.branchId = getCanonicalBranchId(updates.branchId || (updates as any)?.branch);
    normalizedUpdates.branchName = updates.branchName || getBranchDisplayName(normalizedUpdates.branchId);
  }
  await setDoc(ref, {
    ...normalizedUpdates,
    updatedAt: new Date().toISOString()
  }, { merge: true });
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
  const token = await getAuthToken();
  const res = await fetch('/api/deliveries', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ deliveryData })
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Create Delivery Order Failed (${res.status})`);
  }

  const data = await res.json();
  return data.id;
}

export async function assignDriverToDelivery(
  deliveryId: string, 
  driverId: string, 
  driverName: string, 
  driverPhone: string
): Promise<void> {
  await assignDeliveryDriverFirestore(deliveryId, driverId, driverName, driverPhone);

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
  failureReason?: string,
  realCoords?: { lat: number; lng: number }
): Promise<void> {
  await updateDeliveryStatusFirestore(deliveryId, newStatus, driverId, failureReason);

  if (newStatus === 'arrived') {
    await sendDeliveryNotification({
      deliveryId,
      title: 'Driver Arrived',
      message: 'Your delivery driver has arrived at your destination!',
      type: 'driver_arrived',
      targetUser: 'customer'
    });
  } else if (newStatus === 'delivered') {
    await sendDeliveryNotification({
      deliveryId,
      title: 'Order Delivered',
      message: 'Your order has been successfully delivered. Thank you!',
      type: 'order_delivered',
      targetUser: 'customer'
    });
  }

  // P1-11: Record tracking telemetry point only if real coordinates or demo mode
  const isDemo = typeof import.meta !== 'undefined' && import.meta.env?.VITE_DEMO_MODE === 'true';

  if (driverId) {
    if (realCoords && Number.isFinite(realCoords.lat) && Number.isFinite(realCoords.lng)) {
      await addTrackingPoint(deliveryId, driverId, realCoords.lat, realCoords.lng, newStatus);
    } else if (isDemo) {
      // In explicit demo mode only, provide simulated initial position
      await addTrackingPoint(deliveryId, driverId, 2.0469, 45.3181, newStatus);
    }
  }
}

export async function rateDelivery(deliveryId: string, rating: number, feedback?: string): Promise<void> {
  try {
    const token = await getAuthToken();
    const response = await fetch(`/api/deliveries/${deliveryId}/rating`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ rating, feedback })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Delivery rating failed (${response.status})`);
    }
  } catch (err) {
    console.warn('Delivery rating note:', err);
  }
}

// Tracking History (Server Authoritative)
export async function addTrackingPoint(
  deliveryId: string, 
  driverId: string, 
  lat: number, 
  lng: number, 
  statusUpdate?: DeliveryStatus,
  note?: string,
  speedKmH?: number,
  heading?: number
): Promise<void> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    console.warn('[GPS Tracking] Invalid GPS coordinates rejected:', { lat, lng });
    return;
  }

  const isDemo = typeof import.meta !== 'undefined' && import.meta.env?.VITE_DEMO_MODE === 'true';

  try {
    const token = await getAuthToken();
    const response = await fetch(`/api/deliveries/${deliveryId}/tracking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        driverId,
        lat,
        lng,
        speedKmH: typeof speedKmH === 'number' ? speedKmH : (isDemo ? Math.floor(20 + Math.random() * 25) : undefined),
        heading: typeof heading === 'number' ? heading : (isDemo ? Math.floor(Math.random() * 360) : undefined),
        statusUpdate,
        note
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.warn('Delivery tracking endpoint error:', errorData.error || response.status);
    }
  } catch (err) {
    console.warn('Delivery telemetry tracking note:', err);
  }
}

// Delivery Zones CRUD
export async function createDeliveryZone(zoneData: Omit<DeliveryZone, 'id' | 'createdAt'>): Promise<string> {
  const newRef = doc(collection(db, COLLECTIONS.DELIVERY_ZONES));
  let effectiveBranchId = zoneData.branchId;
  if (!effectiveBranchId && typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('user_profile');
      if (stored) {
        const u = JSON.parse(stored);
        effectiveBranchId = u.branchId || u.branch;
      }
    } catch {}
  }
  if (!effectiveBranchId) {
    throw new Error('Branch ID is required to create a delivery zone.');
  }

  const newZone: DeliveryZone = {
    ...zoneData,
    branchId: effectiveBranchId,
    id: newRef.id,
    createdAt: new Date().toISOString()
  };
  await setDoc(newRef, newZone);
  return newRef.id;
}

export async function updateDeliveryZone(zoneId: string, updates: Partial<DeliveryZone>): Promise<void> {
  await setDoc(doc(db, COLLECTIONS.DELIVERY_ZONES, zoneId), updates, { merge: true });
}

export async function deleteDeliveryZone(zoneId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.DELIVERY_ZONES, zoneId));
}

// Delivery Notifications (Internal Operational Event Log - Server Authoritative)
export async function sendDeliveryNotification(
  notifData: Omit<DeliveryNotification, 'id' | 'createdAt' | 'read'>
): Promise<void> {
  try {
    const token = await getAuthToken();
    await fetch('/api/deliveries/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(notifData)
    });
  } catch (err) {
    console.warn('[sendDeliveryNotification] Non-blocking notice:', err);
  }
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
  const totalVolume = deliveries.reduce((sum, d) => sum + (d.totalAmount || 0), 0);

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
    const totalFeesEarned = drvCompleted.reduce((sum, d) => sum + ((d.deliveryFee || 0) * 0.7), 0); // 70% to driver
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
