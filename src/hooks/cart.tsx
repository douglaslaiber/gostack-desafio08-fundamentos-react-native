import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';
import { ProductTitleContainer } from 'src/pages/Cart/styles';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Product): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const cartStorage = await AsyncStorage.getItem('@GoMarket:cart');
      setProducts(cartStorage ? JSON.parse(cartStorage) : []);
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const productFound = products.find(item => item.id === product.id);

      if (productFound) {
        setProducts(state =>
          state.map(item =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          ),
        );
      } else {
        setProducts([...products, { ...product, quantity: 1 }]);
      }

      await AsyncStorage.setItem('@GoMarket:cart', JSON.stringify(products));
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      setProducts(state =>
        state.map(item =>
          item.id === id ? { ...item, quantity: item.quantity + 1 } : item,
        ),
      );

      await AsyncStorage.setItem('@GoMarket:cart', JSON.stringify(products));
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      setProducts(state =>
        state
          .map(product => {
            if (product.id === id) {
              if (product.quantity > 0) {
                return { ...product, quantity: product.quantity - 1 };
              }
            }

            return product;
          })
          .filter(product => product.quantity > 0),
      );

      await AsyncStorage.setItem('@GoMarket:cart', JSON.stringify(products));
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
