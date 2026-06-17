const DEFAULT_GOOGLE_SHEETS_LEAD_FIELDS: GoogleSheetsLeadFieldColumn[] = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" }
];
const OBSOLETE_GOOGLE_SHEETS_HEADERS = new Set(["Conversation Summary", "Metadata"]);

export type GoogleSheetsLeadFieldColumn = {
  key: string;
  label: string;
};

type ValidateGoogleSheetsTargetInput = {
  accessToken: string;
  spreadsheetId: string | null | undefined;
  sheetName: string | null | undefined;
  headers?: readonly string[];
};

type AppendGoogleSheetsRowInput = ValidateGoogleSheetsTargetInput & {
  row: Record<string, unknown>;
};

type CreateGoogleSheetsLeadSpreadsheetInput = {
  accessToken: string;
  title: string;
  sheetName?: string | null;
  headers?: readonly string[];
};

export async function createGoogleSheetsLeadSpreadsheet({
  accessToken,
  title,
  sheetName,
  headers
}: CreateGoogleSheetsLeadSpreadsheetInput) {
  const normalizedTitle = getString(title) ?? "Harlo Leads";
  const normalizedSheetName = getString(sheetName) ?? "Leads";
  const response = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
    method: "POST",
    headers: getGoogleSheetsHeaders(accessToken),
    body: JSON.stringify({
      properties: {
        title: normalizedTitle
      },
      sheets: [
        {
          properties: {
            title: normalizedSheetName
          }
        }
      ]
    })
  });
  const payload = await parseGoogleSheetsResponse(response, "Google Sheets spreadsheet creation failed.");
  const spreadsheetId = getString(payload.spreadsheetId);

  if (!spreadsheetId) {
    throw new Error("Google Sheets did not return a spreadsheet ID.");
  }

  await ensureGoogleSheetsHeaderRow({
    accessToken,
    spreadsheetId,
    sheetName: normalizedSheetName,
    headers: normalizeGoogleSheetsHeaders(headers)
  });

  return {
    spreadsheetId,
    spreadsheetTitle: getSpreadsheetTitle(payload) ?? normalizedTitle,
    sheetName: normalizedSheetName,
    spreadsheetUrl: getGoogleSpreadsheetUrl(spreadsheetId)
  };
}

export async function validateGoogleSheetsTarget({
  accessToken,
  spreadsheetId,
  sheetName,
  headers
}: ValidateGoogleSheetsTargetInput) {
  const target = getGoogleSheetsTarget({ spreadsheetId, sheetName });
  const payload = await getGoogleSpreadsheetMetadata({
    accessToken,
    spreadsheetId: target.spreadsheetId
  });
  const availableTabs = getGoogleSheetTabNames(payload);

  if (!availableTabs.includes(target.sheetName)) {
    const availableMessage = availableTabs.length > 0
      ? ` Available tabs: ${availableTabs.slice(0, 6).join(", ")}.`
      : "";

    throw new Error(`Sheet tab "${target.sheetName}" was not found.${availableMessage}`);
  }

  return {
    spreadsheetId: getString(payload.spreadsheetId) ?? target.spreadsheetId,
    spreadsheetTitle: getSpreadsheetTitle(payload),
    sheetName: target.sheetName,
    availableTabs
  };
}

export async function ensureGoogleSheetsLeadSheet({
  accessToken,
  spreadsheetId,
  sheetName,
  headers
}: ValidateGoogleSheetsTargetInput) {
  const target = getGoogleSheetsTarget({ spreadsheetId, sheetName });
  const metadata = await ensureGoogleSheetsTab({
    accessToken,
    spreadsheetId: target.spreadsheetId,
    sheetName: target.sheetName
  });
  const availableTabs = getGoogleSheetTabNames(metadata);

  await ensureGoogleSheetsHeaderRow({
    accessToken,
    spreadsheetId: target.spreadsheetId,
    sheetName: target.sheetName,
    headers: normalizeGoogleSheetsHeaders(headers)
  });

  return {
    spreadsheetId: getString(metadata.spreadsheetId) ?? target.spreadsheetId,
    spreadsheetTitle: getSpreadsheetTitle(metadata),
    sheetName: target.sheetName,
    availableTabs
  };
}

