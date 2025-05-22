import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "../cart/formatCurrency";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useShoppingCart } from "../context/ShoppingCartContext"; // Assuming this is the correct import path

type Product = {
  id: number;
  name: string;
  price: number;
  img_url: string | null;
};

interface CartItem {
  id: number;
  quantity: number;
}

interface Address {
  id: number;
  is_default: boolean;
  // Add other address fields as needed
  street: string;
  city: string;
  // ... other fields
}

const OrderDetails: React.FC = () => {
  const navigate = useNavigate();
  const { cartItems, cartQuantity } = useShoppingCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const promises = cartItems.map((item) =>
          axios
            .get<Product>(`http://localhost:8000/public/products/${item.id}`)
            .then((res) => res.data)
        );
        const fetchedProducts = await Promise.all(promises);
        setProducts(fetchedProducts);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch product details");
        setLoading(false);
      }
    };

    if (cartItems.length > 0) {
      fetchProducts();
    } else {
      setProducts([]);
      setLoading(false);
    }
  }, [cartItems]);

  // Calculate totals
  const subtotal = products.reduce((total, product) => {
    const cartItem = cartItems.find((item) => item.id === product.id);
    return total + (cartItem ? cartItem.quantity * product.price : 0);
  }, 0);
  const shippingFee = 850;
  const total = subtotal + shippingFee;

  // Handle proceeding to payment
  const handleProceedToPayment = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      // Check if an address exists
      const addressResponse = await axios.get<Address[]>(
        "http://localhost:8000/addresses/",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!addressResponse.data || addressResponse.data.length === 0) {
        const errorMessage = "Please add a delivery address before proceeding.";
        setError(errorMessage);
        toast.error(errorMessage);
        return;
      }

      // Get the default address or the first available address
      const defaultAddress =
        addressResponse.data.find((addr) => addr.is_default) ||
        addressResponse.data[0];

      // Get selected payment method
      const paymentMethodInput = document.querySelector(
        'input[name="payment-method"]:checked'
      ) as HTMLInputElement;
      const paymentMethod = paymentMethodInput?.id || "credit_card";

      // Construct items array with product_id, quantity, and unit_price
      const items = products.map((product) => ({
        product_id: product.id,
        quantity:
          cartItems.find((item) => item.id === product.id)?.quantity || 0,
        unit_price: product.price,
      }));

      // Create order payload
      const orderPayload = {
        delivery_address_id: defaultAddress.id,
        billing_address_id: defaultAddress.id,
        payment_method: paymentMethod,
        subtotal: subtotal,
        shipping_fee: shippingFee,
        total: total,
        items: items,
      };

      // Create order
      const orderResponse = await axios.post(
        "http://localhost:8000/orders/",
        orderPayload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (orderResponse.status === 201) {
        toast.success("Order created successfully");
        navigate("/order-summary");
      }
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.status === 400
          ? err.response?.data?.detail ||
            "Invalid order data. Please check your inputs."
          : `Order creation failed: ${err.response?.status} ${err.response?.statusText}`
        : "Failed to create order. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <section className="bg-white py-8 antialiased dark:bg-gray-900 md:py-16">
      <div className="mx-auto max-w-screen-xl px-4 2xl:px-0">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
          Order #957684673 Details
        </h2>

        <div className="mt-6 sm:mt-8 lg:flex lg:gap-8">
          <div className="w-full divide-y divide-gray-200 overflow-hidden rounded-lg border border-gray-200 dark:divide-gray-700 dark:border-gray-700 lg:max-w-xl xl:max-w-2xl">
            <div className="space-y-4 p-6">
              {products.map((product) => {
                const cartItem = cartItems.find((item) => item.id === product.id);
                return (
                  <div
                    key={product.id}
                    className="flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
                        <span className="font-medium text-gray-900 dark:text-white">
                          Product ID: {product.id}
                        </span>{" "}
                        {product.name}
                      </p>
                    </div>
                    <div className="flex items-center justify-end gap-4">
                      <p className="text-base font-normal text-gray-900 dark:text-white">
                        x{cartItem?.quantity || 1}
                      </p>
                      <p className="text-xl font-bold leading-tight text-gray-900 dark:text-white">
                        {formatCurrency(product.price * (cartItem?.quantity || 1))}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div className="space-y-2">
                <dl className="flex items-center justify-between gap-4">
                  <dt className="text-base font-normal text-gray-500 dark:text-gray-400">
                    Items total ({cartQuantity})
                  </dt>
                  <dd className="text-base font-medium text-gray-900 dark:text-white">
                    {formatCurrency(subtotal)}
                  </dd>
                </dl>
                <dl className="flex items-center justify-between gap-4">
                  <dt className="text-base font-normal text-gray-500 dark:text-gray-400">
                    Shipping Fee
                  </dt>
                  <dd className="text-base font-medium text-gray-900 dark:text-white">
                    {formatCurrency(shippingFee)}
                  </dd>
                </dl>
              </div>
            </div>

            <div className="space-y-4 bg-gray-50 p-6 dark:bg-gray-800">
              <dl className="flex items-center justify-between gap-4 border-t border-gray-200 pt-2 dark:border-gray-700">
                <dt className="text-lg font-bold text-gray-900 dark:text-white">
                  Total
                </dt>
                <dd className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatCurrency(total)}
                </dd>
              </dl>
            </div>
          </div>

          <div className="mt-6 grow sm:mt-8 lg:mt-0">
            <div className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Order history
              </h3>

              <ol className="relative ms-3 border-s border-gray-200 dark:border-gray-700">
                <li className="mb-10 ms-6">
                  <span className="absolute -start-3 flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 ring-8 ring-white dark:bg-gray-700 dark:ring-gray-800">
                    <svg
                      className="h-4 w-4 text-gray-500 dark:text-gray-400"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="m4 12 8-8 8 8M6 10.5V19a1 1 0 0 0 1 1h3v-3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3h3a1 1 0 0 0 1-1v-8.5"
                      />
                    </svg>
                  </span>
                  <h4 className="mb-0.5 text-base font-semibold text-gray-900 dark:text-white">
                    Estimated delivery in 24 Nov 2023
                  </h4>
                  <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
                    Products delivered
                  </p>
                </li>

                <li className="mb-10 ms-6">
                  <span className="absolute -start-3 flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 ring-8 ring-white dark:bg-gray-700 dark:ring-gray-800">
                    <svg
                      className="h-4 w-4 text-gray-500 dark:text-gray-400"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M13 7h6l2 4m-8-4v8m0-8V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v9h2m8 0H9m4 0h2m4 0h2v-4m0 0h-5m3.5 5.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm-10 0a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z"
                      />
                    </svg>
                  </span>
                  <h4 className="mb-0.5 text-base font-semibold text-gray-900 dark:text-white">
                    Today
                  </h4>
                  <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
                    Products being delivered
                  </p>
                </li>

                <li className="mb-10 ms-6 text-primary-700 dark:text-primary-500">
                  <span className="absolute -start-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 ring-8 ring-white dark:bg-primary-900 dark:ring-gray-800">
                    <svg
                      className="h-4 w-4"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M5 11.917 9.724 16.5 19 7.5"
                      />
                    </svg>
                  </span>
                  <h4 className="mb-0.5 font-semibold">23 Nov 2023, 15:15</h4>
                  <p className="text-sm">Products in the courier's warehouse</p>
                </li>

                <li className="mb-10 ms-6 text-primary-700 dark:text-primary-500">
                  <span className="absolute -start-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 ring-8 ring-white dark:bg-primary-900 dark:ring-gray-800">
                    <svg
                      className="h-4 w-4"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M5 11.917 9.724 16.5 19 7.5"
                      />
                    </svg>
                  </span>
                  <h4 className="mb-0.5 text-base font-semibold">
                    22 Nov 2023, 12:27
                  </h4>
                  <p className="text-sm">
                    Products delivered to the courier - DHL Express
                  </p>
                </li>

                <li className="mb-10 ms-6 text-primary-700 dark:text-primary-500">
                  <span className="absolute -start-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 ring-8 ring-white dark:bg-primary-900 dark:ring-gray-800">
                    <svg
                      className="h-4 w-4"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M5 11.917 9.724 16.5 19 7.5"
                      />
                    </svg>
                  </span>
                  <h4 className="mb-0.5 font-semibold">19 Nov 2023, 10:47</h4>
                  <p className="text-sm">Payment accepted - VISA Credit Card</p>
                </li>

                <li className="ms-6 text-primary-700 dark:text-primary-500">
                  <span className="absolute -start-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 ring-8 ring-white dark:bg-primary-900 dark:ring-gray-800">
                    <svg
                      className="h-4 w-4"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M5 11.917 9.724 16.5 19 7.5"
                      />
                    </svg>
                  </span>
                  <div>
                    <h4 className="mb-0.5 font-semibold">19 Nov 2023, 10:45</h4>
                    <a href="#" className="text-sm font-medium hover:underline">
                      Order placed - Receipt #647563
                    </a>
                  </div>
                </li>
              </ol>

              <div className="gap-4 sm:flex sm:items-center">
                <button
                  onClick={() => navigate("/store")}
                  type="button"
                  className="w-full rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-100 hover:text-primary-700 focus:z-10 focus:outline-none focus:ring-4 focus:ring-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white dark:focus:ring-gray-700"
                >
                  Shop
                </button>

                <a
                  href="/orders-overview"
                  className="mt-4 flex w-full items-center justify-center rounded-lg bg-primary-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-800 focus:outline-none focus:ring-4 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 sm:mt-0"
                >
                  My Orders
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OrderDetails;