import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import SpinWheel from '$lib/components/CritiqueWheel/SpinWheel.svelte';

describe('SpinWheel', () => {
  it('renders an SVG wheel', () => {
    const { container } = render(SpinWheel, {
      props: { items: ['Alice', 'Bob', 'Carol'] },
    });
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('renders one path per item', () => {
    const items = ['Alice', 'Bob', 'Carol', 'Dave'];
    const { container } = render(SpinWheel, { props: { items } });
    // Each segment is a <path> element inside the wheel group
    const paths = container.querySelectorAll('svg path');
    expect(paths.length).toBe(items.length);
  });

  it('renders a label when provided', () => {
    render(SpinWheel, {
      props: { items: ['Alice', 'Bob'], label: 'Who critiques?' },
    });
    expect(screen.getByText('Who critiques?')).toBeTruthy();
  });

  it('does not render a label element when label is empty', () => {
    const { container } = render(SpinWheel, {
      props: { items: ['Alice', 'Bob'], label: '' },
    });
    expect(container.querySelector('.wheel-label')).toBeNull();
  });

  it('renders item text inside the SVG', () => {
    render(SpinWheel, {
      props: { items: ['Alice', 'Bob', 'Carol'] },
    });
    expect(screen.getByText('Alice')).toBeTruthy();
    expect(screen.getByText('Bob')).toBeTruthy();
    expect(screen.getByText('Carol')).toBeTruthy();
  });

  it('handles a single item without throwing', () => {
    const { container } = render(SpinWheel, {
      props: { items: ['Solo'] },
    });
    expect(container.querySelector('svg')).toBeTruthy();
    expect(screen.getByText('Solo')).toBeTruthy();
  });

  it('handles an empty items array gracefully', () => {
    const { container } = render(SpinWheel, {
      props: { items: [] },
    });
    expect(container.querySelector('svg')).toBeTruthy();
    // No segment paths should be rendered
    expect(container.querySelectorAll('svg path').length).toBe(0);
  });

  it('applies reduced opacity to done segments', () => {
    const { container } = render(SpinWheel, {
      props: {
        items: ['Alice', 'Bob', 'Carol'],
        doneIndices: [0, 2],
      },
    });
    const paths = container.querySelectorAll('svg path');
    // Index 0 and 2 should have opacity 0.25, index 1 should have opacity 1
    expect(paths[0].getAttribute('opacity')).toBe('0.25');
    expect(paths[1].getAttribute('opacity')).toBe('1');
    expect(paths[2].getAttribute('opacity')).toBe('0.25');
  });

  it('truncates long names to fit segments', () => {
    // With 3 items maxChars is Math.max(5, floor(90/3)) = 30 – no truncation needed
    // Use a very long name that will exceed a small maxChars
    const longName = 'A'.repeat(60);
    render(SpinWheel, {
      // 20 items forces maxChars = max(5, floor(90/20)) = 5
      props: {
        items: Array.from({ length: 20 }, (_, i) =>
          i === 0 ? longName : `S${i}`
        ),
      },
    });
    // The long name should be truncated (rendered text won't equal the full name)
    const allText = Array.from(document.querySelectorAll('svg text')).map(
      (el) => el.textContent
    );
    expect(allText.some((t) => t.includes('…'))).toBe(true);
  });
});
