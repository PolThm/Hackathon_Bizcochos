import React, {
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { Box, IconButton, Typography, TextField } from '@mui/material';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

export interface EditDurationLineRef {
  resetAutoFocus: () => void;
}

type Props = {
  name: string;
  isEdition?: boolean;
  nameVariant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body1' | 'body2';
  nameSx?: object;
  amount: number;
  minAmount?: number;
  isEditing?: boolean;
  exerciseId?: string;
  setAmount: (newAmount: number) => void;
  setName?: (newName: string) => void;
  setIsEditing?: (newIsEditing: boolean) => void;
};

const EditDurationLine = forwardRef<EditDurationLineRef, Props>(
  (
    {
      name,
      isEdition,
      nameVariant = 'body1',
      nameSx = {},
      amount,
      minAmount = 1,
      isEditing = false,
      exerciseId,
      setAmount,
      setName = () => {},
      setIsEditing = () => {},
    },
    ref,
  ) => {
    const [editedName, setEditedName] = useState(name);
    const [autoFocus, setAutoFocus] = useState(false);
    const t = useTranslations('setup');

    useImperativeHandle(ref, () => ({
      resetAutoFocus: () => setAutoFocus(false),
    }));

    useEffect(() => {
      setEditedName(name);
    }, [name]);

    const handleNameChange = () => {
      setAutoFocus(false);
      setEditedName((prev) => prev.trim());
      setName(editedName.trim());
    };

    return (
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 0.5,
        }}
      >
        {isEditing && !(name === t('pausedExercise')) ? (
          <TextField
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onBlur={handleNameChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleNameChange();
              }
            }}
            autoFocus={autoFocus}
            variant='standard'
            inputProps={{
              style: {
                fontWeight: 500,
                fontSize: 16,
                transform: 'scale(0.875)',
                transformOrigin: 'left center',
              },
            }}
          />
        ) : exerciseId && !isEditing ? (
          <Typography
            component={Link}
            href={`/exercise/${exerciseId}?from=setup`}
            variant={nameVariant}
            sx={{
              ...nameSx,
              textDecoration: 'underline',
              cursor: 'pointer',
              color: 'primary.main',
              '&:hover': {
                color: 'primary.dark',
              },
            }}
          >
            {editedName}
          </Typography>
        ) : (
          <Typography
            variant={nameVariant}
            sx={{
              ...nameSx,
              cursor:
                isEdition && !(name === t('pausedExercise'))
                  ? 'pointer'
                  : 'auto',
            }}
            onClick={() => {
              if (isEdition && !(name === t('pausedExercise'))) {
                setIsEditing(true);
                setAutoFocus(true);
              }
            }}
          >
            {editedName}
          </Typography>
        )}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 0.5,
          }}
        >
          {(!isEdition || isEditing) && (
            <>
              <IconButton
                onClick={() => setAmount(amount - minAmount)}
                disabled={amount <= minAmount}
              >
                <RemoveIcon />
              </IconButton>
              <Typography sx={{ minWidth: '25px', textAlign: 'center' }}>
                {amount}s
              </Typography>
              <IconButton onClick={() => setAmount(amount + minAmount)}>
                <AddIcon />
              </IconButton>
            </>
          )}
          {isEdition && !isEditing && (
            <Typography sx={{ minWidth: '25px', textAlign: 'center' }}>
              {amount}s
            </Typography>
          )}
        </Box>
      </Box>
    );
  },
);

EditDurationLine.displayName = 'EditDurationLine';

export { EditDurationLine };
