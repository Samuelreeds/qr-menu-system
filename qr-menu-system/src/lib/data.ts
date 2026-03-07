export interface MenuItem {
  id: string;
  name: string;
  price: number;
  rating: number;
  time: string;
  image: string;
  category: string;
}

export const MENU_ITEMS: MenuItem[] = [
  // --- SALADS ---
  {
    id: '1',
    name: 'Avocado Salad',
    price: 12.00,
    rating: 4.5,
    time: '20min',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=500&q=80',
    category: 'Salads'
  },
  {
    id: '2',
    name: 'Fruits Salad',
    price: 11.00,
    rating: 4.5,
    time: '15min',
    image: 'https://images.unsplash.com/photo-1519996529931-28324d1a6305?auto=format&fit=crop&w=500&q=80',
    category: 'Salads'
  },
  {
    id: '3',
    name: 'Greek Salad',
    price: 13.50,
    rating: 4.7,
    time: '25min',
    image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=500&q=80',
    category: 'Salads'
  },

  // --- BURGERS ---
  {
    id: '4',
    name: 'Cheeseburger',
    price: 14.00,
    rating: 4.8,
    time: '20min',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=80',
    category: 'Burgers'
  },
  {
    id: '5',
    name: 'Chicken Burger',
    price: 12.50,
    rating: 4.6,
    time: '25min',
    image: 'https://images.unsplash.com/photo-1615297348774-61d090d5ce20?auto=format&fit=crop&w=500&q=80',
    category: 'Burgers'
  },
  {
    id: '6',
    name: 'Veggie Burger',
    price: 11.00,
    rating: 4.4,
    time: '18min',
    image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=500&q=80',
    category: 'Burgers'
  },

  // --- HOT SALE ---
  {
    id: '7',
    name: 'Spicy Pasta',
    price: 16.00,
    rating: 4.9,
    time: '30min',
    image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=500&q=80',
    category: 'Hot sale'
  },
  {
    id: '8',
    name: 'Grilled Salmon',
    price: 22.00,
    rating: 4.8,
    time: '40min',
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a7270028d?auto=format&fit=crop&w=500&q=80',
    category: 'Hot sale'
  },
  {
    id: '9',
    name: 'Steak Frites',
    price: 28.00,
    rating: 4.9,
    time: '45min',
    image: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=500&q=80',
    category: 'Hot sale'
  },

  // --- POPULARITY ---
  {
    id: '10',
    name: 'Margherita Pizza',
    price: 15.00,
    rating: 4.7,
    time: '25min',
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=500&q=80',
    category: 'Popularity'
  },
  {
    id: '11',
    name: 'Sushi Platter',
    price: 24.00,
    rating: 4.8,
    time: '35min',
    image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=500&q=80',
    category: 'Popularity'
  },
  {
    id: '12',
    name: 'Caesar Salad',
    price: 10.50,
    rating: 4.5,
    time: '15min',
    image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=500&q=80',
    category: 'Popularity'
  }
];