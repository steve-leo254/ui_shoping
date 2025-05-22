import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Assuming a CartContext for cart data
interface CartItem {
  product_id: number;
  quantity: number;
  unit_price: number;
}

interface Cart {
  items: CartItem[];
  subtotal: number;
}

interface Address {
  id: number;
  street: string;
  city: string;
  phone_number: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

interface UseCart {
  cart: Cart;
}

const useCart = (): UseCart => {
  // Placeholder: Implement actual cart context logic
  return {
    cart: {
      items: [], // Example: [{ product_id: 1, quantity: 2, unit_price: 100.00 }]
      subtotal: 0,
    },
  };
};

const CreateOrder: React.FC = () => {
  const { token } = useAuth();
  const { cart } = useCart();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [formData, setFormData] = useState({
    delivery_address_id: "",
    billing_address_id: "",
    payment_method: "",
    shipping_fee: "0", // Example: Could be dynamic based on address or logic
  });
  const [loading, setLoading] = useState(false);

  // Fetch addresses on mount
  useEffect(() => {
    const fetchAddresses = async () => {
      if (!token) return;
      try {
        const response = await axios.get("http://localhost:8000/addresses", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAddresses(response.data);
      } catch (err) {
        toast.error("Failed to fetch addresses");
        console.error("Error fetching addresses:", err);
      }
    };
    fetchAddresses();
  }, [token]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error("You must be logged in to create an order");
      return;
    }
    if (cart.items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    if (!formData.delivery_address_id || !formData.billing_address_id) {
      toast.error("Please select both delivery and billing addresses");
      return;
    }
    if (!formData.payment_method) {
      toast.error("Please select a payment method");
      return;
    }

    const payload = {
      delivery_address_id: parseInt(formData.delivery_address_id),
      billing_address_id: parseInt(formData.billing_address_id),
      payment_method: formData.payment_method,
      subtotal: cart.subtotal,
      shipping_fee: parseFloat(formData.shipping_fee),
      total: cart.subtotal + parseFloat(formData.shipping_fee),
      items: cart.items,
    };

    try {
      setLoading(true);
      const response = await axios.post("http://localhost:8000/orders/", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(`Order created successfully! Order ID: ${response.data.order_id}`);
      document.getElementById("close-modal-button")?.click();
      // Optionally clear cart here
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || "Failed to create order";
      toast.error(errorMessage);
      console.error("Error creating order:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="createOrderModal"
      tabIndex={-1}
      aria-hidden="true"
      className="antialiased fixed left-0 right-0 top-0 z-50 hidden h-[calc(100%-1rem)] max-h-auto w-full max-h-full items-center justify-center overflow-y-auto overflow-x-hidden antialiased md:inset-0"
    >
      <div className="relative max-h-auto w-full max-w-lg p-4">
        <div className="relative rounded-lg bg-white shadow dark:bg-gray-800">
          <div className="flex items-center justify-between rounded-t border-b border-gray-200 p-4 dark:border-gray-700 md:p-5">
            <h3 className="text-lg font-semibold text-white dark:text-white">
              Create Order
            </h3>
            <button
              id="close-modal-button"
              type="button"
              className="ms-auto inline-flex h-8 w-8 items-center justify-center rounded-lg bg-transparent text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-600 dark:hover:text-white"
              data-modal-toggle="createOrderModal"
            >
              <svg
                className="h-3 w-3"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 14 14"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                />
              </svg>
              <span className="sr-only">Close modal</span>
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-4 md:p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-5">
              <div>
                <label
                  htmlFor="delivery_address_id"
                  className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                >
                  Delivery Address*
                </label>
                <select
                  id="delivery_address_id"
                  name="delivery_address_id"
                  value={formData.delivery_address_id}
                  onChange={handleInputChange}
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500"
                  required
                >
                  <option value="">Select Delivery Address</option>
                  {addresses.map((address) => (
                    <option key={address.id} value={address.id}>
                      {`${address.street}, ${address.city}, ${address.postal_code}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="billing_address_id"
                  className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                >
                  Billing Address*
                </label>
                <select
                  id="billing_address_id"
                  name="billing_address_id"
                  value={formData.billing_address_id}
                  onChange={handleInputChange}
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500"
                  required
                >
                  <option value="">Select Billing Address</option>
                  {addresses.map((address) => (
                    <option key={address.id} value={address.id}>
                      {`${address.street}, ${address.city}, ${address.postal_code}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="payment_method"
                  className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                >
                  Payment Method*
                </label>
                <select
                  id="payment_method"
                  name="payment_method"
                  value={formData.payment_method}
                  onChange={handleInputChange}
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500"
                  required
                >
                  <option value="">Select Payment Method</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="payment_on_delivery">Payment on Delivery</option>
                  <option value="mpesa">M-Pesa</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="shipping_fee"
                  className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                >
                  Shipping Fee (KES)*
                </label>
                <input
                  type="number"
                  id="shipping_fee"
                  name="shipping_fee"
                  value={formData.shipping_fee}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500"
                  placeholder="e.g., 200.00"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="subtotal"
                  className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                >
                  Subtotal (KES)
                </label>
                <input
                  type="number"
                  id="subtotal"
                  value={cart.subtotal.toFixed(2)}
                  disabled
                  className="block w-full rounded-lg border border-gray-300 bg-gray-200 p-2.5 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  readOnly
                />
              </div>
            </div>
            <div className="border-t border-gray-200 pt-4 dark:border-gray-700 md:pt-5">
              <button
                type="submit"
                disabled={loading}
                className={`bg-blue-600 me-2 inline-flex items-center rounded-lg px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-primary-800 focus:outline-none focus:ring-4 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {loading ? "Creating Order..." : "Create Order"}
              </button>
              <button
                type="button"
                id="close-modal-button"
                data-modal-toggle="createOrderModal"
                className="me-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-100 hover:text-primary-700 focus:z-10 focus:outline-none focus:ring-4 focus:ring-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white dark:focus:ring-gray-700"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateOrder;