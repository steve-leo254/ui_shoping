import React, { useState, useEffect } from "react";
import axios from "axios";
import { formatCurrency } from "../cart/formatCurrency";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import { useShoppingCart } from "../context/ShoppingCartContext";

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
  street: string;
  city: string;
  state: string;
  zip_code: string;
}

interface OrderHistory {
  id: number;
  status: string;
  timestamp: string;
  details?: string;
}

const OrderTracking: React.FC = () => {
  const navigate = useNavigate();
  const { cartItems, cartQuantity } = useShoppingCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [orderHistory, setOrderHistory] = useState<OrderHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"credit_card" | "paypal">("credit_card");

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  // Fetch products
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

  // Fetch order history
  useEffect(() => {
    const fetchOrderHistory = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get<OrderHistory[]>(
          "http://localhost:8000/orders/history",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setOrderHistory(response.data);
      } catch (err) {
        setError("Failed to fetch order history");
      }
    };

    fetchOrderHistory();
  }, []);

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

      const defaultAddress =
        addressResponse.data.find((addr) => addr.is_default) ||
        addressResponse.data[0];

      const items = products.map((product) => ({
        product_id: product.id,
        quantity: cartItems.find((item) => item.id === product.id)?.quantity || 0,
        unit_price: product.price,
      }));

      const orderPayload = {
        delivery_address_id: defaultAddress.id,
        billing_address_id: defaultAddress.id,
        payment_method: paymentMethod,
        subtotal,
        shipping_fee: shippingFee,
        total,
        items,
      };

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

  // Handle cancel order
  const handleCancelOrder = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:8000/orders/cancel",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Order cancelled successfully");
      navigate("/orders");
    } catch (err) {
      const errorMessage = "Failed to cancel order. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-700"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-screen-xl px-4 py-8 text-center">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg bg-primary-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-800"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <section className="bg-white py-8 antialiased dark:bg-gray-900 md:py-16">
      <div className="mx-auto max-w-screen-xl px-4 2xl:px-0">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
          Track the delivery of order
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
                <dl className="flex items-center justify-between gap-4">
                  <dt className="text-base font-bold text-gray-900 dark:text-white">
                    Total
                  </dt>
                  <dd className="text-base font-bold text-gray-900 dark:text-white">
                    {formatCurrency(total)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="mt-6 grow sm:mt-8 lg:mt-0">
            <div className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Order History
              </h3>

              <ol className="relative ms-3 border-s border-gray-200 dark:border-gray-700" role="list">
                {orderHistory.map((history) => (
                  <li key={history.id} className="mb-10 ms-6" role="listitem">
                    <span className="absolute -start-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 ring-8 ring-white dark:bg-primary-900 dark:ring-gray-800">
                      <svg
                        className="h-4 w-4 text-primary-700 dark:text-primary-500"
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
                    <h4 className="mb-0.5 font-semibold text-gray-900 dark:text-white">
                      {new Date(history.timestamp).toLocaleString()}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {history.status}
                      {history.details && ` - ${history.details}`}
                    </p>
                  </li>
                ))}
              </ol>

              <div className="gap-4 sm:flex sm:items-center">
                <button
                  type="button"
                  onClick={handleCancelOrder}
                  className="w-full rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-100 hover:text-primary-700 focus:z-10 focus:outline-none focus:ring-4 focus:ring-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white dark:focus:ring-gray-700"
                >
                  Cancel the order
                </button>

                <a
                  href="/order-details"
                  className="mt-4 flex w-full items-center justify-center rounded-lg bg-primary-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-800 focus:outline-none focus:ring-4 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 sm:mt-0"
                >
                  Order details
                </a>
              </div>

              {/* Payment Method Selection */}
              <div className="mt-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Payment Method
                </h4>
                <div className="mt-2 space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="payment-method"
                      id="credit_card"
                      value="credit_card"
                      checked={paymentMethod === "credit_card"}
                      onChange={() => setPaymentMethod("credit_card")}
                      className="text-primary-700 focus:ring-primary-700"
                    />
                    Credit Card
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="payment-method"
                      id="paypal"
                      value="paypal"
                      checked={paymentMethod === "paypal"}
                      onChange={() => setPaymentMethod("paypal")}
                      className="text-primary-700 focus:ring-primary-700"
                    />
                    PayPal
                  </label>
                </div>
                <button
                  onClick={handleProceedToPayment}
                  className="mt-4 w-full rounded-lg bg-primary-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-800 focus:outline-none focus:ring-4 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
                >
                  Proceed to Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OrderTracking;