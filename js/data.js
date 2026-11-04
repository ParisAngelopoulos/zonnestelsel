// The stops of the trip. Sizes and distances in the scene are not to scale (otherwise you would
// see nothing at all); the numbers in "stats" are the real ones (NASA planetary fact sheets).
// orbit: radius in the scene, size: radius in the scene, angle: start position on the orbit (degrees)

export const STOPS = [
  {
    id: 'zon', name: 'De Zon', kind: 'Ster', size: 8, orbit: 0,
    km: 0, light: null,
    intro: 'Een gloeiende bol waterstof en helium, zo groot dat er 1,3 miljoen aardes in passen. Alles in het zonnestelsel draait om haar heen.',
    stats: [['Diameter', '1.392.700 km'], ['Oppervlak', '5.500 °C'], ['Kern', '15 miljoen °C'], ['Leeftijd', '4,6 miljard jaar']],
    fact: 'De Zon bevat 99,8% van alle massa in het zonnestelsel. Alle planeten samen zijn een afrondingsfout.',
  },
  {
    id: 'mercurius', name: 'Mercurius', kind: 'Planeet 1', size: 0.6, orbit: 16, angle: 40, type: 0,
    colors: ['#8c8580', '#5e5955', '#b5aea6'], km: 57.9e6, light: '3 min 13 s',
    intro: 'De kleinste planeet en de snelste: in 88 dagen is ze rond de Zon. Zonder lucht om warmte vast te houden is het er bloedheet of ijskoud.',
    stats: [['Diameter', '4.879 km'], ['Een jaar', '88 dagen'], ['Een dag', '176 aardse dagen'], ['Temperatuur', '−173 tot 427 °C']],
    fact: 'Van zonsopkomst tot zonsopkomst duurt op Mercurius twee keer zo lang als een heel jaar.',
  },
  {
    id: 'venus', name: 'Venus', kind: 'Planeet 2', size: 1.0, orbit: 22, angle: 150, type: 1,
    colors: ['#e9cf95', '#c58f4e', '#f6e6c0'], atmosphere: '#ffcf8a', km: 108.2e6, light: '6 min',
    intro: 'Bijna even groot als de Aarde, maar onder een deken van zwavelzuurwolken. Het broeikaseffect maakt haar de heetste planeet van allemaal.',
    stats: [['Diameter', '12.104 km'], ['Een jaar', '225 dagen'], ['Een dag', '243 aardse dagen'], ['Temperatuur', '464 °C']],
    fact: 'Venus draait achterstevoren: daar komt de Zon op in het westen.',
  },
  {
    id: 'aarde', name: 'De Aarde', kind: 'Planeet 3', size: 1.05, orbit: 30, angle: 250, type: 2,
    colors: ['#0b3a6b', '#2f6a3a', '#c9b98a'], atmosphere: '#6fb3ff', km: 149.6e6, light: '8 min 20 s', moon: true,
    intro: 'De enige plek waarvan we weten dat er leven is. Ruim 70% van het oppervlak is water, en de Maan houdt haar as stabiel.',
    stats: [['Diameter', '12.742 km'], ['Een jaar', '365,25 dagen'], ['Een dag', '24 uur'], ['Manen', '1']],
    fact: 'Het zonlicht dat je nu ziet, vertrok ruim acht minuten geleden van de Zon.',
  },
  {
    id: 'mars', name: 'Mars', kind: 'Planeet 4', size: 0.75, orbit: 38, angle: 320, type: 3,
    colors: ['#b5532c', '#7a2f1a', '#d98b5f'], atmosphere: '#ff9a6a', km: 227.9e6, light: '12 min 40 s',
    intro: 'Een koude woestijn vol roestig stof. Ooit stroomde er water; nu rijden er robots rond die naar sporen van leven zoeken.',
    stats: [['Diameter', '6.779 km'], ['Een jaar', '687 dagen'], ['Een dag', '24 u 37 min'], ['Manen', '2']],
    fact: 'Olympus Mons is ongeveer 22 km hoog: bijna drie keer de Mount Everest.',
  },
  {
    id: 'jupiter', name: 'Jupiter', kind: 'Planeet 5', size: 4.0, orbit: 60, angle: 80, type: 4,
    colors: ['#d8b98f', '#a5683f', '#f1e4cf'], atmosphere: '#e8c9a0', km: 778.5e6, light: '43 min',
    intro: 'Een reus van gas, twee keer zo zwaar als alle andere planeten bij elkaar. Zijn strepen zijn wolkenbanden die met honderden km/u langs elkaar razen.',
    stats: [['Diameter', '139.820 km'], ['Een jaar', '11,9 jaar'], ['Een dag', '9 u 56 min'], ['Manen', 'meer dan 90']],
    fact: 'De Grote Rode Vlek is een storm die groter is dan de Aarde en al zeker 150 jaar woedt.',
  },
  {
    id: 'saturnus', name: 'Saturnus', kind: 'Planeet 6', size: 3.4, orbit: 80, angle: 200, type: 5,
    colors: ['#e3cf9f', '#b8955d', '#f4e9c8'], atmosphere: '#f0dcae', km: 1.43e9, light: '1 u 20 min', rings: { inner: 1.25, outer: 2.35, tilt: 26.7, color: '#d9c9a3' },
    intro: 'De ringen zijn gemaakt van miljarden brokken ijs en steen, van stofkorrel tot huizenblok. Ze zijn 280.000 km breed en vaak maar 10 meter dik.',
    stats: [['Diameter', '116.460 km'], ['Een jaar', '29,4 jaar'], ['Een dag', '10 u 33 min'], ['Manen', 'meer dan 270']],
    fact: 'Saturnus is lichter dan water: in een groot genoeg bad zou hij blijven drijven.',
  },
  {
    id: 'uranus', name: 'Uranus', kind: 'Planeet 7', size: 2.2, orbit: 98, angle: 300, type: 6, tilt: 97.8,
    colors: ['#9fd9e0', '#6fb7c6', '#c8eef0'], atmosphere: '#a8f0ff', km: 2.87e9, light: '2 u 40 min', rings: { inner: 1.7, outer: 1.95, tilt: 0, color: '#8fa7ad', faint: true },
    intro: 'Een ijsreus die op zijn kant ligt, waarschijnlijk na een botsing lang geleden. Daardoor duurt een zomer aan één pool 42 jaar.',
    stats: [['Diameter', '50.724 km'], ['Een jaar', '84 jaar'], ['Een dag', '17 u 14 min'], ['Temperatuur', '−195 °C']],
    fact: 'Uranus was de eerste planeet die met een telescoop werd ontdekt, in 1781.',
  },
  {
    id: 'neptunus', name: 'Neptunus', kind: 'Planeet 8', size: 2.1, orbit: 114, angle: 20, type: 7,
    colors: ['#2b52c8', '#16307e', '#5c85ea'], atmosphere: '#5a8cff', km: 4.5e9, light: '4 u 10 min',
    intro: 'De verste planeet, donker en koud. Toch is het er allesbehalve rustig: hier waaien de hardste winden van het zonnestelsel.',
    stats: [['Diameter', '49.244 km'], ['Een jaar', '165 jaar'], ['Een dag', '16 u 6 min'], ['Wind', 'ruim 2.000 km/u']],
    fact: 'Neptunus werd eerst met wiskunde gevonden: astronomen berekenden waar hij moest staan, en daar zat hij.',
  },
  {
    id: 'overzicht', name: 'Het hele stelsel', kind: 'Overzicht', overview: true, km: null,
    intro: 'Acht planeten, honderden manen en miljoenen planetoïden. Klik op een planeet om erheen te vliegen.',
    stats: [['Planeten', '8'], ['Breedte', '9 miljard km'], ['Licht erdoorheen', 'ruim 8 uur'], ['Ontstaan', '4,6 miljard jaar geleden']],
    fact: 'In werkelijkheid zijn de afstanden veel groter: als de Zon een voetbal is, ligt de Aarde 24 meter verderop en Neptunus ruim 700 meter.',
  },
];
