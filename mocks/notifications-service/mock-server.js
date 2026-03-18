const http = require('http');

const PORT = 3004;

// Mock data
const notifications = {
  '123': [
    { id: 'n1', userId: '123', type: 'order', title: 'Order Shipped', message: 'Your order ord-002 has been shipped', data: { orderId: 'ord-002' }, read: false, createdAt: '2024-03-14T10:00:00Z' },
    { id: 'n2', userId: '123', type: 'promotion', title: 'Spring Sale!', message: 'Get 20% off all electronics', data: { promoCode: 'SPRING20' }, read: false, createdAt: '2024-03-13T08:00:00Z' },
    { id: 'n3', userId: '123', type: 'system', title: 'Welcome!', message: 'Welcome to our platform', data: {}, read: true, createdAt: '2023-03-15T10:00:00Z' },
    { id: 'n4', userId: '123', type: 'order', title: 'Order Delivered', message: 'Your order ord-001 has been delivered', data: { orderId: 'ord-001' }, read: true, createdAt: '2024-03-15T14:00:00Z' },
    { id: 'n5', userId: '123', type: 'alert', title: 'Low Stock Alert', message: 'USB-C Hub is running low on stock', data: { productId: 'p5' }, read: false, createdAt: '2024-03-14T16:00:00Z' }
  ]
};

const counts = {
  '123': {
    total: 5,
    unread: 3,
    byType: {
      order: 1,
      promotion: 1,
      system: 0,
      message: 0,
      alert: 1
    }
  }
};

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Correlation-ID', req.headers['x-correlation-id'] || 'mock');

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;

  // Health check
  if (path === '/v1/health') {
    res.statusCode = 200;
    res.end(JSON.stringify({ status: 'healthy', service: 'notifications-service' }));
    return;
  }

  // Get notification count
  const countMatch = path.match(/^\/v1\/users\/([^/]+)\/notifications\/count$/);
  if (countMatch && req.method === 'GET') {
    const userId = countMatch[1];
    res.statusCode = 200;
    res.end(JSON.stringify({ success: true, data: counts[userId] || { total: 0, unread: 0, byType: {} } }));
    return;
  }

  // Get recent notifications
  const recentMatch = path.match(/^\/v1\/users\/([^/]+)\/notifications\/recent$/);
  if (recentMatch && req.method === 'GET') {
    const userId = recentMatch[1];
    const limit = parseInt(url.searchParams.get('limit') || '5');
    const userNotifications = (notifications[userId] || []).slice(0, limit);
    res.statusCode = 200;
    res.end(JSON.stringify({ success: true, data: userNotifications }));
    return;
  }

  // Get user notifications
  const notificationsMatch = path.match(/^\/v1\/users\/([^/]+)\/notifications$/);
  if (notificationsMatch && req.method === 'GET') {
    const userId = notificationsMatch[1];
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const userNotifications = notifications[userId] || [];
    const paginated = userNotifications.slice(offset, offset + limit);
    res.statusCode = 200;
    res.end(JSON.stringify({ success: true, data: { notifications: paginated, total: userNotifications.length } }));
    return;
  }

  // 404 for other routes
  res.statusCode = 404;
  res.end(JSON.stringify({ success: false, error: { message: 'Not found' } }));
});

server.listen(PORT, () => {
  console.log(`Mock Notifications Service running on port ${PORT}`);
});
