/** Safe to import in browser code (no image library). */
/** Pictures at least this large are listed as "large" in the media library. */
export const LARGE_BYTES = 500 * 1024;

export const formatBytes = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
