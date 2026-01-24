import { Box, IconButton, Typography } from '@mui/material';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';

type Props = {
  name: string;
  amount: number;
  minAmount?: number;
  setAmount: (newAmount: number) => void;
};

export function EditModalLine({
  name,
  amount,
  minAmount = 1,
  setAmount,
}: Props) {
  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
      }}
    >
      <Typography>{name}</Typography>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 2,
        }}
      >
        <IconButton
          onClick={() => setAmount(amount - minAmount)}
          disabled={amount <= minAmount}
        >
          <RemoveIcon />
        </IconButton>
        <Typography sx={{ minWidth: '20px', textAlign: 'center' }}>
          {amount}
        </Typography>
        <IconButton onClick={() => setAmount(amount + minAmount)}>
          <AddIcon />
        </IconButton>
      </Box>
    </Box>
  );
}
