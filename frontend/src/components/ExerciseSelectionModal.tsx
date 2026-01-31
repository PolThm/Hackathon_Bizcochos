'use client';

import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  Grid,
  InputAdornment,
  Modal,
  IconButton,
  Button,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslations } from 'next-intl';
import { getExercisesByLocale, LibraryExercise } from '@/utils/exercises';
import LibraryExercisePreview from '@/components/LibraryExercisePreview';

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
  const allExercises = getExercisesByLocale(locale);

  const filteredExercises = useMemo(() => {
    if (!searchQuery.trim()) {
      return allExercises;
    }

    const query = searchQuery.toLowerCase().trim();
    return allExercises.filter(
      (exercise) =>
        exercise.name.toLowerCase().includes(query) ||
        exercise.benefits.some((benefit) =>
          benefit.toLowerCase().includes(query),
        ) ||
        exercise.instructions.some((instruction) =>
          instruction.toLowerCase().includes(query),
        ),
    );
  }, [searchQuery, allExercises]);

  const handleExerciseClick = (exercise: LibraryExercise) => {
    onSelectExercise(exercise);
    onClose();
    setSearchQuery('');
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
          maxWidth: '600px',
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

        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
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
        </Box>

        <Box
          sx={{
            flexGrow: 1,
            overflow: 'auto',
            p: 2,
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
