# ETM Sync & Together Reliability Fix — 15 November 2026

This is a combined update to the existing GitHub/Cloudflare app. It is packaged for upload and has not been deployed to your live account.

## Fixes for the reported laptop/phone and Together problems

This is the full combined app, including screen sharing and the prior learning/game updates. It has not been deployed to your account yet.

- The old “A saved item is too large to sync” limit has been replaced with automatic, resumable transfers in small parts. Music/photo data is checked for integrity before publication and after download. Existing local pictures are not deleted, reduced or reimported.
- Failed or slow data transfers no longer occupy the family-message connection. Presence, chat and screen-share signalling have their own retry pump.
- Together and Chat use the same verified family-member list. Brief dropouts retain the names and show a reconnecting state rather than repeatedly losing everyone. New members exchange identity/presence automatically.
- Retrying a failed data connection preserves an existing video call and video tile. A full peer restart is avoided while a working call remains active.
- Chat Send can work through the signed family relay without a direct data channel. It explains an empty message, short sending pause or missing family recipient. Delivery receipts remain acknowledgements from the receiving device, not claims that someone read the message.
- Messages retry automatically for up to five minutes while the page remains open. If the other device reloads, retries can follow the same signed profile key to its new device ID; they do not follow a changed PIN/key. Duplicate delivery is not displayed twice. Closed-page/offline chat archival is not added by this fix.

### What Dad needs to do once

1. Keep the original laptop’s data. Save a family backup for safety; do not restore it or clear browser storage.
2. Extract this ZIP and upload ALL contents to the existing repository root, including maths-ai, connection-health.js and the tests folder. Commit and wait for both GitHub Pages AND the Cloudflare Worker deployment to succeed. This fix changes both frontend and backend.
3. On the laptop, reload ETM with Ctrl+Shift+R. Sign in as Dad, open ☁ Sync and use Sync now. Leave the tab open while the item progress advances. No manual image resizing should be needed for the reported case.
4. Close and reopen the usual link on the phone. Use the same family invitation and the SAME profile whose music you are checking. Allow the receiving transfer to finish, then reopen My pieces. Each profile’s library stays separate.
5. Open Together on both devices. The family names should appear automatically. Type a short message or use a quick reply, then confirm its delivery receipt on the other device. Test a brief connection interruption and check that messages recover without resetting the working video.

The children continue using their existing links and PINs. No new app, API key, account, manual database migration or routine reconnect action is required. The extra transfer table is created automatically by the authenticated backend. Older app versions that encounter a newly transferred large item are asked to refresh instead of interpreting the transfer marker as a music piece.

### Checks completed and remaining limits

Automated tests reproduce a 1.7-million-character saved image, move it between two isolated app clients, reject a corrupted download, resume after a lost acknowledgement, and keep the message pump running while an upload is deliberately stalled. The real D1 tests cover segmented upload/download, atomic publication, integrity checking, idempotent commit retry and profile privacy. Chat tests cover relay-only sending, delivery receipts, same-key reload recovery, duplicate suppression and preserving working media when data closes.

Frontend regressions, the complete Worker suite, TypeScript and the production build dry run are part of validation. Real laptop/phone/Pi behaviour and visual layout still need the device check above. These changes address identified code paths; they do not guarantee connectivity on every router, browser or restricted work network. Screen video still needs a suitable direct media path or the separate Raspberry Pi Connect alternative described below.

## New: Dad can request a screen share

This build includes the previous Family Sync & Discovery revision and adds view-only screen sharing inside Together. No new account, API key, database migration or backend secret is required for ETM’s direct screen-share feature.

### First test on the Raspberry Pi or Windows

