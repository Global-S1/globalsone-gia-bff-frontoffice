const http = require('http');

const PORT = 3002;

// Mock data
const orders = {
  '123': [
    {
      id: 'ord-001',
      userId: '123',
      items: [
        { productId: 'p1', productName: 'Laptop', quantity: 1, unitPrice: 999.99, total: 999.99 },
        { productId: 'p2', productName: 'Mouse', quantity: 2, unitPrice: 29.99, total: 59.98 }
      ],
      status: 'delivered',
      subtotal: 1059.97,
      tax: 84.80,
      total: 1144.77,
      shippingAddress: '123 Main St, City, Country',
      createdAt: '2024-03-10T10:00:00Z',
      updatedAt: '2024-03-15T14:00:00Z'
    },
    {
      id: 'ord-002',
      userId: '123',
      items: [
        { productId: 'p3', productName: 'Keyboard', quantity: 1, unitPrice: 79.99, total: 79.99 }
      ],
      status: 'shipped',
      subtotal: 79.99,
      tax: 6.40,
      total: 86.39,
      shippingAddress: '123 Main St, City, Country',
      createdAt: '2024-03-12T08:00:00Z',
      updatedAt: '2024-03-14T10:00:00Z'
    },
    {
      id: 'ord-003',
      userId: '123',
      items: [
        { productId: 'p4', productName: 'Monitor', quantity: 1, unitPrice: 299.99, total: 299.99 }
      ],
      status: 'processing',
      subtotal: 299.99,
      tax: 24.00,
      total: 323.99,
      shippingAddress: '123 Main St, City, Country',
      createdAt: '2024-03-14T12:00:00Z',
      updatedAt: '2024-03-14T12:00:00Z'
    }
  ]
};

const stats = {
  '123': {
    totalOrders: 42,
    totalSpent: 3450.00,
    averageOrderValue: 82.14,
    loyaltyPoints: 1250
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
    res.end(JSON.stringify({ status: 'healthy', service: 'orders-service' }));
    return;
  }

  // Get recent orders
  const recentMatch = path.match(/^\/v1\/users\/([^/]+)\/orders\/recent$/);
  if (recentMatch && req.method === 'GET') {
    const userId = recentMatch[1];
    const limit = parseInt(url.searchParams.get('limit') || '5');
    const userOrders = (orders[userId] || []).slice(0, limit);
    res.statusCode = 200;
    res.end(JSON.stringify({ success: true, data: userOrders }));
    return;
  }

  // Get user orders
  const ordersMatch = path.match(/^\/v1\/users\/([^/]+)\/orders$/);
  if (ordersMatch && req.method === 'GET') {
    const userId = ordersMatch[1];
    const userOrders = orders[userId] || [];
    res.statusCode = 200;
    res.end(JSON.stringify({ success: true, data: { orders: userOrders, total: userOrders.length } }));
    return;
  }

  // Get order stats
  const statsMatch = path.match(/^\/v1\/users\/([^/]+)\/orders\/stats$/);
  if (statsMatch && req.method === 'GET') {
    const userId = statsMatch[1];
    res.statusCode = 200;
    res.end(JSON.stringify({ success: true, data: stats[userId] || { totalOrders: 0, totalSpent: 0, averageOrderValue: 0, loyaltyPoints: 0 } }));
    return;
  }

  // Get orders by status
  if (path === '/v1/orders' && req.method === 'GET') {
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const allOrders = Object.values(orders).flat();
    const filteredOrders = status ? allOrders.filter(o => o.status === status).slice(0, limit) : allOrders.slice(0, limit);
    res.statusCode = 200;
    res.end(JSON.stringify({ success: true, data: filteredOrders }));
    return;
  }

  // 404 for other routes
  res.statusCode = 404;
  res.end(JSON.stringify({ success: false, error: { message: 'Not found' } }));
});

server.listen(PORT, () => {
  console.log(`Mock Orders Service running on port ${PORT}`);
});
