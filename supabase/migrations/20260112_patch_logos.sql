-- Update TVS Logo with fixed SVG
UPDATE public.brands 
SET logo_svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 350 100" fill="currentColor"><path d="M10 25h90l-5 18H60l-15 42H25l15-42H10l5-18zM110 25h25l15 40 45-40h28l-45 65h-25l-43-65zM220 75c0-18 25-18 25-28 0-6-6-8-15-8-12 0-25 5-30 12l-10-18c12-12 30-18 45-18 30 0 45 15 45 35 0 28-35 28-35 40 0 6 6 8 15 8 15 0 28-6 35-12l10 18c-12 15-30 22-55 22-30 0-45-15-45-35z"/></svg>'
WHERE name = 'TVS';

-- Update Honda Logo with fixed SVG
UPDATE public.brands 
SET logo_svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 60" fill="currentColor"><path d="M10 5h18v22h32V5h18v50H60V35H28v20H10V5zM100 5c25 0 42 18 42 27s-17 28-42 28-42-18-42-28 17-27 42-27zm0 15c-12 0-20 6-20 12s8 12 20 12 20-6 20-12-8-12-20-12zM160 5h18l35 40V5h18v50h-18l-35-40v40h-18V5zM240 5h25c25 0 38 12 38 27s-13 28-38 28h-25V5zm18 15v25h7c12 0 18-6 18-12s-6-13-18-13h-7zM320 5h18l18 50h-18l-4-12h-12l-4 12h-18l18-50zm14 30l-6-18-6 18h12z"/></svg>'
WHERE name = 'HONDA';
