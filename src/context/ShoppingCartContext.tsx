import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

type ShoppingCartProviderProps = {
  children: ReactNode;
};

type CartItem = {
  id: number;
  quantity: number;
};

type ShoppingCartContext = {
  getItemQuantity: (id: number) => number;
  increaseCartQuantity: (id: number) => void;
  decreaseCartQuantity: (id: number) => void;
  removeFromCart: (id: number) => void;
  cartItems: CartItem[];
  clearCart: () => void;
  cartQuantity: number;
  openCart: () => void;
  closeCart: () => void;
  isOpen: boolean;
};

const ShoppingCartContext = createContext({} as ShoppingCartContext);

export function useShoppingCart() {
  return useContext(ShoppingCartContext);
}

export function ShoppingCartProvider({ children }: ShoppingCartProviderProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>(
    JSON.parse(localStorage.getItem("shopping-cart") || "[]")
  );
  const [isOpen, setIsOpen] = useState(false);

  const cartQuantity = cartItems.reduce(
    (quantity, item) => item.quantity + quantity,
    0
  );

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  function getItemQuantity(id: number) {
    return cartItems.find((item) => item.id === id)?.quantity || 0;
  }

  function increaseCartQuantity(id: number) {
    setCartItems((currItems) => {
      if (currItems.find((item) => item.id === id) == null) {
        const updatedItems = [...currItems, { id, quantity: 1 }];
        localStorage.setItem("shopping-cart", JSON.stringify(updatedItems));
        return updatedItems;
      } else {
        const updatedItems = currItems.map((item) => {
          if (item.id === id) {
            return { ...item, quantity: item.quantity + 1 };
          }
          return item;
        });
        localStorage.setItem("shopping-cart", JSON.stringify(updatedItems));
        return updatedItems;
      }
    });
  }

  function decreaseCartQuantity(id: number) {
    setCartItems((currItems) => {
      if (currItems.find((item) => item.id === id)?.quantity === 1) {
        const updatedItems = currItems.filter((item) => item.id !== id);
        localStorage.setItem("shopping-cart", JSON.stringify(updatedItems));
        return updatedItems;
      } else {
        const updatedItems = currItems.map((item) => {
          if (item.id === id) {
            return { ...item, quantity: item.quantity - 1 };
          }
          return item;
        });
        localStorage.setItem("shopping-cart", JSON.stringify(updatedItems));
        return updatedItems;
      }
    });
  }

  function removeFromCart(id: number) {
    setCartItems((currItems) => {
      const updatedItems = currItems.filter((item) => item.id !== id);
      localStorage.setItem("shopping-cart", JSON.stringify(updatedItems));
      return updatedItems;
    });
  }

  function clearCart() {
    setCartItems([]);
    localStorage.setItem("shopping-cart", JSON.stringify([]));
  }

  return (
    <ShoppingCartContext.Provider
      value={{
        getItemQuantity,
        increaseCartQuantity,
        decreaseCartQuantity,
        removeFromCart,
        cartItems,
        clearCart,
        cartQuantity,
        openCart,
        closeCart,
        isOpen,
      }}
    >
      {children}
    </ShoppingCartContext.Provider>
  );
}