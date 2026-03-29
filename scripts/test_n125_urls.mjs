async function checkUrl(url) {
    try {
        const res = await fetch(url, { method: 'HEAD' });
        if (res.ok) console.log("FOUND:", url);
    } catch(e) {}
}

const colors = ['purple-fury', 'cocktail-wine-red', 'citrus-rush', 'pearl-metallic-white', 'ebony-black', 'caribbean-blue'];
const bases = [
    'https://cdn.bajajauto.com/-/media/assets/bajajauto/360degreeimages/bikes/pulsar/n125/',
    'https://cdn.bajajauto.com/-/media/assets/bajajauto/360-degree-images/bikes/pulsar-n125-2025/',
    'https://cdn.bajajauto.com/-/media/assets/bajajauto/360degreeimages/bikes/pulsar-n125-2025/',
    'https://cdn.bajajauto.com/-/media/assets/bajajauto/bikes/pulsar-n125-2025/360-degree/'
];

colors.forEach(c => {
    bases.forEach(b => {
        checkUrl(`${b}${c}/00.webp`);
        checkUrl(`${b}${c}/01.webp`);
    })
});
