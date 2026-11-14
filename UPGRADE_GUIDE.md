# ETM Simplified Update

This is the next combined version of ETM. It replaces the overlapping menus while retaining the working games, teaching activities, original records and AI-off learning. It is ready to upload; it has not been published to the live app.

## Install

1. Download and extract ETM_Simplified_Update.zip.
2. In GitHub, open ETM2026/etm-whiteboard, main branch.
3. Choose Add file → Upload files. Upload all extracted contents to the repository root, including the maths-ai and tests folders. Do not upload the ZIP or an extra enclosing folder.
4. Commit. Wait for both GitHub Pages and the Cloudflare Worker build to finish.
5. Refresh ETM. On Windows, Ctrl+Shift+R reloads the latest files. On a tablet, close and reopen the tab if the old menu remains.

No new account, API key, database migration or Wrangler configuration change is needed. The package leaves maths-ai-config.js, Cloudflare secrets and your database configuration in place. Download a family backup from the existing app before installing.

## The new structure

Home has six choices: Maths, Reading, Music, Geography, Science, and Games & competitions. Draw, My progress and More sit below them. Dad has one Dad’s space link.

Maths:
- Learn & practise: one skill/stage setup and one three-question screen, with original number ranges, optional columns and word problems. Counting, addition, subtraction, mixed sums, division, number bonds, fractions, time, money, shapes and place value remain available. Required diagrams appear with the question. Visual hints and a drawing pad remain available.
- Times tables: the existing Learn it, Practise it and Rally activities, with their saved facts and levels.
- Homework helper: one destination for method hints and separate practice. It does not accept or solve the child’s original homework answer. Emily’s photo option appears only when her existing permissions and privacy setup allow it.
- Practise with Dad: Dad’s original shared questions, invitations and Maths Board.

Games & competitions:
- Family quiz, Matching pairs, X and O’s, Connect four.
- Maths Sprint, Times Tables Rally, Note Race, Music Quiz Race.
- Guess the word, Treasure voyage and Draw & guess under More playful adventures.
- Family quiz contains Play a quiz, Make a question and Saved questions. Existing family-authored questions are retained. Dad can also generate and review an optional AI draft. Reviewed AI test drafts remain Dad-only.

Music:
- Notes & theory, Listening & rhythm, Scales, My pieces.
- One Add a piece screen for file import and standard photo/PDF scanning. Dad’s optional adult AI scan appears there only when enabled. Every scan still requires review.
- Race together opens the same Games & competitions destination.
- Saved pieces, MIDI/keyboard practice, falling notes, RIAM settings and original exercises remain available.

My progress:
- One destination for the child’s current practice, times-table facts and original recorded music/reading/game sessions.
- Emily’s saved AI check-ups load in a separate labelled section when connected.
- Practice answers, helped answers, recorded sessions, coins and game scores are not merged into an artificial combined grade.
- Only Dad can select a different family member’s progress. Guest practice remains temporary.
- New practice history remains local to the device and is included in family backups. This update does not add automatic cross-device sync.
- Private star charts remain separate in Dad’s Family settings.

Dad’s space:
- Learning & progress: starting stages, read-aloud, progress, music levels, school words and optional weekly tasks.
- AI & spending: master AI switch, feature switches, one shared allowance, Emily’s separate privacy-gated permission, and backend connection.
- Family settings: PINs, invitations, private goals, usage, result corrections, messages, camera and sound.
- Backup & restore: one place to export or restore.
- Advanced adult AI tests are collapsed below the main cards. Their results remain separate from child progress.

More contains story creation, Santa’s List and messages. Chat and Together remain in the header.

## First checks after installing

1. As Dad, open Dad’s space → AI & spending. Turn AI enhancements off and save. Confirm standard Maths, Geography, Science and games still run.
2. Open Maths → Learn & practise. Try a clock/fraction question and an addition question with Column sums. Check that the picture/columns appear. Use Help me think and Show your thinking.
3. Open Games & competitions. Each named game/race should appear once. Connect devices through Together for connected races; Times Tables Rally also supports taking turns on one device.
4. Open My progress. Check older game/music results and times-table facts as well as new practice. As Dad, select a child; as a child, only their own progress is shown.
5. Open Music → My pieces. Check existing saved pieces and Add a piece. Standard scanning and import do not need AI.
6. Open Family quiz → Saved questions and check your existing authored questions.
7. If you want to test AI, re-enable it as Dad. Use only your own or synthetic material in Advanced adult AI tests while child-data approval is pending.

The mixed-worksheet scanner improvements from the previous package are included: higher image detail, acceptance of readable supported topics on mixed pages, and separate messages for unsupported, unclear, privacy-blocked and incomplete scans. This does not add shape, symmetry, money, weight or tally charts as new AI-coached skills.

## Validation and limits

Automated checks cover all original maths skill families in the consolidated question screen, distinct answer choices, column visuals, single game routes, child progress isolation, daily lessons, nine-turn quizzes, AI switches and backup merge/restore. The backend type check, full test suite and production-build dry run passed. AI tests use mocked responses and do not spend API credit.

The final visual/browser check remains unavailable because the preview browser previously blocked refreshing the local preview. There has been no live AI rescan of your photograph. Use the first-check list above after upload.

No saved learning data, pieces, family questions, coins, private goals or PINs are deliberately deleted or reset by this update. Keep regular backups, especially before moving between devices. Adult AI drafts continue to use their existing device-local test storage.

Developer checks: from the repository root, run node tests/learning-core.test.mjs and node tests/learning-client.test.mjs. In maths-ai, run npm ci, npm run check, npm test and npm run build. The build command is a dry run and does not deploy.
