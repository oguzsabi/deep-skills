# Commands

GitHub with `gh` first; GitLab equivalents below. Check `gh auth status` once per session; if the CLI isn't available or can't see the repo, commit and push anyway and give the user the PR title and description to paste.

## Repo state

```bash
git status --short
git branch --show-current
git rev-parse --abbrev-ref --symbolic-full-name @{u}   # upstream, errors if none
git log --oneline @{u}..HEAD                            # unpushed commits
git log -20 --format='%s%n%b'                           # commit message convention
git branch -r --sort=-committerdate | head -20          # branch naming convention
```

## Base branch

```bash
gh pr list --state merged --limit 20 --json baseRefName --jq '.[].baseRefName' | sort | uniq -c   # where recent PRs merged
git ls-remote --exit-code --heads origin <base>         # exit code 2 → doesn't exist
gh repo view --json defaultBranchRef --jq .defaultBranchRef.name
git ls-remote --heads origin | sed 's#.*refs/heads/##'  # all remote branches, to offer alternatives
```

## Existing PR for this branch

```bash
gh pr list --head "$(git branch --show-current)" --state all \
  --json number,state,baseRefName,title,url,body
```

## Create

```bash
gh pr create --base <base> --head "$(git branch --show-current)" \
  --title '<title>' --body-file <path-to-body.md>
```

Write the body to a file in the scratchpad first (`--body-file`) so markdown and markers survive shell quoting.

## Update

```bash
gh pr view <N> --json body --jq .body > <scratch>/current-body.md   # read current
gh pr edit <N> --body-file <scratch>/new-body.md                    # replace body
gh pr edit <N> --title '<new title>'
```

Show the user a short summary of what changed in the description (not the whole diff) in the report.

## Recent PR style

```bash
gh pr list --state merged --limit 5 --json number,title,baseRefName,body
ls .github/pull_request_template.md .github/PULL_REQUEST_TEMPLATE 2>/dev/null
```

## GitLab (`glab`)

```bash
glab mr list --source-branch "$(git branch --show-current)" --all
glab mr create --target-branch <base> --title '<title>' --description "$(cat <body.md>)"
glab mr update <N> --description "$(cat <body.md>)"
```
