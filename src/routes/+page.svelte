<!--
  @component
  Critique Wheel – an interactive classroom tool for managing critique sessions.

  Phases:
  1. Setup   – the instructor enters a list of student names
  2. Order   – the app randomises a presentation order for review
  3. Session – for each presenter the two wheels are spun to pick a critiquer
               and a critique type (Praise / Improvement / Question)
-->
<script>
  import SpinWheel from '$lib/components/CritiqueWheel/SpinWheel.svelte';

  /* ─── Critique type options ──────────────────────────────────────────── */
  const CRITIQUE_TYPES = ['🌟 Praise', '💡 Improvement', '❓ Question'];

  /* ─── Example class roster (replace with your actual students) ───────── */
  const DEFAULT_ROSTER =
    'Alice\nBob\nCarol\nDave\nEve\nFrank\nGrace\nHank\nIvy\nJack';

  /* ─── App phase ─────────────────────────────────────────────────────── */
  let phase = $state('setup');

  /* ─── Setup phase state ─────────────────────────────────────────────── */
  let rawInput = $state(DEFAULT_ROSTER);

  const parsedStudents = $derived(
    rawInput
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
  );

  const setupError = $derived(
    parsedStudents.length < 2
      ? 'Please enter at least two student names (one per line).'
      : ''
  );

  /* ─── Presentation order ────────────────────────────────────────────── */
  let presentationOrder = $state([]);

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function handleRandomise() {
    if (setupError) return;
    presentationOrder = shuffle(parsedStudents);
    phase = 'order';
  }

  function handleBeginSession() {
    currentIdx = 0;
    startRound();
    phase = 'session';
  }

  /* ─── Session state ─────────────────────────────────────────────────── */
  let currentIdx = $state(0);

  /** All audience members for the current round (everyone except the presenter). */
  let allAudience = $state([]);

  /** Indices (into allAudience) of students who have already given critique. */
  let doneAudienceIndices = $state([]);

  /** Accumulated results for this round. */
  let roundResults = $state([]);

  /** Whether the wheels are currently spinning. */
  let isSpinning = $state(false);

  /** Number of spin-complete callbacks received for the current press. */
  let spinsCompleted = $state(0);

  /** The audience-member index chosen by wheel 1 this press. */
  let selectedAudienceIdx = $state(null);

  /** The critique-type index chosen by wheel 2 this press. */
  let selectedTypeIdx = $state(null);

  /* Derived helpers */
  const currentPresenter = $derived(presentationOrder[currentIdx] ?? '');
  const roundComplete = $derived(
    doneAudienceIndices.length === allAudience.length && allAudience.length > 0
  );
  const sessionComplete = $derived(currentIdx >= presentationOrder.length);

  /** Indices of audience members still eligible to be picked this round. */
  const eligibleIndices = $derived(
    allAudience.map((_, i) => i).filter((i) => !doneAudienceIndices.includes(i))
  );

  /* ─── Wheel component refs ───────────────────────────────────────────── */
  let wheel1 = $state(null);
  let wheel2 = $state(null);

  /* ─── Session helpers ────────────────────────────────────────────────── */

  function startRound() {
    allAudience = presentationOrder.filter((_, i) => i !== currentIdx);
    doneAudienceIndices = [];
    roundResults = [];
    isSpinning = false;
    spinsCompleted = 0;
    selectedAudienceIdx = null;
    selectedTypeIdx = null;
  }

  function handleSpin() {
    if (isSpinning || roundComplete || eligibleIndices.length === 0) return;

    // Pick a random eligible audience member and a random critique type
    const poolIdx =
      eligibleIndices[Math.floor(Math.random() * eligibleIndices.length)];
    const typeIdx = Math.floor(Math.random() * CRITIQUE_TYPES.length);

    selectedAudienceIdx = poolIdx;
    selectedTypeIdx = typeIdx;
    spinsCompleted = 0;
    isSpinning = true;

    // Both wheels spin simultaneously for visual drama
    wheel1?.spin(poolIdx);
    wheel2?.spin(typeIdx);
  }

  function onWheel1Complete() {
    spinsCompleted += 1;
    checkBothDone();
  }

  function onWheel2Complete() {
    spinsCompleted += 1;
    checkBothDone();
  }

  function checkBothDone() {
    if (spinsCompleted < 2) return;
    // Record the result once both wheels have stopped
    doneAudienceIndices = [...doneAudienceIndices, selectedAudienceIdx];
    roundResults = [
      ...roundResults,
      {
        name: allAudience[selectedAudienceIdx],
        type: CRITIQUE_TYPES[selectedTypeIdx],
      },
    ];
    isSpinning = false;
  }

  function handleNextPresenter() {
    currentIdx += 1;
    if (currentIdx < presentationOrder.length) {
      startRound();
    }
  }

  function handleReset() {
    phase = 'setup';
    presentationOrder = [];
  }
