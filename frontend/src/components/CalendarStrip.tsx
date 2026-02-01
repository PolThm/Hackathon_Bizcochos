'use client';

import React from 'react';
import { Box, Typography, useTheme, alpha } from '@mui/material';
import { useLocale } from 'next-intl';

export default function CalendarStrip() {
  const theme = useTheme();
  const locale = useLocale();

  const today = new Date();
  const days = [];
  // Show a week view: -3 days before, today, +3 days after
  for (let i = -3; i <= 3; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }

  const isToday = (date: Date) => {
    const t = new Date();
    return (
      date.getDate() === t.getDate() &&
      date.getMonth() === t.getMonth() &&
      date.getFullYear() === t.getFullYear()
    );
  };

  const getDayName = (date: Date) => {
    try {
      return new Intl.DateTimeFormat(locale, { weekday: 'short' })
        .format(date)
        .replace('.', '');
    } catch (e) {
      return date.toDateString().split(' ')[0];
    }
  };

  const getDayNumber = (date: Date) => {
    return date.getDate();
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        mb: 2,
        gap: 1.5,
        overflowX: 'auto',
        pb: 1, // Padding for scrollbar/shadow
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' },
      }}
    >
      {days.map((date, index) => {
        const active = isToday(date);
        return (
          <Box
            key={index}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '48px',
              height: '72px',
              borderRadius: '16px',
              backgroundColor: active
                ? theme.palette.primary.main
                : alpha(theme.palette.background.paper, 0.5),
              color: active
                ? theme.palette.primary.contrastText
                : theme.palette.text.secondary,
              border: active
                ? 'none'
                : `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
              boxShadow: active
                ? `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`
                : 'none',
              flex: 1,
            }}
          >
            <Typography
              variant='caption'
              sx={{
                fontWeight: 600,
                textTransform: 'uppercase',
                opacity: active ? 0.9 : 0.6,
                fontSize: '0.7rem',
                mb: 0.5,
              }}
            >
              {getDayName(date)}
            </Typography>
            <Typography
              variant='h6'
              sx={{
                fontWeight: 700,
                fontSize: '1.25rem',
              }}
            >
              {getDayNumber(date)}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}
