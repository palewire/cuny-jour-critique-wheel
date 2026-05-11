<!--
  SpinWheel.stories.svelte

  Stories for the SpinWheel component used in the Critique Wheel classroom
  tool.  Each story demonstrates the wheel with a different set of items.

  Props:
  - items        {string[]} – labels for each pie segment
  - doneIndices  {number[]} – indices to render at reduced opacity
  - label        {string}   – accessible heading above the wheel
-->
<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import SpinWheel from '$lib/components/CritiqueWheel/SpinWheel.svelte';

  const { Story } = defineMeta({
    title: 'CritiqueWheel/SpinWheel',
    component: SpinWheel,
    tags: ['autodocs'],
    argTypes: {
      items: {
        control: 'object',
        description: 'Array of labels for each wheel segment',
      },
      doneIndices: {
        control: 'object',
        description:
          'Segment indices rendered at reduced opacity (already used)',
      },
      label: {
        control: 'text',
        description: 'Accessible heading displayed above the wheel',
      },
    },
    decorators: [
      (Story) => {
        return {
          Component: Story,
          props: {
            style:
              'background:#111; padding:2rem; display:flex; justify-content:center;',
          },
        };
      },
    ],
  });
</script>

<!-- Default: full class roster on the audience wheel -->
<Story
  name="Audience Wheel"
  args={{
    items: ['Alice', 'Bob', 'Carol', 'Dave', 'Eve', 'Frank', 'Grace', 'Hank'],
    doneIndices: [],
    label: 'Who critiques?',
  }}
/>

<!-- Critique-type wheel (always 3 options) -->
<Story
  name="Type Wheel"
  args={{
    items: ['🌟 Praise', '💡 Improvement', '❓ Question'],
    doneIndices: [],
    label: 'What type?',
  }}
/>

<!-- Some students already done (grayed out) -->
<Story
  name="Partially Done"
  args={{
    items: ['Alice', 'Bob', 'Carol', 'Dave', 'Eve'],
    doneIndices: [0, 2],
    label: 'Who critiques?',
  }}
/>

<!-- Small class (2 students) -->
<Story
  name="Two Students"
  args={{
    items: ['Alice', 'Bob'],
    doneIndices: [],
    label: 'Who critiques?',
  }}
/>

<!-- Single item edge case -->
<Story
  name="One Item"
  args={{
    items: ['Alice'],
    doneIndices: [],
    label: 'Last one!',
  }}
/>
