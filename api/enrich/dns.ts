import type { Request, Response } from 'express';

const DNS_RECORD_TYPES = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME'] as const;

type DnsAnswer = {
  name: string;
  type: number;
  TTL: number;
  data: string;
};

const TYPE_LABELS: Record<number, string> = {
  1: 'A',
  2: 'NS',
  5: 'CNAME',
  15: 'MX',
  16: 'TXT',
  28: 'AAAA',
};

function sanitizeDomain(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().replace(/^https?:\/\//, '').split('/')[0].toLowerCase();
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(normalized)) return null;
  return normalized;
}

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed. Use POST.' });
    return;
  }

  const domain = sanitizeDomain(req.body?.value);
  if (!domain) {
    res.status(400).json({ error: 'A valid domain is required.' });
    return;
  }

  const findings = [];
  const errors: string[] = [];

  for (const recordType of DNS_RECORD_TYPES) {
    const sourceUrl = `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${recordType}`;
    try {
      const response = await fetch(sourceUrl, { method: 'GET' });
      if (!response.ok) {
        errors.push(`${recordType}: HTTP ${response.status}`);
        continue;
      }

      const data = await response.json() as { Answer?: DnsAnswer[]; Status?: number };
      const answers = data.Answer || [];
      if (answers.length === 0) continue;

      const entities = answers.map(answer => answer.data).slice(0, 20);
      findings.push({
        title: `${recordType} records found for ${domain}`,
        description: `${answers.length} ${recordType} DNS record(s) were returned by Google Public DNS-over-HTTPS.`,
        sourceType: 'live_dns',
        sourceUrl,
        confidence: 'CONFIRMED',
        severity: recordType === 'TXT' ? 'INFO' : 'LOW',
        entities,
        evidence: answers.slice(0, 12).map(answer => ({
          label: `${TYPE_LABELS[answer.type] || recordType} ${answer.name}`,
          sourceName: 'Google Public DNS JSON API',
          sourceUrl,
          rawSnippet: `${answer.name} ${TYPE_LABELS[answer.type] || answer.type} ${answer.data} TTL=${answer.TTL}`,
          sourceReliability: 'high',
        })),
      });
    } catch (error) {
      errors.push(`${recordType}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  res.status(200).json({
    connector: 'dns',
    truthStatus: 'live_public_source',
    findings,
    errors,
  });
}
