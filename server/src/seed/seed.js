import { pathToFileURL } from 'node:url';
import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db.js';
import { GAMES, getGame } from '../config/games.js';
import { makeDemoPlayers, rng, simulateHistory } from './demo.js';
import {
  Announcement, AuditLog, Challenge, Dispute, Match, Notification, OrganiserApplication, Report, Setting,
  Sponsor, TopupOrder, TopupProduct, Tournament, User, XpLog,
} from '../models/index.js';
import { invalidateSettings } from '../services/settings.js';

export const PLAYER_PASSWORD = 'Player@123';
const DEMO_PLAYER_COUNT = 60;

const PLAYERS = [
  ['ktm_sniper', 'Bagmati', { pubg: '5123498761' }],
  ['pokhara_rush', 'Gandaki', { pubg: '5234987610', freefire: '2219834501' }],
  ['birgunj_boss', 'Madhesh', { freefire: '2234765190' }],
  ['dharan_dragon', 'Koshi', { pubg: '5345876102', efootball: 'DharanDragon' }],
  ['butwal_bullet', 'Lumbini', { freefire: '2245981732', fcmobile: 'ButwalBullet' }],
  ['jumla_ghost', 'Karnali', { pubg: '5456761023' }],
  ['dhangadhi_king', 'Sudurpashchim', { freefire: '2256019843', efootball: 'DhangadhiKing' }],
  ['patan_panda', 'Bagmati', { efootball: 'PatanPanda', fcmobile: 'PatanPanda10' }],
  ['bhaktapur_beast', 'Bagmati', { pubg: '5567610234', freefire: '2267198354' }],
  ['itahari_ice', 'Koshi', { fcmobile: 'ItahariIce', efootball: 'ItahariIce' }],
  ['janakpur_jet', 'Madhesh', { pubg: '5678102345', fcmobile: 'JanakpurJet' }],
  ['mustang_monk', 'Gandaki', { freefire: '2278209465', pubg: '5789023456' }],
];

// Bios for the hand-written players.
const BIOS = [
  'Rush or nothing. Evening scrims only.',
  'IGL for a Pokhara squad. DM for customs.',
  'Clash Squad main. Headshots only.',
  'Sanhok enjoyer. Chill duo partner.',
  'Weekend warrior from Butwal.',
  'Quiet in the lobby, loud on the scoreboard.',
];

// [game, name, amount, priceNpr, popular]
const PRODUCTS = [
  ['pubg', '60 UC', 60, 135, false],
  ['pubg', '325 UC', 325, 650, true],
  ['pubg', '660 UC', 660, 1300, true],
  ['pubg', '1800 UC', 1800, 3250, false],
  ['freefire', '100 Diamonds', 100, 120, false],
  ['freefire', '310 Diamonds', 310, 360, true],
  ['freefire', '520 Diamonds', 520, 590, false],
  ['freefire', '1060 Diamonds', 1060, 1180, true],
  ['efootball', '130 eFootball Coins', 130, 160, false],
  ['efootball', '550 eFootball Coins', 550, 650, true],
  ['efootball', '1040 eFootball Coins', 1040, 1250, false],
  ['fcmobile', '100 FC Points', 100, 150, false],
  ['fcmobile', '520 FC Points', 520, 720, true],
  ['fcmobile', '1070 FC Points', 1070, 1450, false],
];

// Clearly fictional sample sponsors (no real businesses).
export const DEMO_SPONSORS = [
  { name: 'Pixel Yeti Gaming Lounge (sample sponsor)', slot: 'home_banner', website: 'https://example.com/pixel-yeti' },
  { name: 'Gorkha Grid Mobiles (sample sponsor)', slot: 'hub_banner', game: 'pubg', website: 'https://example.com/gorkha-grid' },
];

const DAY = 24 * 60 * 60 * 1000;
const hours = (h) => new Date(Date.now() + h * 60 * 60 * 1000);
const daysAgo = (d) => new Date(Date.now() - d * DAY);
const pick = (arr, i) => arr[i % arr.length];

/**
 * Adds the demo world next to whatever is already in the database (everything flagged isDemo or tied to demo users).
 * Skips usernames that already exist, so it is safe to run after `clearDemo()` on a live site.
 * `admin` / `organiser` host the demo matches and tournaments.
 */
