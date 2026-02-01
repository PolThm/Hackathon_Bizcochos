'use client';

import { useState, useEffect, useRef } from 'react';
import { Link } from '@/i18n/routing';
import {
  Box,
  Button,
  Typography,
  useTheme,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Chip,
  CircularProgress,
  Fade,
} from '@mui/material';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TimerIcon from '@mui/icons-material/Timer';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import TerminalIcon from '@mui/icons-material/Terminal';
import { setItem, getItem } from '@/utils/indexedDB';
import { API_BASE_URL } from '@/utils/config';
import type { Routine } from '@/types';

interface StreamLog {
  type: 'step' | 'data' | 'error';
  node?: string;
  description?: string;
  data?: Routine;
  message?: string;
}

export default function DailyRoutinePage() {
  const t = useTranslations('dailyRoutine');
  const tCommon = useTranslations('common');
  const theme = useTheme();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? 'en';

  const [routine, setRoutine] = useState<Routine | null>(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    const fetchDailyRoutineStream = async () => {
      const today = new Date().toISOString().split('T')[0];
      const saved = sessionStorage.getItem(`dailyRoutine_${today}`);

      if (saved) {
        setRoutine(JSON.parse(saved));
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/generateDailyRoutine`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ locale }),
          },
        );

        if (!response.body) throw new Error('No body');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const chunk: StreamLog = JSON.parse(line);
              if (chunk.type === 'step' && chunk.description) {
                setLogs((prev) => [...prev, chunk.description!]);
              } else if (chunk.type === 'data' && chunk.data) {
                setRoutine(chunk.data);
                // Delay a bit before showing final routine to let user read the last step
                setTimeout(() => {
                  setLoading(false);
                  sessionStorage.setItem(
                    `dailyRoutine_${today}`,
                    JSON.stringify(chunk.data),
                  );
                }, 1000);
              } else if (chunk.type === 'error') {
                console.error('Agent error:', chunk.message);
                setLogs((prev) => [...prev, `Error: ${chunk.message}`]);
              }
            } catch (e) {
              console.error('Failed to parse stream chunk:', e);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching daily routine stream:', error);
        setLoading(false);
      }
    };

    fetchDailyRoutineStream();
  }, [locale]);

  const handleStart = async () => {
    if (!routine) return;

    const existingRoutinesStr = await getItem('allRoutines');
    const existingRoutines: Routine[] = existingRoutinesStr
      ? JSON.parse(existingRoutinesStr)
      : [];

    if (!existingRoutines.some((r) => r.id === routine.id)) {
      await setItem(
        'allRoutines',
        JSON.stringify([...existingRoutines, routine]),
      );
    }

    await setItem('routine', JSON.stringify(routine));
    router.push('/practice');
  };

  if (loading) {
    return (
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          p: 3,
          maxWidth: '800px',
          margin: '0 auto',
          width: '100%',
          bgcolor: '#0d0509',
          minHeight: '100vh',
          color: '#d6c3a5',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 4 }}>
          <TerminalIcon sx={{ color: theme.palette.secondary.main }} />
          <Typography
            variant='h6'
            sx={{
              fontFamily: 'monospace',
              color: theme.palette.secondary.main,
              fontWeight: 'bold',
            }}
          >
            Bizcocho Agent Intelligence
          </Typography>
        </Box>

        <Box
          ref={scrollRef}
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            overflowY: 'auto',
            fontFamily: 'monospace',
            '&::-webkit-scrollbar': {
              width: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: 'rgba(214, 195, 165, 0.2)',
              borderRadius: '2px',
            },
          }}
        >
          {logs.map((log, i) => (
            <Fade in key={i} timeout={500}>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Typography
                  variant='body2'
                  sx={{ color: theme.palette.secondary.main, opacity: 0.7 }}
                >
                  &gt;
                </Typography>
                <Typography
                  variant='body2'
                  sx={{ color: '#fff', lineHeight: 1.5 }}
                >
                  {log}
                </Typography>
              </Box>
            </Fade>
          ))}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
            <CircularProgress
              size={16}
              sx={{ color: theme.palette.secondary.main }}
            />
            <Typography
              variant='caption'
              sx={{ fontStyle: 'italic', opacity: 0.6 }}
            >
              Waiting for agent response...
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  }

  if (!routine) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography>{tCommon('error')}</Typography>
        <Button component={Link} href='/'>
          {tCommon('home')}
        </Button>
      </Box>
    );
  }

  const totalDurationSeconds = routine.exercises.reduce(
    (acc, ex) => acc + ex.duration,
    0,
  );
  const totalBreaks =
    (routine.exercises.length - 1) * (routine.breakDuration || 5);
  const estimatedTimeMinutes = Math.ceil(
    (totalDurationSeconds + totalBreaks + (routine.preparationDuration || 5)) /
      60,
  );

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        px: 3,
        py: 4,
        maxWidth: '800px',
        margin: '0 auto',
        width: '100%',
      }}
    >
      <Button
        component={Link}
        href='/'
        startIcon={<ArrowBackIcon />}
        sx={{
          alignSelf: 'flex-start',
          mb: 2,
          color: theme.palette.text.secondary,
        }}
      >
        {tCommon('home')}
      </Button>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mb: 1,
        }}
      >
        <Typography
          variant='h1'
          sx={{
            fontSize: '2rem !important',
            fontWeight: 700,
            color: theme.palette.primary.main,
          }}
        >
          {t('title')}
        </Typography>
        <Chip
          icon={<AutoAwesomeIcon style={{ fontSize: '1rem' }} />}
          label='AI Generated'
          size='small'
          sx={{
            backgroundColor: 'rgba(214, 195, 165, 0.2)',
            color: theme.palette.secondary.main,
            fontWeight: 600,
            border: `1px solid ${theme.palette.secondary.main}`,
          }}
        />
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            color: theme.palette.text.secondary,
          }}
        >
          <TimerIcon sx={{ fontSize: '1.2rem', mr: 0.5 }} />
          <Typography variant='body2'>{estimatedTimeMinutes} min</Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            color: theme.palette.text.secondary,
          }}
        >
          <FitnessCenterIcon sx={{ fontSize: '1.2rem', mr: 0.5 }} />
          <Typography variant='body2'>
            {routine.exercises.length} Exercises
          </Typography>
        </Box>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 4,
          borderRadius: '16px',
          backgroundColor: 'rgba(214, 195, 165, 0.1)',
          border: '1px solid rgba(214, 195, 165, 0.3)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <AutoAwesomeIcon
            sx={{ color: theme.palette.secondary.main, mr: 1 }}
          />
          <Typography variant='h6' sx={{ fontWeight: 600 }}>
            {t('benefitsTitle')}
          </Typography>
        </Box>
        <Typography
          variant='body1'
          sx={{ lineHeight: 1.6, color: theme.palette.text.secondary }}
        >
          {routine.description || t('aiReasoning')}
        </Typography>
      </Paper>

      <Typography variant='h5' sx={{ mb: 2, fontWeight: 600 }}>
        {routine.name}
      </Typography>

      <List sx={{ mb: 4 }}>
        {routine.exercises.map((exercise, index) => (
          <Box key={exercise.id}>
            <ListItem sx={{ px: 0, py: 2 }}>
              <Avatar
                sx={{
                  mr: 2,
                  bgcolor: theme.palette.primary.main,
                  fontSize: '0.9rem',
                }}
              >
                {index + 1}
              </Avatar>
              <ListItemText
                primary={exercise.name}
                secondary={`${exercise.duration} seconds`}
                primaryTypographyProps={{ fontWeight: 500 }}
              />
            </ListItem>
            {index < routine.exercises.length - 1 && <Divider component='li' />}
          </Box>
        ))}
      </List>

      <Button
        variant='contained'
        size='large'
        fullWidth
        startIcon={<PlayArrowIcon />}
        onClick={handleStart}
        sx={{
          py: 2,
          borderRadius: '12px',
          fontSize: '1.1rem',
          fontWeight: 600,
          textTransform: 'none',
          backgroundColor: theme.palette.primary.main,
          boxShadow: '0 4px 20px rgba(13, 5, 9, 0.15)',
          '&:hover': {
            backgroundColor: theme.palette.primary.main,
            opacity: 0.9,
          },
        }}
      >
        {t('startToday')}
      </Button>

      <Typography
        variant='caption'
        sx={{
          mt: 4,
          display: 'block',
          textAlign: 'center',
          color: theme.palette.text.disabled,
          fontStyle: 'italic',
        }}
      >
        Personalized for you by Bizcocho AI Agent with LangGraph
      </Typography>
    </Box>
  );
}
