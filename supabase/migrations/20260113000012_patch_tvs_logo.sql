-- Refine TVS Logo with better viewBox and scaling
UPDATE public.brands 
SET logo_svg = '<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M10,5 L30,5 L25,35 L15,35 Z M45,5 L55,35 L65,5 M75,5 L95,5 L95,10 L80,10 L80,15 L90,15 L90,20 L80,20 L80,35 L75,35" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>' 
WHERE name ILIKE 'TVS';

-- Refine Honda Wing Logo (Simulated)
UPDATE public.brands 
SET logo_svg = '<svg viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M10,10 C30,10 40,30 50,70 L60,70 C70,30 80,10 90,10 L10,10 Z" /></svg>' 
WHERE name ILIKE 'HONDA';
