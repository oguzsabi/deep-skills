---
name: deep-ship
description: Commit, push and open/update pull requests for the current work, in any repo and across several repos at once. Checks exactly what's being committed, writes a brief bullet-point commit message in the repo's own convention, pushes safely, checks whether the work is fully done (plan, tests, docs, open questions), and if it is, opens a PR to the repo's integration branch (from its docs or recent PRs, else the default branch) in every touched repo with a proper reviewer-facing description, or updates the existing PR's description so it keeps matching everything in the branch. Use whenever the user invokes /deep-ship, or says "commit and push", "commit our changes", "push this", "open a PR", "create the PR", "update the PR description", or wraps up work and wants it shipped.
argument-hint: "[optional: extra context, e.g. 'not done yet', a ticket ref, or a base branch]"
---

# Deep Ship

Turn the finished (or partly finished) work into clean commits, push them, and, when the work is complete, into a pull request per repo whose description stays accurate as the branch evolves.

Invoking this skill is the user's go-ahead to commit, push, and create or update PRs to the agreed base branch. It is not a go-ahead for anything unusual: force pushes, committing files of doubtful origin, a different base branch, reopening a merged or closed PR. Those get asked.

## Ground rules

1. **Repo and user rules win.** Read `CLAUDE.md` / `AGENTS.md` / `CONTRIBUTING.md` and project memory first. They decide commit message conventions, attribution lines, branch naming, PR templates, and whether pushing is allowed. Follow the user's rules about attribution trailers and PR footers (for this user: no "Generated with Claude Code" footer in PR descriptions).
2. **Commit only what belongs to this work.** Stage explicit paths, never a blind `git add -A`. Secrets, local config, scratch files, generated artifacts and unrelated changes stay out.
3. **Never bypass safety.** No `--no-verify`, no force push, no amending pushed commits, no committing straight to `main`/`master`/`development` or other protected branches, unless the user explicitly asks for that specific action.
4. **Report reality.** Say exactly what was committed, pushed and opened, with SHAs and URLs. If a step failed or was skipped, say so.

## Workflow

### Phase 1 — Find every repo with work in it

The work may span several repos (e.g. frontend + API + a shared library). Collect candidates from: the current repo, repos whose files were edited in this conversation, the plan's cross-repo/ship-order section, and project memory or handoff docs. For each candidate, check `git status` and whether its branch has unpushed commits. Every repo with uncommitted changes or unpushed commits goes through the phases below. List them before starting.

### Phase 2 — Inspect what would be committed (per repo)

- **Branch.** If the repo is on `main`/`master`/`development`/the default branch, don't commit there. Create a branch following the repo's naming convention (look at recent branch names, e.g. `feature-<ticket>-<slug>`), and confirm the name with the user if it isn't obvious from the ticket.
- **Changes.** Review `git status`, the staged and unstaged diff, and untracked files. For each file decide: belongs to this work, or not. Flag and leave out:
  - secrets, tokens, `.env` files, credentials, personal data;
  - local-only files (`*.local.*`, editor settings, scratch notes) unless the repo tracks them on purpose;
  - build output, coverage reports, large binaries, accidental lockfile churn;
  - changes unrelated to this work (from another task, or pre-existing local edits).
  Ask about any file whose origin you're unsure of rather than guessing.
- **Leftovers.** Scan the diff for debug output (`console.log`, `debugger`, `print`), focused/skipped tests (`.only`, `fit`, `fdescribe`, `.skip`), commented-out code, and conflict markers. Remove the ones this work added; ask about anything else.
- **Grouping.** Usually one commit per logical change. If the changes contain clearly separate concerns (e.g. a feature plus an unrelated fix), commit them separately. Tests and docs go in the same commit as the change they cover.

### Phase 3 — Commit

