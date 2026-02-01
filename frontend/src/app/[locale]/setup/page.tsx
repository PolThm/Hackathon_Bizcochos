'use client';

import { Box, Button, Typography, CircularProgress } from '@mui/material';
import routineExampleEn from '@/mocks/routine-example-en.json';
import routineExampleFr from '@/mocks/routine-example-fr.json';
import routineExampleEs from '@/mocks/routine-example-es.json';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useObjectStorage } from '@/hooks/useStorage';
import { Link } from '@/i18n/routing';
import { Routine, Exercise } from '@/types';
import IconButton from '@mui/material/IconButton';
import {
  EditDurationLine,
  EditDurationLineRef,
} from '@/components/EditDurationLine';
import debounce from 'lodash/debounce';
import { useRouter } from '@/i18n/routing';
import { useParams } from 'next/navigation';
import SwitchRoutineTitle from '@/components/SwitchRoutineTitle';
import ConfirmModal from '@/components/ConfirmModal';
import ExerciseSelectionModal from '@/components/ExerciseSelectionModal';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { useTranslations } from 'next-intl';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import { setItem, getItem } from '@/utils/indexedDB';
import { getExercisesByLocale } from '@/utils/exercises';

export default function SetupPage() {
  const router = useRouter();
  const params = useParams();
  const currentLocale = params.locale as string;
  const [routine, setRoutine] = useState<Routine>();
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isExerciseSelectionModalOpen, setIsExerciseSelectionModalOpen] =
    useState(false);
  const [key, setKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [allRoutines] = useObjectStorage<Routine[]>('allRoutines', []);
  const hasNoRoutines = allRoutines.length === 0;
  const t = useTranslations('setup');
  const tCommon = useTranslations('common');

  const getLocalizedRoutineExample = useCallback(() => {
    switch (currentLocale) {
      case 'fr':
        return routineExampleFr;
      case 'es':
        return routineExampleEs;
      default:
        return routineExampleEn;
    }
  }, [currentLocale]);

  const debouncedSave = useRef(
    debounce(async (routine: Routine) => {
      try {
        await setItem('routine', JSON.stringify(routine));
      } catch (error) {
        console.error('Failed to save routine:', error);
      }
    }, 300),
  ).current;

  useEffect(() => {
    const loadRoutine = async () => {
      try {
        const savedRoutine = await getItem('routine');
        if (savedRoutine) {
          const parsedRoutine = JSON.parse(savedRoutine);
          // Always use the saved routine, even if it's the example routine
          // This allows users to modify the example routine
          setRoutine(parsedRoutine);
        } else {
          // By default, load the example routine instead of basic
          setRoutine(getLocalizedRoutineExample());
        }
      } catch (error) {
        console.error('Failed to load routine:', error);
        setRoutine(getLocalizedRoutineExample());
      } finally {
        setIsLoading(false);
      }
    };

    loadRoutine();
  }, [currentLocale, getLocalizedRoutineExample]);

  useEffect(() => {
    if (routine) debouncedSave(routine);
  }, [debouncedSave, routine]);

  const addExercise = () => {
    setIsExerciseSelectionModalOpen(true);
  };

  const addExerciseFromLibrary = (libraryExercise: {
    id: string;
    name: string;
    image: string;
    instructions: string[];
    tips: string[];
    modifications: string[];
    benefits: string[];
  }) => {
    if (!routine) return;
    const newRoutine = {
      ...routine,
      exercises: [
        ...routine.exercises,
        {
          name: libraryExercise.name,
          duration: 30,
          id: Date.now(),
          exerciseId: libraryExercise.id,
        },
      ],
    };
    setRoutine(newRoutine);
  };

  const addCustomExercise = (name: string = '') => {
    if (!routine) return;
    const newRoutine = {
      ...routine,
      exercises: [
        ...routine.exercises,
        {
          name: name.trim(),
          duration: 30,
          id: Date.now(),
        },
      ],
    };
    setRoutine(newRoutine);
  };

  const removeExercise = (id: number) => {
    if (!routine) return;
    const newRoutine = {
      ...routine,
      exercises: routine.exercises.filter((exercise) => exercise.id !== id),
    };
    setRoutine(newRoutine);
    setExerciseToRemove(null);
  };

  const setDuration = (
    type: 'preparationDuration' | 'breakDuration' | 'exerciseDuration',
    newDuration: number,
    exerciseId?: number,
  ) => {
    if (!routine) return;

    if (type === 'exerciseDuration' && exerciseId) {
      setRoutine({
        ...routine,
        exercises: routine.exercises.map((exercise) =>
          exercise.id === exerciseId
            ? { ...exercise, duration: newDuration }
            : exercise,
        ),
      });
    } else {
      setRoutine({ ...routine, [type]: newDuration });
    }
  };

  const deleteRoutine = async () => {
    if (!routine) return;

    try {
      const allRoutines = await getItem('allRoutines');
      const allRoutinesParsed = allRoutines ? JSON.parse(allRoutines) : [];

      const newAllRoutines = allRoutinesParsed.filter(
        (r: Routine) => r.id !== routine?.id,
      );

      await setItem('allRoutines', JSON.stringify(newAllRoutines));

      // Track if a default routine was voluntarily deleted
      if (routine.id === 'example') {
        const deletedDefaultRoutinesStr = await getItem(
          'deletedDefaultRoutines',
        );
        const deletedDefaultRoutines = deletedDefaultRoutinesStr
          ? JSON.parse(deletedDefaultRoutinesStr)
          : { example: false };

        if (routine.id === 'example') {
          deletedDefaultRoutines.example = true;
        }

        await setItem(
          'deletedDefaultRoutines',
          JSON.stringify(deletedDefaultRoutines),
        );
      }

      const currentIndex = allRoutinesParsed.findIndex(
        (savedRoutine: Routine) => savedRoutine.id === routine.id,
      );

      setRoutine(newAllRoutines[currentIndex - 1] || newAllRoutines[0]);
      setIsConfirmModalOpen(false);
      setKey((prev) => prev + 1);
    } catch (error) {
      console.error('Failed to delete routine:', error);
    }
  };

  const setExerciseName = (
    exerciseId: number,
    newName: string,
    index: number,
  ) => {
    if (!routine) return;

    const defaultName = `${t('exercise')} ${index + 1}`;
    const currentExercise = routine.exercises.find(
      (exercise) => exercise.id === exerciseId,
    );

    if (
      !currentExercise ||
      newName === currentExercise.name ||
      (newName === defaultName && !currentExercise.name)
    ) {
      return;
    }

    const finalName = newName === defaultName ? '' : newName;

    setRoutine({
      ...routine,
      exercises: routine.exercises.map((exercise) =>
        exercise.id === exerciseId
          ? { ...exercise, name: finalName }
          : exercise,
      ),
    });
  };

  const onDragEnd = (result: any) => {
    if (!result.destination || !routine) return;

    const items = Array.from(routine.exercises);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setRoutine({ ...routine, exercises: items });
  };

  const [exerciseToRemove, setExerciseToRemove] = useState<number | null>(null);
  const [editingExerciseId, setEditingExerciseId] = useState<number | null>(
    null,
  );
  const draggableRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const editDurationLineRefs = useRef<{
    [key: number]: EditDurationLineRef | null;
  }>({});

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (editingExerciseId !== null) {
        const currentDraggable = draggableRefs.current[editingExerciseId];
        if (
          currentDraggable &&
          !currentDraggable.contains(event.target as Node)
        ) {
          const input = currentDraggable.querySelector('input');
          if (input) {
            input.blur();
          }
          setEditingExerciseId(null);
          editDurationLineRefs.current[editingExerciseId]?.resetAutoFocus();
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editingExerciseId]);

  const toggleExercisePause = (exerciseId: number) => {
    if (!routine) return;
    setRoutine({
      ...routine,
      exercises: routine.exercises.map((exercise) =>
        exercise.id === exerciseId
          ? { ...exercise, isPaused: !exercise.isPaused }
          : exercise,
      ),
    });
  };

  const getExerciseDisplayName = (exercise: Exercise, index: number) => {
    if (exercise.isPaused && !exercise.name && !exercise.exerciseId) {
      return t('pausedExercise');
    }

    // Use translated name from library when exerciseId is set
    if (exercise.exerciseId) {
      const allExercises = getExercisesByLocale(currentLocale);
      const libraryExercise = allExercises.find(
        (ex) => ex.id === exercise.exerciseId,
      );
      if (libraryExercise?.name) {
        return libraryExercise.name;
      }
    }

    if (exercise.name) {
      return exercise.name;
    }

    const activeExerciseNumber = routine?.exercises.filter(
      (e, idx) => !e.isPaused && idx <= index,
    ).length;

    return `${t('exercise')} ${activeExerciseNumber}`;
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          flex: 1,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}
      key={key}
    >
      <Typography
        variant='h3'
        textAlign='center'
        sx={{ textTransform: 'uppercase' }}
      >
        {t('chooseRoutine')}
      </Typography>

      {hasNoRoutines ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flex: 1,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 4,
              flex: 1,
              textAlign: 'center',
            }}
          >
            <Typography variant='h5'>{tCommon('noRoutinesMessage')}</Typography>
            <Button
              variant={'contained'}
              size='large'
              component={Link}
              href='/new-routine'
            >
              {tCommon('createNewRoutineWithAI')}
            </Button>
          </Box>
        </Box>
      ) : (
        routine && (
          <>
            <SwitchRoutineTitle
              routine={routine}
              setRoutine={setRoutine}
              isEdition
            />

            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
              }}
            >
              <EditDurationLine
                name={t('preparationDuration')}
                nameVariant='h5'
                amount={routine.preparationDuration}
                setAmount={(amount) =>
                  setDuration('preparationDuration', amount)
                }
              />

              <EditDurationLine
                name={t('restDuration')}
                nameVariant='h5'
                amount={routine.breakDuration}
                setAmount={(amount) => setDuration('breakDuration', amount)}
              />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <Typography
                variant='h5'
                gutterBottom
                sx={{ textDecoration: 'underline' }}
              >
                {t('exercises')}
              </Typography>
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId='exercises'>
                  {(provided) => (
                    <Box {...provided.droppableProps} ref={provided.innerRef}>
                      {routine.exercises.map((exercise, index) => (
                        <Draggable
                          key={exercise.id}
                          draggableId={exercise.id.toString()}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <Box
                              ref={(el: HTMLDivElement | null) => {
                                provided.innerRef(el);
                                if (el) {
                                  draggableRefs.current[exercise.id] = el;
                                }
                              }}
                              {...provided.draggableProps}
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                p: 0.5,
                                borderBottom: '1px solid grey',
                                backgroundColor: exercise.isPaused
                                  ? 'action.disabledBackground'
                                  : snapshot.isDragging
                                    ? 'action.hover'
                                    : 'background.default',
                                boxShadow: snapshot.isDragging ? 2 : 'none',
                                opacity: exercise.isPaused ? 0.7 : 1,
                              }}
                            >
                              <Box
                                {...provided.dragHandleProps}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  cursor: 'grab',
                                }}
                              >
                                <DragIndicatorIcon
                                  sx={{ mr: 1, color: 'text.secondary' }}
                                />
                              </Box>
                              <EditDurationLine
                                ref={(el) => {
                                  if (el)
                                    editDurationLineRefs.current[exercise.id] =
                                      el;
                                }}
                                name={getExerciseDisplayName(exercise, index)}
                                isEdition
                                nameSx={{
                                  fontWeight: 700,
                                  color: exercise.isPaused
                                    ? 'text.disabled'
                                    : 'text.primary',
                                }}
                                amount={exercise.duration}
                                minAmount={5}
                                exerciseId={exercise.exerciseId}
                                setAmount={(amount) =>
                                  setDuration(
                                    'exerciseDuration',
                                    amount,
                                    exercise.id,
                                  )
                                }
                                setName={(name) =>
                                  setExerciseName(exercise.id, name, index)
                                }
                                isEditing={editingExerciseId === exercise.id}
                                setIsEditing={(isEditing) =>
                                  setEditingExerciseId(
                                    isEditing ? exercise.id : null,
                                  )
                                }
                              />

                              {editingExerciseId === exercise.id ? (
                                <>
                                  <IconButton
                                    sx={{ ml: 0.5 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleExercisePause(exercise.id);
                                    }}
                                  >
                                    {exercise.isPaused ? (
                                      <PlayCircleIcon color='primary' />
                                    ) : (
                                      <PauseCircleIcon />
                                    )}
                                  </IconButton>
                                  <IconButton
                                    sx={{ color: 'error.main', ml: 0.5 }}
                                    disabled={routine.exercises.length === 1}
                                    onClick={() =>
                                      setExerciseToRemove(exercise.id)
                                    }
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </>
                              ) : (
                                <IconButton
                                  sx={{ ml: 0.5 }}
                                  onClick={() =>
                                    setEditingExerciseId(exercise.id)
                                  }
                                >
                                  <MoreVertIcon />
                                </IconButton>
                              )}
                            </Box>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </Box>
                  )}
                </Droppable>
              </DragDropContext>
              <Box
                sx={{
                  mt: 2,
                  mb: 2.5,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Button
                  variant='outlined'
                  sx={{ px: 1, py: 0.5, minWidth: 'fit-content' }}
                  onClick={addExercise}
                >
                  {t('newExercise')}
                </Button>
                <ExerciseSelectionModal
                  open={isExerciseSelectionModalOpen}
                  onClose={() => setIsExerciseSelectionModalOpen(false)}
                  onSelectExercise={addExerciseFromLibrary}
                  onAddCustomExercise={addCustomExercise}
                  locale={currentLocale}
                />
                <Button
                  sx={{
                    p: 0,
                    minWidth: 'fit-content',
                    color: 'error.main',
                    textDecoration: 'underline',
                    fontWeight: 400,
                  }}
                  onClick={() => setIsConfirmModalOpen(true)}
                >
                  {t('delete')}
                </Button>
              </Box>
              <Button
                variant='contained'
                fullWidth
                sx={{ mt: 'auto' }}
                onClick={() => router.push('/practice')}
              >
                {t('letsGo')}
              </Button>
            </Box>
          </>
        )
      )}
      <ConfirmModal
        isOpen={exerciseToRemove !== null}
        handleClose={() => setExerciseToRemove(null)}
        confirmAction={() =>
          exerciseToRemove && removeExercise(exerciseToRemove)
        }
      >
        {t('deleteExercise')}
      </ConfirmModal>
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        handleClose={() => setIsConfirmModalOpen(false)}
        confirmAction={deleteRoutine}
      >
        {t('deleteRoutine')}
      </ConfirmModal>
    </Box>
  );
}
