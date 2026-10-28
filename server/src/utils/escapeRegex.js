export const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Exact, case-insensitive match (usernames).
export const exactInsensitive = (s) => new RegExp(`^${escapeRegex(s)}$`, 'i');
