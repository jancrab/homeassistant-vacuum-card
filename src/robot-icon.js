import { svg } from 'lit';

// Original SVG artwork. Motion is CSS-only and follows confirmed robot state.
export function robotIcon(mode) {
  const marker = {
    charging: svg`<path class="charge" d="m17 17-4 6h4l-2 6 7-8h-5l2-4Z" fill="currentColor" stroke="none"/>`,
    paused: svg`<path d="M14 20v6m5-6v6" stroke-width="2.5"/>`,
    error: svg`<path d="M16 19v5m0 3v.1" stroke-width="2.5"/>`,
    offline: svg`<path d="m11 19 10 8"/>`,
    returning: svg`<path d="m12 23 4-4 4 4m-7-1v5h6v-5"/>`,
    docked: svg`<path d="m12 23 3 3 6-6"/>`,
    idle: svg`<path d="M13 23h6"/>`,
    cleaning: svg`<g class="brush"><path d="M16 19v8m-4-4h8M13 20l6 6m0-6-6 6"/></g>`,
  }[mode];
  return svg`<svg class="robot robot-${mode}" viewBox="0 8 32 28" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <g class="robot-body"><circle cx="16" cy="22" r="11" fill="var(--card-background-color, #fff)"/><path d="M7 17h18"/><rect x="12" y="11" width="8" height="5" rx="2" fill="var(--card-background-color, #fff)"/>${marker}</g>
  </svg>`;
}
