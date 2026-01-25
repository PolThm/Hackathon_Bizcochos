'use client';

import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  Grid,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useTranslations } from 'next-intl';
import allExercises from '@/mocks/all-exercises-en.json';
import LibraryExercisePreview from '@/components/LibraryExercisePreview';

interface Exercise {
  id: string;
  name: string;
  image: string;
  instructions: string[];
  tips: string[];
  modifications: string[];
  benefits: string[];
}

export default function LibraryPage() {
  const t = useTranslations('library');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredExercises = useMemo(() => {
    if (!searchQuery.trim()) {
      return allExercises as Exercise[];
    }

    const query = searchQuery.toLowerCase().trim();
    return (allExercises as Exercise[]).filter(
      (exercise) =>
        exercise.name.toLowerCase().includes(query) ||
        exercise.benefits.some((benefit) =>
          benefit.toLowerCase().includes(query),
        ) ||
        exercise.instructions.some((instruction) =>
          instruction.toLowerCase().includes(query),
        ),
    );
  }, [searchQuery]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        flex: 1,
      }}
    >
      <Typography
        variant='h3'
        textAlign='center'
        sx={{ textTransform: 'uppercase' }}
      >
        {t('library')}
      </Typography>

      <TextField
        fullWidth
        placeholder={t('searchPlaceholder')}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position='start'>
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        sx={{ mt: 2 }}
      />

      <Box sx={{ flexGrow: 1, overflow: 'auto', mt: 2 }}>
        {filteredExercises.length === 0 ? (
          <Typography
            variant='body1'
            textAlign='center'
            color='text.secondary'
            sx={{ mt: 4 }}
          >
            {t('noExercisesFound')}
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {filteredExercises.map((exercise) => (
              <Grid item xs={6} key={exercise.id} sx={{ display: 'flex' }}>
                <LibraryExercisePreview exercise={exercise} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
}
