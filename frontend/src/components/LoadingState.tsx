'use client';

import { useState, useEffect, useRef } from 'react';
import { Box, Typography, CircularProgress, Fade } from '@mui/material';

interface LoadingStateProps {
  messages: string[];
  stepMessages?: string[];
}

export default function LoadingState({
  messages,
  stepMessages = [],
}: LoadingStateProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [frontendFadeIn, setFrontendFadeIn] = useState(true);
  const [backendFadeIn, setBackendFadeIn] = useState(true);

  // New states for the staggered queue
  const [displayedMessage, setDisplayedMessage] = useState<string | null>(null);
  const [messageQueue, setMessageQueue] = useState<string[]>([]);
  const isDisplayingRef = useRef(false);

  // 1. Add new incoming messages to the queue
  useEffect(() => {
    if (stepMessages.length > 0) {
      const lastMessage = stepMessages[stepMessages.length - 1];
      setMessageQueue((prev) => {
        // Prevent adding the same message if it somehow duplicates
        if (prev.length > 0 && prev[prev.length - 1] === lastMessage)
          return prev;
        return [...prev, lastMessage];
      });
    }
  }, [stepMessages.length]); // We only care about the length change to pick up new ones

  // 2. Process the queue
  useEffect(() => {
    if (messageQueue.length > 0 && !isDisplayingRef.current) {
      const processNextMessage = () => {
        if (messageQueue.length === 0) {
          isDisplayingRef.current = false;
          return;
        }

        isDisplayingRef.current = true;
        const nextMsg = messageQueue[0];

        // Remove the message we're about to show from the queue
        setMessageQueue((prev) => prev.slice(1));

        // Fade out previous
        setBackendFadeIn(false);

        setTimeout(() => {
          setDisplayedMessage(nextMsg);
          setBackendFadeIn(true);

          // Keep it visible for at least 2.5 seconds
          setTimeout(() => {
            isDisplayingRef.current = false;
          }, 2500);
        }, 300);
      };

      processNextMessage();
    }
  }, [messageQueue, displayedMessage]);

  // Rotate frontend messages every 7s
  useEffect(() => {
    const interval = setInterval(() => {
      setFrontendFadeIn(false);
      setTimeout(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
        setFrontendFadeIn(true);
      }, 500);
    }, 7000);
    return () => clearInterval(interval);
  }, [messages.length]);

  const hasBackendSteps = displayedMessage !== null;
  const frontendText = messages[currentMessageIndex];

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
        {displayedMessage && (
          <Fade in={backendFadeIn} timeout={300}>
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
                  mb: 1,
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
                {displayedMessage}
              </Typography>
            </Box>
          </Fade>
        )}
        <Fade in={frontendFadeIn} timeout={500}>
          <Typography
            variant='body1'
            sx={{
              textAlign: 'center',
              fontWeight: 400,
              px: 3,
              color: hasBackendSteps ? 'secondary.main' : 'text.primary',
              lineHeight: 1.6,
              fontStyle: 'italic',
            }}
          >
            {frontendText}
          </Typography>
        </Fade>
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
