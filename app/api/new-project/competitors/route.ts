import { NextResponse, NextRequest } from 'next/server';
import z from 'zod';
import { getCompetitors } from '@/libs/ai/competitors/getCompetitors';
import { getDomainMetadata } from '@/libs/utils/urlAnalysis';
import { aiErrorToResponseInit, toAiError } from '@/libs/ai/errors';
import { Competitor } from './types';

export async function GET(req: NextRequest) {
  try {
    const { url, name, categories, targetLocation } = z
      .object({
        url: z.string(),
        name: z.string(),
        categories: z.array(z.string()),
        targetLocation: z.string().optional(),
      })
      .parse({
        url: req.nextUrl.searchParams.get('url'),
        name: req.nextUrl.searchParams.get('name'),
        categories: JSON.parse(req.nextUrl.searchParams.get('categories') ?? '[]'),
        targetLocation: req.nextUrl.searchParams.get('targetLocation') ?? undefined,
      });

    const competitors = await getCompetitors(url, name, categories, targetLocation);
    if (!competitors.length) throw new Error('Failed to find competitors');

    const competitorsWithIcons: Competitor[] = await Promise.all(
      competitors.map((competitor) =>
        getDomainMetadata(competitor.url)
          .then((metadata) => ({
            ...competitor,
            iconUrl: metadata.iconUrl ?? '',
          }))
          .catch(() => ({
            ...competitor,
            iconUrl: '',
          }))
      )
    );

    return NextResponse.json(competitorsWithIcons);
  } catch (error) {
    const aiError = toAiError(error, 'google');
    if (aiError) {
      const { body, status } = aiErrorToResponseInit(aiError);
      return NextResponse.json(body, { status });
    }

    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : error },
      { status: 500 }
    );
  }
}
