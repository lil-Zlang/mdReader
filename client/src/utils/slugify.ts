/**
 * Converts a heading text to a URL-safe slug ID.
 * Used by both TableOfContents and MarkdownViewer for consistent heading IDs.
 */
export function slugify(text: string): string {
  const slug = text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars except -
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start
    .replace(/-+$/, '');            // Trim - from end

  // Return a fallback if slug is empty
  return slug || 'heading';
}

/**
 * Creates a unique ID from text, handling duplicates by appending -1, -2, etc.
 */
export function createUniqueSlug(text: string, existingSlugs: Set<string>): string {
  const baseSlug = slugify(text);
  let slug = baseSlug;
  let counter = 1;

  while (existingSlugs.has(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}
