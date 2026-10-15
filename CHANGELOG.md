# Changelog

## 0.3.0

- Add a small animated robot icon for cleaning, returning and confirmed charging, with static docked, paused, idle, error and offline symbols.
- Add an optional charging binary-sensor mapping to the visual editor; docked alone never implies charging.
- Make compact layout substantially denser while retaining room labels, error messages and 44 px button targets.
- Pause animation outside the viewport and in hidden tabs, honor reduced motion and clean up observers/listeners on disconnect.

## 0.2.0

- Add configurable room tiles for existing cleaning buttons/scripts, with names, icons and visual-editor add/remove/reorder controls.
- Show robot status, battery, optional cleaning progress, cleaned area/time, water shortage and vacuum/dock errors.
- Report unavailable data, prevent concurrent calls and show action failures with retry support.
- Add theme-native compact/wide layouts and an interactive simulated demo with light/dark, narrow, offline and error states.
- Verify actions, state updates, metrics, alerts and editor changes with mocks; real Home Assistant/device verification remains outstanding.

## 0.1.0

- Initial card scaffold with entity picker, compact/wide layout, visual editor, theme variables, simulated preview and HACS build/release setup.
- Domain-specific controls and real Home Assistant testing remain part of implementation.
