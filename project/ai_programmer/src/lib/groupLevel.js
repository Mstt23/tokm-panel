// Group level parsing + comparison utilities.

// Examples:
// - "11.Sınıf TM" -> 11
// - "11.Sınıf MF" -> 11
// - "8.Sınıf (1)"  -> 8
export function getGroupLevel(groupName) {
  if (!groupName) return null;

  // Try to match a leading number followed by ".Sınıf".
  const match = String(groupName).match(/^(\d+)\.Sınıf/i);
  if (!match) return null;
  const level = Number(match[1]);
  return Number.isNaN(level) ? null : level;
}

export function areGroupsSameLevel(groupA, groupB) {
  const a = getGroupLevel(groupA);
  const b = getGroupLevel(groupB);
  return a !== null && b !== null && a === b;
}

