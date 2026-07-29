import { NextResponse, NextRequest } from 'next/server';
import z from 'zod';
import { getTopicsIdeas } from '@/libs/ai/topicsIdeas/getTopicsIdeas';
import { aiErrorToResponseInit, toAiError } from '@/libs/ai/errors';

export async function GET(req: NextRequest) {
  try {
    const { url, name } = z.object({ url: z.string(), name: z.string() }).parse({
      url: req.nextUrl.searchParams.get('url'),
      name: req.nextUrl.searchParams.get('name'),
    });

    const ideas = await getTopicsIdeas(url, name);
    if (!ideas.length) throw new Error('Failed to create topics ideas');
    return NextResponse.json(ideas);
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
