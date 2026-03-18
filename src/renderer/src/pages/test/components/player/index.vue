<template>
  <div class="test-player view-component-container">
    <div class="content">
      <multi-player ref="mseRef" class="video" @update-time="updateTime">
        <template #header>
          <div>请勿相信视频中出现的任何广告</div>
        </template>
      </multi-player>

      <div class="action">
        <t-space align="center" size="small" break-line>
          <t-space align="center" size="small" break-line>
            <t-input v-model="form.url" label="链接" clearable />
            <t-input-number v-model="form.startTime" :min="0" :step="5" label="起始" theme="column" auto-width />
            <t-select v-model="form.next" label="下集" auto-width>
              <t-option :value="true" label="开"></t-option>
              <t-option :value="false" label="关"></t-option>
            </t-select>
            <t-select v-model="form.quality" label="多画质" auto-width>
              <t-option :value="true" label="开"></t-option>
              <t-option :value="false" label="关"></t-option>
            </t-select>
            <t-select v-model="form.type" label="类型" auto-width>
              <t-option value="auto" label="auto"></t-option>
              <t-option value="audio" label="audio"></t-option>
              <t-option value="hls" label="hls"></t-option>
              <t-option value="flv" label="flv"></t-option>
              <t-option value="mp4" label="mp4"></t-option>
              <t-option value="dash" label="dash"></t-option>
              <t-option value="torrent" label="torrent"></t-option>
            </t-select>
            <t-select v-model="form.player" label="播放器" auto-width>
              <t-option value="artplayer" label="artplayer"></t-option>
              <t-option value="dplayer" label="dplayer"></t-option>
              <t-option value="nplayer" label="nplayer"></t-option>
              <t-option value="oplayer" label="oplayer"></t-option>
              <t-option value="xgplayer" label="xgplayer"></t-option>
            </t-select>
            <t-button theme="default" @click="createEvent">创建</t-button>
            <t-button theme="default" @click="destroyEvent">摧毁</t-button>
          </t-space>

          <t-space align="center" size="small">
            <t-button theme="default" @click="playEvent">播放</t-button>
            <t-button theme="default" @click="pauseEvent">暂停</t-button>
            <t-button theme="default" @click="togglePlayEvent">播放/暂停</t-button>
          </t-space>

          <t-space align="center" size="small" break-line>
            <span>音量</span>
            <t-input-number v-model="form.volume" :max="1" :min="0" :step="0.1" :decimal-places="1" theme="column" />
            <t-button theme="default" @click="volumeEvent">设置</t-button>
            <t-button theme="default" @click="getVolumeEvent">获取</t-button>
          </t-space>

          <t-space align="center" size="small" break-line>
            <span>静音</span>
            <t-radio-group v-model="form.muted" variant="default-filled" @click="mutedEvent">
              <t-radio-button :value="true">静音</t-radio-button>
              <t-radio-button :value="false">不静音</t-radio-button>
            </t-radio-group>
            <t-button theme="default" @click="getMutedEvent">获取</t-button>
          </t-space>

          <t-space align="center" size="small">
            <span>进度</span>
            <t-input-number v-model="form.seek" :min="0" :step="5" :decimal-places="2" theme="column" />
            <t-button theme="default" @click="seekEvent">设置</t-button>
            <t-button theme="default" @click="getSeekEvent">获取</t-button>
          </t-space>

          <t-space align="center" size="small">
            <span>倍速</span>
            <t-input-number v-model="form.speed" :max="2" :min="0.5" :step="0.25" :decimal-places="2" theme="column" />
            <t-button theme="default" @click="speedEvent">设置</t-button>
            <t-button theme="default" @click="getSpeedEvent">获取</t-button>
          </t-space>

          <t-space align="center" size="small">
            <span>弹幕</span>
            <t-input v-model="form.barrageId" />
            <t-button label="后端标识" theme="default" @click="danmuLoadEvent('id')">加载</t-button>
            <t-input v-model="form.barrageCustom" />
            <t-button label="自定义" theme="default" @click="danmuLoadEvent('custom')">加载</t-button>
          </t-space>
        </t-space>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import axios from 'axios';
