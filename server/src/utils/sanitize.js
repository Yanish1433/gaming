import { GAME_SLUGS, RATING, tierFor } from '../config/games.js';

const toObj = (u) => (typeof u?.toObject === 'function' ? u.toObject() : { ...u });

const ratingsOf = (o) => Object.fromEntries(GAME_SLUGS.map((g) => [g, o.ratingByGame?.[g] ?? RATING.start]));
const tiersOf = (ratings) => Object.fromEntries(GAME_SLUGS.map((g) => [g, tierFor(ratings[g])]));

// Owner/admin view: everything except the password hash.
export function selfUser(u) {
  if (!u) return u;
  const o = toObj(u);
  delete o.passwordHash;
  delete o.__v;
  o.ratingByGame = ratingsOf(o);
  o.tierByGame = tiersOf(o.ratingByGame);
  return o;
}

// Public view: never email, dob, passwordHash or strikes.
export function publicUser(u) {
  if (!u) return u;
  const o = toObj(u);
  const ratingByGame = ratingsOf(o);
  return {
    _id: o._id,
    username: o.username,
    role: o.role,
    province: o.province,
    avatarUrl: o.avatarUrl,
    bio: o.bio,
    gameIds: o.gameIds,
    xp: o.xp,
    xpByGame: o.xpByGame,
    stats: o.stats,
    ratingByGame,
    rankedByGame: o.rankedByGame,
    tierByGame: tiersOf(ratingByGame),
    banned: o.banned,
    createdAt: o.createdAt,
  };
}

// Safe fields when populating user references (teams, hosts, organisers...).
export const PUBLIC_USER_FIELDS = 'username avatarUrl province xp role';
