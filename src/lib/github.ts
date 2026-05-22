const GITHUB_GRAPHQL_URL = "https://api.github.com/graphql";

// GitHub only exposes the commit/PR/review/issue split as period totals, not
// in the daily calendar. So we ask for one aliased contributionsCollection
// per day, in chunks, to get a typed per-day breakdown.
const CHUNK_DAYS = 30;
const DAY_MS = 86_400_000;

export type DailyContribution = {
  date: string; // "YYYY-MM-DD"
  contributionCount: number; // commits + pullRequests + reviews + issues
  commits: number;
  pullRequests: number;
  reviews: number;
  issues: number;
};

export type ContributionsResult = {
  login: string;
  days: DailyContribution[];
};

type DayBlock = {
  totalCommitContributions: number;
  totalPullRequestContributions: number;
  totalPullRequestReviewContributions: number;
  totalIssueContributions: number;
};

type GraphQLResponse = {
  data?: {
    viewer: {
      login: string;
      [alias: string]: DayBlock | string;
    };
  };
  errors?: { message: string }[];
};

// UTC-midnight days in [from, to).
function dayList(from: Date, to: Date): Date[] {
  const days: Date[] = [];
  const cursor = new Date(from);
  cursor.setUTCHours(0, 0, 0, 0);
  while (cursor < to) {
    days.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

function buildQuery(days: Date[]): string {
  const blocks = days.map((day, i) => {
    const dayFrom = day.toISOString();
    const dayTo = new Date(day.getTime() + DAY_MS - 1).toISOString();
    return `d${i}: contributionsCollection(from: "${dayFrom}", to: "${dayTo}") {
      totalCommitContributions
      totalPullRequestContributions
      totalPullRequestReviewContributions
      totalIssueContributions
    }`;
  });
  return `query { viewer { login ${blocks.join(" ")} } }`;
}

async function runQuery(
  accessToken: string,
  query: string,
): Promise<GraphQLResponse["data"]> {
  const res = await fetch(GITHUB_GRAPHQL_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    throw new Error(`GitHub GraphQL request failed (HTTP ${res.status})`);
  }

  const body = (await res.json()) as GraphQLResponse;
  if (body.errors?.length) {
    throw new Error(
      `GitHub GraphQL error: ${body.errors.map((e) => e.message).join("; ")}`,
    );
  }
  if (!body.data?.viewer) {
    throw new Error("GitHub GraphQL response missing viewer data");
  }
  return body.data;
}

// Fetches a GitHub user's typed daily contributions for the given window
// using their own OAuth token, so private-repo contributions are included.
export async function fetchContributions(
  accessToken: string,
  from: Date,
  to: Date,
): Promise<ContributionsResult> {
  const days = dayList(from, to);
  const result: DailyContribution[] = [];
  let login = "";

  for (let i = 0; i < days.length; i += CHUNK_DAYS) {
    const chunk = days.slice(i, i + CHUNK_DAYS);
    const data = await runQuery(accessToken, buildQuery(chunk));
    login = data!.viewer.login;

    chunk.forEach((day, j) => {
      const block = data!.viewer[`d${j}`] as DayBlock;
      const commits = block.totalCommitContributions;
      const pullRequests = block.totalPullRequestContributions;
      const reviews = block.totalPullRequestReviewContributions;
      const issues = block.totalIssueContributions;
      result.push({
        date: day.toISOString().slice(0, 10),
        commits,
        pullRequests,
        reviews,
        issues,
        contributionCount: commits + pullRequests + reviews + issues,
      });
    });
  }

  return { login, days: result };
}
