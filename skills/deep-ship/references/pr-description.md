# PR descriptions

## Who reads it

Reviewers who haven't followed the work, and later readers trying to understand why the code is the way it is. They need: what changed and why, what deliberately didn't change, how it was verified, and anything they must do or know before merging. They don't need the conversation history, a file-by-file list, or praise.

## Choosing the structure

1. The repo's PR template (`.github/pull_request_template.md`, `.github/PULL_REQUEST_TEMPLATE/`, `docs/pull_request_template.md`, `.gitlab/merge_request_templates/`): fill in every section it has.
2. Otherwise the style of the repo's recent PRs (`gh pr list --state merged --limit 5 --json title,body`): match its headings, level of detail and tone.
3. Otherwise the default template below.

## Gathering the content

- `git log --format='%h %s%n%b' <base>..HEAD` and `git diff --stat <base>...HEAD`, then the full diff for anything the commit messages don't explain.
- The plan, the user's decisions, the ticket (with a link or reference), and review/PR-comment rounds.
- Test and check results from this session, with the commands used.
- Sibling PRs in other repos for the same work.

Describe the branch as a whole versus the base. A change that was made and then reverted inside the branch doesn't belong in the description.

## Managed block

Wrap the generated content in markers so later runs can regenerate it without touching what people wrote by hand:

```markdown
<!-- deep-ship:start — generated from the branch; edits inside are replaced on update -->
...generated description...
<!-- deep-ship:end -->
```

Content outside the markers (above or below) is never modified by this skill. When a repo PR template has sections people fill in by hand (e.g. a checklist), keep those outside the block.

## Default template

```markdown
<!-- deep-ship:start — generated from the branch; edits inside are replaced on update -->
<Ticket reference/link>: <one or two sentences on the goal and the outcome.>

## Summary
<Short paragraph: what this PR does and why. Note follow-ups to earlier PRs if any.>

**<Area or behavior 1>**
- <what changed, from the user's/system's point of view, and why>
- <notable decision or tradeoff, and the reason>

**<Area or behavior 2>**
- ...

**Unchanged**
- <adjacent behavior or contexts deliberately left as they were, so reviewers don't have to check>

## Testing
- Unit: <what's covered> (`<command>`: <result>)
- E2E: <flows covered> (`<command>`: <result>), or why none
- Manual: <what was checked by hand, e.g. viewports, roles>, if any
- Not verified: <anything that couldn't be run here>

## Deploy notes
- <ship order with other repos, linking their PRs; migrations; flags; config> — or omit the section if there's nothing

## Follow-ups
- <known gaps, deferred items, related tickets> — or omit the section if there's nothing
<!-- deep-ship:end -->
```

## Style

- Bullets over prose; short sentences; plain words.
- Name behaviors and components, not file paths, except where a path helps the reviewer find something.
- Explain *why* for anything a reviewer might question; that's what they'd otherwise ask in a comment.
- Omit empty sections instead of writing "N/A".
- No attribution footer if the user's rules say so.
