import type { Request, Response } from 'express';

function sanitizeDomain(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().replace(/^https?:\/\//, '').split('/')[0].toLowerCase();
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(normalized)) return null;
  return normalized;
}

function extractNameservers(data: any): string[] {
  if (!Array.isArray(data?.nameservers)) return [];
  return data.nameservers.map((ns: any) => String(ns?.ldhName || ns?.unicodeName || '')).filter(Boolean);
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

  const sourceUrl = `https://rdap.org/domain/${encodeURIComponent(domain)}`;

  try {
    const response = await fetch(sourceUrl, { method: 'GET' });
    if (!response.ok) {
      res.status(200).json({
        connector: 'rdap',
        truthStatus: 'live_public_source',
        findings: [],
        errors: [`RDAP lookup returned HTTP ${response.status}`],
      });
      return;
    }

    const data = await response.json();
    const nameservers = extractNameservers(data);
    const statuses = Array.isArray(data?.status) ? data.status.map(String) : [];
    const events = Array.isArray(data?.events) ? data.events.slice(0, 8) : [];
    const registrarEntity = Array.isArray(data?.entities)
      ? data.entities.find((entity: any) => Array.isArray(entity.roles) && entity.roles.includes('registrar'))
      : null;
    const registrar = registrarEntity?.vcardArray?.[1]?.find?.((item: any[]) => item?.[0] === 'fn')?.[3];

    const evidenceLines = [
      data?.ldhName ? `Domain: ${data.ldhName}` : null,
      registrar ? `Registrar: ${registrar}` : null,
      statuses.length ? `Status: ${statuses.join(', ')}` : null,
      nameservers.length ? `Nameservers: ${nameservers.join(', ')}` : null,
    ].filter(Boolean) as string[];

    const findings = [{
      title: `RDAP registration metadata found for ${domain}`,
      description: 'Public RDAP registration data was returned for the domain. Availability and redaction depend on the registry/registrar.',
      sourceType: 'live_rdap',
      sourceUrl,
      confidence: 'CONFIRMED',
      severity: 'INFO',
      entities: [domain, ...nameservers, ...statuses].slice(0, 25),
      evidence: [
        {
          label: 'RDAP summary',
          sourceName: 'RDAP.org',
          sourceUrl,
          rawSnippet: evidenceLines.join(' | ') || JSON.stringify(data).slice(0, 500),
          sourceReliability: 'high',
        },
        ...events.map((event: any) => ({
          label: `RDAP event: ${event.eventAction || 'event'}`,
          sourceName: 'RDAP.org',
          sourceUrl,
          rawSnippet: `${event.eventAction || 'event'} ${event.eventDate || ''}`.trim(),
          sourceReliability: 'high',
        })),
      ],
    }];

    res.status(200).json({
      connector: 'rdap',
      truthStatus: 'live_public_source',
      findings,
      errors: [],
    });
  } catch (error) {
    res.status(500).json({
      connector: 'rdap',
      truthStatus: 'live_public_source',
      findings: [],
      errors: [error instanceof Error ? error.message : 'Unknown RDAP error'],
    });
  }
}
