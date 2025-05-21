// src/components/AddressManager.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

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

const AddressManager: React.FC = () => {
  const { token, isAuthenticated } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [newAddress, setNewAddress] = useState({
    phone_number: '',
    street: '',
    city: '',
    postal_code: '',
    country: '',
    is_default: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch addresses on component mount
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
      setAddresses(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch addresses');
      console.error('Error fetching addresses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setNewAddress((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !token) {
      setError('You must be logged in to add an address');
      return;
    }

    try {
      setLoading(true);
      await axios.post('http://localhost:8000/addresses', newAddress, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess('Address added successfully');
      setError(null);
      setNewAddress({
        phone_number: '',
        street: '',
        city: '',
        postal_code: '',
        country: '',
        is_default: false,
      });
      await fetchAddresses(); // Refresh address list
    } catch (err) {
      setError('Failed to add address');
      console.error('Error adding address:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Manage Addresses</h2>

      {/* Add Address Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">Add New Address</h3>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {success && <p className="text-green-500 mb-4">{success}</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone Number</label>
            <input
              type="text"
              name="phone_number"
              value={newAddress.phone_number}
              onChange={handleInputChange}
              className="mt-1 p-2 w-full border rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Street</label>
            <input
              type="text"
              name="street"
              value={newAddress.street}
              onChange={handleInputChange}
              className="mt-1 p-2 w-full border rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">City</label>
            <input
              type="text"
              name="city"
              value={newAddress.city}
              onChange={handleInputChange}
              className="mt-1 p-2 w-full border rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Postal Code</label>
            <input
              type="text"
              name="postal_code"
              value={newAddress.postal_code}
              onChange={handleInputChange}
              className="mt-1 p-2 w-full border rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Country</label>
            <input
              type="text"
              name="country"
              value={newAddress.country}
              onChange={handleInputChange}
              className="mt-1 p-2 w-full border rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_default"
              checked={newAddress.is_default}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm font-medium text-gray-700">Set as Default</label>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className={`mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? 'Adding...' : 'Add Address'}
        </button>
      </form>

      {/* Address List */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-700">Your Addresses</h3>
        {loading && <p className="text-gray-500">Loading addresses...</p>}
        {addresses.length === 0 && !loading && <p className="text-gray-500">No addresses found.</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <div key={address.id} className="bg-white p-4 rounded-lg shadow-md">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Phone:</span> {address.phone_number}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Street:</span> {address.street}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">City:</span> {address.city}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Postal Code:</span> {address.postal_code}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Country:</span> {address.country}
              </p>
              {address.is_default && (
                <p className="text-sm text-green-600 font-medium mt-2">Default Address</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AddressManager;