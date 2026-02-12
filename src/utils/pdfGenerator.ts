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
                onclone: (clonedDoc: Document, clonedElement: HTMLElement) => {
                    console.log('[PDF] Inlining computed styles for pixel-perfect capture...');

                    // getComputedStyle ALWAYS returns colors as rgb()/rgba(),
                    // never modern oklab/oklch/lab — so this is inherently safe.
                    const view = clonedDoc.defaultView;
                    if (view) {
                        const inlineComputed = (el: Element) => {
                            if (!(el instanceof HTMLElement)) return;
                            try {
                                const computed = view.getComputedStyle(el);
                                // Copy all computed properties as inline styles
                                el.style.cssText = computed.cssText;
                            } catch {
                                // Skip elements that can't be introspected
                            }
                        };
                        inlineComputed(clonedElement);
                        clonedElement.querySelectorAll('*').forEach(inlineComputed);
                    }

                    // Now safe to remove ALL stylesheets — every style is inlined
                    clonedDoc.querySelectorAll('style, link[rel="stylesheet"]').forEach(s => s.remove());

                    console.log('[PDF] Style inlining complete.');
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
