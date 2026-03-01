// Maps unit display names to their sprite file slug (without extension).
const NAME_MAP: Record<string, string> = {
  'Arc.Tower': 'arcane-tower',
  'DrgnLair':  'dragon-lair',
}

/** Returns the sprite filename slug for a given unit name. */
export function spriteSlug(name: string): string {
  if (NAME_MAP[name]) return NAME_MAP[name]
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}
