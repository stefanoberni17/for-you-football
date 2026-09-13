import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** Build corrente (commit Vercel): AppResume la confronta per capire se la PWA ha in mano un bundle vecchio. */
export async function GET() {
  return NextResponse.json(
    { build: process.env.VERCEL_GIT_COMMIT_SHA || process.env.NEXT_PUBLIC_BUILD_ID || 'dev' },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
