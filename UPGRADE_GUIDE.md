# ETM Piano Study Revision

This is the next combined version of ETM. It replaces the overlapping menus while retaining the working games, teaching activities, original records and AI-off learning. It is ready to upload; it has not been published to the live app.


## New in this revision

- **Optional guided piano learning:** a panel beside the familiar Music activities. Dad starts with beginner foundations; children start at their existing music stage. Short original activities cover keyboard orientation, finger numbers, pulse, left hand, coordination and chords. Elementary through Grade 1 include reading, rhythm, listening, theory, technical work and original phrases. Grades 2–8 provide practice plans using the existing technical tools and your own scores, not complete higher-grade taught courses. Stage, syllabus and album year are selected separately for each profile. Completing an activity never awards an official RIAM grade or changes the selected grade automatically.
- **Practice percentages:** new assessed sessions show the relevant percentage and counts. Maths distinguishes independent first answers from helped answers; note/theory practice counts first answers; scales count steps completed without a detected wrong note. Piece practice shows note accuracy, with a separate timing percentage in Keep the beat. Rhythm-only practice is labelled rhythm coverage and does not claim to check pitches. Comparable records use matching settings, including score content, bars, hands, speed, mode and visual/audio aids. Earlier results remain available; old percentages are not invented.
- **Follow my place:** in Sheet music, the current bar is tinted, a vertical marker crosses both staves and Wait for me highlights the expected notes. A progress bar shows position through the selected passage, independently of the accuracy score. Bars move into view automatically (one at a time on narrow screens). Turn Follow my place off to browse with Previous/Next bars. Listening and timed practice follow the score clock; Wait for me follows the required notes.
- **Tempo changes:** MusicXML and MIDI imports now retain written tempo changes. Dotted-quarter markings are converted correctly to quarter-note timing; compound metres use the appropriate pulse. Listening, the playhead, metronome and other-hand accompaniment share the tempo map. The speed percentage scales the whole piece. Advanced practice tools → Follow the score’s tempo changes can be switched off for one steady tempo. MIDI metre changes also retain their bar boundaries.
- **My pieces library:** search titles, composers and arrangements; filter All, Practising, Favourites or Completed; sort by recently played, recently added or A–Z. Easy and harder arrangements group under a song title. Details & arrangements lets you correct the group, title, label and composer. Dad can copy an arrangement into another profile. Libraries remain separate by profile and part of the existing family backup.

These additions work without AI and do not spend API credit. Existing games, AI switches, piano recordings, pieces and saved records are retained. Teacher-lesson importing/synchronisation remains deferred.

**Existing imported songs:** the older importer discarded tempo changes, so they cannot be recovered from an already-saved piece. Import the original MusicXML/MXL/MIDI file again to use its written changes; keep or remove the older arrangement as you prefer. Manually entered and scanned pieces continue with their reviewed tempo. The sheet view remains a simplified note guide, not a complete engraving with all rests, expression and fingering.

## First checks after installing

1. Make a family backup before upload. After refresh, open Music and check the familiar free-practice activities and optional guided panel. Dad can start with Find your way around the keys.
2. Finish a short practice with a deliberate wrong answer/note. Check the percentage and counts. Repeat with the same settings to see a comparison; change the speed or hand to start a separate comparison.
3. Open a piece → Sheet music. Try Follow my place on and off, Wait for me, then Listen. Check the current bar, marker and progress bar. On a phone/tablet, check automatic bar changes.
4. Reimport a source file containing tempo changes. Listen at 50%, then at written speed. Switch Follow the score’s tempo changes off and check the steady version.
5. Open My pieces, search a title or composer, favourite an arrangement and change its practice status. Use Details & arrangements to put two versions under one song group. Check another profile still has its own library.
6. Restore your backup only if needed. The update does not require a migration, new key or a settings reset.

## Validation for this revision

All six frontend test files pass, including timing-map inversion at four practice speeds, dotted 6/8 count-in/pulse, MusicXML/MIDI tempo imports, MIDI metre changes, score marker/highlights, matching comparisons, backup merging, library grouping/filtering, guided routing and profile isolation. Existing learning, games and sampled-audio tests pass. The full backend suite, TypeScript check and production-build dry run pass; no live provider requests were made.

A fresh browser visual check could not be completed because the preview browser blocked refreshing the local preview. USB-piano behaviour and listening quality still need checking on your devices. The automated XML import checks use a DOM fixture; test your actual source files using the checklist above.

