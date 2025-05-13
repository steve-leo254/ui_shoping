// Products.tsx
import React, { useEffect } from 'react';
import { useFetchProducts } from '../components/UseFetchProducts';
import AddProducts from '../components/AddProduct';
import UpdateProducts from '../components/UpdateProduct';
import ViewProducts from '../components/ViewProduct';
import ProductsTable from '../components/ProductsTable';


const Products: React.FC = () => {
  const { products, fetchProducts } = useFetchProducts();

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]); // Add fetchProducts to dependency array for safety

  return (
    <>
      <ProductsTable />
      <AddProducts />
      <UpdateProducts products={products} />
      <ViewProducts />
    </>
  );
};

export default Products;