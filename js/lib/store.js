// Small persistent key/value store. Storage can be unavailable (private mode),
// so every access is guarded and the app works fine without it.
const KEY = 'tinyplay:v1';

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

let data = load();

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export const store = {
  get(key, fallback) {
    return key in data ? data[key] : fallback;
  },
  set(key, value) {
    data[key] = value;
    save();
  },
  resetProgress() {
    for (const key of Object.keys(data)) {
      if (key.startsWith('level:') || key.startsWith('wins:')) delete data[key];
    }
    save();
  },
};