1. Update ALL devices to this version. Keep the same family invitation and existing PINs.
2. Open ETM as Emily on the Pi/Windows desktop. Open ETM as Dad on your computer or phone. Wait for both devices to appear in Together.
3. On Dad’s device, open Together → Share a screen → Request Emily’s screen. If the list was opened before Emily connected, choose Refresh devices.
4. Emily sees an approval dialog. She chooses Choose screen & share. The browser then opens its own selection window.
5. Choose Entire screen and confirm in that browser window. Choosing only an ETM tab shares only that tab; ETM cannot force or bypass the browser’s selection.
6. Dad sees the selected screen in a floating viewer. Use Enlarge or Full screen for a larger view. On the Pi, switch to another program and confirm Dad can still see it. Keep the ETM tab open.
7. Either person can stop through the ETM control. Emily can also use the browser’s Stop sharing control. Declining, cancelling the browser picker, switching profiles or leaving ETM stops/ends the session. An unanswered request expires after 90 seconds; a failed connection times out after 30 seconds. An established session stops if the other endpoint no longer sends authenticated heartbeats for 45 seconds.

The existing microphone controls remain available for conversation. This release shares video only, without system audio, remote mouse/keyboard control or recording. Camera calls keep their existing separate connection. Guests cannot request or receive these family screen shares. Only Dad can request a child’s screen, and the child must approve each session. Nothing is captured merely because Dad sends a request.

### Devices and connections

Desktop capture depends on the Raspberry Pi/Windows browser, operating-system support and screen-capture permissions. The Pi’s desktop capture service may need configuring. iPads/phones should not be assumed to support broadcasting their whole screen from a web page; unsupported browsers show an explanation rather than attempting camera capture. Dad’s device can view through WebRTC where supported, including mobile browsers, but the actual device still needs testing.

ETM uses a separate WebRTC connection for screen video. Signed offers, answers, candidates and stop messages travel through the existing family connection/temporary message relay. The message relay does not carry screen pixels. The default connection uses a public Google STUN service to discover network routes. Screen video is encrypted in transit by WebRTC; it is not sent to OpenAI or saved in family storage. Connection metadata can pass through the existing short-lived signalling relay.

There is no configured TURN video relay in this package. Some home/mobile/work networks will prevent a direct media connection even when family sync works. ETM reports the failure rather than pretending sharing succeeded. The network and capture compatibility of your actual Pi have not been verified here.

### Raspberry Pi Connect for desktop control or a blocked direct connection

Together includes links to Raspberry Pi Connect and its official setup instructions. This is a separate remote-desktop service, not an embedded ETM feature. It provides desktop viewing and mouse/keyboard control through its own account and permissions. ETM does not install it or sign you in.

Use the full Raspberry Pi Connect client on Raspberry Pi OS Bookworm or later, Wayland and an existing desktop session. Connect Lite does not provide desktop sharing. Set it up on the Pi with your own account, then open https://connect.raspberrypi.com/ on Dad’s device. It can relay a connection when a direct route is unavailable.

Official reference: https://www.raspberrypi.com/documentation/services/connect.html
Browser capture reference: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia

### Screen-share validation

Automated tests simulate two device contexts and media peers: a request alone does not capture; only the consent-button path calls getDisplayMedia; mismatched devices/sessions are rejected; offers/answers and early ICE candidates negotiate; the viewer never captures a local stream; decline, browser denial, browser Stop, late capture after profile change, request timeout and heartbeat expiry stop the tracks and close the connection.

These are simulated-media checks, not an actual video transmission test. Real Raspberry Pi capture, phone playback, network traversal, browser fullscreen behaviour and visual layout require the checklist above. The preview browser remains unavailable for visual verification. No AI requests or real screen recordings were used during automated tests.

## Install this version

1. On the device that has your existing pieces and progress, unlock Dad and download a family backup. Keep it somewhere safe. Do not clear browser data.
2. Extract ETM_Reliability_Fix.zip.
3. Open ETM2026/etm-whiteboard on GitHub, main branch. Choose Add file → Upload files. Upload ALL extracted contents to the repository root, including assets, maths-ai and tests. Do not upload the ZIP or an enclosing folder.
4. Commit and wait for BOTH GitHub Pages and the Cloudflare Worker build to succeed. Uploading only index.html will not enable syncing.
5. Refresh the original device. On Windows use Ctrl+Shift+R. Unlock Dad first, then open the Family sync status in the header. Wait for Family synced. Existing public family credentials are refreshed automatically when Dad connects. No new OpenAI key or API payment is needed.
6. Open the same family invitation on your phone/tablet, then sign in with the relevant profile PIN. A matching room code alone is not sufficient: devices need the same family signing keys. Copy family invitation is available in Family sync and Family PINs.
7. Open Music → My pieces on the phone. Allow up to 15 seconds for the background data check; use Sync now to check immediately. Refresh or re-enter My pieces after sync if that screen was already open.

