// Checkout.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useFetchAddresses } from "../components/useFetchAddresses";
import DeliveryDetails from "../components/DeliveryDetails";
import AddDeliveryDetails from "../components/AddDeliveryDetails";
import { useShoppingCart } from "../context/ShoppingCartContext";
import { formatCurrency } from "../cart/formatCurrency";
import DeliveryOptions from "../components/deliveryOptions";
import PaymentOptions from "../components/paymentOptions";

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { cartItems, deliveryMethod, paymentMethod, mpesaPhone } = useShoppingCart();

  // Calculate subtotal from cartItems
  const subtotal = cartItems.reduce((total, item) => total + item.quantity * item.price, 0);

  // Delivery fee based on delivery method
  const deliveryFee = deliveryMethod === "delivery" ? 150 : 0; // KSh 150 for delivery, 0 for pickup

  // Fixed tax value
  const tax = 199;

  // Calculate total
  const total = subtotal + deliveryFee + tax;

  // Validate M-Pesa phone number (basic validation: 10 digits starting with 07)
  const isValidMpesaPhone = (phone: string | null) => {
    return phone ? /^07\d{8}$/.test(phone) : false;
  };

  // Handle Proceed to Payment
  const handleProceed = () => {
    if (!deliveryMethod) {
      toast.error("Please select a delivery method");
      return;
    }
    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }
    if (paymentMethod === "pay-now" && !isValidMpesaPhone(mpesaPhone)) {
      toast.error("Please enter a valid M-Pesa phone number (e.g., 0712345678)");
      return;
    }
    // All validations passed, proceed to order summary
    navigate("/order-summary", { state: { deliveryMethod, paymentMethod, mpesaPhone } });
  };

  // Handle empty cart
  if (cartItems.length === 0) {
    return (
      <section className="bg-white py-8 antialiased dark:bg-gray-900 md:py-16">
        <div className="mx-auto max-w-screen-xl px-4 2xl:px-0">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
            Checkout
          </h2>
          <div className="text-center mt-6">
            <p className="text-gray-500 dark:text-gray-400">
              Your cart is empty.{" "}
              <a
                href="/shopping-cart"
                className="text-primary-700 underline hover:no-underline dark:text-primary-500"
              >
                Return to cart
              </a>
              {" or "}
              <a
                href="/store"
                className="text-primary-700 underline hover:no-underline dark:text-primary-500"
              >
                continue shopping
              </a>.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white py-8 antialiased dark:bg-gray-900 md:py-16">
      <form
        action="#"
        className="mx-auto max-w-screen-xl px-4 2xl:px-0"
        onSubmit={(e) => {
          e.preventDefault();
          handleProceed();
        }}
      >
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

        <div className="mt-6 sm:mt-8 lg:flex lg:items-start lg:gap-12 xl:gap-16">
          <div className="min-w-0 flex-1 space-y-8">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Customer Address
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:col-span-2">
                <DeliveryDetails />
                <div className="sm:col-span-2">
                  <button
                    type="button"
                    data-modal-target="addBillingInformationModal"
                    data-modal-toggle="addBillingInformationModal"
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-100 hover:text-primary-700 focus:z-10 focus:outline-none focus:ring-4 focus:ring-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white dark:focus:ring-gray-700 disabled:opacity-50"
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
            <DeliveryOptions />
            <PaymentOptions />
          </div>

          <div className="mt-6 w-full space-y-6 sm:mt-8 lg:mt-0 lg:max-w-xs xl:max-w-md">
            <div className="flow-root">
              <div className="-my-3 divide-y divide-gray-200 dark:divide-gray-800">
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
                    Delivery Fee
                  </dt>
                  <dd className="text-base font-medium text-gray-900 dark:text-white">
                    {formatCurrency(deliveryFee)}
                  </dd>
                </dl>

                <dl className="flex items-center justify-between gap-4 py-3">
                  <dt className="text-base font-normal text-gray-500 dark:text-gray-400">
                    Tax
                  </dt>
                  <dd className="text-base font-medium text-gray-900 dark:text-white">
                    {formatCurrency(tax)}
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
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                className="bg-blue-600 flex w-full items-center justify-center rounded-lg bg-primary-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-800 focus:outline-none focus:ring-4 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
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
      <AddDeliveryDetails />
    </section>
  );
};

export default Checkout;