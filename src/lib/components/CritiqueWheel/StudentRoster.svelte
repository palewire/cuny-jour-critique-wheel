<script>
  let {
    value = $bindable(''),
    studentCount = 0,
    error = '',
    onsubmit = () => {},
  } = $props();
</script>

<div class="setup-card">
  <label class="field-label" for="students-input"> Students </label>
  <textarea
    id="students-input"
    class="students-textarea"
    bind:value
    rows="12"
    placeholder="Alice&#10;Bob&#10;Carol&#10;…"
    spellcheck="false"
  ></textarea>

  {#if error}
    <p class="error-msg" role="alert">{error}</p>
  {/if}

  <button class="btn btn-primary btn-lg" onclick={onsubmit} disabled={!!error}>
    Spin the wheel
  </button>
</div>

<style lang="scss">
  @use '../../styles' as *;

  .setup-card {
    width: 100%;
    max-width: 480px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
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
    color: rgba(255, 255, 255, 0.7);
  }

  .students-textarea {
    width: 100%;
    background: rgba(255, 255, 255, 0.1);
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
      border-color: rgba(255, 255, 255, 0.5);
      box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.2);
    }

    &::placeholder {
      color: rgba(255, 255, 255, 0.35);
    }
  }

  .error-msg {
    font-size: var(--font-size-sm);
    color: #ff6b6b;
    margin: 0;
  }

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
    text-transform: uppercase;

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

  .btn-lg {
    font-size: var(--font-size-xl);
    padding: 0.9rem 2.4rem;
    border-radius: 4rem;
  }
</style>
