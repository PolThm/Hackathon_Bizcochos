'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Fade } from '@mui/material';

interface LoadingStateProps {
  messages: string[];
}

export default function LoadingState({ messages }: LoadingStateProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeIn(false);

      setTimeout(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
        setFadeIn(true);
      }, 500);
    }, 7000);

    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        gap: 4,
        py: 6,
      }}
    >
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress
          size={80}
          thickness={3}
          sx={{
            color: 'secondary.main',
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round',
            },
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              bgcolor: 'secondary.main',
              animation: 'pulse 2s ease-in-out infinite',
              '@keyframes pulse': {
                '0%, 100%': {
                  opacity: 0.4,
                  transform: 'scale(1)',
                },
                '50%': {
                  opacity: 1,
                  transform: 'scale(1.3)',
                },
              },
            }}
          />
        </Box>
      </Box>

      <Fade in={fadeIn} timeout={500}>
        <Box sx={{ minHeight: '60px', display: 'flex', alignItems: 'center' }}>
          <Typography
            variant='body1'
            sx={{
              textAlign: 'center',
              fontWeight: 400,
              px: 3,
              color: 'text.primary',
              lineHeight: 1.6,
            }}
          >
            {messages[currentMessageIndex]}
          </Typography>
        </Box>
      </Fade>

      <Box
        sx={{
          display: 'flex',
          gap: 1.5,
        }}
      >
        {[0, 1, 2].map((i) => (
          <Box
            key={i}
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              bgcolor: 'secondary.main',
              animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite`,
              '@keyframes bounce': {
                '0%, 80%, 100%': {
                  transform: 'scale(0.6)',
                  opacity: 0.3,
                },
                '40%': {
                  transform: 'scale(1)',
                  opacity: 1,
                },
              },
            }}
          />
        ))}
      </Box>
    </Box>
  );
}
