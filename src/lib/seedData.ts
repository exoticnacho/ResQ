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

export const SEED_LISTINGS: FoodListing[] = [
  {
    id: "1",
    name: "Nasi Box Ayam Geprek",
    description: "Nasi putih + ayam geprek sambal matah. Sisa 3 porsi dari catering siang.",
    originalPrice: 35000,
    rescuePrice: 12000,
    quantity: 3,
    category: "Nasi",
    donorName: "Warung Bu Sari",
    donorAddress: "Jl. Sudirman No. 12, Jakarta",
    lat: -6.2088,
    lng: 106.8456,
    expiresAt: now + 2 * hour,
    imageUrl: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&q=80",
    isPickup: true,
    isDelivery: false,
  },
  {
    id: "2",
    name: "Paket Roti Bakery Assorted",
    description: "10 pcs roti berbagai rasa: coklat, keju, kacang. Fresh dari oven pagi.",
    originalPrice: 80000,
    rescuePrice: 25000,
    quantity: 5,
    category: "Roti & Pastry",
    donorName: "Happy Bakery",
    donorAddress: "Jl. Thamrin No. 5, Jakarta",
    lat: -6.1944,
    lng: 106.8229,
    expiresAt: now + 3 * hour,
    imageUrl: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&q=80",
    isPickup: true,
    isDelivery: true,
  },
  {
    id: "3",
    name: "Mie Goreng Special",
    description: "Mie goreng + telur + sayuran segar. Porsi besar, cocok untuk 1-2 orang.",
    originalPrice: 28000,
    rescuePrice: 10000,
    quantity: 2,
    category: "Mie & Pasta",
    donorName: "Kafe Santai",
    donorAddress: "Jl. Kemang Raya No. 8, Jakarta",
    lat: -6.2614,
    lng: 106.8133,
    expiresAt: now + 1.5 * hour,
    imageUrl: "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400&q=80",
    isPickup: true,
    isDelivery: true,
  },
  {
    id: "4",
    name: "Sushi Set Premium",
    description: "8 pcs sushi salmon + 4 pcs california roll. Kualitas restoran, harga rescue.",
    originalPrice: 120000,
    rescuePrice: 45000,
    quantity: 2,
    category: "Jepang",
    donorName: "Sakura Restaurant",
    donorAddress: "Jl. Gatot Subroto No. 22, Jakarta",
    lat: -6.2297,
    lng: 106.8126,
    expiresAt: now + 0.75 * hour,
    imageUrl: "https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=400&q=80",
    isPickup: true,
    isDelivery: false,
  },
  {
    id: "5",
    name: "Smoothie Bowl Tropical",
    description: "Smoothie mangga + granola + buah segar. Sehat dan mengenyangkan.",
    originalPrice: 55000,
    rescuePrice: 20000,
    quantity: 4,
    category: "Minuman & Snack",
    donorName: "Green Bowl Cafe",
    donorAddress: "Jl. Senopati No. 18, Jakarta",
    lat: -6.2421,
    lng: 106.8059,
    expiresAt: now + 2.5 * hour,
    imageUrl: "https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=400&q=80",
    isPickup: true,
    isDelivery: true,
  },
  {
    id: "6",
    name: "Ayam Bakar Bumbu Rujak",
    description: "½ ekor ayam bakar dengan bumbu rujak khas. Tersisa 4 porsi dari makan siang.",
    originalPrice: 45000,
    rescuePrice: 18000,
    quantity: 4,
    category: "Ayam & Daging",
    donorName: "RM Padang Minang",
    donorAddress: "Jl. Fatmawati No. 34, Jakarta",
    lat: -6.2891,
    lng: 106.7997,
    expiresAt: now + 4 * hour,
    imageUrl: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&q=80",
    isPickup: true,
    isDelivery: true,
  },
];

export const CATEGORIES = ["Semua", "Nasi", "Roti & Pastry", "Mie & Pasta", "Jepang", "Ayam & Daging", "Minuman & Snack"];