</script>

<svelte:head>
  <title>Critique Wheel | CUNY Journalism</title>
  <meta
    name="description"
    content="An interactive classroom tool to manage critique sessions at the Craig Newmark Graduate School of Journalism."
  />
</svelte:head>

<!-- ══════════════════════════════════════════════════════════════════════
     SETUP PHASE
     ══════════════════════════════════════════════════════════════════════ -->
{#if phase === 'setup'}
  <div class="page setup-page">
    <header class="page-header">
      <div class="logo-bar">
        <span class="logo-text">CUNY</span>
        <span class="logo-sub">Journalism</span>
      </div>
      <h1 class="page-title">Critique Wheel</h1>
      <p class="page-subtitle">
        Enter the class roster to generate a random presentation order and run
        an interactive critique session.
      </p>
    </header>

    <div class="setup-card">
      <label class="field-label" for="students-input">
        Student names <span class="field-hint">(one per line)</span>
      </label>
      <textarea
        id="students-input"
        class="students-textarea"
        bind:value={rawInput}
        rows="12"
        placeholder="Alice&#10;Bob&#10;Carol&#10;…"
        spellcheck="false"
      ></textarea>

      {#if setupError}
        <p class="error-msg" role="alert">{setupError}</p>
      {:else}
        <p class="count-msg">
          {parsedStudents.length} student{parsedStudents.length === 1
            ? ''
            : 's'} entered
        </p>
      {/if}

      <button
        class="btn btn-primary btn-lg"
        onclick={handleRandomise}
        disabled={!!setupError}
      >
        🎲 Randomise Order
      </button>
    </div>
  </div>

  <!-- ══════════════════════════════════════════════════════════════════════
     ORDER PHASE
     ══════════════════════════════════════════════════════════════════════ -->
{:else if phase === 'order'}
  <div class="page order-page">
    <header class="page-header">
      <div class="logo-bar">
        <span class="logo-text">CUNY</span>
        <span class="logo-sub">Journalism</span>
      </div>
      <h1 class="page-title">Presentation Order</h1>
      <p class="page-subtitle">
        The order has been randomised. Review it below, then begin the session.
      </p>
    </header>

    <ol class="order-list">
      {#each presentationOrder as student, i (student)}
        <li class="order-item">
          <span class="order-num">{i + 1}</span>
          <span class="order-name">{student}</span>
        </li>
      {/each}
    </ol>

    <div class="order-actions">
      <button class="btn btn-secondary" onclick={handleRandomise}>
        🎲 Re-randomise
      </button>
      <button class="btn btn-primary btn-lg" onclick={handleBeginSession}>
        ▶ Begin Session
      </button>
    </div>
  </div>

  <!-- ══════════════════════════════════════════════════════════════════════
     SESSION PHASE
     ══════════════════════════════════════════════════════════════════════ -->
{:else if phase === 'session'}
  <div class="page session-page">
    {#if sessionComplete}
      <!-- All presenters done -->
      <div class="complete-screen">
        <div class="complete-emoji" aria-hidden="true">🎉</div>
        <h1 class="complete-title">Session Complete!</h1>
        <p class="complete-sub">
          Every student has presented. Great work, everyone.
        </p>
        <button class="btn btn-primary btn-lg" onclick={handleReset}>
          Start a New Session
        </button>
      </div>
    {:else}
      <!-- Presenter banner -->
      <div class="presenter-banner">
        <span class="presenter-label">Now Presenting</span>
        <span class="presenter-name">{currentPresenter}</span>
        <span class="round-badge">
          {currentIdx + 1} / {presentationOrder.length}
        </span>
      </div>

      <!-- Two wheels + spin button -->
      <div class="wheels-row">
        <div class="wheel-slot">
          <SpinWheel
            bind:this={wheel1}
            items={allAudience}
            doneIndices={doneAudienceIndices}
            label="Who critiques?"
            onSpinComplete={onWheel1Complete}
          />
        </div>

        <div class="spin-center">
          {#if !roundComplete}
            <button
              class="btn btn-spin"
              onclick={handleSpin}
              disabled={isSpinning || roundComplete}
              aria-label={isSpinning
                ? 'Wheels are spinning…'
                : 'Spin both wheels'}
            >
              {isSpinning ? '⏳' : '🎡'}<br />SPIN
            </button>
          {:else}
            <div class="round-done-icon" aria-hidden="true">✅</div>
          {/if}
        </div>

        <div class="wheel-slot">
          <SpinWheel
            bind:this={wheel2}
            items={CRITIQUE_TYPES}
            label="What type?"
            onSpinComplete={onWheel2Complete}
          />
        </div>
      </div>

      <!-- Critique log -->
      <div class="results-section">
        <h2 class="results-title">Critique log</h2>
        <ul class="results-list">
          {#each allAudience as student (student)}
            {@const result = roundResults.find((r) => r.name === student)}
            <li class="result-row" class:done={!!result}>
              <span class="result-check" aria-hidden="true">
                {result ? '✅' : '⬜'}
              </span>
              <span class="result-name">{student}</span>
              {#if result}
                <span class="result-type">{result.type}</span>
              {/if}
            </li>
          {/each}
        </ul>
      </div>

      <!-- Navigation controls -->
      <div class="session-footer">
        <button class="btn btn-secondary btn-sm" onclick={handleReset}>
          ↩ Reset
        </button>

        {#if roundComplete}
          {#if currentIdx + 1 < presentationOrder.length}
            <button
              class="btn btn-primary btn-lg"
              onclick={handleNextPresenter}
            >
              Next Presenter →
            </button>
          {:else}
            <button
              class="btn btn-primary btn-lg"
              onclick={handleNextPresenter}
            >
              Finish Session 🎉
            </button>
          {/if}
        {/if}
      </div>
    {/if}
  </div>
{/if}

<style lang="scss">
  @use '../lib/styles' as *;

  /* ── Shared page shell ──────────────────────────────────────────────── */
  .page {
    min-height: 100dvh;
    background: #111;
    color: var(--color-white);
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: var(--spacing-lg) var(--spacing-md);
    box-sizing: border-box;
  }

  /* ── Logo bar ───────────────────────────────────────────────────────── */
  .logo-bar {
    display: flex;
    align-items: baseline;
    gap: 0.4rem;
    margin-bottom: var(--spacing-xs);
  }

  .logo-text {
    font-family: var(--font-sans);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-extrabold);
    letter-spacing: var(--letter-spacing-wider);
    background: var(--color-accent);
    color: white;
    padding: 0.15rem 0.45rem;
    border-radius: 3px;
  }

  .logo-sub {
    font-family: var(--font-sans);
    font-size: var(--font-size-sm);
    opacity: 0.6;
    letter-spacing: var(--letter-spacing-wide);
    text-transform: uppercase;
  }

  /* ── Page header ────────────────────────────────────────────────────── */
  .page-header {
    text-align: center;
    margin-bottom: var(--spacing-lg);
  }

  .page-title {
    font-family: var(--font-serif);
    font-size: var(--font-size-6xl);
    font-weight: var(--font-weight-normal);
    color: var(--color-white);
    margin-bottom: var(--spacing-xs);
    line-height: var(--leading-tight);
  }

  .page-subtitle {
    font-family: var(--font-sans);
    font-size: var(--font-size-lg);
    opacity: 0.65;
    max-width: 520px;
    margin: 0 auto;
    line-height: var(--leading-normal);
  }

  /* ── Buttons ────────────────────────────────────────────────────────── */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    font-family: var(--font-sans);
    font-weight: var(--font-weight-bold);
    border: none;
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    text-align: center;
    transition:
      background 0.15s ease,
      opacity 0.15s ease,
      transform 0.1s ease;
    text-decoration: none;
    line-height: 1.2;

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    &:not(:disabled):active {
      transform: scale(0.97);
    }
  }

  .btn-primary {
    background: var(--color-accent);
    color: white;
    padding: 0.75rem 2rem;
    font-size: var(--font-size-lg);

    &:not(:disabled):hover {
      background: var(--color-cuny-blue-light);
    }
  }

  .btn-secondary {
    background: rgba(255, 255, 255, 0.12);
    color: white;
    padding: 0.6rem 1.4rem;
    font-size: var(--font-size-base);

    &:not(:disabled):hover {
      background: rgba(255, 255, 255, 0.2);
    }
  }

  .btn-lg {
    font-size: var(--font-size-xl);
    padding: 0.9rem 2.4rem;
    border-radius: 4rem;
  }

  .btn-sm {
    font-size: var(--font-size-sm);
    padding: 0.4rem 1rem;
  }

  .btn-spin {
    background: #ffd700;
    color: #111;
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-extrabold);
    padding: 1rem 1.6rem;
    border-radius: 50%;
    width: 9rem;
    height: 9rem;
    line-height: 1.2;
    letter-spacing: var(--letter-spacing-wider);
    box-shadow: 0 0 24px rgba(255, 215, 0, 0.4);

    &:not(:disabled):hover {
      background: #ffe84d;
      box-shadow: 0 0 36px rgba(255, 215, 0, 0.6);
    }
  }

  /* ── Setup page ─────────────────────────────────────────────────────── */
  .setup-page {
    justify-content: center;
  }

  .setup-card {
    width: 100%;
    max-width: 480px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: var(--border-radius-sm);
    padding: var(--spacing-lg);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .field-label {
    font-family: var(--font-sans);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
    text-transform: uppercase;
    letter-spacing: var(--letter-spacing-wider);
    color: rgba(255, 255, 255, 0.75);
  }

  .field-hint {
    font-weight: var(--font-weight-normal);
    opacity: 0.6;
    text-transform: none;
    letter-spacing: 0;
  }

  .students-textarea {
    width: 100%;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    color: white;
    font-family: var(--font-sans);
    font-size: var(--font-size-base);
    line-height: var(--leading-relaxed);
    padding: 0.75rem 1rem;
    resize: vertical;
    outline: none;

    &:focus {
      border-color: var(--color-cuny-blue-light);
      box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.35);
    }

    &::placeholder {
      opacity: 0.35;
    }
  }

  .error-msg {
    font-size: var(--font-size-sm);
    color: #ff6b6b;
    margin: 0;
  }

  .count-msg {
    font-size: var(--font-size-sm);
    opacity: 0.55;
    margin: 0;
  }

  /* ── Order page ─────────────────────────────────────────────────────── */
  .order-page {
    justify-content: flex-start;
    gap: var(--spacing-md);
  }

  .order-list {
    list-style: none;
    width: 100%;
    max-width: 480px;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0;
    margin: 0;
  }

  .order-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    background: rgba(255, 255, 255, 0.06);
    border-radius: 6px;
    padding: 0.65rem 1rem;
  }

  .order-num {
    font-family: var(--font-sans);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
    color: var(--color-accent);
    width: 1.6rem;
    text-align: right;
    flex-shrink: 0;
  }

  .order-name {
    font-family: var(--font-serif);
    font-size: var(--font-size-lg);
  }

  .order-actions {
    display: flex;
    gap: var(--spacing-sm);
    flex-wrap: wrap;
    justify-content: center;
    margin-top: var(--spacing-sm);
  }

  /* ── Session page ───────────────────────────────────────────────────── */
  .session-page {
    padding-top: var(--spacing-md);
    gap: var(--spacing-md);
    justify-content: flex-start;
  }

  /* Presenter banner */
  .presenter-banner {
    width: 100%;
    max-width: var(--max-width-wide);
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    background: var(--color-accent);
    border-radius: var(--border-radius-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    flex-wrap: wrap;
  }

  .presenter-label {
    font-family: var(--font-sans);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
    text-transform: uppercase;
    letter-spacing: var(--letter-spacing-wider);
    opacity: 0.75;
    flex-shrink: 0;
  }

  .presenter-name {
    font-family: var(--font-serif);
    font-size: var(--font-size-4xl);
    font-weight: var(--font-weight-bold);
    flex: 1;
  }

  .round-badge {
    font-family: var(--font-sans);
    font-size: var(--font-size-sm);
    background: rgba(0, 0, 0, 0.3);
    border-radius: 4rem;
    padding: 0.2rem 0.75rem;
    flex-shrink: 0;
  }

  /* Wheels layout */
  .wheels-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-lg);
    width: 100%;
    max-width: var(--max-width-wide);
    flex-wrap: wrap;
  }

  .wheel-slot {
    flex: 0 0 auto;
    width: min(42vw, 400px);
  }

  .spin-center {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .round-done-icon {
    font-size: 3rem;
    animation: pop-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  /* Critique log */
  .results-section {
    width: 100%;
    max-width: 520px;
  }

  .results-title {
    font-family: var(--font-sans);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
    text-transform: uppercase;
    letter-spacing: var(--letter-spacing-wider);
    opacity: 0.55;
    margin-bottom: var(--spacing-xs);
  }

  .results-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .result-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.4rem 0.75rem;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.04);
    opacity: 0.5;
    transition: opacity 0.3s;

    &.done {
      opacity: 1;
      background: rgba(255, 255, 255, 0.08);
    }
  }

  .result-check {
    font-size: var(--font-size-base);
    flex-shrink: 0;
  }

  .result-name {
    font-family: var(--font-serif);
    font-size: var(--font-size-base);
    flex: 1;
  }

  .result-type {
    font-family: var(--font-sans);
    font-size: var(--font-size-sm);
    background: rgba(255, 215, 0, 0.15);
    color: #ffd700;
    border-radius: 4rem;
    padding: 0.1rem 0.6rem;
  }

  /* Navigation footer */
  .session-footer {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    flex-wrap: wrap;
    justify-content: center;
    padding-bottom: var(--spacing-lg);
  }

  /* ── Session complete ───────────────────────────────────────────────── */
  .complete-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-md);
    text-align: center;
    margin: auto;
  }

  .complete-emoji {
    font-size: 5rem;
    animation: pop-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .complete-title {
    font-family: var(--font-serif);
    font-size: var(--font-size-6xl);
    font-weight: var(--font-weight-normal);
    color: white;
  }

  .complete-sub {
    font-size: var(--font-size-xl);
    opacity: 0.65;
    max-width: 400px;
  }

  /* ── Animations ─────────────────────────────────────────────────────── */
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

  /* ── Responsive tweaks ──────────────────────────────────────────────── */
  @include mobile {
    .page-title {
      font-size: var(--font-size-4xl);
    }

    .presenter-name {
      font-size: var(--font-size-2xl);
    }

    .wheel-slot {
      width: min(80vw, 360px);
    }

    .wheels-row {
      flex-direction: column;
    }

    .spin-center {
      order: -1;
    }

    .btn-spin {
      width: 6rem;
      height: 6rem;
      font-size: var(--font-size-lg);
    }
  }
</style>
