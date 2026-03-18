import { BaseServiceClient } from "./base-service-client";
import {
  getServiceConfig,
  ServiceKeys,
} from "../config/backend-services.config";
import { IRequestContext } from "../../domain/interfaces/request-context.interface";
import { IServiceResponse } from "../../domain/interfaces/service-response.interface";

/**
 * Product data from the products service
 */
export interface IProductData {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  images: string[];
  stock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Product category
 */
export interface IProductCategory {
  id: string;
  name: string;
  slug: string;
  productCount: number;
}

/**
 * Product statistics for dashboard
 */
export interface IProductStats {
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  topCategories: Array<{
    category: string;
    count: number;
  }>;
}

/**
 * Client for the Products microservice
 */
export class ProductsServiceClient extends BaseServiceClient {
  constructor() {
    super(getServiceConfig(ServiceKeys.PRODUCTS));
  }

  /**
   * Get product by ID
   */
  async getProduct(
    productId: string,
    context: IRequestContext
  ): Promise<IServiceResponse<IProductData>> {
    return this.request<IProductData>(
      {
        method: "GET",
        path: `/v1/products/${productId}`,
      },
      context
    );
  }

  /**
   * Get products by IDs (batch)
   */
  async getProductsByIds(
    productIds: string[],
    context: IRequestContext
  ): Promise<IServiceResponse<IProductData[]>> {
    return this.request<IProductData[]>(
      {
        method: "POST",
        path: "/v1/products/batch",
        body: { ids: productIds },
      },
      context
    );
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(
    category: string,
    limit: number,
    offset: number,
    context: IRequestContext
  ): Promise<IServiceResponse<{ products: IProductData[]; total: number }>> {
    return this.request<{ products: IProductData[]; total: number }>(
      {
        method: "GET",
        path: "/v1/products",
        query: { category, limit, offset },
      },
      context
    );
  }

  /**
   * Get featured products
   */
  async getFeaturedProducts(
    limit: number,
    context: IRequestContext
  ): Promise<IServiceResponse<IProductData[]>> {
    return this.request<IProductData[]>(
      {
        method: "GET",
        path: "/v1/products/featured",
        query: { limit },
      },
      context
    );
  }

  /**
   * Get product categories
   */
  async getCategories(
    context: IRequestContext
  ): Promise<IServiceResponse<IProductCategory[]>> {
    return this.request<IProductCategory[]>(
      {
        method: "GET",
        path: "/v1/categories",
      },
      context
    );
  }

  /**
   * Get product statistics (for dashboard)
   */
  async getProductStats(
    context: IRequestContext
  ): Promise<IServiceResponse<IProductStats>> {
    return this.request<IProductStats>(
      {
        method: "GET",
        path: "/v1/products/stats",
      },
      context
    );
  }

  /**
   * Search products
   */
  async searchProducts(
    query: string,
    limit: number,
    offset: number,
    context: IRequestContext
  ): Promise<IServiceResponse<{ products: IProductData[]; total: number }>> {
    return this.request<{ products: IProductData[]; total: number }>(
      {
        method: "GET",
        path: "/v1/products/search",
        query: { q: query, limit, offset },
      },
      context
    );
  }
}

// Singleton instance
let instance: ProductsServiceClient | null = null;

export function getProductsServiceClient(): ProductsServiceClient {
  if (!instance) {
    instance = new ProductsServiceClient();
  }
  return instance;
}
