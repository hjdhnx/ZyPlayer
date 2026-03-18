<template>
  <div class="form-action-section">
    <div v-if="config.imageUrl" class="action-item image-item">
      <t-image
        :src="config.imageUrl"
        :style="{
          height: config.imageHeight ? `${config.imageHeight}px` : 'auto',
          width: 'fit-content',
          margin: '0 auto',
          pointerEvents: config.imageClickCoord ? 'pointer' : 'none',
        }"
        lazy
        shape="round"
        :loading="renderLoading"
        @click="handleGetImageCoord(config, $event)"
      />
    </div>

    <t-card :bordered="false" class="action-item" :header-style="{ padding: 0 }" :body-style="{ padding: 0 }">
      <template v-if="showTitle" #subtitle>
        {{ config.msg }}
      </template>

      <t-form
        ref="formRef"
        :data="formData"
        :rules="rules"
        required-mark-position="left"
        label-align="top"
        reset-type="initial"
        @submit="onSubmit"
      >
        <t-form-item v-for="item in inputs" :key="getKey(item)" :name="getKey(item)" :label="item.msg || item.name">
          <template #label>
            <span v-if="item.msg || item.name">
              {{ item.msg || item.name }}
            </span>

            <t-popup v-if="item.help" destroy-on-close>
              <info-circle-icon class="help-icon" />
              <template #content>
                <span v-html="item.help"></span>
              </template>
            </t-popup>
          </template>

          <!-- calendar -->
          <t-date-picker
            v-if="item.selectData === '[calendar]'"
            v-model="formData[getKey(item)]"
            clearable
            :placeholder="item.tip || $t('common.placeholder.input')"
            class="form-calendar"
          />

          <!-- file / folder / image -->
          <div v-else-if="isUploadType(item)" class="form-group">
            <t-input
              v-model="formData[getKey(item)]"
              clearable
              :placeholder="item.tip || $t('common.placeholder.input')"
              class="form-group-input"
            />
            <t-button theme="default" class="form-group-btn" @click="handleUpload(item)">
              {{ $t('common.upload') }}
            </t-button>
          </div>

          <!-- select -->
          <t-select
            v-else-if="isSelect(item)"
            v-model="formData[getKey(item)]"
            :multiple="isSelectMultiple(item)"
            clearable
            :creatable="!(!!item.quickSelect || !!item.onlyQuickSelect)"
            :filterable="!(!!item.quickSelect || !!item.onlyQuickSelect)"
            :placeholder="item.tip || $t('common.placeholder.input')"
          >
            <t-option v-for="opt in getOptions(item)" :key="opt.value" :value="opt.value" :label="opt.name" />
          </t-select>

          <!-- textarea -->
          <t-textarea
            v-else-if="isTextarea(item)"
            v-model="formData[getKey(item)]"
            :autosize="{ minRows: item.multiLine || 4 }"
            clearable
            :placeholder="item.tip || $t('common.placeholder.input')"
          />

          <!-- input -->
          <t-input
            v-else-if="isInput(item)"
            v-model="formData[getKey(item)]"
            clearable
            :placeholder="item.tip || $t('common.placeholder.input')"
            :type="getInputType(item)"
          />
        </t-form-item>
      </t-form>
    </t-card>
  </div>
</template>
<script setup lang="tsx">
defineOptions({
  name: 'FormActionSection',
});

const props = defineProps({
  config: {
    type: Object as PropType<ICmsActionForm>,
    default: () => ({}),
  },
});

const emits = defineEmits(['submit']);

import { CMS_ACTION_INPUT_TYPE, CMS_ACTION_TYPE } from '@shared/config/cmsAction';
import { IPC_CHANNEL } from '@shared/config/ipcChannel';
import {
  isArray,
  isArrayEmpty,
  isObject,
  isObjectEmpty,
  isPositiveFiniteNumber,
  isStrEmpty,
  isString,
} from '@shared/modules/validate';
import type { ICmsActionForm } from '@shared/types/cms';
import { InfoCircleIcon } from 'tdesign-icons-vue-next';
import type { FormInstanceFunctions, FormRule, SubmitContext } from 'tdesign-vue-next';
import { Loading, MessagePlugin } from 'tdesign-vue-next';
import type { PropType } from 'vue';
import { computed, nextTick, onMounted, ref, toRaw, useTemplateRef, watch } from 'vue';

import { parseMenuData, parseSelectData } from '../utils';

const formRef = useTemplateRef<FormInstanceFunctions>('formRef');
const formData = ref<Record<string, any>>({});
const rules = ref<Record<string, FormRule[]>>({});

const inputs = computed(() => (isArray(props.config.input) ? props.config.input : [props.config]));

const showTitle = computed(() => isArray(props.config.input) && props.config.msg);

watch(
  () => props.config,
  (val) => {
    resetState();
    nextTick(() => buildForm(val));
  },
  { deep: true },
);

onMounted(() => setup());

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

const setup = () => {
  nextTick(() => buildForm(props.config));
};

const resetState = () => {
  formData.value = {};
  rules.value = {};
};

const buildForm = (options: Record<string, any>) => {
  if (!isObject(options) || isObjectEmpty(options)) return;

  // const validTypes = ['edit', 'input', 'multiInput', 'multiInputX', 'menu', 'select', 'multiSelect', 'order', 'remote', 'help', 'msgbox'];
  // if (!validTypes.includes(options.type)) return;

  if (
    [CMS_ACTION_TYPE.MULTI_INPUT, CMS_ACTION_TYPE.MULTI_INPUT_X].includes(options.type) &&
    isArray(options.input) &&
    !isArrayEmpty(options.input)
  ) {
    options.input.forEach(createField);
    return;
  }

  createField(options);
};

