import { NextResponse, NextRequest } from 'next/server';
import { getUserOrThrow } from '@/libs/database/supabase/server';
import z from 'zod';
import { getPromptsIdeas } from '@/libs/ai/promptsIdeas/getPromptsIdeas';

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

    await getUserOrThrow();

    const ideas = await getPromptsIdeas(url, name, categories, targetLocation);
    if (!ideas.length) throw new Error('Failed to create prompt groups ideas');
    return NextResponse.json(ideas);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : error },
      { status: 500 }
    );
  }
}
