'use client';

import { useEffect, useRef, useState, useCallback, RefObject } from 'react';

/** Height in px from the top of the viewport: pull-to-refresh only starts if touch begins in this zone. */
const TOP_ZONE_HEIGHT_PX = 120;

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  enabled?: boolean;
  threshold?: number;
  resistance?: number;
  elementRef: RefObject<HTMLElement | null>;
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
  elementRef,
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

    const element = elementRef?.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (element.scrollTop > 0) return;
      if (e.touches.length !== 1) return;

      const touchY = e.touches[0].clientY;
      if (touchY > TOP_ZONE_HEIGHT_PX) return;

      startY.current = touchY;
      isDragging.current = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      if (element.scrollTop > 0) {
        isDragging.current = false;
        setState((prev) => ({ ...prev, isPulling: false, pullDistance: 0 }));
        return;
      }

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

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, threshold, resistance, handleRefresh, elementRef]);

  return state;
}
