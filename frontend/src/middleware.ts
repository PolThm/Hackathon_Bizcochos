import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const PREFERRED_LOCALE_COOKIE = 'preferred-locale';
const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const preferredLocale = request.cookies.get(PREFERRED_LOCALE_COOKIE)?.value;
  if (preferredLocale && routing.locales.includes(preferredLocale)) {
    const pathname = request.nextUrl.pathname;
    const segments = pathname.split('/').filter(Boolean);
    const currentLocale = segments[0];
    const hasLocaleInPath = routing.locales.includes(currentLocale);
    const urlLocale = hasLocaleInPath ? currentLocale : routing.defaultLocale;
    if (urlLocale !== preferredLocale) {
      const rest = hasLocaleInPath ? segments.slice(1) : segments;
      const newPath = rest.length
        ? `/${preferredLocale}/${rest.join('/')}`
        : `/${preferredLocale}`;
      return NextResponse.redirect(new URL(newPath, request.url));
    }
  }
  return intlMiddleware(request);
}

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(en|fr|es)/:path*'],
};
