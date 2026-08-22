// The Next.js source pulled this from a Postgres/Drizzle table.
// Replace these entries with your real experience — dates, company, description.
export interface ExperienceEntry {
	position: string;
	companyName: string;
	companyLink: string;
	companyIcon: string;
	startedAt: string;
	endedAt: string;
	description: string;
}

export const experiences: ExperienceEntry[] = [];
