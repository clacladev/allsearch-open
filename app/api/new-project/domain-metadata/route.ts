import { NextResponse, NextRequest } from 'next/server';
import z from 'zod';
import { getDomainMetadata } from '@/libs/utils/urlAnalysis';

export async function GET(req: NextRequest) {
  try {
    const { url: inputUrl } = z.object({ url: z.string() }).parse({
      url: req.nextUrl.searchParams.get('url'),
    });

    const metadata = await getDomainMetadata(inputUrl);
    return NextResponse.json(metadata);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : error },
      { status: 500 }
    );
  }
}
