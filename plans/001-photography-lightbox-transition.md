# 001 — Animate the photography lightbox open/close

- **Status**: IMPLEMENTED — code applied and diff-reviewed clean; dev-server feel-check still needed (blocked here by a local OS Application Control policy, see plans/README.md)
- **Commit**: 3d751ce
- **Severity**: MEDIUM
- **Category**: Missed opportunities (state teleport) / Physicality / Interruptibility / Accessibility
- **Estimated scope**: 2 files, ~30 lines (`src/styles/global.css`, `src/pages/photography.astro`)

## Problem

The full-screen photo lightbox on `src/pages/photography.astro` opens and closes by toggling Tailwind's `hidden`/`flex` utility classes with plain `classList` calls. Because `display: none` cannot be transitioned, the backdrop and the enlarged photo both teleport in and out with zero visual bridge — a full-viewport overlay just appears/disappears on the same frame.

Current markup, `src/pages/photography.astro:58-77`:

```astro
<div
	id="photo-modal"
	class="fixed inset-0 bg-zinc-900/90 z-50 hidden items-center justify-center p-4"
>
	<div class="relative w-full h-full flex items-center justify-center">
		<button
			id="photo-modal-close"
			class="absolute cursor-pointer top-4 right-4 text-white text-4xl font-bold hover:text-zinc-300 transition-colors z-10"
		>
			✕
		</button>
		<img
			id="photo-modal-img"
			src=""
			alt=""
			class="max-w-[95vw] max-h-[95vh] w-auto h-auto object-contain rounded-lg"
		/>
	</div>
</div>
```

Current script, `src/pages/photography.astro:79-109`:

```astro
<script>
	const modal = document.getElementById('photo-modal');
	const modalImg = document.getElementById('photo-modal-img') as HTMLImageElement | null;
	const closeBtn = document.getElementById('photo-modal-close');

	const openModal = (full: string, index: number) => {
		if (!modal || !modalImg || !full) return;
		modalImg.src = full;
		modalImg.alt = `Photo ${index + 1}`;
		modal.classList.remove('hidden');
		modal.classList.add('flex');
	};

	const closeModal = () => {
		if (!modal) return;
		modal.classList.add('hidden');
		modal.classList.remove('flex');
	};

	document.querySelectorAll<HTMLElement>('.photo-thumb').forEach((el) => {
		el.addEventListener('click', () => {
			const index = Number(el.dataset.index);
			openModal(el.dataset.full ?? '', index);
		});
	});

	closeBtn?.addEventListener('click', closeModal);
	modal?.addEventListener('click', (e) => {
		if (e.target === modal) closeModal();
	});
</script>
```

This repo has no motion library — it's plain Astro + Tailwind v4 CSS. There is currently no `:root` block and no easing tokens anywhere in `src/styles/global.css`.

## Target

Backdrop and image both fade in; the image also grows from a subtle `scale(0.95)` (never `scale(0)` — nothing in the real world appears from nothing). Both use a strong custom ease-out curve, 250ms (within the 200–500ms modal/drawer budget). The modal stays visually centered — no `transform-origin` override needed, that's correct for a modal. Because the state is a CSS class toggle (not `@keyframes`), rapid open/close naturally retargets instead of restarting. `display` is driven by CSS itself via `@starting-style` + `transition-behavior: allow-discrete`, so the element is genuinely removed from layout/tab-order when closed — no JS `requestAnimationFrame` choreography needed.

`src/styles/global.css` — add a `:root` block with the shared easing token, right after the `@import`:

```css
@import "tailwindcss";

/* src/styles/global.css */

:root {
	--ease-out: cubic-bezier(0.23, 1, 0.32, 1);
}
```

`src/pages/photography.astro` — add a scoped `<style>` block (place it directly after the closing `</SiteLayout>` tag, before the existing `<script>` block):

```astro
<style>
	#photo-modal {
		display: none;
		opacity: 0;
		transition:
			opacity 250ms var(--ease-out),
			display 250ms allow-discrete;
	}

	#photo-modal.is-open {
		display: flex;
		opacity: 1;
	}

	@starting-style {
		#photo-modal.is-open {
			opacity: 0;
		}
	}

	#photo-modal-img {
		transform: scale(0.95);
		opacity: 0;
		transition:
			transform 250ms var(--ease-out),
			opacity 250ms var(--ease-out);
	}

	#photo-modal.is-open #photo-modal-img {
		transform: scale(1);
		opacity: 1;
	}

	@starting-style {
		#photo-modal.is-open #photo-modal-img {
			transform: scale(0.95);
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		#photo-modal,
		#photo-modal-img {
			transition-duration: 150ms;
		}

		#photo-modal-img {
			transform: none;
		}

		#photo-modal.is-open #photo-modal-img {
			transform: none;
		}
	}
</style>
```

Markup changes: drop `hidden` from `#photo-modal`'s class list (display is now owned by the scoped stylesheet above, not Tailwind's `hidden` utility). No changes to `#photo-modal-img`'s class list or to the close button.

