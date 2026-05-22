const GITHUB_GRAPHQL_URL = "https://api.github.com/graphql";

const CONTRIBUTIONS_QUERY = `
query Contributions($from: DateTime!, $to: DateTime!) {
  viewer {
    login
    contributionsCollection(from: $from, to: $to) {
      contributionCalendar {
        weeks {
          contributionDays {
            date
            contributionCount
          }
        }
      }
    }
  }
}`;

export type DailyCount = {
  date: string; // "YYYY-MM-DD"
  count: number;
};

export type ContributionsResult = {
  login: string;
  days: DailyCount[];
};

type GraphQLResponse = {
  data?: {
    viewer: {
      login: string;
      contributionsCollection: {
        contributionCalendar: {
          weeks: {
            contributionDays: { date: string; contributionCount: number }[];
          }[];
        };
      };
    };
  };
  errors?: { message: string }[];
};

// Fetches a GitHub user's daily contribution counts for the given window
// using their own OAuth token, so private-repo contributions are included.
export async function fetchContributions(
  accessToken: string,
  from: Date,
  to: Date,
): Promise<ContributionsResult> {
  const res = await fetch(GITHUB_GRAPHQL_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: CONTRIBUTIONS_QUERY,
      variables: { from: from.toISOString(), to: to.toISOString() },
    }),
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

  const viewer = body.data?.viewer;
  if (!viewer) {
    throw new Error("GitHub GraphQL response missing viewer data");
  }

  const days: DailyCount[] = [];
  for (const week of viewer.contributionsCollection.contributionCalendar.weeks) {
    for (const day of week.contributionDays) {
      days.push({ date: day.date, count: day.contributionCount });
    }
  }

  return { login: viewer.login, days };
}
