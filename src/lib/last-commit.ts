import { execFileSync } from 'node:child_process';

const git = (...args: string[]) => execFileSync('git', args, { encoding: 'utf8' }).trim();

// Cloudflare's build clones only recent history, which would make every file
// report the latest commit's date. Fetch the full history once per build.
let fullHistory: boolean | undefined;
function ensureFullHistory(): boolean {
	if (fullHistory === undefined) {
		try {
			if (git('rev-parse', '--is-shallow-repository') === 'true') git('fetch', '--unshallow', '--quiet');
			fullHistory = true;
		} catch {
			fullHistory = false;
		}
	}
	return fullHistory;
}

// Date of the newest commit that touched `path`, read from the local git history at build time.
// Returns undefined when git or the history is unavailable, so the build never breaks over a date.
export async function lastCommitDate(path: string | undefined): Promise<Date | undefined> {
	if (!path || !ensureFullHistory()) return undefined;
	try {
		const iso = git('log', '-1', '--format=%cI', '--', path);
		return iso ? new Date(iso) : undefined;
	} catch {
		return undefined;
	}
}
