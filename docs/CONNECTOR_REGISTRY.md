# Connector Registry Foundation

Unified Action Graph now includes a reference-only connector registry foundation inspired by:

- public API catalogs: category, auth type, HTTPS, CORS, reference URL, and intended use
- OpenAPI discovery tools: endpoint inventory, auth requirements, risk tags, and connector status

## Truth boundary

The registry is not a live integration layer yet.

Current connector/source entries are one of:

- `reference_only`: public documentation or vendor API reference only
- `demo_template`: internal template for future connector design

No connector in this PR calls an external API, stores credentials, creates tickets, remediates systems, or generates live telemetry.

## Required fields for future live connectors

Each live connector should define:

- connector ID and display name
- source category
- auth type
- base URL and/or OpenAPI spec URL
- allowed endpoints
- read/write capability
- rate limits
- retry and timeout behavior
- credential storage strategy
- failure modes
- audit events emitted for every read/write action
- whether generated signals are verified, enriched, or raw/untrusted

## Connector lifecycle

Recommended lifecycle:

```text
reference_only -> discovered -> configured -> active -> disabled/error
```

A connector must not become `active` until:

1. Server-side credentials are configured.
2. Allowed endpoints are explicitly declared.
3. Rate limits and timeout policies are set.
4. External calls are routed through backend/serverless code, not the Vite client.
5. Every connector action appends an audit event.
6. Demo data is removed or explicitly separated from live data.

## OpenAPI discovery upgrade path

Future OpenAPI support should parse a user-provided spec URL or uploaded spec file and create inactive endpoint records only. The first version should not scan random hosts or brute-force endpoint paths.

Recommended safe sequence:

1. Parse provided OpenAPI JSON/YAML.
2. Extract path/method/summary/security metadata.
3. Create disabled `ConnectorEndpoint` records.
4. Let an operator review and approve allowed endpoints.
5. Add credentials server-side.
6. Test read-only calls first.
7. Only then allow workflow action endpoints.

## Audit requirements

Every connector lifecycle change should log:

- connector created
- endpoint discovered
- credentials configured metadata only, never secrets
- connector enabled/disabled
- feed pull attempted
- feed pull succeeded/failed
- workflow action requested
- workflow action approved
- workflow action executed/failed

Secrets must never be written to the audit log.
