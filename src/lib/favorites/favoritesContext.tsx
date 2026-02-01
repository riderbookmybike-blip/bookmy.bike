'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface FavoriteItem {
    id: string;
    model: string;
    make?: string;
    variant: string;
    slug: string;
    imageUrl?: string;
    price?: number;
}

interface FavoritesContextType {
    favorites: FavoriteItem[];
    addFavorite: (item: FavoriteItem) => void;
    removeFavorite: (id: string) => void;
    toggleFavorite: (item: FavoriteItem) => void;
    isFavorite: (id: string) => boolean;
    clearFavorites: () => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider = ({ children }: { children: React.ReactNode }) => {
    const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
        const stored = localStorage.getItem('bmb_favorites');
        if (stored) {
            try {
                setFavorites(JSON.parse(stored));
            } catch (e) {
                console.error('Failed to parse favorites', e);
            }
        }
    }, []);

    useEffect(() => {
        if (mounted) {
            localStorage.setItem('bmb_favorites', JSON.stringify(favorites));
        }
    }, [favorites, mounted]);

    const addFavorite = (item: FavoriteItem) => {
        setFavorites(prev => {
            if (prev.some(f => f.id === item.id)) return prev;
            return [...prev, item];
        });
    };

    const removeFavorite = (id: string) => {
        setFavorites(prev => prev.filter(f => f.id !== id));
    };

    const toggleFavorite = (item: FavoriteItem) => {
        setFavorites(prev => {
            if (prev.some(f => f.id === item.id)) {
                return prev.filter(f => f.id !== item.id);
            }
            return [...prev, item];
        });
    };

    const isFavorite = (id: string) => favorites.some(f => f.id === id);

    const clearFavorites = () => setFavorites([]);

    return (
        <FavoritesContext.Provider value={{ favorites, addFavorite, removeFavorite, toggleFavorite, isFavorite, clearFavorites }}>
            {children}
        </FavoritesContext.Provider>
    );
};

export const useFavorites = () => {
    const context = useContext(FavoritesContext);
    if (context === undefined) {
        throw new Error('useFavorites must be used within a FavoritesProvider');
    }
    return context;
};
