import { Box, Button, Modal, Typography } from '@mui/material';
import { FC } from 'react';
import { useTranslations } from 'next-intl';

import LoadingErrorHandler from '@/components/LoaderErrorHandler';

type Props = {
  children: string;
  isOpen: boolean;
  handleClose: () => void;
  confirmAction: () => void;
  isLoading?: boolean;
  isError?: boolean;
  color?: 'primary' | 'secondary' | 'error';
  variant?: 'text' | 'outlined' | 'contained';
  invertButtons?: boolean;
};

const ConfirmModal: FC<Props> = ({
  children,
  isOpen,
  handleClose,
  confirmAction,
  isLoading,
  isError,
  color = 'error',
  variant = 'contained',
  invertButtons,
}) => {
  const t = useTranslations('common');

  const buttons = [
    <Button
      key='confirm'
      onClick={confirmAction}
      size='small'
      color={color}
      variant={variant}
      fullWidth
      sx={{ minWidth: 'auto' }}
    >
      {t('confirm')}
    </Button>,
    <Button
      key='cancel'
      onClick={handleClose}
      size='small'
      variant='outlined'
      fullWidth
      sx={{ minWidth: 'auto' }}
    >
      {t('cancel')}
    </Button>,
  ];

  return (
    <Modal open={isOpen} onClose={handleClose}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '90vw', sm: 550 },
          backgroundColor: 'background.default',
          boxShadow: 24,
          p: 2,
          borderRadius: 2,
        }}
      >
        <LoadingErrorHandler isLoading={isLoading} isError={isError} />
        {!isLoading && !isError && (
          <Typography variant='h6' component='h2'>
            {children}
          </Typography>
        )}

        <Box
          sx={{
            mt: 2,
            display: 'flex',
            justifyContent: 'space-around',
            gap: 2,
          }}
        >
          {invertButtons ? buttons.reverse() : buttons}
        </Box>
      </Box>
    </Modal>
  );
};

export default ConfirmModal;
