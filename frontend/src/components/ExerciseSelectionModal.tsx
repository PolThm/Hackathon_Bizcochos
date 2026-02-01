'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Grid,
  InputAdornment,
  Modal,
  IconButton,
  Button,
  Chip,
  Stack,
  Badge,
  Drawer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useTranslations } from 'next-intl';
import {
  getExercisesByLocale,
  getExerciseBenefitList,
  exerciseHasBenefit,
  LibraryExercise,
} from '@/utils/exercises';
import LibraryExercisePreview from '@/components/LibraryExercisePreview';
import { CONTENT_MAX_WIDTH, MODAL_MAX_WIDTH } from '@/constants/layout';

interface ExerciseSelectionModalProps {
  open: boolean;
  onClose: () => void;
  onSelectExercise: (exercise: LibraryExercise) => void;
  onAddCustomExercise?: (name: string) => void;
  locale?: string;
}

export default function ExerciseSelectionModal({
  open,
  onClose,
  onSelectExercise,
  onAddCustomExercise,
  locale = 'en',
}: ExerciseSelectionModalProps) {
  const t = useTranslations('library');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBenefits, setSelectedBenefits] = useState<string[]>([]);
  const [benefitsDrawerOpen, setBenefitsDrawerOpen] = useState(false);
  const allExercises = getExercisesByLocale(locale);

  useEffect(() => {
    if (open) {
      setSearchQuery('');
      setSelectedBenefits([]);
    }
  }, [open]);

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
        (exercise) =>
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
      list = list.filter((exercise) =>
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

  const handleExerciseClick = (exercise: LibraryExercise) => {
    onSelectExercise(exercise);
    onClose();
    setSearchQuery('');
    setSelectedBenefits([]);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Box
        sx={{
          backgroundColor: 'background.paper',
          borderRadius: 2,
          width: '100%',
          maxWidth: { xs: '90vw', sm: MODAL_MAX_WIDTH },
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant='h6' sx={{ fontWeight: 600 }}>
            {t('library')}
          </Typography>
          <IconButton onClick={onClose} size='small'>
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ px: 2, pt: 2, pb: 1.5 }}>
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
          />
          <Badge
            badgeContent={selectedBenefits.length}
            color='primary'
            invisible={selectedBenefits.length === 0}
            sx={{ mt: 1.5, display: 'inline-block' }}
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
        </Box>

        <Drawer
          anchor='bottom'
          open={benefitsDrawerOpen}
          onClose={() => setBenefitsDrawerOpen(false)}
          sx={{ zIndex: 1400 }}
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
                    sx={{
                      textTransform: 'none',
                      color: 'text.secondary',
                    }}
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
            <Box sx={{ maxHeight: '55vh', overflow: 'auto' }}>
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

        <Box
          sx={{
            flexGrow: 1,
            overflow: 'auto',
            p: 2,
            pt: 0.5,
          }}
        >
          {filteredExercises.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                my: 4,
              }}
            >
              <Typography
                variant='body1'
                textAlign='center'
                color='text.secondary'
              >
                {t('noExercisesFound')}
              </Typography>
              {onAddCustomExercise && (
                <Button
                  variant='outlined'
                  onClick={() => {
                    onAddCustomExercise(searchQuery.trim());
                    onClose();
                    setSearchQuery('');
                    setSelectedBenefits([]);
                  }}
                >
                  {t('addCustomExercise')}
                </Button>
              )}
            </Box>
          ) : (
            <Grid container spacing={2}>
              {filteredExercises.map((exercise) => (
                <Grid item xs={6} key={exercise.id} sx={{ display: 'flex' }}>
                  <Box
                    onClick={() => handleExerciseClick(exercise)}
                    sx={{ cursor: 'pointer', width: '100%', display: 'flex' }}
                  >
                    <LibraryExercisePreview
                      exercise={exercise}
                      disableLink={true}
                      hideBadges={true}
                      smallImage={true}
                    />
                  </Box>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Box>
    </Modal>
  );
}
