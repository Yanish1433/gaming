import { Tournament } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { PUBLIC_USER_FIELDS } from '../utils/sanitize.js';

const isRegistered = (t, user) => user && t.registrations.some((r) => String(r.user?._id ?? r.user) === String(user._id));

function serialize(t, user) {
  const o = t.toObject();
  o.teamsRegistered = t.registrations.length;
  o.viewer = { isRegistered: Boolean(isRegistered(t, user)) };
  return o;
}

async function loadTournament(id) {
  const t = await Tournament.findById(id)
    .populate('organiser', PUBLIC_USER_FIELDS)
    .populate('registrations.user', PUBLIC_USER_FIELDS);
  if (!t) throw ApiError.notFound('Tournament not found');
  return t;
}

export async function listTournaments(req, res) {
  const { game, status } = req.validQuery;
  const filter = {};
  if (game) filter.game = game;
  if (status) filter.status = status;
  const items = await Tournament.find(filter).sort({ startsAt: 1 }).limit(100).populate('organiser', PUBLIC_USER_FIELDS);
  res.json({
    items: items.map((t) => {
      const o = serialize(t, req.user);
      delete o.registrations;
      return o;
    }),
    total: items.length,
    page: 1,
  });
}

export async function getTournament(req, res) {
  res.json(serialize(await loadTournament(req.params.id), req.user));
}

export async function createTournament(req, res) {
  const t = await Tournament.create({ ...req.body, organiser: req.user._id });
  res.locals.audit = { action: 'tournament.create', targetType: 'Tournament', targetId: t._id, summary: `${t.title} (${t.game})` };
  res.status(201).json(serialize(await loadTournament(t._id), req.user));
}

export async function registerForTournament(req, res) {
  const t = await Tournament.findById(req.params.id);
  if (!t) throw ApiError.notFound('Tournament not found');
  if (t.status !== 'registration') throw ApiError.conflict('Registration is closed');
  if (isRegistered(t, req.user)) throw ApiError.conflict('You are already registered');

  const updated = await Tournament.findOneAndUpdate(
    {
      _id: t._id,
      status: 'registration',
      'registrations.user': { $ne: req.user._id },
      $expr: { $lt: [{ $size: '$registrations' }, '$maxTeams'] },
    },
    { $push: { registrations: { user: req.user._id, teamName: req.body.teamName } } },
  );
  if (!updated) throw ApiError.conflict('Tournament is full');
  res.json(serialize(await loadTournament(t._id), req.user));
}
