import { Container, Typography, Box } from '@mui/material';
import { Link } from '@/i18n/routing';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Use - Routines',
  description:
    'Terms of use for Routines app. Please read these terms before using our service.',
};

export default function TermsPage() {
  return (
    <Container maxWidth='xs' sx={{ py: 3, px: 2 }}>
      <Typography variant='h4' component='h1' gutterBottom fontWeight='bold'>
        Terms of Use
      </Typography>
      <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
        Last updated: February 2025
      </Typography>

      <Box sx={{ '& > *': { mb: 2 } }}>
        <Typography variant='h6' fontWeight='bold'>
          1. Acceptance of Terms
        </Typography>
        <Typography variant='body2'>
          By using Routines, you agree to these Terms of Use. If you do not
          agree, please do not use the app.
        </Typography>

        <Typography variant='h6' fontWeight='bold'>
          2. Description of Service
        </Typography>
        <Typography variant='body2'>
          Routines is an AI-powered stretching and mobility app that generates
          personalized routines based on your profile, calendar, and activities.
          It may integrate with Google Calendar and Strava.
        </Typography>

        <Typography variant='h6' fontWeight='bold'>
          3. Use of the Service
        </Typography>
        <Typography variant='body2'>
          You agree to use the app for personal, non-commercial purposes. The
          routines and exercises are provided for informational purposes only
          and do not constitute medical advice. Consult a healthcare
          professional before starting any fitness program.
        </Typography>

        <Typography variant='h6' fontWeight='bold'>
          4. Third-Party Integrations
        </Typography>
        <Typography variant='body2'>
          Use of Google Calendar and Strava is subject to their respective terms
          of service. We are not responsible for the availability or content of
          these third-party services.
        </Typography>

        <Typography variant='h6' fontWeight='bold'>
          5. Disclaimer
        </Typography>
        <Typography variant='body2'>
          The app is provided &quot;as is&quot; without warranties. We are not
          liable for any injury or damage resulting from the use of suggested
          exercises or routines.
        </Typography>

        <Typography variant='h6' fontWeight='bold'>
          6. Changes
        </Typography>
        <Typography variant='body2'>
          We may update these terms from time to time. Continued use of the app
          after changes constitutes acceptance.
        </Typography>

        <Typography variant='h6' fontWeight='bold'>
          7. Contact
        </Typography>
        <Typography variant='body2'>
          For questions about these terms, contact the developer: Pol Thomas.
        </Typography>
      </Box>

      <Box sx={{ mt: 4 }}>
        <Link
          href='/parameters'
          style={{ color: 'inherit', textDecoration: 'underline' }}
        >
          ← Back to app
        </Link>
      </Box>
    </Container>
  );
}
