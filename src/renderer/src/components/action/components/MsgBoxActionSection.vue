<template>
  <div class="msgbox-action-section">
    <t-alert>
      <template #message>
        <span v-html="config.msg || config.htmlMsg"></span>
      </template>
    </t-alert>

    <div v-if="config.imageUrl" class="action-item image-item">
      <t-image
        :src="config.imageUrl"
        :style="{
          height: config.imageHeight ? `${config.imageHeight}px` : '200px',
          width: 'fit-content',
          margin: '0 auto',
        }"
        lazy
        shape="round"
        :loading="renderLoading"
      />
    </div>
  </div>
</template>
<script setup lang="tsx">
defineOptions({
  name: 'MsgBoxActionSection',
});

defineProps({
  config: {
    type: Object as PropType<ICmsActionMsgbox>,
    default: () => ({}),
  },
});

import type { ICmsActionMsgbox } from '@shared/types/cms';
import { Loading } from 'tdesign-vue-next';
import type { PropType } from 'vue';

const renderLoading = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100%',
      background: 'var(--td-bg-color-component)',
      backdropFilter: 'blur(10px)',
      borderRadius: 'var(--td-radius-medium)',
    }}
  >
    <Loading delay={0} fullscreen={false} indicator inheritColor={false} loading preventScrollThrough showOverlay />
  </div>
);

defineExpose({
  reset: () => {},
  submit: () => {},
});
</script>
<style lang="less" scoped>
.msgbox-action-section {
  display: flex;
  flex-direction: column;
  gap: var(--td-size-4);
}
</style>
