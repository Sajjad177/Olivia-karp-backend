/**
 * RFC 4180 compliant CSV parser. Handles double quotes, newlines, and commas inside cells.
 * @param csvText The raw CSV file content.
 * @returns A two-dimensional array of strings representing rows and columns.
 */
export function parseCSV(csvText: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let col = "";
  let insideQuote = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (insideQuote) {
      if (char === '"') {
        if (nextChar === '"') {
          col += '"';
          i++; // Skip the next quote
        } else {
          insideQuote = false;
        }
      } else {
        col += char;
      }
    } else {
      if (char === '"') {
        insideQuote = true;
      } else if (char === ',') {
        row.push(col.trim());
        col = "";
      } else if (char === '\r' || char === '\n') {
        row.push(col.trim());
        col = "";
        if (row.length > 0 && (row.length > 1 || row[0] !== "")) {
          result.push(row);
        }
        row = [];
        if (char === '\r' && nextChar === '\n') {
          i++; // Skip \n
        }
      } else {
        col += char;
      }
    }
  }

  // Handle the last column/row if the file didn't end with a newline
  if (col !== "" || row.length > 0) {
    row.push(col.trim());
    if (row.length > 0 && (row.length > 1 || row[0] !== "")) {
      result.push(row);
    }
  }

  return result;
}
