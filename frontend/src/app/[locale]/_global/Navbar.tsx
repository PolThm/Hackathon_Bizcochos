'use client';

import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import { Menu, MenuItem, useTheme } from '@mui/material';
import { useEffect, useState } from 'react';
import { useConsecutiveDays } from '@/contexts/ConsecutiveDaysContext';
import { Link } from '@/i18n/routing';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useObjectStorage } from '@/hooks/useStorage';
import type { Routine } from '@/types';

export default function Navbar() {
  const pathname = usePathname();
  const { consecutiveDays, isDayValidated, isLoading } = useConsecutiveDays();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const t = useTranslations('common');
  const theme = useTheme();
  const [allRoutines] = useObjectStorage<Routine[]>('allRoutines', []);
  const hasRoutines = allRoutines.length > 0;

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Function to determine if a menu item corresponds to the current page
  const isCurrentPage = (href: string) => {
    if (href === '/') {
      // For the home page, check if we're on the root or just with the locale
      const isHome =
        pathname === '/' ||
        pathname === '' ||
        pathname === '/en' ||
        pathname === '/fr' ||
        pathname === '/es' ||
        pathname.match(/^\/[a-z]{2}$/); // Pattern for any 2-letter locale
      return isHome;
    }

    // For other pages, check if the pathname starts with the href
    // taking into account the locale
    const isCurrent =
      pathname.startsWith(href) ||
      pathname.match(new RegExp(`^/[a-z]{2}${href}$`)) ||
      pathname.match(new RegExp(`^/[a-z]{2}${href}/`));
    return isCurrent;
  };

  useEffect(() => handleMenuClose(), [pathname]);

  // Variable to simplify the styling logic
  const isMenuOpen = Boolean(anchorEl);

  // Helper function to create the style for a menu item
  const getMenuItemStyle = (href: string) => {
    const isCurrent = isCurrentPage(href) && isMenuOpen;
    return {
      backgroundColor: 'transparent',
      color: 'inherit',
      fontWeight: isCurrent ? '600' : 'normal',
      textDecoration: isCurrent ? 'underline' : 'none',
      textDecorationColor: isCurrent
        ? theme.palette.secondary.main
        : 'transparent',
      textDecorationThickness: isCurrent ? '3px' : '0px',
      textUnderlineOffset: isCurrent ? '4px' : '0px',
      '&:hover': {
        backgroundColor: theme.palette.action.hover,
      },
    };
  };

  return (
    <AppBar position='static'>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Box sx={{ flex: 1 }}>
          <IconButton
            size='large'
            edge='start'
            color='inherit'
            aria-label='menu'
            sx={{ mr: 2 }}
            onClick={handleMenuOpen}
          >
            <MenuIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            MenuListProps={{ 'aria-labelledby': 'basic-button' }}
          >
            <MenuItem component={Link} href='/' sx={getMenuItemStyle('/')}>
              {t('home')}
            </MenuItem>

            {hasRoutines && (
              <MenuItem
                component={Link}
                href='/practice'
                sx={getMenuItemStyle('/practice')}
              >
                {t('practice')}
              </MenuItem>
            )}
            {hasRoutines && (
              <MenuItem
                component={Link}
                href='/setup'
                sx={getMenuItemStyle('/setup')}
              >
                {t('edit')}
              </MenuItem>
            )}
            <MenuItem
              component={Link}
              href='/library'
              sx={getMenuItemStyle('/library')}
            >
              {t('library')}
            </MenuItem>
            <MenuItem
              component={Link}
              href='/new-routine'
              sx={getMenuItemStyle('/new-routine')}
            >
              {t('newRoutine')}
            </MenuItem>
            <MenuItem
              component={Link}
              href='/parameters'
              sx={getMenuItemStyle('/parameters')}
            >
              {t('parameters')}
            </MenuItem>
          </Menu>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography
            variant='h1'
            sx={{ fontSize: '1.2rem !important', textAlign: 'center' }}
          >
            ROUTINES
          </Typography>
        </Box>
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
          }}
        >
          <Box
            sx={{
              backgroundColor: isDayValidated
                ? 'secondary.main'
                : 'background.paper',
              borderRadius: '4px',
              minWidth: '32px',
              minHeight: '32px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Typography
              sx={{
                color: isDayValidated ? 'primary.main' : 'action.disabled',
                fontWeight: 'bold',
                visibility: isLoading ? 'hidden' : 'visible',
              }}
            >
              {consecutiveDays}
            </Typography>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
