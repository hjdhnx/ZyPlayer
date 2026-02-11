<template>
  <t-config-provider :global-config="getComponentsLocale">
    <router-view />
    <disclaimer-view type="init" />
  </t-config-provider>
</template>
<script setup lang="ts">
import type { ISetup } from '@shared/config/tblSetting';
import { setupObj as tblSetup } from '@shared/config/tblSetting';
import { THEME } from '@shared/config/theme';
import { onMounted, ref, watch } from 'vue';

import { fetchSetup } from '@/api/setting';
import { useLocale } from '@/locales/useLocale';
import DisclaimerView from '@/pages/Disclaimer.vue';
import { usePlayerStore, useSettingStore } from '@/store';
import { start as startOSpy, stop as stopOSpy } from '@/utils/ospy';
import { start as startVitals, stop as stopVitals } from '@/utils/vitalsObserver';

const storePlayer = usePlayerStore();
const storeSetting = useSettingStore();

const { getComponentsLocale } = useLocale();

const setupConf = ref<ISetup>(tblSetup);

const active = ref({
  disclaimer: false,
});

watch(
  () => ({
    theme: storeSetting.theme,
    lang: storeSetting.lang,
    debug: storeSetting.debug,
  }),
  (val) => {
    if (val.theme !== setupConf.value?.theme) storeSetting.changePreferredTheme();
    if (val.lang !== setupConf.value?.lang) storeSetting.changePreferredLang();
    if (val.debug !== setupConf.value?.debug) debugMode(val.debug);

    for (const key in val) {
      setupConf.value[key] = val[key];
    }
  },
  { deep: true },
);
watch(
  () => storeSetting.displayTheme,
  () => {
    if (storeSetting.theme === THEME.SYSTEM) {
      storeSetting.changePreferredTheme();
    }
  },
);

onMounted(() => setup());

const setup = () => {
  syncStore();
};

const syncStore = async () => {
  const resp = await fetchSetup();
  setupConf.value = resp;

  const { barrage, bossKey, debug, disclaimer, lang, player, theme, timeout } = resp;

  // privacy policy
  active.value.disclaimer = !disclaimer;

  // setting store sync config
  storeSetting.updateConfig({ bossKey, debug, lang, theme, timeout: timeout || 5000 });
  // play store sync config
  storePlayer.updateConfig({ barrage, player });

  if (debug) debugMode(debug);
};
const debugMode = (type: boolean) => {
  if (type) {
    startVitals();
    startOSpy();
  } else {
    stopVitals();
    stopOSpy();
  }
};
</script>
