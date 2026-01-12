'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface FavoritesContextType {
    favorites: string[];
    addFavorite: (id: string) => void;
    removeFavorite: (id: string) => void;
    toggleFavorite: (id: string) => void;
    isFavorite: (id: string) => boolean;
    clearFavorites: () => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider = ({ children }: { children: React.ReactNode }) => {
    const [favorites, setFavorites] = useState<string[]>([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
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

    const addFavorite = (id: string) => {
        setFavorites(prev => {
            if (prev.includes(id)) return prev;
            return [...prev, id];
        });
    };

    const removeFavorite = (id: string) => {
        setFavorites(prev => prev.filter(f => f !== id));
    };

    const toggleFavorite = (id: string) => {
        setFavorites(prev => {
            if (prev.includes(id)) {
                return prev.filter(f => f !== id);
            }
            return [...prev, id];
        });
    };

    const isFavorite = (id: string) => favorites.includes(id);

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
