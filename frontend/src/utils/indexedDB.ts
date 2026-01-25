/**
 * IndexedDB utilities to replace localStorage
 * Provides a more robust storage solution with better capacity limits
 */

const DB_NAME = 'RoutinesAppDB';
const DB_VERSION = 1;
const STORE_NAME = 'appData';

interface DBData {
  key: string;
  value: any;
  timestamp: number;
}

class IndexedDBManager {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  private async initDB(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  private async ensureDB(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.initDB();
    }
    await this.initPromise;
  }

  async setItem(key: string, value: any): Promise<void> {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const data: DBData = {
        key,
        value,
        timestamp: Date.now(),
      };

      const request = store.put(data);

      request.onsuccess = () => {
        // Dispatch custom event to notify listeners
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('indexeddb-change', {
              detail: { key, value },
            }),
          );
        }
        resolve();
      };
      request.onerror = () => {
        console.error(`Failed to set item ${key}:`, request.error);
        reject(request.error);
      };
    });
  }

  async getItem(key: string): Promise<any> {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : null);
      };

      request.onerror = () => {
        console.error(`Failed to get item ${key}:`, request.error);
        reject(request.error);
      };
    });
  }

  async removeItem(key: string): Promise<void> {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error(`Failed to remove item ${key}:`, request.error);
        reject(request.error);
      };
    });
  }

  async clear(): Promise<void> {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error('Failed to clear store:', request.error);
        reject(request.error);
      };
    });
  }

  async getAllKeys(): Promise<string[]> {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAllKeys();

      request.onsuccess = () => {
        resolve(request.result as string[]);
      };

      request.onerror = () => {
        console.error('Failed to get all keys:', request.error);
        reject(request.error);
      };
    });
  }

  async getAllItems(): Promise<Record<string, any>> {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const result: Record<string, any> = {};
        request.result.forEach((item: DBData) => {
          result[item.key] = item.value;
        });
        resolve(result);
      };

      request.onerror = () => {
        console.error('Failed to get all items:', request.error);
        reject(request.error);
      };
    });
  }
}

// Create singleton instance
const indexedDBManager = new IndexedDBManager();

// Export convenience functions that match localStorage API
export const setItem = (key: string, value: any): Promise<void> =>
  indexedDBManager.setItem(key, value);

export const getItem = (key: string): Promise<any> =>
  indexedDBManager.getItem(key);

export const removeItem = (key: string): Promise<void> =>
  indexedDBManager.removeItem(key);

export const clear = (): Promise<void> => indexedDBManager.clear();

export const getAllKeys = (): Promise<string[]> =>
  indexedDBManager.getAllKeys();

export const getAllItems = (): Promise<Record<string, any>> =>
  indexedDBManager.getAllItems();

// Export the manager instance for advanced usage
export default indexedDBManager;
