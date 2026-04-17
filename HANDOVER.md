Orduva Ver-0.060 handover

Included in this patch:
- admin tenant hardening for Phase 1 foundation
- admin product CRUD now resolves tenant server-side from request host
- admin category CRUD now resolves tenant server-side from request host
- admin image update/upload routes now resolve tenant server-side from request host
- product and category references are checked against the current tenant only
- admin copy cleaned up to reflect tenant-scoped behaviour
- visible version bumped to Ver: 0.060

- admin orders hardening added
- public order create route now validates request tenant slug against the request host
