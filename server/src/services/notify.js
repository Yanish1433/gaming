import { Notification } from '../models/index.js';

// Fire-and-forget friendly: notification failures must never break the main action.
export async function notify(userIds, { type, text, link }) {
  const ids = [...new Set((Array.isArray(userIds) ? userIds : [userIds]).filter(Boolean).map(String))];
  if (!ids.length) return;
  try {
    await Notification.insertMany(ids.map((user) => ({ user, type, text, link })));
  } catch (err) {
    console.error('notify failed:', err.message);
  }
}
