// `npm run seed:clear-demo`: removes all isDemo users and everything tied to them, keeping real data.
import { pathToFileURL } from 'node:url';
import { connectDB, disconnectDB } from '../config/db.js';
import {
  Announcement, AuditLog, Challenge, Dispute, Match, Notification, OrganiserApplication, Report, Sponsor,
  TopupOrder, Tournament, User, XpLog,
} from '../models/index.js';

export async function clearDemo({ log = console.log } = {}) {
  const demoIds = (await User.find({ isDemo: true }).select('_id').lean()).map((u) => u._id);
  const involvesDemo = { $or: [{ isDemo: true }, { creator: { $in: demoIds } }, { teamA: { $in: demoIds } }, { teamB: { $in: demoIds } }] };

  const challengeIds = (await Challenge.find(involvesDemo).select('_id').lean()).map((c) => c._id);
  const [disputes, challenges, matches, tournaments] = await Promise.all([
    Dispute.deleteMany({ $or: [{ challenge: { $in: challengeIds } }, { raisedBy: { $in: demoIds } }] }),
    Challenge.deleteMany({ _id: { $in: challengeIds } }),
    // Demo content, plus anything a demo account hosted (e.g. a demo player later approved as organiser).
    Match.deleteMany({ $or: [{ isDemo: true }, { host: { $in: demoIds } }] }),
    Tournament.deleteMany({ $or: [{ isDemo: true }, { organiser: { $in: demoIds } }] }),
  ]);
  // Real matches/tournaments keep running, minus any demo sign-ups.
  await Promise.all([
    Match.updateMany({}, { $pull: { registrations: { user: { $in: demoIds } }, results: { user: { $in: demoIds } } } }),
    Tournament.updateMany({}, { $pull: { registrations: { user: { $in: demoIds } } } }),
  ]);
  const [xp, notifications, orders, announcements, sponsors, applications, reports, audit, users] = await Promise.all([
    XpLog.deleteMany({ user: { $in: demoIds } }),
    Notification.deleteMany({ user: { $in: demoIds } }),
    TopupOrder.deleteMany({ user: { $in: demoIds } }),
    Announcement.deleteMany({ isDemo: true }),
    Sponsor.deleteMany({ isDemo: true }),
    OrganiserApplication.deleteMany({ $or: [{ isDemo: true }, { user: { $in: demoIds } }] }),
    Report.deleteMany({ $or: [{ isDemo: true }, { reporter: { $in: demoIds } }, { target: { $in: demoIds } }] }),
    AuditLog.deleteMany({ actor: { $in: demoIds } }),
    User.deleteMany({ _id: { $in: demoIds } }),
  ]);

  const summary = {
    users: users.deletedCount,
    challenges: challenges.deletedCount,
    disputes: disputes.deletedCount,
    matches: matches.deletedCount,
    tournaments: tournaments.deletedCount,
    xpLogs: xp.deletedCount,
    notifications: notifications.deletedCount,
    orders: orders.deletedCount,
    announcements: announcements.deletedCount,
    sponsors: sponsors.deletedCount,
    organiserApplications: applications.deletedCount,
    reports: reports.deletedCount,
    auditLogs: audit.deletedCount,
  };
  log(`Removed demo data: ${JSON.stringify(summary)}`);
  return summary;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await connectDB();
    await clearDemo();
  } catch (err) {
    console.error('clear-demo failed:', err.message);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
}
