/**
 * @fileoverview iPod Generation Technical Documentation
 *
 * Research-backed specifications for the 2008 iPod generation.
 * Data sourced from Apple Technical Specifications, EveryMac, The Apple Wiki,
 * Wikipedia, iFixit, Reddit repair communities, and AppleDB.
 *
 * @module lib/ipod-revision-data
 */

/**
 * @typedef {Object} IpodModelSpec
 * @property {string} model - Marketing name (e.g. "iPod Classic Late 2008")
 * @property {string} generation - Internal generation identifier
 * @property {string} releaseDate - Original release date
 * @property {string} discontinuationDate - When Apple ended sales
 * @property {string} codename - Internal Apple codename if known
 * @property {string} manufacturer - OEM manufacturer
 * @property {string} soC - System on Chip
 * @property {string} cpu - CPU architecture and clock speed
 * @property {string} [gpu] - GPU if applicable
 * @property {string} ram - RAM capacity
 * @property {string} storage - Storage configurations
 * @property {string} display - Display specifications
 * @property {string} audioCodec - Audio codec chip
 * @property {string} battery - Battery chemistry and endurance
 * @property {string} initialOs - Initial shipping OS/firmware
 * @property {string} finalOs - Last supported OS/firmware
 * @property {string} connectivity - Ports and wireless
 * @property {string[]} sensors - Available sensors
 * @property {string} dimensions - Physical dimensions and weight
 * @property {string[]} codecs - Supported media codecs
 * @property {string} designNotes - Industrial design characteristics
 * @property {string[]} sources - Citation sources
 */

/** @type {IpodModelSpec} */
export const IPOD_CLASSIC_LATE_2008_SPEC = {
	model: "iPod Classic (Late 2008)",
	generation: "7th Generation / 6th Gen Rev A",
	releaseDate: "September 9, 2008",
	discontinuationDate: "September 9, 2014",
	codename: "N/A",
	manufacturer: "Foxconn",
	soC: "Samsung S5L8702 (ARM-based)",
	cpu: "ARM-based embedded",
	ram: "64 MB DRAM",
	storage: "120 GB (initial), 160 GB (2009 revision) — 4200 RPM ATA-66 HDD",
	display: '2.5" QVGA LCD, 320×240 @ 163 PPI, LED backlight',
	audioCodec: "Cirrus Logic (transitioned from Wolfson Microelectronics)",
	battery: "Li-Ion, 36 hours audio / 6 hours video",
	initialOs: "Pixo OS 2.0",
	finalOs: "Pixo OS 2.0.4",
	connectivity: "USB 2.0 (Sync & Charge), FireWire (Charge Only), 30-pin dock connector",
	sensors: [],
	dimensions: "4.1 × 2.4 × 0.41 inches, 4.9 oz",
	codecs: [
		"AAC (16–320 Kbps)",
		"Protected AAC",
		"MP3 (16–320 Kbps)",
		"Apple Lossless",
		"WAV",
		"AIFF",
		"Audible formats 2–4",
		"H.264 up to 2.5 Mbps (640×480 @ 30fps)",
		"MPEG-4 Simple Profile",
		"JPEG, BMP, GIF, TIFF, PSD (Mac), PNG",
	],
	designNotes:
		"All-metal anodized aluminum unibody with black or silver finish. " +
		"Introduced Genius playlist functionality and support for Apple In-Ear Headphones with Remote and Mic via firmware 2.0.1 (November 2008).",
	sources: [
		"Apple Technical Specifications",
		"EveryMac",
		"The Apple Wiki",
		"Wikipedia",
		"AppleDB",
	],
};

/** @type {IpodModelSpec} */
export const IPOD_TOUCH_2G_SPEC = {
	model: "iPod Touch (2nd Generation)",
	generation: "2nd Generation",
	releaseDate: "September 9, 2008",
	discontinuationDate: "June 7, 2010",
	codename: "N72",
	manufacturer: "Foxconn",
	soC: "Samsung S5L8720 (ARMv6 architecture)",
	cpu: "ARMv6 533 MHz",
	gpu: "PowerVR SGX535",
	ram: "128 MB DRAM",
	storage: "8, 16, or 32 GB flash memory",
	display: '3.5" multi-touch, 480×320 @ 165 PPI, LED-backlit TN TFT LCD, 800:1 contrast ratio',
	audioCodec: "Cirrus Logic",
	battery: "Li-Ion, 36 hours audio / 6 hours video",
	initialOs: "iPhone OS 2.1.1",
	finalOs: "iOS 4.2.1 (November 18, 2010)",
	connectivity: "Wi-Fi 802.11b/g, Bluetooth 2.1 + EDR, 30-pin dock connector",
	sensors: ["3-axis Accelerometer", "Ambient light sensor"],
	dimensions: "110 × 58 × 7.1 mm, 115g",
	codecs: [
		"AAC (16–320 Kbps)",
		"Protected AAC",
		"MP3 (16–320 Kbps)",
		"Apple Lossless",
		"WAV",
		"AIFF",
		"Audible formats 2–4",
		"H.264 up to 2.5 Mbps (640×480 @ 30fps)",
		"MPEG-4 Simple Profile",
		"JPEG, BMP, GIF, TIFF, PSD (Mac), PNG",
	],
	designNotes:
		"Tapered chrome back design, integrated volume buttons, built-in speaker, and Nike+ functionality.",
	sources: [
		"Apple Technical Specifications",
		"EveryMac",
		"The Apple Wiki",
		"Wikipedia",
		"iFixit",
		"AppleDB",
	],
};

