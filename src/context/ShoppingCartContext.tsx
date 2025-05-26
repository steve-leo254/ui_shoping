// ShoppingCartContext.tsx
import { createContext, useContext } from "react";
import { useLocalStorage } from "../cart/useLocalStorage"; // Adjust path as needed
import type { ReactNode } from "react";

type ShoppingCartProviderProps = {
  children: ReactNode;
};

type CartItem = {
  id: number;
  name: string;
  price: number;
  img_url: string | null;
  quantity: number;
};

type Address = {
  id: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  address: string;
  city: string;
  region: string;
  is_default: boolean;
};

type DeliveryMethod = "pickup" | "delivery" | null;
type PaymentMethod = "pay-now" | "pay-later" | null;

type ShoppingCartContext = {
  addToCart: (product: {
    id: number;
    name: string;
    price: number;
    img_url: string | null;
  }) => void;
  increaseCartQuantity: (id: number) => void;
  decreaseCartQuantity: (id: number) => void;
  removeFromCart: (id: number) => void;
  clearCart: () => void;
  getItemQuantity: (id: number) => number;
  cartQuantity: number;
  cartItems: CartItem[];
  deliveryMethod: DeliveryMethod;
  setDeliveryMethod: (method: DeliveryMethod) => void;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  mpesaPhone: string | null;
  setMpesaPhone: (phone: string | null) => void;
  selectedAddress: Address | null;
  setSelectedAddress: (address: Address | null) => void;
};

const ShoppingCartContext = createContext({} as ShoppingCartContext);

export function useShoppingCart() {
  return useContext(ShoppingCartContext);
}

export function ShoppingCartProvider({ children }: ShoppingCartProviderProps) {
  const [cartItems, setCartItems] = useLocalStorage<CartItem[]>("shopping-cart", []);
  const [deliveryMethod, setDeliveryMethod] = useLocalStorage<DeliveryMethod>("delivery-method", null);
  const [paymentMethod, setPaymentMethod] = useLocalStorage<PaymentMethod>("payment-method", null);
  const [mpesaPhone, setMpesaPhone] = useLocalStorage<string | null>("mpesa-phone", null);
  const [selectedAddress, setSelectedAddress] = useLocalStorage<Address | null>("selected-address", null);

  const cartQuantity = cartItems.reduce((quantity, item) => item.quantity + quantity, 0);

  function getItemQuantity(id: number) {
    return cartItems.find((item) => item.id === id)?.quantity || 0;
  }

  function addToCart(product: { id: number; name: string; price: number; img_url: string | null }) {
    setCartItems((currItems) => {
      if (currItems.find((item) => item.id === product.id) == null) {
        return [...currItems, { ...product, quantity: 1 }];
      } else {
        return currItems.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
    });
  }

  function increaseCartQuantity(id: number) {
    setCartItems((currItems) =>
      currItems.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  }

  function decreaseCartQuantity(id: number) {
    setCartItems((currItems) => {
      if (currItems.find((item) => item.id === id)?.quantity === 1) {
        return currItems.filter((item) => item.id !== id);
      } else {
        return currItems.map((item) =>
          item.id === id ? { ...item, quantity: item.quantity - 1 } : item
        );
      }
    });
  }

  function removeFromCart(id: number) {
    setCartItems((currItems) => currItems.filter((item) => item.id !== id));
  }

  const clearCart = () => {
    setCartItems([]);
  };

  return (
    <ShoppingCartContext.Provider
      value={{
        addToCart,
        increaseCartQuantity,
        decreaseCartQuantity,
        removeFromCart,
        clearCart,
        getItemQuantity,
        cartItems,
        cartQuantity,
        deliveryMethod,
        setDeliveryMethod,
        paymentMethod,
        setPaymentMethod,
        mpesaPhone,
        setMpesaPhone,
        selectedAddress,
        setSelectedAddress,
      }}
    >
      {children}
    </ShoppingCartContext.Provider>
  );
}