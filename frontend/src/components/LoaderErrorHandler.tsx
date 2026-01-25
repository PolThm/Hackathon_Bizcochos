import {
  Box,
  CircularProgress,
  SxProps,
  Theme,
  Typography,
} from '@mui/material';
import { FC } from 'react';
import { useTranslations } from 'next-intl';

type Props = {
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  sx?: SxProps<Theme>;
};

const LoadingErrorHandler: FC<Props> = ({
  isLoading,
  isError,
  errorMessage,
  sx,
}) => {
  const t = useTranslations('common');
  const defaultSx: SxProps<Theme> = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  };

  if (!isLoading && !isError) return null;

  return (
    <Box sx={{ ...defaultSx, ...sx }}>
      {isLoading && <CircularProgress />}
      {isError && (
        <Typography variant='body1'>{errorMessage ?? t('error')}</Typography>
      )}
    </Box>
  );
};

export default LoadingErrorHandler;