export async function appendGoogleSheetsRow({
  accessToken,
  spreadsheetId,
  sheetName,
  headers,
  row
}: AppendGoogleSheetsRowInput) {
  const target = getGoogleSheetsTarget({ spreadsheetId, sheetName });
  await ensureGoogleSheetsTab({
    accessToken,
    spreadsheetId: target.spreadsheetId,
    sheetName: target.sheetName
  });
  const headerRow = await ensureGoogleSheetsHeaderRow({
    accessToken,
    spreadsheetId: target.spreadsheetId,
    sheetName: target.sheetName,
    headers: normalizeGoogleSheetsHeaders(headers)
  });
  const values = headerRow.map((header) => formatSheetCellValue(row[header]));
  const range = getGoogleSheetsRowRange(target.sheetName, headerRow.length);
  const appendUrl = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(target.spreadsheetId)}/values/${encodeURIComponent(range)}:append`);
  appendUrl.searchParams.set("valueInputOption", "USER_ENTERED");
  appendUrl.searchParams.set("insertDataOption", "INSERT_ROWS");
  const response = await fetch(appendUrl, {
    method: "POST",
    headers: getGoogleSheetsHeaders(accessToken),
    body: JSON.stringify({
      majorDimension: "ROWS",
      values: [values]
    })
  });

  return parseGoogleSheetsResponse(response, "Google Sheets row append failed.");
}

export function buildGoogleSheetsLeadHeaders(fields: readonly GoogleSheetsLeadFieldColumn[] | null | undefined) {
  const leadFieldHeaders = mergeGoogleSheetsLeadFields(fields?.length ? fields : DEFAULT_GOOGLE_SHEETS_LEAD_FIELDS)
    .map((field) => field.label);

  return dedupeGoogleSheetsHeaders([
    "Timestamp",
    ...leadFieldHeaders,
    "Question",
    "Source Page"
  ]);
}

export function mergeGoogleSheetsLeadFields(fields: readonly GoogleSheetsLeadFieldColumn[] | null | undefined) {
  const merged = new Map<string, GoogleSheetsLeadFieldColumn>();

  (fields ?? []).forEach((field) => {
    const key = getString(field.key);
    const label = getString(field.label);

    if (!key || !label || merged.has(key)) {
      return;
    }

    merged.set(key, {
      key,
      label
    });
  });

  return Array.from(merged.values());
}

export function normalizeGoogleSheetsLeadFields(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return mergeGoogleSheetsLeadFields(
    value.map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;
      const key = getString(record.key);
      const label = getString(record.label);

      return key && label ? { key, label } : null;
    }).filter((item): item is GoogleSheetsLeadFieldColumn => Boolean(item))
  );
}

export function getGoogleSpreadsheetUrl(spreadsheetId: string) {
  return `https://docs.google.com/spreadsheets/d/${encodeURIComponent(spreadsheetId)}/edit`;
}

