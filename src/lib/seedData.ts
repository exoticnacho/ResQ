// Seed data for MVP testing — no Firebase needed
export interface FoodListing {
  id: string;
  name: string;
  description: string;
  originalPrice: number;
  rescuePrice: number;
  quantity: number;
  category: string;
  donorName: string;
  donorId?: string; // Firebase UID of the donor (merchant)
  donorAddress: string;
  lat: number;
  lng: number;
  expiresAt: number; // timestamp ms
  imageUrl: string;
  isPickup: boolean;
  isDelivery: boolean;
}

const now = Date.now();
const hour = 3600000;

export const SEED_LISTINGS: FoodListing[] = [];

export const CATEGORIES = ["Semua", "Nasi", "Roti & Pastry", "Mie & Pasta", "Jepang", "Ayam & Daging", "Minuman & Snack"];
