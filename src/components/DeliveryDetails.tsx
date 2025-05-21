// src/components/DeliveryDetails.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface Address {
  id: number;
  phone_number: string;
  street: string;
  city: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  user_id: number;
  created_at: string;
}

const DeliveryDetails: React.FC = () => {
  const { token, isAuthenticated } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchAddresses();
    }
  }, [isAuthenticated, token]);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8000/addresses', {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Sort addresses to put default first, then take top 2
      const sortedAddresses = response.data.sort((a: Address, b: Address) =>
        a.is_default === b.is_default ? 0 : a.is_default ? -1 : 1
      ).slice(0, 2);
      setAddresses(sortedAddresses);
    } catch (err) {
      toast.error('Failed to fetch addresses', {
        style: { border: '1px solid #ef4444', color: '#111827' },
        progressStyle: { background: '#ef4444' }, // Matches text-red-600
      });
      console.error('Error fetching addresses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (addressId: number) => {
    if (!isAuthenticated || !token) {
      toast.error('You must be logged in to delete an address', {
        style: { border: '1px solid #ef4444', color: '#111827' },
        progressStyle: { background: '#ef4444' },
      });
      return;
    }

    try {
      setLoading(true);
      await axios.delete(`http://localhost:8000/addresses/${addressId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Address deleted successfully', {
        style: { border: '1px solid #10b981', color: '#111827' },
        progressStyle: { background: '#10b981' }, // Matches text-green-600
      });
      await fetchAddresses(); // Refresh address list
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to delete address', {
        style: { border: '1px solid #ef4444', color: '#111827' },
        progressStyle: { background: '#ef4444' },
      });
      console.error('Error deleting address:', err);
    } finally {
      setLoading(false);
    }
  };

  // Format address for display
  const formatAddress = (address: Address) => {
    return `${address.street}, ${address.city}, ${address.postal_code}, ${address.country} | Phone: ${address.phone_number}`;
  };

  return (
    <>
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 ps-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-start">
          <div className="flex h-5 items-center">
            <input
              id="pay-on-delivery"
              aria-describedby="pay-on-delivery-text"
              type="radio"
              name="payment-method"
              value=""
              className="h-4 w-4 border-gray-300 bg-white text-primary-600 focus:ring-2 focus:ring-primary-600 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-primary-600"
              checked={addresses[0]?.is_default}
            />
          </div>

          <div className="ms-4 text-sm">
            <label
              htmlFor="pay-on-delivery"
              className="font-medium leading-none text-green-600 dark:text-green-400"
            >
              Default Address
            </label>
            <p
              id="pay-on-delivery-text"
              className="mt-1 text-xs font-normal text-gray-500 dark:text-gray-400"
            >
              {loading ? 'Loading...' : addresses[0] ? formatAddress(addresses[0]) : 'No default address set'}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => addresses[0] && handleDelete(addresses[0].id)}
            className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || !addresses[0]}
          >
            Delete
          </button>
          <div className="h-3 w-px shrink-0 bg-gray-200 dark:bg-gray-700"></div>
          <button
            type="button"
            className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            Edit
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 ps-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-start">
          <div className="flex h-5 items-center">
            <input
              id="credit-card"
              aria-describedby="credit-card-text"
              type="radio"
              name="payment-method"
              value=""
              className="h-4 w-4 border-gray-300 bg-white text-primary-600 focus:ring-2 focus:ring-primary-600 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-primary-600"
              checked={!addresses[0]?.is_default && addresses[1]}
            />
          </div>

          <div className="ms-4 text-sm">
            <label
              htmlFor="credit-card"
              className="font-medium leading-none text-green-600 dark:text-green-400"
            >
              Address 2
            </label>
            <p
              id="credit-card-text"
              className="mt-1 text-xs font-normal text-gray-500 dark:text-gray-400"
            >
              {loading ? 'Loading...' : addresses[1] ? formatAddress(addresses[1]) : 'No second address available'}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => addresses[1] && handleDelete(addresses[1].id)}
            className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || !addresses[1]}
          >
            Delete
          </button>
          <div className="h-3 w-px shrink-0 bg-gray-200 dark:bg-gray-700"></div>
          <button
            type="button"
            className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            Edit
          </button>
        </div>
      </div>
    </>
  );
};

export default DeliveryDetails;