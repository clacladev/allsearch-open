import { NextResponse, NextRequest } from 'next/server';
import { getUserId, getUserOrThrow } from '@/libs/database/supabase/server';
import { getPostHogServer, searchParamsToObject } from '@/libs/posthog';
import { OrganizationSchema, UpdateOrganizationResponse } from './types';
import {
  getOrganizationRowWithOwnerId,
  insertOrganizationRow,
} from '@/libs/database/Organizations/queries';
import { OrganizationType } from '@/libs/database/Organizations/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, url, name, iconUrl } = OrganizationSchema.parse(body);

    const user = await getUserOrThrow();

    let organizationRow = await getOrganizationRowWithOwnerId(user.id);
    const isUpdate = !!organizationRow;

    if (!organizationRow) {
      const isAgency = type === OrganizationType.Agency;
      organizationRow = await insertOrganizationRow({
        type,
        url: isAgency ? url || null : null,
        name: isAgency ? name || null : null,
        icon_url: isAgency ? iconUrl || null : null,
        owner_id: user.id,
      });
    }

    const response: UpdateOrganizationResponse = {
      organizationId: organizationRow.id,
      isUpdate,
    };
    return NextResponse.json(response);
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
