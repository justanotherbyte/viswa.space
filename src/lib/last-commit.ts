// Date of the newest commit on main that touched `path`, fetched at build time.
// Returns undefined on any failure so a GitHub outage or rate limit never breaks the build.
export async function lastCommitDate(path: string | undefined): Promise<Date | undefined> {
	if (!path) return undefined;
	const url = `https://api.github.com/repos/justanotherbyte/viswa.space/commits?sha=main&per_page=1&path=${encodeURIComponent(path)}`;
	const headers: Record<string, string> = { Accept: 'application/vnd.github+json' };
	// Optional: lifts the limit from 60 to 5000 requests/hour.
	if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
	try {
		const res = await fetch(url, { headers });
		if (!res.ok) return undefined;
		const [latest] = await res.json();
		return latest ? new Date(latest.commit.committer.date) : undefined;
	} catch {
		return undefined;
	}
}
