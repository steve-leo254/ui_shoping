import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useShoppingCart } from "../context/ShoppingCartContext"; 
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Props {
  onAddressAdded?: () => void; // Optional callback for parent component
}

const AddDeliveryDetails: React.FC<Props> = ({ onAddressAdded }) => {
  const { token } = useAuth();
  const { setSelectedAddress } = useShoppingCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    address: "",
    additional_info: "",
    city: "",
    region: "",
    is_default: false,
  });

  // Full list of 47 Kenyan counties
  const KENYAN_COUNTIES = [
    "Baringo",
    "Bomet",
    "Bungoma",
    "Busia",
    "Elgeyo-Marakwet",
    "Embu",
    "Garissa",
    "Homa Bay",
    "Isiolo",
    "Kajiado",
    "Kakamega",
    "Kericho",
    "Kiambu",
    "Kilifi",
    "Kirinyaga",
    "Kisii",
    "Kisumu",
    "Kitui",
    "Kwale",
    "Laikipia",
    "Lamu",
    "Machakos",
    "Makueni",
    "Mandera",
    "Marsabit",
    "Meru",
    "Migori",
    "Mombasa",
    "Murang'a",
    "Nairobi",
    "Nakuru",
    "Nandi",
    "Narok",
    "Nyamira",
    "Nyandarua",
    "Nyeri",
    "Samburu",
    "Siaya",
    "Taita-Taveta",
    "Tana River",
    "Tharaka-Nithi",
    "Trans Nzoia",
    "Turkana",
    "Uasin Gishu",
    "Vihiga",
    "Wajir",
    "West Pokot",
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const resetForm = () => {
    setFormData({
      first_name: "",
      last_name: "",
      phone_number: "",
      address: "",
      additional_info: "",
      city: "",
      region: "",
      is_default: false,
    });
  };

  const closeModal = () => {
    const closeButton = document.getElementById("close-modal-button");
    closeButton?.click();
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      toast.error("You must be logged in to add an address", {
        style: { border: "1px solid #ef4444", color: "#111827" },
        progressStyle: { background: "#ef4444" },
      });
      return;
    }

    // Prevent multiple submissions
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      // Submit the address to the backend
      const response = await axios.post("http://localhost:8000/addresses", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // If the address was set as default, update the shopping cart context
      if (formData.is_default && response.data) {
        const newAddress = {
          id: response.data.id,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone_number: formData.phone_number,
          address: formData.address,
          city: formData.city,
          region: formData.region,
          is_default: formData.is_default,
        };
        
        // Update the shopping cart context with the new default address
        setSelectedAddress(newAddress);
      }

      // Show success message
      toast.success("Address added successfully", {
        style: { border: "1px solid #10b981", color: "#111827" },
        progressStyle: { background: "#10b981" },
      });

      // Reset form
      resetForm();
      
      // Close modal
      closeModal();
      
      // Call parent callback if provided (better than page reload)
      if (onAddressAdded) {
        onAddressAdded();
      } else {
        // Fallback to page reload if no callback provided
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
      
    } catch (err: any) {
      console.error("Error adding address:", err);
      
      // Show specific error message if available
      const errorMessage = err.response?.data?.detail || "Failed to add address";
      toast.error(errorMessage, {
        style: { border: "1px solid #ef4444", color: "#111827" },
        progressStyle: { background: "#ef4444" },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    closeModal();
  };

  return (
    <>
      <div
        id="addBillingInformationModal"
        tabIndex={-1}
        aria-hidden="true"
        className="antialiased fixed left-0 right-0 top-0 z-50 hidden h-[calc(100%-1rem)] max-h-auto w-full max-h-full items-center justify-center overflow-y-auto overflow-x-hidden antialiased md:inset-0"
      >
        <div className="relative max-h-auto w-full max-h-full max-w-lg p-4">
          {/* Modal content */}
          <div className="relative rounded-lg bg-white shadow dark:bg-gray-800">
            {/* Modal header */}
            <div className="flex items-center justify-between rounded-t border-b border-gray-200 p-4 dark:border-gray-700 md:p-5">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Add Address
              </h3>
              <button
                type="button"
                className="ms-auto inline-flex h-8 w-8 items-center justify-center rounded-lg bg-transparent text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-600 dark:hover:text-white"
                data-modal-toggle="addBillingInformationModal"
                onClick={handleCancel}
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
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                  />
                </svg>
                <span className="sr-only">Close modal</span>
              </button>
            </div>
            {/* Modal body */}
            <form onSubmit={handleSubmit} className="p-4 md:p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-5">
                <div>
                  <label
                    htmlFor="first_name"
                    className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                  >
                    First Name*
                  </label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500"
                    placeholder="Enter your first name"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label
                    htmlFor="last_name"
                    className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Last Name*
                  </label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500"
                    placeholder="Enter your last name"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label
                    htmlFor="phone_number"
                    className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Phone Number*
                  </label>
                  <input
                    type="tel"
                    id="phone_number"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    pattern="^(?:\+254|0)[17]\d{8}$"
                    title="Expected format: +254712345678 or 0712345678"
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500"
                    placeholder="e.g., +254712345678 or 0712345678"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label
                    htmlFor="address"
                    className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Address*
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500"
                    placeholder="Enter your address"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label
                    htmlFor="additional_info"
                    className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Additional Info
                  </label>
                  <input
                    type="text"
                    id="additional_info"
                    name="additional_info"
                    value={formData.additional_info}
                    onChange={handleInputChange}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500"
                    placeholder="e.g., Near a landmark"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label
                    htmlFor="city"
                    className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                  >
                    City/Locality*
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500"
                    placeholder="Enter your city or locality"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label
                    htmlFor="region"
                    className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Region (County)*
                  </label>
                  <select
                    id="region"
                    name="region"
                    value={formData.region}
                    onChange={handleInputChange}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500"
                    required
                    disabled={isSubmitting}
                  >
                    <option value="">Select County</option>
                    {KENYAN_COUNTIES.map((county) => (
                      <option key={county} value={county}>
                        {county}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label
                    htmlFor="country"
                    className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Country
                  </label>
                  <input
                    type="text"
                    id="country"
                    value="Kenya"
                    disabled
                    className="block w-full rounded-lg border border-gray-300 bg-gray-200 p-2.5 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    readOnly
                  />
                </div>
                <div className="flex items-center gap-4 sm:col-span-2">
                  <div className="flex items-center">
                    <input
                      id="is_default"
                      type="checkbox"
                      name="is_default"
                      checked={formData.is_default}
                      onChange={handleInputChange}
                      className="h-4 w-4 rounded border-gray-300 bg-gray-100 text-primary-600 focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-primary-600"
                      disabled={isSubmitting}
                    />
                    <label
                      htmlFor="is_default"
                      className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                    >
                      Set as default
                    </label>
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-4 dark:border-gray-700 md:pt-5">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 me-2 inline-flex items-center rounded-lg bg-primary-700 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-primary-800 focus:outline-none focus:ring-4 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
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
                      Saving...
                    </>
                  ) : (
                    "Save information"
                  )}
                </button>
                <button
                  type="button"
                  id="close-modal-button"
                  data-modal-toggle="addBillingInformationModal"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="me-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-100 hover:text-primary-700 focus:z-10 focus:outline-none focus:ring-4 focus:ring-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white dark:focus:ring-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
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

export default AddDeliveryDetails;