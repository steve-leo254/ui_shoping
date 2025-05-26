import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { formatCurrency } from "../cart/formatCurrency";

// Define interfaces based on your pydantic models
interface Product {
  id: number;
  name: string;
  price: number;
  img_url: string;
  description?: string;
  brand?: string;
}

interface OrderDetail {
  order_detail_id: number;
  product_id: number;
  quantity: number;
  total_price: number;
  product: Product;
}

interface Address {
  id: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  address: string;
  additional_info?: string;
  region: string;
  city: string;
}

interface Order {
  order_id: number;
  total: number;
  datetime: string;
  status: string;
  user_id: number;
  order_details: OrderDetail[];
  address?: Address;
}

const OrderDetails: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams();
  const orderId = params.orderId || params.id || params.order_id;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Configuration variables for tax and delivery
  const TAX_RATE = 0.08; // 8% tax rate
  const DELIVERY_FEE = 150; // Fixed delivery fee

  const imgEndPoint = "http://localhost:8000";

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setError("Order ID is required");
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Authentication required");
          setLoading(false);
          return;
        }

        const response = await fetch(`http://localhost:8000/orders/${orderId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            setError("Order not found");
          } else if (response.status === 401) {
            setError("Unauthorized access");
          } else {
            setError("Failed to fetch order details");
          }
          setLoading(false);
          return;
        }

        const orderData = await response.json();
        setOrder(orderData);
      } catch (err) {
        setError("Network error occurred");
        console.error("Error fetching order:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading order details...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 text-lg">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">
          No order data available
        </p>
      </div>
    );
  }

  // Calculate financial details
  const subtotal = order.order_details.reduce(
    (sum, item) => sum + item.total_price,
    0
  );
  const taxAmount = subtotal * TAX_RATE;
  const calculatedTotal = subtotal + DELIVERY_FEE + taxAmount;
  
  // Debug logging to check calculations
  console.log('Subtotal:', subtotal);
  console.log('Tax Amount:', taxAmount);
  console.log('Delivery Fee:', DELIVERY_FEE);
  console.log('Calculated Total:', calculatedTotal);

  // Format the address
  const formatAddress = (address: Address | undefined) => {
    if (!address) return "No address selected";
    return `${address.first_name} ${address.last_name} - ${
      address.phone_number
    }, ${address.address}, ${address.city}, ${address.region}${
      address.additional_info ? `, ${address.additional_info}` : ""
    }`;
  };

  return (
    <section className="bg-white py-8 antialiased dark:bg-gray-900 md:py-16">
      <div className="mx-auto max-w-screen-xl px-4 2xl:px-0">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
            Order #{order.order_id} Details
          </h2>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-600 px-4 py-2 text-sm text-gray-700 rounded hover:bg-gray-300 dark:bg-blue-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            Back to Orders
          </button>
        </div>

        {/* Order Status */}
        <div className="mb-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Ordered on{" "}
            {new Date(order.datetime).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        <div className="mt-6 sm:mt-8 lg:flex lg:gap-8">
          <div className="w-full divide-y divide-gray-200 overflow-hidden rounded-lg border border-gray-200 dark:divide-gray-700 dark:border-gray-700 lg:max-w-xl xl:max-w-2xl">
            {/* Order Items */}
            {order.order_details.map((item) => (
              <div key={item.order_detail_id} className="space-y-4 p-6">
                <div className="flex items-center gap-6">
                  <div className="h-14 w-14 shrink-0">
                    <img
                      className="h-full w-full object-cover rounded"
                      src={
                        item.product.img_url
                          ? `${imgEndPoint}${item.product.img_url}`
                          : "/api/placeholder/56/56"
                      }
                      alt={item.product.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "/api/placeholder/56/56";
                      }}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {item.product.name}
                    </h4>
                    {item.product.brand && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Brand: {item.product.brand}
                      </p>
                    )}
                    {item.product.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {item.product.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
                    <span className="font-medium text-gray-900 dark:text-white">
                      Product ID:
                    </span>{" "}
                    {item.product_id}
                  </p>

                  <div className="flex items-center justify-end gap-4">
                    <p className="text-base font-normal text-gray-900 dark:text-white">
                      x{item.quantity}
                    </p>
                    <p className="text-xl font-bold leading-tight text-gray-900 dark:text-white">
                      {formatCurrency(item.total_price)}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* Order Summary */}
            <div className="space-y-4 bg-gray-50 p-6 dark:bg-gray-800">
              <div className="space-y-2">
                <dl className="flex items-center justify-between gap-4">
                  <dt className="font-normal text-gray-500 dark:text-gray-400">
                    Subtotal
                  </dt>
                  <dd className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(subtotal)}
                  </dd>
                </dl>

                <dl className="flex items-center justify-between gap-4">
                  <dt className="font-normal text-gray-500 dark:text-gray-400">
                    Delivery Fee
                  </dt>
                  <dd className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(DELIVERY_FEE)}
                  </dd>
                </dl>

                <dl className="flex items-center justify-between gap-4">
                  <dt className="font-normal text-gray-500 dark:text-gray-400">
                    Tax ({(TAX_RATE * 100).toFixed(0)}%)
                  </dt>
                  <dd className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(taxAmount)}
                  </dd>
                </dl>
              </div>

              <dl className="flex items-center justify-between gap-4 border-t border-gray-200 pt-2 dark:border-gray-700">
                <dt className="text-lg font-bold text-gray-900 dark:text-white">
                  Total
                </dt>
                <dd className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatCurrency(subtotal + DELIVERY_FEE + taxAmount)}
                </dd>
              </dl>
            </div>
          </div>
          <div className="mt-6 grow sm:mt-8 lg:mt-0">
            <div className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Order Tracking
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
                    Estimated delivery
                  </h4>
                  <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
                    Within 48 hrs after order confirmation
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
                    Order Status
                  </h4>
                  <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                        ${
                          order.status === "delivered"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : order.status === "pending"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                            : order.status === "cancelled"
                            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                        }`}
                    >
                      {order.status.charAt(0).toUpperCase() +
                        order.status.slice(1)}
                    </span>
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
                        d="m4 12 8-8 8 8M6 10.5V19a1 1 0 0 0 1 1h3v-3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3h3a1 1 0 0 0 1-1v-8.5"
                      />
                    </svg>
                  </span>
                  <h4 className="mb-0.5 text-base font-semibold text-gray-900 dark:text-white">
                    Delivery Address
                  </h4>
                  <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
                    {formatAddress(order.address)}
                  </p>
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
                      Order confirmed - Receipt #647563
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