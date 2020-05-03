import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

export interface Product {
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
      const productsList = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );

      if (productsList) {
        setProducts(JSON.parse(productsList));
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const filteredProducts = products.filter(product => product.id !== id);

      const newProduct = products.find(product => product.id === id);

      if (newProduct) {
        newProduct.quantity += 1;

        setProducts([...filteredProducts, newProduct]);
      }

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify([...filteredProducts, newProduct]),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const filteredProducts = products.filter(product => product.id !== id);
      const newProduct = products.find(product => product.id === id);
      if (newProduct) {
        if (newProduct.quantity <= 1) {
          setProducts(filteredProducts);
        } else {
          newProduct.quantity -= 1;

          setProducts([...filteredProducts, newProduct]);
        }
      }

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );
  const addToCart = useCallback(
    async product => {
      const productIndex = products.findIndex(
        productFiltered => productFiltered.id === product.id,
      );
      if (productIndex < 0) {
        setProducts(oldState => [...oldState, { ...product, quantity: 1 }]);
        await AsyncStorage.setItem(
          '@GoMarketplace:products',
          JSON.stringify([...products, { ...product, quantity: 1 }]),
        );
      } else {
        increment(product.id);
      }
    },
    [products, increment],
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
