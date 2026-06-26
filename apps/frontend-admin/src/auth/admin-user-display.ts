export function formatAdminDisplayName(
  firstName: string,
  lastName: string,
  username?: string,
): string {
  const first = firstName.trim();
  const last = lastName.trim();

  if (first && last) {
    return `${first} ${last[0]}.`;
  }
  if (first) {
    return first;
  }
  if (last) {
    return `${last[0]}.`;
  }
  if (username?.trim()) {
    return username.trim();
  }
  return '?';
}

export function getAdminInitials(firstName: string, lastName: string): string {
  const first = firstName.trim();
  const last = lastName.trim();

  if (first && last) {
    return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase();
  }
  const source = first || last;
  if (!source) {
    return '?';
  }
  return source.slice(0, 2).toUpperCase();
}
