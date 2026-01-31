'use client';

import { Box, CircularProgress } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

interface PullToRefreshIndicatorProps {
  isPulling: boolean;
  isRefreshing: boolean;
  pullDistance: number;
  threshold: number;
}

export function PullToRefreshIndicator({
  isPulling,
  isRefreshing,
  pullDistance,
  threshold,
}: PullToRefreshIndicatorProps) {
  const progress = Math.min((pullDistance / threshold) * 100, 100);
  const shouldTrigger = pullDistance >= threshold;
  const isVisible = isPulling || isRefreshing;

  if (!isVisible && pullDistance === 0) return null;

  return (
    <Box
      sx={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 16,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.3s ease-out',
        transform: `translateY(${isRefreshing ? 0 : Math.max(0, pullDistance - 30)}px)`,
        opacity: isVisible ? Math.min(1, pullDistance / 40) : 0,
        pointerEvents: 'none',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '9999px',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          px: 2,
          py: 1.5,
          boxShadow: 2,
        }}
      >
        <Box
          sx={{
            position: 'relative',
            height: 32,
            width: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isRefreshing ? (
            <CircularProgress size={24} color='primary' />
          ) : (
            <>
              <KeyboardArrowDownIcon
                sx={{
                  height: 24,
                  width: 24,
                  color: 'primary.main',
                  transition: 'all 0.3s',
                  transform: shouldTrigger
                    ? 'rotate(180deg) scale(1.1)'
                    : 'scale(0.9)',
                  opacity: Math.min(1, pullDistance / 30),
                }}
              />
              {!shouldTrigger && pullDistance > 10 && (
                <Box
                  component='svg'
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    height: 32,
                    width: 32,
                    transform: 'rotate(-90deg)',
                    color: 'primary.main',
                    opacity: 0.3,
                  }}
                  viewBox='0 0 32 32'
                >
                  <circle
                    cx='16'
                    cy='16'
                    r='14'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeDasharray={2 * Math.PI * 14}
                    strokeDashoffset={2 * Math.PI * 14 * (1 - progress / 100)}
                    strokeLinecap='round'
                  />
                </Box>
              )}
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}
