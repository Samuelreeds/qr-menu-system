"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export interface MenuCategory {
  id: string;
  label: string;
  emoji: string;
}

export interface SharedMenuItem {
  id: number;
  name: string;
  category: string;
  description: string;
  price: number;
  sizes: string[];
  moods: string[];
  available: boolean;
  image?: string; // base64 or object URL
}

interface MenuContextValue {
  categories: MenuCategory[];
  setCategories: React.Dispatch<React.SetStateAction<MenuCategory[]>>;
  menuItems: SharedMenuItem[];
  setMenuItems: React.Dispatch<React.SetStateAction<SharedMenuItem[]>>;
  storeLogo: string | null;
  setStoreLogo: React.Dispatch<React.SetStateAction<string | null>>;
}

const MenuContext = createContext<MenuContextValue | null>(null);

const DEFAULT_CATEGORIES: MenuCategory[] = [
  { id: "all", label: "All", emoji: "🍽️" },
  { id: "coffee", label: "Coffee", emoji: "☕" },
  { id: "juice", label: "Juice", emoji: "🧃" },
  { id: "milk", label: "Milk Based", emoji: "🥛" },
  { id: "snack", label: "Snack", emoji: "🥐" },
  { id: "rice", label: "Rice", emoji: "🍚" },
  { id: "dessert", label: "Dessert", emoji: "🍰" },
];

const DEFAULT_MENU_ITEMS: SharedMenuItem[] = [
  { id: 1, name: "Caramel Frappuccino", category: "coffee", description: "Caramel syrup with coffee, milk, and whipped cream", price: 3.95, sizes: ["M", "L"], moods: ["Iced", "Blended"], available: true, image: "https://images.unsplash.com/photo-1626026671299-ea003034beb5" },
  { id: 2, name: "Chocolate Frappuccino", category: "coffee", description: "Sweet chocolate with coffee, milk, and whipped cream", price: 4.51, sizes: ["M", "L"], moods: ["Iced", "Blended"], available: true, image: "https://img.rocket.new/generatedImages/rocket_gen_img_1def7204d-1773197611670.png" },
  { id: 3, name: "Peppermint Macchiato", category: "coffee", description: "Fresh peppermint mixed with choco and blended cream", price: 5.34, sizes: ["S", "M", "L"], moods: ["Hot", "Iced"], available: true, image: "https://img.rocket.new/generatedImages/rocket_gen_img_1a519d0d3-1773197608172.png" },
  { id: 4, name: "Coffee Latte Frappuccino", category: "coffee", description: "Special coffee, choco cream, and whipped cream", price: 4.79, sizes: ["M", "L"], moods: ["Iced", "Blended"], available: true, image: "https://img.rocket.new/generatedImages/rocket_gen_img_1e8bf7d73-1773197608311.png" },
  { id: 5, name: "Matcha Latte", category: "milk", description: "Premium Japanese matcha with steamed oat milk", price: 4.25, sizes: ["S", "M", "L"], moods: ["Hot", "Iced"], available: true, image: "https://img.rocket.new/generatedImages/rocket_gen_img_16c015007-1773197609370.png" },
  { id: 6, name: "Mango Tango Juice", category: "juice", description: "Fresh mango blended with tropical fruits and ice", price: 3.5, sizes: [], moods: ["Iced"], available: true, image: "https://images.unsplash.com/photo-1546173159-315724a31696" },
  { id: 7, name: "Butter Croissant", category: "snack", description: "Flaky French butter croissant, freshly baked daily", price: 2.75, sizes: [], moods: [], available: true, image: "https://img.rocket.new/generatedImages/rocket_gen_img_1a0f08120-1772413576166.png" },
  { id: 8, name: "Tiramisu Cake", category: "dessert", description: "Classic Italian tiramisu with espresso soaked layers", price: 5.99, sizes: [], moods: [], available: true, image: "https://img.rocket.new/generatedImages/rocket_gen_img_1d7fa7325-1772072802998.png" },
];

export function MenuProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<MenuCategory[]>(DEFAULT_CATEGORIES);
  const [menuItems, setMenuItems] = useState<SharedMenuItem[]>(DEFAULT_MENU_ITEMS);
  const [storeLogo, setStoreLogo] = useState<string | null>(null);

  return (
    <MenuContext.Provider value={{ categories, setCategories, menuItems, setMenuItems, storeLogo, setStoreLogo }}>
      {children}
    </MenuContext.Provider>
  );
}

export function useMenu() {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error("useMenu must be used within MenuProvider");
  return ctx;
}
