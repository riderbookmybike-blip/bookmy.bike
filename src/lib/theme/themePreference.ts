export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'theme';

export const isThemePreference = (value: unknown): value is ThemePreference =>
    value === 'light' || value === 'dark' || value === 'system';

export const resolveThemePreference = (theme: ThemePreference, prefersDark: boolean): ResolvedTheme => {
    if (theme === 'system') {
        return prefersDark ? 'dark' : 'light';
    }
    return theme;
};
