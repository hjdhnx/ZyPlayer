import type {
  ICmsActionButtonType,
  ICmsActionButtonTypeDisplay,
  ICmsActionButtonTypeEnum,
  ICmsActionFormType,
  ICmsActionType,
} from '@shared/config/cmsAction';
import { CMS_ACTION_FORM_TYPE, CMS_ACTION_TYPE } from '@shared/config/cmsAction';
import {
  isArray,
  isArrayEmpty,
  isBoolean,
  isJsonStr,
  isNil,
  isObject,
  isObjectEmpty,
  isStrEmpty,
  isString,
} from '@shared/modules/validate';
import JSON5 from 'json5';

const isFormType = (type: ICmsActionType = CMS_ACTION_TYPE.INPUT): boolean => {
  return CMS_ACTION_FORM_TYPE.includes(type as unknown as ICmsActionFormType);
};

const buttonToStandard = (type?: ICmsActionButtonType): Array<ICmsActionButtonTypeDisplay> => {
  if (isNil(type)) return [];
  if (isBoolean(type) && type === true) type = 2;

  const map: Record<ICmsActionButtonTypeEnum, Array<ICmsActionButtonTypeDisplay>> = {
    0: [], //
    1: ['confirm'], // confirm
    2: ['cancel', 'confirm'], // cancel/confirm
    3: ['cancel', 'confirm', 'reset'], // cancel/confirm/reset
    4: ['cancel', 'confirm', 'reset', 'preview'], // cancel/confirm/reset/preview
  };

  return Object.keys(map).includes(String(type)) ? map[type as ICmsActionButtonTypeEnum] : [];
};

const parseDelimitedFormat = (data: string, delimiter: string, pairSeparator: string) => {
  return data
    .split(delimiter)
    .map((item) => {
      const [name, value] = item.split(pairSeparator);
      return {
        name: name?.trim() || item.trim(),
        value: value?.trim() || item.trim(),
      };
    })
    .filter((item) => item.name);
};

export const parseActionButton = (actionType?: ICmsActionType, btnType?: ICmsActionButtonType) => {
  if (isNil(btnType) && isFormType(actionType)) btnType = 2;
  return buttonToStandard(btnType);
};

export const parseActionConfig = (data: string | Record<string, any> | Record<string, { config: any }>) => {
  if (isJsonStr(data)) return JSON5.parse(data as string);

  if (isObject(data) && !isObjectEmpty(data) && Object.hasOwn(data, 'config')) return data.config;

  return data;
};

export const parseSelectData = (data: string): Array<{ name: string; value: string }> => {
  if (!isString(data) || isStrEmpty(data)) return [];

  try {
    // Handle special selectors like [folder], [calendar], etc.
    const SPECIAL_SELECTOR_REGEX = /^\[(folder|calendar|file|image)\]$/;
    const specialMatch = data.match(SPECIAL_SELECTOR_REGEX);
    if (specialMatch) {
      const DISPLAY_NAMES = {
        calendar: '📅 选择日期',
        file: '📄 选择文件',
        folder: '📁 选择文件夹',
        image: '🖼️ 选择图片',
      };

      const type = specialMatch[1];
      return [{ name: DISPLAY_NAMES[type], value: data }];
    }

    // Handle prefixed selectors with options like [Please select]a,b,c
    if (data.startsWith('[') && data.includes(']')) {
      const bracketEnd = data.indexOf(']');
      const prefix = data.substring(1, bracketEnd);
      const options = data.substring(bracketEnd + 1);

      if (options) {
        return options
          .split(',')
          .map((item) => {
            const value = item.trim();
            return { name: value, value };
          })
          .filter((item) => item.name);
      } else {
        return [{ name: prefix, value: data }];
      }
    }

    // Handle JSON format
    if (isJsonStr(data)) return JSON5.parse(data);

    // Handle key-value format: key:=value,key2:=value2
    if (data.includes(':=')) return parseDelimitedFormat(data, ',', ':=');

    // Handle legacy pipe-delimited format: name=value|name2=value2
    if (data.includes('|')) return parseDelimitedFormat(data, '|', '=');

    return [];
  } catch (error) {
    console.warn('解析selectData失败:', error);
    return [];
  }
};

export const parseMenuData = (
  data: Array<string | Record<string, any>>,
): Array<{ name: string; value: string; selected: boolean }> => {
  if (!isArray(data) || isArrayEmpty(data)) return [];

  const result: Array<{ name: string; value: string; selected: boolean }> = [];

  for (const item of data) {
    if (isObject(item)) {
      result.push({ name: item.name ?? '', value: item.action ?? '', selected: !!item.selected });
    } else if (isString(item)) {
      const [name = '', value = '', selected = 'false'] = item.split('$');
      result.push({ name, value, selected: selected === 'true' });
    }
  }

  return result;
};

export const parseHelpData = (data: Record<string, string>): Record<string, string> => {
  if (!isObject(data) || isObjectEmpty(data)) return {};

  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    result[key] = value.replaceAll('\n', '<br/>').replaceAll(' ', '&nbsp;');
  }

  return result;
};

export const isSpecialAction = (data: Record<string, any>): boolean => {
  if (!isObject(data) || isObjectEmpty(data)) return false;

  // Contains a content field and the actionId is __copy__
  if (data.actionId === '__copy__' && Object.hasOwn(data, 'content')) return true;

  if (data.actionId.startsWith('__') && data.actionId.endsWith('__')) return true;

  return false;
};

export const isActionConfig = (data: Record<string, any>): boolean => {
  if (!isObject(data) || isObjectEmpty(data)) return false;
  if (!Object.hasOwn(data, 'actionId')) return false;

  if (isSpecialAction(data)) return true;

  if (!Object.hasOwn(data, 'type') || !Object.values(CMS_ACTION_TYPE).includes(data.type)) return false;

  return true;
};
