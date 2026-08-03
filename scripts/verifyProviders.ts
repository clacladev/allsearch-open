/**
 * Live acceptance gate for issue 07 (direct provider layer).
 *
 * Proves that search grounding survived the move off the Vercel AI Gateway by
 * calling the REAL Chatbot adapters (ChatGPT, Google AI Overview, Perplexity)
 * with a fixed brand-style prompt, plus one direct Gemini structured-output
 * call. Reports the CITED source count (`response.sources`) and the
 * USED-BUT-NOT-CITED count (the `web_search` `toolResults` path — see
 * libs/ai/responseSources.ts) SEPARATELY, because a silent drop
 * of the latter degrades AllSearch "Opportunities" while everything else
 * still looks fine.
 *
 * Reads provider keys from the environment. Bun loads `.env` / `.env.local`
 * automatically — no dotenv wiring needed, and none exists elsewhere in this
 * repo. See `.env.example` for the three key names.
 *
 * Run: bun run verify:providers
 *
 * Never prints key values. Skips any Chatbot whose key is absent. Exits
 * non-zero if a Chatbot whose key IS present throws, returns zero sources, or
 * (ChatGPT only) returns zero used-but-not-cited sources.
 */

import { GenerateTextResult } from 'ai';
import { getPromptResponseWithChatGPT } from '../libs/ai/projectPrompt/getPromptResponseWithChatGPT';
import { getPromptResponseWithGoogleAIMode } from '../libs/ai/projectPrompt/getPromptResponseWithGoogleAIMode';
import { getPromptResponseWithPerplexity } from '../libs/ai/projectPrompt/getPromptResponseWithPerplexity';
import { getSourcesFromResponse } from '../libs/ai/responseSources';
import { analyzeResponseSentiment } from '../libs/ai/sentimentAnalysis';
import { getProviderKey, MissingProviderKeyError, ProviderId } from '../libs/ai/models';
import { parseTargetLocation } from '../libs/ai/userLocation';

const PROMPT = 'What are the best project management tools for small agencies?';

// Fixed location for the ChatGPT call — the shape our mapper emits
// (`{ type: 'approximate', city, country }`) can only be proven accepted by
// OpenAI via a live call, so exercise it here rather than skipping it.
const LOCATION = 'London, United Kingdom';

// Provider SDKs sometimes echo a partially-masked version of a rejected key
// back in their error text (e.g. OpenAI's "Incorrect API key provided:
// sk-abc****wxyz"). Redact the whole secret, then every prefix and suffix of
// it down to a floor length of 6. Fragments shorter than that are left alone
// deliberately: below 6 the odds of mangling ordinary error text outweigh the
// value of hiding a fragment the provider already shows in its own dashboard.
function redactSecret(message: string, secret: string): string {
  // Split out first so a secret shorter than the floor is still redacted.
  let redacted = message.split(secret).join('[REDACTED]');
  for (let n = secret.length; n >= 6; n--) {
    redacted = redacted.split(secret.slice(0, n)).join('[REDACTED]');
    redacted = redacted.split(secret.slice(-n)).join('[REDACTED]');
  }
  return redacted;
}

interface ChatbotOutcome {
  name: string;
  status: 'skipped' | 'failed' | 'ok';
  detail: string;
  citedCount?: number;
  usedNotCitedCount?: number;
}

