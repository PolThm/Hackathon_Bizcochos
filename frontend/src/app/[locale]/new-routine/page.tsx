'use client';

import { useState } from 'react';
import { Box, Typography, TextField, Button } from '@mui/material';
import { useTranslations } from 'next-intl';

export default function NewRoutinePage() {
  const t = useTranslations('newRoutine');

  const [userInput, setUserInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateRoutine = async () => {
    if (!userInput.trim()) return;

    setIsGenerating(true);

    // TODO: Implement AI routine generation logic, then redirection here
    setTimeout(() => {
      console.log('Generating routine...');
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        flex: 1,
        maxWidth: '600px',
        mx: 'auto',
        gap: 2,
      }}
    >
      <Typography
        variant='h3'
        textAlign='center'
        sx={{ textTransform: 'uppercase', mb: 2 }}
      >
        {t('title')}
      </Typography>

      <Typography
        variant='h6'
        sx={{
          fontWeight: 500,
        }}
      >
        {t('description')}
      </Typography>

      <Typography
        variant='body1'
        sx={{
          color: 'text.secondary',
          lineHeight: 1.6,
          mb: 1,
        }}
      >
        {t('invitationText')}
      </Typography>

      <TextField
        fullWidth
        multiline
        rows={6}
        variant='outlined'
        placeholder={t('placeholder')}
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        sx={{
          mb: 3,
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
          },
        }}
      />

      <Button
        fullWidth
        variant='contained'
        size='large'
        onClick={handleGenerateRoutine}
        disabled={!userInput.trim() || isGenerating}
        sx={{
          mt: 'auto',
          py: 1.5,
          borderRadius: 2,
          fontWeight: 600,
        }}
      >
        {isGenerating ? t('generating') : t('generateButton')}
      </Button>
    </Box>
  );
}
