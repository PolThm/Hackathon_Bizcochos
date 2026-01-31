'use client';

import { useRef } from 'react';
import { Box } from '@mui/material';
import { PullToRefreshIndicator } from '@/components/PullToRefreshIndicator';
import { usePullToRefreshContext } from '@/contexts/PullToRefreshContext';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

const THRESHOLD = 80;

interface PullToRefreshWrapperProps {
  children: React.ReactNode;
}

export default function PullToRefreshWrapper({
  children,
}: PullToRefreshWrapperProps) {
  const mainRef = useRef<HTMLDivElement | null>(null);
  const { refreshHandler } = usePullToRefreshContext();

  const { isPulling, isRefreshing, pullDistance } = usePullToRefresh({
    onRefresh: async () => {
      if (refreshHandler) {
        await refreshHandler();
      } else {
        window.location.reload();
      }
    },
    enabled: true,
    threshold: THRESHOLD,
    elementRef: mainRef,
  });

  return (
    <Box
      ref={mainRef}
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        minHeight: 0,
        position: 'relative',
        '& > *': { p: 2, py: 3 },
      }}
    >
      <PullToRefreshIndicator
        isPulling={isPulling}
        isRefreshing={isRefreshing}
        pullDistance={pullDistance}
        threshold={THRESHOLD}
      />
      {children}
    </Box>
  );
}
