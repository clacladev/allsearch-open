import { NextResponse, NextRequest } from 'next/server';
import { OrganizationSchema } from '../types';
import {
  getOrganizationRowWithId,
  updateOrganizationRow,
} from '@/libs/database/Organizations/queries';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const { organizationId } = await params;
    if (!organizationId) return new Response('Missing organizationId', { status: 400 });

    const body = await req.json();
    const { type, url, name, iconUrl } = OrganizationSchema.parse(body);

    const organizationRow = await getOrganizationRowWithId(organizationId);
    if (!organizationRow) {
      throw new Error('Failed to get organization');
    }

    const updatedOrganizationRow = await updateOrganizationRow(organizationId, {
      type,
      url: url || null,
      name: name || null,
      icon_url: iconUrl || null,
    });
    if (!updatedOrganizationRow) throw new Error('Failed to update organization');

    return NextResponse.json(updatedOrganizationRow);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : error },
      { status: 500 }
    );
  }
}
