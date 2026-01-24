import { Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { EditModalLine } from '@/app/_home/EditModalLine';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  exercisesAmount: number;
  setExercisesAmount: (amount: number) => void;
  exerciseTime: number;
  setExerciseTime: (time: number) => void;
  breakTime: number;
  setBreakTime: (time: number) => void;
  preparationTime: number;
  setPreparationTime: (time: number) => void;
};

export default function EditModal({
  isOpen,
  onClose,
  exercisesAmount,
  exerciseTime,
  setExercisesAmount,
  setExerciseTime,
  breakTime,
  setBreakTime,
  preparationTime,
  setPreparationTime,
}: Props) {
  return (
    <Dialog open={isOpen} onClose={onClose} fullWidth>
      <DialogTitle variant='h5' sx={{ fontWeight: 'bold' }}>
        Modification de la routine
        <IconButton
          aria-label='close'
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <EditModalLine
          name='Exercices'
          amount={exercisesAmount}
          setAmount={setExercisesAmount}
        />
        <EditModalLine
          name='Durée (en sec.)'
          amount={exerciseTime}
          minAmount={5}
          setAmount={setExerciseTime}
        />
        <EditModalLine
          name='Repos (en sec.)'
          amount={breakTime}
          setAmount={setBreakTime}
        />
        <EditModalLine
          name='Prépa. (en sec.)'
          amount={preparationTime}
          setAmount={setPreparationTime}
        />
      </DialogContent>
    </Dialog>
  );
}