The existing Worker/D1 binding is used. The two new sync tables are created automatically by the authenticated sync route. Existing migrations, Wrangler configuration, backend address, secrets and child-AI privacy settings remain in place. If the service says Dad must connect the family first, use the existing Backend connection screen; do not replace an existing family or create new PINs just to enable sync.

## What is new

### Data follows the family

- Music pieces, titles, arrangements, favourites and practice status.
- Standard learning records, piano study records and guided-course completion.
- Signed results/coins and Dad’s signed result corrections.
- Profile settings, including game hints, maths support and times-table facts.
- Family-authored quizzes and saved stories. These creations are family-shared; a child cannot claim another profile as the author in cloud storage.
- Dad’s shared reading material and saved drawing board. Incoming drawings are deferred until a home/parent screen, so an active drawing is not replaced.
- Santa’s Lists, including attached pictures, using their existing item-level merge rules.
- Dad’s encrypted private goal vault and its matching verifier, readable through the sync service only by Dad.

Existing records upload from their original device after sign-in. Local learning remains saved before it uploads. Signing out of a profile stops that profile’s pending requests from applying to another profile. Guests do not upload their private practice. Sync does not call OpenAI or consume API credits; Cloudflare hosting/storage usage still applies.

Sync is authenticated by the existing family keys over HTTPS. Ordinary pieces and learning records are stored in your family backend; they are not end-to-end encrypted by this revision. The private goal vault retains its existing encryption. PIN private keys and OpenAI secrets are not uploaded by sync. Photos already attached to saved music and Santa lists are included in family storage, not sent to AI by syncing.

### Conflicts and limits

Version checks reject stale writes. Progress histories merge by stable identifiers. Conflicting music edits become a separate “recovered edit” arrangement so both versions can be reviewed. Piece deletions have retained tombstones. Conflicting private charts/drawings keep a recoverable device copy; Dad can download it from Family sync. Keep backups as well.

Independent times-table sessions can update the same aggregate fact simultaneously. Their fact totals merge conservatively using the larger count, rather than adding potentially duplicate totals; signed completed-session records remain separate. Do not interpret the aggregate counter as an exact sum of simultaneous offline practice.

Large saved items now transfer in small verified parts, up to a safety limit of 12 million JSON characters per item. Items beyond that limit are named for Dad’s review while smaller items continue syncing; they do not block the family message connection. Original local images and music are retained. Sync uses bounded batches. Already-open activities keep working without internet and retry changes when online. Reopening ETM without internet is not guaranteed yet; this is not a complete offline/PWA release.

Live game state, microphone/video recordings, guest sessions, device diagnostics and adult AI draft storage are not turned into cloud archives. Text chat keeps its existing delivery/history design. The full account-wide archive/restore design for those separate systems is not part of this revision.

### Together fallback

Signed family messages can use a short-lived server relay when the direct browser connection fails. Family presence updates automatically, and the Together drawer lists who is here. Reconnect Together restarts the direct connection and checks the relay. The relay polls around once a second while the app is open; network delays can still affect timed games. Camera and microphone calls still require the direct connection. This fixes the discovery dependency; it does not add a video-call relay.

### Interactive maths

Maths → Learn & practise → Build it · interactive discoveries includes:

- Count and match with boats.
- Build a number with counters.
- Tens/units subtraction with an exchange and a matching written-column display.
- Equal-group multiplication visuals.
- Interactive equal fraction strips.
- Missing-number balance activities.