## Retained from the previous build

- Emily’s addition and subtraction practice now shows the question beside properly aligned column working by default, including blank carry/exchange boxes. Other profiles retain their simpler view unless Column sums is selected. Daily maths practice uses the same Emily column layout.
- Find the note briefly highlights a correct answer, then advances automatically after 550 ms. Wrong answers stay on the same question. Screen taps and MIDI use the same check. Other quizzes still use their normal Next control.
- Scale completion shows completed steps, first-try steps and detected wrong notes. It no longer calls a retried scale perfect. The coin is for completing practice, not a perfect performance. Timing, fingering and technique are not assessed by this scale exercise. This affects new results; old records are retained.
- Piano playback uses 30 packaged Salamander acoustic-grand-piano recordings with pitch-adjusted sampling, rather than the old triangle-wave tone. Scale and piece Listen controls preload their samples. Files load from ETM itself, with no AI cost or third-party sound-service account. A simple fallback tone remains if samples are unavailable. Include the entire assets/piano folder when uploading.
- Piece practice exposes hand, speed and bar selection. Advanced tools include looping, metronome and other-hand accompaniment. Accompaniment works in Keep the beat mode with one hand selected and requires correct hand assignments in the imported score. A clean timed run below full speed offers Try a little faster. Wait for me still checks pitches without assessing timing.
- Checkers adds a tactile wooden board, large pieces, legal-move highlights, compulsory captures, multi-jumps, kings, blocked wins and claimable draws. Rules are English-style draughts, with forward captures for men.
- Colour Clash adds original ETM card artwork and classic UNO-style gameplay: seven cards, colour/number/symbol matching, Skip, Reverse, +2, Wild, +4 and challenges, a ONE call/catch penalty, no stacking, reshuffling and scoring. Choose one round or a full 500-point match. Simple mode is a clearly labelled numbers-and-Wilds teaching variant. Classic reference: https://service.mattel.com/instruction_sheets/uno%20basic%20is.pdf
- Both new games use ONE device in this build. Colour Clash hides hands behind a pass-screen cover between players. Challenge hand disclosures are shown to the challenger, with a Hide hand & continue action. Game state is temporary in the open tab; Continue appears on Games & competitions while that game remains in memory. These games do not create learning results or spend API credit. The existing connected races remain available.

Current-lesson importing and teacher-instruction integration are deferred, as requested. Existing file imports remain available.

## Quick checks for the new features

1. Open Emily → Maths → Learn & practise and choose addition or subtraction. Check the columns and carry boxes, then answer using the large choices. Test Show your thinking and the single Next action.
2. Open Music → Notes & theory → Find the note. A correct answer should advance automatically; a wrong answer should wait.
3. Play a scale with a deliberately wrong received MIDI note, then complete it. Its result must show that wrong note. Playing only the provided correct screen keys cannot reveal mistakes made on an unconnected physical instrument.
4. In a saved piece, select one hand and Keep the beat; enable Play the other hand in Advanced practice tools. Use Listen to hear the sampled piano. Check the score’s hand assignment if accompaniment is missing or wrong.
5. Open Games & competitions → Checkers. Try a capture and a king. Open Colour Clash with two or three different names and check each pass-screen cover before revealing a hand.

Piano sample credit: Salamander Grand Piano V3 by Alexander Holm, CC BY 3.0. MP3 distribution from Tone.js. Attribution and source links are in Music → Piano sound and assets/piano/README.txt.

## Install

1. Download and extract ETM_Piano_Study_Revision.zip.
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

New automated tests also cover Checkers, five full simulated card rounds, card conservation, +4 challenges, private-hand screens, music auto-progression guards, truthful scale records, accompaniment and sampled-audio preloading. All 30 MP3 files decode successfully. Listening quality and USB-piano behaviour have not been verified on your physical devices.

The final visual/browser check remains unavailable because the preview browser previously blocked refreshing the local preview. There has been no live AI rescan of your photograph. Use the first-check list above after upload.

No saved learning data, pieces, family questions, coins, private goals or PINs are deliberately deleted or reset by this update. Keep regular backups, especially before moving between devices. Adult AI drafts continue to use their existing device-local test storage.

Developer checks: from the repository root, run node --test tests/*.test.mjs. In maths-ai, run npm ci, npm run check, npm test and npm run build. The build command is a dry run and does not deploy.
