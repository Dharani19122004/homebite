// Vendor sales are calculated from the vendor's own orders only (the backend
// returns nothing else). Definition used everywhere in the vendor dashboard:
//   - Sales       = product subtotals of DELIVERED orders
//   - Pending     = product subtotals of orders still in progress
//   - Cancelled/rejected orders are excluded
//   - The flat delivery fee (totalAmount - product subtotals) is not the
//     vendor's revenue and is excluded.
const IN_PROGRESS = [
  "pending",
  "accepted",
  "preparing",
  "ready",
  "out_for_delivery",
];

export function productTotal(order) {
  return order.items.reduce((sum, item) => sum + item.subtotal, 0);
}

export function computeSales(orders) {
  const delivered = orders.filter((o) => o.orderStatus === "delivered");
  const inProgress = orders.filter((o) => IN_PROGRESS.includes(o.orderStatus));

  const byDay = new Map();
  const byProduct = new Map();
  const byPayment = new Map();

  delivered.forEach((order) => {
    const day = new Date(order.createdAt).toISOString().slice(0, 10);
    const total = productTotal(order);

    byDay.set(day, {
      day,
      orders: (byDay.get(day)?.orders || 0) + 1,
      sales: (byDay.get(day)?.sales || 0) + total,
    });

    byPayment.set(order.paymentMethod, {
      method: order.paymentMethod,
      orders: (byPayment.get(order.paymentMethod)?.orders || 0) + 1,
      sales: (byPayment.get(order.paymentMethod)?.sales || 0) + total,
    });

    order.items.forEach((item) => {
      const prev = byProduct.get(item.name) || { name: item.name, units: 0, sales: 0 };
      byProduct.set(item.name, {
        name: item.name,
        units: prev.units + item.quantity,
        sales: prev.sales + item.subtotal,
      });
    });
  });

  return {
    totalSales: delivered.reduce((sum, o) => sum + productTotal(o), 0),
    deliveredCount: delivered.length,
    pendingValue: inProgress.reduce((sum, o) => sum + productTotal(o), 0),
    inProgressCount: inProgress.length,
    byDay: [...byDay.values()].sort((a, b) => b.day.localeCompare(a.day)),
    byProduct: [...byProduct.values()].sort((a, b) => b.sales - a.sales),
    byPayment: [...byPayment.values()],
  };
}
