import { Routine, Navigation } from '@/types';
import { Box, Typography, TextField } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import routineExampleEn from '@/mocks/routine-example-en.json';
import routineExampleFr from '@/mocks/routine-example-fr.json';
import routineExampleEs from '@/mocks/routine-example-es.json';
import { FC, useEffect, useState, useCallback } from 'react';
import ConfirmModal from '@/components/ConfirmModal';
import { useTranslations } from 'next-intl';
import { setItem, getItem } from '@/utils/indexedDB';
import { useParams } from 'next/navigation';

type Props = {
  routine: Routine;
  setRoutine: (routine: Routine) => void;
  isRunning?: boolean;
  isEdition?: boolean;
};

const SwitchRoutineTitle: FC<Props> = ({
  routine,
  setRoutine,
  isRunning,
  isEdition,
}) => {
  const params = useParams();
  const currentLocale = params.locale as string;
  const t = useTranslations('setup');
  const tc = useTranslations('common');
  const [allRoutines, setAllRoutines] = useState<Routine[]>();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(routine.name);
  const [isFirstRoutine, setIsFirstRoutine] = useState(false);
  const [isLastRoutine, setIsLastRoutine] = useState(false);
  const [currentRoutineIndex, setCurrentRoutineIndex] = useState(0);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

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

  const getRoutineDisplayName = useCallback(
    (routine: Routine) => {
      const defaultNames = {
        polux: [
          'Stretching & Musculation',
          'Étirements & Musculation',
          'Estiramientos & Musculación',
        ],
        example: ['Example', 'Exemple', 'Ejemplo'],
      };

      if (routine.id === 'polux' && defaultNames.polux.includes(routine.name)) {
        return tc('routinePolux');
      } else if (
        routine.id === 'example' &&
        defaultNames.example.includes(routine.name)
      ) {
        return tc('routineExample');
      } else if (routine.name === t('newRoutine')) {
        return `${routine.name} ${currentRoutineIndex + 1}`;
      } else {
        return routine.name;
      }
    },
    [currentRoutineIndex, t, tc],
  );

  useEffect(() => {
    if (!routine || !allRoutines) return;
    const currentIndex = allRoutines.findIndex(
      (savedRoutine: Routine) => savedRoutine.id === routine.id,
    );
    setCurrentRoutineIndex(currentIndex);
  }, [allRoutines, routine]);

  useEffect(() => {
    const loadRoutines = async () => {
      try {
        setEditedName(getRoutineDisplayName(routine));

        const savedAllRoutines = await getItem('allRoutines');
        const savedAllRoutinesParsed: Routine[] =
          savedAllRoutines && JSON.parse(savedAllRoutines);

        // If no saved routines, use default routines
        let newAllRoutines: Routine[] = savedAllRoutinesParsed || [
          getLocalizedRoutineExample(),
        ];

        // If we have saved routines, use them as-is
        if (savedAllRoutinesParsed) {
          newAllRoutines = savedAllRoutinesParsed;
        }

        setAllRoutines(newAllRoutines);
        setIsFirstRoutine(routine.id === newAllRoutines[0].id);
        setIsLastRoutine(
          routine.id === newAllRoutines[newAllRoutines.length - 1].id,
        );
        await setItem('allRoutines', JSON.stringify(newAllRoutines));
      } catch (error) {
        console.error('Failed to load routines:', error);
      }
    };

    loadRoutines();
  }, [
    routine,
    getRoutineDisplayName,
    getLocalizedRoutineExample,
    currentLocale,
    setRoutine,
  ]);

  const selectAnotherRoutine = async (navigation: Navigation) => {
    if (!routine || !allRoutines) return;

    let newOtherRoutine;
    if (navigation === Navigation.Prev) {
      newOtherRoutine = allRoutines?.[currentRoutineIndex - 1];
    } else {
      newOtherRoutine = allRoutines?.[currentRoutineIndex + 1];
    }

    const newAllRoutines = allRoutines?.map((savedRoutine: Routine) =>
      savedRoutine.id === routine.id ? routine : savedRoutine,
    );

    try {
      await setItem('allRoutines', JSON.stringify(newAllRoutines));

      const savedOtherRoutine = allRoutines.find(
        (savedRoutine: Routine) => savedRoutine.id === newOtherRoutine.id,
      );

      const newSavedRoutine = savedOtherRoutine ?? newOtherRoutine;

      await setItem('routine', JSON.stringify(newSavedRoutine));
      setRoutine(newSavedRoutine);
    } catch (error) {
      console.error('Failed to switch routine:', error);
    }
  };

  const editName = (newName: string) => {
    setEditedName((prevName) => (prevName !== newName ? newName : prevName));
  };

  const handleNameChange = async () => {
    if (!editedName) return setIsEditing(false);
    const trimmedName = editedName.trim();
    setEditedName(trimmedName);
    if (trimmedName === routine.name) return setIsEditing(false);
    const updatedRoutine = { ...routine, name: trimmedName };
    setRoutine(updatedRoutine);

    try {
      const savedAllRoutines = await getItem('allRoutines');
      const savedAllRoutinesParsed: Routine[] =
        savedAllRoutines && JSON.parse(savedAllRoutines);

      if (savedAllRoutinesParsed) {
        const newAllRoutines = savedAllRoutinesParsed.map(
          (savedRoutine: Routine) =>
            savedRoutine.id === routine.id ? updatedRoutine : savedRoutine,
        );
        await setItem('allRoutines', JSON.stringify(newAllRoutines));
      }

      await setItem('routine', JSON.stringify(updatedRoutine));
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save routine name:', error);
    }
  };

  const addNewRoutine = async () => {
    if (!allRoutines) return;

    const newRoutine = {
      id: Date.now(),
      name: t('newRoutine'),
      breakDuration: 5,
      preparationDuration: 5,
      exercises: [
        {
          id: 1,
          name: '',
          duration: 30,
        },
      ],
    };

    const newAllRoutines = [...allRoutines, newRoutine];

    try {
      await setItem('allRoutines', JSON.stringify(newAllRoutines));
      await setItem('routine', JSON.stringify(newRoutine));
      setRoutine(newRoutine);
      setIsConfirmModalOpen(false);
    } catch (error) {
      console.error('Failed to add new routine:', error);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1,
        width: '100%',
        minHeight: '80px',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <IconButton
        onClick={() => selectAnotherRoutine(Navigation.Prev)}
        disabled={isFirstRoutine || isRunning}
      >
        <ArrowBackIcon />
      </IconButton>
      {isEditing ? (
        <TextField
          value={editedName}
          onChange={(e) => editName(e.target.value)}
          onBlur={handleNameChange}
          autoFocus
          variant='standard'
          InputProps={{ style: { fontSize: '1.5rem', fontWeight: 500 } }}
        />
      ) : (
        <Typography
          variant='h2'
          textAlign='center'
          sx={{ mt: 0.5, cursor: isEdition ? 'pointer' : 'auto' }}
          onClick={() => isEdition && setIsEditing(true)}
        >
          {getRoutineDisplayName(routine)}
        </Typography>
      )}
      {/* // TODO: Redirect to new-routine page when AI routine generation is implemented */}
      {isLastRoutine && isEdition ? (
        <IconButton onClick={() => setIsConfirmModalOpen(true)}>
          <AddCircleIcon />
        </IconButton>
      ) : (
        <IconButton
          onClick={() => selectAnotherRoutine(Navigation.Next)}
          disabled={isLastRoutine || isRunning}
        >
          <ArrowForwardIcon />
        </IconButton>
      )}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        handleClose={() => setIsConfirmModalOpen(false)}
        confirmAction={addNewRoutine}
        color='primary'
        invertButtons
      >
        {t('createNewRoutine')}
      </ConfirmModal>
    </Box>
  );
};

export default SwitchRoutineTitle;
