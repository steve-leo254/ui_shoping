import React, { useState } from "react";
import axios, { AxiosError } from "axios";

// Define the error response type for API errors
interface ErrorResponse {
  detail:
    | string
    | { type: string; loc: string[]; msg: string; input: string }[];
}

// Define the form data type
interface FormData {
  phone_number: string;
  street: string;
  county: string;
  region: string;
  postal_code: string;
  country: string;
}

const AddAddress: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    phone_number: "",
    street: "",
    county: "",
    region: "",
    postal_code: "",
    country: "kenya",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState<boolean>(false);

  // Kenyan counties for the dropdown
  const kenyanCounties = [
    "nairobi",
    "mombasa",
    "kisumu",
    "nakuru",
    "kiambu",
    "uasin gishu",
    "machakos",
    "kajiado",
    "kilifi",
    "bungoma",
    "kakamega",
    "meru",
    "nyeri",
    "laikipia",
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validatePhoneNumber = (phone: string): string => {
    let cleaned = phone.replace(/[^0-9+]/g, "");
    if (!cleaned.startsWith("+254") && cleaned.length === 10) {
      cleaned = `+254${cleaned.slice(1)}`;
    }
    return cleaned;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setFormLoading(true);

    const token = localStorage.getItem("token");
    console.log("Token:", token);
    if (!token) {
      setFormError("No authentication token found. Please log in.");
      setFormLoading(false);
      console.error("No token found in localStorage");
      return;
    }

    // Validate required fields
    if (!formData.street.trim()) {
      setFormError("Street is required");
      setFormLoading(false);
      return;
    }
    if (!formData.county) {
      setFormError("County is required");
      setFormLoading(false);
      return;
    }
    if (!formData.postal_code.trim()) {
      setFormError("Postal code is required");
      setFormLoading(false);
      return;
    }

    const normalizedPhone = validatePhoneNumber(formData.phone_number);
    if (!/^\+254[0-9]{9}$/.test(normalizedPhone)) {
      setFormError("Phone number must be in the format +254XXXXXXXXX");
      setFormLoading(false);
      return;
    }

    const payload = {
      phone_number: normalizedPhone,
      street: formData.street.trim(),
      county: formData.county.toLowerCase(),
      region: formData.region.trim() || null, // Send null for empty region
      postal_code: formData.postal_code.trim(),
      country: formData.country.toLowerCase(),
    };
    console.log("Sending payload:", payload);

    try {
      const response = await axios.post(
        "http://localhost:8000/addresses/",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Response:", response.data);
      setFormSuccess("Address added successfully!");
      setFormData({
        phone_number: "",
        street: "",
        county: "",
        region: "",
        postal_code: "",
        country: "kenya",
      });
    } catch (err) {
      const axiosError = err as AxiosError<ErrorResponse>;
      let errorMessage = "Failed to add address";
      if (axiosError.response?.data?.detail) {
        const detail = axiosError.response.data.detail;
        errorMessage =
          typeof detail === "string"
            ? detail
            : detail.map((e) => `${e.loc.join(".")}: ${e.msg}`).join(", ");
      }
      setFormError(errorMessage);
      console.error("Error:", errorMessage, axiosError.response?.data);
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
        Add Delivery Details
      </h2>
      {formError && (
        <div className="text-red-600 dark:text-red-400">{formError}</div>
      )}
      {formSuccess && (
        <div className="text-green-600 dark:text-green-400">{formSuccess}</div>
      )}
      {formLoading && (
        <div className="text-gray-600 dark:text-gray-400">
          Adding address...
        </div>
      )}
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <div>
          <label
            htmlFor="phone_number"
            className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
          >
            Phone Number*
          </label>
          <div className="flex items-center">
            <button
              type="button"
              className="z-10 inline-flex shrink-0 items-center rounded-s-lg border border-gray-300 bg-gray-100 px-4 py-2.5 text-center text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus:ring-4 focus:ring-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-700"
            >
              <svg
                className="me-2 h-4 w-4"
                fill="none"
                viewBox="0 0 20 15"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect width="19.6" height="14" y="0.5" fill="#fff" rx="2" />
                <mask
                  id="a"
                  style={{ maskType: "luminance" }}
                  width="20"
                  height="15"
                  x="0"
                  y="0"
                  maskUnits="userSpaceOnUse"
                >
                  <rect width="19.6" height="14" y="0.5" fill="#fff" rx="2" />
                </mask>
                <g mask="url(#a)">
                  <path fill="#0E3C20" d="M0 0.5h19.6v4.667H0z" />
                  <path fill="#fff" d="M0 5.167h19.6v4.667H0z" />
                  <path fill="#D40000" d="M0 9.833h19.6V14.5H0z" />
                  <path fill="#000" d="M0 6.533h19.6v1.867H0z" />
                  <path fill="#D40000" d="M9.333 0.5h0.933v14h-0.933z" />
                  <path
                    fill="#fff"
                    d="M8.867 4.7a2.8 2.8 0 0 1 2.8 0v5.6a2.8 2.8 0 0 1-2.8 0z"
                  />
                  <path
                    fill="#D40000"
                    d="M9.333 7.467c0 0.258 0.21 0.467 0.467 0.467s0.467-0.21 0.467-0.467-0.21-0.467-0.467-0.467-0.467 0.209-0.467 0.467zm0.467-2.334c-0.258 0-0.467 0.21-0.467 0.467s0.209 0.467 0.467 0.467 0.467-0.21 0.467-0.467-0.21-0.467-0.467-0.467zm0 4.667c-0.258 0-0.467 0.209-0.467 0.466s0.209 0.467 0.467 0.467 0.467-0.21 0.467-0.467-0.21-0.467-0.467-0.467z"
                  />
                </g>
              </svg>
              +254
            </button>
            <input
              type="text"
              id="phone_number"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleInputChange}
              className="z-20 block w-full rounded-e-lg border border-s-0 border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:border-s-gray-700 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary-500"
              pattern="\+254[0-9]{9}"
              placeholder="+254712345678"
              required
            />
          </div>
        </div>

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
            value={formData.street}
            onChange={handleInputChange}
            className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500"
            placeholder="Kenyatta Avenue"
            required
          />
        </div>

        <div>
          <label
            htmlFor="county"
            className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
          >
            County*
          </label>
          <select
            id="county"
            name="county"
            value={formData.county}
            onChange={handleInputChange}
            className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500"
            required
          >
            <option value="" disabled>
              Select a county
            </option>
            {kenyanCounties.map((county) => (
              <option key={county} value={county}>
                {county.charAt(0).toUpperCase() + county.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="region"
            className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
          >
            Region
          </label>
          <input
            type="text"
            id="region"
            name="region"
            value={formData.region}
            onChange={handleInputChange}
            className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500"
            placeholder="e.g., Central, Rift Valley"
          />
        </div>

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
            name="postal_code"
            value={formData.postal_code}
            onChange={handleInputChange}
            className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500"
            placeholder="00100"
            required
          />
        </div>

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
            value={formData.country}
            onChange={handleInputChange}
            className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500"
            required
          >
            <option value="kenya">Kenya</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={formLoading}
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
      </form>
    </div>
  );
};

export default AddAddress;