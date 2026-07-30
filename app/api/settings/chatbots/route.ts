import { NextResponse, NextRequest } from 'next/server';
import {
  getStoredEnabledChatbotIds,
  setStoredEnabledChatbotIds,
} from '@/libs/database/Settings/queries';
import { SetEnabledChatbotIdsBodySchema, type SetEnabledChatbotIdsResponse } from './types';

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { chatbotIds } = SetEnabledChatbotIdsBodySchema.parse(body);

    await setStoredEnabledChatbotIds(chatbotIds);

    const response: SetEnabledChatbotIdsResponse = {
      chatbotIds: await getStoredEnabledChatbotIds(),
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
