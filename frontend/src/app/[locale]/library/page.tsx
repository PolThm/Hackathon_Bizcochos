'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import {
  Box,
  Typography,
  TextField,
  Grid,
  InputAdornment,
  Chip,
  Stack,
  Button,
  Drawer,
  Badge,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useTranslations } from 'next-intl';
import {
  getExercisesByLocale,
  getExerciseBenefitList,
  exerciseHasBenefit,
  LibraryExercise,
} from '@/utils/exercises';
import LibraryExercisePreview from '@/components/LibraryExercisePreview';
import { CONTENT_MAX_WIDTH } from '@/constants/layout';

export default function LibraryPage() {
  const t = useTranslations('library');
  const params = useParams();
  const locale = (params?.locale as string) ?? 'en';
  const allExercises = getExercisesByLocale(locale);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBenefits, setSelectedBenefits] = useState<string[]>([]);
  const [benefitsDrawerOpen, setBenefitsDrawerOpen] = useState(false);

  const uniqueBenefits = useMemo(() => {
    const set = new Set<string>();
    allExercises.forEach((ex) =>
      getExerciseBenefitList(ex).forEach((b) => set.add(b)),
    );
    return Array.from(set).sort();
  }, [allExercises]);

  const filteredExercises = useMemo(() => {
    let list = allExercises;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      list = list.filter(
        (exercise: LibraryExercise) =>
          exercise.name.toLowerCase().includes(query) ||
          exercise.benefits.some((benefit) =>
            benefit.toLowerCase().includes(query),
          ) ||
          exercise.instructions.some((instruction) =>
            instruction.toLowerCase().includes(query),
          ),
      );
    }

    if (selectedBenefits.length > 0) {
      list = list.filter((exercise: LibraryExercise) =>
        selectedBenefits.some((benefit) =>
          exerciseHasBenefit(exercise, benefit),
        ),
      );
    }

    return list;
  }, [searchQuery, selectedBenefits, allExercises]);

  const toggleBenefit = (benefit: string) => {
    setSelectedBenefits((prev) =>
      prev.includes(benefit)
        ? prev.filter((b) => b !== benefit)
        : [...prev, benefit],
    );
  };

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

      <Badge
        badgeContent={selectedBenefits.length}
        color='primary'
        invisible={selectedBenefits.length === 0}
        sx={{ alignSelf: 'flex-start' }}
      >
        <Button
          variant='outlined'
          size='medium'
          startIcon={<FilterListIcon />}
          onClick={() => setBenefitsDrawerOpen(true)}
          sx={{ textTransform: 'none' }}
        >
          {t('filterByBenefits')}
        </Button>
      </Badge>

      <Drawer
        anchor='bottom'
        open={benefitsDrawerOpen}
        onClose={() => setBenefitsDrawerOpen(false)}
        PaperProps={{
          sx: {
            maxHeight: '70vh',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxWidth: { sm: CONTENT_MAX_WIDTH },
            width: '100%',
            marginLeft: 'auto',
            marginRight: 'auto',
          },
        }}
      >
        <Box sx={{ p: 2, pb: 3 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography variant='h6'>{t('filterByBenefits')}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {selectedBenefits.length > 0 && (
                <Button
                  variant='text'
                  size='small'
                  color='inherit'
                  onClick={() => setSelectedBenefits([])}
                  sx={{ textTransform: 'none', color: 'text.secondary' }}
                >
                  {t('clearFilters')}
                </Button>
              )}
              <Button
                variant='text'
                size='small'
                onClick={() => setBenefitsDrawerOpen(false)}
              >
                {t('done')}
              </Button>
            </Box>
          </Box>
          <Box
            sx={{
              maxHeight: '55vh',
              overflow: 'auto',
            }}
          >
            <Stack direction='row' flexWrap='wrap' useFlexGap gap={0.75}>
              {uniqueBenefits.map((benefit) => (
                <Chip
                  key={benefit}
                  label={benefit}
                  size='small'
                  variant={
                    selectedBenefits.includes(benefit) ? 'filled' : 'outlined'
                  }
                  onClick={() => toggleBenefit(benefit)}
                  sx={{ mb: 0.5 }}
                />
              ))}
            </Stack>
          </Box>
        </Box>
      </Drawer>

      <Box sx={{ flexGrow: 1, overflow: 'auto', mt: 0.5, pb: 0.5 }}>
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
