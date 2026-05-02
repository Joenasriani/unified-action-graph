import type { Request, Response } from 'express';

function parseRepo(value: unknown): { owner: string; repo: string } | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  const githubUrlMatch = trimmed.match(/github\.com\/([^/\s]+)\/([^/\s#?]+)/i);
  const slashMatch = trimmed.match(/^([^/\s]+)\/([^/\s]+)$/);
  const match = githubUrlMatch || slashMatch;
  if (!match) return null;
  return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
}

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed. Use POST.' });
    return;
  }

  const parsed = parseRepo(req.body?.value);
  if (!parsed) {
    res.status(400).json({ error: 'A public GitHub repo in owner/name or GitHub URL format is required.' });
    return;
  }

  const sourceUrl = `https://api.github.com/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}`;
  const publicUrl = `https://github.com/${parsed.owner}/${parsed.repo}`;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'Unified-Action-Graph-OSINT',
  };
  if (process.env.GITHUB_PUBLIC_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_PUBLIC_TOKEN}`;
  }

  try {
    const response = await fetch(sourceUrl, { method: 'GET', headers });
    if (!response.ok) {
      res.status(200).json({
        connector: 'github',
        truthStatus: 'live_public_source',
        findings: [],
        errors: [`GitHub lookup returned HTTP ${response.status}`],
      });
      return;
    }

    const data = await response.json();
    const entities = [
      data.full_name,
      data.owner?.login,
      data.language,
      ...(Array.isArray(data.topics) ? data.topics : []),
    ].filter(Boolean).map(String);

    const finding = {
      title: `Public GitHub repository metadata found for ${data.full_name}`,
      description: `${data.full_name} is public metadata from the GitHub REST API. This connector does not scan secrets or private data.`,
      sourceType: 'live_github',
      sourceUrl: publicUrl,
      confidence: 'CONFIRMED',
      severity: data.archived ? 'LOW' : 'INFO',
      entities,
      evidence: [
        {
          label: 'GitHub repository summary',
          sourceName: 'GitHub REST API',
          sourceUrl: publicUrl,
          rawSnippet: JSON.stringify({
            full_name: data.full_name,
            description: data.description,
            private: data.private,
            archived: data.archived,
            disabled: data.disabled,
            language: data.language,
            stargazers_count: data.stargazers_count,
            forks_count: data.forks_count,
            open_issues_count: data.open_issues_count,
            pushed_at: data.pushed_at,
            updated_at: data.updated_at,
            topics: data.topics,
          }).slice(0, 1200),
          sourceReliability: 'high',
        },
      ],
    };

    res.status(200).json({
      connector: 'github',
      truthStatus: 'live_public_source',
      findings: [finding],
      errors: [],
    });
  } catch (error) {
    res.status(500).json({
      connector: 'github',
      truthStatus: 'live_public_source',
      findings: [],
      errors: [error instanceof Error ? error.message : 'Unknown GitHub error'],
    });
  }
}
