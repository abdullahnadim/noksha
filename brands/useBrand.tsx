'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Brand {
  id: string;
  name: string;
}

interface BrandContextType {
  activeBrand: Brand | null;
  setActiveBrand: (brand: Brand) => void;
  activeView: string;
  setActiveView: (view: string) => void;
  isCreateModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  brands: Brand[];
  addBrand: (name: string) => void;
  removeBrand: (id: string) => void;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

const defaultBrands = [
  { id: 'brand_happier', name: 'Happier' },
  { id: 'brand_sonder', name: 'Sonder' },
  { id: 'brand_fashion_asia', name: 'Fashion Asia Ltd' },
];

export function BrandProvider({ children }: { children: ReactNode }) {
  const [brands, setBrands] = useState<Brand[]>(defaultBrands);
  const [activeBrand, setActiveBrand] = useState<Brand | null>(null);
  const [activeView, setActiveView] = useState('calendar');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    const savedBrands = localStorage.getItem('saved_workspaces');
    if (savedBrands) {
      const parsed = JSON.parse(savedBrands);
      setBrands(parsed);
      setActiveBrand(parsed[0]);
    } else {
      setActiveBrand(defaultBrands[0]);
    }
  }, []);

  const addBrand = (name: string) => {
    const newBrand = { id: `brand_${Date.now()}`, name };
    const updatedBrands = [...brands, newBrand];
    setBrands(updatedBrands);
    localStorage.setItem('saved_workspaces', JSON.stringify(updatedBrands));
    setActiveBrand(newBrand); 
  };

  const removeBrand = (id: string) => {
    const updatedBrands = brands.filter(b => b.id !== id);
    setBrands(updatedBrands);
    localStorage.setItem('saved_workspaces', JSON.stringify(updatedBrands));
    if (activeBrand?.id === id && updatedBrands.length > 0) {
      setActiveBrand(updatedBrands[0]);
    }
  };

  const openModal = () => setIsCreateModalOpen(true);
  const closeModal = () => setIsCreateModalOpen(false);

  return (
    <BrandContext.Provider value={{ 
      activeBrand, setActiveBrand, 
      activeView, setActiveView, 
      isCreateModalOpen, openModal, closeModal,
      brands, addBrand, removeBrand 
    }}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  const context = useContext(BrandContext);
  if (context === undefined) throw new Error('useBrand must be used within a BrandProvider');
  return context;
}