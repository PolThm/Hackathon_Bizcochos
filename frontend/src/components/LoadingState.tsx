'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Fade } from '@mui/material';

interface LoadingStateProps {
  messages: string[];
  stepMessages?: string[];
  hideFrontendMessages?: boolean;
}

export default function LoadingState({
  messages,
  stepMessages = [],
  hideFrontendMessages = false,
}: LoadingStateProps) {
  const [currentFrontendIndex, setCurrentFrontendIndex] = useState(0);
  const [frontendFadeIn, setFrontendFadeIn] = useState(true);
  const [backendFadeIn, setBackendFadeIn] = useState(true);
  const [rotationIndex, setRotationIndex] = useState(0);
  const [rotationQueue, setRotationQueue] = useState<string[]>([]);

  // 1. Sync the rotation queue with incoming stepMessages
  useEffect(() => {
    if (stepMessages.length > 0) {
      setRotationQueue(stepMessages);
    }
  }, [stepMessages]);

  // 2. Start a rotation timer that cycles through the rotationQueue every 3 seconds
  useEffect(() => {
    if (rotationQueue.length > 0) {
      const interval = setInterval(() => {
        setBackendFadeIn(false);
        setTimeout(() => {
          setRotationIndex((prev) => (prev + 1) % rotationQueue.length);
          setBackendFadeIn(true);
        }, 500);
      }, 3000); // Change AI thought every 3 seconds
      return () => clearInterval(interval);
    }
  }, [rotationQueue.length]);

  // 3. Rotate generic frontend messages every 7s (only when shown)
  useEffect(() => {
    if (hideFrontendMessages && rotationQueue.length > 0) return;
    const interval = setInterval(() => {
      setFrontendFadeIn(false);
      setTimeout(() => {
        setCurrentFrontendIndex((prev) => (prev + 1) % messages.length);
        setFrontendFadeIn(true);
      }, 500);
    }, 7000);
    return () => clearInterval(interval);
  }, [messages.length, hideFrontendMessages, rotationQueue.length]);

  const hasBackendSteps = rotationQueue.length > 0;
  const displayedBackendText = hasBackendSteps
    ? rotationQueue[rotationIndex]
    : null;
  const frontendText = messages[currentFrontendIndex];

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

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1,
        }}
      >
        {displayedBackendText && (
          <Fade in={backendFadeIn} timeout={500}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1.5,
              }}
            >
              <Typography
                variant='body1'
                sx={{
                  textAlign: 'center',
                  fontWeight: 400,
                  lineHeight: 1.6,
                  px: 3,
                  background: (theme) =>
                    `linear-gradient(90deg, ${theme.palette.text.primary} 0%, ${theme.palette.grey[500]} 25%, ${theme.palette.text.primary} 50%, ${theme.palette.grey[500]} 75%, ${theme.palette.text.primary} 100%)`,
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 2.5s ease-in-out infinite',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                  '@keyframes shimmer': {
                    '0%': { backgroundPosition: '100% 50%' },
                    '100%': { backgroundPosition: '0% 50%' },
                  },
                }}
              >
                {displayedBackendText}
              </Typography>
            </Box>
          </Fade>
        )}
        {(!hideFrontendMessages || !hasBackendSteps) && (
          <Fade in={frontendFadeIn} timeout={500}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography
                variant='body1'
                sx={{
                  textAlign: 'center',
                  fontWeight: 400,
                  px: 3,
                  color: 'secondary.main',
                  lineHeight: 1.6,
                  fontStyle: 'italic',
                }}
              >
                {frontendText}
              </Typography>
            </Box>
          </Fade>
        )}
      </Box>

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
