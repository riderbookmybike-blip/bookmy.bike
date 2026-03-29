import fs from 'fs';

let content = fs.readFileSync('src/components/modules/reports/VahanTwoWheelerPage.tsx', 'utf8');

// Header Badge background
content = content.replace(/bg-indigo-50 text-indigo-600 border border-indigo-100\/50/g, 'bg-[#FFD700]/10 text-[#d9a400] border border-[#FFD700]/30');
content = content.replace(/bg-indigo-50/g, 'bg-[#FFD700]/10');
content = content.replace(/text-indigo-600/g, 'text-yellow-600');
content = content.replace(/border-indigo-100\/50/g, 'border-[#FFD700]/30');

// Hover states for dropdown wrappers
content = content.replace(/hover:border-indigo-200/g, 'hover:border-[#FFD700]');

// Chevrons
content = content.replace(/text-indigo-400/g, 'text-slate-800');

// Loaders & Active text
content = content.replace(/text-indigo-500/g, 'text-[#FFD700]');
content = content.replace(/bg-indigo-500/g, 'bg-[#FFD700]');

// Gradients & Pulses
content = content.replace(/bg-indigo-100\/40/g, 'bg-[#FFD700]/20');
content = content.replace(/from-indigo-500\/40/g, 'from-[#FFD700]/40');
content = content.replace(/via-purple-500\/40 to-orange-500\/40/g, 'via-[#FFD700]/20 to-yellow-500/40');

// Save it back
fs.writeFileSync('src/components/modules/reports/VahanTwoWheelerPage.tsx', content);
console.log("Replaced colors.");
