export type ThemePreference = 'light';
export type ResolvedTheme = 'light';

export const THEME_STORAGE_KEY = 'theme';

export const isThemePreference = (value: unknown): value is ThemePreference => value === 'light';

export const resolveThemePreference = (_theme: ThemePreference, _prefersDark: boolean): ResolvedTheme => 'light';
