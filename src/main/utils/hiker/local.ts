import { CacheService } from '@shared/modules/cache';

const localKey = 'hiker';

export default {
  get: (rulekey: string, key: string, value: any = '') => {
    const res = CacheService.get(`${localKey}@${rulekey}@${key}`);
    return res || value;
  },
  set: (rulekey: string, key: string, value: any) => {
    const res = CacheService.set(`${localKey}@${rulekey}@${key}`, value);
    return res;
  },
  delete: (rulekey: string, key: string) => {
    const res = CacheService.remove(`${localKey}@${rulekey}@${key}`);
    return res;
  },
};
