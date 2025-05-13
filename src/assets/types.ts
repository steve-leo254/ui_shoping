// src/types.ts
export interface Product {
  id: number;
  name: string;
  cost: number;
  price: number;
  img_url: string | null; // Allow null as per both definitions
  stock_quantity: number;
  created_at?: string; // Optional, as per both definitions
  barcode: number;
  user_id: number;
  brand?: string; // Optional, from AddProduct.tsx ApiResponse
  category_id?: number; // Optional, from AddProduct.tsx ApiResponse
  description?: string; // Optional, from AddProduct.tsx ApiResponse
}