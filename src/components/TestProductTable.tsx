import React from 'react';
import { useFetchAddresses } from './useFetchAddresses';

const AddressList: React.FC = () => {
  const { addresses, loading, error } = useFetchAddresses();

  if (loading) {
    return <div>Loading addresses...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!addresses || addresses.length === 0) {
    return <div>No addresses found.</div>;
  }

  return (
    <ul>
      {addresses.map((address) => (
        <li key={address.id}>
          {address.street}, {address.city}, {address.state}, {address.postal_code}, {address.country}, {address.phone_number}
        </li>
      ))}
    </ul>
  );
};

export default AddressList;