/**
 * Bilingual decks (Español Starter) write examples as "Spanish — English".
 * English decks use em-dashes as ordinary punctuation, so only split when the
 * deck's language says the second half is a translation.
 */
export function splitExample(example: string, lang: string): [string, string | null] {
  if (lang.startsWith('en')) return [example, null];
  const parts = example.split(' — ');
  if (parts.length < 2) return [example, null];
  return [parts[0], parts.slice(1).join(' — ')];
}
