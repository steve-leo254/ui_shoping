import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

type CartItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  img_url?: string | null;
};

type UserInfo = {
  name: string;
  phone: string;
  address: string;
};

const OrderSummary: React.FC = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [userInfo, setUserInfo] = useState<UserInfo>({
    name: "Bonnie Green",
    phone: "+1 234 567 890",
    address: "San Francisco, California, United States, 3454, Scott Street",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    try {
      const storedCart = JSON.parse(localStorage.getItem("cart") || "[]") as CartItem[];
      setCart(storedCart);
    } catch (error) {
      console.error("Failed to load cart from localStorage:", error);
      setCart([]);
    }
    // In a real app, fetch userInfo from an API or auth context
  }, []);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const taxRate = 0.16; // Configurable in a real app
  const tax = subtotal * taxRate;
  const storePickup = 200; // Configurable in a real app
  const total = subtotal + tax + storePickup;

  const handleModalToggle = () => setIsModalOpen(!isModalOpen);

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setUserInfo({
      name: `${formData.get("first_name")} ${formData.get("last_name")}`,
      phone: formData.get("phone") as string,
      address: formData.get("address") as string,
    });
    setIsModalOpen(false);
  };

  if (cart.length === 0) {
    return (
      <section className="bg-white py-8 antialiased dark:bg-gray-900 md:py-16">
        <div className="mx-auto max-w-screen-xl px-4 2xl:px-0">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
            Your cart is empty
          </h2>
          <button
            onClick={() => navigate("/")}
            className="mt-4 w-full rounded-lg bg-primary-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-800 focus:outline-none focus:ring-4 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
          >
            Continue Shopping
          </button>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="bg-white py-8 antialiased dark:bg-gray-900 md:py-16">
        <form action="#" className="mx-auto max-w-screen-xl px-4 2xl:px-0">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
              Order Summary
            </h2>

            <div className="mt-6 space-y-4 border-b border-t border-gray-200 py-8 dark:border-gray-700 sm:mt-8">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                Billing & Delivery Information
              </h4>
              <dl>
                <dt className="text-base font-medium text-gray-900 dark:text-white">
                  {userInfo.name}
                </dt>
                <dd className="mt-1 text-base font-normal text-gray-500 dark:text-gray-400">
                  {userInfo.phone}, {userInfo.address}
                </dd>
              </dl>
              <button
                type="button"
                onClick={handleModalToggle}
                className="text-base font-medium text-primary-700 hover:underline dark:text-primary-500"
              >
                Edit
              </button>
            </div>

            <div className="mt-6 sm:mt-8">
              <div className="relative overflow-x-auto border-b border-gray-200 dark:border-gray-800">
                <table className="w-full text-left font-medium text-gray-900 dark:text-white md:table-fixed">
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {cart.map((item) => (
                      <tr key={item.id}>
                        <td className="whitespace-nowrap py-4 md:w-[384px]">
                          <div className="flex items-center gap-4">
                            <img
                              className="h-10 w-10"
                              src={item.img_url || "https://flowbite.s3.amazonaws.com/blocks/e-commerce/imac-front.svg"}
                              alt={item.name}
                            />
                            <a href="#" className="hover:underline">
                              {item.name}
                            </a>
                          </div>
                        </td>
                        <td className="p-4">x{item.quantity}</td>
                        <td className="p-4 text-right font-bold">
                          ${(item.price * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 space-y-6">
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Order Summary
                </h4>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-gray-500 dark:text-gray-400">Original price</dt>
                    <dd className="text-base font-medium text-red-600 dark:text-red-400">${subtotal.toFixed(2)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500 dark:text-gray-400">Savings</dt>
                    <dd className="text-base font-medium text-green-500 dark:text-green-400">$0.00</dd> {/* Add dynamic logic here */}
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500 dark:text-gray-400">Store Pickup</dt>
                    <dd className="text-base font-medium text-red-600 dark:text-red-400">${storePickup.toFixed(2)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500 dark:text-gray-400">Tax</dt>
                    <dd className="text-base font-medium text-red-600 dark:text-red-400">${tax.toFixed(2)}</dd>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-2 dark:border-gray-700">
                    <dt className="font-bold text-lg">Total</dt>
                    <dd className="font-bold text-lg text-red-600 dark:text-red-400">${total.toFixed(2)}</dd>
                  </div>
                </dl>

                <div className="flex items-start">
                  <input
                    id="terms-checkbox"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-2 focus:ring-primary-500"
                  />
                  <label htmlFor="terms-checkbox" className="ms-2 text-sm text-gray-900 dark:text-gray-300">
                    I agree with the{" "}
                    <a href="#" className="text-primary-700 underline hover:no-underline">
                      Terms and Conditions
                    </a>
                  </label>
                </div>

                <div className="gap-4 sm:flex">
                  <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="w-full rounded-lg border border-gray-200 px-5 py-2.5 text-sm text-gray-900 hover:bg-gray-100 hover:text-primary-700"
                  >
                    Return to Shopping
                  </button>
                  <button
                    onClick={() => navigate("/order-confirmation")}
                    type="submit"
                    className="mt-4 w-full rounded-lg bg-primary-700 px-5 py-2.5 text-sm text-white hover:bg-primary-800 sm:mt-0"
                  >
                    Send the Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-lg rounded-lg bg-white p-4 shadow dark:bg-gray-800">
            <div className="flex items-center justify-between border-b p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Billing Information
              </h3>
              <button onClick={handleModalToggle} className="text-gray-400 hover:text-gray-900">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 14 14">
                  <path stroke="currentColor" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleFormSubmit} className="p-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="first_name" className="mb-2 block text-sm font-medium">
                    First Name*
                  </label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    className="w-full rounded-lg border p-2.5 text-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="last_name" className="mb-2 block text-sm font-medium">
                    Last Name*
                  </label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    className="w-full rounded-lg border p-2.5 text-sm"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="phone" className="mb-2 block text-sm font-medium">
                    Phone Number*
                  </label>
                  <input
                    type="text"
                    id="phone"
                    name="phone"
                    className="w-full rounded-lg border p-2.5 text-sm"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="address" className="mb-2 block text-sm font-medium">
                    Shipping Address*
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    rows={4}
                    className="w-full rounded-lg border p-2.5 text-sm"
                    required
                  />
                </div>
              </div>
              <div className="mt-4 border-t pt-4">
                <button
                  type="submit"
                  className="rounded-lg bg-primary-700 px-5 py-2.5 text-sm text-white hover:bg-primary-800"
                >
                  Save Information
                </button>
                <button
                  type="button"
                  onClick={handleModalToggle}
                  className="ml-2 rounded-lg border px-5 py-2.5 text-sm text-gray-900 hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default OrderSummary;