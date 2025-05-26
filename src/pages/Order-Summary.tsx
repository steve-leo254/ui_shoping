import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useShoppingCart } from "../context/ShoppingCartContext";
import { formatCurrency } from "../cart/formatCurrency";
import { toast } from "react-toastify";

const OrderSummary: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems, selectedAddress, clearCart } = useShoppingCart(); // Assuming ShoppingCartContext provides these
  // Ensure cartItems and selectedAddress are defined
  const addressId = selectedAddress?.id;

  // Extract data from navigation state
  const { deliveryMethod, mpesaPhone } = location.state || {};

  // Calculate order summary values
  const subtotal = cartItems.reduce(
    (total, item) => total + item.quantity * item.price,
    0
  );
  const deliveryFee = deliveryMethod === "delivery" ? 150 : 0; // Example logic
  const tax = 199; // Fixed tax value, can be made dynamic
  const total = subtotal + deliveryFee + tax;

  // Function to format the address
  const formatAddress = (address) => {
    if (!address) return "No address selected";
    return `${address.first_name} ${address.last_name} - ${address.phone_number}, ${address.address}, ${address.city}, ${address.region}`;
  };

  // Order Sending logic

  const handleSendOrder = async () => {
    try {
      // Retrieve the authentication token
      const token = localStorage.getItem("token");
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
      if (deliveryMethod === "delivery" && !selectedAddress?.id) {
        toast.error("Please select a delivery address");
        return;
      }

      // Prepare the payload for the API
      const payload = {
        cart: cartItems.map((item) => ({
          id: item.id,
          quantity: item.quantity,
        })),
        address_id: addressId,
      };

      // Make the API request
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
        throw new Error(errorData.detail || "Failed to create order");
      }

      const data = await response.json();

      // Format the address fields for OrderConfirmation
      const formattedAddress = selectedAddress
        ? `${selectedAddress.address}, ${selectedAddress.city}, ${selectedAddress.region}`
        : "No address selected";
      const name = selectedAddress
        ? `${selectedAddress.first_name} ${selectedAddress.last_name}`
        : "No name provided";
      const phoneNumber =
        selectedAddress?.phone_number || "No phone number provided";

      // Option 1: Use client-side date if API doesn't provide it
      const orderDate = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      // Option 2: If the API returns the date, use data.order_date instead
      // const orderDate = data.order_date || new Date().toLocaleDateString("en-US", { ... });

      toast.success("Order created successfully!");
       // Navigate to OrderConfirmation with required fields
      navigate("/order-confirmation", {
        state: {
          orderId: data.order_id,
          orderDate, // Use either client-side or API-provided date
          name,
          address: formattedAddress,
          phoneNumber,
        },
      });
      clearCart();
     
    } catch (error) {
      toast.error(
        error.message || "An error occurred while creating the order"
      );
      console.error("Order submission error:", error);
    }
  };

  return (
    <>
      <section className="bg-white py-8 antialiased dark:bg-gray-900 md:py-16">
        <form action="#" className="mx-auto max-w-screen-xl px-4 2xl:px-0">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
              Order summary
            </h2>

            <div className="mt-6 space-y-4 border-b border-t border-gray-200 py-8 dark:border-gray-700 sm:mt-8">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                Billing & Delivery information
              </h4>
              <dl>
                <dt className="text-base font-medium text-gray-900 dark:text-white">
                  Individual
                </dt>
                <dd className="mt-1 text-base font-normal text-gray-500 dark:text-gray-400">
                  {formatAddress(selectedAddress)}
                </dd>
              </dl>
              <button
                type="button"
                data-modal-target="billingInformationModal"
                data-modal-toggle="billingInformationModal"
                className="text-base font-medium text-primary-700 hover:underline dark:text-primary-500"
              >
                Edit
              </button>
            </div>

            <div className="mt-6 sm:mt-8">
              <div className="relative overflow-x-auto border-b border-gray-200 dark:border-gray-800">
                <table className="w-full text-left font-medium text-gray-900 dark:text-white md:table-fixed">
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {cartItems.map((item) => (
                      <tr key={item.id}>
                        <td className="whitespace-nowrap py-4 md:w-[384px]">
                          <div className="flex items-center gap-4">
                            <a
                              href="#"
                              className="flex items-center aspect-square w-10 h-10 shrink-0"
                            >
                              <img
                                className="h-auto w-full max-h-full dark:hidden"
                                src={
                                  item.img_url ||
                                  "https://flowbite.s3.amazonaws.com/blocks/e-commerce/imac-front.svg"
                                }
                                alt={item.name}
                              />
                              <img
                                className="hidden h-auto w-full max-h-full dark:block"
                                src={
                                  item.img_url ||
                                  "https://flowbite.s3.amazonaws.com/blocks/e-commerce/imac-front-dark.svg"
                                }
                                alt={item.name}
                              />
                            </a>
                            <a href="#" className="hover:underline">
                              {item.name}
                            </a>
                          </div>
                        </td>
                        <td className="p-4 text-base font-normal text-gray-900 dark:text-white">
                          x{item.quantity}
                        </td>
                        <td className="p-4 text-right text-base font-bold text-gray-900 dark:text-white">
                          {formatCurrency(item.price * item.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 space-y-6">
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Order summary
                </h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <dl className="flex items-center justify-between gap-4">
                      <dt className="text-gray-500 dark:text-gray-400">
                        Original price
                      </dt>
                      <dd className="text-base font-medium text-gray-900 dark:text-white">
                        {formatCurrency(subtotal)}
                      </dd>
                    </dl>
                    <dl className="flex items-center justify-between gap-4">
                      <dt className="text-gray-500 dark:text-gray-400">
                        Savings
                      </dt>
                      <dd className="text-base font-medium text-green-500">
                        -{formatCurrency(0)} {/* Placeholder for savings */}
                      </dd>
                    </dl>
                    <dl className="flex items-center justify-between gap-4">
                      <dt className="text-gray-500 dark:text-gray-400">
                        Delivery Fee
                      </dt>
                      <dd className="text-base font-medium text-gray-900 dark:text-white">
                        {formatCurrency(deliveryFee)}
                      </dd>
                    </dl>
                    <dl className="flex items-center justify-between gap-4">
                      <dt className="text-gray-500 dark:text-gray-400">Tax</dt>
                      <dd className="text-base font-medium text-gray-900 dark:text-white">
                        {formatCurrency(tax)}
                      </dd>
                    </dl>
                  </div>
                  <dl className="flex items-center justify-between gap-4 border-t border-gray-200 pt-2 dark:border-gray-700">
                    <dt className="text-lg font-bold text-gray-900 dark:text-white">
                      Total
                    </dt>
                    <dd className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatCurrency(total)}
                    </dd>
                  </dl>
                </div>

                <div className="flex items-start sm:items-center">
                  <input
                    id="terms-checkbox-2"
                    type="checkbox"
                    value=""
                    className="h-4 w-4 rounded border-gray-300 bg-gray-100 text-primary-600 focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-primary-600"
                  />
                  <label
                    htmlFor="terms-checkbox-2"
                    className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                  >
                    I agree with the{" "}
                    <a
                      href="#"
                      title=""
                      className="text-primary-700 underline hover:no-underline dark:text-primary-500"
                    >
                      Terms and Conditions
                    </a>{" "}
                    of use of the Flowbite marketplace
                  </label>
                </div>

                <div className="gap-4 sm:flex sm:items-center">
                  <a
                    href="/store"
                    className="w-full rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-100 hover:text-primary-700 focus:z-10 focus:outline-none focus:ring-4 focus:ring-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white dark:focus:ring-gray-700"
                  >
                    Return to Shopping
                  </a>
                  <button
                    onClick={() => handleSendOrder()}
                    type="submit"
                    className="bg-blue-600 mt-4 flex w-full items-center justify-center rounded-lg bg-primary-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-800 focus:outline-none focus:ring-4 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 sm:mt-0"
                  >
                    Send the order
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </section>

      <div
        id="billingInformationModal"
        tabIndex={-1}
        aria-hidden="true"
        className="antialiased fixed left-0 right-0 top-0 z-50 hidden h-[calc(100%-1rem)] max-h-auto w-full max-h-full items-center justify-center overflow-y-auto overflow-x-hidden antialiased md:inset-0"
      >
        {/* Modal content can be added here if needed */}
      </div>
    </>
  );
};

export default OrderSummary;
