import { Challenge, Setting, TopupOrder, User } from '../models/index.js';
import { GAME_SLUGS } from '../config/games.js';
import { getSettings, invalidateSettings, publicSettings } from '../services/settings.js';
import { logAudit } from '../services/audit.js';
import { clip, onOff } from '../utils/auditText.js';
import { clearDemo } from '../seed/clearDemo.js';
import { seedDemo } from '../seed/seed.js';

// ---------------- settings

export async function getPublicSettings(req, res) {
  res.json(publicSettings(await getSettings()));
}

export async function getAdminSettings(req, res) {
  const s = await getSettings({ fresh: true });
  res.json({ ...publicSettings(s), updatedAt: s.updatedAt });
}

const hasOverride = (s, slug) => Array.isArray(s.mapsByGame?.[slug]);

// e.g. 'settings: maintenance ON ("Server upgrade…"), fcmobile OFF, pubg maps overridden (Erangel, Livik, Rondo)'
function describeSettingsChange(before, after) {
  const out = [];
  if (before.siteName !== after.siteName) out.push(`site name "${clip(after.siteName)}"`);
  if (before.tickerEnabled !== after.tickerEnabled) out.push(`ticker ${onOff(after.tickerEnabled)}`);
  if (before.maintenanceMode !== after.maintenanceMode) {
    out.push(after.maintenanceMode ? `maintenance ON ("${clip(after.maintenanceMessage)}")` : 'maintenance OFF');
  } else if (before.maintenanceMessage !== after.maintenanceMessage) {
    out.push(`maintenance message "${clip(after.maintenanceMessage)}"`);
  }
  for (const slug of GAME_SLUGS) {
    const was = before.gamesEnabled?.[slug] !== false;
    const now = after.gamesEnabled?.[slug] !== false;
    if (was !== now) out.push(`${slug} ${onOff(now)}`);
  }
  for (const slug of GAME_SLUGS) {
    const was = hasOverride(before, slug) ? before.mapsByGame[slug].join('|') : null;
    const now = hasOverride(after, slug) ? after.mapsByGame[slug].join('|') : null;
    if (was === now) continue;
    out.push(now === null ? `${slug} maps reset to default` : `${slug} maps overridden (${clip(after.mapsByGame[slug].join(', '), 60)})`);
  }
  return `settings: ${out.length ? out.join(', ') : 'no changes'}`;
}

// Partial update; gamesEnabled / mapsByGame merge per game (a null map list resets that game to the config maps).
export async function updateSettings(req, res) {
  const { gamesEnabled, mapsByGame, ...flat } = req.body;
  const $set = { ...flat };
  const $unset = {};
  for (const [slug, on] of Object.entries(gamesEnabled ?? {})) $set[`gamesEnabled.${slug}`] = on;
  for (const [slug, maps] of Object.entries(mapsByGame ?? {})) {
    if (maps === null) $unset[`mapsByGame.${slug}`] = '';
    else $set[`mapsByGame.${slug}`] = maps;
  }
  const before = await getSettings({ fresh: true }); // also makes sure the doc exists
  await Setting.updateOne({ key: 'site' }, { ...(Object.keys($set).length ? { $set } : {}), ...(Object.keys($unset).length ? { $unset } : {}) });
  invalidateSettings();
  const s = await getSettings({ fresh: true });
  res.locals.audit = { action: 'settings.update', targetType: 'Setting', targetId: s._id, summary: describeSettingsChange(before, s) };
  res.json({ ...publicSettings(s), updatedAt: s.updatedAt });
}

// ---------------- demo data tools

async function demoCounts() {
  const demoIds = (await User.find({ isDemo: true }).select('_id').lean()).map((u) => u._id);
  const demoChallenges = await Challenge.countDocuments({
    $or: [{ isDemo: true }, { teamA: { $in: demoIds } }, { teamB: { $in: demoIds } }],
  });
  return { demoUsers: demoIds.length, demoChallenges };
}

