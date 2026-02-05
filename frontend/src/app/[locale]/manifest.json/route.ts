import { NextRequest, NextResponse } from 'next/server';
import { generateManifest } from '@/utils/manifest';
import { routing } from '@/i18n/routing';

export async function GET(
  request: NextRequest,
  { params }: { params: { locale: string } },
) {
  try {
    const { locale } = params;
    if (!routing.locales.includes(locale)) {
      return NextResponse.json({ error: 'Invalid locale' }, { status: 404 });
    }
    const manifest = await generateManifest(locale);

    return NextResponse.json(manifest, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error generating manifest:', error);
    return NextResponse.json(
      { error: 'Failed to generate manifest' },
      { status: 500 },
    );
  }
}
