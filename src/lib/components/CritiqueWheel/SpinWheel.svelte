<!--
  @component
  SpinWheel – an SVG-based spinning wheel used by the Critique Wheel classroom
  tool.  Pass an array of `items` and call the exported `spin(targetIndex)`
  method (via `bind:this`) to animate the wheel to the chosen segment.

  Props:
  - items        {string[]} – labels for each pie segment
  - doneIndices  {number[]} – segment indices to render at reduced opacity (already used)
  - label        {string}   – accessible heading shown above the wheel
  - onSpinComplete {() => void} – called once the spin animation finishes
-->
<script>
  import { tick } from 'svelte';

  let {
    items = [],
    doneIndices = [],
    label = '',
    onSpinComplete = () => {},
  } = $props();

  /* ─── Layout constants ──────────────────────────────────────────────── */
  const SIZE = 400;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const R = SIZE / 2 - 18;
  const SPIN_DURATION = 3500; // ms

  /* ─── Segment colours (cycles if more segments than colours) ────────── */
  const COLORS = [
    '#0033a1',
    '#e63946',
    '#2a9d8f',
    '#e9c46a',
    '#f4a261',
    '#264653',
    '#c77dff',
    '#457b9d',
    '#d62828',
    '#06d6a0',
  ];

  /* ─── Internal state ────────────────────────────────────────────────── */
  let rotation = $state(0);
  let isSpinning = $state(false);
  let transitionReady = $state(false);
  let highlightedIndex = $state(null);

  /* ─── Derived display helpers ───────────────────────────────────────── */
  const fontSize = $derived(
    Math.max(9, Math.min(15, 160 / Math.max(1, items.length)))
  );
  const maxChars = $derived(
    Math.max(5, Math.floor(90 / Math.max(1, items.length)))
  );

  /* ─── SVG geometry helpers ──────────────────────────────────────────── */

  /** Returns the SVG `d` attribute for segment `index` of `total`. */
  function segmentPath(index, total) {
    if (total === 1) {
      // Full circle: approximate with two semicircles
      const top = { x: CX, y: CY - R };
      const bot = { x: CX, y: CY + R };
      return `M ${top.x} ${top.y} A ${R} ${R} 0 1 1 ${bot.x} ${bot.y} A ${R} ${R} 0 1 1 ${top.x} ${top.y} Z`;
    }
    const angle = (2 * Math.PI) / total;
    const start = index * angle - Math.PI / 2;
    const end = start + angle;
    const x1 = CX + R * Math.cos(start);
    const y1 = CY + R * Math.sin(start);
    const x2 = CX + R * Math.cos(end);
    const y2 = CY + R * Math.sin(end);
    const largeArc = angle > Math.PI ? 1 : 0;
    return `M ${CX} ${CY} L ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  }

  /** Returns the {x, y, rotate} for the text label of segment `index`. */
  function textPos(index, total) {
    if (total === 1) return { x: CX, y: CY, rotate: 0 };
    const angle = (2 * Math.PI) / total;
    const mid = index * angle - Math.PI / 2 + angle / 2;
    const textR = R * 0.62;
    return {
      x: CX + textR * Math.cos(mid),
      y: CY + textR * Math.sin(mid),
      rotate: (mid * 180) / Math.PI + 90,
    };
  }

  /** Truncates `text` to at most `maxLen` characters (adds ellipsis). */
  function truncate(text, maxLen) {
    return text.length > maxLen ? text.slice(0, maxLen - 1) + '…' : text;
  }

  /* ─── Public API ────────────────────────────────────────────────────── */

  /**
   * Animate the wheel and land on `targetIndex`.
   * Exported so the parent can call it via `bind:this`.
   */
  export async function spin(targetIndex) {
    if (isSpinning || items.length === 0) return;

    highlightedIndex = null;

    // 1. Enable the CSS transition BEFORE changing rotation
    transitionReady = true;
    await tick(); // let Svelte flush the DOM so the transition style is live

    // 2. Calculate target rotation
    const N = items.length;
    const segAngle = 360 / N;
    // Angular position of the target segment's centre, measured CW from 12-o'clock
    const centerAngle = targetIndex * segAngle + segAngle / 2;
    // How much additional CW rotation is needed to land the target at the top
    const currentMod = ((rotation % 360) + 360) % 360;
    const needed = (360 - ((centerAngle + currentMod) % 360)) % 360;
    const deltaR = (needed === 0 ? 360 : needed) + 5 * 360;

    isSpinning = true;
    rotation = rotation + deltaR;

    setTimeout(() => {
      isSpinning = false;
      highlightedIndex = targetIndex;
      onSpinComplete();
    }, SPIN_DURATION);
  }
</script>

<div class="wheel-wrapper" aria-label={label}>
  <!-- Label above the wheel -->
  {#if label}
    <div class="wheel-label">{label}</div>
  {/if}

  <!-- Fixed pointer at the top -->
  <div class="pointer-row">
    <span class="pointer" aria-hidden="true">▼</span>
  </div>

  <!-- SVG wheel -->
  <svg
    width={SIZE}
    height={SIZE}
    viewBox="0 0 {SIZE} {SIZE}"
    class="wheel-svg"
    role="img"
    aria-label="Spinning wheel with {items.length} option{items.length === 1
      ? ''
      : 's'}"
  >
    <g
      class="wheel-group"
      style="
        transform-origin: {CX}px {CY}px;
        transform: rotate({rotation}deg);
        {transitionReady
        ? `transition: transform ${SPIN_DURATION}ms cubic-bezier(0.17, 0.67, 0.12, 0.99);`
        : ''}
      "
    >
      {#each items as item, i (i)}
        <!-- Segment -->
        <path
          d={segmentPath(i, items.length)}
          fill={COLORS[i % COLORS.length]}
          stroke="white"
          stroke-width="2"
          opacity={doneIndices.includes(i) ? 0.25 : 1}
        />
        <!-- Label -->
        {@const pos = textPos(i, items.length)}
        <text
          x={pos.x}
          y={pos.y}
          text-anchor="middle"
          dominant-baseline="middle"
          fill="white"
          font-weight="bold"
          font-size={fontSize}
          transform="rotate({pos.rotate}, {pos.x}, {pos.y})"
          opacity={doneIndices.includes(i) ? 0.35 : 1}
          style="pointer-events: none"
        >
          {truncate(item, maxChars)}
        </text>
      {/each}

      <!-- Centre cap -->
      <circle cx={CX} cy={CY} r="22" fill="#f5f5f5" />
      <circle cx={CX} cy={CY} r="19" fill="white" />
    </g>

    <!-- Static outer ring for polish -->
    <circle
      cx={CX}
      cy={CY}
      r={R + 3}
      fill="none"
      stroke="#e0e0e0"
      stroke-width="3"
      opacity="0.5"
    />
  </svg>

  <!-- Result badge: empty placeholder before spin, filled after -->
  <div
    class="result-badge"
    class:empty={highlightedIndex === null}
    class:filled={highlightedIndex !== null}
    role="status"
    aria-live="polite"
  >
    {highlightedIndex !== null && items[highlightedIndex]
      ? items[highlightedIndex]
      : ' '}
  </div>
</div>

<style lang="scss">
  @use '../../styles' as *;

  .wheel-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.4rem;
  }

  .wheel-label {
    font-family: var(--font-sans);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
    color: var(--color-text);
    text-transform: uppercase;
    letter-spacing: var(--letter-spacing-wider);
    opacity: 0.65;
  }

  .pointer-row {
    height: 0;
    position: relative;
    width: 100%;
    display: flex;
    justify-content: center;
    z-index: 5;
  }

  .pointer {
    font-size: 1.75rem;
    color: var(--color-dark);
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
    line-height: 1;
    transform: translateY(8px);
    display: block;
  }

  .wheel-svg {
    max-width: 100%;
    height: auto;
    display: block;
  }

  .result-badge {
    font-family: var(--font-serif);
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    padding: 0.35rem 1.25rem;
    border-radius: 4rem;
    text-align: center;
    max-width: 100%;
    min-width: 6rem;
    word-break: break-word;

    &.empty {
      background: transparent;
      border: 2px dashed var(--color-border);
      color: transparent;
    }

    &.filled {
      background: var(--color-accent);
      color: white;
      border: 2px solid var(--color-accent);
      animation: pop-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
  }

  @keyframes pop-in {
    from {
      transform: scale(0.4);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }
</style>
