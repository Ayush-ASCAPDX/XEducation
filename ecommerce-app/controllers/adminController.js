const Order = require("../models/Order");
const User = require("../models/User");
const SiteVisit = require("../models/SiteVisit");

const buildLastSevenDays = () => {
  const days = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(now.getDate() - i);
    const key = date.toISOString().slice(0, 10);
    days.push({ key, label: date.toLocaleDateString() });
  }
  return days;
};

const toMap = (rows) => {
  const map = new Map();
  rows.forEach((row) => {
    map.set(row._id, row.total);
  });
  return map;
};

exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsersPromise = User.countDocuments();
    const totalVisitsPromise = SiteVisit.countDocuments();
    const uniqueVisitorsPromise = SiteVisit.distinct("visitorId");
    const totalOrdersPromise = Order.countDocuments();
    const deliveredOrdersPromise = Order.countDocuments({ status: "delivered" });

    const grossSalesPromise = Order.aggregate([
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    const netSalesPromise = Order.aggregate([
      { $match: { status: { $nin: ["cancelled", "refunded", "returned"] } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    const deliveredSalesPromise = Order.aggregate([
      { $match: { status: "delivered" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    const sevenDays = buildLastSevenDays();
    const rangeStart = new Date(sevenDays[0].key);

    const recentVisitsPromise = SiteVisit.aggregate([
      { $match: { createdAt: { $gte: rangeStart } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const recentSalesPromise = Order.aggregate([
      {
        $match: {
          createdAt: { $gte: rangeStart },
          status: { $nin: ["cancelled", "refunded", "returned"] },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: "$totalAmount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const [
      totalUsers,
      totalVisits,
      uniqueVisitors,
      totalOrders,
      deliveredOrders,
      grossSales,
      netSales,
      deliveredSales,
      recentVisits,
      recentSales,
    ] = await Promise.all([
      totalUsersPromise,
      totalVisitsPromise,
      uniqueVisitorsPromise,
      totalOrdersPromise,
      deliveredOrdersPromise,
      grossSalesPromise,
      netSalesPromise,
      deliveredSalesPromise,
      recentVisitsPromise,
      recentSalesPromise,
    ]);

    const visitMap = toMap(recentVisits);
    const salesMap = toMap(recentSales);
    const trend = sevenDays.map((day) => ({
      date: day.label,
      visits: visitMap.get(day.key) || 0,
      sales: salesMap.get(day.key) || 0,
    }));

    res.json({
      totals: {
        totalUsers,
        totalVisits,
        uniqueVisitors: uniqueVisitors.length,
        totalOrders,
        deliveredOrders,
        grossSales: grossSales[0]?.total || 0,
        netSales: netSales[0]?.total || 0,
        deliveredSales: deliveredSales[0]?.total || 0,
      },
      trend,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to load dashboard" });
  }
};
