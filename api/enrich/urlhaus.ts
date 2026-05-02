import type { Request, Response } from 'express';

function normalizeValue(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed;
}

function toUrlhausPayload(value: string, type: string): URLSearchParams {
  const params = new URLSearchParams();
  if (type === 'url') {
    params.set('url', value);
  } else {
    const host = value.replace(/^https?:\/\//, '').split('/')[0];
    params.set('host', host);
  }
  return params;
}

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed. Use POST.' });
    return;
  }

  const value = normalizeValue(req.body?.value);
  const type = String(req.body?.type || 'domain');
  if (!value) {
    res.status(400).json({ error: 'A domain, IP, host, or URL is required.' });
    return;
  }

  const sourceUrl = type === 'url'
    ? 'https://urlhaus-api.abuse.ch/v1/url/'
    : 'https://urlhaus-api.abuse.ch/v1/host/';

  try {
    const response = await fetch(sourceUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: toUrlhausPayload(value, type).toString(),
    });

    if (!response.ok) {
      res.status(200).json({
        connector: 'urlhaus',
        truthStatus: 'live_public_source',
        findings: [],
        errors: [`URLhaus lookup returned HTTP ${response.status}`],
      });
      return;
    }

    const data = await response.json();
    const queryStatus = String(data?.query_status || 'unknown');

    if (queryStatus !== 'ok') {
      res.status(200).json({
        connector: 'urlhaus',
        truthStatus: 'live_public_source',
        findings: [{
          title: `No active URLhaus hit for ${value}`,
          description: `URLhaus query status: ${queryStatus}. This is not proof of safety; it only means this public source did not return a positive hit for the query.`,
          sourceType: 'live_urlhaus',
          sourceUrl,
          confidence: 'MODERATE',
          severity: 'INFO',
          entities: [value],
          evidence: [{
            label: 'URLhaus negative or non-hit result',
            sourceName: 'URLhaus',
            sourceUrl,
            rawSnippet: JSON.stringify({ query_status: queryStatus }).slice(0, 500),
            sourceReliability: 'medium',
          }],
        }],
        errors: [],
      });
      return;
    }

    const urls = Array.isArray(data?.urls) ? data.urls.slice(0, 10) : [];
    const tags = Array.isArray(data?.tags) ? data.tags.map(String) : [];
    const malwarePayloads = Array.isArray(data?.payloads) ? data.payloads.slice(0, 10) : [];
    const severity = urls.length > 0 || malwarePayloads.length > 0 ? 'HIGH' : 'MEDIUM';

    const evidence = [
      {
        label: 'URLhaus lookup summary',
        sourceName: 'URLhaus',
        sourceUrl,
        rawSnippet: JSON.stringify({ query_status: queryStatus, url_count: urls.length, tags }).slice(0, 800),
        sourceReliability: 'high',
      },
      ...urls.map((item: any, index: number) => ({
        label: `URLhaus URL hit ${index + 1}`,
        sourceName: 'URLhaus',
        sourceUrl,
        rawSnippet: JSON.stringify({ url: item.url, url_status: item.url_status, threat: item.threat, tags: item.tags }).slice(0, 800),
        sourceReliability: 'high',
      })),
      ...malwarePayloads.map((item: any, index: number) => ({
        label: `URLhaus payload metadata ${index + 1}`,
        sourceName: 'URLhaus',
        sourceUrl,
        rawSnippet: JSON.stringify({ file_type: item.file_type, signature: item.signature, response_md5: item.response_md5 }).slice(0, 800),
        sourceReliability: 'high',
      })),
    ];

    res.status(200).json({
      connector: 'urlhaus',
      truthStatus: 'live_public_source',
      findings: [{
        title: `URLhaus threat-intel data found for ${value}`,
        description: 'URLhaus returned public threat-intelligence metadata. This route records metadata only and does not download malware samples.',
        sourceType: 'live_urlhaus',
        sourceUrl,
        confidence: 'CONFIRMED',
        severity,
        entities: [value, ...tags, ...urls.map((item: any) => String(item.url || '')).filter(Boolean)].slice(0, 30),
        evidence,
      }],
      errors: [],
    });
  } catch (error) {
    res.status(500).json({
      connector: 'urlhaus',
      truthStatus: 'live_public_source',
      findings: [],
      errors: [error instanceof Error ? error.message : 'Unknown URLhaus error'],
    });
  }
}