import { MessagePlugin } from 'tdesign-vue-next';
import { onMounted, ref } from 'vue';

import { fetchRecBarrage } from '@/api/film';
import { mediaUtils, MultiPlayer } from '@/components/multi-player';
import { emitterChannel } from '@/config/emitterChannel';
import emitter from '@/utils/emitter';

const mseRef = ref();

const form = ref({
  player: 'artplayer',
  startTime: 5,
  next: true,
  quality: false,
  type: 'auto',
  // url: 'https://sf1-cdn-tos.huoshanstatic.com/obj/media-fe/xgplayer_doc_video/mp4/xgplayer-demo-360p.mp4',
  // url: 'http://static.smartisanos.cn/common/video/t1-ui.mp4',
  url: 'https://sf1-cdn-tos.huoshanstatic.com/obj/media-fe/xgplayer_doc_video/hls/xgplayer-demo.m3u8',
  // url: 'https://voddemo-play.volcvod.com/10501b001bdd43ae89d7c0fc3d6792b5/main.m3u8?a=0&auth_key=1773925042-f0489f7ac9a14d92b96bbfb7b39a7a0d-0-4e57d65b22e9aefe63ba1c519218e9fe&br=966&bt=966&cd=0%7C0%7C0&ch=0&cr=0&cs=0&cv=1&dr=0&ds=4&er=0&l=2023032020544973DCCFE21CF4C02E38B1&lr=&mime_type=video_mp4&net=0&pl=0&qs=0&rc=amg6c2o0aTg6ZTQzNGRnM0ApOmZkZzg1PGVoNzhkOzxlZ2dfZy9gMHFrYTBgLS1kYy9zcy00L2JfL19eYF42Ly0vYi06Yw%3D%3D&vl=&vr=',
  // url: 'https://sf1-cdn-tos.huoshanstatic.com/obj/media-fe/xgplayer_doc_video/music/audio.mp3',
  volume: 0.5,
  seek: 10,
  muted: false,
  speed: 0.75,
  barrageId: 'https://v.qq.com/x/cover/mzc00200xntoaip/a4101fjl3l1.html',
  barrageCustom: 'https://dmku.hls.one/?ac=dm&url=https://v.qq.com/x/cover/mzc00200xntoaip/a4101fjl3l1.html',
});

onMounted(() => {
  // tool();
  // timer();
});

