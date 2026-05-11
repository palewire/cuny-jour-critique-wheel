<script>
  import Kicker from '$lib/components/Article/Kicker.svelte';

  let { title = '', subtitle = '' } = $props();
</script>

<header class="page-header">
  <Kicker text="Fun and Games" />
  <h1 class="page-title">{title}</h1>
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
      color: var(--color-text);
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
</style>
