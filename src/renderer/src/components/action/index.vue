<template>
  <t-dialog v-model:visible="formVisible" v-bind="attrsCustom">
    <template v-if="formData.title" #header>
      <div class="action-header">
        {{ formData.title }}
      </div>
    </template>

    <template #body>
      <div class="action-content">
        <action-section-view ref="actionRef" :config="formData" @submit="onSubmit" @timeout="onTimeout" />
      </div>
    </template>

    <template #footer>
      <div class="action-footer">
        <!-- <t-button v-if="parsedButton.includes('preview')" variant="dashed" class="btn-modern" @click="handlePreview">
          {{ $t('common.preview') }}
        </t-button> -->

        <t-button v-if="parsedButton.includes('reset')" variant="dashed" class="btn-modern" @click="handleReset">
          {{ $t('common.reset') }}
        </t-button>

        <t-button v-if="parsedButton.includes('cancel')" theme="default" class="btn-modern" @click="handleCancel">
          {{ $t('common.cancel') }}
        </t-button>

        <t-button v-if="parsedButton.includes('confirm')" theme="primary" class="btn-modern" @click="handleSubmit">
          {{ $t('common.confirm') }}
        </t-button>
      </div>
    </template>
  </t-dialog>
</template>
<script setup lang="ts">
defineOptions({
  name: 'Action',
});

const props = defineProps({
  config: {
    type: Object as PropType<ICmsActionBase>,
    default: () => ({}),
  },
  visible: {
    type: Boolean,
    default: false,
  },
});

const emits = defineEmits(['update:visible', 'cancel', 'submit', 'timeout']);

import type { ICmsActionButtonTypeDisplay } from '@shared/config/cmsAction';
import type { ICmsActionBase } from '@shared/types/cms';
import type { Dialog, DialogProps } from 'tdesign-vue-next';
import type { PropType } from 'vue';
import { computed, ref, useAttrs, watch } from 'vue';

import ActionSectionView from './components/ActionSection.vue';
import { parseActionButton } from './utils';

const attrs = useAttrs() as DialogProps;

const dialogRef = ref<InstanceType<typeof Dialog>>();
const actionRef = ref<InstanceType<typeof ActionSectionView>>();

const formVisible = ref<boolean>(props.visible);

const formData = ref<ICmsActionBase>(props.config);

const attrsCustom = computed<Partial<DialogProps>>(() => {
  // eslint-disable-next-line ts/no-unused-vars
  const { visible, ...rest } = attrs;

  return {
    ref: dialogRef,
    showInAttachedElement: true,
    destroyOnClose: true,
    placement: 'center',
    footer: shouldShowFooter.value,
    ...rest,
    onCloseBtnClick: () => handleCancel(),
    closeOnOverlayClick: formData.value.canceledOnTouchOutside ?? true,
    closeOnEscKeydown: formData.value.canceledOnTouchOutside ?? true,
  } as Partial<DialogProps>;
});

watch(
  () => formVisible.value,
  (val) => emits('update:visible', val),
);
watch(
  () => props.visible,
  (val) => (formVisible.value = val),
);
watch(
  () => props.config,
  (val) => (formData.value = val),
  { deep: true },
);

const parsedButton = computed<Array<ICmsActionButtonTypeDisplay>>(() =>
  parseActionButton(formData.value.type, formData.value.button),
);

const shouldShowFooter = computed(() => parsedButton.value.length > 0);

// const handlePreview = () => {};

const handleCancel = () => {
  emits('cancel');
  formVisible.value = false;
};

const handleReset = () => {
  actionRef.value?.reset();
};

const onSubmit = (id: string, data?: Record<string, any>) => {
  emits('submit', id, data);
  formVisible.value = false;
};

const onTimeout = () => {
  emits('timeout');
  formVisible.value = false;
};

const handleSubmit = () => {
  actionRef.value?.submit();
};

defineExpose({
  reset: handleReset,
  submit: handleSubmit,
});
</script>
<style lang="less" scoped></style>
