# AI connection diagnostics update

This update shows a safe, specific category when OpenAI rejects a request. It does not establish the cause of the first failed live request or resolve an account issue by itself.

1. Extract ETM_AI_Connection_Check.zip.
2. Upload its contents to the root of ETM2026/etm-whiteboard, retaining the maths-ai folder paths.
3. Commit changes. Wait for the Cloudflare deployment to show Ready.
4. Return to Dad’s AI test, refresh, start a test and select Check with AI once.
5. Share the resulting curated error text. Never share the API key.

No database migrations, secret changes, model changes or privacy-setting changes are included. Emily’s AI remains disabled. Existing unknown failure reservations are not rewritten.

The server distinguishes API quota, spending limits, credentials, permissions, model access, rate limiting and rejected request fields. It never forwards raw upstream error messages, unknown error codes or arbitrary parameter text, because those can contain private details. Definitive rejected requests release their app allowance reservation; uncertain network and server failures remain conservatively accounted. This app ledger is an estimate, not an OpenAI invoice.

Validated with mocked upstream failures, isolation and spending tests, the existing maths/authorization/frontend tests, TypeScript checking and a Wrangler dry-run build. No live request was made with your API key, which remains solely on your Cloudflare server.
