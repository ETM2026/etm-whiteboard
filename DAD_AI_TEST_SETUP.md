# Dad-only AI test update

This is an update for ETM2026/etm-whiteboard. It is prepared code, not a completed live deployment.

## Upload

1. Extract ETM_Dad_AI_Test_Update.zip.
2. On the GitHub repository root, select Add file → Upload files.
3. Upload the extracted contents: maths-coach.js, the maths-ai folder, and this guide. Keep the folder paths. Existing files outside this update are retained.
4. Commit to main with the message “Add Dad-only AI test mode”.
5. Wait for GitHub Pages and Cloudflare Workers builds to succeed. Cloudflare is connected to the same repository and should deploy the backend changes automatically.
6. Open the ETM app and press Ctrl+F5. Unlock Dad → Parent Tools → Dad’s AI test.

## Use

1. Keep ETM_AI_ZDR_CONFIRMED=false in Cloudflare and Emily’s AI switch off.
2. In Dad’s AI test, tick Enable Dad-only AI testing and click Save Dad test setting.
3. Choose a skill and starting stage, then start a six-question test.
4. Enter your own numeric answer and select Check with AI. Try an incorrect answer as well as a correct one.
5. Continue through the generated practice. Test outcomes do not enter Emily’s learning trail.
6. Disable and save the Dad test setting when finished.

The adult test sends only its generated question and the adult’s numeric answer to the OpenAI Responses API, using store:false. It has no image uploads or free-text prompts. Do not use it to enter children’s work or enable it for a child.

This uses real API requests once deployed and enabled. It shares the existing estimated monthly allowance (initially US$5) and atomic reservation ledger. Each request reserves US$1 temporarily; unknown failures may retain this charge conservatively. Displayed cost is an estimate, not an invoice or an OpenAI billing cap.

No new database tables or migrations are required. A separate configuration row enables Dad tests independently. Existing Cloudflare secrets, endpoint, family enrollment, database ID and privacy settings remain in place.

## Verification

Validated locally with TypeScript, a Wrangler dry-run build, signed Worker integration tests with mocked OpenAI responses, spending-limit tests, and a frontend DOM harness. Tests cover denial of child access to test routes, rejection of photos and nonnumeric answers, shared spending limits, separate child progress, AI/arithmetic disagreement, and the six-question flow.

No live OpenAI request or actual-browser UI test was performed. Live testing requires your deployment and API account. If an API request fails, preserve the error message without sharing the API key; there is no silent local marking fallback.
