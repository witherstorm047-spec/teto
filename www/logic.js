/* Lógica da palavra do dia - igual à do teto_word.py (mesma palavra que no PC). */
(function (root) {
  "use strict";

  // ---------- MD5 (para escolher a palavra exatamente como o Python) ----------
  function md5hex(str) {
    var bytes = new TextEncoder().encode(str);
    var S = [7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,
             5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,
             4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,
             6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21];
    var K = new Uint32Array(64);
    for (var i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296) >>> 0;
    var len = bytes.length;
    var n = (((len + 8) >>> 6) + 1) * 64;
    var buf = new Uint8Array(n);
    buf.set(bytes);
    buf[len] = 0x80;
    var dv = new DataView(buf.buffer);
    dv.setUint32(n - 8, (len << 3) >>> 0, true);
    dv.setUint32(n - 4, Math.floor(len / 0x20000000), true);
    var a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
    for (var off = 0; off < n; off += 64) {
      var M = new Uint32Array(16);
      for (var j = 0; j < 16; j++) M[j] = dv.getUint32(off + j * 4, true);
      var A = a0, B = b0, C = c0, D = d0;
      for (var k = 0; k < 64; k++) {
        var F, g;
        if (k < 16)      { F = (B & C) | (~B & D); g = k; }
        else if (k < 32) { F = (D & B) | (~D & C); g = (5 * k + 1) % 16; }
        else if (k < 48) { F = B ^ C ^ D;          g = (3 * k + 5) % 16; }
        else             { F = C ^ (B | ~D);       g = (7 * k) % 16; }
        F = (F + A + K[k] + M[g]) >>> 0;
        A = D; D = C; C = B;
        B = (B + ((F << S[k]) | (F >>> (32 - S[k])))) >>> 0;
      }
      a0 = (a0 + A) >>> 0; b0 = (b0 + B) >>> 0; c0 = (c0 + C) >>> 0; d0 = (d0 + D) >>> 0;
    }
    var out = "";
    [a0, b0, c0, d0].forEach(function (v) {
      for (var s = 0; s < 32; s += 8) out += ((v >>> s) & 0xff).toString(16).padStart(2, "0");
    });
    return out;
  }

  // ---------- datas ----------
  function pad2(n) { return String(n).padStart(2, "0"); }
  function isoDate(d) { return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()); }
  function dayOfYear(d) {
    var a = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    var b = new Date(d.getFullYear(), 0, 0);
    return Math.round((a - b) / 86400000);
  }

  // ---------- palavras ----------
  // Lista pequena de reserva (só usada se estiveres sem internet)
  var FALLBACK_WORDS = ["abandon", "abate", "aberration", "abhor", "abstain", "accolade", "acquiesce", "acumen", "adamant", "adept", "admonish", "adorn", "adversity", "advocate", "aesthetic", "affable", "alacrity", "aloof", "altruism", "amass", "ambiguous", "ameliorate", "amiable", "ample", "anachronism", "analogous", "anecdote", "anomaly", "antipathy", "apathy", "aplomb", "appease", "arbitrary", "ardent", "arduous", "arid", "articulate", "ascetic", "assiduous", "astound", "astute", "audacious", "aurora", "austere", "avarice", "avid", "balmy", "banal", "bask", "beguile", "belligerent", "benediction", "benevolent", "benign", "bestow", "bleak", "blithe", "boisterous", "bolster", "bombastic", "bravado", "brevity", "bucolic", "buoyant", "burgeon", "bustle", "cacophony", "camaraderie", "candid", "candor", "capricious", "cascade", "castigate", "catalyst", "caustic", "censure", "cerulean", "chagrin", "charisma", "cherish", "chicanery", "circumspect", "clamor", "clandestine", "clemency", "coalesce", "coax", "cobalt", "cogent", "cognizant", "cohesive", "commiserate", "compassion", "complacent", "concise", "condone", "conspicuous", "constellation", "contemplate", "conundrum", "convivial", "copious", "cordial", "corroborate", "credulous", "cryptic", "cunning", "cursory", "dalliance", "dapper", "daunting", "dawdle", "dazzle", "debacle", "decorum", "deference", "deft", "deleterious", "demure", "denounce", "deride", "desolate", "despot", "dexterity", "diatribe", "dichotomy", "diffident", "digress", "diligent", "discern", "disparage", "disparate", "dissent", "diverge", "docile", "dogmatic", "dubious", "dulcet", "dwindle", "eager", "ebullient", "eccentric", "eclectic", "effervescent", "efficacy", "effulgent", "egregious", "elated", "elegy", "elicit", "eloquent", "elude", "elusive", "embark", "emulate", "endeavor", "enigma", "enthrall", "ephemeral", "epitome", "equanimity", "equivocal", "erudite", "esoteric", "ethereal", "eulogy", "euphoria", "evanescent", "exacerbate", "exemplary", "exonerate", "expedite", "exquisite", "extol", "facetious", "fastidious", "fathom", "felicity", "fervent", "fervor", "fickle", "finesse", "flair", "fledgling", "flotsam", "flourish", "fortitude", "frivolous", "frugal", "furtive", "futile", "garrulous", "genial", "glean", "gossamer", "grapple", "gregarious", "guile", "hackneyed", "halcyon", "hamper", "harbinger", "haughty", "haven", "hearth", "hegemony", "heresy", "hiatus", "hone", "hubris", "humble", "hypothetical", "iconoclast", "idiosyncrasy", "idyllic", "immaculate", "imminent", "impartial", "impeccable", "impetuous", "implacable", "inane", "incandescent", "incessant", "incipient", "indolent", "indulge", "ineffable", "inexorable", "infamous", "ingenuous", "inherent", "innocuous", "insidious", "insipid", "integrity", "intrepid", "inundate", "irascible", "jaunty", "jovial", "jubilant", "juxtapose", "kaleidoscope", "keen", "kindle", "labyrinth", "laconic", "languid", "laudable", "lavish", "lethargic", "levity", "linger", "lively", "lucid", "lullaby", "luminous", "magnanimous", "malevolent", "malleable", "meander", "mellifluous", "meticulous", "mingle", "mirage", "mirth", "mitigate", "modest", "mosaic", "mundane", "muse", "nebulous", "nefarious", "nimble", "nocturnal", "nonchalant", "nostalgia", "nuance", "nurture", "oasis", "obdurate", "obscure", "obsolete", "obstinate", "odyssey", "ominous", "opportune", "opulent", "ostentatious", "panorama", "paradox", "paragon", "pariah", "pastoral", "pedantic", "penchant", "perfunctory", "pernicious", "perpetual", "perspicacious", "pertinent", "peruse", "petulant", "philanthropy", "pinnacle", "placid", "plethora", "poignant", "ponder", "pragmatic", "precarious", "prescient", "prodigious", "profound", "proliferate", "prudent", "pungent", "quaint", "quandary", "quell", "quench", "quirky", "quiver", "quixotic", "radiant", "ramble", "rancor", "rapport", "rebuke", "recalcitrant", "reclusive", "redundant", "relish", "reminiscent", "replete", "resilient", "reticent", "revel", "reverence", "reverie", "rhetoric", "ripple", "robust", "rustic", "sagacious", "salient", "sanguine", "sardonic", "saunter", "savor", "scarce", "scrutinize", "serendipity", "serene", "shimmer", "silhouette", "sleek", "sojourn", "solace", "solitude", "sonorous", "sparkle", "spectrum", "splendid", "sporadic", "sprightly", "stalwart", "staunch", "stellar", "stoic", "sublime", "subtle", "succinct", "summit", "sundry", "superfluous", "surreptitious", "tact", "talisman", "tangible", "tapestry", "tempest", "tenacious", "tenuous", "terse", "thrifty", "thrive", "timorous", "tranquil", "tranquility", "transient", "trepidation", "trivial", "tundra", "twilight", "ubiquitous", "unanimous", "undermine", "unwavering", "upbeat", "utopia", "vacillate", "valiant", "venerable", "verbose", "vestige", "vex", "vibrant", "vigilant", "vindicate", "virtuous", "vista", "vivid", "volatile", "voracious", "wane", "wary", "whimsical", "whisper", "wholesome", "willow", "wily", "wistful", "witty", "yearn", "yield", "zealous", "zenith", "zephyr", "zest", "zodiac"];

  function fallbackWord(d) {
    var year = d.getFullYear();
    var keyed = FALLBACK_WORDS.map(function (w) { return [md5hex(year + "-" + w), w]; });
    keyed.sort(function (x, y) { return x[0] < y[0] ? -1 : x[0] > y[0] ? 1 : 0; });
    return keyed[(dayOfYear(d) - 1) % keyed.length][1];
  }

  // texto da lista completa -> palavras únicas, minúsculas, ordenadas
  function parseWordList(text) {
    var set = new Set(text.toLowerCase().split(/\s+/).filter(Boolean));
    return Array.from(set).sort();
  }

  function wordFromList(words, d) {
    var seed = BigInt("0x" + md5hex(isoDate(d)));
    return words[Number(seed % BigInt(words.length))];
  }

  function capitalize(t) { return t.slice(0, 1).toUpperCase() + t.slice(1); }

  var api = {
    md5hex: md5hex, isoDate: isoDate, dayOfYear: dayOfYear, fallbackWord: fallbackWord,
    parseWordList: parseWordList, wordFromList: wordFromList, capitalize: capitalize
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.TetoLogic = api;
})(typeof window !== "undefined" ? window : globalThis);
