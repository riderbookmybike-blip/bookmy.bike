export function sanitizeSvg(input: string | null | undefined) {
    if (!input) return '';
    return (
        input
            // Remove script tags
            .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
            // Remove on* event handlers
            .replace(/\son\w+="[^"]*"/gi, '')
            .replace(/\son\w+='[^']*'/gi, '')
            // Strip javascript: and data:text/html
            .replace(/javascript:/gi, '')
            .replace(/data:text\/html/gi, '')
    );
}
