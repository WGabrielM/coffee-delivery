---
name: commit-and-push
description: Commit and push all pending changes with a Conventional Commits message. Runs git status, analyzes every change, writes the message, stages, commits (hooks run), and pushes. Adds Claude Code as co-author. Runs automatically at the end of every spec execution (implement-me). Use when the user says "commit and push", "commit-and-push", "commit everything", or "push my changes".
---

# Commit and Push

Turn all pending changes into one or more well-formed commits and push them. Follow the stages in order.

## 1. Inspect

1. Run `git status --short --branch`. If there is nothing to commit, say so and stop.
2. Read the changes: `git diff`, `git diff --cached`, and the list of untracked files (open the small ones that are not obvious from their name). Run `git log --oneline -5` to match the history's style.
3. Note the branch. The team works only on `main`: commit directly on the current branch and never create a new branch. If you are on any other branch, tell the user and ask before committing.

## 2. Protect

Never stage, and tell the user about, any of these:

- `.env` and `.env.*` files, except `.env.example`
- private keys, certificates, credentials, tokens (`*.pem`, `*.key`, `id_rsa*`, files containing obvious secrets)
- build output, caches, and dependencies that `.gitignore` does not already exclude (`dist`, `build`, `node_modules`, `.gradle`)

If a file might be sensitive and you are not sure, leave it out and ask.

## 3. Group

By default, make one commit. If the changes clearly belong to unrelated concerns (for example a feature and an unrelated dependency upgrade), split them into several commits, each with its own message and its own staged files, in a sensible order.

## 4. Write the message

Follow Conventional Commits and `.docs/DEVELOPMENT.md` (checked by commitlint on commit):

```
<type>(<optional scope>): <subject>

<body>

<footer and trailers>
```

- **Type:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, or `revert`. Pick the one that describes the main effect of the change.
- **Scope:** the app, package, or area (`api`, `app`, `docs`, `infra`), when one clearly applies.
- **Subject:** imperative, lowercase first letter, no trailing period, whole header at most 100 characters (aim for 72). Describe what the change does, not the files it touches.
- **Body:** explain what changed and why, in short paragraphs or bullets, wrapped at 100 characters. Skip it only for trivial changes. Separate it from the header with a blank line.
- **Breaking changes:** add `!` after the type or scope and a `BREAKING CHANGE:` footer.
- **Trailers,** each separated from the body by a blank line:

  ```
  Co-Authored-By: Claude Code <noreply@anthropic.com>
  ```

## 5. Stage and commit

1. Stage explicitly: `git add -A`, then unstage anything excluded in stage 2 (`git reset -q -- <path>`). When splitting into several commits, stage only that commit's files.
2. Commit with the message from a heredoc: `git commit -F - <<'EOF' ... EOF`.
3. The hooks run: lint-staged formats staged files and re-stages them, and commitlint checks the message. If a hook fails:
   - read the error and fix the cause (correct the message, or fix the code);
   - stage again and create a new commit with the corrected message;
   - never use `--no-verify`, and never `--amend` a commit a hook did not create.

## 6. Push

1. `git push`. If the branch has no upstream, `git push -u origin <branch>`.
2. Never force-push. If the push is rejected (for example, the remote has new commits), stop and report it; do not rebase or force without the user's say-so.
3. If the push output prints a pull request link, include it in the report.
4. If the push fails because Git has no credentials on this machine, do not retry: report it and tell the user to run `git push` themselves.

## 7. Report

State plainly:

- the branch (expected: `main`),
- each commit: short hash and header,
- the files committed, and any files you left out and why,
- the push result and the pull request link, if any.

## Rules

- Do not change code beyond what the hooks do. This skill only commits and pushes.
- Do not commit or push partial work you were not asked to publish: if the working tree contains unrelated changes you did not expect, show them and ask.
- Do not rewrite history.
