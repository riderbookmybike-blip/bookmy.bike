const ACRONYM_MAP: Record<string, string> = {
    A: 'ए',
    B: 'बी',
    C: 'सी',
    D: 'डी',
    E: 'ई',
    F: 'एफ',
    G: 'जी',
    H: 'एच',
    I: 'आई',
    J: 'जे',
    K: 'के',
    L: 'एल',
    M: 'एम',
    N: 'एन',
    O: 'ओ',
    P: 'पी',
    Q: 'क्यू',
    R: 'आर',
    S: 'एस',
    T: 'टी',
    U: 'यू',
    V: 'वी',
    W: 'डब्ल्यू',
    X: 'एक्स',
    Y: 'वाई',
    Z: 'ज़ेड',
};

const WORD_OVERRIDES: Record<string, string> = {
    honda: 'होंडा',
    tvs: 'टीवीएस',
    bajaj: 'बजाज',
    suzuki: 'सुज़ुकी',
    yamaha: 'यामाहा',
    ktm: 'केटीएम',
    hero: 'हीरो',
    triumph: 'ट्रायम्फ',
    aprilia: 'अप्रिलिया',
    'royal enfield': 'रॉयल एनफील्ड',
    emi: 'ईएमआई',
    abs: 'एबीएस',
    cbs: 'सीबीएस',
    rto: 'आरटीओ',
    gst: 'जीएसटी',
    sku: 'एसकेयू',
    api: 'एपीआई',
};

const VOWELS: Record<string, string> = {
    ai: 'ऐ',
    au: 'औ',
    aa: 'आ',
    ee: 'ई',
    ii: 'ई',
    oo: 'ऊ',
    uu: 'ऊ',
    a: 'अ',
    i: 'इ',
    u: 'उ',
    e: 'ए',
    o: 'ओ',
};

const MATRAS: Record<string, string> = {
    ai: 'ै',
    au: 'ौ',
    aa: 'ा',
    ee: 'ी',
    ii: 'ी',
    oo: 'ू',
    uu: 'ू',
    a: '',
    i: 'ि',
    u: 'ु',
    e: 'े',
    o: 'ो',
};

const CONSONANTS: Record<string, string> = {
    chh: 'छ',
    kh: 'ख',
    gh: 'घ',
    ch: 'च',
    jh: 'झ',
    th: 'थ',
    dh: 'ध',
    ph: 'फ',
    bh: 'भ',
    sh: 'श',
    ng: 'ङ',
    ny: 'ञ',
    k: 'क',
    g: 'ग',
    c: 'क',
    j: 'ज',
    t: 'त',
    d: 'द',
    n: 'न',
    p: 'प',
    b: 'ब',
    m: 'म',
    y: 'य',
    r: 'र',
    l: 'ल',
    v: 'व',
    w: 'व',
    s: 'स',
    h: 'ह',
    f: 'फ',
    q: 'क',
    x: 'क्स',
    z: 'ज',
};

const VOWEL_KEYS = Object.keys(VOWELS).sort((a, b) => b.length - a.length);
const CONSONANT_KEYS = Object.keys(CONSONANTS).sort((a, b) => b.length - a.length);

const isLatinWord = (value: string) => /[A-Za-z]/.test(value);
const isAllCaps = (value: string) => /^[A-Z0-9]+$/.test(value);
const isNumeric = (value: string) => /^[0-9]+$/.test(value);

const matchToken = (value: string, index: number, keys: string[]) => {
    for (const key of keys) {
        if (value.startsWith(key, index)) return key;
    }
    return null;
};

const transliterateAcronym = (value: string) => {
    let output = '';
    for (const char of value) {
        if (/[A-Z]/.test(char)) output += ACRONYM_MAP[char] || char;
        else output += char;
    }
    return output;
};

const transliterateWord = (word: string) => {
    const lower = word.toLowerCase();
    const override = WORD_OVERRIDES[lower];
    if (override) return override;

    if (isAllCaps(word)) {
        return transliterateAcronym(word);
    }

    let output = '';
    let i = 0;
    while (i < lower.length) {
        const char = lower[i];
        if (!/[a-z]/.test(char)) {
            output += word[i];
            i += 1;
            continue;
        }

        const vowelKey = matchToken(lower, i, VOWEL_KEYS);
        if (vowelKey) {
            const isStart = i === 0;
            output += isStart ? VOWELS[vowelKey] : MATRAS[vowelKey];
            i += vowelKey.length;
            continue;
        }

        const consonantKey = matchToken(lower, i, CONSONANT_KEYS);
        if (consonantKey) {
            const consonant = CONSONANTS[consonantKey];
            const nextIndex = i + consonantKey.length;
            const nextVowel = matchToken(lower, nextIndex, VOWEL_KEYS);
            if (nextVowel) {
                output += consonant + MATRAS[nextVowel];
                i = nextIndex + nextVowel.length;
            } else {
                const nextConsonant = matchToken(lower, nextIndex, CONSONANT_KEYS);
                output += consonant;
                if (nextConsonant) output += '्';
                i = nextIndex;
            }
            continue;
        }

        output += word[i];
        i += 1;
    }

    return output;
};

export const toDevanagariScript = (input: string) => {
    if (!input || !isLatinWord(input) || isNumeric(input)) return input;

    // Preserve spacing and separators
    return input
        .split(/(\s+|[-/,&()]+)/)
        .map(part => {
            if (!part || !isLatinWord(part)) return part;
            return transliterateWord(part);
        })
        .join('');
};