// @ts-expect-error declared but its value is never read
// eslint-disable-next-line ts/no-unused-vars
const tool = async () => {
  const checkTypeSuffix = await mediaUtils.checkMediaType(
    'https://sf1-cdn-tos.huoshanstatic.com/obj/media-fe/xgplayer_doc_video/mp4/xgplayer-demo-360p.mp4',
  );
  console.log('checkTypeSuffix', checkTypeSuffix);
  const checkTypeContentType = await mediaUtils.checkMediaType(
    'https://voddemo-play.volcvod.com/453b1f794dfa49f4819b5d923658411a?auth_key=1776913683-830c08a311bb49fab40dbaa90ebd4db3-0-1b61cbd491235c69d89a694bd51a1027',
  );
  console.log('checkTypeContentType', checkTypeContentType);
  const headers = { 'multi-part': 'zyfun', 'user-agent': 'zy', host: 'zy.fun' };
  console.log('origin-headers', headers);
  const safeHeaders = mediaUtils.removeUnSafeHeaders(headers);
  console.log('safe-headers', safeHeaders);
  const urlHeaders = mediaUtils.convertStandardToUri('https://zy.fun', headers);
  console.log('url-headers', urlHeaders);
  const electronHeaders = mediaUtils.convertWebToElectron(headers);
  console.log('electron-headers', electronHeaders);
  const mime2ext = mediaUtils.getExtensionFromMime('video/mp4');
  console.log('mime2ext', mime2ext);
  const ext2mime = mediaUtils.getMimeFromExtension(mime2ext!);
  console.log('ext2mime', ext2mime);
  const pathExt = mediaUtils.getFileExtension(
    'magnet:?xt=urn:btih:08ada5a7a6183aae1e09d831df6748d566095a10&dn=Sintel&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&ws=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2F&xs=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2Fsintel.torrent',
  );
  console.log('path2ext', pathExt);
  const streamType = await mediaUtils.getStreamContentType(
    'https://voddemo-play.volcvod.com/453b1f794dfa49f4819b5d923658411a?auth_key=1776913683-830c08a311bb49fab40dbaa90ebd4db3-0-1b61cbd491235c69d89a694bd51a1027',
  );
  console.log('streamType', streamType);
  const streamType2Ext = await mediaUtils.getStreamContentTypeToExtension(
    'https://sf1-cdn-tos.huoshanstatic.com/obj/media-fe/xgplayer_doc_video/hls/segment-0.ts',
    {},
  );
  console.log('streamType2Ext', streamType2Ext);
  const ext2decoder1 = mediaUtils.getDecoderFromExtension(pathExt);
  console.log('ext2decoder1', ext2decoder1);
  const ext2decoder2 = mediaUtils.getDecoderFromExtension(streamType2Ext!);
  console.log('ext2decoder2', ext2decoder2);
  const isHevc = mediaUtils.isHEVCVideoSupported();
  console.log('isHevc', isHevc);
  const isSafeHeaderStr = mediaUtils.isSafeHeader('cookie');
  console.log('isSafeHeaderStr', isSafeHeaderStr);
  const isSafeHeaderArr = mediaUtils.isSafeHeader(['cookie', 'user-agent']);
  console.log('isSafeHeaderArr', isSafeHeaderArr);
  const isSafeHeaderObj = mediaUtils.isSafeHeader({ xx: 'xx', yy: 'yy' });
  console.log('isSafeHeaderObj', isSafeHeaderObj);
};

// @ts-expect-error declared but its value is never read
// eslint-disable-next-line ts/no-unused-vars
const timer = () => {
  // setTimeout();
  const volumeList = [0.9, 0.5, 0.8, 0.2, 0.4];
  const randomVolume = volumeList[Math.floor(Math.random() * volumeList.length)];

  const platrateList = [0.5, 2, 1.5];
  const randomPlatrate = platrateList[Math.floor(Math.random() * platrateList.length)];

  setTimeout(() => {
    console.log(`[3] pause + setVolume: ${randomVolume}`);
    console.log('time', mseRef.value.time());
    mseRef.value.pause();
    mseRef.value.setVolume(randomVolume);
    mseRef.value.onTimeUpdate();
  }, 3000);

  setTimeout(() => {
    console.log(`[5] seek + muted + set rate: ${randomPlatrate}`);
    mseRef.value.seek(3);
    console.log('time', mseRef.value.time());
    mseRef.value.setVolume(0);
    mseRef.value.setPlaybackRate(randomPlatrate);
  }, 5000);

  setTimeout(async () => {
    console.log('[8] play + reset');
    console.log('volume-0', mseRef.value.volume());
    console.log(`rate-${randomPlatrate}`, mseRef.value.playbackRate());
    mseRef.value.play();
    mseRef.value.setVolume(randomVolume);
    mseRef.value.setPlaybackRate(0.5);
  }, 8000);

  setTimeout(async () => {
    console.log('[10] togglePlay-stop');
    mseRef.value.togglePlay();
  }, 10000);

  setTimeout(async () => {
    console.log('[15] destroy');
    console.log(`volume-${randomVolume}`, mseRef.value.volume());
    console.log('rate-0.5', mseRef.value.playbackRate());
    console.log('time', mseRef.value.time());
    mseRef.value.destroy();
  }, 15000);
};

const updateTime = ({ currentTime, duration }) => {
  console.debug(`current:${currentTime} - duration:${duration}`);
};

