// Seeded random number generation and combinatorial utilities.

function mulberry32(seed) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createRng(seed) {
  const raw = mulberry32(seed);

  return {
    next() {
      return raw();
    },

    int(min, max) {
      return min + Math.floor(raw() * (max - min + 1));
    },

    pick(array) {
      return array[Math.floor(raw() * array.length)];
    },

    shuffle(array) {
      const copy = array.slice();
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(raw() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    },
  };
}

export function randomSeed() {
  return (Math.random() * 4294967296) >>> 0;
}

export function pickN(array, n, rng) {
  const rand = rng ? () => rng.next() : Math.random;
  const copy = array.slice();
  const count = Math.min(n, copy.length);
  for (let i = copy.length - 1; i > copy.length - 1 - count; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(copy.length - count);
}

export function shuffleCopy(array) {
  const copy = array.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function generateCombinations(slots) {
  const keys = Object.keys(slots);
  if (keys.length === 0) return [{}];

  const MAX = 10000;
  const total = keys.reduce((acc, k) => acc * slots[k].length, 1);

  if (total <= MAX) {
    let combos = [{}];
    for (const key of keys) {
      const next = [];
      for (const combo of combos) {
        for (const value of slots[key]) {
          next.push({ ...combo, [key]: value });
        }
      }
      combos = next;
    }
    return combos;
  }

  // Too many — return a random sample
  const seen = new Set();
  const results = [];
  while (results.length < MAX) {
    const combo = {};
    for (const key of keys) {
      const values = slots[key];
      combo[key] = values[Math.floor(Math.random() * values.length)];
    }
    const json = JSON.stringify(combo);
    if (!seen.has(json)) {
      seen.add(json);
      results.push(combo);
    }
  }
  return results;
}

export function uniqueRandomCombinations(slots, count, rng) {
  const keys = Object.keys(slots);
  const rand = rng ? () => rng.next() : Math.random;
  const total = keys.reduce((acc, k) => acc * slots[k].length, 1);
  const target = Math.min(count, total);

  const seen = new Set();
  const results = [];
  while (results.length < target) {
    const combo = {};
    for (const key of keys) {
      const values = slots[key];
      combo[key] = values[Math.floor(rand() * values.length)];
    }
    const json = JSON.stringify(combo);
    if (!seen.has(json)) {
      seen.add(json);
      results.push(combo);
    }
  }
  return results;
}
