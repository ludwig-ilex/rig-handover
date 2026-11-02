---
name: plan-to-issues
description: Split this repo's plan.md into GitHub issues with gh, one per unit of work, after a human has reviewed the split. Use when a plan is ready and has no issues yet.
---

# plan-to-issues

Turns `plan.md` into GitHub issues that workers can pick up cold. Easiest with `gh`, authenticated,
in a shell this agent can run.

## Steps

1. Read `plan.md`, `AGENTS.md` and `docs/adr/`.
2. Draft the split as a table: title · plan section · scope · done when · blocked by.
   One issue per unit of work.
3. **Stop and show the table to the human.** Publish nothing until they approve it.
4. Give every issue the shape in "What every issue carries". Ask the human only for a field
   or label that this plan needs and the shape does not have.
5. Create each issue in dependency order, so blocked-by can cite real numbers:

   ```sh
   gh issue create --title "<title>" --body-file <tmp.md>
   ```

6. Record every issue URL from gh's output (not from memory) and reply with the list.

Closing one, with the closing comment from AGENTS.md:

```sh
gh issue close <n> -c "<closing comment>"
```

## What every issue carries

The human set this shape for plan `morning-digest` (2026-11-02). It is the default for every plan.

- Label: `plan:<plan>`, from the `plan:` key in the frontmatter of `plan.md`. Make the label
  before the first issue.
- First line of the body: `Source: plan.md § <n>`, with the section number as the plan writes
  it (`1`, `2a`).
- Then these headings, in this order:
  - `## Scope`: what changes and which files.
  - `## Done when`: the plan's done condition, word for word.
  - `## Blocked by`: the issues the work needs to start. If "Done when" needs more issues,
    write them separately: `To start: #1. For done: #2.`
  - `## Suggested worker model`: `<harness> · <model> · <effort>`. Use the strongest model for
    logic and a cheaper one for views and tests (AGENTS.md).

A step that waits on someone outside the lane (a reviewer, a host) is done only when they confirm.
Keep its issue open until then, and block the next step on that confirmation.

## No `gh`

Steps 1–4 hold either way. GitHub reachable another way (a connector, the REST API, the web UI):
the same issues, made that way. GitHub issues out of reach altogether: write them as files in
`docs/issues/`, format in ADR 0004, then commit and push.

## Don'ts

- Don't paste the whole plan into one issue, and don't keep issues only in chat.
- Don't invent sections the plan doesn't have. If the plan is unclear, ask.
