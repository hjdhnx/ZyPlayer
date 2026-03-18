<template>
  <div class="action-section">
    <!-- common -->
    <div v-if="config.timeout && timeCountDown > 0" class="action-item timeout-item">
      <t-progress
        status="warning"
        :percentage="(timeCountDown / config.timeout) * 100"
        :label="$t('component.action.countdown', [timeCountDown])"
      />
    </div>
    <div v-if="config.qrcode" class="action-item qrcode-item">
      <t-qrcode :value="config.qrcode" level="L" />
    </div>

    <component :is="currentComponent" ref="componentRef" :config="config" @submit="onSubmit" />
  </div>
</template>
<script setup lang="tsx">
defineOptions({
  name: 'ActionSection',
});

const props = defineProps({
  config: {
    type: Object as PropType<ICmsActionBase>,
    default: () => ({}),
  },
});

const emits = defineEmits(['submit', 'timeout']);

import { CMS_ACTION_TYPE } from '@shared/config/cmsAction';
import { isPositiveFiniteNumber } from '@shared/modules/validate';
import type { ICmsActionBase } from '@shared/types/cms';
import type { PropType } from 'vue';
import { defineAsyncComponent, nextTick, onMounted, onUnmounted, ref, shallowRef, useTemplateRef, watch } from 'vue';

const componentRef = useTemplateRef<any>('componentRef');

const timeCountDown = ref<number>(0);
const timer = ref<ReturnType<typeof setInterval> | null>(null);

const componentMap = {
  browser: defineAsyncComponent(() => import('./BrowserActionSection.vue')),
  form: defineAsyncComponent(() => import('./FormActionSection.vue')),
  help: defineAsyncComponent(() => import('./HelpActionSection.vue')),
  msgbox: defineAsyncComponent(() => import('./MsgBoxActionSection.vue')),
};

const currentComponent = shallowRef();

watch(
  () => props.config,
  () => {
    stopTimeout(false);
    nextTick(() => getComponent());
    startTimeout();
  },
  { deep: true },
);

onMounted(() => setup());
onUnmounted(() => dispose());

const setup = () => {
  nextTick(() => getComponent());
  startTimeout();
};

const dispose = () => {
  stopTimeout(false);
};

const getComponent = () => {
  const typeMap = {
    [CMS_ACTION_TYPE.BROWSER]: 'browser',
    [CMS_ACTION_TYPE.WEBVIEW]: 'browser',

    [CMS_ACTION_TYPE.HELP]: 'help',
    [CMS_ACTION_TYPE.MSGBOX]: 'msgbox',

    [CMS_ACTION_TYPE.INPUT]: 'form',
    [CMS_ACTION_TYPE.EDIT]: 'form',
    [CMS_ACTION_TYPE.MENU]: 'form',
    [CMS_ACTION_TYPE.SELECT]: 'form',
    [CMS_ACTION_TYPE.MULTI_SELECT]: 'form',
    [CMS_ACTION_TYPE.MULTI_INPUT]: 'form',
    [CMS_ACTION_TYPE.MULTI_INPUT_X]: 'form',
  };

  const finalType = typeMap[props.config.type] || 'form';

  currentComponent.value = componentMap[finalType];
};

const startTimeout = () => {
  const timeout = props.config.timeout;
  if (!isPositiveFiniteNumber(timeout)) return;

  timeCountDown.value = timeout!;

  timer.value = setInterval(() => {
    if (--timeCountDown.value <= 0) {
      stopTimeout(true);
    }
  }, 1000);
};

const stopTimeout = (trigger: boolean = false) => {
  if (timer.value) {
    clearInterval(timer.value);
    timer.value = null;
  }

  timeCountDown.value = 0;

  if (trigger) emits('timeout');
};

const onSubmit = (id: string, data: Record<string, any>) => {
  emits('submit', id, data);
};

defineExpose({
  reset: () => componentRef.value?.reset(),
  submit: () => componentRef.value?.submit(),
});
</script>
<style lang="less" scoped>
.action-section {
  display: flex;
  flex-direction: column;
  gap: var(--td-size-4);

  .action-item {
    width: 100%;
  }

  .qrcode-item {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  &-browser {
    .browser-view {
      border-radius: var(--td-radius-medium);
      overflow: hidden;
    }
  }

  &-help {
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

  &-form {
    .form-group {
      width: 100%;
      display: flex;
      gap: var(--td-size-4);

      &-input {
        flex: 1;
      }
    }
  }
}
</style>
