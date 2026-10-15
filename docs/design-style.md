# Eigene Home-Assistant-Cards im Origami-Stil

## Gestaltungsziel

**Atmosphärischer Minimalismus:** Eine ruhige, räumlich wirkende Szene vermittelt den Zustand. Klar gesetzte Zahlen und wenige gut erreichbare Bedienelemente machen die Karte im Alltag nützlich. Der Hintergrund ist ein Teil der Information, bleibt aber hinter dem Inhalt.

Visuelle Referenz ist [Origami Weather von hazymorning](https://github.com/hazymorning/origami_weather). Verwende diese Sprache als bevorzugte Gestaltungsrichtung für neue Cards und entwickle eine zum Gerät passende eigene Szene. Explizite Designwünsche und die Gestaltung einer vorgegebenen Ausgangskarte haben Vorrang. Der Initialisierungs-Starter zeigt zunächst nur eine Entität; die Szene und Gerätesteuerung entstehen bei der anschließenden Implementierung.

## 1. Anatomie einer Karte

1. **Szene:** weicher Hintergrund, Lichtquelle oder eine einfache Illustration; vermittelt Zustand und Tageszeit.
2. **Hauptwert:** eine große, präzise Zahl oder ein klarer Status. Einheit kleiner und direkt daneben.
3. **Kontext:** Gerätename, Raum oder verständliche Zustandsbeschreibung.
4. **Schnellinformation:** eine kompakte Zeile mit drei bis fünf vergleichbaren Werten.
5. **Bedienung:** wenige primäre Aktionen mit mindestens 44 × 44 px Trefferfläche; seltene Optionen in Details oder Editor.

Der visuelle Schwerpunkt darf je nach Card wechseln. Eine Klimakarte braucht Temperatur und Sollwertbedienung zentral; eine Wetterkarte braucht Gegenwart und Ausblick. Keine dekorative Szene zwischen Benutzer und wichtigster Aktion platzieren.

## 2. Form, Typografie und Abstände

| Baustein | Ausgangspunkt | Anwendung |
| --- | --- | --- |
| Außenradius | HA-Theme-Radius, Fallback 16 px | Teil des Dashboards bleiben |
| Innenflächen | 12–16 px Radius | Nur zusammengehörige Informationen gruppieren |
| Kartenabstand innen | 16–24 px | Auf schmalen Cards eher 16 px |
| Abstandssystem | 4, 8, 12, 16, 24, 32 px | Wenige wiederkehrende Größen |
| Hauptwert | 36–48 px, Gewicht 500–600 | Visuelle Priorität ohne übermäßige Fettschrift |
| Sekundärwerte | 17–24 px | Vergleichbare Werte gleich setzen |
| Beschriftung | 12–14 px | Gute Lesbarkeit vor maximaler Dichte |
| Kleine Einheiten | 11–12 px | Immer verständlich und ausreichend kontrastreich |
| Zahlen | `font-variant-numeric: tabular-nums` | Keine springenden Spalten bei Live-Updates |

Schrift vom HA-Theme erben. Die Referenz zeigt Montserrat als optionale Theme-Schrift; nicht für jede Karte eine zusätzliche Webfont nachladen. Icons bleiben aus einer konsistenten Familie. Die Originalkarte verwendet unter anderem animierte Lucide-inspirierte Wettersymbole; Lizenzhinweise beim Übernehmen erhalten.

## 3. Theme-Tokens statt fest verdrahteter Farben

```css
:host {
  font-family: var(--ha-font-family-body, inherit);
  color: var(--primary-text-color);
  --card-radius: var(--ha-card-border-radius, 16px);
  --card-surface: var(--ha-card-background, var(--card-background-color));
  --card-muted: var(--secondary-text-color);
  --card-accent: var(--primary-color);
  --card-line: color-mix(in srgb, var(--primary-text-color) 13%, transparent);
  --card-soft: color-mix(in srgb, var(--card-surface) 82%, transparent);
}
.scene { border-radius: var(--card-radius); overflow: hidden; }
.content { position: relative; z-index: 2; }
.inset { background: var(--card-soft); border: 1px solid var(--card-line); }
```

Eine eigene Hintergrundpalette darf mit der Gerätefunktion zusammenhängen. Dafür separate Light-/Dark-Variablen anbieten; Akzentfarbe und Textkontrast an das Theme koppeln. Bei eigener Nacht-Szene muss die Textfarbe zur Szene passen, auch wenn das Dashboard insgesamt hell ist.

Die Origami-Wetterkarte stellt beispielsweise `--origami-text-light`, `--origami-text-dark`, `--origami-default-bg-light`, `--origami-default-bg-dark` und `--origami-card-border-radius` bereit. Diese Variablen sind Referenzbeispiele, keine Abhängigkeiten für neue Cards. Namen in neuen Projekten mit einem eigenen Präfix versehen und die HA-Theme-Werte als Fallback verwenden.

## 4. Hintergründe, die zum Gerät passen

| Card | Ruhige Grundszene | Zustandsabhängige Bewegung | Darstellung bei „aus“ |
| --- | --- | --- | --- |
| Licht | Diffuser Lichtkegel oder beleuchtete Wand | Helligkeit verändert Lichtintensität; echte Farbtemperatur beeinflusst Wärme | Ruhige unbeleuchtete Fläche |
| Klima/Heizung | Weiches, leicht getöntes Raumvolumen | Dezente Wärmeschichten nur bei aktivem Heizen, kühler Luftzug bei Kühlen | Neutrale Szene, aktueller Wert bleibt sichtbar |
| Lüfter/Luftreiniger | Feine Strömungslinien | Geschwindigkeit folgt tatsächlich gemeldeter Stufe; Partikel nur als abstraktes Motiv | Bewegung stoppt |
| Energie/Solar | Horizont, stilisierte Dachfläche oder Lichtscheibe | Kurze Flussbewegung entlang realer Leistungsrichtung | Statische Konturen, keine erfundene Produktion |
| Medien | Unscharfe Farben aus verfügbarem Cover oder ruhiges Spotlight | Langsamer Lichtwechsel bei Wiedergabe | Bewegung pausiert; Cover bleibt |
| Rollladen | Vereinfachtes Fenster mit Tageslicht | Öffnung folgt gemeldeter Position | Tatsächliche Position statisch darstellen |
| Garten/Bewässerung | Blatt-Silhouette und weicher Bodenverlauf | Tropfen ausschließlich bei aktivem Ventil | Ruhige Pflanzenfläche |

**Konkrete Hintergrundrezepte:**

- **Licht:** zwei große radiale Verläufe mit niedriger Sättigung, ein schwacher Lichtkegel. Im Dark-Theme schwarzer Grund mit lokalem Licht, im Light-Theme helle Fläche mit sanfter Färbung. Keine dauernd pulsierende Lampe.
- **Klima:** ein diagonal verlaufender weicher Farbsaum. Wärmere Farben für bestätigtes Heizen, kühlere für bestätigtes Kühlen. Solltemperaturänderung allein ist noch kein aktiver Heizvorgang.
- **Solar:** zurückhaltende Horizontsilhouette und ein Lichtpunkt. Flussrichtung als kleine bewegte Markierung; Leistung numerisch daneben. Bei fehlenden Daten keine Aktivitätsanimation.
- **Medien:** lokal verfügbares Cover stark weichzeichnen und abdunkeln; darüber gut lesbare Transporttasten. Für fehlendes Cover ein statisches, zum Theme passendes Spotlight.

Nicht jede Card braucht Canvas. CSS-Verläufe und ein kleines SVG reichen häufig. Aufwendige Partikel nur einsetzen, wenn sie einen Zustand verständlicher machen. Hintergrund, Dimmlayer und Inhalt als getrennte Ebenen führen; dekorative Ebenen bekommen `pointer-events: none` und `aria-hidden="true"`.

## 5. Bewegung mit Bedeutung

- Ein dominantes Bewegungssystem pro Card. Eine Wetterkarte hat Wetter und Himmel; eine Energiecard braucht keinen zusätzlichen Sternenhimmel.
- Langsame Atmosphäre, direkte Bedienrückmeldung: etwa 150–220 ms für Zustandswechsel, mehrere Sekunden für einen ruhigen Hintergrundzyklus.
- Bevorzugte Bewegungseigenschaften sind `transform` und `opacity`. Große animierte Blur-Filter vermeiden.
- Außerhalb des sichtbaren Bereichs und bei verborgenem Browser-Tab Animationen pausieren.
- Bei `prefers-reduced-motion: reduce` eine vollständige statische Darstellung liefern. Canvas-Schleifen stoppen und gegebenenfalls SVG-SMIL pausieren; CSS allein stoppt SMIL nicht.
- Interaktionsanimation bestätigt einen Klick, aber niemals einen noch nicht bestätigten Gerätezustand. Während eines Serviceaufrufs einen klaren Zwischenzustand anzeigen.

## 6. Mehr Usability ohne Stilbruch

Eine Stunden-Wetterübersicht ist ein mögliches Muster: fünf sauber ausgerichtete Zeitspalten, darunter eine gemeinsame Niederschlagsfläche. Das Auge kann erst Zeit, dann Zustand, Temperatur und Niederschlag vergleichen. Wahrscheinlichkeit und Menge bleiben getrennt beschriftet.

Für andere Cards:

- Hauptaktion direkt sichtbar; Expertenoptionen einklappbar.
- Native HA-Selektoren im Editor verwenden; Grundlagen zuerst, Erscheinungsbild danach.
- Optionale Werte mit echten Schaltern ein-/ausblendbar machen.
- Keine Daten als `0` ersetzen. „Nicht verfügbar“, „Keine Daten“ und „Aus“ sind unterschiedliche Zustände.
- Aktivstatus nicht nur durch Farbe vermitteln; Text oder Icon ergänzen.
- Klickbare Flächen als echte Buttons mit Tastaturfokus bauen. Keine unsichtbaren Gesten als einzige Bedienung.
- Informationen auf 280, 360 und 480 px Kartenbreite prüfen. Containerbreite zählt, nicht nur Browserbreite.
- Bei vielen Details Inhalt wachsen lassen oder bewusst aufteilen. Keine abgeschnittenen Werte und keine unbemerkte horizontale Scrollpflicht.

## 7. Vorgehen beim Umbau einer bestehenden Card

1. Bestehende Funktionen, Konfiguration, HA-Services, Datenquellen und Lizenz erfassen.
2. Einen realistischen Standardzustand sowie Offline-, Lade-, Fehler- und Grenzfälle festlegen.
3. Hauptwert, Hauptaktion und sekundäre Werte priorisieren.
4. Eine gerätespezifische Szene aus der Tabelle auswählen und mit Theme-Tokens definieren.
5. Zuerst die statische Light-/Dark-Ansicht funktional umsetzen, dann dezente Bewegung ergänzen.
6. Editor und YAML kompatibel halten; neue Optionen mit sicheren Defaults ergänzen.
7. Bei identischer `hass`-Objektreferenz trotzdem relevante State-Änderungen erkennen. Abonnements, Observer und Timer beim Entfernen freigeben.
8. Mit realen Daten testen, soweit verfügbar. Mock-Vorschauen sichtbar als Simulation kennzeichnen.

## Abnahmekriterien

- Hintergrund und Typografie wirken zusammengehörig; Hauptwert und Hauptaktion sind sofort erkennbar.
- Die Card passt in das aktive HA-Theme und bleibt in hellen wie dunklen Szenen lesbar.
- Keine Funktion der Ausgangskarte geht unbeabsichtigt verloren.
- Optionale Messwerte, fehlende Daten und Fehler sind verständlich behandelt.
- Alle wichtigen Aktionen sind per Tastatur bedienbar; Fokus bleibt sichtbar.
- Schmale Card, reduzierte Bewegung und unsichtbarer Tab wurden geprüft.
- Laufzeitcode und benötigte Bibliotheken sind lokal gebündelt; keine unerwarteten externen Fonts oder Skripte.
- Herkunft und Lizenzen kopierter Bestandteile bleiben dokumentiert.

Den fertigen Arbeitsauftrag findest du in [design-adaptation-prompt.md](design-adaptation-prompt.md).
