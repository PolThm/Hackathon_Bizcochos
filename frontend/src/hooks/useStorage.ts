/**
 * React hooks for IndexedDB operations
 * Provides convenient hooks for common storage operations
 */

import { useState, useEffect, useCallback } from 'react';
import { setItem, getItem, removeItem } from '../utils/indexedDB';

/**
 * Hook for managing a single storage value
 */
export function useStorage<T>(
  key: string,
  defaultValue: T,
  options: {
    serialize?: (value: T) => string;
    deserialize?: (value: string) => T;
  } = {},
): [T, (value: T) => Promise<void>, () => Promise<void>, boolean] {
  const [value, setValue] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);

  const { serialize = JSON.stringify, deserialize = JSON.parse } = options;

  // Load initial value
  useEffect(() => {
    const loadValue = async () => {
      try {
        const storedValue = await getItem(key);
        if (storedValue !== null) {
          try {
            const parsedValue =
              typeof storedValue === 'string'
                ? deserialize(storedValue)
                : storedValue;
            setValue(parsedValue);
          } catch {
            // If deserialization fails, use the raw value
            setValue(storedValue as T);
          }
        }
      } catch (error) {
        console.error(`Failed to load ${key}:`, error);
      } finally {
        setIsLoading(false);
      }
    };

    loadValue();
  }, [key, deserialize]);

  // Listen for IndexedDB changes
  useEffect(() => {
    const handleStorageChange = (event: CustomEvent) => {
      if (event.detail.key === key) {
        try {
          const parsedValue =
            typeof event.detail.value === 'string'
              ? deserialize(event.detail.value)
              : event.detail.value;
          setValue(parsedValue);
          setIsLoading(false);
        } catch {
          // If deserialization fails, use the raw value
          setValue(event.detail.value as T);
          setIsLoading(false);
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(
        'indexeddb-change',
        handleStorageChange as EventListener,
      );
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(
          'indexeddb-change',
          handleStorageChange as EventListener,
        );
      }
    };
  }, [key, deserialize]);

  // Update storage when value changes
  const updateValue = useCallback(
    async (newValue: T) => {
      try {
        const serializedValue =
          typeof newValue === 'string' ? newValue : serialize(newValue);
        await setItem(key, serializedValue);
        setValue(newValue);
      } catch (error) {
        console.error(`Failed to save ${key}:`, error);
      }
    },
    [key, serialize],
  );

  // Remove value from storage
  const removeValue = useCallback(async () => {
    try {
      await removeItem(key);
      setValue(defaultValue);
    } catch (error) {
      console.error(`Failed to remove ${key}:`, error);
    }
  }, [key, defaultValue]);

  return [value, updateValue, removeValue, isLoading];
}

/**
 * Hook for managing boolean storage values
 */
export function useBooleanStorage(
  key: string,
  defaultValue: boolean = false,
): [boolean, (value: boolean) => Promise<void>, () => Promise<void>, boolean] {
  return useStorage(key, defaultValue, {
    serialize: (value: boolean) => value.toString(),
    deserialize: (value: string) => value === 'true',
  });
}

/**
 * Hook for managing number storage values
 */
export function useNumberStorage(
  key: string,
  defaultValue: number = 0,
): [number, (value: number) => Promise<void>, () => Promise<void>, boolean] {
  return useStorage(key, defaultValue, {
    serialize: (value: number) => value.toString(),
    deserialize: (value: string) => parseFloat(value),
  });
}

/**
 * Hook for managing string storage values
 */
export function useStringStorage(
  key: string,
  defaultValue: string = '',
): [string, (value: string) => Promise<void>, () => Promise<void>, boolean] {
  return useStorage(key, defaultValue, {
    serialize: (value: string) => value,
    deserialize: (value: string) => value,
  });
}

/**
 * Hook for managing JSON object storage values
 */
export function useObjectStorage<T extends Record<string, any>>(
  key: string,
  defaultValue: T,
): [T, (value: T) => Promise<void>, () => Promise<void>, boolean] {
  return useStorage(key, defaultValue, {
    serialize: JSON.stringify,
    deserialize: JSON.parse,
  });
}