/** @type {IpodModelSpec} */
export const IPOD_NANO_4G_SPEC = {
	model: "iPod nano (4th Generation)",
	generation: "4th Generation",
	releaseDate: "September 9, 2008",
	discontinuationDate: "September 9, 2009",
	codename: "N58",
	manufacturer: "Foxconn",
	soC: "Samsung S5L8720 (variant shared with iPod Touch 2G)",
	cpu: "ARM-based (frequency undocumented)",
	ram: "32 MB DRAM",
	storage: "8 GB or 16 GB (4 GB limited European release) flash",
	display: '2.0" LCD, 240×320 portrait, 204 PPI, blue-white LED backlight',
	audioCodec: "Cirrus Logic CS42L58",
	battery: "240 mAh Li-Po, 24 hours audio / 4 hours video",
	initialOs: "Proprietary OS 1.0",
	finalOs: "Proprietary OS 1.0.4",
	connectivity: "USB 2.0 (30-pin connector), 3.5mm headphone — FireWire charging removed",
	sensors: ["Accelerometer (Cover Flow and shake-to-shuffle)"],
	dimensions: "90.7 × 38.7 × 6.2 mm, 36.8g",
	codecs: [
		"AAC (16–320 Kbps)",
		"Protected AAC",
		"MP3 (16–320 Kbps)",
		"Apple Lossless",
		"WAV",
		"AIFF",
		"Audible formats 2–4",
		"H.264 up to 2.5 Mbps (640×480 @ 30fps)",
		"MPEG-4 Simple Profile",
		"JPEG, BMP, GIF, TIFF, PSD (Mac), PNG",
	],
	designNotes:
		"Return to 'skinny' elongated aluminum form factor with curved edges and glass screen " +
		"(held in place by internal components only).",
	sources: [
		"Apple Technical Specifications",
		"EveryMac",
		"The Apple Wiki",
		"Wikipedia",
		"iFixit",
		"AppleDB",
	],
};

/**
 * Firmware ecosystem summary for the 2008 generation.
 * @type {Record<string, string>}
 */
export const FIRMWARE_ECOSYSTEM_2008 = {
	classic:
		"Pixo OS (Apple's proprietary embedded OS), versions 1.0–2.0.4. " +
		"The OS was built by Pixo, a company Apple acquired. Firmware updates distributed as .ipsw files.",
	touch: "iPhone OS (later iOS), versions 2.1.1 through 4.2.1, sharing codebase with iPhone 3G.",
	nano: "Lightweight proprietary OS with version numbers 1.0–1.0.4.",
};

/**
 * Maps a RE:MIX preset ID to its technical documentation spec.
 * @type {Record<string, IpodModelSpec | undefined>}
 */
export const PRESET_ID_TO_SPEC = {
	"classic-2008-black": IPOD_CLASSIC_LATE_2008_SPEC,
	"classic-2008-silver": IPOD_CLASSIC_LATE_2008_SPEC,
	"classic-2009": {
		...IPOD_CLASSIC_LATE_2008_SPEC,
		model: "iPod Classic (Late 2009)",
		generation: "7th Generation / 6th Gen Rev B",
		storage: "160 GB — 4200 RPM ATA-66 HDD",
		designNotes:
			"Late thin revision with tighter wheel and calmer screen chrome. " +
			"The 160GB capacity arrived in 2009 with the same Samsung S5L8702 SoC and Pixo OS ecosystem.",
	},
};

/**
 * Returns the technical spec entry for a given preset ID.
 *
 * @param {string} presetId
 * @returns {IpodModelSpec | undefined}
 */
export function getRevisionSpec(presetId: string): typeof IPOD_CLASSIC_LATE_2008_SPEC | undefined {
	return (
		PRESET_ID_TO_SPEC as Record<string, typeof IPOD_CLASSIC_LATE_2008_SPEC | undefined>
	)[presetId];
}

/**
 * Returns a human-readable summary string suitable for UI notes.
 *
 * @param {string} presetId
 * @returns {string}
 */
export function getRevisionNotes(presetId: string): string {
	const spec = getRevisionSpec(presetId);
	if (!spec) return "iPod Classic revision with museum-grade fidelity.";
	return `${spec.model} — ${spec.soC}, ${spec.ram}, ${spec.display}`;
}
