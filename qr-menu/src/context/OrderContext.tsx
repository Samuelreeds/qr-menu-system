"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────
export type OrderType = "table" | "takeaway" | "delivery";
export type OrderStatus = "pending" | "cooking" | "ready" | "paid";

export interface ProductCustomization {
  mood: "hot" | "cold";
  size: "S" | "M" | "L";
  sugar: "30%" | "50%" | "70%";
  ice: "30%" | "50%" | "70%";
}

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  qty: number;
  img: string;
  customization: ProductCustomization;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  orderType: OrderType;
  tableNumber?: string;
  deliveryAgent?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  promoCode: string;
  tax: number;
  total: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
  paidAt?: Date;
  paymentMethod?: string;
  amountPaid?: number;
  change?: number;
  assignedStaff?: string;
}

interface CurrentOrderDraft {
  orderType: OrderType | null;
  tableNumber: string;
  deliveryAgent: string;
  items: OrderItem[];
  discount: number;
  discountType: "percent" | "fixed";
  promoCode: string;
}

interface OrderContextValue {
  // Current customer draft
  draft: CurrentOrderDraft;
  setOrderType: (type: OrderType) => void;
  setTableNumber: (num: string) => void;
  setDeliveryAgent: (agent: string) => void;
  setDiscount: (amount: number, type: "percent" | "fixed") => void;
  setPromoCode: (code: string) => void;
  addItem: (item: Omit<OrderItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearDraft: () => void;

  // Submitted orders
  orders: Order[];
  submitOrder: () => Order | null;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  recordPayment: (orderId: string, paymentMethod: string, amountPaid: number) => void;
  getOrdersByStatus: (status: OrderStatus) => Order[];
  assignStaff: (orderId: string, staffName: string) => void;

  // Last submitted order id for success screen tracker
  lastSubmittedOrderId: string | null;
}

// ─── Context ─────────────────────────────────────────────
const OrderContext = createContext<OrderContextValue | null>(null);

const TAX_RATE = 0.1;

function calcTotals(items: OrderItem[], discount: number, discountType: "percent" | "fixed") {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const discountAmount =
    discountType === "percent"
      ? (subtotal * discount) / 100
      : Math.min(discount, subtotal);
  const afterDiscount = subtotal - discountAmount;
  const tax = afterDiscount * TAX_RATE;
  return { subtotal, discount: discountAmount, tax, total: afterDiscount + tax };
}

let orderCounter = 1;

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<CurrentOrderDraft>({
    orderType: null,
    tableNumber: "",
    deliveryAgent: "",
    items: [],
    discount: 0,
    discountType: "percent",
    promoCode: "",
  });

  const [orders, setOrders] = useState<Order[]>([]);
  const [lastSubmittedOrderId, setLastSubmittedOrderId] = useState<string | null>(null);

  const setOrderType = useCallback((type: OrderType) => {
    setDraft((d) => ({ ...d, orderType: type }));
  }, []);

  const setTableNumber = useCallback((num: string) => {
    setDraft((d) => ({ ...d, tableNumber: num }));
  }, []);

  const setDeliveryAgent = useCallback((agent: string) => {
    setDraft((d) => ({ ...d, deliveryAgent: agent }));
  }, []);

  const setDiscount = useCallback((amount: number, type: "percent" | "fixed") => {
    setDraft((d) => ({ ...d, discount: amount, discountType: type }));
  }, []);

  const setPromoCode = useCallback((code: string) => {
    setDraft((d) => ({ ...d, promoCode: code }));
  }, []);

  const addItem = useCallback((item: Omit<OrderItem, "id">) => {
    setDraft((d) => {
      const existing = d.items.find(
        (i) =>
          i.productId === item.productId &&
          i.customization.mood === item.customization.mood &&
          i.customization.size === item.customization.size &&
          i.customization.sugar === item.customization.sugar &&
          i.customization.ice === item.customization.ice
      );
      if (existing) {
        return {
          ...d,
          items: d.items.map((i) =>
            i.id === existing.id ? { ...i, qty: i.qty + item.qty } : i
          ),
        };
      }
      return {
        ...d,
        items: [
          ...d.items,
          { ...item, id: `item-${Date.now()}-${Math.random()}` },
        ],
      };
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setDraft((d) => ({ ...d, items: d.items.filter((i) => i.id !== id) }));
  }, []);

  const updateQty = useCallback((id: string, qty: number) => {
    setDraft((d) => ({
      ...d,
      items:
        qty <= 0
          ? d.items.filter((i) => i.id !== id)
          : d.items.map((i) => (i.id === id ? { ...i, qty } : i)),
    }));
  }, []);

  const clearDraft = useCallback(() => {
    setDraft({ orderType: null, tableNumber: "", deliveryAgent: "", items: [], discount: 0, discountType: "percent", promoCode: "" });
  }, []);

  const submitOrder = useCallback((): Order | null => {
    if (!draft.orderType || draft.items.length === 0) return null;
    const { subtotal, discount, tax, total } = calcTotals(draft.items, draft.discount, draft.discountType);
    const now = new Date();
    const newOrder: Order = {
      id: `order-${Date.now()}`,
      orderNumber: `#${String(orderCounter++).padStart(3, "0")}`,
      orderType: draft.orderType,
      tableNumber: draft.tableNumber || undefined,
      deliveryAgent: draft.deliveryAgent || undefined,
      items: [...draft.items],
      subtotal,
      discount,
      promoCode: draft.promoCode,
      tax,
      total,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };
    setOrders((prev) => [...prev, newOrder]);
    setLastSubmittedOrderId(newOrder.id);
    setDraft({ orderType: null, tableNumber: "", deliveryAgent: "", items: [], discount: 0, discountType: "percent", promoCode: "" });
    return newOrder;
  }, [draft]);

  const updateOrderStatus = useCallback(
    (orderId: string, status: OrderStatus) => {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status, updatedAt: new Date() } : o
        )
      );
    },
    []
  );

  const recordPayment = useCallback(
    (orderId: string, paymentMethod: string, amountPaid: number) => {
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== orderId) return o;
          const change = paymentMethod === "cash" ? Math.max(0, amountPaid - o.total) : 0;
          return {
            ...o,
            status: "paid" as OrderStatus,
            paymentMethod,
            amountPaid,
            change,
            paidAt: new Date(),
            updatedAt: new Date(),
          };
        })
      );
    },
    []
  );

  const assignStaff = useCallback((orderId: string, staffName: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, assignedStaff: staffName, updatedAt: new Date() } : o
      )
    );
  }, []);

  const getOrdersByStatus = useCallback(
    (status: OrderStatus) => orders.filter((o) => o.status === status),
    [orders]
  );

  return (
    <OrderContext.Provider
      value={{
        draft,
        setOrderType,
        setTableNumber,
        setDeliveryAgent,
        setDiscount,
        setPromoCode,
        addItem,
        removeItem,
        updateQty,
        clearDraft,
        orders,
        submitOrder,
        updateOrderStatus,
        recordPayment,
        getOrdersByStatus,
        assignStaff,
        lastSubmittedOrderId,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrder() {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error("useOrder must be used within OrderProvider");
  return ctx;
}
