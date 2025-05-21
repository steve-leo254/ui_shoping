import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useLocalStorage } from "../cart/useLocalStorage";

type ShoppingCartProviderProps = {
  children: ReactNode;
};

// Updated CartItem type to include name and price
type CartItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  img_url: string | null;
};

// Updated context type with new addToCart function
type ShoppingCartContext = {
  addToCart: (product: { id: number; name: string; price: number }) => void;
  increaseCartQuantity: (id: number) => void;
  decreaseCartQuantity: (id: number) => void;
  removeFromCart: (id: number) => void;
  clearCart: () => void;
  getItemQuantity: (id: number) => number;
  cartQuantity: number;
  cartItems: CartItem[];
};

const ShoppingCartContext = createContext({} as ShoppingCartContext);

export function useShoppingCart() {
  return useContext(ShoppingCartContext);
}

export function ShoppingCartProvider({ children }: ShoppingCartProviderProps) {
  const [cartItems, setCartItems] = useLocalStorage<CartItem[]>(
    "shopping-cart",
    []
  );

  const cartQuantity = cartItems.reduce(
    (quantity, item) => item.quantity + quantity,
    0
  );

  function getItemQuantity(id: number) {
    return cartItems.find((item) => item.id === id)?.quantity || 0;
  }

  // New function to add items with name and price
  function addToCart(product: {
    id: number;
    name: string;
    price: number;
    img_url: string | null;
  }) {
    setCartItems((currItems) => {
      if (currItems.find((item) => item.id === product.id) == null) {
        // Item not in cart: add it with quantity 1
        return [...currItems, { ...product, quantity: 1 }];
      } else {
        // Item exists: increase its quantity
        return currItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
    });
  }

  // Modified to only increase quantity if item exists
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
      }}
    >
      {children}
    </ShoppingCartContext.Provider>
  );
}
