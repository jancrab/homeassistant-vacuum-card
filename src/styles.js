import { css } from 'lit';

export const cardStyles = css`
  :host { display: block; container-type: inline-size; color: var(--primary-text-color, #202b2a); font-family: var(--ha-font-family-body, var(--paper-font-body1_-_font-family, inherit)); --vacuum-accent: var(--primary-color, #00796b); --vacuum-muted: var(--secondary-text-color, #626b69); --vacuum-line: var(--divider-color, #dce1de); --vacuum-error: var(--error-color, #b3261e); }
  * { box-sizing: border-box; }
  ha-card { display: block; overflow: hidden; background: var(--ha-card-background, var(--card-background-color, #fff)); border: 1px solid var(--ha-card-border-color, var(--vacuum-line)); border-radius: var(--ha-card-border-radius, 20px); box-shadow: var(--ha-card-box-shadow, none); }
  button { font: inherit; color: inherit; cursor: pointer; min-height: 44px; border: 0; }
  button:focus-visible { outline: 2px solid var(--vacuum-accent); outline-offset: 3px; }
  button:disabled { cursor: default; }
  .hero { position: relative; padding: 24px; isolation: isolate; background: radial-gradient(ellipse at 100% 0%, color-mix(in srgb, var(--vacuum-accent) 12%, transparent), transparent 70%); }
  .hero::before { content: ''; position: absolute; width: 160px; height: 160px; border: 1px solid color-mix(in srgb, var(--vacuum-accent) 16%, transparent); border-radius: 50%; right: -70px; top: -65px; z-index: -1; pointer-events: none; }
  .heading { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
  .name { font-size: 14px; color: var(--vacuum-muted); overflow-wrap: anywhere; }
  .details { display: grid; place-items: center; width: 44px; flex: 0 0 44px; border-radius: 50%; background: color-mix(in srgb, var(--vacuum-accent) 9%, transparent); color: var(--vacuum-accent); }
  h1 { margin: 12px 0 0; font-size: clamp(28px, 9cqi, 40px); line-height: 1.15; font-weight: 500; letter-spacing: -.04em; overflow-wrap: anywhere; }
  .robot-state { margin: 8px 0 0; color: var(--vacuum-muted); font-size: 13px; }
  .stats { display: flex; flex-wrap: wrap; gap: 16px 24px; margin-top: 24px; }
  .stat { flex: 1 1 80px; min-width: 0; }
  .stat span { display: block; font-size: 12px; color: var(--vacuum-muted); margin-bottom: 4px; }
  .stat strong { font-size: 20px; font-weight: 500; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
  .progress { margin-top: 24px; }
  .progress-label { display: flex; justify-content: space-between; gap: 12px; font-size: 12px; color: var(--vacuum-muted); margin-bottom: 8px; }
  progress { display: block; width: 100%; height: 5px; border: 0; border-radius: 8px; overflow: hidden; background: color-mix(in srgb, var(--vacuum-accent) 12%, transparent); accent-color: var(--vacuum-accent); }
  progress::-webkit-progress-bar { background: color-mix(in srgb, var(--vacuum-accent) 12%, transparent); }
  progress::-webkit-progress-value { background: var(--vacuum-accent); border-radius: 8px; }
  progress::-moz-progress-bar { background: var(--vacuum-accent); }
  .rooms-section { padding: 20px 24px 24px; border-top: 1px solid var(--vacuum-line); }
  h2 { margin: 0; font-size: 14px; font-weight: 600; }
  .hint { margin: 6px 0 16px; font-size: 12px; line-height: 1.5; color: var(--vacuum-muted); }
  .rooms { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
  .room { display: flex; flex-direction: column; align-items: flex-start; text-align: left; gap: 12px; padding: 16px; border-radius: 14px; border: 1px solid var(--vacuum-line); background: transparent; min-width: 0; transition: background 160ms ease; }
  .room:not(:disabled):hover { background: color-mix(in srgb, var(--vacuum-accent) 7%, transparent); border-color: var(--vacuum-accent); }
  .room ha-icon { color: var(--vacuum-accent); }
  .room span { font-size: 14px; font-weight: 500; overflow-wrap: anywhere; max-width: 100%; }
  .room small { color: var(--vacuum-muted); font-size: 11px; line-height: 1.4; overflow-wrap: anywhere; }
  .room:disabled ha-icon { color: var(--vacuum-muted); }
  .room[aria-busy=true] { background: color-mix(in srgb, var(--vacuum-accent) 10%, transparent); }
  .alerts { padding: 0 24px 16px; }
  .alert { display: flex; gap: 12px; align-items: flex-start; background: color-mix(in srgb, var(--vacuum-error) 8%, transparent); border: 1px solid color-mix(in srgb, var(--vacuum-error) 30%, transparent); padding: 12px; border-radius: 12px; margin-top: 8px; font-size: 13px; line-height: 1.5; overflow-wrap: anywhere; }
  .alert ha-icon { color: var(--vacuum-error); flex-shrink: 0; }
  .alert strong { display: block; }
  .alert.unavailable { background: transparent; border-color: var(--vacuum-line); }
  .alert.unavailable ha-icon { color: var(--vacuum-muted); }
  .feedback { margin: 16px 0 0; font-size: 13px; line-height: 1.5; overflow-wrap: anywhere; }
  .feedback:empty { display: none; }
  .feedback.error { color: var(--vacuum-error); }
  @container (min-width: 440px) { .wide .rooms { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
  @container (max-width: 300px) { .hero, .rooms-section { padding: 16px; } .alerts { padding: 0 16px 16px; } .room { padding: 12px; } }
  @media (prefers-reduced-motion: reduce) { .room { transition: none; } }
`;
