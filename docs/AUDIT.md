# Audit notes

Scope: the uploaded `napkin-companion-dist.zip` (compiled output only).

## Secrets / personal data
Scanned all files for API-key patterns, private keys, JWTs, emails, local paths and URLs. None found. Only external hosts referenced: api.napkin.ai, app.napkin.ai (content-script exclusion), plus React/XML-namespace strings. The 15 style IDs in the bundle are public Napkin identifiers, not secrets.

## Authentication
No app-level login, OAuth or accounts exist. Napkin Bearer token is user-provided. Nothing removed.

## Fixed
1. Bearer token was sent to whatever `download_url` the API returned. Now attached only for `https://api.napkin.ai`; non-https URLs rejected. Covered by `scripts/test-patches.mjs`.
2. Background accepted selection messages without checking sender or payload. Now requires the extension's own id, string non-empty text and sanitizes `sourceUrl` to http(s).
3. Removed unused `scripting` permission (no `chrome.scripting` use found).
4. Removed "Internal Beta" wording; corrected "Stored locally" copy to say storage is unencrypted.

## Open
- `<all_urls>` content script (needed for the floating button; reducing it is a product decision).
- `activeTab` probably unnecessary; untested.
- Content script static imports without `web_accessible_resources` (likely broken).
- No "clear history" control; history keeps source text and URLs.
- No source or build config; no tests beyond the static and mocked ones here.
