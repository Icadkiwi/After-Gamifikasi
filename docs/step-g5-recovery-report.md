# CODEX G.5 RECOVERY & VERIFICATION REPORT

Scope: takeover recovery and verification only. The starting working tree already contained staged, unstaged and untracked work. Findings and file ownership below are relative to the takeover snapshot, not HEAD. No commit, staging, reset, asset deletion or new feature was performed.

## 1. Root Cause

`src/components/GameCanvas.tsx` had G.5-only assignments to `containerRef.current.__PHASER_GAME__`. React can detach the DOM ref before the effect cleanup runs, including the development StrictMode lifecycle. The TypeScript cast did not protect the runtime null value. The optional chain on `querySelectorAll` protected only that expression, not the following property assignment. Cleanup consequently threw `Cannot set properties of null (setting '__PHASER_GAME__')`, reached the router error boundary, and left no usable canvas.

This was test instrumentation, not Octalysis, Vite, Firebase or learning logic. The browser test depended on that exposure and private scene members through `eval`; neither was necessary.

## 2. Surgical Repair

- Removed only the G.5 exposure and manual canvas removal additions from GameCanvas. Kept its existing user-scoped creation, Phaser `destroy(true)`, ref reset, interaction subscription and rendering structure.
- Used the existing `getNextStreakGift` selector for the next gift label. Looking up exactly `currentStreak + 1` incorrectly showed all milestones completed at days 0, 1, 3, etc.
- Put daily reward limits, Mystery Mission and existing mission cards in one bounded scroll area below the fixed panel header. The previous nonshrinking additions exhausted the available height and clipped content.
- Replaced the City Hall level-1 sentence claiming a barber was operating when the default save contained only Bank and City Hall.
- Added canvas-target checks to vehicle press/release handling. Phaser receives window mouse events as well as canvas events; clicking a mobile React mission control had opened the taxi behind it. This pre-existing bug blocked verification, so it received a minimal repair.
- Reused the G.5 runner, with visible startup diagnostics, spawn-error handling, failure exit codes, and an optional mode for the existing smoke tests and owned production-preview process. Tests use DOM, storage, real clicks and existing public events, never a private Phaser instance.

## 3. Product Recovery

| Gate | Result | Evidence |
| --- | --- | --- |
| Local Access | PASS | Real `Coba User Lokal` button |
| /game | PASS | Navigation and rendering complete |
| Phaser initialization | PASS | Rendered city, saved starters and responding sprites |
| Canvas | PASS | Exactly one visible canvas on entry, reload and re-entry; none after logout |
| Runtime error | PASS | No router error boundary, pageerror, console error or failed resource in final G.5 run |

The independent `--recovery-only` gate passed before feature verification or Octalysis UI repairs.

## 4. Browser Verification Matrix

The final automated run records **31 PASS, 1 PARTIAL, 0 FAIL** in `screenshots/step-g5/results.json`. The broader matrix also includes manual screenshot findings; automation did not certify color contrast.

