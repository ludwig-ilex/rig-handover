---
name: preview-on-surge
description: Publish a rig page as a public preview on surge.sh, upload over it, and take its lane marker off (ADR 0003). Use when a plan step puts a page on a public link or cleans one up.
---

# preview-on-surge

A preview is one HTML file on a public HTTPS link (ADR 0003). This lane uses surge.sh through
`npx surge`. Ask the human before each upload and each discard: say what, where, who can see it,
and how to undo it.

## Publish

1. Run `npx surge whoami`. If it says "Not Authenticated", the human runs `npx surge login`
   in their own terminal. Never type their password.
2. Start rig on a free port and save the page with `curl` into a folder outside the repo:

   ```sh
   PORT=8799 pnpm start
   curl -s -o <dir>/index.html http://localhost:8799/digest/<night>
   ```

3. Check the saved file, not the command: `grep` for the banner text you expect.
4. Choose a domain without the lane marker in its name, so the cleanup can remove the marker fully.
5. Publish: `npx surge <dir> <domain>.surge.sh`.
6. Fetch the public link with `curl`. Done when it returns 200 and shows the expected banner.

## Upload over it without the marker

1. Stop every rig server on the port first. `tsx` runs as `node … src/server.ts`, so find it by
   port: `lsof -t -iTCP:8799 -sTCP:LISTEN`. An old server answers with the old marker.
2. Start rig without `.env`: `env -u LANE_MARKER PORT=8799 ./node_modules/.bin/tsx src/server.ts`.
3. Save the page again. The banner reads "no marker set", and `grep -c <marker>` gives 0.
4. Publish to the same domain.

## Remove the marked revisions

Every publish also makes a revision link, `<rev>--<domain>.surge.sh`, that keeps its own copy.
An upload over the domain leaves the marked copy on its revision link.

1. List them: `npx surge <domain>.surge.sh revs`.
2. Discard each marked one: `npx surge <domain>.surge.sh discard <rev>`.
3. Done when each discarded revision link returns 404 and the domain shows "no marker set".

## Paused domain

A 403 page "This domain is paused" means the account email is not verified. The human opens the
link in the email from surge, or runs `npx surge verify` for a new one. Fetch the link again after.

## Remove the site

`npx surge <domain>.surge.sh teardown` deletes the site. It cannot be undone, so do it only on the
human's yes and only after the review is accepted.
