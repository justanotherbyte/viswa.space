// Wireframe globe for the About panel's top-right corner, with Earth's 23.4° axial
// tilt and viewed from 20° above. Shared by the server render and the spin loop.
export const R = 112, CX = 350, CY = 8;

const deg = Math.PI / 180;
const tilt = 23.4 * deg, view = 20 * deg;

function project(lon: number, lat: number): string {
	let x = Math.cos(lat) * Math.sin(lon), y = -Math.sin(lat);
	const z = Math.cos(lat) * Math.cos(lon);
	y = y * Math.cos(view) - z * Math.sin(view);
	[x, y] = [x * Math.cos(tilt) - y * Math.sin(tilt), x * Math.sin(tilt) + y * Math.cos(tilt)];
	return `${(CX + R * x).toFixed(1)} ${(CY + R * y).toFixed(1)}`;
}

const curve = (at: (t: number) => [number, number]) =>
	'M' + Array.from({ length: 73 }, (_, i) => project(...at((i / 72) * 2 * Math.PI))).join(' L');

// meridians repeat every 30°, so a spin of 0 to 30 loops seamlessly
export const meridians = (spin = 0) => [0, 30, 60, 90, 120, 150].map((lon) => curve((t) => [(lon + spin) * deg, t]));
export const parallels = [-60, -30, 30, 60].map((lat) => curve((t) => [t, lat * deg]));
export const equator = curve((t) => [t, 0]);
