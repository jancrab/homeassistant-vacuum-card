# Vacuum Card

Home Assistant dashboard card for vacuum entities. The initial scaffold displays the vacuum state and opens its details. Cleaning controls, maps and integration-specific features are not implemented yet.

## Install with HACS

[![Open in HACS](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=jancrab&repository=homeassistant-vacuum-card&category=plugin)

After the repository is published publicly, add it as a custom Dashboard repository in HACS, download the card and reload the browser. Check the module resource: `/hacsfiles/homeassistant-vacuum-card/homeassistant-vacuum-card.js`.

## Manual installation

Copy `dist/homeassistant-vacuum-card.js` to `/config/www/`. Register `/local/homeassistant-vacuum-card.js?v=0.1.0` as a JavaScript module under Settings > Dashboards > Resources, then reload. On updates replace the file and update the version query on the existing resource.

```yaml
type: custom:homeassistant-vacuum-card
entity: vacuum.example
layout: compact # or wide
```

Choose the entity and layout in the visual editor. An optional name overrides friendly_name. Theme colors, card background, borders and typography use Home Assistant variables.

## Design guidance

The starter includes a reusable [design style guide](docs/design-style.md) and [adaptation prompt](docs/design-adaptation-prompt.md), both in German. They describe atmospheric minimalism, Home Assistant theme integration, device-specific backgrounds, restrained animation and accessible controls. Apply them when implementing the card UI, while honoring explicit design requirements. The initial scaffold remains a small entity display.

## Development

```sh
npm install
npm run check
npm run dev
```

Commit the generated package-lock.json and dist bundle. Later installs use npm ci. Open http://127.0.0.1:4173 for the real built card with simulated state. Tests and previews do not prove real-device behavior.

Read [AGENTS.md](AGENTS.md) and [the working guide](docs/working-guide.md) for editor, device and release lessons. For an authorized release, synchronize package/lock versions and changelog, rebuild and tag v0.1.0. GitHub workflows test/build, validate HACS for public repos and publish the JavaScript release asset.

MIT; see LICENSE.
