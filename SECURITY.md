# Security

## Reporting a vulnerability
Please report privately (GitHub security advisory on this repository once published) rather than opening a public issue. Do not include real API tokens in reports.

## Credentials
The extension holds no built-in credentials. Users supply their own Napkin API token, stored unencrypted in `chrome.storage.local`. If a token is ever exposed, revoke it in Napkin's Developer settings.

## Data flow
Selected text and its page URL go to `https://api.napkin.ai` on Generate. Results and history are stored locally.

## Known limitations
See the Limitations section of the README and docs/AUDIT.md.
