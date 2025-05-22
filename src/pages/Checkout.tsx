import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useShoppingCart } from "../context/ShoppingCartContext";
import DeliveryDetails from "../components/DeliveryDetails";
import AddDeliveryDetails from "../components/AddDeliveryDetails";
import { formatCurrency } from "../cart/formatCurrency";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Product {
  id: number;
  name: string;
  price: number;
  img_url: string | null;
}

interface CartItem {
  id: number;
  quantity: number;
}

interface Address {
  id: number;
  is_default: boolean;
}

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { cartItems } = useShoppingCart() as { cartItems: CartItem[] };
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  // Fetch product details
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        if (cartItems.length === 0) {
          setProducts([]);
          setLoading(false);
          return;
        }

        const promises = cartItems.map((item) =>
          axios
            .get<Product>(`http://localhost:8000/public/products/${item.id}`)
            .then((res) => res.data)
        );
        const fetchedProducts = await Promise.all(promises);
        setProducts(fetchedProducts);
        setLoading(false);
      } catch (err) {
        const errorMessage = axios.isAxiosError(err)
          ? `Failed to fetch products: ${err.response?.status} ${err.response?.statusText}`
          : "Failed to fetch product details";
        setError(errorMessage);
        toast.error(errorMessage);
        setLoading(false);
      }
    };

    fetchProducts();
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
      const defaultAddress = addressResponse.data.find((addr) => addr.is_default) || addressResponse.data[0];

      // Get selected payment method
      const paymentMethodInput = document.querySelector(
        'input[name="payment-method"]:checked'
      ) as HTMLInputElement;
      const paymentMethod = paymentMethodInput?.id || "credit_card";

      // Construct items array with product_id, quantity, and unit_price
      const items = products.map((product) => ({
        product_id: product.id,
        quantity: cartItems.find((item) => item.id === product.id)?.quantity || 0,
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
          ? err.response?.data?.detail || "Invalid order data. Please check your inputs."
          : `Order creation failed: ${err.response?.status} ${err.response?.statusText}`
        : "Failed to create order. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  return (
    <section className="bg-white py-8 antialiased dark:bg-gray-900 md:py-16">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleProceedToPayment();
        }}
        className="mx-auto max-w-screen-xl px-4 2xl:px-0"
      >
        {/* Breadcrumb Navigation */}
        <ol className="items-center flex w-full max-w-2xl text-center text-sm font-medium text-gray-500 dark:text-gray-400 sm:text-base">
          <a
            href="/shopping-cart"
            className="after:border-1 flex items-center text-primary-700 after:mx-6 after:hidden after:h-1 after:w-full after:border-b after:border-gray-200 dark:text-primary-500 dark:after:border-gray-700 sm:after:inline-block sm:after:content-[''] md:w-full xl:after:mx-10"
          >
            <span className="flex items-center after:mx-2 after:text-gray-200 after:content-['/'] dark:after:text-gray-500 sm:after:hidden">
              <svg
                className="me-2 h-4 w-4 sm:h-5 sm:w-5"
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
                  d="M8.5 11.5 11 14l4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
              Cart
            </span>
          </a>
          <a
            href="/checkout"
            className="after:border-1 flex items-center text-primary-700 after:mx-6 after:hidden after:h-1 after:w-full after:border-b after:border-gray-200 dark:text-primary-500 dark:after:border-gray-700 sm:after:inline-block sm:after:content-[''] md:w-full xl:after:mx-10"
          >
            <span className="flex items-center after:mx-2 after:text-gray-200 after:content-['/'] dark:after:text-gray-500 sm:after:hidden">
              <svg
                className="me-2 h-4 w-4 sm:h-5 sm:w-5"
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
                  d="M8.5 11.5 11 14l4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
              Checkout
            </span>
          </a>
          <a href="/order-summary" className="flex shrink-0 items-center">
            <svg
              className="me-2 h-4 w-4 sm:h-5 sm:w-5"
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
                d="M8.5 11.5 11 14l4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
            Order summary
          </a>
        </ol>
        {/* Main Content Layout */}
        <div className="mt-6 sm:mt-8 lg:flex lg:items-start lg:gap-12 xl:gap-16">
          {/* Left Column: Delivery Details and Payment Options */}
          <div className="min-w-0 flex-1 space-y-8">
            {/* Error Display */}
            {error && (
              <div className="text-red-600 dark:text-red-400">{error}</div>
            )}

            {/* Delivery Details Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Delivery Details
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DeliveryDetails />
                <div className="sm:col-span-2">
                  <button
                    type="button"
                    data-modal-target="addBillingInformationModal"
                    data-modal-toggle="addBillingInformationModal"
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-100 hover:text-primary-700 focus:z-10 focus:outline-none focus:ring-4 focus:ring-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white dark:focus:ring-gray-700"
                    aria-label="Add new delivery address"
                  >
                    <svg
                      className="h-5 w-5"
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
                        d="M5 12h14m-7 7V5"
                      />
                    </svg>
                    Add new address
                  </button>
                </div>
              </div>
            </div>

            {/* Payment Options Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Payment
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* Credit Card */}
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 ps-4 dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex items-start">
                    <div className="flex h-5 items-center">
                      <input
                        id="credit_card"
                        aria-describedby="credit-card-text"
                        type="radio"
                        name="payment-method"
                        value="credit_card"
                        className="h-4 w-4 border-gray-300 bg-white text-primary-600 focus:ring-2 focus:ring-primary-600 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-primary-600"
                        defaultChecked
                      />
                    </div>
                    <div className="ms-4 text-sm">
                      <label
                        htmlFor="credit_card"
                        className="font-medium leading-none text-gray-900 dark:text-white"
                      >
                        Credit Card
                      </label>
                      <p
                        id="credit-card-text"
                        className="mt-1 text-xs font-normal text-gray-500 dark:text-gray-400"
                      >
                        Pay with your credit card
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      type="button"
                      className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    >
                      Delete
                    </button>
                    <div className="h-3 w-px shrink-0 bg-gray-200 dark:bg-gray-700"></div>
                    <button
                      type="button"
                      className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    >
                      Edit
                    </button>
                  </div>
                </div>

                {/* Payment on Delivery */}
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 ps-4 dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex items-start">
                    <div className="flex h-5 items-center">
                      <input
                        id="payment_on_delivery"
                        aria-describedby="pay-on-delivery-text"
                        type="radio"
                        name="payment-method"
                        value="payment_on_delivery"
                        className="h-4 w-4 border-gray-300 bg-white text-primary-600 focus:ring-2 focus:ring-primary-600 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-primary-600"
                      />
                    </div>
                    <div className="ms-4 text-sm">
                      <label
                        htmlFor="payment_on_delivery"
                        className="font-medium leading-none text-gray-900 dark:text-white"
                      >
                        Payment on Delivery
                      </label>
                      <p
                        id="pay-on-delivery-text"
                        className="mt-1 text-xs font-normal text-gray-500 dark:text-gray-400"
                      >
                        Ksh 850
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      type="button"
                      className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    >
                      Delete
                    </button>
                    <div className="h-3 w-px shrink-0 bg-gray-200 dark:bg-gray-700"></div>
                    <button
                      type="button"
                      className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    >
                      Edit
                    </button>
                  </div>
                </div>

                {/* Mpesa Account */}
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 ps-4 dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex items-start">
                    <div className="flex h-5 items-center">
                      <input
                        id="mpesa"
                        aria-describedby="mpesa-text"
                        type="radio"
                        name="payment-method"
                        value="mpesa"
                        className="h-4 w-4 border-gray-300 bg-white text-primary-600 focus:ring-2 focus:ring-primary-600 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-primary-600"
                      />
                    </div>
                    <div className="ms-4 text-sm">
                      <label
                        htmlFor="mpesa"
                        className="font-medium leading-none text-gray-900 dark:text-white"
                      >
                        Mpesa Account
                      </label>
                      <p
                        id="mpesa-text"
                        className="mt-1 text-xs font-normal text-gray-500 dark:text-gray-400"
                      >
                        Connect to your account
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      type="button"
                      className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    >
                      Delete
                    </button>
                    <div className="h-3 w-px shrink-0 bg-gray-200 dark:bg-gray-700"></div>
                    <button
                      type="button"
                      className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Voucher Section */}
            <div>
              <label
                htmlFor="voucher"
                className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
              >
                Enter a gift card, voucher or promotional code
              </label>
              <div className="flex max-w-md items-center gap-4">
                <input
                  type="text"
                  id="voucher"
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500"
                  placeholder=""
                />
                <button
                  type="button"
                  className="flex items-center justify-center rounded-lg bg-primary-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-800 focus:outline-none focus:ring-4 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
          {/* Right Column: Order Summary */}
          <div className="mt-6 w-full space-y-6 sm:mt-8 lg:mt-0 lg:max-w-xs xl:max-w-md">
            <div className="flow-root">
              <div className="-my-3 divide-y divide-gray-200 dark:divide-gray-800">
                {loading ? (
                  <div className="py-3 text-center">
                    <svg
                      className="animate-spin h-5 w-5 mx-auto text-gray-500"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z"
                      ></path>
                    </svg>
                  </div>
                ) : error ? (
                  <div className="py-3 text-center text-red-600">{error}</div>
                ) : products.length === 0 ? (
                  <div className="py-3 text-center">
                    Your cart is empty.
                    <a
                      href="/shop"
                      className="mt-2 inline-block text-primary-700 hover:underline"
                      aria-label="Return to shop"
                    >
                      Return to Shop
                    </a>
                  </div>
                ) : (
                  <>
                    <dl className="flex items-center justify-between gap-4 py-3">
                      <dt className="text-base font-normal text-gray-500 dark:text-gray-400">
                        Subtotal
                      </dt>
                      <dd className="text-base font-medium text-gray-900 dark:text-white">
                        {formatCurrency(subtotal)}
                      </dd>
                    </dl>
                    <dl className="flex items-center justify-between gap-4 py-3">
                      <dt className="text-base font-normal text-gray-500 dark:text-gray-400">
                        Shipping Fee
                      </dt>
                      <dd className="text-base font-medium text-gray-900 dark:text-white">
                        {formatCurrency(shippingFee)}
                      </dd>
                    </dl>
                    <dl className="flex items-center justify-between gap-4 py-3">
                      <dt className="text-base font-bold text-gray-900 dark:text-white">
                        Total
                      </dt>
                      <dd className="text-base font-bold text-gray-900 dark:text-white">
                        {formatCurrency(total)}
                      </dd>
                    </dl>
                    <button
                      type="submit"
                      className="bg-blue-700 w-full rounded-lg bg-primary-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-800 focus:outline-none focus:ring-4 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
                      aria-label="Proceed to payment"
                      disabled={products.length === 0}
                    >
                      Proceed to Payment
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>
      <AddDeliveryDetails />
    </section>
  );
};

export default Checkout;