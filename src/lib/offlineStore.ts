// src/lib/offlineStore.ts

export interface OfflineOrder {
  id: string; // Temporary offline ID
  payload: any; // The exact payload expected by createPosOrder
  status: 'pending' | 'synced';
  createdAt: number;
}

const DB_NAME = 'ScandineOfflinePOS';
const STORE_NAME = 'pending_orders';

// Initialize and get the database
function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Save an order locally before attempting to send to server
export async function saveOfflineOrder(order: OfflineOrder): Promise<boolean> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.put(order);
    
    transaction.oncomplete = () => resolve(true);
    transaction.onerror = () => reject(transaction.error);
  });
}

// Fetch all orders that haven't been synced yet
export async function getPendingOrders(): Promise<OfflineOrder[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    
    request.onsuccess = () => {
      const allOrders = request.result as OfflineOrder[];
      resolve(allOrders.filter(o => o.status === 'pending'));
    };
    request.onerror = () => reject(request.error);
  });
}

// Mark an order as synced (or you could delete it to save space)
export async function markOrderSynced(id: string): Promise<boolean> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    
    request.onsuccess = () => {
      const order = request.result as OfflineOrder;
      if (order) {
        order.status = 'synced';
        store.put(order); // Update the record
      }
      resolve(true);
    };
    request.onerror = () => reject(request.error);
  });
}