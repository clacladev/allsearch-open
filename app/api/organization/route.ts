import { NextResponse, NextRequest } from 'next/server';
import { OrganizationSchema, UpdateOrganizationResponse } from './types';
import { getOrganization, insertOrganizationRow } from '@/libs/database/Organizations/queries';
import { OrganizationType } from '@/libs/database/Organizations/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, url, name, iconUrl } = OrganizationSchema.parse(body);

    let organizationRow = await getOrganization();
    const isUpdate = !!organizationRow;

    if (!organizationRow) {
      const isAgency = type === OrganizationType.Agency;
      organizationRow = await insertOrganizationRow({
        type,
        url: isAgency ? url || null : null,
        name: isAgency ? name || null : null,
        icon_url: isAgency ? iconUrl || null : null,
      });
    }

    const response: UpdateOrganizationResponse = {
      organizationId: organizationRow.id,
      isUpdate,
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : error },
      { status: 500 }
    );
  }
}
