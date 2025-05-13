// UseFetchProducts.tsx
import axios from 'axios';
import { useState, useCallback } from 'react';
import type { AxiosError } from 'axios';
import type { Product } from '../assets/types'; // Import centralized type

export const useFetchProducts = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [products, setProducts] = useState<Product[]>([]);
  const token = localStorage.getItem('token');

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await axios.get<Product[]>(
        'http://localhost:5000/products',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (result.status === 200) {
        setProducts(result.data);
        console.log('Products fetched successfully:', result.data);
      } else {
        console.error('Unexpected response status:', result.status);
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ detail?: string }>;
      console.error('Error fetching products:', axiosError);

      if (axiosError.response) {
        console.error('Error details:', axiosError.response.data?.detail);
      } else {
        console.error('Network error while fetching products');
      }
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  return { isLoading, products, fetchProducts };
};