'use client';

import { useState, useEffect } from 'react';
import { usePathname, useParams } from 'next/navigation';
import { useRouter as useIntlRouter } from '@/i18n/routing';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  TextField,
  Button,
  Snackbar,
  Alert,
} from '@mui/material';
import { Language, ValidReferences, Routine } from '@/types';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import routinePolux from '@/mocks/routine-polux.json';
import routineRapido from '@/mocks/routine-rapido.json';
import ConfirmModal from '@/components/ConfirmModal';
import { setItem, getItem, clear as clearIndexedDB } from '@/utils/indexedDB';
import versionData from '@/version.json';

const { English, French, Spanish } = Language;

const VERSION = `V${versionData.version}`;

export default function ParametersPage() {
  const intlRouter = useIntlRouter();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const currentLocale = params.locale as string;
  const t = useTranslations('parameters');
  const [isMuted, setIsMuted] = useState(false);
  const [language, setLanguage] = useState<Language>(currentLocale as Language);
  const [reference, setReference] = useState('');
  const [isButtonVisible, setIsButtonVisible] = useState(false);
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMessage, setSnackMessage] = useState('');
  const [snackSeverity, setSnackSeverity] = useState<'success' | 'error'>(
    'success',
  );
  const [openResetModal, setOpenResetModal] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedMutedState = await getItem('isMuted');
        if (savedMutedState !== null) {
          setIsMuted(
            typeof savedMutedState === 'string'
              ? JSON.parse(savedMutedState)
              : savedMutedState,
          );
        }

        const savedLanguage = await getItem('language');
        if (savedLanguage) {
          setLanguage(savedLanguage as Language);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };

    loadSettings();
  }, []);

  const handleSoundChange = async (
    event: SelectChangeEvent<'muted' | 'unmuted'>,
  ) => {
    const newMutedState = event.target.value === 'muted';
    setIsMuted(newMutedState);
    try {
      await setItem('isMuted', JSON.stringify(newMutedState));
    } catch (error) {
      console.error('Failed to save muted state:', error);
    }
  };

  const handleLanguageChange = async (event: SelectChangeEvent<string>) => {
    const newLanguage = event.target.value as Language;
    setLanguage(newLanguage);
    try {
      await setItem('language', newLanguage);
      // Cookie used by middleware so next app open uses this locale (no flicker)
      document.cookie = `preferred-locale=${newLanguage}; path=/; max-age=31536000`;
    } catch (error) {
      console.error('Failed to save language:', error);
    }
    const newLocale = newLanguage.toLowerCase();
    const pathWithoutLocale = pathname.split('/').slice(2).join('/');
    intlRouter.push(`/${pathWithoutLocale}`, { locale: newLocale as Language });
  };

  const submitReference = async () => {
    const isValidReference = Object.values(ValidReferences).includes(
      reference.toLowerCase() as ValidReferences,
    );
    if (isValidReference) {
      let isNewValidReference;
      try {
        const savedAllRoutines = await getItem('allRoutines');
        const savedAllRoutinesParsed = savedAllRoutines
          ? JSON.parse(savedAllRoutines)
          : [];

        if (reference.toLowerCase() === ValidReferences.Polux) {
          const hasPoluxRoutine = savedAllRoutinesParsed.some(
            (routine: Routine) => routine.id === 'polux',
          );
          if (!hasPoluxRoutine) {
            const newAllRoutines = [...savedAllRoutinesParsed, routinePolux];
            await setItem('allRoutines', JSON.stringify(newAllRoutines));
            isNewValidReference = true;
          }
        }

        if (reference.toLowerCase() === ValidReferences.Rapido) {
          const hasRapidoRoutine = savedAllRoutinesParsed.some(
            (routine: Routine) => routine.id === 'rapido',
          );
          if (!hasRapidoRoutine) {
            const newAllRoutines = [...savedAllRoutinesParsed, routineRapido];
            await setItem('allRoutines', JSON.stringify(newAllRoutines));
            isNewValidReference = true;
          }
        }

        if (reference.toLowerCase() === ValidReferences.Demo) {
          await setItem('isDemoActivated', JSON.stringify(true));
          setSnackMessage(t('referenceDemoActivated'));
          setSnackSeverity('success');
        } else if (isNewValidReference) {
          setSnackMessage(t('referenceValid'));
          setSnackSeverity('success');
        } else {
          setSnackMessage(t('referenceAlreadyUsed'));
          // @ts-ignore
          setSnackSeverity('warning');
        }
      } catch (error) {
        console.error('Failed to process reference:', error);
        setSnackMessage(t('referenceInvalid'));
        setSnackSeverity('error');
      }
    } else {
      setSnackMessage(t('referenceInvalid'));
      setSnackSeverity('error');
    }
    setSnackOpen(true);
  };

  const handleSnackClose = () => {
    setSnackOpen(false);
  };

  const handleReset = async () => {
    try {
      // Clear all IndexedDB data (routines, preferences, streak, etc.)
      await clearIndexedDB();

      // Clear localStorage (Google auth, user profile, location, daily routine cache)
      localStorage.removeItem('googleAccessToken');
      localStorage.removeItem('userProfile');
      localStorage.removeItem('userLat');
      localStorage.removeItem('userLon');
      Object.keys(localStorage)
        .filter((k) => k.startsWith('dailyRoutine_'))
        .forEach((k) => localStorage.removeItem(k));

      // Clear session storage (temp routine drafts, carousel state)
      sessionStorage.clear();

      // Clear language preference cookie
      document.cookie = 'preferred-locale=; path=/; max-age=0';

      setOpenResetModal(false);
      intlRouter.push('/');
    } catch (error) {
      console.error('Failed to reset data:', error);
    }
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
        {t('parameters')}
      </Typography>

      <Box sx={{ mt: 2 }}>
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel id='language-select-label'>{t('languages')}</InputLabel>
          <Select
            labelId='language-select-label'
            id='language-select'
            value={language}
            label={t('languages')}
            onChange={handleLanguageChange}
          >
            <MenuItem value={English}>{t('english')}</MenuItem>
            <MenuItem value={French}>{t('french')}</MenuItem>
            <MenuItem value={Spanish}>{t('spanish')}</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ mt: 2 }}>
        <FormControl fullWidth>
          <InputLabel id='sound-select-label'>{t('sound')}</InputLabel>
          <Select
            labelId='sound-select-label'
            id='sound-select'
            value={isMuted ? 'muted' : 'unmuted'}
            label={t('sound')}
            onChange={handleSoundChange}
          >
            <MenuItem value='unmuted'>{t('enabled')}</MenuItem>
            <MenuItem value='muted'>{t('disabled')}</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ mt: 2 }}>
        <TextField
          label={t('reference')}
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          onFocus={() => setIsButtonVisible(true)}
          fullWidth
          inputProps={{
            style: {
              fontSize: 16,
              transform: 'scale(0.875)',
              transformOrigin: 'left center',
              height: '20px',
            },
          }}
        />
        <Button
          variant='contained'
          onClick={submitReference}
          sx={{
            display: isButtonVisible ? 'block' : 'none',
            mt: 1.5,
          }}
        >
          Submit
        </Button>
      </Box>

      <Box sx={{ flexGrow: 1 }} />

      <Box sx={{ mt: 1, gap: 1.5, display: 'flex', flexDirection: 'column' }}>
        <Button
          variant='contained'
          fullWidth
          sx={{ mt: 'auto' }}
          onClick={() => intlRouter.push('/')}
        >
          {t('letsGo')}
        </Button>
        <Button
          variant='text'
          color='error'
          fullWidth
          onClick={() => setOpenResetModal(true)}
          sx={{ textDecoration: 'underline', fontWeight: 400 }}
        >
          {t('reset')}
        </Button>
      </Box>

      <Box sx={{ textAlign: 'center', mt: -0.75 }}>
        <Box
          sx={{
            mb: 1,
            display: 'flex',
            gap: 0.75,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Link
            href='/privacy'
            style={{
              color: 'inherit',
              fontSize: '0.75rem',
            }}
          >
            {t('privacyPolicy')}
          </Link>
          <span>•</span>
          <Link
            href='/terms'
            style={{
              color: 'inherit',
              fontSize: '0.75rem',
            }}
          >
            {t('termsOfUse')}
          </Link>
        </Box>
        <Typography variant='body2' color='text.secondary'>
          {VERSION} • {t('developedBy')}
        </Typography>
      </Box>

      <Snackbar
        open={snackOpen}
        autoHideDuration={3000}
        onClose={handleSnackClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleSnackClose}
          severity={snackSeverity}
          sx={{ width: '100%' }}
        >
          {snackMessage}
        </Alert>
      </Snackbar>

      <ConfirmModal
        isOpen={openResetModal}
        handleClose={() => setOpenResetModal(false)}
        confirmAction={handleReset}
      >
        {t('resetRoutinesConfirm')}
      </ConfirmModal>
    </Box>
  );
}
