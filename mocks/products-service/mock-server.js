const http = require('http');

const PORT = 3003;

// Mock data
const products = [
  { id: 'p1', name: 'Laptop Pro', description: 'High-performance laptop', price: 999.99, currency: 'USD', category: 'Electronics', images: ['/img/p1.jpg'], stock: 50, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-03-01T00:00:00Z' },
  { id: 'p2', name: 'Wireless Mouse', description: 'Ergonomic wireless mouse', price: 29.99, currency: 'USD', category: 'Electronics', images: ['/img/p2.jpg'], stock: 200, isActive: true, createdAt: '2024-01-15T00:00:00Z', updatedAt: '2024-02-15T00:00:00Z' },
  { id: 'p3', name: 'Mechanical Keyboard', description: 'RGB mechanical keyboard', price: 79.99, currency: 'USD', category: 'Electronics', images: ['/img/p3.jpg'], stock: 100, isActive: true, createdAt: '2024-02-01T00:00:00Z', updatedAt: '2024-03-10T00:00:00Z' },
  { id: 'p4', name: '4K Monitor', description: '27-inch 4K display', price: 299.99, currency: 'USD', category: 'Electronics', images: ['/img/p4.jpg'], stock: 30, isActive: true, createdAt: '2024-02-15T00:00:00Z', updatedAt: '2024-03-05T00:00:00Z' },
  { id: 'p5', name: 'USB-C Hub', description: '7-in-1 USB-C hub', price: 49.99, currency: 'USD', category: 'Accessories', images: ['/img/p5.jpg'], stock: 5, isActive: true, createdAt: '2024-03-01T00:00:00Z', updatedAt: '2024-03-12T00:00:00Z' }
];

const categories = [
  { id: 'cat1', name: 'Electronics', slug: 'electronics', productCount: 4 },
  { id: 'cat2', name: 'Accessories', slug: 'accessories', productCount: 1 }
];

const stats = {
  totalProducts: 5,
  activeProducts: 5,
  lowStockProducts: 1,
  outOfStockProducts: 0,
  topCategories: [
    { category: 'Electronics', count: 4 },
    { category: 'Accessories', count: 1 }
  ]
};

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Correlation-ID', req.headers['x-correlation-id'] || 'mock');

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;

  // Health check
  if (path === '/v1/health') {
    res.statusCode = 200;
    res.end(JSON.stringify({ status: 'healthy', service: 'products-service' }));
    return;
  }

  // Get product stats
  if (path === '/v1/products/stats' && req.method === 'GET') {
    res.statusCode = 200;
    res.end(JSON.stringify({ success: true, data: stats }));
    return;
  }

  // Get featured products
  if (path === '/v1/products/featured' && req.method === 'GET') {
    const limit = parseInt(url.searchParams.get('limit') || '5');
    res.statusCode = 200;
    res.end(JSON.stringify({ success: true, data: products.slice(0, limit) }));
    return;
  }

  // Get categories
  if (path === '/v1/categories' && req.method === 'GET') {
    res.statusCode = 200;
    res.end(JSON.stringify({ success: true, data: categories }));
    return;
  }

  // Get products
  if (path === '/v1/products' && req.method === 'GET') {
    const category = url.searchParams.get('category');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    let filteredProducts = category ? products.filter(p => p.category === category) : products;
    filteredProducts = filteredProducts.slice(offset, offset + limit);
    res.statusCode = 200;
    res.end(JSON.stringify({ success: true, data: { products: filteredProducts, total: products.length } }));
    return;
  }

  // Get product by ID
  const productMatch = path.match(/^\/v1\/products\/([^/]+)$/);
  if (productMatch && req.method === 'GET') {
    const productId = productMatch[1];
    const product = products.find(p => p.id === productId);
    if (product) {
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true, data: product }));
    } else {
      res.statusCode = 404;
      res.end(JSON.stringify({ success: false, error: { message: 'Product not found' } }));
    }
    return;
  }

  // 404 for other routes
  res.statusCode = 404;
  res.end(JSON.stringify({ success: false, error: { message: 'Not found' } }));
});

server.listen(PORT, () => {
  console.log(`Mock Products Service running on port ${PORT}`);
});
