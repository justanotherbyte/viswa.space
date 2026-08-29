# Animation plans

| # | Title | Severity | Status |
| --- | --- | --- | --- |
| [001](001-photography-lightbox-transition.md) | Animate the photography lightbox open/close | MEDIUM | IMPLEMENTED (feel-check pending) |

## Execution order

Just the one plan right now — no dependencies. It's already implemented directly in the main working tree as uncommitted changes to `src/styles/global.css` and `src/pages/photography.astro` (see below for why).

## Notes

- Plan 001 introduces this repo's first easing token (`--ease-out` in `src/styles/global.css`). Any future motion plan should reuse that token rather than hand-typing a new cubic-bezier.
- This plan came out of a `find-animation-opportunities` sweep of the whole site (2026-08-30). The sweep's other candidates (card hover feedback, navbar hover-transition consistency, hamburger→X morph, "View All" arrow nudge) were not turned into plans — re-run `improve-animations plan <description>` for any of those if they're wanted.
- **Execution caveat (2026-08-30)**: `execute` requested an isolated git worktree, but the plan file it needed (`plans/001-photography-lightbox-transition.md`) had only just been written and was still untracked, so it wasn't present in the fresh worktree checkout (worktrees only contain committed history). The plan content was sent to the executor directly instead. Separately, the isolation itself didn't take — the executor ended up editing `src/` in the main working tree rather than a separate worktree directory. The resulting diff was reviewed in place and matches the plan exactly (verified independently, not just taken on the executor's word), but if isolation matters for a future `execute` run, commit new plan files before invoking it and confirm `git worktree list` shows a second entry before trusting the isolation.
- **Verification caveat**: mechanical verification (`astro dev --background`) is currently blocked on this machine by a Windows Application Control policy rejecting `node_modules/@astrojs/compiler-binding-win32-x64-msvc/astro.win32-x64-msvc.node` — confirmed independently of the executor, unrelated to this diff, present before and after the change. The dev-server feel-check in plan 001's Verification section has not been run. Do that once the dev server can start.
