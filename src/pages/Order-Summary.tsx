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

// Define address type based on Checkout.tsx API
type Address = {
  id?: number;
  full_name: string;
  phone_number: string;
  street: string;
  city: string;
  region?: string;
  postal_code: string;
  country: string;
  is_company?: boolean;
  company_name?: string;
  vat_number?: string;
};

const OrderSummary: React.FC = () => {
  const navigate = useNavigate();
  const { cartItems } = useShoppingCart();
  const [products, setProducts] = useState<CartProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState<Address | null>(null); // State for delivery address
  const [billingAddress, setBillingAddress] = useState<Address | null>(null); // State for billing address

  // State for billing form data (used in billing modal)
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
    country: "Kenya",
  });

  // State for delivery form data (used in delivery modal)
  const [deliveryFormData, setDeliveryFormData] = useState({
    fullName: "",
    phoneNumber: "",
    street: "",
    city: "",
    region: "",
    postalCode: "",
    country: "Kenya",
  });

  // Fetch products
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

  // Fetch addresses
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const response = await axios.get("http://localhost:8000/addresses/", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data && response.data.length > 0) {
          // Assume first address is delivery, second (if exists) is billing
          setDeliveryAddress(response.data[0]);
          setBillingAddress(response.data[1] || response.data[0]); // Fallback to delivery if no separate billing
          // Initialize form data with fetched addresses
          setDeliveryFormData({
            fullName: response.data[0].full_name || "",
            phoneNumber: response.data[0].phone_number || "",
            street: response.data[0].street || "",
            city: response.data[0].city || "",
            region: response.data[0].region || "",
            postalCode: response.data[0].postal_code || "",
            country: response.data[0].country || "Kenya",
          });
          setBillingFormData({
            isCompany: response.data[1]?.is_company || false,
            companyName: response.data[1]?.company_name || "",
            vatNumber: response.data[1]?.vat_number || "",
            fullName:
              response.data[1]?.full_name || response.data[0].full_name || "",
            phoneNumber:
              response.data[1]?.phone_number ||
              response.data[0].phone_number ||
              "",
            street: response.data[1]?.street || response.data[0].street || "",
            city: response.data[1]?.city || response.data[0].city || "",
            region: response.data[1]?.region || response.data[0].region || "",
            postalCode:
              response.data[1]?.postal_code ||
              response.data[0].postal_code ||
              "",
            country:
              response.data[1]?.country || response.data[0].country || "Kenya",
          });
        } else {
          setError("No addresses found.");
        }
      } catch (err) {
        setError(
          axios.isAxiosError(err)
            ? `Failed to fetch addresses: ${err.response?.status} ${err.response?.statusText}`
            : "Failed to fetch addresses"
        );
      }
    };

    fetchAddresses();
  }, [navigate]);

  // Form handlers for billing
  const handleBillingInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setBillingFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleIsCompanyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBillingFormData((prev) => ({ ...prev, isCompany: e.target.checked }));
  };

  const handleBillingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      // Update or create billing address
      const addressData = {
        full_name: billingFormData.fullName,
        phone_number: billingFormData.phoneNumber,
        street: billingFormData.street,
        city: billingFormData.city,
        region: billingFormData.region,
        postal_code: billingFormData.postalCode,
        country: billingFormData.country,
        is_company: billingFormData.isCompany,
        company_name: billingFormData.isCompany
          ? billingFormData.companyName
          : undefined,
        vat_number: billingFormData.isCompany
          ? billingFormData.vatNumber
          : undefined,
      };

      const response = await axios[billingAddress?.id ? "put" : "post"](
        billingAddress?.id
          ? `http://localhost:8000/addresses/${billingAddress.id}`
          : "http://localhost:8000/addresses/",
        addressData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setBillingAddress({
        ...addressData,
        id: response.data.id || billingAddress?.id,
      });
      // Close modal
      const modal = document.getElementById("billingInformationModal");
      if (modal) modal.classList.add("hidden");
    } catch (err) {
      setError("Failed to save billing information");
    }
  };

  // Form handlers for delivery
  const handleDeliveryInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setDeliveryFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDeliverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      // Update or create delivery address
      const addressData = {
        full_name: deliveryFormData.fullName,
        phone_number: deliveryFormData.phoneNumber,
        street: deliveryFormData.street,
        city: deliveryFormData.city,
        region: deliveryFormData.region,
        postal_code: deliveryFormData.postalCode,
        country: deliveryFormData.country,
      };

      const response = await axios[deliveryAddress?.id ? "put" : "post"](
        deliveryAddress?.id
          ? `http://localhost:8000/addresses/${deliveryAddress.id}`
          : "http://localhost:8000/addresses/",
        addressData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setDeliveryAddress({
        ...addressData,
        id: response.data.id || deliveryAddress?.id,
      });
      // Close modal
      const modal = document.getElementById("deliveryInformationModal");
      if (modal) modal.classList.add("hidden");
    } catch (err) {
      setError("Failed to save delivery information");
    }
  };

  // Calculate totals
  const subtotal = products.reduce(
    (total, product) => total + product.quantity * product.price,
    0
  );
  const storePickupFee = 850;
  const total = subtotal + storePickupFee;

  // Handle loading, error, and empty cart
  if (loading) {
    return (
      <div className="text-center">
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
    );
  }

  if (error) {
    return <div className="text-center text-red-600">{error}</div>;
  }

  if (products.length === 0) {
    return (
      <div className="text-center">
        Your order is empty.{" "}
        <a
          href="/shop"
          className="inline-block text-blue-700 hover:underline"
          aria-label="Return to shop"
        >
          Return to Shop
        </a>
      </div>
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

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Delivery Information */}
                <div>
                  <dt className="text-base font-medium text-gray-900 dark:text-white">
                    Delivery Field
                  </dt>
                  
                  {/* <button
                    type="button"
                    data-modal-target="deliveryInformationModal"
                    data-modal-toggle="deliveryInformationModal"
                    className="mt-2 text-base font-medium text-blue-700 hover:underline dark:text-blue-500"
                  >
                    Edit Delivery Information
                  </button> */}
                </div>

                {/* Billing Information */}
                <div>
                  <dt className="text-base font-medium text-gray-900 dark:text-white">
                    {billingAddress?.is_company
                      ? "Company Billing"
                      : "My Address Billing"}
                  </dt>
                  <dd className="mt-1 text-base font-normal text-gray-500 dark:text-gray-400">
                    {billingAddress ? (
                      <>
                        {billingAddress.is_company &&
                          billingAddress.company_name && (
                            <>
                              {billingAddress.company_name}
                              <br />
                              {billingAddress.vat_number &&
                                `VAT: ${billingAddress.vat_number}`}
                              <br />
                            </>
                          )}
                        {billingAddress.full_name}
                        <br />
                        {billingAddress.phone_number}
                        <br />
                        {billingAddress.street}
                        <br />
                        {billingAddress.city}
                        {billingAddress.region && `, ${billingAddress.region}`}
                        <br />
                        {billingAddress.postal_code}, {billingAddress.country}
                      </>
                    ) : (
                      "No billing information provided."
                    )}
                  </dd>
                  <button
                    type="button"
                    data-modal-target="billingInformationModal"
                    data-modal-toggle="billingInformationModal"
                    className="mt-2 text-base font-medium text-blue-700 hover:underline dark:text-blue-500"
                  >
                    Edit Billing Information
                  </button>
                </div>
              </div>
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
                  Order Summary
                </h4>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <dl className="flex items-center justify-between gap-4">
                      <dt className="text-gray-500 dark:text-gray-400">
                        Subtotal
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
                    className="h-4 w-4 rounded border-gray-300 bg-gray-100 text-blue-700 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-blue-600"
                  />
                  <label
                    htmlFor="terms-checkbox-2"
                    className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                  >
                    I agree with the{" "}
                    <a
                      href="#"
                      title=""
                      className="text-blue-700 underline hover:no-underline dark:text-blue-500"
                    >
                      Terms and Conditions
                    </a>{" "}
                    of use of the Flowbite marketplace
                  </label>
                </div>

                <div className="gap-4 sm:flex sm:items-center">
                  <button
                    type="button"
                    className="w-full rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:outline-none focus:ring-4 focus:ring-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white dark:focus:ring-gray-700"
                  >
                    Return to Shopping
                  </button>

                  <button
                    onClick={() => navigate("/order-confirmation")}
                    type="submit"
                    className="mt-4 flex w-full items-center justify-center rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 sm:mt-0"
                  >
                    Send the Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </section>

      {/* Billing Information Modal */}
      <div
        id="billingInformationModal"
        tabIndex={-1}
        aria-hidden="true"
        className="antialiased fixed left-0 right-0 top-0 z-50 hidden h-[calc(100%-1rem)] max-h-auto w-full max-h-full items-center justify-center overflow-y-auto overflow-x-hidden md:inset-0"
      >
        <div className="relative max-h-auto w-full max-w-lg p-4">
          <div className="relative rounded-lg bg-white shadow dark:bg-gray-800">
            <div className="flex items-center justify-between rounded-t border-b border-gray-200 p-4 dark:border-gray-700 md:p-5">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Edit Billing Information
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
                      className="h-4 w-4 rounded border-gray-300 bg-gray-100 text-blue-700 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-blue-600"
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
                        className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
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
                        className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
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
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                    placeholder="John Dee"
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
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
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
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
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
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
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
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                    placeholder="Central, Rift Valley"
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
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
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
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                    required
                  >
                    <option value="Kenya">Kenya</option>
                    {/* Add more countries as needed */}
                  </select>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-4 dark:border-gray-700 md:pt-5">
                <button
                  type="submit"
                  className="me-2 inline-flex items-center rounded-lg bg-blue-700 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                >
                  Save Information
                </button>
                <button
                  type="button"
                  data-modal-toggle="billingInformationModal"
                  className="me-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:outline-none focus:ring-4 focus:ring-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white dark:focus:ring-gray-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Delivery Information Modal */}
      <div
        id="deliveryInformationModal"
        tabIndex={-1}
        aria-hidden="true"
        className="antialiased fixed left-0 right-0 top-0 z-50 hidden h-[calc(100%-1rem)] max-h-auto w-full max-h-full items-center justify-center overflow-y-auto overflow-x-hidden md:inset-0"
      >
        <div className="relative max-h-auto w-full max-w-lg p-4">
          <div className="relative rounded-lg bg-white shadow dark:bg-gray-800">
            <div className="flex items-center justify-between rounded-t border-b border-gray-200 p-4 dark:border-gray-700 md:p-5">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Edit Delivery Information
              </h3>
              <button
                type="button"
                className="ms-auto inline-flex h-8 w-8 items-center justify-center rounded-lg bg-transparent text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-600 dark:hover:text-white"
                data-modal-toggle="deliveryInformationModal"
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
            <form onSubmit={handleDeliverySubmit} className="p-4 md:p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-5">
                {/* Full Name */}
                <div>
                  <label
                    htmlFor="delivery_full_name"
                    className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Full Name*
                  </label>
                  <input
                    type="text"
                    id="delivery_full_name"
                    name="fullName"
                    value={deliveryFormData.fullName}
                    onChange={handleDeliveryInputChange}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                    placeholder="John Dee"
                    required
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label
                    htmlFor="delivery_phone_number"
                    className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Phone Number*
                  </label>
                  <input
                    type="text"
                    id="delivery_phone_number"
                    name="phoneNumber"
                    value={deliveryFormData.phoneNumber}
                    onChange={handleDeliveryInputChange}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                    placeholder="+254 758 510 206"
                    required
                  />
                </div>

                {/* Street */}
                <div>
                  <label
                    htmlFor="delivery_street"
                    className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Street*
                  </label>
                  <input
                    type="text"
                    id="delivery_street"
                    name="street"
                    value={deliveryFormData.street}
                    onChange={handleDeliveryInputChange}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                    placeholder="Kenyatta Avenue"
                    required
                  />
                </div>

                {/* City */}
                <div>
                  <label
                    htmlFor="delivery_city"
                    className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                  >
                    County*
                  </label>
                  <input
                    type="text"
                    id="delivery_city"
                    name="city"
                    value={deliveryFormData.city}
                    onChange={handleDeliveryInputChange}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                    placeholder="Nairobi"
                    required
                  />
                </div>

                {/* Region */}
                <div>
                  <label
                    htmlFor="delivery_region"
                    className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                  >
                    State/Region
                  </label>
                  <input
                    type="text"
                    id="delivery_region"
                    name="region"
                    value={deliveryFormData.region}
                    onChange={handleDeliveryInputChange}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                    placeholder="Central, Rift Valley"
                  />
                </div>

                {/* Postal Code */}
                <div>
                  <label
                    htmlFor="delivery_postal_code"
                    className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Postal Code*
                  </label>
                  <input
                    type="text"
                    id="delivery_postal_code"
                    name="postalCode"
                    value={deliveryFormData.postalCode}
                    onChange={handleDeliveryInputChange}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                    placeholder="3454"
                    required
                  />
                </div>

                {/* Country */}
                <div>
                  <label
                    htmlFor="delivery_country"
                    className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Country*
                  </label>
                  <select
                    id="delivery_country"
                    name="country"
                    value={deliveryFormData.country}
                    onChange={handleDeliveryInputChange}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                    required
                  >
                    <option value="Kenya">Kenya</option>
                    {/* Add more countries as needed */}
                  </select>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-4 dark:border-gray-700 md:pt-5">
                <button
                  type="submit"
                  className="me-2 inline-flex items-center rounded-lg bg-blue-700 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                >
                  Save Information
                </button>
                <button
                  type="button"
                  data-modal-toggle="deliveryInformationModal"
                  className="me-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:outline-none focus:ring-4 focus:ring-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white dark:focus:ring-gray-700"
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
