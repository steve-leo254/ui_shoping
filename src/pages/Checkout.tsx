  import React, { useState, useEffect } from "react";
  import { useNavigate } from "react-router-dom";
  import { useShoppingCart } from "../context/ShoppingCartContext";
  import axios from "axios";
  import AddAddress from "../components/DeliveryDetails";
  import { formatCurrency } from "../cart/formatCurrency";

  type Product = {
    id: number;
    name: string;
    price: number;
    img_url: string | null;
  };

  const Checkout: React.FC = () => {
    const navigate = useNavigate();
    const { cartItems } = useShoppingCart();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Redirect to login if not authenticated
    const token = localStorage.getItem("token");
    useEffect(() => {
      if (!token) {
        navigate("/login");
      }
    }, [token, navigate]);

    // Fetch product details based on cartItems
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

    // Calculate subtotal
    const subtotal = products.reduce((total, product) => {
      const cartItem = cartItems.find((item) => item.id === product.id);
      return total + (cartItem ? cartItem.quantity * product.price : 0);
    }, 0);

    // Define shipping fee
    const shippingFee = 850;

    // Calculate overall total
    const total = subtotal + shippingFee;

    // Handle proceeding to payment
    const handleProceedToPayment = async () => {
      try {
        if (!token) {
          navigate("/login");
          return;
        }

        // Check if an address exists for the user
        const addressResponse = await axios.get("http://localhost:8000/addresses/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!addressResponse.data || addressResponse.data.length === 0) {
          setError("Please add a delivery address before proceeding.");
          return;
        }

        // Prepare cart payload for order creation
        const cartPayload = { cart: cartItems };
        const orderResponse = await axios.post(
          "http://localhost:8000/create_order",
          cartPayload,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (orderResponse.status === 201) {
          navigate("/order-summary");
        }
      } catch (err) {
        setError("Failed to create order. Please try again.");
      }
    };

    return (
      <>
        <section className="bg-white py-8 antialiased dark:bg-gray-900 md:py-16">
          <form action="#" className="mx-auto max-w-screen-xl px-4 2xl:px-0">
            <ol className="items-center flex w-full max-w-2xl text-center text-sm font-medium text-gray-500 dark:text-gray-400 sm:text-base">
              <li className="after:border-1 flex items-center text-primary-700 after:mx-6 after:hidden after:h-1 after:w-full after:border-b after:border-gray-200 dark:text-primary-500 dark:after:border-gray-700 sm:after:inline-block sm:after:content-[''] md:w-full xl:after:mx-10">
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
              </li>

              <li className="after:border-1 flex items-center text-primary-700 after:mx-6 after:hidden after:h-1 after:w-full after:border-b after:border-gray-200 dark:text-primary-500 dark:after:border-gray-700 sm:after:inline-block sm:after:content-[''] md:w-full xl:after:mx-10">
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
              </li>

              <li className="flex shrink-0 items-center">
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
              </li>
            </ol>

            <div className="mt-6 sm:mt-8 lg:flex lg:items-start lg:gap-12 xl:gap-16">
              <div className="min-w-0 flex-1 space-y-8">
                {/* Display error if any */}
                {error && (
                  <div className="text-red-600 dark:text-red-400">{error}</div>
                )}

                {/* ======= Delivery Details ============ */}
                <AddAddress />

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Payment
                  </h3>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 ps-4 dark:border-gray-700 dark:bg-gray-800">
                      <div className="flex items-start">
                        <div className="flex h-5 items-center">
                          <input
                            id="credit-card"
                            aria-describedby="credit-card-text"
                            type="radio"
                            name="payment-method"
                            value=""
                            className="h-4 w-4 border-gray-300 bg-white text-primary-600 focus:ring-2 focus:ring-primary-600 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-primary-600"
                            checked
                          />
                        </div>

                        <div className="ms-4 text-sm">
                          <label
                            htmlFor="credit-card"
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

                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 ps-4 dark:border-gray-700 dark:bg-gray-800">
                      <div className="flex items-start">
                        <div className="flex h-5 items-center">
                          <input
                            id="pay-on-delivery"
                            aria-describedby="pay-on-delivery-text"
                            type="radio"
                            name="payment-method"
                            value=""
                            className="h-4 w-4 border-gray-300 bg-white text-primary-600 focus:ring-2 focus:ring-primary-600 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-primary-600"
                          />
                        </div>

                        <div className="ms-4 text-sm">
                          <label
                            htmlFor="pay-on-delivery"
                            className="font-medium leading-none text-gray-900 dark:text-white"
                          >
                            Payment on delivery
                          </label>
                          <p
                            id="pay-on-delivery-text"
                            className="mt-1 text-xs font-normal text-gray-500 dark:text-gray-400"
                          >
                            ksh 850
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

                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 ps-4 dark:border-gray-700 dark:bg-gray-800">
                      <div className="flex items-start">
                        <div className="flex h-5 items-center">
                          <input
                            id="paypal-2"
                            aria-describedby="paypal-text"
                            type="radio"
                            name="payment-method"
                            value=""
                            className="h-4 w-4 border-gray-300 bg-white text-primary-600 focus:ring-2 focus:ring-primary-600 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-primary-600"
                          />
                        </div>

                        <div className="ms-4 text-sm">
                          <label
                            htmlFor="paypal-2"
                            className="font-medium leading-none text-gray-900 dark:text-white"
                          >
                            Mpesa Account
                          </label>
                          <p
                            id="paypal-text"
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
                      required
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

              <div className="mt-6 w-full space-y-6 sm:mt-8 lg:mt-0 lg:max-w-xs xl:max-w-md">
                <div className="flow-root">
                  <div className="-my-3 divide-y divide-gray-200 dark:divide-gray-800">
                    {loading ? (
                      <div className="py-3 text-center">Loading...</div>
                    ) : error ? (
                      <div className="py-3 text-center text-red-600">{error}</div>
                    ) : products.length === 0 ? (
                      <div className="py-3 text-center">Your cart is empty.</div>
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
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleProceedToPayment}
                    type="button"
                    disabled={products.length === 0}
                    className={`flex w-full items-center justify-center rounded-lg px-5 py-2.5 text-sm font-medium text-white ${
                      products.length === 0
                        ? "bg-blue-600 cursor-not-allowed"
                        : "bg-blue-600 bg-primary-700 hover:bg-primary-800 focus:outline-none focus:ring-4 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
                    }`}
                  >
                    Proceed to Payment
                  </button>

                  <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
                    One or more items in your cart require an account.{" "}
                    <a
                      href="#"
                      title=""
                      className="font-medium text-primary-700 underline hover:no-underline dark:text-primary-500"
                    >
                      Sign in or create an account now.
                    </a>
                    .
                  </p>
                </div>
              </div>
            </div>
          </form>
        </section>
      </>
    );
  };

  export default Checkout;