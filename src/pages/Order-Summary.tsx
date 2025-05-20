import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useShoppingCart } from "../context/ShoppingCartContext";
import axios from "axios";
import { formatCurrency } from "../cart/formatCurrency";

// Define types
type Product = {
  id: number;
  name: string;
  price: number;
  img_url: string | null;
};

type CartProduct = Product & { quantity: number };

const OrderSummary: React.FC = () => {
  const navigate = useNavigate();
  const { cartItems } = useShoppingCart();
  const [products, setProducts] = useState<CartProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for billing form data
  const [billingFormData, setBillingFormData] = useState({
    isCompany: false,
    companyName: "",
    vatNumber: "",
    fullName: "",
    phoneNumber: "",
    street: "",
    city: "",
    region: "",
    postalCode: "",
    country: "United States",
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const promises = cartItems.map((item) =>
          axios
            .get<Product>(`http://localhost:8000/public/products/${item.id}`)
            .then((res) => ({ ...res.data, quantity: item.quantity }))
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

  // Form handlers
  const handleBillingInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setBillingFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleIsCompanyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBillingFormData((prev) => ({ ...prev, isCompany: e.target.checked }));
  };

  const handleBillingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Billing form submitted:", billingFormData);
    // TODO: Integrate with API to save data and close modal
  };

  // Calculate subtotal
  const subtotal = products.reduce(
    (total, product) => total + product.quantity * product.price,
    0
  );

  // Define store pickup fee
  const storePickupFee = 850;

  // Calculate total
  const total = subtotal + storePickupFee;

  // Handle loading, error, and empty cart
  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  if (error) {
    return <div className="text-center text-red-600">{error}</div>;
  }

  if (products.length === 0) {
    return <div className="text-center">Your order is empty.</div>;
  }

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
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td className="whitespace-nowrap py-4 md:w-[384px]">
                          <div className="flex items-center gap-4">
                            <a
                              href="#"
                              className="flex items-center aspect-square w-10 h-10 shrink-0"
                            >
                              <img
                                className="h-auto w-full max-h-full dark:hidden"
                                src={product.img_url || "placeholder.png"}
                                alt={product.name}
                              />
                            </a>
                            <a href="#" className="hover:underline">
                              {product.name}
                            </a>
                          </div>
                        </td>
                        <td className="p-4 text-base font-normal text-gray-900 dark:text-white">
                          x{product.quantity}
                        </td>
                        <td className="p-4 text-right text-base font-bold text-gray-900 dark:text-white">
                          {formatCurrency(product.quantity * product.price)}
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
                        Total
                      </dt>
                      <dd className="text-base font-medium text-gray-900 dark:text-white">
                        {formatCurrency(subtotal)}
                      </dd>
                    </dl>

                    <dl className="flex items-center justify-between gap-4">
                      <dt className="text-gray-500 dark:text-gray-400">
                        Shipping Fee
                      </dt>
                      <dd className="text-base font-medium text-gray-900 dark:text-white">
                        {formatCurrency(storePickupFee)}
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
                  <button
                    type="button"
                    className="w-full rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-100 hover:text-primary-700 focus:z-10 focus:outline-none focus:ring-4 focus:ring-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white dark:focus:ring-gray-700"
                  >
                    Return to Shopping
                  </button>

                  <button
                    onClick={() => navigate("/order-confirmation")}
                    type="submit"
                    className="mt-4 flex w-full items-center justify-center rounded-lg bg-primary-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-800 focus:outline-none focus:ring-4 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 sm:mt-0"
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
        <div className="relative max-h-auto w-full max-h-full max-w-lg p-4">
          <div className="relative rounded-lg bg-white shadow dark:bg-gray-800">
            <div className="flex items-center justify-between rounded-t border-b border-gray-200 p-4 dark:border-gray-700 md:p-5">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Billing Information
              </h3>
              <button
                type="button"
                className="ms-auto inline-flex h-8 w-8 items-center justify-center rounded-lg bg-transparent text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-600 dark:hover:text-white"
                data-modal-toggle="billingInformationModal"
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
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                  />
                </svg>
                <span className="sr-only">Close modal</span>
              </button>
            </div>
            <form onSubmit={handleBillingSubmit} className="p-4 md:p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-5">
                {/* Checkbox for company */}
                <div className="flex items-center gap-4 sm:col-span-2">
                  <div className="flex items-center">
                    <input
                      id="company_address_billing_modal"
                      type="checkbox"
                      checked={billingFormData.isCompany}
                      onChange={handleIsCompanyChange}
                      className="h-4 w-4 rounded border-gray-300 bg-gray-100 text-primary-600 focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-primary-600"
                    />
                    <label
                      htmlFor="company_address_billing_modal"
                      className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                    >
                      Order as a company
                    </label>
                  </div>
                </div>

                {/* Company fields */}
                {billingFormData.isCompany && (
                  <>
                    <div>
                      <label
                        htmlFor="company_name"
                        className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                      >
                        Company Name*
                      </label>
                      <input
                        type="text"
                        id="company_name"
                        name="companyName"
                        value={billingFormData.companyName}
                        onChange={handleBillingInputChange}
                        className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500"
                        placeholder="Flowbite LLC"
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="vat_number"
                        className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                      >
                        VAT Number*
                      </label>
                      <input
                        type="text"
                        id="vat_number"
                        name="vatNumber"
                        value={billingFormData.vatNumber}
                        onChange={handleBillingInputChange}
                        className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500"
                        placeholder="DE42313253"
                        required
                      />
                    </div>
                  </>
                )}

                {/* Full Name */}
                <div>
                  <label
                    htmlFor="full_name"
                    className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Full Name*
                  </label>
                  <input
                    type="text"
                    id="full_name"
                    name="fullName"
                    value={billingFormData.fullName}
                    onChange={handleBillingInputChange}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500"
                    placeholder="john dee"
                    required
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label
                    htmlFor="phone_number"
                    className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Phone Number*
                  </label>
                  <input
                    type="text"
                    id="phone_number"
                    name="phoneNumber"
                    value={billingFormData.phoneNumber}
                    onChange={handleBillingInputChange}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500"
                    placeholder="+254 758 510 206"
                    required
                  />
                </div>

                {/* Street */}
                <div>
                  <label
                    htmlFor="street"
                    className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Street*
                  </label>
                  <input
                    type="text"
                    id="street"
                    name="street"
                    value={billingFormData.street}
                    onChange={handleBillingInputChange}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500"
                    placeholder="Kenyatta Avenue"
                    required
                  />
                </div>

                {/* City */}
                <div>
                  <label
                    htmlFor="city"
                    className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                  >
                    County*
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={billingFormData.city}
                    onChange={handleBillingInputChange}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500"
                    placeholder="Nairobi"
                    required
                  />
                </div>

                {/* Region */}
                <div>
                  <label
                    htmlFor="region"
                    className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                  >
                    State/Region
                  </label>
                  <input
                    type="text"
                    id="region"
                    name="region"
                    value={billingFormData.region}
                    onChange={handleBillingInputChange}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500"
                    placeholder="Central,riftValley"
                  />
                </div>

                {/* Postal Code */}
                <div>
                  <label
                    htmlFor="postal_code"
                    className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Postal Code*
                  </label>
                  <input
                    type="text"
                    id="postal_code"
                    name="postalCode"
                    value={billingFormData.postalCode}
                    onChange={handleBillingInputChange}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500"
                    placeholder="3454"
                    required
                  />
                </div>

                {/* Country */}
                <div>
                  <label
                    htmlFor="country"
                    className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Country*
                  </label>
                  <select
                    id="country"
                    name="country"
                    value={billingFormData.country}
                    onChange={handleBillingInputChange}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500"
                    required
                  >
                    <option value="kenya">Kenya</option>
                    
                  </select>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-4 dark:border-gray-700 md:pt-5">
                <button
                  type="submit"
                  className="me-2 inline-flex items-center rounded-lg bg-primary-700 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-primary-800 focus:outline-none focus:ring-4 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
                >
                  Save information
                </button>
                <button
                  type="button"
                  data-modal-toggle="billingInformationModal"
                  className="me-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-100 hover:text-primary-700 focus:z-10 focus:outline-none focus:ring-4 focus:ring-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white dark:focus:ring-gray-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderSummary;