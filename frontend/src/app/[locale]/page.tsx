'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link } from '@/i18n/routing';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  useTheme,
  Paper,
  Chip,
  Fade,
  TextField,
} from '@mui/material';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import Image from 'next/image';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import TimerIcon from '@mui/icons-material/Timer';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import ListIcon from '@mui/icons-material/List';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import CloudIcon from '@mui/icons-material/Cloud';
import UmbrellaIcon from '@mui/icons-material/Umbrella';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import GrainIcon from '@mui/icons-material/Grain';
import { setItem, getItem } from '@/utils/indexedDB';
import { API_BASE_URL } from '@/utils/config';
import type { Routine } from '@/types';
import { useObjectStorage } from '@/hooks/useStorage';
import { getExercisesByLocale } from '@/utils/exercises';
import CalendarStrip from '@/components/CalendarStrip';

const CAROUSEL_INTERVAL_MS = 4000;
const CAROUSEL_SWIPE_PAUSE_MS = 10000;
const CAROUSEL_SWIPE_THRESHOLD_PX = 50;
const CAROUSEL_INDEX_STORAGE_KEY_PREFIX = 'homeCarouselIndex_';

interface StreamLog {
  type: 'step' | 'data' | 'error';
  node?: string;
  description?: string;
  data?: Routine;
  message?: string;
}

