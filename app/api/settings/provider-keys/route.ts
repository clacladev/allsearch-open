import { NextResponse, NextRequest } from 'next/server';
import { validateProviderKey } from '@/libs/ai/validateProviderKey';
import {
  getRedactedProviderKeys,
  removeProviderKey,
  setProviderKey,
} from '@/libs/database/Settings/queries';
import {
  RemoveProviderKeyBodySchema,
  SetProviderKeyBodySchema,
  type RemoveProviderKeyResponse,
  type SetProviderKeyResponse,
} from './types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { provider, key } = SetProviderKeyBodySchema.parse(body);

    const validation = await validateProviderKey(provider, key);
    // A rejected key is never persisted — `validation.message` names the provider and is safe to
    // show as-is, and never contains the key value (see libs/ai/validateProviderKey.ts).
    if (validation.isRejected) {
      return NextResponse.json({ error: validation.message }, { status: 400 });
    }

    await setProviderKey(provider, key, validation.status);

    const response: SetProviderKeyResponse = {
      providerKeys: await getRedactedProviderKeys(),
      message: validation.message,
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

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { provider } = RemoveProviderKeyBodySchema.parse(body);

    await removeProviderKey(provider);

    const response: RemoveProviderKeyResponse = { providerKeys: await getRedactedProviderKeys() };
    return NextResponse.json(response);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : error },
      { status: 500 }
    );
  }
}