| Feature | Status | Evidence / Notes |
| --- | --- | --- |
| Main City | PASS | Real canvas, Bank, fence, City Hall; later purchased barber/taxi visible |
| Bank | PASS | Sprite click opens existing upgrade UI; existing smoke also upgrades Bank |
| Vehicles | PASS | Real taxi purchase, one NPC via public city-progress event, moving road frames and reload |
| City Hall | PASS | Visually reasonable scale, separated from Bank, clickable, protected starter |
| City Hall Modal | PASS | No sell/upgrade action; metrics equal live public city progress; no fake mastery/AI/community |
| School | PARTIAL | Not placed in default scene; Learn opens existing dashboard and assessment works |
| Shop | PASS | All 56 rendered shop cards inspected; Hall, School and Streak excluded |
| HUD | PASS | Level, EXP, currencies, streak and next gift readable |
| Coin | PASS | Existing `Props/Coin.png` loaded; real purchase deduction and income tick |
| Diamond | PASS | Existing `Props/Diamond.png` loaded; milestone gift delta exactly 20 |
| Streak | PASS | Valid assessment advances prior-day fixture to day 3; reload does not duplicate |
| Streak Protection | PASS | Ineligible at 0; eligible prior-day streak protected once, persists, no reward/mastery change |
| Daily Mission | PARTIAL | Opens and all content scrolls; legacy header/control contrast remains poor in dark theme |
| DailyRewardLimit | PASS | Existing card and accessible limit explanation present on both viewports |
| Mystery Mission | PASS | Actual question/options identical after reload; feedback gives no mastery/EXP/diamond/streak |
| Mystery Gift | PASS | No premature reveal; configured day-3 gift, one receipt, one reveal, no repeated payment on reload |
| Desktop | PASS | 1280 x 800 layout and modal checked; legacy panel contrast caveat above |
| Narrow/mobile | PARTIAL | 390 x 780: no horizontal overflow; modal, scrolling and controls usable; same legacy contrast issue |
| Phaser pointer interaction | PASS | Bank/Hall clicks, mobile pan and Hall click; overlay clicks no longer open a taxi |
| Console/runtime | PASS | 0 page errors, console errors, failed resources, HTTP errors or warnings in final G.5 run |

## 5. Screenshots

Actual Chrome screenshots, also visually inspected:

- `docs/screenshots/step-g5/01-main-city-desktop.png`
- `docs/screenshots/step-g5/02-hud-streak-desktop.png`
- `docs/screenshots/step-g5/03-daily-mystery-panel.png`
- `docs/screenshots/step-g5/04-cityhall-modal.png`
- `docs/screenshots/step-g5/05-narrow-mobile.png`
- `docs/screenshots/step-g5/06-mystery-gift.png`
- `docs/screenshots/step-g5/07-narrow-missions.png`
- `docs/screenshots/step-g5/08-narrow-cityhall.png`
- `docs/screenshots/step-g5/09-city-vehicles.png`
- `docs/screenshots/step-g5/10-vehicle-motion-before.png`
- `docs/screenshots/step-g5/11-vehicle-motion-after.png`

`00-recovery.png` and `recovery.json` record the initial recovery gate. `12-before-vehicle-overlay-fix.png` and `verification-failure.png` are historical failure evidence, not the final result. The pre-existing `00-diagnostic-failure.png` was preserved. Existing smoke screenshots went into `docs/screenshots/step-g5/existing-smokes/`, preserving earlier workstream screenshots.

## 6. Bugs Found

| Bug | Category | Root cause | Fix | Regression risk |
| --- | --- | --- | --- | --- |
| Null GameCanvas cleanup | C | Unguarded test exposure assignment after ref detachment | Remove exposure and ad hoc canvas cleanup | Low; entry/reload/unmount/remount verified |
| Incorrect next streak milestone | B | Exact next-day lookup rather than next configured milestone | Reuse existing next-gift selector | Low; days 0 and 3 checked; rewards/rules untouched |
| Mission content clipped | B | Two nonshrinking cards above a shrinking mission list | One shared bounded scroll area | Low; desktop 364px and mobile 308px scroll viewport verified |
| False City Hall barber claim | B | Static sentence assumed an unowned building existed | Neutral level-1 narrative | Copy only |
| React clicks opened vehicle behind overlay | A | Existing vehicle handler accepted window mouse events targeting React elements | Check canvas target on down/release | Low; browser overlay/pan/city interaction checked; movement unchanged |
| Unsound G.5 assertions and diagnostics | D | Private scene/eval dependency, wrong UI labels/selectors, presence-only determinism check, boolean status, insufficient runtime capture and nonfailing FAIL records | Observable assertions, explicit evaluate arguments, exact state comparisons, all error channels, proper exit failure | Test only |
| Low contrast in existing daily panel header/controls | A | Inherited dark text on dark panel; existing styling predates Octalysis additions | Documented; no broad theme redesign | Unchanged |

The initial sandbox `spawn EPERM` during Vite configuration was an environment restriction, not an app defect. The same local runner succeeded with approved process execution; no dependency or Vite redesign was needed.

## 7. Files Modified by Codex

PRODUCT FILES:

- `src/components/GameCanvas.tsx`
- `src/components/city/CityHallModal.tsx`
- `src/components/gamification/DailyMissionPanel.tsx`
- `src/gamification/streak/useStreakGamification.ts`
- `src/game/VehicleMovementSystem.ts`

TEST/VERIFICATION FILES:

- `tests/step-g5-browser-verify.mjs`
- `tests/run-step-g5.mjs`
- `tests/browser-learning-smoke.mjs` (optional screenshot output directory only)
- `tests/browser-local-access-smoke.mjs` (optional screenshot output directory only)
- This report and the G.5 screenshots/JSON artifacts.

## 8. Core Files Preserved

AssessmentService, LearnerProfileService, PracticeService, LearningService, assessment scoring, mastery, learning evidence, reward authority/configuration, streak service/rules, authentication, Firebase, UID scoping and persistence schemas were not modified. GameScene, GamePage, GameEvents, shop catalog, building roles, assets, agent foundation, package files and unrelated changes were preserved. Baseline SHA-256 comparisons isolate changes to the nine source/test files listed above. The staged patch is unchanged.

All mutation scenarios use a fresh isolated browser context and the local preview user. Fixtures provide purchasing funds/Bank capacity, a near-complete passive-income accumulator, and a prior-day streak. The actual purchase, placement, income tick, protection action and learning assessment execute through the app. Fixtures do not demonstrate real multi-day usage or real Firebase authentication. No production account was created. Buildings, coins, passive income, gifts and streak are not treated as curriculum or mastery evidence.

## 9. Octalysis Work Preserved

| Drive | Status at this checkpoint |
| --- | --- |
| CD1 | Partial foundation: City Hall/progress UI works; narrative contract preserved; School absent from default city |
| CD2 | Existing EXP, levels, achievements and learning progression preserved; learning smoke passes |
| CD3 | Existing placement, move/drag and undo implementation preserved; placement and camera interaction exercised; not a complete undo re-audit |
| CD4 | Ownership, buildings, vehicles and persistence work; Inventory UI remains incomplete |
| CD5 | Inactive contract only; no authoritative community backend or active social feature |
| CD6 | Existing daily mission/limit foundation integrated; scrolling repaired; legacy contrast issue remains |
| CD7 | Deterministic mission and gift foundation verified; no paid random reward/gambling flow |
| CD8 | Existing streak, protection and deterministic milestone foundation verified |

## 10. Regression Results

All final commands below completed with exit code 0 after the product repairs:

| Command | Result |
| --- | --- |
| `node tests/run-step-g5.mjs --recovery-only` | PASS (initial independent gate) |
| `node tests/run-step-g5.mjs` | PASS execution; 31 PASS / 1 PARTIAL / 0 FAIL checks |
| `node --import ./tests/register-test-loader.mjs --test --experimental-test-isolation=none tests/streakMystery.test.mjs` | 15/15 PASS |
| `npm test` | 77/77 PASS |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run build` | PASS |
| `git diff --check` | PASS |
| `node tests/run-step-g5.mjs --existing-smokes` | PASS: both existing learning and Local Access browser smokes |

The existing smokes cover both learning loops, mastery/reward persistence, Bank upgrade, vehicle purchase, admin/user isolation, reload/logout, login/register validation, narrow layout, and production preview rejecting stale local sessions. Both owned servers stop and release ports 5176/4176. Build warnings about a >500kB bundle and asset-plugin timing remain warnings, not failures.

## 11. Remaining Issues

- School is not placed, so its actual sprite-to-learning route is not exercised; the existing Learn button works.
- Legacy daily panel title/summary/control text has poor contrast in the current dark theme (see screenshots 03 and 07).
- Inventory is incomplete and CD5 has no authoritative backend; both remain outside this recovery scope.
- Build still warns about bundle size; no code splitting or asset optimization was attempted.

## 12. Recommendation for Next Step

Make a small, separate contrast/accessibility pass on the existing daily-panel title, summary and minimize control, with desktop/mobile screenshots. Stop this recovery checkpoint here; do not begin Inventory, School placement, community backend or AI work.
