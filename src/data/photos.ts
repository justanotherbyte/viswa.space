export interface PhotoInfo {
	taken: string;
	// focal length (35mm equivalent), aperture, shutter speed and ISO
	exposure: string[];
	alt: string;
}

// Keyed by the number in each src/assets/photos/img_N.jpg filename.
// `taken` and `exposure` come from the photo's EXIF data.
export const photoInfo: Record<number, PhotoInfo> = {
	0: { taken: '2023-10-21', exposure: ['120mm', 'f/2.4', '1/60s', 'ISO 32'], alt: 'A wet side street lined with shops and plants' },
	1: { taken: '2023-10-19', exposure: ['56mm', 'f/2.4', '1/600s', 'ISO 16'], alt: 'A tall residential tower against a blue sky' },
	2: { taken: '2023-10-19', exposure: ['33mm', 'f/1.8', '1/4s', 'ISO 125'], alt: 'City lights seen from high above at night' },
	3: { taken: '2023-10-23', exposure: ['56mm', 'f/2.4', '1/1033s', 'ISO 16'], alt: 'Rock shelves and scattered blocks along a dry riverbed' },
	4: { taken: '2023-10-23', exposure: ['69mm', 'f/2.4', '1/378s', 'ISO 16'], alt: "The Space Shuttle replica Independence mounted on NASA's 747 carrier aircraft" },
	5: { taken: '2023-10-23', exposure: ['52mm', 'f/2.4', '1/941s', 'ISO 16'], alt: 'A weir across a wide river below forested hills' },
	6: { taken: '2023-10-23', exposure: ['56mm', 'f/2.4', '1/1033s', 'ISO 16'], alt: 'A rocky riverbed under green hills' },
	7: { taken: '2023-09-16', exposure: ['28mm', 'f/1.8', '1/1091s', 'ISO 20'], alt: 'A long stone facade beside a tree-lined street' },
	8: { taken: '2024-07-22', exposure: ['28mm', 'f/1.8', '1/4s', 'ISO 125'], alt: 'A lunar module hanging in a museum hall' },
	9: { taken: '2024-07-25', exposure: ['28mm', 'f/1.8', '1/15s', 'ISO 80'], alt: 'Astronaut figures and a lunar rover on a model moon surface' },
	10: { taken: '2023-10-19', exposure: ['33mm', 'f/1.8', '1/4s', 'ISO 125'], alt: 'A city at night seen from a tall building' },
	11: { taken: '2023-10-18', exposure: ['52mm', 'f/2.4', '1/8s', 'ISO 200'], alt: 'A crowded alley lit by red lanterns' },
	12: { taken: '2023-10-18', exposure: ['52mm', 'f/2.4', '1/60s', 'ISO 50'], alt: 'Red lanterns above a busy shopping street' },
	13: { taken: '2024-06-27', exposure: ['28mm', 'f/1.8', '1/1675s', 'ISO 20'], alt: 'Large white letters spelling IMPERIAL on a campus plaza' },
	14: { taken: '2023-10-23', exposure: ['28mm', 'f/1.8', '1/9804s', 'ISO 25'], alt: 'Sunlight on a lake beneath hazy hills' },
	15: { taken: '2024-07-25', exposure: ['28mm', 'f/1.8', '1/16s', 'ISO 80'], alt: 'Screens in a darkened mission control room' },
	16: { taken: '2023-10-23', exposure: ['28mm', 'f/1.8', '1/120s', 'ISO 64'], alt: 'A wooden gate at the foot of steep stone steps' },
	17: { taken: '2023-10-18', exposure: ['28mm', 'f/1.8', '1/7s', 'ISO 100'], alt: 'Lanterns in a dim wooden interior' },
	18: { taken: '2023-10-19', exposure: ['28mm', 'f/1.8', '1/11s', 'ISO 100'], alt: 'A giant golden steel sphere suspended inside a building' },
	19: { taken: '2023-09-16', exposure: ['64mm', 'f/2.4', '1/1799s', 'ISO 16'], alt: 'An ornate gothic memorial spire under clouds' },
	20: { taken: '2024-07-22', exposure: ['28mm', 'f/1.8', '1/39s', 'ISO 25'], alt: 'A rocket stage displayed in a hangar' },
	21: { taken: '2023-10-19', exposure: ['52mm', 'f/2.4', '1/8s', 'ISO 250'], alt: 'Sloping concrete and glass in a lit building interior' },
	22: { taken: '2023-10-18', exposure: ['52mm', 'f/2.4', '1/120s', 'ISO 20'], alt: 'A paper lantern with Chinese characters glowing at night' },
	23: { taken: '2024-07-25', exposure: ['51mm', 'f/1.8', '1/6s', 'ISO 100'], alt: 'A spacecraft module seen end on in a museum' },
	24: { taken: '2023-10-23', exposure: ['52mm', 'f/2.4', '1/60s', 'ISO 32'], alt: 'A carved wooden gate under trees' },
	25: { taken: '2023-10-21', exposure: ['28mm', 'f/1.8', '1/185s', 'ISO 20'], alt: 'A narrow market street with flags overhead' },
	26: { taken: '2024-07-22', exposure: ['28mm', 'f/1.8', '1/30s', 'ISO 32'], alt: 'Large rocket engine nozzles on display' },
	27: { taken: '2023-09-16', exposure: ['47mm', 'f/1.8', '1/1675s', 'ISO 20'], alt: 'A bronze statue of a rider on a rearing horse' },
	28: { taken: '2024-06-27', exposure: ['28mm', 'f/1.8', '1/2433s', 'ISO 20'], alt: 'Glass-fronted buildings around a busy plaza' },
	29: { taken: '2022-10-21', exposure: ['52mm', 'f/2.4', '1/1297s', 'ISO 16'], alt: 'Looking up between the stone columns of a classical building' },
	30: { taken: '2023-09-16', exposure: ['65mm', 'f/2.4', '1/991s', 'ISO 16'], alt: 'A round red-brick concert hall beside a tall chimney' },
	31: { taken: '2023-10-18', exposure: ['28mm', 'f/1.8', '1/571s', 'ISO 20'], alt: 'Rooftops above a hazy bay at dusk' },
	32: { taken: '2024-07-25', exposure: ['28mm', 'f/1.8', '1/9s', 'ISO 100'], alt: 'A Space Shuttle model on a display stand' },
	33: { taken: '2023-10-18', exposure: ['52mm', 'f/2.4', '1/30s', 'ISO 100'], alt: 'A covered alley of shops hung with red lanterns' },
	34: { taken: '2023-09-16', exposure: ['33mm', 'f/1.8', '1/4049s', 'ISO 20'], alt: 'A round red-brick concert hall with a domed roof' },
	35: { taken: '2024-07-22', exposure: ['28mm', 'f/1.8', '1/15s', 'ISO 40'], alt: 'A spherical tank inside a spacecraft structure' },
	36: { taken: '2023-10-18', exposure: ['28mm', 'f/1.8', '1/15s', 'ISO 64'], alt: 'A shop-lined alley lit by lanterns after dark' },
	37: { taken: '2023-10-20', exposure: ['52mm', 'f/2.4', '1/40s', 'ISO 80'], alt: 'A vendor lifting steamed buns from a bamboo steamer' },
	38: { taken: '2023-10-18', exposure: ['52mm', 'f/2.4', '1/17s', 'ISO 160'], alt: 'A hillside teahouse lit by lanterns at night' },
	39: { taken: '2024-07-25', exposure: ['40mm', 'f/1.8', '1/4s', 'ISO 320'], alt: 'A rocket model hanging in a dark gallery' },
	40: { taken: '2023-10-23', exposure: ['48mm', 'f/1.8', '1/1946s', 'ISO 20'], alt: 'A rice field below green hills' },
	41: { taken: '2023-10-17', exposure: ['28mm', 'f/1.8', '1/17s', 'ISO 40'], alt: 'A temple courtyard with lanterns at night' },
	42: { taken: '2023-10-18', exposure: ['50mm', 'f/1.8', '1/15s', 'ISO 40'], alt: 'A teahouse balcony lit by lanterns at night' },
	43: { taken: '2024-07-25', exposure: ['28mm', 'f/1.8', '1/24s', 'ISO 640'], alt: 'A space capsule displayed in a dark hall' },
	44: { taken: '2023-10-19', exposure: ['52mm', 'f/2.4', '1/12s', 'ISO 160'], alt: 'A skyscraper lit up against the night sky' },
	45: { taken: '2023-10-16', exposure: ['28mm', 'f/1.8', '1/140s', 'ISO 20'], alt: 'Red and yellow flowers in a garden display' },
	46: { taken: '2023-10-20', exposure: ['66mm', 'f/2.4', '1/8s', 'ISO 200'], alt: 'A lit glass building at night' },
	47: { taken: '2024-07-22', exposure: ['47mm', 'f/1.8', '1/1412s', 'ISO 20'], alt: 'Cattle sheltering under a roof in a grassy field' },
};
