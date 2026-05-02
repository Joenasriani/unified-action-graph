import type { Request, Response } from 'express';

type ReviewRequestBody = {
  detection?: unknown;
  workflow?: unknown;
  coursesOfAction?: unknown[];
};

const DEFAULT_BASE_URL = 'https://openrouter.ai/api/v1';
const DEFAULT_MODEL = 'openrouter/free';

function getApiKey(): string | undefined {
  return (
    process.env.UNIFIED_ACTION_GRAPH_API ||
    process.env.OPENROUTER_API_KEY ||
    process.env.FREE_ROBOMARKET_API ||
    process.env.ROBOMARKET_API
  );
}

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed. Use POST.' });
    return;
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    res.status(503).json({
      error: 'AI provider is not configured.',
      required_env: 'UNIFIED_ACTION_GRAPH_API',
      fallback: 'Use the deterministic COA engine until a server-side OpenRouter key is configured.',
    });
    return;
  }

  const body = req.body as ReviewRequestBody;
  const baseUrl = process.env.OPENROUTER_BASE_URL || DEFAULT_BASE_URL;
  const model = process.env.AI_MODEL || DEFAULT_MODEL;

  const prompt = [
    'You are an advisory reviewer for Unified Action Graph.',
    'Review the detection, workflow, and candidate courses of action.',
    'Return concise JSON with: summary, risk_level, missing_evidence, recommended_next_step, and human_approval_required.',
    'Do not claim that any external action was executed.',
    '',
    JSON.stringify(body, null, 2),
  ].join('\n');

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.OPENROUTER_HTTP_REFERER || 'https://github.com/Joenasriani/unified-action-graph',
        'X-Title': process.env.OPENROUTER_APP_TITLE || 'Unified Action Graph',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You provide cautious advisory analysis. You never execute tools or external actions.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      res.status(response.status).json({
        error: 'OpenRouter request failed.',
        status: response.status,
        details: errorText,
      });
      return;
    }

    const data = await response.json();
    res.status(200).json({
      provider: 'openrouter',
      model,
      advisory_only: true,
      result: data,
    });
  } catch (error) {
    res.status(500).json({
      error: 'AI review failed.',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
