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
  const filePath = join(process.cwd(), path);
  return readFile(filePath, 'utf8');
}
