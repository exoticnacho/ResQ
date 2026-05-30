import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  runTransaction,
  addDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { SEED_LISTINGS, FoodListing } from "./seedData";
import { User as FirebaseUser } from "firebase/auth";

export interface Order {
  id?: string;
  userId: string;
  listingId: string;
  quantity: number;
  totalPrice: number;
  status: "active" | "ready" | "completed" | "cancelled";
  createdAt: any;
  foodName: string;
  donorName: string;
  donorId?: string;
  isDelivery?: boolean;
  deliveryFee?: number;
  deliveryStatus?: "waiting_courier" | "en_route_pickup" | "picked_up" | "en_route_dropoff" | "delivered";
  courierId?: string;
  pickupDistance?: number;
  dropoffDistance?: number;
}

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  streak: number;
  lastRescueDate: string;
  totalSaved: number;
  totalCO2: number;
  tier: string;
  photoURL?: string;
}

export const LISTINGS_COLLECTION = "listings";
export const ORDERS_COLLECTION = "orders";
export const USERS_COLLECTION = "users";

export function subscribeToListings(callback: (listings: FoodListing[]) => void) {
  if (!db) {
    callback(SEED_LISTINGS);
    return () => {};
  }
  const now = Date.now();
  const q = query(
    collection(db, LISTINGS_COLLECTION),
    where("quantity", ">", 0)
  );
  return onSnapshot(q, (snapshot) => {
    const listings: FoodListing[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data() as Omit<FoodListing, "id">;
      // Filter out expired listings client-side (Firestore can't do two range queries)
      if ((data as any).expiresAt > Date.now()) {
        listings.push({ id: doc.id, ...data } as FoodListing);
      }
    });
    listings.sort((a, b) => a.expiresAt - b.expiresAt);
    callback(listings);
  });
}

export function subscribeToMyListings(donorId: string, callback: (listings: FoodListing[]) => void) {
  if (!db) { callback([]); return () => {}; }
  const q = query(
    collection(db, LISTINGS_COLLECTION),
    where("donorId", "==", donorId)
  );
  return onSnapshot(q, (snapshot) => {
    const listings: FoodListing[] = [];
    snapshot.forEach((doc) => {
      listings.push({ id: doc.id, ...doc.data() } as FoodListing);
    });
    listings.sort((a, b) => b.expiresAt - a.expiresAt);
    callback(listings);
  });
}

export async function addListing(listing: Omit<FoodListing, "id"> & { donorId?: string }) {
  const docRef = await addDoc(collection(db, LISTINGS_COLLECTION), listing);
  return docRef.id;
}

export async function placeOrder(
  userId: string, 
  listingId: string, 
  quantity: number, 
  totalPrice: number, 
  foodName: string, 
  donorName: string, 
  savedAmount: number, 
  co2Offset: number,
  isDelivery: boolean = false,
  deliveryFee: number = 0,
  pickupDistance: number = 0,
  dropoffDistance: number = 0
) {
  const listingRef = doc(db, LISTINGS_COLLECTION, listingId);
  const orderRef = doc(collection(db, ORDERS_COLLECTION));
  const userRef = doc(db, USERS_COLLECTION, userId);

  try {
    await runTransaction(db, async (transaction) => {
      // 1. All Reads First
      const listingDoc = await transaction.get(listingRef);
      if (!listingDoc.exists()) {
        throw new Error("Listing tidak ditemukan!");
      }
      
      const userDoc = await transaction.get(userRef);
      
      // 2. Calculations
      const currentQuantity = listingDoc.data().quantity;
      const newQuantity = currentQuantity - quantity;
      
      if (newQuantity < 0) {
        throw new Error("Maaf, stok tidak mencukupi!");
      }

      // 3. All Writes Next
      transaction.update(listingRef, { quantity: newQuantity });
      
      const orderData: Order = {
        userId,
        listingId,
        quantity,
        totalPrice,
        status: "active",
        createdAt: serverTimestamp(),
        foodName,
        donorName,
        donorId: listingDoc.data().donorId || "",
        isDelivery,
        deliveryFee,
        pickupDistance,
        dropoffDistance,
        ...(isDelivery && { deliveryStatus: "waiting_courier" })
      };
      
      transaction.set(orderRef, orderData);

      // Update user stats
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const newTotalSaved = (userData.totalSaved || 0) + savedAmount;
        const newTotalCO2 = (userData.totalCO2 || 0) + co2Offset;
        transaction.update(userRef, {
          totalSaved: newTotalSaved,
          totalCO2: parseFloat(newTotalCO2.toFixed(1))
        });
      }
    });
    return orderRef.id;
  } catch (error) {
    console.error("Transaction failed: ", error);
    throw error;
  }
}

export function subscribeToUserOrders(userId: string, callback: (orders: Order[]) => void) {
  const q = query(
    collection(db, ORDERS_COLLECTION),
    where("userId", "==", userId)
  );
  
  return onSnapshot(q, (snapshot) => {
    const orders: Order[] = [];
    snapshot.forEach((doc) => {
      orders.push({ id: doc.id, ...doc.data() } as Order);
    });
    
    orders.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return timeB - timeA;
    });
    
    callback(orders);
  });
}

// ==========================================
// COURIER (KURIR) FUNCTIONS
// ==========================================

