<!-- Copied from skills/deep-review/references/checks.md by scripts/sync-shared.mjs. Edit the source, not this copy. -->

# Finding and running the repo's checks

## Find the commands

Use the repo's own commands rather than guessing at tool invocations, because they carry the right config, paths and flags:

1. CI workflows (`.github/workflows`, `.gitlab-ci.yml`, `azure-pipelines.yml`, `Jenkinsfile`, etc.) — the most reliable answer to what must pass.
2. Task files: `package.json` scripts, `Makefile`, `justfile`, `Taskfile`, `pyproject.toml`, `tox.ini`, `noxfile.py`, `Cargo.toml`, `*.csproj`/`Directory.Build.props`, `build.gradle`, `pom.xml`.
3. Repo docs (`CLAUDE.md`, `AGENTS.md`, `CONTRIBUTING.md`, `README`).
4. Pre-commit hooks (`.husky/`, `.pre-commit-config.yaml`, `lint-staged` config) — these show what's run on changed files.

## Scope to changed files

Get the changed files with:

```bash
git diff --name-only --diff-filter=ACMR <base>...HEAD
git diff --name-only --diff-filter=ACMR      # unstaged
git diff --name-only --diff-filter=ACMR --cached   # staged
git ls-files --others --exclude-standard     # untracked
```

Pass that list to tools that accept file arguments. Whole-project checks (typecheck, build, full test suite) still run on the whole project, because a change can break files it didn't touch; just don't *fix* unrelated pre-existing findings without asking.

To tell pre-existing warnings from new ones, compare against the base: run the same check on the base branch (e.g. in a `git worktree` or after `git stash`, restoring afterwards), or check whether the flagged line is in the diff.

## Common tools by ecosystem

Use these only when the repo doesn't define its own scripts.

| Ecosystem | Format | Lint | Types / build | Tests |
|-----------|--------|------|---------------|-------|
| JS/TS | `npx prettier --check <files>` (`--write` to fix) | `npx eslint <files>` (`--fix`) | `npx tsc --noEmit -p <tsconfig>`, framework build (`ng build`, `next build`, `vite build`) | `npm test` / `npx jest <path>` / `npx vitest run <path>` / `ng test`; e2e: `npx playwright test`, `npx cypress run` |
| Python | `ruff format --check` / `black --check` | `ruff check` / `flake8` | `mypy` / `pyright` | `pytest <path>` |
| Go | `gofmt -l` | `go vet ./...`, `golangci-lint run` | `go build ./...` | `go test ./...` |
| Rust | `cargo fmt --check` | `cargo clippy -- -D warnings` | `cargo build` | `cargo test` |
| .NET | `dotnet format --verify-no-changes` | analyzers via build | `dotnet build` | `dotnet test` |
| JVM | `spotless:check` / `ktlint` | `checkstyle` / `detekt` | `gradle build` / `mvn compile` | `gradle test` / `mvn test` |

## Fixing lint and format findings

- Auto-fixers (`--fix`, `--write`) only on changed files, then review what they changed.
- Fix the cause; don't add disable comments or loosen rules. If a rule genuinely doesn't fit a case, that's a question for the user.
- Formatting fixes on lines outside the change add noise to the diff; ask before applying them.
- Re-run until clean, then re-run the tests (lint fixes occasionally change behavior, e.g. `==` → `===`, removed "unused" code with side effects).

## Running tests well

- Run new/changed spec files first for fast feedback, then the module or project suite, then e2e.
- If tests are slow, run the long suite in the background and keep reviewing meanwhile.
- If a test fails, read the failure fully before acting. Decide whether the code or the test is wrong based on the requirements, not on which is easier to change.
- Flaky-looking failure: re-run once; if it passes, report it as flaky with the output rather than ignoring it.
- Coverage: if the repo has a coverage command, run it for the changed files and check the new code paths are hit. Coverage numbers are a hint, not proof; the requirement-to-test table is the real check.
- If something needs an environment you don't have (backend, credentials, device), report exactly what wasn't run and the command the user should run.
