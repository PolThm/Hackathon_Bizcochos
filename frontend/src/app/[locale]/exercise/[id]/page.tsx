'use client';

import { useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import {
  Box,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemText,
  Paper,
  IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import allExercises from '@/mocks/all-exercises-en.json';
import { Link } from '@/i18n/routing';

interface Exercise {
  id: string;
  name: string;
  image: string;
  instructions: string[];
  tips: string[];
  modifications: string[];
  benefits: string[];
}

export default function ExerciseDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const t = useTranslations('exerciseDetails');
  const exerciseId = params.id as string;
  const from = searchParams.get('from');
  const backHref = from === 'setup' ? '/setup' : '/library';

  const exercise = useMemo(() => {
    return (allExercises as Exercise[]).find((ex) => ex.id === exerciseId);
  }, [exerciseId]);

  if (!exercise) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          gap: 2,
        }}
      >
        <Typography variant='h4'>{t('notFound')}</Typography>
        <Link href='/library'>{t('backToLibrary')}</Link>
      </Box>
    );
  }

  const benefitsList = exercise.benefits[0]
    ? exercise.benefits[0].split(', ').filter(Boolean)
    : [];

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        flex: 1,
        pb: 4,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton
          component={Link}
          href={backHref}
          sx={{ color: 'text.primary' }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography
          variant='h4'
          sx={{ textTransform: 'uppercase', fontWeight: 600 }}
        >
          {exercise.name}
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
        }}
      >
        <Box
          sx={{
            flex: { xs: 'none', md: '0 0 250px' },
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
          }}
        >
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              maxWidth: 250,
              aspectRatio: '1 / 1',
              borderRadius: '50%',
              backgroundColor: 'background.default',
              overflow: 'hidden',
              border: '2px solid',
              borderColor: 'divider',
            }}
          >
            <Image
              src={exercise.image}
              alt={exercise.name}
              fill
              style={{
                objectFit: 'cover',
              }}
              sizes='250px'
            />
          </Box>
        </Box>

        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {benefitsList.length > 0 && (
            <Paper
              elevation={0}
              sx={{
                p: 2,
                backgroundColor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
              }}
            >
              <Typography
                variant='h6'
                gutterBottom
                sx={{ fontWeight: 600, mb: 1.5 }}
              >
                {t('benefits')}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {benefitsList.map((benefit, index) => (
                  <Chip
                    key={index}
                    label={benefit.trim()}
                    sx={{
                      fontWeight: 500,
                      backgroundColor: 'primary.light',
                      color: 'primary.contrastText',
                    }}
                  />
                ))}
              </Box>
            </Paper>
          )}

          <Paper
            elevation={0}
            sx={{
              p: 2,
              backgroundColor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
            }}
          >
            <Typography
              variant='h6'
              gutterBottom
              sx={{ fontWeight: 600, mb: 1.5 }}
            >
              {t('instructions')}
            </Typography>
            <List sx={{ pl: 0 }}>
              {exercise.instructions.map((instruction, index) => (
                <ListItem key={index} sx={{ pl: 0, py: 0.5 }}>
                  <ListItemText
                    primary={`${index + 1}. ${instruction}`}
                    primaryTypographyProps={{
                      sx: { lineHeight: 1.6 },
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>

          {exercise.tips.length > 0 && (
            <Paper
              elevation={0}
              sx={{
                p: 2,
                backgroundColor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
              }}
            >
              <Typography
                variant='h6'
                gutterBottom
                sx={{ fontWeight: 600, mb: 1.5 }}
              >
                {t('tips')}
              </Typography>
              <List sx={{ pl: 0 }}>
                {exercise.tips.map((tip, index) => (
                  <ListItem key={index} sx={{ pl: 0, py: 0.5 }}>
                    <ListItemText
                      primary={tip}
                      primaryTypographyProps={{
                        sx: { lineHeight: 1.6 },
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}

          {exercise.modifications.length > 0 && (
            <Paper
              elevation={0}
              sx={{
                p: 2,
                backgroundColor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
              }}
            >
              <Typography
                variant='h6'
                gutterBottom
                sx={{ fontWeight: 600, mb: 1.5 }}
              >
                {t('modifications')}
              </Typography>
              <List sx={{ pl: 0 }}>
                {exercise.modifications.map((modification, index) => (
                  <ListItem key={index} sx={{ pl: 0, py: 0.5 }}>
                    <ListItemText
                      primary={modification}
                      primaryTypographyProps={{
                        sx: { lineHeight: 1.6 },
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}
        </Box>
      </Box>
    </Box>
  );
}
