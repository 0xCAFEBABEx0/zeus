# Accessibility

This statement covers the Zeus repository and the two sites built from it:

- **ausor.ai**: the public website (`apps/web`, Astro)
- **cms.ausor.ai**: the content management system for editors (`apps/cms`, Payload CMS)

It describes what the project aims for, what is known not to work well yet, and how to report a barrier. It was written on 2026-11-24 from a review of the code, not from an accessibility audit.

## Goals

We want everyone who visits ausor.ai to be able to read its pages and posts, find content through navigation and search, and send the forms on the site, whether they use a keyboard, a screen reader, zoom, or a light or dark theme.

Our target is [WCAG 2.2](https://www.w3.org/TR/WCAG22/) Level AA for the public website. This is a goal, not a claim of conformance: the sites have not been evaluated against WCAG, by us or by anyone else.

The CMS admin panel at cms.ausor.ai is the standard Payload CMS admin interface, used only by the project's editors. Its accessibility is mostly determined by Payload upstream; barriers in the parts we customise (for example the dashboard and login texts) are in scope here.

## What the website does today

These are features of the code, not test results:

- Pages declare their language (`lang="en"`). The site is in English only.
- Pages are rendered on the server; JavaScript is used only for the theme, the theme selector and form submission.
- The theme follows the operating system's light or dark setting, and a labelled selector in the footer lets visitors choose Auto, Light or Dark.
- Form fields have visible labels connected to their inputs; required fields use the HTML `required` attribute, and submission errors are announced through `role="alert"`.
- The search field has a label, the search icon link has a text alternative, and pagination is a labelled navigation landmark that marks the current page.
- Images use the alternative text that editors enter in the CMS media library.

## Supported environments

The website is built for current versions of the major desktop and mobile browsers. We have not yet tested it with specific assistive technologies (such as NVDA, JAWS, VoiceOver or TalkBack), with keyboard-only use, or at high zoom levels, and we do not run automated accessibility checks in CI.

## Known limitations

| Affected experience | Details | Workaround |
|---|---|---|
| Images may have no text alternative | The `alt` field of media is optional in the CMS. An image uploaded without it is rendered with an empty `alt`, so screen readers skip it even when it carries information. | None for visitors. Editors should fill in alt text for every informative image. |
| Moving video cannot be paused | Videos in media blocks and heroes play automatically, muted and in a loop, without controls to pause or stop them. | None on the site today. Reduce motion settings in the operating system are not taken into account. |
| Pages stay blank without JavaScript | The page is hidden (`opacity: 0`) until a script sets the light or dark theme, so with JavaScript disabled or blocked nothing is visible. | Enable JavaScript for ausor.ai. |
| No "skip to content" link | Keyboard users have to move through the header navigation on every page before reaching the main content. | Use the screen reader's landmark navigation to jump to the `main` region. |
| The home link is announced as "Payload Logo" | The header logo is still the Payload template logo, and its text alternative does not name the site (see T2 in [KNOWN_ISSUES.md](./KNOWN_ISSUES.md#template-leftovers)). | The link always goes to the home page. |
| Required checkboxes are not marked visually | Text, e-mail, number and select fields show an asterisk when required; checkboxes do not, although the browser still enforces them. | The browser's validation message appears when the form is submitted. |
| Only the first submission error is shown | When the CMS rejects a form submission, the site shows only the first error message it returns. | Submit again after fixing the reported field. |

We will add to this list as barriers are reported or found, and remove entries once they are fixed.

## Reporting an accessibility barrier

If something on ausor.ai or cms.ausor.ai is hard or impossible to use, please [open an issue](https://github.com/0xCAFEBABEx0/zeus/issues/new) in this repository. You need a GitHub account to do so.

It helps to tell us, as far as you can:

- the page address and what you were trying to do,
- what happened, and what you expected to happen,
- your browser and operating system,
- any assistive technology or setting you use (for example a screen reader, zoom level or high-contrast mode).

You do not need to tell us about any disability, and screenshots or recordings are welcome but never required. A short description is enough to start.

## What happens after you report

Zeus is maintained by a single person on a best-effort basis, so we cannot promise a response time. We will:

1. acknowledge the issue and label it `accessibility`,
2. confirm the barrier and agree its priority with you, including any workaround in the meantime,
3. link the fix to the issue and ask you to check it on the site, if you are willing,
4. update the known limitations above when the barrier is confirmed and again when it is fixed.

## Expectations for contributors

These apply to people and to coding agents changing the website (`apps/web`) or the CMS components in `packages/core`:

- Use semantic HTML first: real links for navigation, `button` for actions, headings in order, and a visible `label` for every form control. Add ARIA only when HTML has no equivalent.
- Give every informative image a text alternative and mark decorative images and icons with an empty `alt` or `aria-hidden="true"`.
- Keep every interactive element reachable and usable with the keyboard, with a visible focus indicator, in both the light and the dark theme.
- Check text and interface colour contrast in both themes when changing styles.
- Do not introduce new barriers listed above (for example new autoplaying media), and update this document when a change fixes a known limitation or adds a new one.
- In the pull request, say how you checked the change (for example keyboard-only navigation, a screen reader, or a browser's accessibility checker).

## Ownership and feedback

The repository owner ([0xCAFEBABEx0](https://github.com/0xCAFEBABEx0)) is responsible for this statement and reviews it when the website's interface changes. Suggestions for this statement or for the project's accessibility practices are welcome as issues or pull requests.
