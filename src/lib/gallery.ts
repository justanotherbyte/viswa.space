// Justified rows for the photography gallery. Every photo in a row shares one height, so
// none is cropped, and a row's height falls as the sum of its aspect ratios rises. Each
// breakpoint cycles through its own row targets (summed aspect ratios); low targets make
// the large feature rows. The same input always gives the same rows.
export const breakpoints = [
	// each row break shows only at its own breakpoint; Tailwind reads these class names from here
	{ breakClass: 'basis-full hidden max-md:block', targets: [1.4, 0.9, 1.6, 1.2, 1.7] },
	{ breakClass: 'basis-full hidden md:max-lg:block', targets: [1.7, 2.9, 2.3, 3.2, 2.6] },
	{ breakClass: 'basis-full hidden lg:block', targets: [2.2, 4.1, 3.3, 4.6, 2.6, 3.8, 4.3] },
] as const;

// Returns the positions of the photos that end a row; the final row needs no entry.
export function rowEnds(ratios: number[], targets: readonly number[]): number[] {
	const ends: number[] = [];
	let sum = 0;
	ratios.forEach((ratio, i) => {
		const target = targets[ends.length % targets.length];
		// close the row when adding this photo would land further from the target than stopping
		if (sum > 0 && Math.abs(sum + ratio - target) > Math.abs(sum - target)) {
			ends.push(i - 1);
			sum = 0;
		}
		sum += ratio;
	});
	// a short last row would stretch into one giant photo, so fold it into the row above
	const lastTarget = targets[ends.length % targets.length];
	if (ends.length > 0 && sum < lastTarget / 2) ends.pop();
	return ends;
}
