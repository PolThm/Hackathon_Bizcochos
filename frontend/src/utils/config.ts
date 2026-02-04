export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4200';
export const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  '32435939799-fjg0m0kkn13rhh9euftrchlv4qf2eloj.apps.googleusercontent.com';
export const STRAVA_CLIENT_ID =
  process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID || '144005';
export const STRAVA_REDIRECT_URI =
  process.env.NEXT_PUBLIC_STRAVA_REDIRECT_URI ||
  (typeof window !== 'undefined'
    ? `${window.location.origin}/onboarding`
    : 'http://localhost:3000/onboarding');
