<script>
  import Kicker from '$lib/components/Article/Kicker.svelte';

  let { title = '', subtitle = '', children } = $props();
</script>

<header class="page-header">
  <Kicker text="Fun and Games" />
  <h1 class="page-title">
    {#if children}
      {@render children()}
    {:else}
      {title}
    {/if}
  </h1>
  {#if subtitle}
    <p class="page-subtitle">{subtitle}</p>
  {/if}
</header>

<style lang="scss">
  @use '../../styles' as *;

  .page-header {
    text-align: center;
    margin: var(--spacing-lg) 0;

    h1.page-title {
      font-family: var(--font-serif);
      font-size: var(--font-size-display);
      font-weight: var(--font-weight-bold);
      color: white;
      margin: var(--spacing-xs) 0;
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

    @include mobile {
      .page-title {
        font-size: var(--font-size-4xl);
      }
    }
  }

  :global(.spinning-w) {
    display: inline-block;
    animation: slow-spin 4s linear infinite;
  }

  @keyframes slow-spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
</style>
