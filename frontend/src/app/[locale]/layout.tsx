import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import type { Metadata, Viewport } from 'next';
import '@/app/[locale]/_global/globals.css';
import theme from '@/app/[locale]/_global/theme';
import Navbar from '@/app/[locale]/_global/Navbar';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v13-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ReactNode } from 'react';
import { Container } from '@mui/material';
import { ConsecutiveDaysProvider } from '@/contexts/ConsecutiveDaysContext';
import { PullToRefreshProvider } from '@/contexts/PullToRefreshContext';
import { AbstractIntlMessages } from 'next-intl';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import OfflineIndicator from '@/components/OfflineIndicator';
import AppInitializer from '@/components/AppInitializer';
import PullToRefreshWrapper from '@/components/PullToRefreshWrapper';
import { PostHogProvider } from '@/components/PostHogProvider';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
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

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || 'https://routines-ai.vercel.app';
  const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;

  return {
    metadataBase: new URL(siteUrl),
    title: metadata?.title || 'Routines',
    description:
      metadata?.description ||
      'Stretching app powered by AI. By Pol Thomas & Alessio Pelliccione.',
    manifest: `/${locale}/manifest.json`,
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black',
      title: 'Routines',
    },
    other: {
      'apple-mobile-web-app-orientation': 'portrait',
      'apple-mobile-web-app-status-bar-style': 'black',
      'mobile-web-app-capable': 'yes',
      'theme-color': '#0D0509',
      'og:image:width': '1200',
      'og:image:height': '630',
      'og:image:type': 'image/png',
    },
    icons: {
      icon: [
        { url: '/icons-192.png', sizes: '192x192', type: 'image/png' },
        { url: '/icons-256.png', sizes: '256x256', type: 'image/png' },
        { url: '/icons-512.png', sizes: '512x512', type: 'image/png' },
      ],
      apple: [
        { url: '/icons-192.png', sizes: '192x192', type: 'image/png' },
        { url: '/icons-256.png', sizes: '256x256', type: 'image/png' },
        { url: '/icons-512.png', sizes: '512x512', type: 'image/png' },
      ],
    },
    ...(googleVerification && {
      verification: { google: googleVerification },
    }),
    openGraph: {
      title: metadata?.title || 'Routines',
      description:
        metadata?.description ||
        'Stretching app powered by AI. By Pol Thomas & Alessio Pelliccione.',
      type: 'website',
      url: siteUrl,
      siteName: 'Routines',
      images: [
        {
          url: 'https://i.ibb.co/Xkpsrp6R/og-image.png',
          width: 1200,
          height: 630,
          alt: 'Routines App',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: metadata?.title || 'Routines - Daily Routine Manager',
      description:
        metadata?.description ||
        'Stretching app powered by AI. By Pol Thomas & Alessio Pelliccione.',
      images: ['https://i.ibb.co/Xkpsrp6R/og-image.png'],
    },
  };
}

export function generateViewport(): Viewport {
  return {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: '#0D0509',
  };
}

export default async function RootLayout({
  children,
  params: { locale },
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <PostHogProvider>
          <AppRouterCacheProvider options={{ key: 'css' }}>
            <ThemeProvider theme={theme}>
              <CssBaseline />
              <ConsecutiveDaysProvider>
                <AppInitializer />
                <NextIntlClientProvider messages={messages}>
                  <PullToRefreshProvider>
                    <Container
                      maxWidth='xs'
                      disableGutters
                      sx={{
                        minHeight: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        border: { sm: '1px solid' },
                        borderColor: 'secondary.main',
                      }}
                    >
                      <Navbar />
                      <PullToRefreshWrapper>{children}</PullToRefreshWrapper>
                    </Container>
                  </PullToRefreshProvider>
                  <PWAInstallPrompt />
                  <OfflineIndicator />
                </NextIntlClientProvider>
              </ConsecutiveDaysProvider>
            </ThemeProvider>
          </AppRouterCacheProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