export function normalizeGoogleSpreadsheetId(value: unknown) {
  const text = getString(value);

  if (!text) {
    return null;
  }

  const match = text.match(/\/spreadsheets\/d\/([^/?#]+)/);

  return match?.[1] ?? text;
}

export function getGoogleSheetsErrorMessage(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const nestedError = record.error;

  if (nestedError && typeof nestedError === "object") {
    const errorRecord = nestedError as Record<string, unknown>;
    const message = getString(errorRecord.message);

    if (message) {
      return message;
    }
  }

  return getString(record.message) ?? getString(record.error_description) ?? getString(record.error);
}

function getGoogleSheetsTarget({ spreadsheetId, sheetName }: Omit<ValidateGoogleSheetsTargetInput, "accessToken">) {
  const normalizedSpreadsheetId = normalizeGoogleSpreadsheetId(spreadsheetId);
  const normalizedSheetName = getString(sheetName) ?? "Leads";

  if (!normalizedSpreadsheetId) {
    throw new Error("Google Sheets needs a spreadsheet ID before saving.");
  }

  if (!normalizedSheetName) {
    throw new Error("Google Sheets needs a sheet tab name before saving.");
  }

  return {
    spreadsheetId: normalizedSpreadsheetId,
    sheetName: normalizedSheetName
  };
}

async function getGoogleSpreadsheetMetadata({
  accessToken,
  spreadsheetId
}: {
  accessToken: string;
  spreadsheetId: string;
}) {
  const metadataUrl = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}`);
  metadataUrl.searchParams.set("includeGridData", "false");
  const response = await fetch(metadataUrl, {
    headers: getGoogleSheetsHeaders(accessToken)
  });

  return parseGoogleSheetsResponse(response, "Google Sheets spreadsheet lookup failed.");
}

async function ensureGoogleSheetsTab({
  accessToken,
  spreadsheetId,
  sheetName
}: {
  accessToken: string;
  spreadsheetId: string;
  sheetName: string;
}) {
  const metadata = await getGoogleSpreadsheetMetadata({
    accessToken,
    spreadsheetId
  });
  const availableTabs = getGoogleSheetTabNames(metadata);

  if (availableTabs.includes(sheetName)) {
    return metadata;
  }

  await addGoogleSheetTab({
    accessToken,
    spreadsheetId,
    sheetName
  });

  return {
    ...metadata,
    sheets: [
      ...(Array.isArray(metadata.sheets) ? metadata.sheets : []),
      {
        properties: {
          title: sheetName
        }
      }
    ]
  };
}

async function addGoogleSheetTab({
  accessToken,
  spreadsheetId,
  sheetName
}: {
  accessToken: string;
  spreadsheetId: string;
  sheetName: string;
}) {
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}:batchUpdate`, {
    method: "POST",
    headers: getGoogleSheetsHeaders(accessToken),
    body: JSON.stringify({
      requests: [
        {
          addSheet: {
            properties: {
              title: sheetName
            }
          }
        }
      ]
    })
  });

  await parseGoogleSheetsResponse(response, `Could not create the "${sheetName}" Google Sheets tab.`);
}

async function ensureGoogleSheetsHeaderRow({
  accessToken,
  spreadsheetId,
  sheetName,
  headers
}: {
  accessToken: string;
  spreadsheetId: string;
  sheetName: string;
  headers: readonly string[];
}) {
  const targetHeaders = normalizeGoogleSheetsHeaders(headers);
  const range = getGoogleSheetsRowRange(sheetName, Math.max(targetHeaders.length, 8));
  const readUrl = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}`);
  const readResponse = await fetch(readUrl, {
    headers: getGoogleSheetsHeaders(accessToken)
  });
  const readPayload = await parseGoogleSheetsResponse(readResponse, "Google Sheets header row lookup failed.");
  const firstRow = Array.isArray(readPayload.values) && Array.isArray(readPayload.values[0])
    ? readPayload.values[0]
    : [];
  const existingHeaders = firstRow.map((value) => getString(value) ?? "");
  const nonEmptyExistingHeaders = existingHeaders.filter(Boolean);
  const hasExistingHeader = nonEmptyExistingHeaders.length > 0;
  const hasObsoleteHeaders = nonEmptyExistingHeaders.some((header) => OBSOLETE_GOOGLE_SHEETS_HEADERS.has(header));

  if (!hasExistingHeader || hasObsoleteHeaders) {
    await writeGoogleSheetsHeaderRow({
      accessToken,
      spreadsheetId,
      sheetName,
      headers: targetHeaders,
      clearColumnCount: Math.max(firstRow.length, targetHeaders.length)
    });

    return targetHeaders;
  }

  const missingHeaders = targetHeaders.filter((header) => !nonEmptyExistingHeaders.includes(header));

  if (missingHeaders.length === 0) {
    return nonEmptyExistingHeaders;
  }

  const nextHeaders = dedupeGoogleSheetsHeaders([...nonEmptyExistingHeaders, ...missingHeaders]);
  await writeGoogleSheetsHeaderRow({
    accessToken,
    spreadsheetId,
    sheetName,
    headers: nextHeaders,
    clearColumnCount: Math.max(firstRow.length, nextHeaders.length)
  });

  return nextHeaders;
}

async function writeGoogleSheetsHeaderRow({
  accessToken,
  spreadsheetId,
  sheetName,
  headers,
  clearColumnCount
}: {
  accessToken: string;
  spreadsheetId: string;
  sheetName: string;
  headers: readonly string[];
  clearColumnCount: number;
}) {
  const columnCount = Math.max(headers.length, clearColumnCount, 1);
  const range = getGoogleSheetsRowRange(sheetName, columnCount);
  const writeUrl = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}`);
  writeUrl.searchParams.set("valueInputOption", "RAW");
  const writeResponse = await fetch(writeUrl, {
    method: "PUT",
    headers: getGoogleSheetsHeaders(accessToken),
    body: JSON.stringify({
      range,
      majorDimension: "ROWS",
      values: [padRow(headers, columnCount)]
    })
  });

  await parseGoogleSheetsResponse(writeResponse, "Google Sheets header row setup failed.");
}