export async function seedDemo({ admin, organiser = admin, log = console.log } = {}) {
  const r = rng();
  const playerHash = await bcrypt.hash(PLAYER_PASSWORD, 10);
  const taken = new Set((await User.find().select('username').lean()).map((u) => u.username.toLowerCase()));
  const named = PLAYERS.filter(([u]) => !taken.has(u));
  const extra = makeDemoPlayers(DEMO_PLAYER_COUNT - named.length, [...taken, ...PLAYERS.map(([u]) => u)], r);
  const defs = [
    ...named.map(([username, province, gameIds], i) => ({ username, province, gameIds, bio: pick(BIOS, i) })),
    ...extra,
  ];
  // Sign-ups spread over the last ~85 days (the hand-written players are the oldest).
  const players = await User.insertMany(
    defs.map((d, i) => ({
      ...d,
      usernameLower: d.username.toLowerCase(),
      email: `${d.username.replace(/_/g, '.')}@example.np`,
      passwordHash: playerHash,
      dob: new Date(1998 + (i % 9), i % 12, 1 + (i % 27)),
      isDemo: true,
      createdAt: new Date(daysAgo(85 - (i / defs.length) * 82).getTime() + r.int(0, 20) * 3600e3),
    })),
  );

  // Ranked history (drives XP, ratings, tiers, ladders, records and rating charts).
  const history = simulateHistory(players, r);
  await Challenge.insertMany(history.challenges);
  await XpLog.insertMany(history.xpLogs);
  await User.bulkWrite(
    players.map((p) => {
      const c = history.counters.get(String(p._id)) ?? { xp: 0, xpByGame: {}, stats: { played: 0, won: 0 }, rankedByGame: {} };
      return {
        updateOne: {
          filter: { _id: p._id },
          update: {
            $set: {
              xp: c.xp,
              xpByGame: c.xpByGame,
              stats: c.stats,
              rankedByGame: c.rankedByGame,
              ratingByGame: history.ratingByGame(p._id),
            },
          },
        },
      };
    }),
  );

  // Open challenges across all four games.
  const challengeDefs = [
    ['pubg', 'TDM', 'Livik', 1, 0, 'First to 40 kills. Mic optional.'],
    ['pubg', 'Classic', 'Erangel', 4, 8, 'Squad vs squad, most kills + placement wins.'],
    ['pubg', 'Arena', undefined, 2, 1, 'Duo arena, best of 3.'],
    ['freefire', 'Clash Squad', 'Bermuda', 4, 2, '4v4 CS, 7 rounds.'],
    ['freefire', 'Lone Wolf', 'Kalahari', 1, 4, '1v1 Lone Wolf, no gun skins.'],
    ['freefire', 'Battle Royale', 'Purgatory', 2, 11, 'Duo BR, highest kills wins.'],
    ['efootball', 'Friendly Match', undefined, 1, 7, '10 min halves, no cross-play lag excuses.'],
    ['efootball', 'Event Match', undefined, 1, 9, 'Dream Team only.'],
    ['fcmobile', 'Head to Head', undefined, 1, 10, 'H2H, best of 3.'],
    ['fcmobile', 'VS Attack', undefined, 1, 4, 'VS Attack quick one, anyone?'],
  ];
  const challenges = await Challenge.insertMany(
    challengeDefs.map(([game, mode, map, teamSize, creatorIdx, notes], i) => ({
      game, mode, map, teamSize, notes,
      ranked: getGame(game).rankedModes.includes(mode),
      isDemo: true,
      creator: players[creatorIdx]._id,
      teamA: [players[creatorIdx]._id],
      teamB: [],
      status: 'open',
      scheduledAt: hours(3 + i * 4),
    })),
  );

  // Upcoming custom rooms on real maps.
  const matchDefs = [
    ['Erangel Evening Custom', 'pubg', 'Classic', 'Erangel', 6, 100, 4],
    ['Sanhok Sunday Scrims', 'pubg', 'Classic', 'Sanhok', 30, 64, 4],
    ['Livik Duo Sprint', 'pubg', 'Classic', 'Livik', 50, 50, 2],
    ['Bermuda Night Drop', 'freefire', 'Battle Royale', 'Bermuda', 8, 48, 4],
    ['Purgatory Pressure Cup', 'freefire', 'Battle Royale', 'Purgatory', 26, 48, 2],
    ['Kalahari Clash Squad Customs', 'freefire', 'Clash Squad', 'Kalahari', 72, 8, 4],
  ];
  const matches = await Match.insertMany(
    matchDefs.map(([title, game, mode, map, inHours, maxSlots, teamSize], i) => ({
      title, game, mode, map, maxSlots, teamSize,
      startsAt: hours(inHours),
      host: i % 2 ? admin._id : organiser._id,
      status: 'upcoming',
      isDemo: true,
      room: { roomId: String(8800000 + i * 1371), password: `arena${i}` },
      registrations: players.slice(0, 3 + i).map((p, j) => ({ user: p._id, teamName: `${p.username.split('_')[0]} squad ${j + 1}` })),
    })),
  );

  const [homeSponsor, hubSponsor] = DEMO_SPONSORS;
  const tournaments = await Tournament.insertMany([
    {
      title: 'Himalayan PUBG Cup — Season 1',
      game: 'pubg',
      format: 'points',
      startsAt: hours(24 * 10),
      prize: `Rs 25,000 prize pool sponsored by ${hubSponsor.name}`,
      sponsor: hubSponsor.name,
      maxTeams: 16,
      organiser: organiser._id,
      status: 'registration',
      isDemo: true,
      description: 'Six maps over two days. Points by placement + kills. Free to enter, squads only.',
      registrations: players.slice(0, 4).map((p) => ({ user: p._id, teamName: `Team ${p.username.split('_')[0]}` })),
    },
    {
      title: 'Terai Free Fire Clash',
      game: 'freefire',
      format: 'knockout',
      startsAt: hours(24 * 6),
      prize: `Rs 10,000 + jerseys sponsored by ${homeSponsor.name}`,
      sponsor: homeSponsor.name,
      maxTeams: 32,
      organiser: organiser._id,
      status: 'registration',
      isDemo: true,
      description: 'Clash Squad knockout, best of 3 until the final (best of 5). Free entry.',
      registrations: players.slice(2, 6).map((p) => ({ user: p._id, teamName: `${p.username.split('_')[0]} FC` })),
    },
  ]);

  // Growth + moderation samples for the admin control room.
  const announcements = await Announcement.insertMany([
    { title: 'Ranked season is live', body: 'Every ranked 1v1 to 4v4 now moves your rating. Climb from Bronze to Legend.', link: '/ranked', audience: 'all', pinned: true, createdBy: admin._id, isDemo: true },
    { title: 'Erangel customs every evening', body: 'Rooms open 15 minutes before start. Register early, slots fill fast.', link: '/games/pubg', game: 'pubg', audience: 'game', createdBy: admin._id, isDemo: true },
    { title: 'Free Fire Clash Squad weekend', body: 'Double the open challenges this weekend. Bring your squad.', link: '/games/freefire', game: 'freefire', audience: 'game', createdBy: admin._id, isDemo: true },
    { title: 'Bagmati meetup at the valley cafes', body: 'Offline scrims for Kathmandu valley players, details coming soon.', audience: 'province', province: 'Bagmati', createdBy: admin._id, isDemo: true },
  ]);
  const sponsors = await Sponsor.insertMany(DEMO_SPONSORS.map((s) => ({ ...s, active: true, isDemo: true })));

  await OrganiserApplication.insertMany([
    { user: players[2]._id, orgName: 'Terai Clash Crew', type: 'clan', contact: 'Messenger: Terai Clash Crew', socialLink: 'https://example.com/terai-clash', note: 'We run weekly Clash Squad scrims for about 40 players.', isDemo: true },
    { user: players[6]._id, orgName: 'Far West Campus Esports', type: 'college', contact: 'esports-club@example.np', socialLink: 'https://example.com/fw-campus', note: 'College club, want to host inter-campus customs.', isDemo: true },
  ]);

  const settled = history.challenges.slice(-10);
  const reportedChallenge = settled.find((c) => c.teamSize === 1) ?? settled[0];
  await Report.insertMany([
    {
      reporter: reportedChallenge.teamA[0], target: reportedChallenge.teamB[0], challenge: reportedChallenge._id,
      reason: 'fake_result', details: 'Their screenshot looks edited, the kill feed does not match the round.', isDemo: true,
    },
    { reporter: players[3]._id, target: players[9]._id, reason: 'abuse', details: 'Kept spamming insults in room chat after the match.', isDemo: true },
    { reporter: players[7]._id, target: players[12]._id, reason: 'cheating', details: 'Impossible headshots through smoke, possible aim assist hack.', isDemo: true },
  ]);

  // Top-up orders over the last 30 days so the revenue chart has a shape.
  const products = await TopupProduct.find({ active: true }).lean();
  const orders = [];
  if (products.length) {
    for (let i = 0; i < 45; i += 1) {
      const buyer = players[r.int(0, players.length - 1)];
      const product = products[r.int(0, products.length - 1)];
      const at = daysAgo(r() * 30);
      orders.push({
        user: buyer._id, product: product._id, gameUid: buyer.gameIds?.[product.game] || String(r.int(5100000000, 5899999999)),
        paymentMethod: r.pick(['esewa', 'khalti', 'bank']), paymentRef: `DEMO-${r.int(100000, 999999)}`,
        priceNpr: product.priceNpr, status: i < 6 ? 'pending' : i < 9 ? 'paid' : i < 11 ? 'failed' : 'fulfilled',
        adminNote: '', createdAt: at, updatedAt: at,
      });
    }
    await TopupOrder.insertMany(orders);
  }

  // Activity feed history: demo sign-ups as audit events at their real (seeded) times.
  await AuditLog.insertMany(
    players.map((p) => ({ actor: p._id, action: 'user.register', targetType: 'User', targetId: String(p._id), summary: `${p.username} joined from ${p.province}`, at: p.createdAt })),
  );

  const summary = {
    players: players.length,
    challenges: challenges.length + history.challenges.length,
    settledRanked: history.challenges.length,
    matches: matches.length,
    tournaments: tournaments.length,
    announcements: announcements.length,
    sponsors: sponsors.length,
    applications: 2,
    reports: 3,
    orders: orders.length,
    xpEntries: history.xpLogs.length,
  };
  log(
    `Demo data: ${summary.players} players, ${summary.challenges} challenges (${summary.settledRanked} settled ranked), ` +
      `${summary.matches} matches, ${summary.tournaments} tournaments, ${summary.announcements} announcements, ` +
      `${summary.sponsors} sponsors, ${summary.applications} organiser applications, ${summary.reports} reports, ` +
      `${summary.orders} orders, ${summary.xpEntries} XP entries.`,
  );
  return { players, challenges, matches, tournaments, summary };
}

