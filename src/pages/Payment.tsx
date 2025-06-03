import React, { useState, useEffect } from "react";
import { useShoppingCart } from "../context/ShoppingCartContext";
import { useLocation, useNavigate } from "react-router-dom";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
  }).format(amount);
};

interface PaymentData {
  order_id: number;
  phone_number: string;
  amount: number;
}

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { deliveryFee, selectedAddress } = useShoppingCart();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [checkoutRequestID, setCheckoutRequestID] = useState<string | null>(null);
  const [pollingTimeout, setPollingTimeout] = useState(false);

  const { orderId, orderCreated, subtotal } = location.state || {};
  const total = subtotal + deliveryFee;

  const handleMpesaPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate phone number (must be 10 digits starting with 0 or 12 digits starting with 254)
    const phoneRegex = /^(?:254[17]\d{8}|0[17]\d{8})$/;
    if (!phoneRegex.test(phoneNumber)) {
      setError("Please enter a valid Kenyan phone number (e.g., 0712345678 or 254712345678)");
      setLoading(false);
      return;
    }

    // Format phone number to 254xxxxxxxxx
    let formattedPhone = phoneNumber;
    if (phoneNumber.startsWith("0")) {
      formattedPhone = "254" + phoneNumber.substring(1);
    }

    // Ensure formatted phone number is 12 digits
    if (formattedPhone.length !== 12) {
      setError("Invalid phone number length after formatting.");
      setLoading(false);
      return;
    }

    const paymentData: PaymentData = {
      order_id: orderId,
      phone_number: formattedPhone,
      amount: Math.floor(total), // Ensure whole number
    };

    try {
      const response = await fetch("http://localhost:8000/initiate_payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to initiate payment");
      }

      const result = await response.json();
      setCheckoutRequestID(result.CheckoutRequestID);
      setPolling(true);
      alert("Please check your phone to complete the M-Pesa payment.");
    } catch (err: any) {
      setError(err.message || "Failed to initiate payment. Please try again.");
      setLoading(false);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let timeout: NodeJS.Timeout;

    if (polling && orderId) {
      // Set timeout for polling (2 minutes)
      timeout = setTimeout(() => {
        setPolling(false);
        setPollingTimeout(true);
        setError("Payment confirmation timed out. Please try again.");
      }, 120000); // 2 minutes

      interval = setInterval(async () => {
        try {
          const response = await fetch(`http://localhost:8000/check_payment_status/${orderId}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });
          const data = await response.json();
          if (data.status === "ACCEPTED") {
            setPolling(false);
            clearInterval(interval);
            clearTimeout(timeout);
            navigate("/order-confirmation", {
              state: {
                orderId,
                total,
                orderDate: new Date().toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }),
                phoneNumber,
                name: selectedAddress
                  ? `${selectedAddress.first_name} ${selectedAddress.last_name}`
                  : "No name provided",
                address: selectedAddress
                  ? `${selectedAddress.address}, ${selectedAddress.city}, ${selectedAddress.region}`
                  : "No address selected",
                transactionId: checkoutRequestID,
              },
            });
          } else if (data.status === "REJECTED") {
            setPolling(false);
            clearInterval(interval);
            clearTimeout(timeout);
            setError("Payment was rejected. Please try again.");
          }
        } catch (err) {
          setPolling(false);
          clearInterval(interval);
          clearTimeout(timeout);
          setError("Error checking payment status. Please try again.");
        }
      }, 5000); // Poll every 5 seconds
    }

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [polling, orderId, navigate, checkoutRequestID, selectedAddress, total]);

  if (!orderId || !subtotal) {
    return (
      <section className="bg-white py-8 antialiased dark:bg-gray-900 md:py-16">
        <div className="mx-auto max-w-screen-xl px-4 2xl:px-0">
          <div className="mx-auto max-w-5xl text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
              Payment Error
            </h2>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Order information is missing. Please go back to checkout and try again.
            </p>
            <button
              onClick={() => navigate(-1)}
              className="mt-4 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white py-8 antialiased dark:bg-gray-900 md:py-16">
      <div className="mx-auto max-w-screen-xl px-4 2xl:px-0">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
            M-Pesa Payment
          </h2>

          <div className="mt-6 sm:mt-8 lg:flex lg:items-start lg:gap-12">
            <div className="w-full rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6 lg:max-w-xl lg:p-8">
              <div className="mb-6">
                <label
                  htmlFor="phone_number"
                  className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                >
                  M-Pesa Phone Number*
                </label>
                <input
                  type="text"
                  id="phone_number"
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                  placeholder="e.g., 0712345678 or 254712345678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  disabled={loading || polling}
                />
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Amount to Pay: {formatCurrency(total)}
                </p>
                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                {polling && !error && (
                  <p className="mt-2 text-sm text-blue-600">Awaiting payment confirmation...</p>
                )}
                {pollingTimeout && (
                  <button
                    onClick={() => {
                      setPollingTimeout(false);
                      setError("");
                      setPhoneNumber("");
                    }}
                    className="mt-4 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Try Again
                  </button>
                )}
              </div>

              <button
                onClick={handleMpesaPayment}
                disabled={loading || polling || pollingTimeout}
                className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
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
                      d="M4 12a8 8 0 018-8v8z"
                    ></path>
                  </svg>
                ) : null}
                {loading ? "Initiating Payment..." : polling ? "Awaiting Payment..." : "Pay with M-Pesa"}
              </button>
            </div>

            <div className="mt-6 grow sm:mt-8 lg:mt-0">
              <div className="space-y-4 rounded-lg border border-gray-100 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Order ID: {orderId}
                  </p>
                </div>

                <dl className="flex items-center justify-between gap-4">
                  <dt className="text-base font-normal text-gray-500 dark:text-gray-400">
                    Subtotal
                  </dt>
                  <dd className="text-base font-medium text-gray-900 dark:text-white">
                    {formatCurrency(subtotal)}
                  </dd>
                </dl>
                <dl className="flex items-center justify-between gap-4">
                  <dt className="text-base font-normal text-gray-500 dark:text-gray-400">
                    Delivery Fee
                  </dt>
                  <dd className="text-base font-medium text-gray-900 dark:text-white">
                    {formatCurrency(deliveryFee)}
                  </dd>
                </dl>

                <dl className="flex items-center justify-between gap-4 border-t border-gray-200 pt-2 dark:border-gray-700">
                  <dt className="text-base font-bold text-gray-900 dark:text-white">
                    Total
                  </dt>
                  <dd className="text-base font-bold text-gray-900 dark:text-white">
                    {formatCurrency(total)}
                  </dd>
                </dl>
              </div>

              <div className="mt-6 flex items-center justify-center gap-8">
                <div className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center">
                    <span className="text-white font-bold text-sm">M</span>
                  </div>
                  <span className="font-medium text-green-800 dark:text-green-200">
                    M-Pesa
                  </span>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-gray-500 dark:text-gray-400 sm:mt-8 lg:text-left">
            Payment processed via{" "}
            <a
              href="https://www.safaricom.co.ke/"
              className="font-medium text-blue-600 underline hover:no-underline dark:text-blue-400"
            >
              M-Pesa
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Payment;