const createField = (field: Record<string, any>) => {
  const key = getKey(field);
  formData.value[key] = field.value ?? '';
  if (isSelect(field)) {
    const options = getOptions(field);
    const select = options.filter((item) => item.selected).map((item) => item.value);
    formData.value[key] = [CMS_ACTION_TYPE.SELECT, CMS_ACTION_TYPE.MULTI_SELECT].includes(field.type)
      ? select
      : select[0];
  }

  const typeRuleMap: Record<number, FormRule> = {
    [CMS_ACTION_INPUT_TYPE.EMAIL]: { email: { ignore_max_length: true } },
    [CMS_ACTION_INPUT_TYPE.URL]: {
      url: {
        protocols: ['http', 'https', 'ftp'],
        require_protocol: true,
      },
    },
  };

  const fieldRules = [
    field.required && { required: true },
    field.validator && { validator: field.validator },
    typeRuleMap[field.inputType],
  ].filter(Boolean) as FormRule[];

  if (!isArrayEmpty(fieldRules)) {
    rules.value[key] = fieldRules;
  }
};

const getKey = (item: Record<string, any>) => {
  return item.id || item.name || 'value';
};

const isUploadType = (item: Record<string, any>) => {
  return ['[file]', '[folder]', '[image]'].includes(item.selectData);
};

const isInput = (item: Record<string, any>) => {
  return !item.type || item.type === CMS_ACTION_TYPE.INPUT;
};

const isTextarea = (item: Record<string, any>) => {
  return item.type === CMS_ACTION_TYPE.EDIT || item.multiLine > 1;
};

const isSelect = (item: Record<string, any>) => {
  const validTypes = [CMS_ACTION_TYPE.MENU, CMS_ACTION_TYPE.SELECT, CMS_ACTION_TYPE.MULTI_SELECT].includes(item.type);
  const hasSelectData = isString(item.selectData) && !isStrEmpty(item.selectData) && !isUploadType(item);
  return (validTypes || hasSelectData) && !isUploadType(item);
};

const isSelectMultiple = (item: Record<string, any>) => {
  return [CMS_ACTION_TYPE.SELECT, CMS_ACTION_TYPE.MULTI_SELECT].includes(item.type);
};

const getOptions = (item: Record<string, any>): Array<{ name: string; value: string; selected?: boolean }> => {
  if (item.option) {
    const options = parseMenuData(item.option);
    const selectedIndex = item.selectedIndex;
    if (isPositiveFiniteNumber(selectedIndex)) {
      options[selectedIndex].selected = true;
    }
    return options;
  }
  if (item.selectData) return parseSelectData(item.selectData);
  return [];
};

const getInputType = (item: Record<string, any>) => {
  const typeMap: Record<number, string> = {
    [CMS_ACTION_INPUT_TYPE.TEXT]: 'text',
    [CMS_ACTION_INPUT_TYPE.PASSWORD]: 'password',
    [CMS_ACTION_INPUT_TYPE.NUMBER]: 'number',
    [CMS_ACTION_INPUT_TYPE.EMAIL]: 'text', // email
    [CMS_ACTION_INPUT_TYPE.URL]: 'text', // url
  };

  const type = item.inputType;
  return typeMap[type] ?? 'text';
};

const handleGetImageCoord = (item: Record<string, any>, event: { e: PointerEvent }) => {
  const { e } = event;
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  const x = Math.round(e.clientX - rect.left);
  const y = Math.round(e.clientY - rect.top);
  const coord = `${x},${y}`;

  const key = getKey(item);

  formData.value[key] = formData.value[key] ? `${formData.value[key]}-${coord}` : coord;
};

const handleUpload = async (item: any) => {
  const type = item.selectData.replace('[', '').replace(']', '');
  const key = getKey(item);

  const channelMap: Record<string, string> = {
    file: IPC_CHANNEL.FILE_SELECT_FILE_DIALOG,
    folder: IPC_CHANNEL.FILE_SELECT_FOLDER_DIALOG,
    image: IPC_CHANNEL.FILE_SELECT_FILE_DIALOG,
  };

  const filterMap: Record<string, any[]> = {
    file: [{ name: 'All Files', extensions: ['*'] }],
    folder: [],
    image: [{ name: 'Image Files', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'] }],
  };

  const resp = await window.electron.ipcRenderer.invoke(channelMap[type], {
    filters: filterMap[type],
  });

  if (!isArray(resp) || isArrayEmpty(resp)) return;

  formData.value[key] = resp[0];
};

const onSubmit = (context: SubmitContext<any>) => {
  const { validateResult, firstError } = context;

  if (validateResult === true) {
    const id = props.config.actionId || '';
    emits('submit', id, toRaw(formData.value));
  } else {
    MessagePlugin.warning(firstError!);
  }
};

defineExpose({
  reset: () => formRef.value?.reset(),
  submit: () => formRef.value?.submit(),
});
</script>
<style lang="less" scoped>
.form-action-section {
  :deep(.t-form__label--top) {
    white-space: wrap;
  }

  .form-calendar {
    flex: 1;
  }

  .form-group {
    width: 100%;
    display: flex;
    gap: var(--td-size-4);

    &-input {
      flex: 1;
    }
  }
}
</style>
