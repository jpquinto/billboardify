import { useState, useEffect } from "react";

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class ChartCache {
  private isClient = typeof window !== "undefined";

  set<T>(key: string, data: T, ttlHours: number = 2) {
    if (!this.isClient) return;

    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlHours * 60 * 60 * 1000, // Convert hours to milliseconds
    };
    localStorage.setItem(`chart_${key}`, JSON.stringify(item));
  }

  get<T>(key: string): T | null {
    if (!this.isClient) return null;

    const stored = localStorage.getItem(`chart_${key}`);
    if (!stored) return null;

    try {
      const item: CacheItem<T> = JSON.parse(stored);

      // Check if cache has expired
      if (Date.now() - item.timestamp > item.ttl) {
        localStorage.removeItem(`chart_${key}`);
        return null;
      }

      return item.data;
    } catch {
      // Invalid cache data, remove it
      localStorage.removeItem(`chart_${key}`);
      return null;
    }
  }

  clear(key?: string) {
    if (!this.isClient) return;

    if (key) {
      localStorage.removeItem(`chart_${key}`);
    } else {
      // Clear all chart cache
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith("chart_")) {
          localStorage.removeItem(k);
        }
      });
    }
  }
}

export const chartCache = new ChartCache();
