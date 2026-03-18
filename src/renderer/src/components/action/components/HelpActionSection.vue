<template>
  <div class="help-action-section">
    <template v-for="(value, key) in helpData" :key="key">
      <h3 class="title">{{ key }}</h3>
      <p class="content" v-html="value"></p>
    </template>
  </div>
</template>
<script setup lang="ts">
defineOptions({
  name: 'HelpActionSection',
});

const props = defineProps({
  config: {
    type: Object as PropType<ICmsActionHelp>,
    default: () => ({}),
  },
});

import type { ICmsActionHelp } from '@shared/types/cms';
import type { PropType } from 'vue';
import { computed } from 'vue';

import { parseHelpData } from '../utils';

const helpData = computed(() => parseHelpData(props.config.data));

defineExpose({
  reset: () => {},
  submit: () => {},
});
</script>
<style lang="less" scoped>
.help-action-section {
  .title {
    font: var(--td-font-title-medium);
    margin-top: var(--td-comp-margin-m);
    margin-bottom: var(--td-comp-margin-s);
  }

  .content {
    color: var(--td-text-color-primary);
    font: var(--td-font-body-medium);
    margin-bottom: var(--td-comp-margin-s);
  }
}
</style>
