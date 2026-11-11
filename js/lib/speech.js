// Spoken instructions via the device's built-in text-to-speech.
// Toddlers can't read, so the voice carries every instruction.
const synth = 'speechSynthesis' in window ? window.speechSynthesis : null;

const PREFERRED = { en: ['en-in', 'en-gb', 'en-us'], hi: ['hi-in'] };

let lang = 'en';
let enabled = true;
let voiceURI = null;
let voices = [];
let token = 0;

const norm = (code) => code.toLowerCase().replace('_', '-');

function refreshVoices() {
  voices = synth ? synth.getVoices() : [];
}
if (synth) {
  refreshVoices();
  synth.addEventListener?.('voiceschanged', refreshVoices);
}

export function configure(opts) {
  if (opts.lang) lang = opts.lang;
  if ('enabled' in opts) enabled = opts.enabled;
  if ('voiceURI' in opts) voiceURI = opts.voiceURI;
  if (!enabled) stop();
}

export function voicesFor(l) {
  refreshVoices();
  return voices.filter((v) => norm(v.lang).startsWith(l));
}

function chooseVoice() {
  const list = voicesFor(lang);
  if (!list.length) return null;
  const chosen = list.find((v) => v.voiceURI === voiceURI);
  if (chosen) return chosen;
  for (const code of PREFERRED[lang] || []) {
    const match =
      list.find((v) => norm(v.lang) === code && v.localService) || list.find((v) => norm(v.lang) === code);
    if (match) return match;
  }
  return list[0];
}

/** Speak text. Resolves when finished (or on a safety timeout; some browsers never fire onend). */
export function say(text) {
  if (!synth || !enabled || !text) return Promise.resolve();
  const mine = ++token;
  synth.cancel();
  return new Promise((resolve) => {
    let timer;
    const finish = () => {
      clearTimeout(timer);
      resolve();
    };
    // Chrome sometimes drops an utterance queued in the same tick as cancel().
    setTimeout(() => {
      if (mine !== token) return finish();
      const u = new SpeechSynthesisUtterance(text);
      const voice = chooseVoice();
      if (voice) u.voice = voice;
      u.lang = voice?.lang || (lang === 'hi' ? 'hi-IN' : 'en-IN');
      u.rate = 0.9;
      u.pitch = 1.15;
      u.onend = finish;
      u.onerror = finish;
      timer = setTimeout(finish, 2000 + text.length * 110);
      synth.speak(u);
      if (synth.paused) synth.resume();
    }, 60);
  });
}

export function stop() {
  token++;
  synth?.cancel();
}

/** iOS only allows speech after a user gesture; call this from the first tap. */
export function prime() {
  if (!synth) return;
  const u = new SpeechSynthesisUtterance(' ');
  u.volume = 0;
  synth.speak(u);
}

export const supported = !!synth;
