'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

/** Height in px from the top of the viewport: pull-to-refresh only starts if touch begins in this zone (includes navbar). */
const TOP_ZONE_HEIGHT_PX = 120;

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  enabled?: boolean;
  threshold?: number;
  resistance?: number;
}

interface PullToRefreshState {
  isPulling: boolean;
  isRefreshing: boolean;
  pullDistance: number;
}

export function usePullToRefresh({
  onRefresh,
  enabled = true,
  threshold = 80,
  resistance = 2.5,
}: UsePullToRefreshOptions) {
  const [state, setState] = useState<PullToRefreshState>({
    isPulling: false,
    isRefreshing: false,
    pullDistance: 0,
  });

  const startY = useRef<number>(0);
  const isDragging = useRef<boolean>(false);
  const isRefreshingRef = useRef<boolean>(false);
  const pullDistanceRef = useRef<number>(0);

  isRefreshingRef.current = state.isRefreshing;
  pullDistanceRef.current = state.pullDistance;

  const handleRefresh = useCallback(async () => {
    if (isRefreshingRef.current) return;

    setState((prev) => ({ ...prev, isRefreshing: true }));

    try {
      await onRefresh();
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setTimeout(() => {
        setState((prev) => ({
          ...prev,
          isRefreshing: false,
          isPulling: false,
          pullDistance: 0,
        }));
      }, 300);
    }
  }, [onRefresh]);

  useEffect(() => {
    if (!enabled) return;
    if (typeof document === 'undefined') return;

    const target = document.body;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;

      const touchY = e.touches[0].clientY;
      if (touchY > TOP_ZONE_HEIGHT_PX) return;

      startY.current = touchY;
      isDragging.current = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;

      const currentY = e.touches[0].clientY;
      const deltaY = currentY - startY.current;

      if (deltaY > 0) {
        e.preventDefault();
        const distance = Math.min(deltaY / resistance, threshold * 1.5);
        setState((prev) => ({
          ...prev,
          isPulling: true,
          pullDistance: distance,
        }));
      } else {
        setState((prev) => ({ ...prev, isPulling: false, pullDistance: 0 }));
      }
    };

    const handleTouchEnd = () => {
      if (!isDragging.current) return;

      isDragging.current = false;

      if (pullDistanceRef.current >= threshold && !isRefreshingRef.current) {
        handleRefresh();
      } else {
        setState((prev) => ({
          ...prev,
          isPulling: false,
          pullDistance: 0,
        }));
      }
    };

    target.addEventListener('touchstart', handleTouchStart, { passive: true });
    target.addEventListener('touchmove', handleTouchMove, { passive: false });
    target.addEventListener('touchend', handleTouchEnd);

    return () => {
      target.removeEventListener('touchstart', handleTouchStart);
      target.removeEventListener('touchmove', handleTouchMove);
      target.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, threshold, resistance, handleRefresh]);

  return state;
}
