<template>
  <div class="browser-action-section">
    <webview-view
      :src="props.config.url"
      :style="{
        height: props.config.browserHeight ? `${props.config.browserHeight}px` : '200px',
        width: props.config.browserWidth ? `${props.config.browserWidth}px` : '100%',
      }"
      class="browser-view"
    />
  </div>
</template>
<script setup lang="ts">
defineOptions({
  name: 'BrowserActionSection',
});

const props = defineProps({
  config: {
    type: Object as PropType<ICmsActionBrowser>,
    default: () => ({}),
  },
});

import type { ICmsActionBrowser } from '@shared/types/cms';
import type { PropType } from 'vue';

import WebviewView from '@/components/webview/index.vue';

defineExpose({
  reset: () => {},
  submit: () => {},
});
</script>
<style lang="less" scoped>
.browser-action-section {
  .browser-view {
    border-radius: var(--td-radius-medium);
    overflow: hidden;
  }
}
</style>
