const JOBBER_GRAPHQL_URL = "https://api.getjobber.com/api/graphql";
const DEFAULT_JOBBER_GRAPHQL_VERSION = "2025-04-16";

type JobberUserError = {
  message?: string;
};

type AppDisconnectResponse = {
  appDisconnect?: {
    app?: {
      name?: string;
      author?: string;
    } | null;
    userErrors?: JobberUserError[] | null;
  } | null;
};

export async function disconnectJobberApp(accessToken: string) {
  const response = await fetch(JOBBER_GRAPHQL_URL, {
    method: "POST",
    headers: getJobberHeaders(accessToken),
    body: JSON.stringify({
      query: `
        mutation HarloAppDisconnect {
          appDisconnect {
            app {
              name
              author
            }
            userErrors {
              message
            }
          }
        }
      `
    })
  });
  const payload = await response.json().catch(() => null) as {
    data?: AppDisconnectResponse;
    errors?: Array<{ message?: string }>;
    error?: string;
    error_description?: string;
  } | null;

  if (response.status === 401 || response.status === 403) {
    throw new Error("Invalid token: Jobber access was revoked or expired.");
  }

  if (!response.ok || !payload) {
    throw new Error(getResponseError(payload) ?? "Jobber app disconnect failed.");
  }

  if (payload.errors?.length) {
    throw new Error(
      payload.errors.map((error) => error.message).filter(Boolean).join("; ")
      || "Jobber app disconnect failed."
    );
  }

  const result = payload.data?.appDisconnect;
  const userError = formatUserErrors(result?.userErrors);

  if (userError) {
    throw new Error(userError);
  }

  if (!result) {
    throw new Error("Jobber did not confirm the app disconnect.");
  }
}

function getJobberHeaders(accessToken: string) {
  return {
    authorization: `Bearer ${accessToken}`,
    "content-type": "application/json",
    accept: "application/json",
    "X-JOBBER-GRAPHQL-VERSION": process.env.JOBBER_GRAPHQL_VERSION?.trim() || DEFAULT_JOBBER_GRAPHQL_VERSION
  };
}

function formatUserErrors(errors: JobberUserError[] | null | undefined) {
  if (!errors?.length) {
    return null;
  }

  return errors
    .map((error) => error.message ?? "Jobber validation error.")
    .join("; ");
}

function getResponseError(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;

  return cleanString(record.error_description) ?? cleanString(record.error);
}

function cleanString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
