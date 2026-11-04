# Zonnestelsel

Een 3D-reis langs de Zon en de acht planeten, in de browser. Je vliegt van stop naar stop en bij elke planeet staan de echte cijfers: diameter, hoe lang een dag en een jaar duren, en hoe lang het zonlicht erover doet.

**Live:** https://parisangelopoulos.com/zonnestelsel/

## Wat er te zien is

- **Elke planeet is getekend met shaders.** Er zitten geen afbeeldingen in. De oppervlakken (de wolkenbanden van Jupiter, de continenten en stadslichten van de Aarde, de poolkappen van Mars) komen uit ruis die de grafische kaart live berekent.
- **Een kokende Zon met gloed (bloom).**
- **De ringen van Saturnus**, met de Cassinikloof en de schaduw van de planeet erop.
- **Een planetoïdengordel** van ruim 2.000 brokken steen tussen Mars en Jupiter.
- **Warp-strepen en een bredere blik** tijdens het vliegen, met een teller die de afstand tot de Zon laat oplopen.
- **Twinkelende sterren**, een nevel op de achtergrond en af en toe een vallende ster.
- **Een overzicht** van het hele stelsel van bovenaf. Klik op een planeet om erheen te vliegen.

## Bediening

Scroll, gebruik de pijltjestoetsen, veeg op je telefoon, klik op de tijdlijn of klik op een planeet. Met een link als `#saturnus` begin je meteen bij die planeet.

## Techniek

- [three.js](https://threejs.org/) 0.170 (MIT) met de EffectComposer en UnrealBloomPass, meegeleverd in `vendor/` zodat er niets van een CDN komt
- Eigen GLSL-shaders voor de Zon, de planeten, de wolken, de atmosferen, de ringen en de sterren (`js/shaders.js`), met 3D-simplexruis van Ashima Arts (MIT)
- Lettertypes: Instrument Serif en IBM Plex Mono (SIL Open Font License), ook meegeleverd
- Geen build-stap: gewone ES-modules met een import map

De afstanden en groottes in de 3D-scène zijn ingekort, anders zou je bijna niets zien. De cijfers in de teksten komen uit de planetaire factsheets van NASA.

## Lokaal draaien

Elke simpele webserver werkt, bijvoorbeeld:

```bash
python3 -m http.server 8000
```

Open daarna http://localhost:8000.
