import { getUserId } from '@/libs/database/supabase/server';
import { NextResponse, NextRequest } from 'next/server';
import { getPostHogServer, searchParamsToObject } from '@/libs/posthog';
import { config } from '@/config';
import { ImageResponse } from 'next/og';
import { createElement } from 'react';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const title =
      req.nextUrl.searchParams.get('title')?.slice(0, 200) || config.appDescription;
    const description = '';
    const origin = config.domainName.startsWith('localhost')
      ? `http://${config.domainName}`
      : `https://${config.domainName}`;
    const icon = `${origin}/index/opengraph/icon.png`;

    return new ImageResponse(
      createElement(
        'div',
        {
          style: {
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '56px',
            background:
              'linear-gradient(to top right, rgb(170 235 200), rgb(85 200 145), rgb(122 218 165))',
            color: 'rgb(18 48 36)',
            fontFamily: 'Inter, sans-serif',
          },
        },
        createElement(
          'div',
          {
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
            },
          },
          createElement('img', { src: icon, width: 96, height: 96, alt: 'logo' }),
          createElement(
            'span',
            { style: { fontSize: 36, fontWeight: 700 } },
            config.appNameWithDomain
          )
        ),
        createElement(
          'div',
          {
            style: {
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              maxWidth: '1020px',
            },
          },
          createElement(
            'span',
            { style: { fontSize: 64, fontWeight: 700, lineHeight: 1.1 } },
            title
          ),
          createElement(
            'span',
            { style: { fontSize: 36, fontWeight: 400, lineHeight: 1.2 } },
            description
          )
        )
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          'Cache-Control': 'public, max-age=3600',
        },
      }
    );
  } catch (e) {
    console.error(e);
    getPostHogServer().captureException(
      e,
      await getUserId(),
      searchParamsToObject(req.nextUrl.searchParams)
    );
    return NextResponse.json({ error: e instanceof Error ? e.message : e }, { status: 500 });
  }
}
