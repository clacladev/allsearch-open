import { NextRequest, NextResponse } from 'next/server';
import z from 'zod';
import { checkAICrawlability } from '@/libs/aiCrawlChecker';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  url: z.string().min(1).max(2048),
});

export async function POST(req: NextRequest) {
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  try {
    const result = await checkAICrawlability(body.url);

    if (result.errorCategory) {
      const status = result.errorCategory === 'invalid_url' ? 400 : 200;
      return NextResponse.json(result, { status });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[ai-crawl-checker] unexpected error', error);
    return NextResponse.json(
      { error: 'Something went wrong checking that site' },
      { status: 500 }
    );
  }
}
