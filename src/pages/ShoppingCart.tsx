import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useShoppingCart } from "../context/ShoppingCartContext";
import { useAuth } from "../context/AuthContext";
import CartItem from "../components/CartItem";
import { formatCurrency } from "../cart/formatCurrency";
import { toast } from "react-toastify";

const ShoppingCart: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { cartItems, cartQuantity, subtotal, selectedAddress, deliveryFee, clearCart } = useShoppingCart();
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  // Handle empty cart
  if (cartItems.length === 0) {
    return <div className="text-center">Your cart is empty.</div>;
  }

  // Order creation logic moved from OrderSummary
  const handleCheckout = async () => {
    // Prevent double submission
    if (isCreatingOrder) {
      return;
    }

    setIsCreatingOrder(true);

    try {
      if (!token) {
        toast.error("Please log in to place an order");
        navigate("/login");
        return;
      }

      // Validate required data
      if (!cartItems || cartItems.length === 0) {
        toast.error("Your cart is empty");
        return;
      }

      // Prepare the payload for the API
      const payload = {
        cart: cartItems.map((item) => ({
          id: item.id,
          quantity: item.quantity,
        })),
        address_id: selectedAddress?.id || null,
        delivery_fee: deliveryFee,
      };

      // Make the API request to create order
      const response = await fetch("http://localhost:8000/create_order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      // Handle the response
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.detail || "Failed to create order";
        
        if (errorMessage.includes("Invalid address ID")) {
          toast.error("Selected address is invalid");
        } else if (errorMessage.includes("Product ID")) {
          toast.error("One or more products are not available");
        } else if (errorMessage.includes("Insufficient stock")) {
          toast.error("Insufficient stock for one or more products");
        } else {
          toast.error(errorMessage);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Clear cart after successful order creation
      clearCart();
      
      toast.success("Order created successfully!");
      
      // Navigate to checkout with the order ID
      navigate("/checkout", {
        state: {
          subtotal: subtotal,
          orderId: data.order_id,
          orderCreated: true,
        },
      });
      
    } catch (error) {
      toast.error(
        error.message || "An error occurred while creating the order"
      );
      console.error("Order creation error:", error);
    } finally {
      setIsCreatingOrder(false);
    }
  };

  return (
    <section className="bg-white py-8 antialiased dark:bg-gray-900 md:py-16">
      <div className="mx-auto max-w-screen-xl px-4 2xl:px-0">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
          Shopping Cart
        </h2>
        <div className="mt-6 sm:mt-8 md:gap-6 lg:flex lg:items-start xl:gap-8">
          <div className="mx-auto w-full flex-none lg:max-w-2xl xl:max-w-4xl">
            <div className="space-y-6">
              {/* Render cart items directly */}
              {cartItems.map((item) => (
                <CartItem
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  price={item.price}
                  img_url={item.img_url}
                  quantity={item.quantity}
                />
              ))}
            </div>
          </div>

          <div className="mx-auto mt-6 max-w-4xl flex-1 space-y-6 lg:mt-0 lg:w-full">
            <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6">
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                Order summary
              </p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <dl className="flex items-center justify-between gap-4">
                    <dt className="text-base font-normal text-gray-500 dark:text-gray-400">
                      Items total ({cartQuantity})
                    </dt>
                    <dd className="text-base font-medium text-gray-900 dark:text-white">
                      {formatCurrency(subtotal)}
                    </dd>
                  </dl>
                </div>

                <dl className="flex items-center justify-between gap-4 border-t border-gray-200 pt-2 dark:border-gray-700">
                  <dt className="text-base font-bold text-gray-900 dark:text-white">
                    Subtotal
                  </dt>
                  <dd className="text-base font-bold text-gray-900 dark:text-white">
                    {formatCurrency(subtotal)}
                  </dd>
                </dl>
              </div>

              <button
                onClick={handleCheckout}
                disabled={isCreatingOrder}
                className={`flex w-full items-center justify-center rounded-lg px-5 py-2.5 text-sm font-medium text-white focus:outline-none focus:ring-4 ${
                  isCreatingOrder
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
                }`}
              >
                {isCreatingOrder ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Creating Order...
                  </>
                ) : (
                  `Checkout (${formatCurrency(subtotal)})`
                )}
              </button>

              <div className="flex items-center justify-center gap-2">
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                  or
                </span>
                <a
                  href="/store"
                  title=""
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary-700 underline hover:no-underline dark:text-primary-500"
                >
                  Continue Shopping
                  <svg
                    className="h-5 w-5"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 12H5m14 0-4 4m4-4-4-4"
                    />
                  </svg>
                </a>
              </div>
            </div>

            <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6">
              <form className="space-y-4">
                <div>
                  <label
                    htmlFor="voucher"
                    className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Do you have a voucher or gift card?
                  </label>
                  <input
                    type="text"
                    id="voucher"
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500"
                    placeholder=""
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="bg-blue-600 flex w-full items-center justify-center rounded-lg bg-primary-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-800 focus:outline-none focus:ring-4 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
                >
                  Apply Code
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ShoppingCart;