// Full reset: wipes EVERYTHING, then creates admin + organiser + store catalog + demo world.
export async function seed({ log = console.log } = {}) {
  await Promise.all(
    [
      Announcement, AuditLog, Challenge, Dispute, Match, Notification, OrganiserApplication, Report, Setting,
      Sponsor, TopupOrder, TopupProduct, Tournament, User, XpLog,
    ].map((M) => M.deleteMany({})),
  );
  invalidateSettings();

  const [adminHash, orgHash] = await Promise.all([bcrypt.hash('Admin@123', 10), bcrypt.hash('Org@1234', 10)]);
  const admin = await User.create({
    username: 'arena_admin', email: 'admin@arena.np', passwordHash: adminHash, role: 'admin',
    province: 'Bagmati', dob: new Date('1995-04-14'), bio: 'Keeping the rooms fair.', createdAt: daysAgo(90),
  });
  const organiser = await User.create({
    username: 'valley_esports', email: 'org@arena.np', passwordHash: orgHash, role: 'organiser',
    province: 'Bagmati', dob: new Date('1993-09-02'), bio: 'Weekly customs and sponsored cups.', createdAt: daysAgo(88),
  });
  const products = await TopupProduct.insertMany(
    PRODUCTS.map(([game, name, amount, priceNpr, popular]) => ({ game, name, amount, priceNpr, popular, active: true })),
  );

  const demo = await seedDemo({ admin, organiser, log: () => {} });
  const s = demo.summary;
  log(
    `Seeded: ${2 + s.players} users, ${s.challenges} challenges (${s.settledRanked} settled ranked), ${s.matches} matches, ` +
      `${s.tournaments} tournaments, ${products.length} products, ${s.announcements} announcements, ${s.sponsors} sponsors, ` +
      `${s.applications} organiser applications, ${s.reports} open reports, ${s.orders} demo orders, ` +
      `${s.xpEntries} XP entries across ${GAMES.length} games.`,
  );
  return { admin, organiser, products, ...demo };
}

// Run directly: `npm run seed`
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await connectDB();
    await seed();
    console.log('Logins: admin@arena.np / Admin@123, org@arena.np / Org@1234, any player e.g. ktm_sniper /', PLAYER_PASSWORD);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
}
