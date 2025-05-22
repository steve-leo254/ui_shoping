// paymentOptions.tsx
import React from "react";
import { useShoppingCart } from "../context/ShoppingCartContext";

const PaymentOptions: React.FC = () => {
  const { paymentMethod, setPaymentMethod, mpesaPhone, setMpesaPhone } = useShoppingCart();

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Payment Options</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Pay Now Option */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 ps-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-start">
            <div className="flex h-5 items-center">
              <input
                id="pay-now"
                type="radio"
                name="payment-method"
                value="pay-now"
                checked={paymentMethod === "pay-now"}
                onChange={(e) => setPaymentMethod(e.target.value as "pay-now" | "pay-later")}
                className="h-4 w-4 border-gray-300 bg-white text-primary-600 focus:ring-2 focus:ring-primary-600 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-primary-600"
              />
            </div>
            <div className="ms-4 text-sm">
              <label htmlFor="pay-now" className="font-medium leading-none text-gray-900 dark:text-white">
                Pay Now with M-Pesa
              </label>
              <p className="mt-1 text-xs font-normal text-gray-500 dark:text-gray-400">
                Pay instantly via M-Pesa mobile money.
              </p>
            </div>
          </div>
        </div>
        {/* Pay Later Option */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 ps-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-start">
            <div className="flex h-5 items-center">
              <input
                id="pay-later"
                type="radio"
                name="payment-method"
                value="pay-later"
                checked={paymentMethod === "pay-later"}
                onChange={(e) => setPaymentMethod(e.target.value as "pay-now" | "pay-later")}
                className="h-4 w-4 border-gray-300 bg-white text-primary-600 focus:ring-2 focus:ring-primary-600 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-primary-600"
              />
            </div>
            <div className="ms-4 text-sm">
              <label htmlFor="pay-later" className="font-medium leading-none text-gray-900 dark:text-white">
                Pay Later (on delivery or pickup)
              </label>
              <p className="mt-1 text-xs font-normal text-gray-500 dark:text-gray-400">
                Pay when you receive or pick up your order.
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Phone Number Input - Only for Pay Now */}
      {paymentMethod === "pay-now" && (
        <div className="mt-4">
          <label htmlFor="mpesa-phone" className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
            M-Pesa Phone Number*
          </label>
          <input
            type="text"
            id="mpesa-phone"
            value={mpesaPhone || ""}
            onChange={(e) => setMpesaPhone(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500"
            placeholder="e.g., 0712345678"
            required
          />
        </div>
      )}
    </div>
  );
};

export default PaymentOptions;