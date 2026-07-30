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

/** Logs an operation failure without ever printing the error itself: `setProviderKey` binds the
 * plaintext key as a query parameter, so even after `libs/database/Settings/queries.ts` guarantees
 * its own thrown errors are sanitized, this stays safe on its own rather than depending on that —
 * only a fixed label and the error's constructor name (never its message or stack) are logged. */
function logSettingsRouteError(operation: string, error: unknown): void {
  console.error(`${operation} failed:`, error instanceof Error ? error.name : typeof error);
}

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
    // Never echo `error.message` here: it may be a raw query failure carrying the key the caller
    // just tried to save as a bound parameter (see libs/database/Settings/queries.ts). A generic
    // message is safe by construction regardless of what threw.
    logSettingsRouteError('POST /api/settings/provider-keys', error);
    return NextResponse.json({ error: 'Failed to save the provider key.' }, { status: 500 });
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
    // See the POST handler above — never echo `error.message` to the client here either.
    logSettingsRouteError('DELETE /api/settings/provider-keys', error);
    return NextResponse.json({ error: 'Failed to remove the provider key.' }, { status: 500 });
  }
}
