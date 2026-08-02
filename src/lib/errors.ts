// Supabase/fetch failures caused by no internet connection surface as
// generic, technical-looking messages ("TypeError: Network request failed",
// "Failed to fetch"). Detect that case and show something a user can
// actually act on instead of raw driver text.
export function getFriendlyErrorMessage(error: unknown): string {
  const raw = extractMessage(error);

  if (/network request failed|failed to fetch|fetch failed|internet/i.test(raw)) {
    return 'No internet connection. Check your connection and try again.';
  }

  return raw;
}

// Supabase's AuthError/PostgrestError/StorageError objects always carry a
// `.message` string but aren't reliably `instanceof Error` across versions,
// so check for the property directly rather than assuming the error class.
function extractMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === 'string') return message;
  }
  return String(error);
}