export default function Home() {
  const t = useTranslations('dailyRoutine');
  const tCommon = useTranslations('common');
  const tNewRoutine = useTranslations('newRoutine');
  const theme = useTheme();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? 'en';

  const [routine, setRoutine] = useState<Routine | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [userInput, setUserInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const [allRoutines] = useObjectStorage<Routine[]>('allRoutines', []);

  const [userLocation, setUserLocation] = useState<string | null>(null);
  const [weather, setWeather] = useState<{
    temp: number;
    description: string;
    code: number;
  } | null>(null);

  const [carouselIndex, setCarouselIndex] = useState(0);
  const [skipCarouselTransition, setSkipCarouselTransition] = useState(false);
  const autoScrollPausedUntilRef = useRef(0);
  const touchStartXRef = useRef<number | null>(null);
  const swipeHandledRef = useRef(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    // Check if we already have a generated routine for today in session storage
    const today = new Date().toISOString().split('T')[0];
    const saved = sessionStorage.getItem(`dailyRoutine_${today}`);
    if (saved) {
      setRoutine(JSON.parse(saved));
      setHasStarted(true);
    }
  }, []);

  useEffect(() => {
    const fetchLocationAndWeather = async () => {
      if (!navigator.geolocation) return;

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          localStorage.setItem('userLat', latitude.toString());
          localStorage.setItem('userLon', longitude.toString());

          try {
            const [locRes, weatherRes] = await Promise.all([
              fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=${locale}`,
              ),
              fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`,
              ),
            ]);

            const locData = await locRes.json();
            if (locData.city || locData.locality) {
              setUserLocation(locData.city || locData.locality);
            }

            const weatherData = await weatherRes.json();
            const code = weatherData.current.weather_code;
            let weatherDesc = 'Unknown';
            if (code === 0) weatherDesc = 'Clear';
            else if (code >= 1 && code <= 3) weatherDesc = 'Cloudy';
            else if (code >= 45 && code <= 48) weatherDesc = 'Foggy';
            else if (code >= 51 && code <= 67) weatherDesc = 'Rainy';
            else if (code >= 71 && code <= 77) weatherDesc = 'Snowy';
            else if (code >= 95) weatherDesc = 'Stormy';

            setWeather({
              temp: Math.round(weatherData.current.temperature_2m),
              description: weatherDesc,
              code,
            });
          } catch (error) {
            console.error('Error fetching location or weather:', error);
          }
        },
        (error) => {
          console.error('Error getting geolocation:', error);
        },
      );
    };

    fetchLocationAndWeather();
  }, [locale]);

  const getWeatherIcon = (code: number) => {
    if (code === 0)
      return <WbSunnyIcon sx={{ fontSize: '1rem', color: '#ffb300' }} />;
    if (code >= 1 && code <= 3)
      return <CloudIcon sx={{ fontSize: '1rem', color: '#90a4ae' }} />;
    if (code >= 45 && code <= 48)
      return <GrainIcon sx={{ fontSize: '1rem', color: '#78909c' }} />;
    if (code >= 51 && code <= 67)
      return <UmbrellaIcon sx={{ fontSize: '1rem', color: '#4fc3f7' }} />;
    if (code >= 71 && code <= 77)
      return <AcUnitIcon sx={{ fontSize: '1rem', color: '#e1f5fe' }} />;
    if (code >= 95)
      return <GrainIcon sx={{ fontSize: '1rem', color: '#546e7a' }} />;
    return <WbSunnyIcon sx={{ fontSize: '1rem' }} />;
  };

  const handleGenerateSession = async () => {
    const today = new Date().toISOString().split('T')[0];
    setLoading(true);
    setHasStarted(true);
    setLogs([]);

    try {
      const storedLat = localStorage.getItem('userLat');
      const storedLon = localStorage.getItem('userLon');

      const response = await fetch(`${API_BASE_URL}/api/generateDailyRoutine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locale,
          latitude: storedLat ? parseFloat(storedLat) : undefined,
          longitude: storedLon ? parseFloat(storedLon) : undefined,
          prompt: userInput,
        }),
      });

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
              const backendRoutine = chunk.data;
              const formattedRoutine: Routine = {
                ...backendRoutine,
                exercises: backendRoutine.exercises.map(
                  (ex: any, i: number) => ({
                    id: Date.now() + i,
                    name: ex.name,
                    duration: ex.duration,
                    exerciseId: ex.id,
                  }),
                ),
              };

              setRoutine(formattedRoutine);
              setTimeout(() => {
                setLoading(false);
                sessionStorage.setItem(
                  `dailyRoutine_${today}`,
                  JSON.stringify(formattedRoutine),
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

  const handleAction = async (path: '/setup' | '/practice') => {
    if (!routine) return;

    try {
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
      router.push(path);
    } catch (error) {
      console.error('Error saving routine:', error);
    }
  };

  const exercisesWithImage = useMemo(() => {
    if (!routine) return [];
    const library = getExercisesByLocale(locale);
    return routine.exercises.map((ex) => ({
      ...ex,
      image: library.find((e) => e.id === ex.exerciseId)?.image ?? '',
    }));
  }, [routine, locale]);

  const exerciseCount = exercisesWithImage.length;

  useEffect(() => {
    if (!routine || exerciseCount <= 1) return;
    const id = setInterval(() => {
      if (Date.now() < autoScrollPausedUntilRef.current) return;
      setCarouselIndex((prev) => (prev >= exerciseCount - 1 ? 0 : prev + 1));
    }, CAROUSEL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [routine, exerciseCount]);

  useEffect(() => {
    if (!routine?.id || exerciseCount <= 0) return;
    const key = `${CAROUSEL_INDEX_STORAGE_KEY_PREFIX}${routine.id}`;
    const saved = sessionStorage.getItem(key);
    const idx = saved !== null ? parseInt(saved, 10) : 0;
    if (!isNaN(idx) && idx >= 0 && idx < exerciseCount) {
      setSkipCarouselTransition(true);
      setCarouselIndex(idx);
    } else {
      setCarouselIndex(0);
    }
  }, [routine?.id, exerciseCount]);

  useEffect(() => {
    if (!skipCarouselTransition) return;
    const id = setTimeout(() => setSkipCarouselTransition(false), 0);
    return () => clearTimeout(id);
  }, [skipCarouselTransition]);

  useEffect(() => {
    if (!routine?.id) return;
    const key = `${CAROUSEL_INDEX_STORAGE_KEY_PREFIX}${routine.id}`;
    sessionStorage.setItem(key, String(carouselIndex));
  }, [routine?.id, carouselIndex]);

  const handleCarouselSwipe = useCallback(
    (direction: 'prev' | 'next') => {
      setCarouselIndex((prev) => {
        if (direction === 'next') {
          return prev >= exerciseCount - 1 ? 0 : prev + 1;
        }
        return prev <= 0 ? exerciseCount - 1 : prev - 1;
      });
      autoScrollPausedUntilRef.current = Date.now() + CAROUSEL_SWIPE_PAUSE_MS;
      swipeHandledRef.current = true;
    },
    [exerciseCount],
  );

  const handleCarouselTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    swipeHandledRef.current = false;
  }, []);

  const handleCarouselTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const startX = touchStartXRef.current;
      if (startX === null) return;
      touchStartXRef.current = null;
      const endX = e.changedTouches[0].clientX;
      const deltaX = endX - startX;
      if (Math.abs(deltaX) < CAROUSEL_SWIPE_THRESHOLD_PX) return;
      e.preventDefault();
      handleCarouselSwipe(deltaX > 0 ? 'prev' : 'next');
    },
    [handleCarouselSwipe],
  );

  const handleSlideClick = useCallback(
    (ex: (typeof exercisesWithImage)[0]) => {
      if (swipeHandledRef.current) {
        swipeHandledRef.current = false;
        return;
      }
      router.push(`/exercise/${ex.id}?from=home`);
    },
    [router],
  );

  const estimatedTimeMinutes = routine
    ? Math.ceil(
        (routine.exercises.reduce((acc, ex) => acc + ex.duration, 0) +
          (routine.exercises.length - 1) * (routine.breakDuration || 5) +
          (routine.preparationDuration || 5)) /
          60,
      )
    : 0;

  const latestLog = logs[logs.length - 1];

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        px: 3,
        py: 4,
        maxWidth: '800px',
        margin: '0 auto',
        width: '100%',
        position: 'relative',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: '5%',
          right: '5%',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          backgroundColor: theme.palette.secondary.main,
          opacity: 0.1,
          zIndex: 0,
        }}
      />

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          mb: 3,
          width: '100%',
          zIndex: 1,
        }}
      >
        <CalendarStrip />

        {userLocation && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              mb: 2,
              opacity: 0.8,
              flexWrap: 'wrap',
            }}
          >
            <LocationOnIcon
              sx={{ fontSize: '1rem', color: theme.palette.text.secondary }}
            />
            <Typography
              variant='body2'
              sx={{ color: theme.palette.text.secondary }}
            >
              {t('locationPrefix')} {userLocation}
              {weather && `, ${weather.description} ${weather.temp}°C`}
            </Typography>
            {weather && getWeatherIcon(weather.code)}
          </Box>
        )}

        {!hasStarted && !routine && (
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              mb: 4,
            }}
          >
            <Typography variant='h6' sx={{ fontWeight: 600 }}>
              How do you feel today?
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder='e.g. My lower back hurts, I have 15 minutes...'
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.5)',
                },
              }}
            />
            <Button
              variant='contained'
              size='large'
              fullWidth
              onClick={handleGenerateSession}
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
              Generate Daily Session
            </Button>
          </Box>
        )}

        {loading && (
          <Box
            sx={{
              width: '100%',
              py: 8,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              minHeight: '200px',
            }}
          >
            <CircularProgress
              size={40}
              thickness={4}
              sx={{ color: theme.palette.primary.main }}
            />
            <Fade in={!!latestLog} key={latestLog}>
              <Typography
                variant='body1'
                sx={{
                  textAlign: 'center',
                  color: theme.palette.text.secondary,
                  fontStyle: 'italic',
                  maxWidth: '80%',
                  lineHeight: 1.6,
                }}
              >
                {latestLog || 'Preparing your daily session...'}
              </Typography>
            </Fade>
          </Box>
        )}

        {!loading && routine && (
          <Box sx={{ width: '100%', mt: 1 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
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

            <Box
              sx={{
                display: 'flex',
                gap: 2,
                mb: 4,
                mt: 2,
                width: '100%',
                zIndex: 1,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  color: theme.palette.text.secondary,
                }}
              >
                <TimerIcon sx={{ fontSize: '1.2rem', mr: 0.5 }} />
                <Typography variant='body2'>
                  {estimatedTimeMinutes} min
                </Typography>
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
                width: '100%',
                zIndex: 1,
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

            <Typography
              variant='h5'
              sx={{
                mb: 2,
                fontWeight: 600,
                width: '100%',
                textAlign: 'left',
                zIndex: 1,
              }}
            >
              {routine.name}
            </Typography>

            <Box
              sx={{
                mb: 4,
                width: '100%',
                zIndex: 1,
                overflow: 'hidden',
                borderRadius: 2,
                position: 'relative',
                touchAction: 'pan-y',
              }}
              onTouchStart={handleCarouselTouchStart}
              onTouchEnd={handleCarouselTouchEnd}
            >
              <Box
                sx={{
                  display: 'flex',
                  transition: skipCarouselTransition
                    ? 'none'
                    : 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  transform: `translateX(-${carouselIndex * 100}%)`,
                }}
              >
                {exercisesWithImage.map((ex) => (
                  <Box
                    key={ex.id}
                    role='button'
                    tabIndex={0}
                    onClick={() => handleSlideClick(ex)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSlideClick(ex);
                      }
                    }}
                    sx={{
                      flex: '0 0 100%',
                      minWidth: 0,
                      cursor: 'pointer',
                      display: 'block',
                    }}
                  >
                    <Box
                      sx={{
                        position: 'relative',
                        borderRadius: 2,
                        overflow: 'hidden',
                        bgcolor: 'action.hover',
                        aspectRatio: '4/3',
                      }}
                    >
                      {ex.image ? (
                        <Image
                          src={ex.image}
                          alt={ex.name}
                          fill
                          sizes='(max-width: 600px) 100vw, 400px'
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Typography variant='body2' color='text.secondary'>
                            {ex.name}
                          </Typography>
                        </Box>
                      )}
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          px: 1.5,
                          py: 1,
                          background:
                            'linear-gradient(transparent, rgba(0,0,0,0.6))',
                          display: 'flex',
                          alignItems: 'flex-end',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Typography
                          variant='body2'
                          sx={{
                            color: 'white',
                            fontWeight: 600,
                            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                          }}
                        >
                          {ex.name}
                        </Typography>
                        <Typography
                          variant='caption'
                          sx={{
                            color: 'rgba(255,255,255,0.9)',
                            fontWeight: 500,
                          }}
                        >
                          {ex.duration}s
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
              {exercisesWithImage.length > 1 && (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 0.75,
                    mt: 1.5,
                  }}
                >
                  {exercisesWithImage.map((_, index) => (
                    <Box
                      key={index}
                      onClick={() => setCarouselIndex(index)}
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor:
                          index === carouselIndex
                            ? 'primary.main'
                            : 'action.selected',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s, transform 0.2s',
                        '&:hover': {
                          bgcolor:
                            index === carouselIndex
                              ? 'primary.dark'
                              : 'action.hover',
                          transform: 'scale(1.2)',
                        },
                      }}
                    />
                  ))}
                </Box>
              )}
              <Typography
                variant='body2'
                sx={{
                  mt: 2,
                  color: 'text.secondary',
                  textAlign: 'center',
                  fontStyle: 'italic',
                }}
              >
                {tNewRoutine('exploreExercisesText')}
              </Typography>
            </Box>

            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                width: '100%',
                maxWidth: '400px',
                zIndex: 1,
                alignSelf: 'center',
                margin: '0 auto',
              }}
            >
              <Button
                variant='contained'
                size='large'
                fullWidth
                startIcon={<PlayArrowIcon />}
                onClick={() => handleAction('/practice')}
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
                {tNewRoutine('startPractice')}
              </Button>

              <Button
                variant='outlined'
                size='large'
                fullWidth
                onClick={() => handleAction('/setup')}
                sx={{
                  py: 2,
                  borderRadius: '12px',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  borderColor: theme.palette.primary.main,
                  color: theme.palette.primary.main,
                  '&:hover': {
                    borderColor: theme.palette.secondary.main,
                    backgroundColor: 'rgba(214, 195, 165, 0.1)',
                  },
                }}
              >
                {tNewRoutine('editRoutine')}
              </Button>
            </Box>
          </Box>
        )}

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            width: '100%',
            maxWidth: '400px',
            zIndex: 1,
            alignSelf: 'center',
            margin: '0 auto',
            mt: 4,
          }}
        >
          <Button
            variant='outlined'
            size='large'
            fullWidth
            component={Link}
            href='/new-routine'
            startIcon={<AutoAwesomeIcon />}
            sx={{
              py: 2,
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: 500,
              textTransform: 'none',
              borderColor: theme.palette.primary.main,
              color: theme.palette.primary.main,
              '&:hover': {
                borderColor: theme.palette.secondary.main,
                backgroundColor: 'rgba(214, 195, 165, 0.1)',
              },
            }}
          >
            {tCommon('createNewRoutineWithAI')}
          </Button>

          <Button
            variant='text'
            size='large'
            fullWidth
            component={Link}
            href='/practice'
            startIcon={<ListIcon />}
            sx={{
              py: 1,
              fontSize: '1rem',
              textTransform: 'none',
              color: theme.palette.text.secondary,
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
              },
            }}
          >
            {tCommon('practice')}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
