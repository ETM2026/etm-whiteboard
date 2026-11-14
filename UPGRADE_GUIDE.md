# ETM Learning Upgrade

Built for easy use, short sessions and enjoyable discovery. This package is ready to upload; it has not been published to your live app.

## Install the combined update

1. Download and extract ETM_Learning_Upgrade.zip.
2. Open ETM2026/etm-whiteboard on GitHub and select the main branch.
3. Choose Add file → Upload files. Drag the extracted contents into the repository root. Include the maths-ai and tests folders, not just the loose files. Do not upload the ZIP or an extra enclosing folder.
4. Commit the upload. Wait for the GitHub Pages deployment and the Cloudflare Worker build to finish successfully.
5. Open your usual ETM app and refresh the page. If an old layout remains, use Ctrl+Shift+R on a computer or close and reopen the browser tab on your phone.

Your existing maths-ai-config.js, Cloudflare secrets, Wrangler database configuration, family accounts and artwork stay in place. No database migration, new API key or new account is required. The master AI switch requires the updated Worker as well as the updated frontend.

## Try it in this order

1. Sign in as Dad and download a family backup using Dad’s space → Family backup before the children start.
2. Open Dad’s space → Learning & AI. Review each child’s starting stage. These are starting points, not school grades.
3. Turn AI enhancements off and save. Return home and try today’s adventure, Geography, Science, Maths and Play together. These standard activities do not need OpenAI or API credit.
4. In Play together, select a topic and stage for each player. Try Friendly competition and Team adventure. Each player gets three turns and the same points per correct answer, without a speed bonus.
5. Answer a practice question, try the help option and move to the next question. There should be one main Check/Next action, kept within reach at the bottom of the screen.
6. When wanted, return to Dad’s controls and turn optional AI back on. Test with Dad’s own or synthetic material in the AI studio: maths photos, piano exercises and reviewed quiz drafts. The shared spending allowance still applies.

## What is included

- A simpler six-subject home, with one suggested short daily adventure.
- Geography: continents, oceans, map directions and world journeys.
- Science: day and night, the water cycle, forces, plants, magnets, floating and sinking.
- Ten starter units with interactive teaching models and 90 questions across three stages. This is a starter learning collection, not a complete school curriculum. Simplified models are labelled.
- Freshly generated arithmetic, visual number models and local homework strategy hints.
- Forty-eight additional built-in quiz questions covering animals, dinosaurs, music, space, art, building and familiar game interests. A finite bank can repeat on later games.
- A suggested learning path that revisits tricky ideas and adapts across sessions using independent answers. Helped answers are recorded separately. Existing Reading and Music activities remain available.
- One real action button in the question dock, rather than duplicated copies. Feedback appears once.
- Dad’s server-enforced master AI switch plus individual Maths, Piano and Quiz switches. Turning AI off blocks new provider requests; it cannot cancel a request already sent. The standard activities remain usable.
- Learning history is saved on the current device for family profiles and included in family backup exports/imports. It is not automatically synchronised between devices. Guest practice is temporary. Download regular backups.
- Optional read-aloud using the device’s available speech voices.

## Child AI remains separately controlled

Leave ETM_AI_ZDR_CONFIRMED=false while the OpenAI privacy request is pending. The new switches do not grant child AI access or override the existing privacy gate. Use only Dad’s own or synthetic material in adult AI tests. Never paste an API key into the frontend or GitHub.

## Validation

The standard engine and client checks passed, including a complete lesson and maths practice without AI, nine-turn family quizzes, progression and backup handling. Backend type checks, the full test suite and a production build dry run passed. AI switch tests use mocked provider responses; this verification did not spend API credit. Browser checks covered the real home, science lesson, geography map and family quiz, including single-button progression.

For a developer: run `node tests/learning-core.test.mjs` and `node tests/learning-client.test.mjs` from the repository root. In maths-ai, run `npm ci`, `npm run check`, `npm test` and `npm run build`. The build command is a dry run, not a deployment.
