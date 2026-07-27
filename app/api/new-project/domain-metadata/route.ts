import { NextResponse, NextRequest } from 'next/server';
import { getUserId, getUserOrThrow } from '@/libs/database/supabase/server';
import z from 'zod';
import { getPostHogServer, searchParamsToObject } from '@/libs/posthog';
import { getDomainMetadata } from '@/libs/utils/urlAnalysis';

export async function GET(req: NextRequest) {
  try {
    const { url: inputUrl } = z.object({ url: z.string() }).parse({
      url: req.nextUrl.searchParams.get('url'),
    });

    await getUserOrThrow();

    const metadata = await getDomainMetadata(inputUrl);
    return NextResponse.json(metadata);
  } catch (error) {
    console.error(error);
    getPostHogServer().captureException(
      error,
      await getUserId(),
      searchParamsToObject(req.nextUrl.searchParams)
    );
    return NextResponse.json(
      { error: error instanceof Error ? error.message : error },
      { status: 500 }
    );
  }
}
