import { NextResponse, NextRequest } from 'next/server';
import { getUserOrThrow } from '@/libs/database/supabase/server';
import z from 'zod';
import { getTopicsIdeas } from '@/libs/ai/topicsIdeas/getTopicsIdeas';

export async function GET(req: NextRequest) {
  try {
    const { url, name } = z.object({ url: z.string(), name: z.string() }).parse({
      url: req.nextUrl.searchParams.get('url'),
      name: req.nextUrl.searchParams.get('name'),
    });

    await getUserOrThrow();

    const ideas = await getTopicsIdeas(url, name);
    if (!ideas.length) throw new Error('Failed to create topics ideas');
    return NextResponse.json(ideas);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : error },
      { status: 500 }
    );
  }
}
