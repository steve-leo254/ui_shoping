import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Category {
  id: string;
  code: string;
  name: string;
  description: string;
}

interface ProductFormData {
  name: string;
  brand: string;
  cost: string;
  price: string;
  stock_quantity: string;
  barcode: string;
  category_id: string;
  description: string;
  image: File | null;
}

interface ApiResponse {
  message: string;
  product: {
    id: string;
    name: string;
    brand: string;
    cost: number;
    price: number;
    stock_quantity: number;
    barcode: string;
    category_id: string;
    description: string;
    img_url: string;
  };
}

const AddProducts: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    brand: "",
    cost: "",
    price: "",
    stock_quantity: "",
    barcode: "",
    category_id: "",
    description: "",
    image: null,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("Please log in to continue");
          return;
        }
        const response = await axios.get<Category[]>(
          "http://127.0.0.1:5000/categories",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "X-Requested-With": "XMLHttpRequest",
            },
          }
        );
        setCategories(response.data);
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error("Failed to load categories");
      }
    };
    fetchCategories();
  }, []);

  // Clean up image preview
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  // Handle body scroll lock
  useEffect(() => {
    document.body.style.overflow = isModalOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen]);

  const resetForm = () => {
    setFormData({
      name: "",
      brand: "",
      cost: "",
      price: "",
      stock_quantity: "",
      barcode: "",
      category_id: "",
      description: "",
      image: null,
    });
    setImagePreview(null);
    setError("");
    setSuccess("");
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError("Product name is required");
      toast.error("Product name is required");
      return false;
    }
    if (!formData.brand.trim()) {
      setError("Brand is required");
      toast.error("Brand is required");
      return false;
    }
    if (!formData.cost || Number(formData.cost) <= 0) {
      setError("Cost must be a positive number");
      toast.error("Cost must be a positive number");
      return false;
    }
    if (!formData.price || Number(formData.price) <= 0) {
      setError("Price must be a positive number");
      toast.error("Price must be a positive number");
      return false;
    }
    if (!formData.stock_quantity || Number(formData.stock_quantity) < 0) {
      setError("Stock quantity cannot be negative");
      toast.error("Stock quantity cannot be negative");
      return false;
    }
    if (!formData.barcode.trim()) {
      setError("Barcode is required");
      toast.error("Barcode is required");
      return false;
    }
    if (!formData.category_id) {
      setError("Category is required");
      toast.error("Category is required");
      return false;
    }
    if (!formData.image) {
      setError("Product image is required");
      toast.error("Product image is required");
      return false;
    }
    return true;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please upload a valid image file (e.g., JPG, PNG)");
        toast.error("Please upload a valid image file");
        setFormData((prev) => ({ ...prev, image: null }));
        setImagePreview(null);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB");
        toast.error("Image size must be less than 5MB");
        setFormData((prev) => ({ ...prev, image: null }));
        setImagePreview(null);
        return;
      }
      setFormData((prev) => ({ ...prev, image: file }));
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setError("");
    } else {
      setFormData((prev) => ({ ...prev, image: null }));
      setImagePreview(null);
    }
  };

  const handleProductSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) return;

    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("brand", formData.brand);
    formDataToSend.append("cost", formData.cost);
    formDataToSend.append("price", formData.price);
    formDataToSend.append("stock_quantity", formData.stock_quantity);
    formDataToSend.append("barcode", formData.barcode);
    formDataToSend.append("category_id", formData.category_id);
    formDataToSend.append("description", formData.description);
    if (formData.image) {
      formDataToSend.append("image", formData.image);
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please log in to continue");
        toast.error("Please log in to continue");
        return;
      }

      const response = await axios.post<ApiResponse>(
        "http://127.0.0.1:5000/products",
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Requested-With": "XMLHttpRequest",
          },
        }
      );

      setSuccess(
        `Product "${response.data.product.name}" added successfully with image URL: ${response.data.product.img_url || "N/A"}`
      );
      toast.success(response.data.message);
      resetForm();
      setTimeout(() => setIsModalOpen(false), 2000);
    } catch (error) {
      console.error("Error adding product:", error);
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to add product"
        : "Failed to add product";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <style>
        {`
          .custom-scrollbar::-webkit-scrollbar {
            width: 12px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #4b5563;
            border-radius: 10px;
            border: 2px solid #f1f1f1;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #374151;
          }
          .custom-scrollbar {
            scrollbar-width: auto;
            scrollbar-color: #4b5563 #f1f1f1;
          }
        `}
      </style>

      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="text-white bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
      >
        Add New Product
      </button>

      <div
        id="createProductModal"
        tabIndex={-1}
        aria-hidden={!isModalOpen}
        className={`fixed inset-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-50 ${
          isModalOpen ? "block" : "hidden"
        }`}
      >
        <div className="relative p-4 w-full max-w-2xl h-full md:h-auto">
          <div className="relative bg-white rounded-lg shadow dark:bg-gray-800 max-h-[calc(100vh-2rem)] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center p-4 border-b dark:border-gray-600 sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Add Product
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white"
              >
                <svg
                  aria-hidden="true"
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="sr-only">Close modal</span>
              </button>
            </div>
            <div className="p-4 sm:p-5">
              <form onSubmit={handleProductSubmit}>
                {error && (
                  <div className="mb-4 text-red-600 dark:text-red-400">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="mb-4 text-green-600 dark:text-green-400">
                    {success}
                  </div>
                )}
                <div className="grid gap-4 mb-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="name"
                      className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Name
                    </label>
                    <input
                      value={formData.name}
                      onChange={handleChange}
                      type="text"
                      name="name"
                      id="name"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                      placeholder="Type product name"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="brand"
                      className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Brand
                    </label>
                    <input
                      value={formData.brand}
                      onChange={handleChange}
                      type="text"
                      name="brand"
                      id="brand"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                      placeholder="Product brand"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="price"
                      className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Price
                    </label>
                    <input
                      value={formData.price}
                      onChange={handleChange}
                      type="number"
                      name="price"
                      id="price"
                      min="0"
                      step="0.01"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                      placeholder="$2999"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="cost"
                      className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Cost
                    </label>
                    <input
                      value={formData.cost}
                      onChange={handleChange}
                      type="number"
                      name="cost"
                      id="cost"
                      min="0"
                      step="0.01"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                      placeholder="$2999"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="stock_quantity"
                      className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Stock
                    </label>
                    <input
                      value={formData.stock_quantity}
                      onChange={handleChange}
                      type="number"
                      name="stock_quantity"
                      id="stock_quantity"
                      min="0"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                      placeholder="200"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="barcode"
                      className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Barcode
                    </label>
                    <input
                      value={formData.barcode}
                      onChange={handleChange}
                      type="text"
                      name="barcode"
                      id="barcode"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                      placeholder="Enter barcode"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="category_id"
                      className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Category
                    </label>
                    <select
                      id="category_id"
                      name="category_id"
                      value={formData.category_id}
                      onChange={handleChange}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                      required
                    >
                      <option value="">Select category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="image"
                      className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Product Image
                    </label>
                    <input
                      type="file"
                      name="image"
                      id="image"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                      required
                    />
                    {imagePreview && (
                      <div className="mt-4">
                        <img
                          src={imagePreview}
                          alt="Product preview"
                          className="h-32 w-32 object-cover rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="description"
                      className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={4}
                      className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                      placeholder="Write product description here"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="text-white inline-flex items-center bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
                >
                  <svg
                    className="mr-1 -ml-1 w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Add new product
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddProducts;