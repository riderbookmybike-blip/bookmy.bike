'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ColorContextType {
    activeColorHex: string;
    setActiveColorHex: (hex: string) => void;
}

const ColorContext = createContext<ColorContextType>({
    activeColorHex: '#E8E8E8', // Default to light grey so logo starts black
    setActiveColorHex: () => { },
});

export const useActiveColor = () => useContext(ColorContext);

export const ColorProvider = ({ children }: { children: ReactNode }) => {
    const [activeColorHex, setActiveColorHex] = useState('#E8E8E8'); // Light default

    return (
        <ColorContext.Provider value={{ activeColorHex, setActiveColorHex }}>
            {children}
        </ColorContext.Provider>
    );
};
