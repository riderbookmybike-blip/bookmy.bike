'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface FavoriteItem {
    id: string;
    model: string;
    make: string;
    variant: string;
    imageUrl: string;
    price: number;
    slug: string;
    savedAt: number;
}

interface FavoritesContextType {
    favorites: FavoriteItem[];
    isFavorite: (id: string) => boolean;
    addFavorite: (item: Omit<FavoriteItem, 'savedAt'>) => void;
    removeFavorite: (id: string) => void;
    toggleFavorite: (item: Omit<FavoriteItem, 'savedAt'>) => void;
    getFavoritesCount: () => number;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const STORAGE_KEY = 'bmb_favorites';

export const FavoritesProvider = ({ children }: { children: React.ReactNode }) => {
    const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load favorites from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                setFavorites(parsed);
            }
        } catch (error) {
            console.error('Error loading favorites:', error);
        } finally {
            setIsLoaded(true);
        }
    }, []);

    // Save to localStorage whenever favorites change
    useEffect(() => {
        if (isLoaded) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
            } catch (error) {
                console.error('Error saving favorites:', error);
            }
        }
    }, [favorites, isLoaded]);

    const isFavorite = (id: string) => {
        return favorites.some(fav => fav.id === id);
    };

    const addFavorite = (item: Omit<FavoriteItem, 'savedAt'>) => {
        const newFavorite: FavoriteItem = {
            ...item,
            savedAt: Date.now()
        };
        setFavorites(prev => [newFavorite, ...prev]);
    };

    const removeFavorite = (id: string) => {
        setFavorites(prev => prev.filter(fav => fav.id !== id));
    };

    const toggleFavorite = (item: Omit<FavoriteItem, 'savedAt'>) => {
        if (isFavorite(item.id)) {
            removeFavorite(item.id);
        } else {
            addFavorite(item);
        }
    };

    const getFavoritesCount = () => favorites.length;

    return (
        <FavoritesContext.Provider
            value={{
                favorites,
                isFavorite,
                addFavorite,
                removeFavorite,
                toggleFavorite,
                getFavoritesCount
            }}
        >
            {children}
        </FavoritesContext.Provider>
    );
};

export const useFavorites = () => {
    const context = useContext(FavoritesContext);
    if (!context) {
        throw new Error('useFavorites must be used within FavoritesProvider');
    }
    return context;
};
