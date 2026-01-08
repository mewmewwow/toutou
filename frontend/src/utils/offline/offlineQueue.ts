/**
 * Offline Queue Manager using IndexedDB
 * Stores API requests when offline and syncs when back online
 */

const DB_NAME = 'offline-queue';
const DB_VERSION = 1;

export interface QueuedRequest {
  id?: number;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: any;
  timestamp: number;
  retryCount: number;
}

export class OfflineQueue {
  private db: IDBDatabase | null = null;

  /**
   * Initialize the offline queue database
   */
  async init(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;

        // Learning sessions store
        if (!db.objectStoreNames.contains('learning-sessions')) {
          const store = db.createObjectStore('learning-sessions', {
            keyPath: 'id',
            autoIncrement: true,
          });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Review submissions store
        if (!db.objectStoreNames.contains('review-submissions')) {
          const store = db.createObjectStore('review-submissions', {
            keyPath: 'id',
            autoIncrement: true,
          });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Test submissions store
        if (!db.objectStoreNames.contains('test-submissions')) {
          const store = db.createObjectStore('test-submissions', {
            keyPath: 'id',
            autoIncrement: true,
          });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Generic API requests store
        if (!db.objectStoreNames.contains('api-requests')) {
          const store = db.createObjectStore('api-requests', {
            keyPath: 'id',
            autoIncrement: true,
          });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  /**
   * Add a request to the offline queue
   */
  async addRequest(
    storeName: string,
    request: Omit<QueuedRequest, 'id'>,
  ): Promise<number> {
    await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const addRequest = store.add(request);

      addRequest.onsuccess = () => resolve(addRequest.result as number);
      addRequest.onerror = () => reject(addRequest.error);
    });
  }

  /**
   * Get all queued requests from a store
   */
  async getAllRequests(storeName: string): Promise<QueuedRequest[]> {
    await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    });
  }

  /**
   * Remove a request from the queue
   */
  async removeRequest(storeName: string, id: number): Promise<void> {
    await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const deleteRequest = store.delete(id);

      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    });
  }

  /**
   * Update retry count for a request
   */
  async incrementRetryCount(storeName: string, id: number): Promise<void> {
    await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const request = getRequest.result;
        if (request) {
          request.retryCount++;
          const putRequest = store.put(request);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          reject(new Error('Request not found'));
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  /**
   * Clear all requests from a store
   */
  async clearStore(storeName: string): Promise<void> {
    await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const clearRequest = store.clear();

      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    });
  }

  /**
   * Get count of pending requests
   */
  async getCount(storeName: string): Promise<number> {
    await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const countRequest = store.count();

      countRequest.onsuccess = () => resolve(countRequest.result);
      countRequest.onerror = () => reject(countRequest.error);
    });
  }

  /**
   * Process all queued requests when back online
   */
  async processQueue(
    storeName: string,
    processor: (request: QueuedRequest) => Promise<boolean>,
  ): Promise<{ processed: number; failed: number }> {
    const requests = await this.getAllRequests(storeName);
    let processed = 0;
    let failed = 0;

    for (const request of requests) {
      try {
        const success = await processor(request);
        if (success) {
          await this.removeRequest(storeName, request.id!);
          processed++;
        } else {
          await this.incrementRetryCount(storeName, request.id!);
          failed++;
        }
      } catch (error) {
        console.error(`Failed to process request ${request.id}:`, error);
        await this.incrementRetryCount(storeName, request.id!);
        failed++;
      }
    }

    return { processed, failed };
  }

  /**
   * Clean up old requests (older than 7 days)
   */
  async cleanupOldRequests(storeName: string, maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): Promise<number> {
    await this.init();

    const cutoffTime = Date.now() - maxAgeMs;
    const requests = await this.getAllRequests(storeName);
    let removed = 0;

    for (const request of requests) {
      if (request.timestamp < cutoffTime) {
        await this.removeRequest(storeName, request.id!);
        removed++;
      }
    }

    return removed;
  }
}

// Singleton instance
export const offlineQueue = new OfflineQueue();

/**
 * Helper function to queue a learning session
 */
export async function queueLearningSession(data: any): Promise<number> {
  return offlineQueue.addRequest('learning-sessions', {
    url: '/api/learning/sessions',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: data,
    timestamp: Date.now(),
    retryCount: 0,
  });
}

/**
 * Helper function to queue a review submission
 */
export async function queueReviewSubmission(data: any): Promise<number> {
  return offlineQueue.addRequest('review-submissions', {
    url: '/api/reviews/submit',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: data,
    timestamp: Date.now(),
    retryCount: 0,
  });
}

/**
 * Helper function to queue a test submission
 */
export async function queueTestSubmission(data: any): Promise<number> {
  return offlineQueue.addRequest('test-submissions', {
    url: '/api/tests/submit',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: data,
    timestamp: Date.now(),
    retryCount: 0,
  });
}

/**
 * Check if online and process queue
 */
export async function syncAllQueues(): Promise<void> {
  if (!navigator.onLine) {
    console.log('Offline - skipping queue sync');
    return;
  }

  console.log('Processing offline queues...');

  const stores = ['learning-sessions', 'review-submissions', 'test-submissions', 'api-requests'];

  for (const store of stores) {
    const result = await offlineQueue.processQueue(store, async (request) => {
      try {
        const response = await fetch(request.url, {
          method: request.method,
          headers: request.headers,
          body: JSON.stringify(request.body),
        });
        return response.ok;
      } catch {
        return false;
      }
    });

    console.log(`${store}: processed ${result.processed}, failed ${result.failed}`);
  }
}

// Auto-sync when coming back online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Back online - syncing queued requests');
    syncAllQueues().catch(console.error);
  });
}