const create = async () => {
  const options: Record<string, any> = {
    url: form.value.url,
    isLive: false,
    // autoplay: true,
    type: form.value.type,
    container: 'mse',
    next: form.value.next,
    headers: { 'multi-part': 'zyfun' },
    startTime: form.value.startTime,
  };
  if (mseRef.value.instance()) {
    options.headers = { 'multi-part': 'zyplayer' };
    // options.headers = {};
  }
  if (form.value.quality) {
    options.quality = [
      {
        name: '标清',
        url: 'https://voddemo-play.volcvod.com/10501b001bdd43ae89d7c0fc3d6792b5/main.m3u8?a=0&auth_key=1773925042-f0489f7ac9a14d92b96bbfb7b39a7a0d-0-4e57d65b22e9aefe63ba1c519218e9fe&br=966&bt=966&cd=0%7C0%7C0&ch=0&cr=0&cs=0&cv=1&dr=0&ds=4&er=0&l=2023032020544973DCCFE21CF4C02E38B1&lr=&mime_type=video_mp4&net=0&pl=0&qs=0&rc=amg6c2o0aTg6ZTQzNGRnM0ApOmZkZzg1PGVoNzhkOzxlZ2dfZy9gMHFrYTBgLS1kYy9zcy00L2JfL19eYF42Ly0vYi06Yw%3D%3D&vl=&vr=',
      },
      {
        name: '高清',
        url: 'https://sf1-cdn-tos.huoshanstatic.com/obj/media-fe/xgplayer_doc_video/hls/xgplayer-demo.m3u8',
      },
    ];
  }

  // options = {
  //   ...options,
  //   type: 'm3u8',
  //   url: 'https://sf1-cdn-tos.huoshanstatic.com/obj/media-fe/xgplayer_doc_video/hls/xgplayer-demo.m3u8',
  // };

  // options = {
  //   ...options,
  //   type: 'mpegts',
  //   url: 'https://sf1-cdn-tos.huoshanstatic.com/obj/media-fe/xgplayer_doc_video/hls/segment-0.ts',
  // };

  // options = {
  //   ...options,
  //   type: 'flv',
  //   url: 'https://sf1-cdn-tos.huoshanstatic.com/obj/media-fe/xgplayer_doc_video/flv/xgplayer-demo-720p.flv',
  // };

  // options = {
  //   ...options,
  //   type: 'dash',
  //   url: 'https://sf1-cdn-tos.huoshanstatic.com/obj/media-fe/xgplayer_doc_video/dash/xgplayer-demo-dash1.mpd',
  // };

  // options = {
  //   ...options,
  //   type: 'shaka',
  //   url: 'https://sf1-cdn-tos.huoshanstatic.com/obj/media-fe/xgplayer_doc_video/dash/xgplayer-demo-dash1.mpd',
  // };

  // options = {
  //   ...options,
  //   type: 'torrent',
  //   url: 'magnet:?xt=urn:btih:08ada5a7a6183aae1e09d831df6748d566095a10&dn=Sintel&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&ws=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2F&xs=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2Fsintel.torrent',
  // };

  await mseRef.value.create(options, form.value.player);
};

