import axios from 'axios';
import { useState } from 'react';
import type { AxiosError, AxiosResponse } from 'axios'; // Added type-only imports

// Define the Product type based on your SQLAlchemy model and Pydantic schema
type Product = {
  id: number;
  name: string;
  cost: number;
  price: number;
  img_url: string | null;
  stock_quantity: number;
  created_at?: string; // DateTime comes as string in JSON
  barcode: number;
  user_id: number;
};

// Custom hook for fetching products
export const useFetchProducts = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [products, setProducts] = useState<Product[]>([]);
  const token = localStorage.getItem("token"); // Get from auth context or state


  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const result = await axios.get<Product[]>( // Removed explicit type annotation
        "http://localhost:8000/products",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (result.status === 200) {
        setProducts(result.data);
        console.log("Products fetched successfully:", result.data);
      } else {
        console.error("Unexpected response status:", result.status);
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ detail?: string }>;
      console.error("Error fetching products:", axiosError);
      
      if (axiosError.response) {
        console.error("Error details:", axiosError.response.data.detail);
      } else {
        console.error("Network error while fetching products");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, products, fetchProducts };
};