Learn the convention from `git log -20 --format='%s%n%b'` (and the repo's docs): subject prefix (branch name, ticket number, conventional-commit type), tense and mood, capitalization, line length, trailers.

Write the message:

- **Subject**: the repo's prefix plus a short imperative summary of the outcome, ideally ≤ 72 characters. Describe what changes for the user or system, not which files changed.
- **Body**: a blank line, then 2-6 brief bullets (`- `), each one meaningful change, with the reason when it isn't obvious. Mention tests/docs in a bullet when they're part of the commit. No file lists, no "update X.ts", no filler.
- **Trailers**: whatever attribution the user's and harness's rules require, nothing else.

Commit with a heredoc so formatting survives:

```bash
git add <explicit paths>
git commit -F - <<'EOF'
<prefix>: <Subject>

- <change and why>
- <change and why>

<trailers>
EOF
```

If a pre-commit hook fails, the commit did not happen: fix the reported problem, re-stage, and commit again as a new commit (never `--amend`, which would rewrite the previous commit). If the hook changed files (auto-format), review and stage them.

### Phase 4 — Push

- No upstream yet: `git push -u origin HEAD`.
- Push rejected (remote has commits you don't): `git fetch`, show the divergence (`git log --oneline HEAD..@{u}` and `@{u}..HEAD`), and ask whether to rebase or merge. Never force push unless the user says so; if they do, use `--force-with-lease`.
- If the repo's working agreement forbids pushing, stop after committing and say so.

### Phase 5 — Is the work fully done?

Decide per repo, from evidence:

- **Plan/ticket**: every requirement and plan step is implemented, or explicitly deferred by the user. No open questions from `/deep-plan`, `/deep-review` or `/deep-pr-comments` are waiting for an answer.
- **Checks**: tests, lint, typecheck and build pass. Reuse results from a review run if nothing changed since; otherwise run the quick checks (changed-file lint, typecheck, focused tests) and report what you didn't run.
- **Docs**: the docs the repo expects for this change are updated.
- **Counterparts**: every other repo this work spans is committed and pushed too.
- **The user's word**: if they said it's not done (or it's done), that wins.

If it's **not done**: stop after pushing. List what's still missing, and don't open a PR. If an open PR already exists for the branch, still update its description (Phase 7) so it reflects what's been pushed.

If you **can't tell** (no plan, no ticket, unclear scope): ask whether this is the last piece before opening a PR.

### Phase 6 — Open the PR (per repo, when done)

1. **Existing PR?** Look for a PR from this branch (`references/commands.md`).
   - Open → go to Phase 7 and update it; don't create a second one.
   - Merged or closed → ask: new PR for the new commits, reopen, or leave it.
2. **Base branch.** Use the branch the repo merges feature work into: from its docs, or the base of recent merged PRs (some teams use `development` or `develop` before `main`). Otherwise use the remote's default branch. If it's unclear, ask, offering the branches that exist with a recommendation.
3. **Title.** Follow the convention of recent PRs in the repo (often the same prefix as commits) with a short summary of the whole branch.
4. **Description.** Write it with `references/pr-description.md`: use the repo's PR template if it has one, otherwise its recent PR style, otherwise the default template there. It describes the whole branch versus the base, not just the last commit, and is written for reviewers. Wrap the generated part in the managed-block markers so later runs can update it.
5. **Create** it with `gh pr create` (or `glab mr create`), not as a draft unless asked. Add reviewers, labels or assignees only if the repo's convention or the user says so.
6. **Cross-repo.** When the work spans repos, after all PRs exist, edit each description to link the others and state the merge/deploy order (e.g. backend first).

### Phase 7 — Keep the PR description current

Whenever this skill runs on a branch that already has an open PR (new commits, review fixes, scope changes), update its description so it matches the branch again:

- Fetch the current body. Regenerate the content **between the managed-block markers** from the full branch diff against the base, the commit list, the plan/decisions, and the previous description (keep explanations that are still true; drop or correct ones that aren't).
- Keep everything **outside** the markers untouched: that's where the user or reviewers may have written.
- If the body has no markers (written by hand or before this skill existed), don't overwrite it silently. Show the proposed new description and ask: replace it, wrap it in markers going forward, or append an "Updates" section.
- Update the title too if the branch's scope changed enough that the title is now wrong (say so in the report).
- Keep the cross-repo links and ship order current.

### Phase 8 — Report

Per repo: branch, commits (SHA + subject), push result, PR URL (created / updated / not opened and why), and what changed in the description. Then anything still open: unfinished work, questions, checks not run. Update the work doc's "Resume here" (`references/workflow.md` §3) with the PR links and status, and any handoff doc or project memory that tracks PRs.
