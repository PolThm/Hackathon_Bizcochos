'use client';

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
} from '@mui/material';
import { useTranslations } from 'next-intl';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TimerIcon from '@mui/icons-material/Timer';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';

const MOCK_DAILY_ROUTINE = {
  id: 'daily-mock',
  name: 'Morning Vitality',
  description: 'A quick flow to wake up your body and mind.',
  focus: 'Spine & Hips',
  breakDuration: 10,
  preparationDuration: 15,
  exercises: [
    {
      id: 1,
      name: 'Rag Doll',
      duration: 60,
      exerciseId: 'd70415d950a2',
    },
    {
      id: 2,
      name: 'Upward Dog',
      duration: 45,
      exerciseId: '7e6077a58ec2',
    },
    {
      id: 3,
      name: "Child's Pose",
      duration: 60,
      exerciseId: 'f0e3ea656db8',
    },
    {
      id: 4,
      name: 'Knees-to-chest',
      duration: 45,
      exerciseId: '0334bf01a6dd',
    },
  ],
};

export default function DailyRoutinePage() {
  const t = useTranslations('dailyRoutine');
  const tCommon = useTranslations('common');
  const theme = useTheme();

  const totalDurationSeconds = MOCK_DAILY_ROUTINE.exercises.reduce(
    (acc, ex) => acc + ex.duration,
    0,
  );
  const totalBreaks =
    (MOCK_DAILY_ROUTINE.exercises.length - 1) *
    MOCK_DAILY_ROUTINE.breakDuration;
  const estimatedTimeMinutes = Math.ceil(
    (totalDurationSeconds +
      totalBreaks +
      MOCK_DAILY_ROUTINE.preparationDuration) /
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
          <Typography variant='body2'>{MOCK_DAILY_ROUTINE.focus}</Typography>
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
          {t('aiReasoning')}
        </Typography>
      </Paper>

      <Typography variant='h5' sx={{ mb: 2, fontWeight: 600 }}>
        {MOCK_DAILY_ROUTINE.name}
      </Typography>

      <List sx={{ mb: 4 }}>
        {MOCK_DAILY_ROUTINE.exercises.map((exercise, index) => (
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
            {index < MOCK_DAILY_ROUTINE.exercises.length - 1 && (
              <Divider component='li' />
            )}
          </Box>
        ))}
      </List>

      <Button
        variant='contained'
        size='large'
        fullWidth
        startIcon={<PlayArrowIcon />}
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
        Personalized for you by Bizcocho AI Agent
      </Typography>
    </Box>
  );
}