Emily’s exchange activity lets her tap or drag blocks to remove units/tens. Exchanging preserves total value. The final question uses a fresh generated problem without the objects, so completing an animation alone is not treated as independent understanding.

Choose Teach me, Let me try or Challenge. Challenge removes hint buttons. Teach me guides the first activities, then offers an independent transfer question. Hints are deliberately bounded and use separate examples; the app does not infer a diagnosis from one wrong answer. The progression is a foundation: fraction comparison, interactive division and a complete multi-stage adaptive curriculum remain future extensions.

Today’s existing number adventure now chooses one of these short discoveries using recent independent/helped evidence. Free choice and all existing standard skills remain. My progress → What to practise next describes observed practice and suggests the next activity. These are app observations, not a school grade.

### UNO and Checkers

Colour Clash is now labelled UNO, with original ETM curved-panel card artwork, larger numerals and clear action symbols. Existing classic rules remain: seven cards, no stacking, Wild +4 challenge, UNO call/catch, two-player Reverse as Skip, one round or 500-point match. Simple mode remains a labelled teaching variant.

Both games have a Show hints toggle. Its setting follows the signed-in profile; guests use a temporary setting. With hints off:

- UNO cards are equally selectable. Invalid choices are rejected after selection; the hand does not reveal the playable cards through disabled styling. Wild +4 advice is hidden. UNO call/catch controls remain available without announcing the moment to use them.
- Checkers shows no destination dots or legal-move highlighting. Selected-piece feedback remains so players know which piece they tapped. Legal moves and compulsory captures are always enforced.

Both games still use one device and private pass-screen hands where applicable. This update does not turn them into remote multiplayer games.

## Test on your devices after upload

1. Wait for Family synced on the device with your original pieces. Sign into the same profile on the phone and check the same library. Add a favourite on one device, Sync now on both, then reopen the library.
2. Sign in as Dad and Emily on two devices. Open Together and wait for both names. Try a shared maths invitation. Check the relay status separately from camera/microphone connectivity.
3. Open a piece on both devices and change its title differently. Sync both. Expect the current arrangement plus a recovered copy; remove the unwanted copy after review.
4. While ETM remains open, disconnect internet, finish a short practice, reconnect and Sync now. Check its progress on the other device.
5. Use Emily → Maths → Learn & practise → Build it. Exchange a ten, remove the specified units/tens, enter the result and finish the fresh third question.
6. Turn Show hints off in UNO and Checkers. UNO should give no disabled-card clues; Checkers should show no destination dots. Deliberately try an illegal move and confirm it is rejected.
7. Check Dad/child separation: a child must not see Dad’s private charts or another child’s private learning records. Family-authored quizzes and stories are intentionally shared.

## Retained features

The prior piano-study revision is included: optional original RIAM-related guided learning, sampled acoustic piano, percentage comparisons, searchable/grouped pieces, score following, tempo changes and existing games/subjects. Higher RIAM grades remain practice plans rather than full taught courses. Teacher-lesson importing remains deferred. Reimport original MusicXML/MIDI files to recover tempo changes that old imports discarded.

Piano attribution: Salamander Grand Piano V3 by Alexander Holm, CC BY 3.0; MP3 distribution from Tone.js. Sources and licence are in assets/piano/README.txt. Upload that entire folder.

## Verification

Automated frontend checks cover the existing activities plus 1,000 exchange problems, a complete exchange UI journey, no-hint game behaviour and two isolated sync clients exercising migration, conflicts, deletes and offline retries. The Worker tests exercise D1 storage, access control, stale-write rejection, signed relay and all-child sync without granting AI access. All original backend tests, TypeScript checks and the build dry run are included in validation.

A fresh browser visual check remains unavailable because the preview browser previously blocked refreshing the local preview. Real phone/tablet networking, video calls, USB piano and the live Cloudflare deployment need the device checklist above. No live provider calls were used for tests, and the reported Together failure has not been reproduced on your actual devices.

Developer checks: node --test tests/*.test.mjs at the root. In maths-ai: npm ci, npm run check, npm test, npm run build (dry run).
