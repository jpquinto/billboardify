export function parseColorToRgb(
  colorString: string | null | undefined
): string | null {
  if (!colorString) return null;

  try {
    // Remove outer quotes if they exist (DynamoDB double-quoting issue)
    let cleanString = colorString;
    if (colorString.startsWith('"') && colorString.endsWith('"')) {
      cleanString = colorString.slice(1, -1);
    }

    // Unescape the JSON string (convert \" back to ")
    cleanString = cleanString.replace(/\\"/g, '"');

    // Parse the JSON string
    const colorObj = JSON.parse(cleanString);

    // Validate and return RGB string
    if (
      typeof colorObj.r === "number" &&
      typeof colorObj.g === "number" &&
      typeof colorObj.b === "number"
    ) {
      return `rgb(${colorObj.r}, ${colorObj.g}, ${colorObj.b})`;
    }

    return null;
  } catch (error) {
    console.error("Failed to parse color string:", colorString, error);
    return null;
  }
}
