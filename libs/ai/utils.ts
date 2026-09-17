import { NoObjectGeneratedError } from 'ai';
import { join } from 'path';
import { readFile } from 'fs/promises';

export function logNoObjectGeneratedError(error: NoObjectGeneratedError) {
  const cleanError = {
    cause: error.cause,
    text: error.text,
    response: error.response,
    usage: error.usage,
    finishReason: error.finishReason,
  };
  console.log('NoObjectGeneratedError', JSON.stringify(cleanError, null, 2));
}

export async function getPrompt(path: string) {
  // Scoped to `libs/ai` so the file tracer only includes prompt files
  // instead of the whole project (see Next.js "dynamic filesystem access" warning).
  const filePath = join(process.cwd(), 'libs/ai', path);
  return readFile(filePath, 'utf8');
}
