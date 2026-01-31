'use client';

import { Footer } from '@/components/store/Footer';
import { useEffect } from 'react';

/**
 * Mobile-friendly wrapper for Footer that converts hover to tap interactions
 */
export function MobileFooter() {
    useEffect(() => {
        // Convert hover interactions to tap on mobile
        const handleFooterInteractions = () => {
            const footerCards = document.querySelectorAll('footer [onmouseenter]');

            footerCards.forEach((card) => {
                // Remove hover listeners and add click listeners
                const parent = card.parentElement;
                if (parent) {
                    parent.addEventListener('click', (e) => {
                        e.preventDefault();
                        // Trigger the hover effect
                        const mouseEnterEvent = new MouseEvent('mouseenter', {
                            bubbles: true,
                            cancelable: true,
                        });
                        card.dispatchEvent(mouseEnterEvent);
                    });
                }
            });
        };

        // Run after component mounts
        setTimeout(handleFooterInteractions, 100);
    }, []);

    return <Footer />;
}
