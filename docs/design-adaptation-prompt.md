# Kopierfertiger Prompt für ein anderes Card-Projekt

Ersetze die Angaben in eckigen Klammern. Gib dem anderen Projekt zusätzlich `design-style.md` und nach Möglichkeit einen Screenshot der gewünschten Wetterkartenansicht als visuelle Referenz.

```text
Passe die bestehende Home-Assistant-Custom-Card in diesem Projekt an den visuellen Stil von Origami Weather an: sleek, atmosphärisch, minimalistisch, mit weichen räumlichen Hintergründen, klarer Typografie und dezenten zustandsabhängigen Animationen.

Projekt: [Name / Repository / lokaler Pfad]
Gerät oder Zweck: [z. B. Licht, Klima, Lüfter, Solar, Medien]
Wichtigste Aktion: [z. B. Temperatur einstellen]
Wichtigste Werte: [z. B. Isttemperatur, Solltemperatur, Betriebsmodus]
Passendes Hintergrundmotiv: [eigene Idee oder selbst passend zum Gerät auswählen]
Zusätzliche gewünschte Funktionen: [Liste oder keine]
Unbedingt beizubehalten: [Funktionen, YAML-Kompatibilität, Layoutoptionen]

Nutze den beigefügten Design-Leitfaden als konkrete Grundlage. Referenzprojekt: https://github.com/hazymorning/origami_weather. Es geht um dessen ruhige visuelle Sprache und atmosphärische Tiefe. Entwickle dafür eine eigenständige, zum Zweck dieser Card passende Szene. Erhalte bestehende Herkunfts- und Lizenzhinweise, falls du Code oder Assets übernimmst.

Arbeite direkt im vorhandenen Projekt und setze den Umbau vollständig um. Prüfe zuerst Struktur, Projektanweisungen, Datenquellen, Services, Lizenz, vorhandene Tests und Editor. Erhalte funktionierende Features und bestehende Konfiguration, soweit kein ausdrücklicher Änderungswunsch dagegen spricht. Frage nur nach Informationen, die für korrekte Funktionen wirklich fehlen; entscheide reversible Gestaltungsdetails selbst.

Design:
- Atmosphärischer Minimalismus: ein klarer Hauptwert, verständlicher Kontext, wenige gut erreichbare Aktionen.
- Eine passende Grundszene, beispielsweise diffuser Lichtkegel für Licht, sanfte Wärme-/Kühlschichten für Klima, Strömung für Lüfter oder Horizont und Leistungsfluss für Solar.
- Weiche Farbverläufe, dezente Tiefe, zurückhaltende Innenflächen, konsistente Icons. Kein zusätzliches Dekor ohne funktionalen Grund.
- HA-Theme-Schriften und -Farben übernehmen; eigene Szenenfarben als überschreibbare CSS-Variablen. Light und Dark ausdrücklich ausarbeiten.
- Hauptwert groß, Einheit kleiner, Sekundärwerte sauber ausgerichtet. Tabellarische Ziffern für Live-Werte und ein konsistentes 4/8/12/16/24/32-px-Abstandssystem.
- Hintergrund darf den Inhalt nie überstrahlen. Text, Fokus, Icons und Status müssen in allen Zuständen gut erkennbar sein.

Bewegung:
- Animation an tatsächlichen Gerätezustand koppeln. Keine Aktivität oder Messung erfinden.
- Ein dominantes Bewegungssystem; Bedienrückmeldung kurz und eindeutig, Atmosphäre langsam und zurückhaltend.
- CSS/SVG bevorzugen, Canvas nur bei echtem Bedarf. Keine schweren animierten Blur-Flächen.
- Unsichtbare Cards und versteckte Tabs pausieren. prefers-reduced-motion respektieren, einschließlich Canvas und SVG-SMIL.

Usability und Home Assistant:
- Hauptaktionen direkt sichtbar, seltene Optionen einklappbar. Mindestens 44 × 44 px für Bedienelemente, echte Buttons und sichtbarer Tastaturfokus.
- Optionale Werte über verständliche Schalter im visuellen Editor anbieten. Native HA-Selektoren verwenden und deren Initialisierung berücksichtigen.
- Lade-, Fehler-, Offline- und fehlende Datenzustände sauber gestalten. Unbekannt nicht als 0 oder Aus ausgeben.
- Nur tatsächlich unterstützte Features, Attribute, Einheiten und Services verwenden. Pending-Zustand vom bestätigten Gerätezustand unterscheiden.
- Relevante Updates auch bei wiederverwendetem hass-Objekt erkennen. Abonnements, Timer und Observer bei Konfigurationswechsel und Entfernen bereinigen.
- Keine unnötigen Abhängigkeiten oder CDN-Laufzeitimporte. Notwendige Bibliotheken lokal bündeln.

Prüfung und Lieferung:
- Vollständig funktionierenden Code, angepassten Editor und kurze Dokumentation liefern.
- Lokale Vorschau mit klar als simuliert gekennzeichneten Daten erstellen, falls noch keine vorhanden ist.
- Light/Dark, 280/360/480 px Card-Breite, lange Namen, fehlende Daten, schnelle Zustandswechsel und reduzierte Bewegung prüfen.
- Sinnvolle Tests für Funktionsänderungen und bestehende Projektchecks ausführen. Gerenderte Darstellung im Browser kontrollieren.
- Abschließend die wichtigsten Änderungen, Testresultate und noch nicht in echtem HA geprüfte Punkte kurz nennen. Einen Screenshot oder eine nutzbare Vorschau verlinken.
- Nicht automatisch veröffentlichen oder ein Release erzeugen, sofern das nicht bereits beauftragt wurde.
```
