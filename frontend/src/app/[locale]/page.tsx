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
} from '@mui/material';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import Image from 'next/image';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import TimerIcon from '@mui/icons-material/Timer';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import CloudIcon from '@mui/icons-material/Cloud';
import UmbrellaIcon from '@mui/icons-material/Umbrella';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import GrainIcon from '@mui/icons-material/Grain';
import { setItem, getItem } from '@/utils/indexedDB';
import { API_BASE_URL } from '@/utils/config';
import { getDailyRoutineStorageKey } from '@/utils/dailyRoutineStorage';
import type { Routine } from '@/types';
import { useObjectStorage } from '@/hooks/useStorage';
import { useExercises } from '@/hooks/useExercises';
import CalendarStrip from '@/components/CalendarStrip';
import LoadingState from '@/components/LoadingState';
import { CONTENT_MAX_WIDTH } from '@/constants/layout';
import {
  vortexBallAnimations,
  vortexBallAnimationConfig,
} from '@/styles/vortexBallAnimations';

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
  const tWelcome = useTranslations('welcome');

  const loadingMessages = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => tNewRoutine(`loadingMessages.${i}`)),
    [tNewRoutine],
  );
  const theme = useTheme();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? 'en';

  const [routine, setRoutine] = useState<Routine | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [allRoutines] = useObjectStorage<Routine[]>('allRoutines', []);
  const exercisesLibrary = useExercises(locale);

  const [userLocation, setUserLocation] = useState<string | null>(null);
  const [weather, setWeather] = useState<{
    temp: number;
    description: string;
    code: number;
  } | null>(null);
  const [googleConnected, setGoogleConnected] = useState(false);

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
    const token = localStorage.getItem('googleAccessToken');
    setGoogleConnected(!!token);

    const profile = localStorage.getItem('userProfile');
    if (profile) {
      setUserProfile(JSON.parse(profile));
    }

    // Check if we already have a generated routine for today (day = until 6am)
    const key = getDailyRoutineStorageKey();
    const saved = localStorage.getItem(key);
    if (saved) {
      setRoutine(JSON.parse(saved));
      setHasStarted(true);
    }

    setIsInitialized(true);
  }, []);

  const handleGenerateSession = useCallback(
    async (currentProfile?: any) => {
      const storageKey = getDailyRoutineStorageKey();
      const profileToUse = currentProfile || userProfile;

      setLoading(true);
      setHasStarted(true);
      setLogs([]);

      try {
        const storedLat = localStorage.getItem('userLat');
        const storedLon = localStorage.getItem('userLon');
        const googleToken = localStorage.getItem('googleAccessToken');
        const stravaToken = localStorage.getItem('stravaAccessToken');
        const timeZone =
          Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Rome';

        // Get the last 5 routines for context persistence
        const history = allRoutines.slice(-5).map((r) => ({
          name: r.name,
          description: r.description,
          exercises: r.exercises.map((e) => e.name),
        }));

        const saved = await getItem('isDemoActivated');
        const isDemoActivated = saved === true || saved === 'true';
        const response = await fetch(
          `${API_BASE_URL}/api/generateDailyRoutine`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              locale,
              latitude: storedLat ? parseFloat(storedLat) : undefined,
              longitude: storedLon ? parseFloat(storedLon) : undefined,
              prompt: '',
              googleToken,
              stravaToken,
              history,
              userProfile: profileToUse,
              timeZone,
              isDemoActivated: !!isDemoActivated,
            }),
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
                  localStorage.setItem(
                    storageKey,
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
    },
    [allRoutines, locale, userProfile],
  );

  // Auto-trigger generation when profile is ready and no routine exists
  // Check localStorage directly to avoid race: a routine may exist but state not yet updated
  useEffect(() => {
    const key = getDailyRoutineStorageKey();
    const saved = localStorage.getItem(key);
    if (saved) return; // Already have a routine for today (even if not validated), don't regenerate
    if (userProfile && !routine && !loading) {
      handleGenerateSession();
    }
  }, [userProfile, routine, loading, handleGenerateSession]);

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
    return routine.exercises.map((ex) => ({
      ...ex,
      image: exercisesLibrary.find((e) => e.id === ex.exerciseId)?.image ?? '',
    }));
  }, [routine, exercisesLibrary]);

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
      router.push(`/exercise/${ex.exerciseId}?from=home`);
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

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        maxWidth: CONTENT_MAX_WIDTH,
        margin: '0 auto',
        width: '100%',
        position: 'relative',
      }}
    >
      {/* Decorative background elements - only before onboarding */}
      {!userProfile && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100%',
            maxWidth: CONTENT_MAX_WIDTH,
            height: '90dvh',
            pointerEvents: 'none',
            zIndex: 0,
            ...vortexBallAnimations,
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              backgroundColor: theme.palette.secondary.main,
              transform: 'translate(-50%, -50%) scale(0.12)',
              opacity: 0,
              animation: {
                xs: `vortexBallTopRight ${vortexBallAnimationConfig.duration} ${vortexBallAnimationConfig.easing} 0.6s forwards`,
                sm: `vortexBallTopRight ${vortexBallAnimationConfig.duration} ${vortexBallAnimationConfig.easing} forwards`,
              },
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              backgroundColor: theme.palette.primary.main,
              transform: 'translate(-50%, -50%) scale(0.12)',
              opacity: 0,
              animation: {
                xs: `vortexBallBottomLeft ${vortexBallAnimationConfig.duration} ${vortexBallAnimationConfig.easing} 0.8s forwards`,
                sm: `vortexBallBottomLeft ${vortexBallAnimationConfig.duration} ${vortexBallAnimationConfig.easing} 0.2s forwards`,
              },
            }}
          />
        </Box>
      )}

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          width: '100%',
          zIndex: 1,
          flex: loading || !routine || !userProfile ? 1 : undefined,
        }}
      >
        {userProfile && <CalendarStrip />}

        {userProfile && userLocation && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              mb: 1.5,
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
            {googleConnected && (
              <Chip
                icon={
                  <Image
                    src='https://www.gstatic.com/images/branding/product/1x/calendar_2020q4_48dp.png'
                    alt={t('googleCalendarAlt')}
                    width={14}
                    height={14}
                  />
                }
                label={t('connected')}
                size='small'
                variant='outlined'
                sx={{
                  ml: 1,
                  height: '20px',
                  fontSize: '0.65rem',
                  borderColor: 'rgba(214, 195, 165, 0.3)',
                  color: theme.palette.text.secondary,
                  '& .MuiChip-label': { px: 1 },
                  '& .MuiChip-icon': { ml: '4px', mr: 0 },
                }}
              />
            )}
          </Box>
        )}

        {!userProfile && (
          <Box
            sx={{
              flex: 1,
              alignSelf: 'stretch',
              minHeight: 'calc(100dvh - 140px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              px: 2,
              py: 4,
            }}
          >
            <Typography
              variant='overline'
              sx={{
                fontSize: '0.75rem',
                letterSpacing: '0.2em',
                color: theme.palette.text.secondary,
                mb: 1,
              }}
            >
              {tWelcome('welcomeTo')}
            </Typography>
            <Typography
              variant='h1'
              sx={{
                mb: 2,
                fontSize: '2.5rem !important',
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              ROUTINES
            </Typography>
            <Typography
              variant='body1'
              sx={{
                color: theme.palette.text.secondary,
                fontStyle: 'italic',
                fontSize: '0.95rem',
                mb: 4,
              }}
            >
              {tWelcome('description')}
            </Typography>
            {!isInitialized ? (
              <CircularProgress
                sx={{ color: theme.palette.primary.main, mt: 2 }}
              />
            ) : (
              <Button
                variant='contained'
                size='large'
                onClick={() => router.push('/onboarding')}
                sx={{
                  py: 1.75,
                  px: 5,
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  backgroundColor: theme.palette.primary.main,
                  color: '#fff',
                  boxShadow: 'none',
                  '&:hover': {
                    backgroundColor: theme.palette.primary.main,
                    opacity: 0.9,
                  },
                }}
              >
                {tWelcome('startAdventure')}
              </Button>
            )}
          </Box>
        )}

        {userProfile && loading && (
          <Box
            sx={{
              width: '100%',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <LoadingState
              messages={loadingMessages}
              stepMessages={logs}
              hideFrontendMessages
            />
          </Box>
        )}

        {userProfile && !loading && routine && (
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
                  fontSize: '1.8rem !important',
                  fontWeight: 700,
                  color: theme.palette.primary.main,
                }}
              >
                {t('title')}
              </Typography>
            </Box>

            <Box
              sx={{
                display: 'flex',
                gap: 2,
                mb: 3,
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
                  {t('exercisesCount', {
                    count: routine.exercises.length,
                  })}
                </Typography>
              </Box>
              <Chip
                icon={<AutoAwesomeIcon style={{ fontSize: '1rem' }} />}
                label={t('aiGenerated')}
                size='small'
                sx={{
                  backgroundColor: 'rgba(214, 195, 165, 0.2)',
                  color: theme.palette.secondary.main,
                  fontWeight: 600,
                  border: `1px solid ${theme.palette.secondary.main}`,
                  ml: 'auto',
                }}
              />
            </Box>

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
                mb: 3,
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

            <Paper
              elevation={0}
              sx={{
                p: 2,
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
                {routine.description}
              </Typography>
            </Paper>

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
            mt: loading ? 'auto' : routine ? 2.5 : 'auto',
            flex: !loading && !routine ? 1 : undefined,
          }}
        >
          {userProfile && loading && (
            <Button
              variant='contained'
              size='large'
              fullWidth
              disabled
              sx={{ py: 2, borderRadius: '12px' }}
            >
              {t('preparingSession')}
            </Button>
          )}

          {userProfile && !loading && routine && (
            <Button
              variant='text'
              size='large'
              fullWidth
              component={Link}
              href='/new-routine'
              sx={{
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: 500,
                textTransform: 'none',
                borderColor: theme.palette.primary.main,
                color: theme.palette.primary.main,
                textDecoration: 'underline',
                '&:hover': {
                  borderColor: theme.palette.secondary.main,
                  backgroundColor: 'rgba(214, 195, 165, 0.1)',
                },
              }}
            >
              {tCommon('createMorePersonalizedRoutine')}
            </Button>
          )}

          {userProfile && !loading && !routine && (
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mt: '-92px',
              }}
            >
              <CircularProgress sx={{ color: 'secondary.main' }} />
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