async function verifyChatbot(
  name: string,
  provider: ProviderId,
  call: () => Promise<GenerateTextResult<any, any>>,
  options: { requireUsedNotCited?: boolean; location?: string } = {}
): Promise<ChatbotOutcome> {
  console.log(`\n=== ${name} ===`);
  if (options.location) {
    console.log(`Location sent:  ${JSON.stringify(parseTargetLocation(options.location))}`);
  }

  let secret: string;
  try {
    secret = await getProviderKey(provider);
  } catch (error) {
    if (error instanceof MissingProviderKeyError) {
      console.log(`Skipped: no key set for ${error.provider}.`);
      return { name, status: 'skipped', detail: `no key set for ${error.provider}` };
    }
    throw error;
  }

  try {
    const response = await call();
    const sources = getSourcesFromResponse(response);
    const citedCount = sources.filter((s) => s.isCited).length;
    const usedNotCitedCount = sources.filter((s) => !s.isCited).length;
    const firstUrls = sources.slice(0, 2).map((s) => s.url);

    console.log(`Model:          ${response.response.modelId}`);
    console.log(`Text length:    ${response.text.length}`);
    console.log(`Cited sources:  ${citedCount}`);
    console.log(`Used-not-cited: ${usedNotCitedCount}`);
    console.log(`First 2 URLs:   ${firstUrls.length ? firstUrls.join(', ') : '(none)'}`);

    // Universal: applies to all three Chatbots. Google and Perplexity only
    // ever populate the cited path, so for them this is equivalent to the old
    // "zero sources returned" check; for ChatGPT it also catches the case
    // where response.sources went empty while the toolResults path kept
    // working (see the used-but-not-cited check below for the mirror case).
    if (citedCount === 0) {
      return {
        name,
        status: 'failed',
        detail: 'cited=0: the response.sources path (cited Sources) went empty',
      };
    }
    // ChatGPT-only: Google and Perplexity have no used-but-not-cited path at
    // all (see libs/ai/responseSources.ts), so this check would
    // always fail for them.
    if (options.requireUsedNotCited && usedNotCitedCount === 0) {
      return {
        name,
        status: 'failed',
        detail:
          'usedNotCited=0: the web_search toolResults path (used-but-not-cited Sources) went ' +
          'empty — check libs/ai/responseSources.ts',
      };
    }
    return {
      name,
      status: 'ok',
      detail: `model=${response.response.modelId}`,
      citedCount,
      usedNotCitedCount,
    };
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : String(error);
    const message = redactSecret(rawMessage, secret);
    console.log(`FAILED: ${message}`);
    return { name, status: 'failed', detail: message };
  }
}

interface GeminiOutcome {
  status: 'skipped' | 'failed' | 'ok';
  detail: string;
}

async function verifyGemini(): Promise<GeminiOutcome> {
  console.log(`\n=== Gemini structured output (analyzeResponseSentiment) ===`);

  let secret: string;
  try {
    secret = await getProviderKey('google');
  } catch (error) {
    if (error instanceof MissingProviderKeyError) {
      console.log(`Skipped: no key set for ${error.provider}.`);
      return { status: 'skipped', detail: `no key set for ${error.provider}` };
    }
    throw error;
  }

  try {
    const result = await analyzeResponseSentiment(
      'Acme Corp makes an excellent, reliable project management tool that agencies love.',
      [{ id: 'acme', name: 'Acme Corp' }]
    );
    console.log(`Result: ${JSON.stringify(result)}`);
    return { status: 'ok', detail: JSON.stringify(result) };
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : String(error);
    const message = redactSecret(rawMessage, secret);
    console.log(`FAILED: ${message}`);
    return { status: 'failed', detail: message };
  }
}

async function main() {
  const chatgpt = await verifyChatbot(
    'ChatGPT',
    'openai',
    () => getPromptResponseWithChatGPT(PROMPT, LOCATION),
    { requireUsedNotCited: true, location: LOCATION }
  );
  const googleAiOverview = await verifyChatbot('Google AI Overview', 'google', () =>
    getPromptResponseWithGoogleAIMode(PROMPT)
  );
  const perplexity = await verifyChatbot('Perplexity', 'perplexity', () =>
    getPromptResponseWithPerplexity(PROMPT)
  );
  const gemini = await verifyGemini();

  const chatbots = [chatgpt, googleAiOverview, perplexity];

  console.log('\n\n=== SUMMARY ===');
  for (const bot of chatbots) {
    console.log(`${bot.name}: ${bot.status.toUpperCase()} — ${bot.detail}`);
    if (bot.status === 'ok') {
      console.log(`  cited=${bot.citedCount}, usedNotCited=${bot.usedNotCitedCount}`);
    }
  }
  console.log(`Gemini structured output: ${gemini.status.toUpperCase()} — ${gemini.detail}`);

  const hasFailure =
    chatbots.some((bot) => bot.status === 'failed') || gemini.status === 'failed';

  if (hasFailure) {
    console.log('\nRESULT: FAILED');
    process.exit(1);
  }
  console.log('\nRESULT: OK');
}

main();