Script changes: replace the `hidden`/`flex` toggling with a single `is-open` class toggle.

```ts
const openModal = (full: string, index: number) => {
	if (!modal || !modalImg || !full) return;
	modalImg.src = full;
	modalImg.alt = `Photo ${index + 1}`;
	modal.classList.add('is-open');
};

const closeModal = () => {
	if (!modal) return;
	modal.classList.remove('is-open');
};
```

## Repo conventions to follow

- This is the repo's **first** easing token — there is no existing `--ease-*` convention to match, so `--ease-out` in `src/styles/global.css` establishes it. Use exactly `cubic-bezier(0.23, 1, 0.32, 1)` (the standard strong UI ease-out — do not approximate).
- Astro scopes `<style>` blocks per-component by default (it appends a generated `data-astro-css-*` attribute to matching selectors automatically) — you do not need `:global()` for `#photo-modal` / `#photo-modal-img`, they're declared in the same file.
- The photo-thumbnail hover effect already in this file (`src/pages/photography.astro:48`, `transition-transform duration-200 ease-in-out group-hover:scale-110`) is the one other piece of motion on this page — it's correct as-is and is a good reference for "keep it subtle."

## Steps

1. In `src/styles/global.css`, insert a `:root { --ease-out: cubic-bezier(0.23, 1, 0.32, 1); }` block immediately after `@import "tailwindcss";` and the `/* src/styles/global.css */` comment, before the existing `body { ... }` rule. Do not touch anything else in this file.
2. In `src/pages/photography.astro`, remove `hidden` from the class list on the `<div id="photo-modal" ...>` opening tag (line 58 in the current file), leaving `class="fixed inset-0 bg-zinc-900/90 z-50 items-center justify-center p-4"`.
3. Immediately after the closing `</SiteLayout>` tag and before the existing `<script>` block, add the `<style>` block shown in **Target** above, verbatim.
4. In the existing `<script>` block, replace the two lines `modal.classList.remove('hidden'); modal.classList.add('flex');` inside `openModal` with `modal.classList.add('is-open');`.
5. In the same script, replace the two lines `modal.classList.add('hidden'); modal.classList.remove('flex');` inside `closeModal` with `modal.classList.remove('is-open');`.
6. Leave `closeBtn`'s click handler, the backdrop-click handler, and the thumbnail click handlers untouched — only the two class-toggle lines change.

## Boundaries

- Do NOT touch `src/pages/photography.astro:48` (the thumbnail `group-hover:scale-110` transition) — it's already correct.
- Do NOT touch the close button's `transition-colors` (line 65) — out of scope, already correct.
- Do NOT add a motion library or JS animation dependency — this is a CSS-only fix.
- Do NOT change the `<img>`/`<button>` structure, `data-*` attributes, or any non-transition classes.
- Do NOT add `transform-origin` to the modal or image — a centered modal is correct as-is per this codebase's conventions; do not "fix" what isn't broken.
- If `src/pages/photography.astro` or `src/styles/global.css` has drifted from the excerpts quoted above (different line numbers, different class lists), STOP and report the mismatch instead of improvising a merge.

## Verification

- **Mechanical**: run `astro dev --background`, then `astro dev status` to confirm it started clean with no build/type errors. `astro dev logs` should show no CSS or TypeScript errors referencing `photography.astro` or `global.css`.
- **Feel check**: open `/photography` in a browser, click a thumbnail, and confirm:
  - The backdrop fades in and the photo simultaneously fades + grows from `scale(0.95)` to full size — no instant pop.
  - Click the ✕ (or click the backdrop) and confirm the exit is the same fade, not an instant disappearance.
  - Click a thumbnail, then immediately click another thumbnail before the first animation finishes — the transition should retarget smoothly (no flash, no restart-from-zero stutter). This confirms the CSS-transition (not keyframe) approach is interruptible.
  - With DevTools open, close the modal, then use Tab from the address bar — focus should skip the (now `display: none`) modal contents entirely, confirming it's really out of the tab order when closed, not just invisible.
  - In DevTools' Rendering panel, set "Emulate CSS media feature prefers-reduced-motion" to `reduce`, reload, and reopen the modal: the backdrop and image should still cross-fade (feedback preserved) but the image should no longer grow from a smaller scale — movement is gone, opacity feedback remains.
  - In DevTools' Animations panel, set playback speed to 10% and step through one open — confirm the image and backdrop opacity/scale progress together and finish at the same time (both are 250ms), and that the curve visibly starts fast and eases into place (ease-out), not a slow start (ease-in would be a regression here).
- **Done when**: opening and closing the lightbox always cross-fades (never snaps), the image never appears from `scale(0)` or without an initial scale, rapid re-triggering never flashes or restarts, `prefers-reduced-motion: reduce` keeps the opacity feedback while dropping the scale, and the closed modal is confirmed out of the tab order via keyboard.
