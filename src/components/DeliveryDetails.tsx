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
  const [address, setAddress] = useState<Address | null>(null);
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
      // Get the default address (first address marked as is_default)
      const defaultAddress = response.data.find((addr: Address) => addr.is_default);
      setAddress(defaultAddress || null);
    } catch (err) {
      toast.error('Failed to fetch address', {
        style: { border: '1px solid #ef4444', color: '#111827' },
        progressStyle: { background: '#ef4444' },
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
        progressStyle: { background: '#10b981' },
      });
      setAddress(null); // Clear address after deletion
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

  const handleEdit = (addressId: number) => {
    // Placeholder: Trigger edit action (e.g., open modal or navigate to edit form)
    toast.info(`Edit address with ID: ${addressId}`, {
      style: { border: '1px solid #3b82f6', color: '#111827' },
      progressStyle: { background: '#3b82f6' },
    });
  };

  // Format address for display
  const formatAddress = (address: Address) => {
  let addr = address.address;
  if (address.additional_info) {
    addr += `, ${address.additional_info}`;
  }
  addr += `, ${address.city}, ${address.region}`;
  return `${addr} | Phone: ${address.phone_number}`;
};

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="text-sm">
        <p className="font-medium text-gray-900 dark:text-white">
          {address ? `${address.first_name} ${address.last_name}` : 'Delivery Address'}
        </p>
        <p className="mt-1 text-xs font-normal text-gray-500 dark:text-gray-400">
          {loading ? 'Loading...' : address ? formatAddress(address) : 'No address set'}
        </p>
      </div>
      {address && (
        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleDelete(address.id)}
            className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            Delete
          </button>
          <div className="h-3 w-px shrink-0 bg-gray-200 dark:bg-gray-700"></div>
          <button
            type="button"
            onClick={() => handleEdit(address.id)}
            className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            Edit
          </button>
        </div>
      )}
    </div>
  );
};

export default DeliveryDetails;