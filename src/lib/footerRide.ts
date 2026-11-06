// Where a rider is on a track, shared by the build (the parked pose that reduced motion and no-script readers see) and
// the browser (the laps). A track is a flat list of samples taken every STEP world units of ground: screen x, screen y,
// the figure's scale at that depth, and 1 or 0 for whether the land in front hides it.
export const STEP = 5;
const K = 4;

const at = (t: number[], f: number) => {
	const count = t.length / K, k = (((f % 1) + 1) % 1) * count, i = Math.floor(k), u = k - i, j = (i + 1) % count;
	return [0, 1, 2, 3].map((c) => t[i * K + c] * (1 - u) + t[j * K + c] * u);
};

// translate, mirror to face the way it rides, and tilt with the ground it is crossing
export const pose = (t: number[], f: number, bob = 0) => {
	const d = 2 / (t.length / K), [x, y, s, v] = at(t, f), [x0, y0] = at(t, f - d), [x1, y1] = at(t, f + d);
	const dir = x1 >= x0 ? 1 : -1, a = Math.max(-24, Math.min(24, (Math.atan2(y1 - y0, Math.abs(x1 - x0)) * 180) / Math.PI));
	return { transform: `translate(${x.toFixed(1)} ${(y + bob * s).toFixed(1)}) scale(${(dir * s).toFixed(3)} ${s.toFixed(3)}) rotate(${a.toFixed(1)})`, opacity: v };
};

// the tyre track left behind: the last `len` world units of ground, skipping what the land hides
export const trail = (t: number[], f: number, len: number) => {
	const n = Math.ceil(len / STEP), step = 1 / (t.length / K), pts: string[] = [];
	for (let k = n; k >= 0; k--) {
		const [x, y, , v] = at(t, f - k * step);
		if (v > 0.5) pts.push(`${x.toFixed(1)} ${y.toFixed(1)}`);
	}
	return pts.length > 1 ? 'M' + pts.join('L') : '';
};
