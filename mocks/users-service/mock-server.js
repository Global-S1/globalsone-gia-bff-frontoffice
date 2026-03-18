const http = require('http');

const PORT = 3001;

// Mock data
const users = {
  '123': {
    id: '123',
    email: 'juan@email.com',
    firstName: 'Juan',
    lastName: 'Pérez',
    avatar: '/avatars/123.jpg',
    createdAt: '2023-03-15T10:00:00Z',
    updatedAt: '2024-03-01T15:30:00Z'
  },
  '456': {
    id: '456',
    email: 'maria@email.com',
    firstName: 'María',
    lastName: 'García',
    avatar: '/avatars/456.jpg',
    createdAt: '2023-06-20T08:00:00Z',
    updatedAt: '2024-02-15T12:00:00Z'
  }
};

const preferences = {
  '123': {
    userId: '123',
    theme: 'dark',
    language: 'es',
    notificationsEnabled: true,
    emailNotifications: true
  },
  '456': {
    userId: '456',
    theme: 'light',
    language: 'en',
    notificationsEnabled: true,
    emailNotifications: false
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
    res.end(JSON.stringify({ status: 'healthy', service: 'users-service' }));
    return;
  }

  // Get user by ID
  const userMatch = path.match(/^\/v1\/users\/([^/]+)$/);
  if (userMatch && req.method === 'GET') {
    const userId = userMatch[1];
    if (users[userId]) {
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true, data: users[userId] }));
    } else {
      res.statusCode = 404;
      res.end(JSON.stringify({ success: false, error: { message: 'User not found' } }));
    }
    return;
  }

  // Get user preferences
  const prefsMatch = path.match(/^\/v1\/users\/([^/]+)\/preferences$/);
  if (prefsMatch && req.method === 'GET') {
    const userId = prefsMatch[1];
    if (preferences[userId]) {
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true, data: preferences[userId] }));
    } else {
      res.statusCode = 404;
      res.end(JSON.stringify({ success: false, error: { message: 'Preferences not found' } }));
    }
    return;
  }

  // 404 for other routes
  res.statusCode = 404;
  res.end(JSON.stringify({ success: false, error: { message: 'Not found' } }));
});

server.listen(PORT, () => {
  console.log(`Mock Users Service running on port ${PORT}`);
});
