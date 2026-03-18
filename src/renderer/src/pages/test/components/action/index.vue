<template>
  <div class="view-component-container">
    <t-space break-line>
      <template v-for="(_value, key, index) in actions" :key="index">
        <t-button class="btn" @click="handleAction(key)">{{ key }}</t-button>
      </template>
    </t-space>

    <action-view v-model:visible="visible" :config="config" @submit="onActionSubmit" />

    <!-- <div style="margin-top: 20px; display: flex; flex-direction: column; gap: var(--td-size-4)">
      <action-section ref="actRef" :config="actions['input-qrcode-1']" @submit="onActionSubmit" />
      <t-button block @click="handleActionSubmit">测试</t-button>
    </div> -->
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';

// import ActionSection from '@/components/action/components/ActionSection.vue';
// import ActionSection from '@/components/action/components/FormActionSection.vue';
import ActionView from '@/components/action/index.vue';

const actions = ref({
  'input-calendar': {
    actionId: '扫码初始动作',
    id: 'item2',
    name: '日期（日期选择）',
    title: '日期（日期选择）',
    tip: '请输入项目2内容',
    value: '',
    selectData: '[calendar]',
    validation: '',
    inputType: 0,
  },
  'input-file': {
    actionId: '扫码初始动作',
    id: 'item2',
    title: '文件路径（文件选择）',
    name: '文件路径（文件选择）',
    tip: '请输入文件路径',
    value: '',
    selectData: '[file]',
    validation: '',
    inputType: 0,
  },
  'input-folder': {
    actionId: '扫码初始动作',
    id: 'item2',
    title: '文件夹路径（文件夹选择）',
    name: '文件夹路径（文件夹选择）',
    tip: '请输入文件夹路径',
    value: '',
    selectData: '[folder]',
    validation: '',
    inputType: 0,
  },
  'input-image-upload': {
    actionId: '扫码初始动作',
    id: 'item2',
    name: '图片选择',
    tip: '请选择图片',
    value: '',
    selectData: '[image]',
    validation: '',
    inputType: 0,
  },
  'input-qrcode-1': {
    actionId: '扫码初始动作',
    id: 'alitoken',
    type: 'input',
    title: '阿里云盘Token',
    msg: '弹出窗口就执行initAction里的动作，回调时就关闭窗口，应用于扫码场景，为了演示，动作注释了',
    button: 0,
    timeout: 20,
    qrcode: 'https://www.alipan.com/',
    // initAction: 'initAction'
  },
  'input-qrcode-2': {
    actionId: 'quarkScanCookie',
    id: 'quarkScanCookie',
    canceledOnTouchOutside: false,
    type: 'input',
    title: '夸克扫码Cookie',
    msg: '请使用夸克APP扫码登录获取',
    width: 500,
    button: 1,
    timeout: 20,
    qrcode: 'https://drplayer.playdreamer.cn/lives.jpg',
    qrcodeSize: '400',
    initAction: 'quarkScanCheck',
    initValue: '123',
    cancelAction: 'quarkScanCancel',
    cancelValue: '123',
  },
  'input-image': {
    actionId: 'test-image',
    title: '图片Action测试',
    msg: '请点击图片上的任意位置：',
    imageUrl: 'https://drplayer.playdreamer.cn/lives.jpg',
    imageClickCoord: true,
    imageHeight: 300,
    tip: '请输入坐标或点击图片',
  },
  'input-textarea': {
    actionId: 'test-edit',
    multiLine: 3,
    title: '多行编辑测试',
    msg: '请输入详细描述：',
    tip: '请输入详细描述',
    value: '这是一个多行编辑框的示例文本。\n您可以在这里输入多行内容。',
    width: 640,
    height: 400,
  },
  'input-select-1': {
    actionId: '玩偶域名',
    id: 'test-mselect-1',
    type: 'input',
    width: 450,
    title: '玩偶域名',
    tip: '请输入玩偶域名',
    value: '',
    msg: '选择或输入使用的域名',
    selectData:
      '1:=https://www.wogg.net/,2:=https://wogg.xxooo.cf/,3:=https://wogg.888484.xyz/,4:=https://www.wogg.bf/,5:=https://woggapi.333232.xyz/',
    button: 0,
  },
  'input-select-2': {
    id: 'test-mselect-2',
    title: '多项选择',
    tip: '请选择多个选项',
    value: '',
    selectData: '[请选择字母]a,b,c,d,e,f,g',
    selectWidth: 640,
    multiSelect: true,
    selectColumn: 4,
    inputType: 0,
    quickSelect: true,
    // onlyQuickSelect: true,
  },
  'multi-input': {
    actionId: 'test-multi-input',
    type: 'multiInput',
    title: '多输入测试',
    msg: '请填写用户信息：',
    button: 3,
    input: [
      { name: '姓名', required: true, tip: '请输入姓名' },
      { name: '邮箱', inputType: 3, required: true, tip: '请输入邮箱地址' },
      { name: '简介', multiLine: 3, tip: '请输入个人简介', help: '支持<b>HTML</b>格式的帮助文本' },
      {
        name: '多项选择',
        tip: '请选择多个选项',
        value: '',
        selectData: '[请选择字母]a,b,c,d,e,f,g',
        multiSelect: true,
      },
    ],
  },
  menu: {
    actionId: '单选菜单',
    type: 'menu',
    title: 'Action单选菜单',
    width: 480,
    column: 2,
    option: [
      { name: '选项1', action: 'menu1' },
      { name: '选项2', action: 'menu2' },
      { name: '菜单3', action: 'menu3' },
      { name: '菜单4', action: 'menu4' },
      '菜单5$menu5',
      '菜单6$menu6',
      '菜单7$menu7',
      '菜单8$menu8',
      '菜单9$menu9',
      '菜单10$menu10',
    ],
    selectedIndex: 3,
  },
  select: {
    actionId: '多选菜单',
    type: 'select',
    title: 'Action多选菜单',
    width: 480,
    column: 2,
    option: [
      { name: '选项1', action: 'menu1', selected: true },
      { name: '选项2', action: 'menu2' },
      { name: '选项3', action: 'menu3', selected: true },
      { name: '选项4', action: 'menu4' },
      { name: '选项5', action: 'menu5' },
      { name: '选项6', action: 'menu6' },
      { name: '选项7', action: 'menu7' },
      { name: '选项8', action: 'menu8' },
      { name: '选项9', action: 'menu9', selected: true },
      { name: '选项10', action: 'menu10', selected: true },
      { name: '选项11', action: 'menu11', selected: true },
      { name: '选项12', action: 'menu12', selected: true },
    ],
  },
  msgbox: {
    actionId: '消息弹窗',
    type: 'msgbox',
    title: '消息弹窗',
    // msg: '这是一个消息弹窗',
    // msgType: 'rich_text',
    htmlMsg: '这是一个支持 <font color=red><b>简单HTML语法</b></font> 内容的弹窗',
    imageUrl: 'https://pic.imgdb.cn/item/667ce9f4d9c307b7e9f9d052.webp',
    imageHeight: 300,
  },
  browser: {
    actionId: 'test-browser',
    type: 'browser',
    title: '小游戏',
    url: 'https://poki.com/zh',
  },
  help: {
    actionId: 'test-help',
    type: 'help',
    title: '帮助',
    data: {
      使用帮助:
        '本帮助。长按则分项选择查看。\n\n系统多数功能按键和选项，短按和长按有不同的功能。\n\n[#影图根目录]：安全起见，影图的根目录为tvbox（/storage/emulated/0/tvbox），未说明情况下文件或文件夹都是相对于此目录。',
      交互动作:
        '影图APP与站源接口间交互的动作指令（action）。用户在APP主动发出动作请求，接口根据指令返回数据或返回构建信息输入窗口的配置JSON，具有连续交互的机制。',
      动作指令:
        '接口回传给APP的动作指令，按用户交互起点分为静态动作和动态动作。\n\n[#静态动作]：用户通过视频分类列表主动发起交互的起点动作。动作指令以分类列表的视频JSON数据为基础，属于静态数据。所有交互动作的起始都是静态动作。\n\n[#动态动作]：静态动作构建的信息输入窗口提交动作(action)数据后，接口如果再次需要用户输入数据，可以返回新的动作配置JSON数据，此数据是交互过程中动态生成的，属于动态动作。数据结构：\n{\n　"action":{\n　　动作指令结构...\n　},\n　"toast":"Toast显示消息"\n}',
      动作类型: '基础动作、单项输入、多行编辑、多项输入、增强多项输入、单项选择、多项选择、消息弹窗、专项动作等。',
      视频VOD:
        '动作入口的视频分类列表VOD的JSON，vod_id字段值为字符型动作指令数据（json结构的需要转为字符型），vod_tag字段值固定为action，其它字段与视频类一致。例如：\n{\n　"vod_id":"动作指令结构...",\n　"vod_name":"显示名称",\n　"vod_tag":"action"\n}',
      接口action:
        '接口接收动作指令的方法action。以js代码为例：function action(action, value) {...}。传参action为动作指令，value为动作指令值。返回结果消息或新的动作指令数据（动态动作）。',
      基础动作:
        '简单的动作指令字符串（非JSON结构），用户点击时无信息输入窗口，直接发送指令。\n{\n　"vod_id":"hello world",\n　"vod_name":"基础动作",\n　"vod_tag":"action"\n}',
      JSON动作:
        'JSON结构的动作指令。通过JSON结构数据，配置更丰富的动作指令。通过选择配置不同的字段，定义不同的动作表现。',
      actionId: '识别动作的路由ID或专项动作指令，必须。字符型。',
      type: '动作的类型。input（单项输入）/edit（单项多行编辑）/multiInput（少于5个的多项输入）/multiInputX（增强的多项输入）/menu（单项选择）/select（多项选择）/msgbox（消息弹窗）等。字符型。',
      canceledOnTouchOutside: '弹出窗口是否允许触摸窗口外时取消窗口。逻辑型。',
      title: '标题。字符型。',
      width: '宽度。整型。',
      height: '高度。整型。',
      msg: '文本消息内容。字符型。',
      htmlMsg: 'msgbox类动作的简单html消息内容。字符型。',
      help: 'input、multiInput、multiInputX类动作的帮助说明内容，在窗口右上角显示帮助图标，点击显示帮助说明，可支持简易的HTML内容。支持的HTML标签，b（加粗）、i（斜体）、u（下划线）、strike（删除线）、em（强调）、strong（加强强调）、p（段落）、div（分区）、br（换行）、font（颜色/大小/字体）、h1~h6（标题层级）、small（小号字体）、tt（打字机字体）、blockquote（引用块）。',
      button: '按键的数量。0-无按键，1-取消，2-确定/取消, 3-确定/取消/重置。整型。',
      imageUrl: '图片URL。字符型。',
      imageHeight: '图片高度。整型。',
      imageClickCoord: '是否检测图片的点击坐标输入。逻辑型。',
      qrcode: '生成二维码的URL。字符型。',
      qrcodeSize: '二维码的大小。整型。',
      timeout: '超时时间（秒）。超时自动关闭窗口。整型。',
      httpTimeout: 'T4源的动作网络访问超时时间（秒）。',
      keep: '输入确认后，窗口是否保持。逻辑型。',
      initAction: '窗口弹出时自动发送的初始化动作指令。字符型。',
      initValue: '窗口弹出时自动发送的初始化指令值。字符型。',
      cancelAction: '按窗口的取消键时发送的取消动作指令。字符型。',
      cancelValue: '按窗口的取消键时发送的取消动作指令值。字符型。',
      tip: '单项输入的输入提示，单项输入时必须。字符型。',
      value: '单项输入的初始化值。字符型。',
      selectData:
        '单项输入的预定义选项，用于常见值的快速选择输入。各选项间用“,”分隔，选项值可使用“名称:=值”方式。字符型。',
      input:
        '多项输入的项目定义JSON数组。每个输入项目使用一个JSON对象进行定义。\n\n[#id]：项目id。\n\n[#name]：项目名称。\n\n[#tip]：项目输入提示。\n\n[#value]：项目初始值。\n\n[#selectData]：项目输入预定义选项。各选项间用“,”分隔，选项值可使用“名称:=值”方式。特殊的输入选择：[folder]-选择文件夹，[file]-选择文件，[calendar]-选择日期，[image]-选择图像文件转为BASE64。multiInputX。\n\n[#quickSelect]：是否能快速选择。单项选择时有效。quickSelect为true且inputType为0时，只输入快速选择项目不显示输入框等。multiInputX。\n\n[#onlyQuickSelect]：是否只快速选择，隐藏输入框等。单项选择时有效。multiInputX。\n\n[#selectWidth]：选择窗的宽度。multiInputX。\n\n[#multiSelect]：是否多选。multiInputX。\n\n[#selectColumn]：选择窗的列数。multiInputX。\n\n[#inputType]：项目输入类型。0-项目输入框只读，但可通过选项输入。129-密码输入。inputType为0且quickSelect为true时，只输入快速选择项目不显示输入框等。multiInputX。\n\n[#multiLine]：项目输入框的行数（多行编辑）。multiInputX。\n\n[#validation]：提交时项目输入值校验正则表达式。multiInputX。\n\n[#help]：项目输入的帮助说明，可支持简易的HTML内容。支持的HTML标签，b（加粗）、i（斜体）、u（下划线）、strike（删除线）、em（强调）、strong（加强强调）、p（段落）、div（分区）、br（换行）、font（颜色/大小/字体）、h1~h6（标题层级）、small（小号字体）、tt（打字机字体）、blockquote（引用块）。multiInputX。',
      dimAmount: '设置窗口背景暗化效果，用于调整背景的暗化程度（透明度）。其值范围为0.0到1.0。',
      bottom: '底部对齐和底边距。整型。',
      column: '单项选择或多项选择窗口的列数。整型。',
      option:
        '单项选择或多项选择的选项定义JSON数组。每个选项使用一个JSON对象进行定义。\n\n[#name]：选项名称。\n\n[#action]：选项动作值。\n\n[#selected]：选项默认是否已选。多项选择是可用。',
      单项输入:
        "type为input。要求用户输入一个字段的动作，JSON结构，部分字段根据需要选用。\n{\n　actionId:'动作路由ID',\n　id:'输入项目id',\n　type:'input',\n　width:450,\n　title:'输入窗口标题',\n　tip:'输入提示',\n　value:'输入初始值',\n　msg:'窗口文本说明',\n　imageUrl:'窗口显示图片的URL',\n　imageHeight:200,\n　qrcode:'生成二维码的URL',\n　qrcodeSize:'300',\n　initAction:'initAction',\n　initValue:requestId,\n　button:2,\n　selectData:'1:=快速输入一,2:=快速输入二,3:=快速输入三'\n}",
      多行编辑: 'type为edit。要求用户在一个多行编辑区输入单个字段内容的动作，JSON结构。',
      多项输入: 'type为multiInput。要求用户输入多个字段（5个以内）的动作，JSON结构。建议使用“增强多项输入”动作。',
      增强多项输入: 'type为multiInputX。要求用户输入多个字段（不限制个数）的动作，JSON结构。',
      单项选择: 'type为menu。要求用户在列表中选择一个项目的动作，JSON结构。',
      多项选择: 'type为select。要求用户在列表中选择多个项目的动作，JSON结构。',
      消息弹窗: 'type为msgbox。弹出窗口显示消息，JSON结构。',
      专项动作:
        '专项动作为动态动作，接口让APP执行一些特定的行为动作。actionId值为行为特定的标识。__self_search__（源内搜索）、__detail__（详情页）、__ktvplayer__（KTV播放）、__refresh_list__（刷新列表）、__copy__（复制）、__keep__（保持窗口）。',
      __self_search__:
        '源内搜索。\n\n[#skey]：目标源key，可选，未设置或为空则使用当前源。\n\n[#name]：搜索分类名称。\n\n[#tid]：使用分类ID传递的搜索值。\n\n[#flag]：列表视图参数。\n\n[#folder]：多个分类切换搜索的配置，设置此项则忽略name、tid和flag。folder可多项合并设置为一个字符，各项间使用“#”分隔，每项中的name、tid和flag使用“$”分隔。floder也可使用JSON数组，每项分别设置name、tid和flag。',
      __detail__: '跳转到指定站源解析详情页播放。\n\n[#skey]：目标源key。\n\n[#ids]：传递给详情页的视频ids。',
      __ktvplayer__: '跳转到KTV播放器播放指定链接。\n\n[#name]：歌名。\n\n[#id]：歌曲的直链。',
      __refresh_list__:
        '刷新指定分类列表。listTab指定要刷新哪个分类的列表，不指定则刷新当前分类的列表。\n\n[#listTab]：分类列表的标识，可以是列表的序号、名称、分类ID（前面加“id:”）。',
      __copy__: '把返回的内容复制到剪贴板。content：复制的内容',
      __keep__: '保持窗口不关闭。\n\n[#msg]：更新窗口里的文本消息内容。\n\n[#reset]：窗口中的输入项目内容是否清空。',
      图片坐标示例:
        "获取在图片点击的位置坐标用于验证输入的js示例。\n　{\n　　vod_id:　JSON.stringify({\n　　　actionId:　'图片点击坐标',\n　　　id:　'coord',\n　　　type:　'input',\n　　　title:　'图片点击坐标',\n　　　tip:　'请输入图片中文字的坐标',\n　　　value:　'',\n　　　msg:　'点击图片上文字获取坐标',\n　　　imageUrl:　'https://pic.imgdb.cn/item/667ce9f4d9c307b7e9f9d052.webp',\n　　　imageHeight:　300,\n　　　imageClickCoord:　true,\n　　　button:　3,\n　　}),\n　　vod_name:　'图片点击坐标',\n　　vod_pic:　'https://pic.imgdb.cn/item/667ce9f4d9c307b7e9f9d052.webp',\n　　vod_tag:'action'\n　}",
      多项输入示例:
        "多个不同类型输入项的js示例。\n　{\n　　vod_id:　JSON.stringify({\n　　　actionId:　'多项输入',\n　　　type:　'multiInputX',\n　　　canceledOnTouchOutside:　true,\n　　　title:　'多项输入(multiInputX)',\n　　　width:　716,\n　　　bottom:　1,\n　　　dimAmount:　0.3,\n　　　button:　3,\n　　　input:　[\n　　　　{\n　　　　　id:　'item1',\n　　　　　name:　'文件夹路径（文件夹选择器）',\n　　　　　tip:　'请输入文件夹路径',\n　　　　　value:　'',\n　　　　　selectData:　'[folder]',\n　　　　　inputType:　0,\n　　　　},\n　　　　{\n　　　　　id:　'item2',\n　　　　　name:　'日期（日期选择器）',\n　　　　　tip:　'请输入项目2内容',\n　　　　　value:　'',\n　　　　　selectData:　'[calendar]',\n　　　　　inputType:　0,\n　　　　　\n　　　　},\n　　　　{\n　　　　　id:　'item3',\n　　　　　name:　'文件路径（文件选择器）',\n　　　　　tip:　'请输入文件路径',\n　　　　　value:　'',\n　　　　　selectData:　'[file]',\n　　　　　inputType:　0,\n　　　　},\n　　　　{\n　　　　　id:　'item4',\n　　　　　name:　'多项选择',\n　　　　　tip:　'请输入多项内容，以“,”分隔',\n　　　　　value:　'',\n　　　　　selectData:　'[请选择字母]a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z',\n　　　　　selectWidth:　640,\n　　　　　multiSelect:　true,\n　　　　　selectColumn:　4,\n　　　　　inputType:　0,\n　　　　},\n　　　　{\n　　　　　id:　'item5',\n　　　　　name:　'多行输入',\n　　　　　tip:　'请输入项目5内容',\n　　　　　value:　'',\n　　　　　multiLine:　5,\n　　　　},\n　　　　{\n　　　　　id:　'item6',\n　　　　　name:　'密码输入',\n　　　　　tip:　'请输入项目6内容',\n　　　　　value:　'',\n　　　　　inputType:　129,\n　　　　},\n　　　　{\n　　　　　id:　'item7',\n　　　　　name:　'图像base64（图像文件选择器）',\n　　　　　tip:　'请输入项目7内容',\n　　　　　value:　'',\n　　　　　selectData:　'[image]',\n　　　　　multiLine:　3,\n　　　　　inputType:　0,\n　　　　},\n　　　　{\n　　　　　id:　'item8',\n　　　　　name:　'单项选择',\n　　　　　tip:　'请输入项目8内容',\n　　　　　value:　'',\n　　　　　selectData:　'[请选择地方]a,b,c,d'\n　　　　},\n　　　　{\n　　　　　id:　'item9',\n　　　　　name:　'单行输入并校验',\n　　　　　tip:　'请输入项目9内容',\n　　　　　value:　'',\n　　　　　validation:　'[0-9]{6,12}',\n　　　　}\n　　　]\n　　}),\n　　vod_name:　'多项输入',\n　　vod_tag:'action'\n　}",
    },
  },
});
const visible = ref(false);
const config = ref<any>({});
// const actRef = ref();

const handleAction = (key: string) => {
  config.value = actions.value[key];
  visible.value = true;
};

// const handleActionSubmit = () => {
//   actRef.value?.submit();
// };

const onActionSubmit = (id: string, data: Record<string, any>) => {
  console.log(`Action submitted with ${id}:`, data);
};
</script>
<style scoped>
.view-component-container {
  width: 100%;
  height: 100%;
  padding: 0 var(--td-comp-paddingLR-s) var(--td-comp-paddingTB-s) 0;
}
</style>
