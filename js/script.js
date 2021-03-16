const code = {
  '.-': 'А',
  '-...': 'Б',
  '.--': 'В',
  '--.': 'Г',
  '-..': 'Д',
  '.': 'Е',
  '...-': 'Ж',
  '--..': 'З',
  '..': 'И',
  '.---': 'Й',
  '-.-': 'К',
  '.-..': 'Л',
  '--': 'М',
  '-.': 'Н',
  '---': 'О',
  '.--.': 'П',
  '.-.': 'Р',
  '...': 'С',
  '-': 'Т',
  '..-': 'У',
  '..-.': 'Ф',
  '....': 'Х',
  '-.-.': 'Ц',
  '---.': 'Ч',
  '----': 'Ш',
  '--.-': 'Щ',
  '-.--': 'Ы',
  '-..-': 'Ь',
  '..-..': 'Э',
  '..--': 'Ю',
  '.-.-': 'Я',

  '.----': '1',
  '..---': '2',
  '...--': '3',
  '....-': '4',
  '.....': '5',
  '-....': '6',
  '--...': '7',
  '---..': '8',
  '----.': '9',
  '-----': '0',

  '-...-': '=',
  '......': '.',
  '.-.-.-': ',',
  '..--..': '?',
  '-..-.': '/',
  '--..--': '!',
  '...-.-': '<u>SK</u>',
  '.-.-.': '<u>AP</u>',
  // '-.-.-': '<u>CT</u>',
  // '.--.-.': '@',
  // '.--.-': '&Aring,',
  '........': '<u>ERR</u>',
  // '.-...': '<u>AS</u>',
};

//
let volume;
let dotLength; // 60 * 1000 ms / 50 dot

let signalBegin;
let signalEnd;
let charTimer;

let lastChar = '';

const dots = new Array(5);
const dashes = new Array(5);

let isPressed = false;

// Trainer
const down = () => {
  gainNode.gain.value = volume;

  signalBegin = Date.now();

  led.style.backgroundColor = 'rgb(221, 221, 221)';

  isWordSpace();

  clearTimeout(charTimer);

  isPressed = true;
};

const up = (e) => {
  if (e.button !== 0 || !isPressed) {
    return;
  }

  gainNode.gain.value = 0;

  signalEnd = Date.now();

  led.style.backgroundColor = 'rgb(238, 238, 238)';

  const diff = signalEnd - signalBegin;

  if (diff > dotLength * 2) {
    lastChar += '-';

    dashes.shift();
    dashes.push(diff);
  } else {
    lastChar += '.';

    dots.shift();
    dots.push(diff);
  }

  updateStatus();

  charTimer = setTimeout(charSpace, dotLength * 2); // is inter character space

  isPressed = false;
};

const charSpace = () => {
  if (code[lastChar]) {
    appendOutput(code[lastChar]);
  } else {
    appendOutput('*');
  }

  lastChar = '';
};

const isWordSpace = () => {
  if (signalBegin - signalEnd > dotLength * 5) {
    appendOutput(' ');

    lastChar = '';
  }
};

const appendOutput = (str) => {
  output.innerHTML += str;
};

const updateStatus = () => {
  const dotAvg = dots.reduce((a, c) => a + c) / dots.length;
  const dashAvg = dashes.reduce((a, c) => a + c) / dashes.length;

  const ratio = (dashAvg / dotAvg).toFixed(1);
  const effSpeed = (3600 / dashAvg).toFixed();

  outputRatio.textContent = `Соотношение: ${ratio}; `;
  outputEffSpeed.textContent = `эфф. Скорость: ${effSpeed} гр/мин`;
};

// Oscillator
const audioCtx = new AudioContext();

const oscillator = audioCtx.createOscillator();
oscillator.start();

const gainNode = audioCtx.createGain();
gainNode.gain.value = 0;

oscillator.connect(gainNode);
gainNode.connect(audioCtx.destination);

// Settings
const showSettings = () => {
  if (!settingsLayer.hidden) {
    return;
  }

  transmitLayer.hidden = true;
  settingsLayer.hidden = false;
};

const hideSettings = () => {
  settingsLayer.hidden = true;
  transmitLayer.hidden = false;
};

// Settings - Storage
const updateVolume = () => {
  volume = inputVolume.value / 100;
};

const updateFrequency = () => {
  oscillator.frequency.value = inputFrequency.value;
};

const updateSpeed = () => {
  outputSpeed.textContent = `Скорость: ${inputSpeed.value} гр/мин; `;

  dotLength = 1200 / inputSpeed.value;
};

const volumeChanged = () => {
  updateVolume();

  localStorage.setItem('volume', this.value);
};

const frequencyChanged = () => {
  updateFrequency();

  localStorage.setItem('frequency', this.value);
};

const speedChanged = () => {
  updateSpeed();

  localStorage.setItem('speed', this.value);
};

// Init
// Elements
const transmitLayer = document.querySelector('#transmit');
const settingsLayer = document.querySelector('#settings');

const led = document.getElementsByTagName('body')[0];
const outputSpeed = transmitLayer.querySelector('#speed-output');
const outputRatio = transmitLayer.querySelector('#ratio-output');
const outputEffSpeed = transmitLayer.querySelector('#effspeed-output');
const output = transmitLayer.querySelector('#output');

const inputVolume = settingsLayer.querySelector('#volume-input');
const inputFrequency = settingsLayer.querySelector('#frequency-input');
const inputSpeed = settingsLayer.querySelector('#speed-input');

const settingsClose = settingsLayer.querySelector('input[type=button]');

//
inputVolume.value = localStorage.getItem('volume') || '10';
inputFrequency.value = localStorage.getItem('frequency') || '700';
inputSpeed.value = localStorage.getItem('speed') || '10';

updateVolume();
updateFrequency();
updateSpeed();

dots.fill(dotLength);
dashes.fill(dotLength * 3);

updateStatus();

// Events
window.addEventListener('mousedown', down);
window.addEventListener('mouseup', up);

inputVolume.addEventListener('change', volumeChanged);
inputFrequency.addEventListener('change', frequencyChanged);
inputSpeed.addEventListener('change', speedChanged);
settingsClose.addEventListener('click', hideSettings);

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    showSettings();
  }
});
window.addEventListener('touchstart', showSettings);

// First visit
if (audioCtx.state === 'suspended') {
  window.addEventListener('mousedown', () => audioCtx.resume(), {once: true});
}
