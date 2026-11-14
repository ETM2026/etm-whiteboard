# ETM full AI test lab

This update is prepared for ETM2026/etm-whiteboard and its existing Cloudflare Worker. It is not live until uploaded and deployed. It reuses the current family connection, API key, database and shared allowance. There are no database migrations or new secrets.

## Install

1. Download and extract ETM_Full_AI_Test_Lab.zip.
2. Open the root of ETM2026/etm-whiteboard on GitHub. Choose Add file → Upload files.
3. Upload the extracted contents directly, including the maths-ai folder and all root JavaScript/CSS files. Do not upload the ZIP or an extra enclosing folder.
4. Commit with “Add full Dad AI test lab and visible Next controls”.
5. Wait for Cloudflare’s latest deployment to show Ready and GitHub Pages to finish publishing.
6. Open ETM, press Ctrl+F5, unlock Dad and open Parent Tools → Full AI test lab.

Leave ETM_AI_ZDR_CONFIRMED=false and Emily’s AI disabled. The lab’s Dad-only access switch is the existing separate test switch. It can be turned off without changing Emily’s settings.

## Maths photo test

1. Open Maths photo test → Scan a test worksheet.
2. Use your own adult test handwriting, or choose Use a made-up sample worksheet.
3. Adjust the crop. Review exactly what will be sent, then tick the adult-test confirmation.
4. Send this crop to AI. Check the recognised skill and tick its confirmation.
5. Try method hints and a learning visual. Neither should supply the worksheet’s answers.
6. Use Photograph my test working to test AI classification of an intentionally mistaken method. Use your own writing, not a child’s work.
7. Start separate AI-marked practice. Try correct and incorrect answers and check that difficulty changes. Recognised original exercise operands are excluded from generated practice.

The whiteboard is local. Only explicitly selected crops are sent. Photos are not stored by ETM. The scan saves only supported topic and exercise classifications for the adult test, separately from child homework records. This does not mean OpenAI applies Zero Data Retention to an adult test request.

## Piano AI test

1. Try the existing demo to check Sheet Coach, falling notes, sheet view, on-screen keys or a USB MIDI piano.
2. Generate a four-bar original exercise. First steps uses C4–G4 in the right hand; Growing introduces a wider range and simple left-hand notes; Challenge allows both hands within an octave per hand.
3. Review the note table. Edit bar, beat, note, duration and hand. Preview the edited notes, then confirm you have checked them.
4. Open falling notes & piano. Play the test yourself. Choose “Keep the beat” for timing practice; “Wait for me” checks note matching without assessing timing.
5. At the end, choose Get AI plan for this adult test. Review the numeric summary, confirm it is your own run, then request a three-step practice plan.
6. Test Scan a short score with one to four simple, clearly cropped bars in 2/4, 3/4 or 4/4. Correct every pitch, accidental, hand and duration before playing it. AI scanning is an experimental estimate, not verified optical music recognition.
7. Optionally save the reviewed test draft on this browser. No photo is saved with it.

The AI plan receives only note-match counts, weak bar numbers and practice settings. No recording, title, name, age, profile or learning history is sent. The app does not listen to audio or assess posture, touch or expression. MIDI/on-screen note checking remains local; AI creates the exercise and the practice plan. Lab pieces do not award coins or add child progress.

Browser/hardware MIDI compatibility must be checked on your own device and Yamaha connection. Physical MIDI and live photo-recognition accuracy have not been verified by this update’s automated tests.

## Quiz generator and competition test

1. Choose two or three anonymous test slots, three or five questions each, and a topic and level for every slot.
2. Generate a quiz draft with AI. The request contains only listed generic topics, broad levels, slot numbers and question counts.
3. Open each player’s review section. Edit every question, four options, correct option and explanation as needed. AI can get facts wrong.
4. Tick the review confirmation. You can save the draft on this browser, then start the competition test.
5. Simulate players taking turns on one device. Read-aloud uses the browser’s speech feature where available. Every correct answer earns ten points; there is no speed bonus or penalty for taking time.
6. Finish the match and test ties, an incorrect answer, replay and editing. Playing, scoring and replaying a generated quiz make no further AI requests. Answers and results are not sent to AI.

This version is a Dad-run test match. It does not expose the lab to child profiles or provide remote multiplayer. Different levels and topics have equal turns and points but are not formally calibrated for equivalent difficulty. Review the experience before expanding child access in a later update.

## Visible question controls

The active Check or Next action is mirrored in a fixed bottom bar, with feedback alongside it. The original button is visually hidden while mirrored, so only one control is shown. The original handlers and disabled/busy state are preserved. The next question is brought into view and focused automatically; there is no timed advance.

This covers the AI maths check-up, Dad’s AI marking, ordinary maths practice, music quizzes, times-table practice and the new competition test. Other menus and “Leave game” controls are not moved. Padding protects content from the bottom bar; the bar adjusts for the visible mobile keyboard area.

## Spending and privacy

All AI requests use the existing shared monthly ETM allowance, initially US$5. The app’s ledger is an estimate, not an invoice or provider billing cap. Each call temporarily reserves US$1 and settles to estimated token usage on completion. Definitive rejected requests release their reservation; uncertain network/server failures remain conservatively accounted. Historical unknown failure reservations are retained.

Lab routes require the enrolled Dad signing key, the separate Dad test flag and the existing replay protection. Child roles cannot call lab routes, and lab practice cannot be used as child practice. Adult photo tests require an explicit no-child-work confirmation. Enabling Dad testing does not change the child privacy gate.

Do not enter children’s homework, identifying information or child performance into Dad’s lab while privacy approval is pending. No settings, database IDs or API keys need changing for this upload.

## Verification

TypeScript checks, a Wrangler dry-run build and regression tests cover signed authorization, child isolation, replay protection, shared spending limits, image size/consent, answer suppression, score bounds and uncertainty, anonymous quiz generation, malformed results, frontend review/edit flows, local competition scoring, ties and the Check/Next dock. The existing 1,050 generated-maths checks also pass.

The existing music quiz was opened in a desktop browser: a correct answer showed one visible pinned Next action, and selecting it advanced to the second question. Photo, piano-generation and quiz-generation requests were tested with mocked OpenAI responses. No new live API requests were made with your private key, and no physical keyboard or actual mobile device was available for verification.
