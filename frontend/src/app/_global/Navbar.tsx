'use client';

import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import { Menu, MenuItem } from '@mui/material';
import { useState } from 'react';
import { useConsecutiveDays } from '@/contexts/ConsecutiveDaysContext';

const VERSION = 'V0.1.51';

export default function Navbar() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { consecutiveDays, isDayValidated } = useConsecutiveDays();

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
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
            <MenuItem sx={{ pointerEvents: 'none' }}>{VERSION}</MenuItem>
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
