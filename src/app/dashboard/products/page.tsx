'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types';
import { useRealTimeProducts } from '@/hooks/useRealTimeData';
import { formatCurrency } from '@/lib/utils';
import { showToast } from '@/lib/toast';

export default function ProductsPage() {
  const { data: session } = useSession();
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');

  // Always call hooks before any early returns
  const { data: products, loading, error, refresh } = useRealTimeProducts(true);

  // Check access - allow retailers and employees
  if (!session || !['RETAILER', 'EMPLOYEE'].includes(session.user.role)) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">Only retailers and employees can access this page.</p>
        </div>
      </DashboardLayout>
    );
  }

  const categories = [...new Set(products.map(product => product.category).filter(Boolean))];

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'ALL' || product.category === selectedCategory;
    const matchesSearch = searchTerm === '' ||
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'name':
      default:
        return a.name.localeCompare(b.name);
    }
  });

  const handleBuyProduct = (product: any) => {
    if (product.stock_quantity === 0) {
      showToast.error('Product out of stock', {
        description: 'This product is currently out of stock.'
      });
      return;
    }
    // Navigate to purchase page
    window.location.href = `/dashboard/products/${product.id}/purchase`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-8 text-white shadow-xl">
          <h1 className="text-4xl font-bold mb-3">Products & Services</h1>
          <p className="text-red-100 text-xl">
            Discover products and tools to enhance your government service experience
          </p>
          <div className="mt-4 flex items-center gap-4 text-red-100">
            <span>🛍️ {products.length} Products Available</span>
            <span>•</span>
            <span>🎯 Real-time Updates</span>
          </div>
        </div>

        {/* Search, Filter and Sort */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Products</label>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value="ALL">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value="name">Sort by Name</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={refresh}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                >
                  🔄 Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        {loading ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading products...</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-4xl mb-4">❌</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Products</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={refresh} className="bg-red-600 hover:bg-red-700 text-white">
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : sortedProducts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-4xl mb-4">🛍️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600">
                {searchTerm || selectedCategory !== 'ALL'
                  ? 'Try adjusting your search or filters.'
                  : 'No products are available yet.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedProducts.map((product) => (
              <Card key={product.id} className={`hover:shadow-lg transition-shadow ${product.stock_quantity === 0 ? 'opacity-75' : ''}`}>
                <CardHeader>
                  <div className="text-center">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-48 object-cover rounded-lg mb-4 aspect-square"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-48 bg-gradient-to-br from-red-100 to-red-200 rounded-lg mb-4 flex flex-col items-center justify-center text-red-600 aspect-square ${product.image_url ? 'hidden' : ''}`}>
                      <div className="text-6xl mb-2">🛍️</div>
                      <div className="text-sm font-medium">{product.category || 'Product'}</div>
                    </div>
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <CardDescription className="text-sm text-gray-500">
                      {product.category}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {product.description}
                  </p>

                  <div className="space-y-3">
                    {product.features && product.features.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-1">Features:</h4>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {product.features.slice(0, 3).map((feature: string, index: number) => (
                            <li key={index} className="flex items-center">
                              <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm">
                      <div className="text-gray-500">
                        Stock: {product.stock_quantity || 0}
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        product.stock_quantity > 0
                          ? 'bg-green-100 text-green-600'
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {product.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}
                      </div>
                    </div>
                  </div>

                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl font-bold text-red-600">
                          {formatCurrency(product.price)}
                        </span>
                      </div>
                      <Button
                        onClick={() => handleBuyProduct(product)}
                        className="w-full bg-red-600 hover:bg-red-700 text-white"
                        disabled={product.stock_quantity === 0}
                      >
                        {product.stock_quantity > 0 ? 'Buy Now' : 'Out of Stock'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

        {/* Stats */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-red-600">{products.length}</div>
                <div className="text-sm text-gray-600">Total Products</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{categories.length}</div>
                <div className="text-sm text-gray-600">Categories</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{sortedProducts.length}</div>
                <div className="text-sm text-gray-600">Filtered Results</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {products.filter(p => p.stock_quantity > 0).length}
                </div>
                <div className="text-sm text-gray-600">In Stock</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
