'use client';

import { Box, Card, CardContent, Typography, Chip } from '@mui/material';
import Image from 'next/image';
import { Link } from '@/i18n/routing';

interface Exercise {
  id: string;
  name: string;
  image: string;
  instructions: string[];
  tips: string[];
  modifications: string[];
  benefits: string[];
}

interface LibraryExercisePreviewProps {
  exercise: Exercise;
  disableLink?: boolean;
  hideBadges?: boolean;
  smallImage?: boolean;
}

export default function LibraryExercisePreview({
  exercise,
  disableLink = false,
  hideBadges = false,
  smallImage = false,
}: LibraryExercisePreviewProps) {
  const benefitsList = exercise.benefits[0]
    ? exercise.benefits[0].split(', ').filter(Boolean)
    : [];

  const imageMaxWidth = smallImage ? 80 : 160;

  const cardContent = (
    <>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 2,
          paddingTop: 2,
          paddingBottom: 2,
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            maxWidth: imageMaxWidth,
            aspectRatio: '1 / 1',
            borderRadius: '50%',
            backgroundColor: 'background.default',
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Image
            src={exercise.image}
            alt={exercise.name}
            fill
            style={{
              objectFit: 'cover',
            }}
            sizes={`${imageMaxWidth}px`}
          />
        </Box>
      </Box>
      <CardContent
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          paddingTop: 0,
          paddingBottom: hideBadges ? '8px !important' : '',
          minHeight: 0,
          '&:last-child': {
            paddingBottom: 2,
          },
        }}
      >
        <Typography
          variant='h6'
          component='h3'
          gutterBottom
          fontWeight={600}
          sx={{
            fontSize: smallImage ? '1rem' : '1.1rem',
            lineHeight: 1.3,
            mb: 1,
            color: 'text.primary',
            flexShrink: 0,
          }}
        >
          {exercise.name}
        </Typography>
        {!hideBadges && benefitsList.length > 0 && (
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 0.75,
              flexShrink: 0,
            }}
          >
            {benefitsList.map((benefit, index) => (
              <Chip
                key={index}
                label={benefit.trim()}
                size='small'
                sx={{
                  fontSize: '0.7rem',
                  height: '24px',
                  fontWeight: 500,
                  backgroundColor: 'action.hover',
                  color: 'text.secondary',
                  '& .MuiChip-label': {
                    paddingX: 1,
                  },
                }}
              />
            ))}
          </Box>
        )}
      </CardContent>
    </>
  );

  if (disableLink) {
    return (
      <Card
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          borderRadius: 3,
          overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          border: '1px solid',
          borderColor: 'divider',
          width: '100%',
          '&:hover': {
            boxShadow: 8,
            borderColor: 'primary.main',
            cursor: 'pointer',
          },
        }}
      >
        {cardContent}
      </Card>
    );
  }

  return (
    <Card
      component={Link}
      href={`/exercise/${exercise.id}`}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderRadius: 3,
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        border: '1px solid',
        borderColor: 'divider',
        textDecoration: 'none',
        color: 'inherit',
        '&:hover': {
          boxShadow: 8,
          borderColor: 'primary.main',
          cursor: 'pointer',
        },
      }}
    >
      {cardContent}
    </Card>
  );
}
