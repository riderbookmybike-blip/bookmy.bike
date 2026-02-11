import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generates a multi-page A4 PDF from a set of HTML element IDs.
 * @param elementIds Array of IDs for elements to be captured as separate pages.
 * @param fileName Name of the resulting PDF file.
 */
export const generatePremiumPDF = async (elementIds: string[], fileName: string) => {
    console.log('[PDF] Starting generation for IDs:', elementIds);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    let capturedCount = 0;

    for (let i = 0; i < elementIds.length; i++) {
        const id = elementIds[i];
        const element = document.getElementById(id);

        console.log(`[PDF] Attempting to find element with ID: "${id}"`);

        if (!element) {
            console.error(`[PDF] CRITICAL: Element with ID "${id}" NOT found in document.`);
            // Diagnostic: Check if the capture area itself exists
            const captureArea = document.getElementById('premium-quote-capture-area');
            if (captureArea) {
                console.log(
                    `[PDF] Capture area "premium-quote-capture-area" exists. Its children IDs are:`,
                    Array.from(captureArea.querySelectorAll('[id]')).map(el => el.id)
                );
            } else {
                console.error(`[PDF] Capture area "premium-quote-capture-area" is also missing from DOM.`);
            }
            continue;
        }

        console.log(`[PDF] Element "${id}" found. Size: ${element.offsetWidth}x${element.offsetHeight}`);

        try {
            const canvas = await html2canvas(element, {
                scale: 3,
                useCORS: true,
                logging: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                scrollX: 0,
                scrollY: -window.scrollY,
                onclone: clonedDoc => {
                    console.log('[PDF] Aggressively sanitizing cloned document styles...');

                    // 1. Sanitize all <style> tags
                    const styleTags = clonedDoc.querySelectorAll('style');
                    styleTags.forEach((style, idx) => {
                        const original = style.innerHTML;
                        if (original.includes('lab(') || original.includes('oklch(')) {
                            console.log(`[PDF] Stripping modern colors from style tag #${idx}`);
                            // Replace with a regex that handles various spacing/formats
                            style.innerHTML = original
                                .replace(/lab\([^)]+\)/gi, '#000000')
                                .replace(/oklch\([^)]+\)/gi, '#000000');
                        }
                    });

                    // 2. Scan all elements for inline styles
                    const allElements = clonedDoc.querySelectorAll('*');
                    allElements.forEach(el => {
                        const styleAttr = el.getAttribute('style');
                        if (styleAttr && (styleAttr.includes('lab(') || styleAttr.includes('oklch('))) {
                            const sanitized = styleAttr
                                .replace(/lab\([^)]+\)/gi, '#000000')
                                .replace(/oklch\([^)]+\)/gi, '#000000');
                            el.setAttribute('style', sanitized);
                        }
                    });

                    // 3. Remove all <link> tags to external stylesheets to prevent html2canvas
                    // from trying to parse external modern CSS (Tailwind/Next.js)
                    // We only want the internal styles we've sanitized or that are safe
                    const links = clonedDoc.querySelectorAll('link[rel="stylesheet"]');
                    links.forEach(link => link.remove());

                    console.log('[PDF] Sanitization complete.');
                },
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.95);

            // Basic check if canvas is mostly empty (too simple, but helps)
            if (canvas.width === 0 || canvas.height === 0) {
                console.warn(`[PDF] Canvas for "${id}" is empty.`);
                continue;
            }

            // Add new page if not the first successful capture
            if (capturedCount > 0) pdf.addPage();

            // Fit canvas to A4 dimensions
            pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
            capturedCount++;
            console.log(`[PDF] Successfully added page ${capturedCount}`);
        } catch (err) {
            console.error(`[PDF] Failed to capture "${id}":`, err);
        }
    }

    if (capturedCount === 0) {
        throw new Error('No elements were successfully captured for the PDF.');
    }

    console.log('[PDF] Saving file:', fileName);
    pdf.save(fileName);
};
