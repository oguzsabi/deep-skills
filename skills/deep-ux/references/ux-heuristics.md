# UX heuristics

Walk each section against every screen in scope. A finding needs a concrete moment: what the user tried, what they saw, what went wrong or slowed them down.

## Contents

1. Understandability
2. Hierarchy and layout
3. Interaction and feedback
4. Consistency
5. States, errors and trust
6. Data display
7. Accessibility
8. Responsive
9. Modern and coherent
10. Copy

## 1. Understandability

- Purpose and main action are clear at first sight of the screen.
- Labels use the user's words and the app's glossary, the same term for the same thing everywhere.
- Numbers have units, context and a reference point (of what? compared to what? as of when?).
- Icons are recognisable or labelled; icon-only buttons have tooltips and accessible names.
- Empty states say why they're empty and what to do next.
- Nothing has to be remembered from another screen to understand this one.

## 2. Hierarchy and layout

- One clear primary action; secondary actions visually quieter; destructive actions separated.
- Related things grouped, unrelated things separated; whitespace does the grouping before borders and boxes do.
- Elements align to a grid; repeated items share widths and spacing.
- Important information first (top-left in LTR); details on demand (expand, hover card, drawer).
- Data-heavy screens are scannable: aligned numbers, consistent columns, no visual noise competing with the data.
- Truncated content is reachable in full.

## 3. Interaction and feedback

- What's clickable looks clickable, and what looks clickable is.
- Every action gets feedback quickly: pressed state, spinner, progress, confirmation.
- Destructive or hard-to-reverse actions confirm or offer undo.
- Errors are prevented where possible: sensible defaults, constraints, disabled states that explain why.
- The common task takes the fewest steps; frequent actions aren't buried in menus.
- Hover-only content has a touch and keyboard path.
- Filters, sort and view choices are visible and easy to reset.

## 4. Consistency

- Same component, icon, colour and placement for the same meaning across the app (status colours, buttons, dialogs, chips, tables).
- Matches the design system's tokens: spacing, radius, shadows, type scale, colours.
- Same date, number and currency formats everywhere.
- Interaction patterns match neighbouring screens (where actions sit, how filters behave, how details open).

## 5. States, errors and trust

- Loading looks like the content that's coming (skeletons aligned with the real layout).
- Error messages say what happened and what to do; the user can retry or recover without losing work.
- Partial data is labelled as partial; stale data shows its age.
- Counts and totals agree with each other across the screen and with linked screens.

## 6. Data display

- The chart or table type fits the question the user asks of the data.
- Legends, axes and units present; colour is never the only carrier of meaning.
- Sorting and comparisons are where the user expects them.
- Zero, missing and "not applicable" look different from each other.

## 7. Accessibility (WCAG 2.2 AA)

- Contrast: text 4.5:1 (3:1 for large text), UI components and meaningful graphics 3:1.
- Target size at least 24×24 px; 44×44 px recommended on touch.
- Visible focus, logical tab order, everything reachable and usable by keyboard.
- Accessible names and roles for controls; dynamic changes announced.
- Works at 200% zoom; respects reduced motion.

## 8. Responsive

- No horizontal page scroll at 375 px; wide tables scroll inside their own container with sticky context.
- The phone layout keeps the content that matters most, not just a squeezed desktop layout.
- Touch targets and spacing grow on touch; nothing depends on hover.

## 9. Modern and coherent

- A consistent type scale and weight hierarchy; no more sizes and weights than needed.
- Consistent spacing rhythm, radius and elevation.
- Motion short, purposeful and consistent (state changes, not decoration).
- Flat, calm surfaces over nested boxes, heavy borders and stacked shadows.
- No dated patterns: modal on modal, walls of identical buttons, unexplained icon rows, tiny grey text for important information.

## 10. Copy

- Short and specific; verbs on buttons ("Export CSV", not "OK").
- One capitalisation style (sentence case unless the app uses otherwise).
- No internal jargon, ids or technical terms the user doesn't use.
- Translations fit and read naturally; plurals right for 0, 1 and many.
