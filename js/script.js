let code =
{
	".-":		"А",
	"-...":		"Б",
	".--":		"В",
	"--.":		"Г",
	"-..":		"Д",
	".":		"Е",
	"...-":		"Ж",
	"--..":		"З",
	"..":		"И",
	".---":		"Й",
	"-.-":		"К",
	".-..":		"Л",
	"--":		"М",
	"-.":		"Н",
	"---":		"О",
	".--.":		"П",
	".-.":		"Р",
	"...":		"С",
	"-":		"Т",
	"..-":		"У",
	"..-.":		"Ф",
	"....":		"Х",
	"-.-.":		"Ц",
	"---.":		"Ч",
	"----":		"Ш",
	"--.-":		"Щ",
	"-.--":		"Ы",
	"-..-":		"Ь",
	"..-..":	"Э",
	"..--":		"Ю",
	".-.-":		"Я",

	".----":	"1",
	"..---":	"2",
	"...--":	"3",
	"....-":	"4",
	".....":	"5",
	"-....":	"6",
	"--...":	"7",
	"---..":	"8",
	"----.":	"9",
	"-----":	"0",

	"-...-":	"=",
	"......":	".",
	".-.-.-":	",",
	"..--..":	"?",
	"-..-.":	"/",
	"--..--":	"!",
	"...-.-":	"<u>SK</u>",
	".-.-.":	"<u>AP</u>",
	// "-.-.-":	"<u>CT</u>",
	// ".--.-.":	"@",
	// ".--.-":	"&Aring,",
	"........":	"<u>ERR</u>"
	// ".-...":	"<u>AS</u>"
};

// Elements
let transmit_layer;
let settings_layer;

let led;
let speed_output;
let ratio_output;
let effspeed_output;
let output;

//
let volume;
let dot_length; // 60 * 1000 ms / 50 dot

let signal_begin;
let signal_end;
let char_timer;

let char_last = "";

let dots = new Array(5)
let dashes = new Array(5)

let not_pressed = true;

// Trainer
function Down(e)
{
	if (e.button != 0) { return; };
	if (transmit_layer.hidden) { return; };

	gainNode.gain.value = volume;

	signal_begin = Date.now();
	
	led.style.backgroundColor = "rgb(221, 221, 221)";

	IsWordSpace();
	
	clearTimeout(char_timer);

	not_pressed = false;
}

function Up(e)
{
	if (e.button != 0) { return; };
	if (not_pressed) { return; };

	gainNode.gain.value = 0;

	signal_end = Date.now();
	
	led.style.backgroundColor = "rgb(238, 238, 238)";

	let diff = signal_end - signal_begin;
	
	if (diff > dot_length * 2)
	{
		char_last += "-";

		dashes.shift(); 
		dashes.push(diff);
	}
	else
	{
		char_last += ".";

		dots.shift();
		dots.push(diff);
	}

	StatusUpdate();
	
	char_timer = setTimeout(CharSpace, dot_length * 2); // is inter character space

	not_pressed = true;
}

function CharSpace()
{
	if (code[char_last])
	{
		OutputAppend(code[char_last]);
	}
	else
	{
		OutputAppend("*");
	}
	
	char_last = "";
}

function IsWordSpace()
{
	if (signal_begin - signal_end > dot_length * 5)
	{
		OutputAppend(" ");
		
		char_last = "";
	}
}

function OutputAppend(str)
{
	output.innerHTML += str;
}

function StatusUpdate()
{
	let dot_avg = dots.reduce((a, c) => a + c) / dots.length;
	let dash_avg = dashes.reduce((a, c) => a + c) / dashes.length;

	let _ratio = (dash_avg / dot_avg).toFixed(1);
	let _effspeed = (3600 / dash_avg).toFixed();
	
	ratio_output.textContent = `Соотношение: ${_ratio}; `;
	effspeed_output.textContent = `эфф. Скорость: ${_effspeed} гр/мин`;
}

// Oscillator
let audioCtx = new AudioContext();

let oscillator = audioCtx.createOscillator();
oscillator.start();

let gainNode = audioCtx.createGain();
gainNode.gain.value = 0;

oscillator.connect(gainNode);
gainNode.connect(audioCtx.destination);

// Settings
function SettingsShow()
{
	if (!settings_layer.hidden) { return; }

	transmit_layer.hidden = true;
	settings_layer.hidden = false;
}

function SettingsHide()
{
	settings_layer.hidden = true;
	transmit_layer.hidden = false;
}

// Settings - Storage
function VolumeUpdate()
{
	volume = volume_input.value / 100;
}

function FrequencyUpdate()
{
	oscillator.frequency.value = frequency_input.value;
}

function SpeedUpdate()
{
	speed_output.textContent = `Скорость: ${speed_input.value} гр/мин; `;

	dot_length = 1200 / speed_input.value;
}

function VolumeChanged()
{
	VolumeUpdate();

	localStorage.setItem("volume", this.value);
}

function FrequencyChanged()
{
	FrequencyUpdate();

	localStorage.setItem("frequency", this.value);
}

function SpeedChanged()
{
	SpeedUpdate();

	localStorage.setItem("speed", this.value);
}

// Init
window.addEventListener("DOMContentLoaded", function()
{
	// Elements
	transmit_layer = document.querySelector("#transmit");
	settings_layer = document.querySelector("#settings");

	led = transmit_layer.querySelector("#led");
	speed_output = transmit_layer.querySelector("#speed-output");
	ratio_output = transmit_layer.querySelector("#ratio-output");
	effspeed_output = transmit_layer.querySelector("#effspeed-output");
	output = transmit_layer.querySelector("#output");

	volume_input = settings_layer.querySelector("#volume-input");
	frequency_input = settings_layer.querySelector("#frequency-input");
	speed_input = settings_layer.querySelector("#speed-input");

	let settings_close = settings_layer.querySelector("input[type=button]");

	//
	volume_input.value = localStorage.getItem("volume") || "10";
	frequency_input.value = localStorage.getItem("frequency") || "700";
	speed_input.value = localStorage.getItem("speed") || "10";

	VolumeUpdate();
	FrequencyUpdate();
	SpeedUpdate();
	
	dots.fill(dot_length);
	dashes.fill(dot_length * 3);

	StatusUpdate();

	// Events
	window.addEventListener("mousedown", Down);
	window.addEventListener("mouseup", Up);

	volume_input.addEventListener("change", VolumeChanged);
	frequency_input.addEventListener("change", FrequencyChanged);
	speed_input.addEventListener("change", SpeedChanged);
	settings_close.addEventListener("click", SettingsHide);

	window.addEventListener("keydown", (e) =>
	{
		if (e.key === "Escape")
		{
			SettingsShow();
		}
	});
	window.addEventListener("touchstart", SettingsShow);
});

// First visit
if (audioCtx.state === "suspended")
{
	window.addEventListener("mousedown", () => audioCtx.resume(), { once: true });
}
