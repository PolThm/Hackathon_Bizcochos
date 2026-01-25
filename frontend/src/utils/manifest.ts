// Script to generate manifest.json with translations
// This script will be used by Next.js to generate the manifest dynamically

import { getMessages } from 'next-intl/server';
import { AbstractIntlMessages } from 'next-intl';

export async function generateManifest(locale: string) {
  const messages = await getMessages();
  const metadata = (
    messages as AbstractIntlMessages & {
      metadata?: {
        description: string;
        title: string;
        subtitle: string;
      };
    }
  ).metadata;

  const pwa = (
    messages as AbstractIntlMessages & {
      pwa?: {
        shortcuts?: {
          newRoutine?: {
            name: string;
            description: string;
          };
        };
      };
    }
  ).pwa;

  return {
    name: metadata?.title || 'Routines',
    short_name: 'Routines',
    description:
      metadata?.description ||
      'Stretching app powered by AI. By Pol Thomas & Alessio Pelliccione.',
    theme_color: '#0D0509',
    background_color: '#ffffff',
    display: 'standalone',
    orientation: 'portrait-primary',
    scope: '/',
    start_url: `/${locale}`,
    lang: locale,
    categories: ['productivity', 'lifestyle', 'utilities'],
    icons: [
      {
        src: '/icons-192.png',
        type: 'image/png',
        sizes: '192x192',
        purpose: 'any maskable',
      },
      {
        src: '/icons-256.png',
        type: 'image/png',
        sizes: '256x256',
        purpose: 'any maskable',
      },
      {
        src: '/icons-512.png',
        type: 'image/png',
        sizes: '512x512',
        purpose: 'any maskable',
      },
    ],
    screenshots: [
      {
        src: '/icons-512.png',
        type: 'image/png',
        sizes: '512x512',
        form_factor: 'narrow',
      },
    ],
  };
}
