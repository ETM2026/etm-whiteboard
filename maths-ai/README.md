# ETM maths AI backend

This backend is separate from GitHub Pages. It protects the OpenAI secret, authenticates Emily/Dad using the existing family signing keys, records learning evidence, and reserves spending atomically in D1. It is not deployed by publishing GitHub Pages.

## What is implemented

- Cropped homework and working-photo analysis, with topic confirmation.
- Controlled homework hints. No model-generated prose, correct homework answers, or complete solutions are displayed.
- Separate six-question adaptive practice. Every submitted practice answer is assessed by AI before it can be recorded. A deterministic arithmetic check verifies the AI; disagreement stops marking rather than replacing AI silently.
- AI misconception category and next-difficulty selection. Parent skill summaries distinguish independent, assisted, retried and guessed answers. This is indicative practice evidence, not a school grade.
- No names, profile identifiers, date of birth, or saved learning history in model prompts. Submitted answers and working can still be child personal data: removing names is NOT proof of anonymisation.
- Raw photographs are not stored by this backend. Handwriting analysis is suggestive, not definitive.

## Before live child-work requests

Obtain and verify the relevant OpenAI child-data approval and actual Zero Data Retention configuration for the API project. `store:false` is already set, but it is NOT equivalent to approved Zero Data Retention. Do not set ETM_AI_ZDR_CONFIRMED merely to bypass the gate. The default is false and all paid photo/answer-review requests fail closed.

## Deployment (requires your Cloudflare account)

1. From this directory run `npm ci`, then `npx wrangler login` to authorize your own account.
2. Run `npx wrangler d1 create etm-maths`. Put the returned database ID in wrangler.jsonc; no API key belongs in that file.
3. Run `npm run migrate` to create the schema.
4. Run `npx wrangler secret put OPENAI_API_KEY`. Paste the existing ETM Homework key into the hidden prompt, never a chat or source file.
5. Generate a separate long random setup code in a password manager. Run `npx wrangler secret put ETM_SETUP_TOKEN` and enter that code privately.
6. Only after actual approval/configuration, set ETM_AI_ZDR_CONFIRMED to true in your private deployment configuration. Deploy using `npm run deploy`.
7. Put the returned HTTPS worker origin (public, not a secret) in ../maths-ai-config.js and publish that change through GitHub Pages.
8. In ETM, unlock Dad → Parent tools → Connect maths AI. Enter the backend origin and separate one-time setup code. This pins the existing Dad public key and child public keys. Subsequent changes require Dad's signature, not the setup code. Rotate/remove ETM_SETUP_TOKEN after initial enrollment.
9. Dad → Emily's learning & AI → set allowance (default USD 5) and enable. In Emily → Maths → My maths coach, test a generic non-personal worksheet before child-work use.

Each device uses the public backend origin from maths-ai-config.js automatically. Only initial Dad enrollment needs the setup code. Reconnect from Dad after a child PIN/key change to update that child's public signing key. Do not reset the backend trust row casually: it establishes the authority for this family.

Requests are signed, bound to their exact route and data, expire after a minute, and have single-use nonces. CORS allows https://etm2026.github.io; CORS alone is not authentication. Guest/sibling requests are rejected server-side. The API key is never returned to the client.

Spending uses a shared USD ledger by UTC calendar month. Each request reserves USD 1, settles to estimated token charges when usage is known, and retains the reservation on unknown failures. This is conservative application accounting, not the provider's billing hard cap. The current fixed model/rates must be reviewed if the model or pricing changes. Other future piano endpoints must use this same ledger.

## Verification

`npm test`, `npm run check`, `npm run build`.
Additional mocked integration tests exercise vision, AI marking and budget reservations. They never use a real key or send paid requests.

## Current activation state

The repository contains a deployable candidate, not an active backend. No Cloudflare account, backend URL, live API key, child-data approval or production AI request has been verified. Browser-device testing is also required after the backend is deployed.
