const cron = require('node-cron');
const Listing = require('../models/Listing');
const User = require('../models/User');
const Report = require('../models/Report');

const DAY = 24 * 60 * 60 * 1000;

async function expireOldListings() {
  const cutoff = new Date(Date.now() - 30 * DAY);
  const result = await Listing.updateMany(
    { status: 'active', createdAt: { $lt: cutoff } },
    { status: 'expired' }
  );
  console.log(`[cron] expired ${result.modifiedCount} listings older than 30 days`);
}

async function softDeleteInactiveUsers() {
  const cutoff = new Date(Date.now() - 180 * DAY);
  const result = await User.updateMany(
    { lastActiveAt: { $lt: cutoff }, isDeleted: false },
    { isDeleted: true, deletedAt: new Date() }
  );
  console.log(`[cron] soft-deleted ${result.modifiedCount} inactive users`);
}

async function purgeUnverifiedSignups() {
  const cutoff = new Date(Date.now() - 15 * 60 * 1000);
  const result = await User.deleteMany({
    isVerified: false,
    createdAt: { $lt: cutoff }
  });
  if (result.deletedCount) {
    console.log(`[cron] purged ${result.deletedCount} unverified signup accounts`);
  }
}

async function autoBanFromReports() {
  const THRESHOLD = 5;
  // Aggregate reports per user and ban those exceeding the threshold.
  const grouped = await Report.aggregate([
    { $match: { targetType: 'user' } },
    { $group: { _id: '$targetId', count: { $sum: 1 } } },
    { $match: { count: { $gte: THRESHOLD } } }
  ]);
  for (const row of grouped) {
    await User.updateOne(
      { _id: row._id, isBanned: false },
      { isBanned: true, banReason: `Auto-banned: ${row.count} reports`, reportCount: row.count }
    );
  }
}

function startCronJobs() {
  // Every day at midnight: expire listings + soft-delete inactive users
  cron.schedule('0 0 * * *', async () => {
    try {
      await expireOldListings();
      await softDeleteInactiveUsers();
      await autoBanFromReports();
    } catch (err) {
      console.error('[cron] daily error', err);
    }
  });

  // Every hour: clean up unverified signups (>15 min old)
  cron.schedule('0 * * * *', async () => {
    try {
      await purgeUnverifiedSignups();
    } catch (err) {
      console.error('[cron] hourly error', err);
    }
  });

  console.log('[cron] scheduled jobs started');
}

module.exports = { startCronJobs, expireOldListings, softDeleteInactiveUsers, purgeUnverifiedSignups, autoBanFromReports };
