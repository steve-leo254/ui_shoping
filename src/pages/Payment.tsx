import React, { useState } from "react";
import { useShoppingCart } from "../context/ShoppingCartContext";
import { useLocation, useNavigate } from "react-router-dom";

// Mock formatCurrency function for demo
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
  }).format(amount);
};

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { deliveryFee, selectedAddress } = useShoppingCart();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // get order_id, subtotal and total from state
  const { orderId, orderCreated, subtotal } = location.state || {};

  // calculate total using both subtotal and delivery fee
  const total = subtotal + deliveryFee;

  const handleMpesaPayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate phone number (Kenyan format: e.g., 07xxxxxxxx or +254xxxxxxxxx)
    const phoneRegex = /^(?:\+254|0)[17]\d{8}$/;
    if (!phoneRegex.test(phoneNumber)) {
      setError(
        "Please enter a valid Kenyan phone number (e.g., 0712345678 or +254712345678)"
      );
      setLoading(false);
      return;
    }

    // Format phone number to 254 format
    let formattedPhone = phoneNumber;
    if (phoneNumber.startsWith("0")) {
      formattedPhone = "254" + phoneNumber.substring(1);
    } else if (phoneNumber.startsWith("+254")) {
      formattedPhone = phoneNumber.substring(1);
    }

    // Prepare the transaction data
    const transactionData = {
      Amount: Math.round(total), // Keep as number
      PhoneNumber: formattedPhone,
      AccountReference: orderId ? orderId.toString() : "", // Convert to string
    };

    try {
      console.log("Sending transaction data:", transactionData);

      const response = await fetch(
        "https://89b7-197-237-26-50.ngrok-free.app/ipn/daraja/lnmo/transact",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true", // Skip ngrok browser warning
            Accept: "application/json",
          },
          mode: "cors", // Explicitly set CORS mode
          body: JSON.stringify(transactionData),
        }
      );

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);

        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { message: errorText };
        }

        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();
      console.log("API Response:", result);

      // Check if the transaction was initiated successfully
      if (result.ResponseCode === "0" || response.ok) {
        alert(
          "M-Pesa payment initiated successfully. Please check your phone to complete the payment."
        );
        navigate("/order-confirmation", {
          state: {
            orderId,
            total,
            orderDate: new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
            phoneNumber: formattedPhone,
            name: selectedAddress
              ? `${selectedAddress.first_name} ${selectedAddress.last_name}`
              : "No name provided",
            address: selectedAddress
              ? `${selectedAddress.address}, ${selectedAddress.city}, ${selectedAddress.region}`
              : "No address selected",

            transactionId: result.CheckoutRequestID || result.MerchantRequestID,
          },
        });
      } else {
        throw new Error(
          result.ResponseDescription || "Failed to initiate payment"
        );
      }
    } catch (err) {
      console.error("Payment error:", err);

      // More specific error handling
      if (err.name === "TypeError" && err.message.includes("fetch")) {
        setError(
          "Network error: Unable to connect to payment server. Please check your internet connection and try again."
        );
      } else if (err.message.includes("CORS")) {
        setError(
          "CORS error: Payment server configuration issue. Please contact support."
        );
      } else {
        setError(
          err.message || "Failed to initiate payment. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle case where order data is missing
  if (!orderId || !subtotal) {
    return (
      <section className="bg-white py-8 antialiased dark:bg-gray-900 md:py-16">
        <div className="mx-auto max-w-screen-xl px-4 2xl:px-0">
          <div className="mx-auto max-w-5xl text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
              Payment Error
            </h2>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Order information is missing. Please go back to checkout and try
              again.
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
            <form
              onSubmit={handleMpesaPayment}
              className="w-full rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6 lg:max-w-xl lg:p-8"
            >
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
                  placeholder="e.g., 0712345678 or +254712345678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Initiating Payment..." : "Pay with M-Pesa"}
              </button>
            </form>

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
