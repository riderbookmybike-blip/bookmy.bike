'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

function classNames(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(' ');
}

// --- Context ---
interface DropdownContextValue {
    isOpen: boolean;
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    toggle: () => void;
    close: () => void;
}

const DropdownContext = React.createContext<DropdownContextValue | undefined>(undefined);

function useDropdown() {
    const context = React.useContext(DropdownContext);
    if (!context) {
        throw new Error('useDropdown must be used within a DropdownMenu');
    }
    return context;
}

// --- Components ---

const DropdownMenu = ({ children }: { children: React.ReactNode }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const menuRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const value = React.useMemo(
        () => ({
            isOpen,
            setIsOpen,
            toggle: () => setIsOpen(v => !v),
            close: () => setIsOpen(false),
        }),
        [isOpen]
    );

    return (
        <DropdownContext.Provider value={value}>
            <div className="relative inline-block text-left" ref={menuRef}>
                {children}
            </div>
        </DropdownContext.Provider>
    );
};

const DropdownMenuTrigger = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ className, children, asChild, ...props }, ref) => {
    const { toggle, isOpen } = useDropdown();

    if (asChild && React.isValidElement(children)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return React.cloneElement(children as React.ReactElement<any>, {
            onClick: (e: React.MouseEvent) => {
                (children as React.ReactElement<any>).props.onClick?.(e);
                toggle();
            },
            'data-state': isOpen ? 'open' : 'closed',
            ref,
            ...props,
        });
    }

    return (
        <button
            ref={ref}
            onClick={toggle}
            data-state={isOpen ? 'open' : 'closed'}
            className={classNames('inline-flex items-center', className)}
            {...props}
        >
            {children}
        </button>
    );
});
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger';

const DropdownMenuContent = ({
    className,
    children,
    align = 'center',
    ...props
}: React.HTMLAttributes<HTMLDivElement> & { align?: 'start' | 'end' | 'center' }) => {
    const { isOpen } = useDropdown();

    let alignClass = 'left-1/2 -translate-x-1/2';
    if (align === 'start') alignClass = 'left-0';
    if (align === 'end') alignClass = 'right-0 text-left';

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
                    transition={{ duration: 0.1 }}
                    className={classNames(
                        'absolute z-50 mt-2 min-w-[8rem] overflow-hidden rounded-xl border border-slate-100 bg-white p-1 text-slate-950 shadow-md dark:border-white/10 dark:bg-[#0b0d10] dark:text-slate-50',
                        alignClass,
                        className
                    )}
                    {...(props as any)}
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const DropdownMenuItem = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { inset?: boolean; onSelect?: () => void }
>(({ className, inset, onSelect, onClick, ...props }, ref) => {
    const { close } = useDropdown();

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        onClick?.(e);
        onSelect?.();
        close();
    };

    return (
        <div
            ref={ref}
            onClick={handleClick}
            className={classNames(
                'relative flex cursor-pointer select-none items-center rounded-lg px-2 py-1.5 text-xs font-medium outline-none transition-colors hover:bg-slate-100 dark:hover:bg-white/5',
                inset && 'pl-8',
                className
            )}
            {...props}
        />
    );
});
DropdownMenuItem.displayName = 'DropdownMenuItem';

const DropdownMenuLabel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }>(
    ({ className, inset, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={classNames('px-2 py-1.5 text-sm font-semibold', inset && 'pl-8', className)}
                {...props}
            />
        );
    }
);
DropdownMenuLabel.displayName = 'DropdownMenuLabel';

const DropdownMenuSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={classNames('-mx-1 my-1 h-px bg-slate-100 dark:bg-white/10', className)}
                {...props}
            />
        );
    }
);
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

export {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
};
