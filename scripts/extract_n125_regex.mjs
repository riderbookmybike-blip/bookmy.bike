async function extract() {
    const res = await fetch('https://www.bajajauto.com/bikes/pulsar/pulsar-n125');
    const html = await res.text();
    
    // Extract models
    const modelMatches = [...html.matchAll(/data-modelname="([^"]+)"/g)];
    const models = [...new Set(modelMatches.map(m => m[1]))];
    console.log("Variants found:", models);
    
    // Extract colors block
    const items = [...html.matchAll(/data-colorname="([^"]+)"[^>]*data-bikeimage="([^"]+)"[^>]*>.*?<span[^>]*style="background:([^"]+)"/gs)];
    
    // Try another pattern if the above fails
    const items2 = [...html.matchAll(/data-colorname="([^"]+)"\s*data-bikeimage="([^"]+)"/g)];
    console.log("\nColors found (basic):");
    items2.forEach(m => console.log(m[1], m[2]));
    
    // Look more broadly for anything near data-colorname
    console.log("\nDetailed colors:");
    const lis = [...html.matchAll(/<li[^>]*>(.*?)<\/li>/gs)];
    for (const m of lis) {
        if (m[1].includes('data-colorname')) {
            const nameMatch = m[1].match(/data-colorname="([^"]+)"/);
            const imgMatch = m[1].match(/data-bikeimage="([^"]+)"/);
            const bgMatch = m[1].match(/background(?:-color)?:\s*([^;"]+)/);
            if (nameMatch) {
               console.log(`- ${nameMatch[1]} | Img: ${imgMatch?.[1]} | Hex: ${bgMatch?.[1]}`);
            }
        }
    }
}
extract();
