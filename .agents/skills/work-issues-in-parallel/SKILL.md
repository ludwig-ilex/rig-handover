---
name: work-issues-in-parallel
description: Run open issues of one plan at the same time, one worker and one worktree per issue, then merge and close them. Use when two or more issues can start against the same commit.
---

# work-issues-in-parallel

AGENTS.md says one issue per worker, each on its own branch or worktree. This skill is the
recipe. The workers write code. This agent writes the contract, merges, checks and closes.

## Steps

1. Pick the parallel set: open issues whose "To start" blockers are all closed on `main`.
2. Write the contract: every name the workers share. That is routes, JSON shapes, exact page
   texts, CSS classes, and which file each worker owns. Post it as a comment on the issue the
   set starts from, under the heading `## Contract`. Done when each worker can do its issue
   from its issue, the contract and the repo alone.
3. Make one worktree per issue from `main`, outside the clone, with the base branch in its name:

   ```sh
   git worktree add ../worktrees/<repo>-main-issue-<n> -b main-issue-<n> main
   ln -s "$PWD/node_modules" ../worktrees/<repo>-main-issue-<n>/node_modules
   ```

4. Start one worker per issue, all in one message. Take the model and effort from the issue's
   "Suggested worker model". Give each worker:
   - the issue number, its worktree path and the contract comment link,
   - the check it runs (`pnpm typecheck`, `pnpm test`, and its "Done when" if it can run alone),
   - one commit on its branch, with no push, no merge and no issue changes.
   A worker whose "Done when" needs another issue in the set (route tests) commits red and says so.
5. To correct a running worker, send a message to that worker. A new worker loses its work.
6. Merge the branches into `main` one at a time, in issue order. Files that many workers touch
   (`src/app.tsx`) conflict. Keep both sides.
7. On the merged `main`, run `pnpm test` and `pnpm typecheck`. Then check each issue's
   "Done when" against the running server.
8. Push. Commits with `closes #n` close their issue on push. Add each closing comment (AGENTS.md
   shape) at once, with the model and effort the worker really ran.
9. Remove the worktrees and the `main-issue-<n>` branches.

Done when every issue in the set is closed with its closing comment, and `git worktree list`
shows only the clone.