export function subscribeToAvailableDeliveries(callback: (orders: Order[]) => void) {
  if (!db) { callback([]); return () => {}; }
  const q = query(
    collection(db, ORDERS_COLLECTION),
    where("isDelivery", "==", true),
    where("deliveryStatus", "==", "waiting_courier")
  );
  return onSnapshot(q, (snapshot) => {
    const orders: Order[] = [];
    snapshot.forEach((doc) => {
      orders.push({ id: doc.id, ...doc.data() } as Order);
    });
    // Sort logic
    orders.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return timeB - timeA;
    });
    callback(orders);
  });
}

export function subscribeToMyDeliveries(courierId: string, callback: (orders: Order[]) => void) {
  if (!db) { callback([]); return () => {}; }
  const q = query(
    collection(db, ORDERS_COLLECTION),
    where("courierId", "==", courierId),
    where("status", "==", "active")
  );
  return onSnapshot(q, (snapshot) => {
    const orders: Order[] = [];
    snapshot.forEach((doc) => {
      orders.push({ id: doc.id, ...doc.data() } as Order);
    });
    callback(orders);
  });
}

export async function updateDeliveryStatus(
  orderId: string, 
  newDeliveryStatus: "waiting_courier" | "en_route_pickup" | "picked_up" | "en_route_dropoff" | "delivered",
  courierId?: string
) {
  const orderRef = doc(db, ORDERS_COLLECTION, orderId);
  const updates: any = { deliveryStatus: newDeliveryStatus };
  
  if (courierId) {
    updates.courierId = courierId;
  }
  
  if (newDeliveryStatus === "delivered") {
    updates.status = "completed";
  }
  
  await updateDoc(orderRef, updates);
}

export async function seedDatabase() {
  if (!db) return;
  const q = query(collection(db, LISTINGS_COLLECTION));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    console.log("Database empty. Seeding...");
    for (const listing of SEED_LISTINGS) {
      await setDoc(doc(db, LISTINGS_COLLECTION, listing.id), listing);
    }
    console.log("Seeding complete!");
  } else {
    console.log("Database already has data. Skipping seed.");
  }
}

// ==========================================
// USER & LEADERBOARD FUNCTIONS
// ==========================================

export async function syncUserToFirestore(user: FirebaseUser, displayName?: string) {
  if (!db) return;
  const userRef = doc(db, USERS_COLLECTION, user.uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    // Create new user profile
    await setDoc(userRef, {
      name: displayName || user.displayName || "Rescuer",
      email: user.email || "",
      photoURL: user.photoURL || "",
      streak: 0,
      lastRescueDate: "",
      totalSaved: 0,
      totalCO2: 0,
      tier: "Newbie"
    });
  }
}

export function subscribeToUserStats(userId: string, callback: (stats: UserProfile | null) => void) {
  if (!db) { callback(null); return () => {}; }
  const userRef = doc(db, USERS_COLLECTION, userId);
  return onSnapshot(userRef, (docSnap) => {
    if (docSnap.exists()) {
      callback({ id: docSnap.id, ...docSnap.data() } as UserProfile);
    } else {
      callback(null);
    }
  });
}

export async function updateUserStreak(userId: string, streak: number, lastRescueDate: string, tier: string) {
  if (!db) return;
  const userRef = doc(db, USERS_COLLECTION, userId);
  await setDoc(userRef, { streak, lastRescueDate, tier }, { merge: true });
}

export function subscribeToLeaderboard(callback: (users: UserProfile[]) => void) {
  if (!db) { callback([]); return () => {}; }
  // Order by totalSaved descending
  const q = query(collection(db, USERS_COLLECTION), orderBy("totalSaved", "desc"), limit(50));
  return onSnapshot(q, (snapshot) => {
    const users: UserProfile[] = [];
    snapshot.forEach((docSnap) => {
      users.push({ id: docSnap.id, ...docSnap.data() } as UserProfile);
    });
    callback(users);
  });
}

export function subscribeToDonorOrders(donorId: string, callback: (orders: Order[]) => void) {
  if (!db) { callback([]); return () => {}; }
  const q = query(
    collection(db, ORDERS_COLLECTION),
    where("donorId", "==", donorId)
  );
  return onSnapshot(q, (snapshot) => {
    const orders: Order[] = [];
    snapshot.forEach((doc) => {
      orders.push({ id: doc.id, ...doc.data() } as Order);
    });
    orders.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return timeB - timeA;
    });
    callback(orders);
  });
}

export async function updateOrderStatus(orderId: string, status: "active" | "ready" | "completed" | "cancelled") {
  if (!db) return;
  const orderRef = doc(db, ORDERS_COLLECTION, orderId);
  await setDoc(orderRef, { status }, { merge: true });
}

export async function updateListing(listingId: string, updates: Partial<Omit<FoodListing, "id">>) {
  if (!db) return;
  const docRef = doc(db, LISTINGS_COLLECTION, listingId);
  await updateDoc(docRef, updates);
}

export async function deleteListing(listingId: string) {
  if (!db) return;
  const docRef = doc(db, LISTINGS_COLLECTION, listingId);
  await updateDoc(docRef, { quantity: 0 }); // Soft delete to immediately filter out for active subscriptions
}