export async function demoStatus(req, res) {
  res.json(await demoCounts());
}

export async function demoClear(req, res) {
  const removed = await clearDemo({ log: () => {} });
  res.locals.audit = { action: 'demo.clear', targetType: 'Demo', summary: `removed ${removed.users} demo users, ${removed.challenges} challenges` };
  res.json({ ok: true, removed, ...(await demoCounts()) });
}

// Replaces the demo world without touching real users or the admin running it.
export async function demoReseed(req, res) {
  const removed = await clearDemo({ log: () => {} });
  const organiser = (await User.findOne({ role: 'organiser', isDemo: false, banned: false })) ?? req.user;
  const { summary } = await seedDemo({ admin: req.user, organiser, log: () => {} });
  res.locals.audit = { action: 'demo.reseed', targetType: 'Demo', summary: `removed ${removed.users} demo users, added ${summary.players} players / ${summary.challenges} challenges` };
  res.json({ ok: true, removed, added: summary, ...(await demoCounts()) });
}

// ---------------- CSV export

// Quotes fields and neutralises spreadsheet formulas (=, +, -, @ at the start of a text cell).
function cell(v) {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return v.toISOString();
  if (typeof v !== 'string') return String(v);
  const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}
const toCsv = (header, rows) => [header, ...rows].map((r) => r.map(cell).join(',')).join('\r\n');

const EXPORTS = {
  // Never passwordHash; dob left out on purpose.
  async users() {
    const users = await User.find().sort({ createdAt: 1 }).lean();
    return toCsv(
      ['id', 'username', 'email', 'role', 'province', 'xp', 'played', 'won', ...GAME_SLUGS.map((g) => `rating_${g}`), 'strikes', 'banned', 'isDemo', 'createdAt'],
      users.map((u) => [
        u._id, u.username, u.email, u.role, u.province, u.xp, u.stats?.played ?? 0, u.stats?.won ?? 0,
        ...GAME_SLUGS.map((g) => u.ratingByGame?.[g] ?? 1000), u.strikes, u.banned, u.isDemo, u.createdAt,
      ]),
    );
  },
  async orders() {
    const orders = await TopupOrder.find().sort({ createdAt: 1 }).populate('user', 'username').populate('product', 'name game').lean();
    return toCsv(
      ['id', 'createdAt', 'username', 'game', 'product', 'priceNpr', 'paymentMethod', 'paymentRef', 'gameUid', 'status', 'adminNote'],
      orders.map((o) => [o._id, o.createdAt, o.user?.username, o.product?.game, o.product?.name, o.priceNpr, o.paymentMethod, o.paymentRef, o.gameUid, o.status, o.adminNote]),
    );
  },
  async challenges() {
    const list = await Challenge.find().sort({ createdAt: 1 }).populate('teamA teamB', 'username').lean();
    const names = (team) => team.map((u) => u?.username).filter(Boolean).join(' ');
    return toCsv(
      ['id', 'createdAt', 'settledAt', 'game', 'mode', 'map', 'teamSize', 'ranked', 'status', 'winnerSide', 'teamA', 'teamB'],
      list.map((c) => [c._id, c.createdAt, c.settledAt, c.game, c.mode, c.map, c.teamSize, c.ranked, c.status, c.winnerSide, names(c.teamA), names(c.teamB)]),
    );
  },
};

export async function exportCsv(req, res) {
  const { what } = req.params;
  const csv = await EXPORTS[what]();
  const stamp = new Date().toISOString().slice(0, 10);
  // A GET, so the mutation middleware won't see it; exports contain emails, so log them explicitly.
  await logAudit({ actor: req.user, action: 'export.csv', targetType: 'Export', targetId: what, summary: `exported ${what} CSV` });
  res.set('Content-Type', 'text/csv; charset=utf-8');
  res.set('Content-Disposition', `attachment; filename="arena-${what}-${stamp}.csv"`);
  res.send(`﻿${csv}`); // BOM so Excel reads UTF-8
}
