import { Container, Typography, Box } from '@mui/material';
import { Link } from '@/i18n/routing';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - Routines',
  description:
    'Privacy policy for Routines app. We explain how we collect, use and protect your data.',
};

export default function PrivacyPage() {
  return (
    <Container maxWidth='xs' sx={{ py: 3, px: 2 }}>
      <Typography variant='h4' component='h1' gutterBottom fontWeight='bold'>
        Privacy Policy
      </Typography>
      <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
        Last updated: February 2025
      </Typography>

      <Box sx={{ '& > *': { mb: 2 } }}>
        <Typography variant='h6' fontWeight='bold'>
          1. Introduction
        </Typography>
        <Typography variant='body2'>
          Routines (&quot;we&quot;, &quot;our&quot;, or &quot;the app&quot;) is
          a stretching and mobility app powered by AI. We respect your privacy
          and are committed to protecting your personal data.
        </Typography>

        <Typography variant='h6' fontWeight='bold'>
          2. Data We Collect
        </Typography>
        <Typography variant='body2'>
          We collect and process the following data to provide and improve our
          services:
        </Typography>
        <Typography variant='body2' component='ul' sx={{ pl: 3 }}>
          <li>
            Profile information: name, fitness level, goals, limitations (stored
            locally)
          </li>
          <li>
            Google Calendar: we read your calendar events to find free slots and
            create new events for your routines (with your consent)
          </li>
          <li>
            Strava: we read your workout activities to adapt routine intensity
            (with your consent)
          </li>
          <li>
            Location: used to provide weather context for your routines
            (optional)
          </li>
        </Typography>

        <Typography variant='h6' fontWeight='bold'>
          3. How We Use Your Data
        </Typography>
        <Typography variant='body2'>
          Your data is used solely to generate personalized stretching routines,
          suggest optimal scheduling based on your calendar, and adapt content
          to your fitness level and activities.
        </Typography>

        <Typography variant='h6' fontWeight='bold'>
          4. Data Storage & Sharing
        </Typography>
        <Typography variant='body2'>
          Profile data is stored locally on your device. Calendar and Strava
          data are accessed in real-time via OAuth and are not permanently
          stored on our servers. We do not sell or share your personal data with
          third parties for marketing purposes.
        </Typography>

        <Typography variant='h6' fontWeight='bold'>
          5. Third-Party Services
        </Typography>
        <Typography variant='body2'>
          We use Google Calendar API, Strava API, Open-Meteo for weather, and AI
          services (e.g. Google Gemini) for routine generation. Each service has
          its own privacy policy.
        </Typography>

        <Typography variant='h6' fontWeight='bold'>
          6. Your Rights
        </Typography>
        <Typography variant='body2'>
          You can revoke access to Google Calendar and Strava at any time from
          your account settings. You can reset or delete your profile data from
          the app parameters.
        </Typography>

        <Typography variant='h6' fontWeight='bold'>
          7. Contact
        </Typography>
        <Typography variant='body2'>
          For questions about this privacy policy, contact the developer: Pol
          Thomas.
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