function normalizeGoogleSheetsHeaders(headers: readonly string[] | null | undefined) {
  return dedupeGoogleSheetsHeaders(headers?.length ? headers : buildGoogleSheetsLeadHeaders(DEFAULT_GOOGLE_SHEETS_LEAD_FIELDS));
}

function dedupeGoogleSheetsHeaders(headers: readonly string[]) {
  const seen = new Map<string, number>();

  return headers
    .map((header) => getString(header))
    .filter((header): header is string => Boolean(header))
    .map((header) => {
      const count = seen.get(header) ?? 0;
      seen.set(header, count + 1);

      return count === 0 ? header : `${header} ${count + 1}`;
    });
}

function padRow(values: readonly string[], length: number) {
  return Array.from({ length }, (_value, index) => values[index] ?? "");
}

function formatSheetCellValue(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  return JSON.stringify(value);
}

function getGoogleSheetsColumnName(index: number) {
  let value = Number.isFinite(index) && index > 0 ? Math.floor(index) : 1;
  let column = "";

  while (value > 0) {
    value -= 1;
    column = String.fromCharCode(65 + (value % 26)) + column;
    value = Math.floor(value / 26);
  }

  return column;
}

function getGoogleSheetsRowRange(sheetName: string, columnCount: number) {
  return `${formatGoogleSheetNameForA1(sheetName)}!A1:${getGoogleSheetsColumnName(columnCount)}1`;
}

async function parseGoogleSheetsResponse(response: Response, fallbackMessage: string) {
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload || typeof payload !== "object") {
    throw new Error(getGoogleSheetsErrorMessage(payload) ?? fallbackMessage);
  }

  return payload as Record<string, unknown>;
}

function getGoogleSheetsHeaders(accessToken: string) {
  return {
    authorization: `Bearer ${accessToken}`,
    "content-type": "application/json",
    accept: "application/json"
  };
}

function getGoogleSheetTabNames(payload: Record<string, unknown>) {
  const sheets = Array.isArray(payload.sheets) ? payload.sheets : [];

  return sheets
    .map((sheet) => {
      if (!sheet || typeof sheet !== "object") {
        return null;
      }

      const properties = (sheet as Record<string, unknown>).properties;

      return properties && typeof properties === "object"
        ? getString((properties as Record<string, unknown>).title)
        : null;
    })
    .filter((title): title is string => Boolean(title));
}

function getSpreadsheetTitle(payload: Record<string, unknown>) {
  const properties = payload.properties;

  return properties && typeof properties === "object"
    ? getString((properties as Record<string, unknown>).title)
    : null;
}

function formatGoogleSheetNameForA1(sheetName: string) {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(sheetName) ? sheetName : quoteGoogleSheetName(sheetName);
}

function quoteGoogleSheetName(sheetName: string) {
  return `'${sheetName.replace(/'/g, "''")}'`;
}

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
