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
  import PageHeader from '$lib/components/CritiqueWheel/PageHeader.svelte';
  import StudentRoster from '$lib/components/CritiqueWheel/StudentRoster.svelte';
  import SpinWheel from '$lib/components/CritiqueWheel/SpinWheel.svelte';

  /* ─── Critique type options ──────────────────────────────────────────── */
  const CRITIQUE_TYPES = ['Give Praise', 'Suggest Improvement', 'Ask Question'];
  const CRITIQUE_COLORS = ['#e9c46a', '#e63946', '#2a9d8f'];

  /* ─── Example class roster (replace with your actual students) ───────── */
  const DEFAULT_ROSTER =
    'Ashley\nChloe\nChrissy\nEmma\nIrene\nJack\nNancy\nNiya\nSidney\nSophie';

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
        color: CRITIQUE_COLORS[selectedTypeIdx],
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
  <title>Wheel of Feedback | CUNY Journalism</title>
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
    <PageHeader subtitle="A critique session where everyone contributes">
      <span class="spinning-w">W</span>heel of Feedback
    </PageHeader>

    <StudentRoster
      bind:value={rawInput}
      studentCount={parsedStudents.length}
      error={setupError}
      onsubmit={handleRandomise}
    />
  </div>

  <!-- ══════════════════════════════════════════════════════════════════════
     ORDER PHASE
     ══════════════════════════════════════════════════════════════════════ -->
{:else if phase === 'order'}
  <div class="page order-page">
    <header class="page-header">
      <PageHeader title="Presentation order" />
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
      <button class="btn btn-primary btn-lg" onclick={handleBeginSession}>
        READY?
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
        <h1 class="complete-title">Session Complete!</h1>
        <p class="complete-sub">
          Every student has presented. Great work, everyone.
        </p>
      </div>
    {:else}
      <!-- Presenter banner -->
      <div class="presenter-banner">
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
            label="Who?"
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
              SPIN
            </button>
          {:else}
            <div class="round-done-icon" aria-hidden="true">Done</div>
          {/if}
        </div>

        <div class="wheel-slot">
          <SpinWheel
            bind:this={wheel2}
            items={CRITIQUE_TYPES}
            colors={CRITIQUE_COLORS}
            label="What?"
            onSpinComplete={onWheel2Complete}
          />
        </div>
      </div>

      <!-- Critique log -->
      <div class="results-section">
        <ul class="results-list">
          {#each allAudience as student (student)}
            {@const result = roundResults.find((r) => r.name === student)}
            <li class="result-row" class:done={!!result}>
              <span class="result-check" aria-hidden="true">
                {result ? '✓' : '—'}
              </span>
              <span class="result-name">{student}</span>
              {#if result}
                <span
                  class="result-type"
                  style="background: {result.color}; color: {result.color ===
                  '#e9c46a'
                    ? '#333'
                    : 'white'};">{result.type}</span
                >
              {/if}
            </li>
          {/each}
        </ul>
      </div>

      <!-- Navigation controls -->
      <div class="session-footer">
        {#if roundComplete}
          {#if currentIdx + 1 < presentationOrder.length}
            <button
              class="btn btn-primary btn-lg"
              onclick={handleNextPresenter}
            >
              Next presenter
            </button>
          {:else}
            <button
              class="btn btn-primary btn-lg"
              onclick={handleNextPresenter}
            >
              Finish Session
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
    background: var(--color-cuny-blue-dark);
    color: white;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: var(--spacing-lg) var(--spacing-md);
    box-sizing: border-box;
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
      transform: none;
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
    background: rgba(255, 255, 255, 0.15);
    color: white;
    padding: 0.6rem 1.4rem;
    font-size: var(--font-size-base);

    &:not(:disabled):hover {
      background: rgba(255, 255, 255, 0.25);
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
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    animation: throb 2s ease-in-out infinite;

    &:not(:disabled):hover {
      background: #ffe84d;
      box-shadow: 0 4px 18px rgba(0, 0, 0, 0.2);
    }

    &:disabled {
      animation: none;
    }
  }

  @keyframes throb {
    0%,
    100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
  }

  /* ── Setup page ─────────────────────────────────────────────────────── */
  .setup-page {
    justify-content: flex-start;
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
    background: rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    padding: 0.65rem 1rem;
  }

  .order-num {
    font-family: var(--font-sans);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
    color: rgba(255, 255, 255, 0.6);
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
    background: rgba(255, 255, 255, 0.12);
    color: white;
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
    opacity: 0.85;
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
    background: rgba(255, 255, 255, 0.25);
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
    background: rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.4);
    transition:
      color 0.3s,
      background 0.3s;

    &.done {
      color: white;
      background: rgba(255, 255, 255, 0.12);
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