const danmuLoadEvent = async (type: string) => {
  const LOCAL_DANMU = [
    [20.22, 'right', '#fff', '32px', '测试乱序: 乱序第一条, 时间应该最后一条'],
    ['15', 'right', '#fff', '32px', '看完五哈马上来跑男报到'],
    [15, 'right', '#67c84e', '32px', '测试时间: 2025-06-14'],
    ['15.25', 'bottom', '#67c84e', '32px', '测试位置: bottom'],
    ['15.5', 'top', '#67c84eff', '32px', '测试位置: top'],
    ['15.75', 'right', '#67c84e6f', '32px', '测试位置: right'],
    ['16', 'left', '#67c', '32px', '测试位置: left'],
    ['16.5', 'right', '#165aed', '32px', '测试颜色: #165aed'],
    ['16.7', 'right', '#165aed7f', '32px', '测试透明度: #165aed7f'],
    ['16.9', 'right', '#165aed7f', '50px', '测试字体: 50px'],
    [17, 'right', '#c3cad6e5', '32px', '测试日文: 君だよ 君なんだよ  教えてくれた'],
    [17.25, 'right', '#fff', '32px', '测试中文: 周深周深周深周深周深啊啊啊啊'],
    [17.5, 'right', '#fff', '32px', '测试英文: Johnny!!!!!!!'],
    [17.55, 'right', '#fff', '32px', `测试特殊字符半角: !@#$%^&*()_+-={}[]\|;:''""<>,./?`],
    [17.55, 'right', '#fff', '32px', '测试特殊字符全角: ～！@#¥%……&*（—-=）【】、；‘’，。/？《》“”；「」｜、'],
    ['17.667', 'bottom', '#f5712c', '32px', '测试炮火模式: 好听+1'],
    ['17.667', 'bottom', '#f5712c', '32px', '测试炮火模式: 好听+1'],
    ['17.667', 'bottom', '#f5712c', '32px', '测试炮火模式: 好听+1'],
    ['17.667', 'bottom', '#f5712c', '32px', '测试炮火模式: 好听+1'],
    ['17.68', 'right', '#f5712c', '32px', '测试emoji: 😄😭🤣😮‍💨😅😯'],
    [17.782, 'left', '#533d816f', '32px', 'sayaka~'],
    [17.99, 'right', '#fff', '32px', '听了好多次了'],
    [19, 'right', '#fff', '32px', 'ending~~~~~~~~~'],
  ];

  const normalizeRawDanmu = (list) =>
    list.map(([t, type, color, _size, text]) => ({
      id: `local-${Math.random().toString(16).slice(2)}`,
      time: Number.parseFloat(String(t)),
      type,
      color,
      text,
    }));

  let danmuList = normalizeRawDanmu(LOCAL_DANMU);

  try {
    if (type === 'id' && form.value.barrageId) {
      const response = await fetchRecBarrage({ id: form.value.barrageId });
      if (Array.isArray(response?.list) && response.list.length) danmuList = response.list;
    } else if (type === 'custom' && form.value.barrageCustom) {
      const response = await axios.get(form.value.barrageCustom);
      if (Array.isArray(response.data.danmuku) && response.data.danmuku.length)
        danmuList = normalizeRawDanmu(response.data.danmuku);
    }
  } catch {}

  mseRef.value.barrage(danmuList, '7ecb27c9c53cf3aa');
};

const destroyEvent = () => {
  mseRef.value.destroy();
};

const seekEvent = () => {
  mseRef.value.seek(form.value.seek);
};

const getSeekEvent = () => {
  const time = mseRef.value.time();
  MessagePlugin.info(`当前时间: ${time.currentTime} - 总时长: ${time.duration}`);
};

const speedEvent = () => {
  mseRef.value.setPlaybackRate(form.value.speed);
};

const getSpeedEvent = () => {
  const rate = mseRef.value.playbackRate();
  MessagePlugin.info(`当前倍速: ${rate}`);
};

const volumeEvent = () => {
  mseRef.value.setVolume(form.value.volume);
};

const getVolumeEvent = () => {
  const volume = mseRef.value.volume();
  MessagePlugin.info(`当前音量: ${volume}`);
};

const mutedEvent = () => {
  mseRef.value.setMuted(form.value.muted);
};
const getMutedEvent = () => {
  const muted = mseRef.value.muted();
  form.value.muted = muted;
  MessagePlugin.info(`当前静音状态: ${muted}`);
};

const createEvent = () => {
  // xgplayer artplayer dplayer nplayer oplayer
  create();
};

const playEvent = () => {
  mseRef.value.play();
};

const pauseEvent = () => {
  mseRef.value.pause();
};

const togglePlayEvent = () => {
  mseRef.value.togglePlay();
};

emitter.on(emitterChannel.COMP_MULTI_PLAYER_PLAYNEXT, ({ data: _eventData }) => {
  MessagePlugin.info('播放下集事件触发');
});
</script>
<style lang="less" scoped>
.view-component-container {
  width: 100%;
  height: 100%;
  padding: 0 var(--td-comp-paddingLR-s) var(--td-comp-paddingTB-s) 0;

  .content {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--td-size-4);

    .video {
      height: 100%;
      width: 100%;
      flex: 1;
      border-radius: var(--td-radius-medium);
    }

    .action {
      flex-shrink: 0;
    }
  }
}
</style>
