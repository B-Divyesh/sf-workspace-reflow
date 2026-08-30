# Workspace Reflow copy audit

Audited 2026-08-30 against the plain-words baseline. Counts treat hyphenated
terms and slash-separated shortcuts as one word. No sentence exceeds 22 words,
and none contains a banned marketing term.

## First screen

| Copy | Words |
| --- | ---: |
| Browser extension for low-vision work | 5 |
| Make one app pane easier to read | 7 |
| For low-vision workers, it enlarges one region while nearby controls and task context stay visible. | 15 |
| Try it with sample data | 5 |
| Download for Chrome | 3 |
| The sample opens with a selected project update ready to read. | 11 |
| All reading features are free. | 5 |
| Page text stays on your device. | 6 |
| No account is required. | 4 |

The first screen states the user, job, and first action in one breath. The
sample-data action is primary, the real download is adjacent, and the result of
opening the sample is explicit.

## Remaining landing sentences

| Copy | Words |
| --- | ---: |
| No page text is sent away. | 6 |
| Escape always closes the pane. | 6 |
| Press Alt + Shift + R, move over the live region you need, and click. | 15 |
| Choose type size, line width, and light or dark contrast. | 10 |
| Use J/K or arrow keys sentence by sentence. | 8 |
| Save one rule for the site. | 7 |
| The pane reopens on your next visit, while Escape returns focus to the page. | 14 |
| Workspace Reflow isolates only the region you choose. | 8 |
| On desktop, navigation, status, and nearby task context remain visible beside it. | 11 |
| Live region updates flow into the pane. | 7 |
| Headings, lists, links, labels, and image text alternatives remain semantic. | 10 |
| Use it only on page content you are allowed to access. | 11 |
| Save the Chrome package, then unzip it into a folder you will keep. | 13 |
| Visit chrome://extensions and switch on Developer mode. | 7 |
| Choose “Load unpacked,” select the unzipped folder, then pin Workspace Reflow. | 12 |
| This downloadable package is the pilot release. | 7 |
| Every reflow, preference, saved rule, and keyboard feature is free. | 10 |
| Supporter purchases are temporarily unavailable while release setup is completed; nothing essential is withheld. | 14 |
| If you already have a license token, you can still restore and verify it below. | 15 |
| No purchase link is shown until checkout is enabled. | 9 |
| It is an intermediate visual reading tool for people who need stronger reflow than browser zoom provides. | 17 |
| It preserves useful semantics, but it does not replace assistive technology. | 11 |
| No page content, selected text, rule, or preference. | 8 |
| Only an optional supporter license token is sent to Sociobot when you ask to verify it. | 16 |
| Use it on ordinary website pages you are allowed to access. | 11 |
| Browser internal pages do not allow extensions. | 7 |
| Sites that rebuild their markup may require you to select and save the region again. | 15 |

## Terminology

| Concept | One term used |
| --- | --- |
| Browser add-on | extension |
| Chosen page area | region |
| Enlarged reading surface | reading pane |
| Remembered per-origin configuration | site rule |
| Text-width setting | line width |
| Sample environment | demo |
| Optional purchase credential | license token |

## Claim coverage

Every retained product promise maps to `.factory/claims.json`. The key public
groups are demo/account (`demo-sandbox`, `no-account`), local handling
(`local-processing`, `first-party-site`), free and license behavior
(`free-reading`, `license-restore`, `license-offline-status`,
`license-daily-cache`), selection and reading (`pointer-selection`,
`keyboard-selection`, `selection-cancel`, `sentence-navigation`,
`reading-presets`), semantics and live content (`semantic-reflow`,
`live-refresh`), context and viewport (`context-preserved`, `mobile-pane`),
saved data (`saved-rule-reopen`, `data-deletion`), supported pages
(`supported-pages`), package delivery (`package-download`), and offline use
(`offline-reload`). Unprovable Chrome Web Store timing and broad
OCR/paywall/DRM capability copy were removed.
