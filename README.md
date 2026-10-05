# TCL 电视局域网遥控 · Home Assistant

面向使用 TCL+/T-Cast（`tnscreen`）局域网协议的**中国区 TCL 电视**。集成提供 `media_player`、`remote` 两个实体，并附带 **TCL Glass Remote** 仪表盘卡片。无云端账号依赖；不是通用 TCL / Roku / Google TV 遥控器。

## 兼容性与验证边界

- **最低 Home Assistant Core：2026.9**，这是实际测试版本；更早版本未验证。
- 实机：**TCL 75Q9M Pro，中国区固件，UDP 协议版本 14**。其他型号、地区和固件是否兼容，取决于是否开放同一协议。
- 已实机验证：握手、心跳、音量读取/设置/加减、已安装应用列表。
- 已实现但**未实机验证效果**：应用启动、除音量加减之外的遥控键、Wake-on-LAN（WOL）。协议支持并不等于该电视支持。
- 此实机的静音读回、输入源列表未得到可用结果。集成不知道当前前台应用，也不提供可靠的屏幕开关、播放内容或播放进度读回。

电视首次配置时须已开机、局域网控制服务可达。控制使用 TCP `6553`，发现使用 UDP `6537`；可直接填电视 IP，不依赖自动发现。建议在路由器中固定电视地址。

> 仅用于可信局域网。协议使用手机应用内的固定 AES 密钥，不能将其视为身份认证；不要向公网转发电视控制端口。不要把未经安全配置的 Home Assistant 暴露到公网。

## 安装

### HACS 自定义仓库

1. 打开 HACS → 右上角菜单 → **自定义仓库 / Custom repositories**。
2. 添加 `https://github.com/DusKing1/ha-tcl-tv`，类别选择 **Integration（集成）**，不是 Dashboard。
3. 下载 **TCL TV LAN Remote**，然后重启 Home Assistant。
4. 设置 → 设备与服务 → 添加集成 → **TCL TV LAN Remote**，填写电视 IP。

这是自定义仓库安装方式，不表示项目已进入 HACS 默认仓库列表。

### 手动安装

把仓库中的整个 `custom_components/tcl_tv/` 目录复制到 Home Assistant 配置目录下的 `custom_components/tcl_tv/`，最终应有 `<config>/custom_components/tcl_tv/manifest.json`。重启 Home Assistant，再按上述第 4 步添加集成。

## 实体与控制

- `media_player.<电视实体>`：音量读取、设置、加减；`media_player.select_source` 选择**已安装应用并请求启动**，不是 HDMI 输入源选择，也不是当前前台应用读回。
- `remote.<遥控实体>`：通过 `remote.send_command` 发送 `up`、`down`、`left`、`right`、`ok`、`back`、`home`、`menu`、`volume_up`、`volume_down`、`mute`、`source`、数字等命令。

例如（实体 ID 请替换为自己在 HA 中的实际值）：

```yaml
action: remote.send_command
target:
  entity_id: remote.your_tcl_tv
data:
  command: back
```

**离线表示控制链路不可达，不证明关机、待机或熄屏。** 电源键是切换键，不是幂等的“关机”指令；集成仅在连接可用时发送。开机尝试使用 WOL，目标电视、网络适配器与待机设置是否支持均未验证，请勿据此设计可靠的电源自动化。

## TCL Glass Remote 卡片

集成自动在 **Lovelace 仪表盘资源表**中注册和更新卡片模块，**storage 资源模式无需手工添加**。不再仅依赖首页 HTML 的额外 JavaScript 导入。安装并重启后，向仪表盘添加手动卡片：

```yaml
type: custom:tcl-ipod-card
media_player: media_player.your_tcl_tv
remote: remote.your_tcl_tv
```

为兼容已有配置，卡片类型仍叫 `custom:tcl-ipod-card`；公开名称为 **TCL Glass Remote**，不是 iPod 外观复刻。可选 `name: 客厅电视` 在状态灯旁显示名字；默认不显示标题。

**推荐放进 panel 视图**（视图类型选「面板（单张卡片）」）：卡片会铺满页头下方的整屏，手机上不用再滑动，圆盘按剩余高度自动放大；放在普通 sections/masonry 视图里则按内容自然高度显示。

```yaml
views:
  - title: 电视遥控
    path: tv-remote
    type: panel
    cards:
      - type: custom:tcl-ipod-card
        media_player: media_player.your_tcl_tv
        remote: remote.your_tcl_tv
```

若自行使用 `lovelace.resource_mode: yaml` 管理资源，在资源配置中加入以下条目，并随版本更新 URL（集成不会改写你的 YAML）：

```yaml
lovelace:
  resource_mode: yaml
  resources:
    - url: /tcl_tv_static/tcl-ipod-card.js?v=0.4.0
      type: module
```

如果某个客户端显示“配置错误”，先展开查看原始错误。`Custom element doesn't exist: tcl-ipod-card` 表示模块没加载，不是电视离线；升级后重开页面以重新读取资源表。不要仅凭另一浏览器正常就认定所有 Android WebView 已通过验证。

卡片整体采用 Liquid Glass 质感：全玻璃面板、圆形方向键布局、磨砂应用图块。布局按卡片宽度切换：

| 宽度 | 布局 |
|---|---|
| 小于 640 px（手机） | 单列：「遥控 / 应用」两个分段页 + 圆盘 + 底部四键。遥控页含电源、静音、信号源和音量（滑条 + 加减）；应用页每页 6 个，左右翻页 |
| 640 px 起（平板、桌面） | 不分页：左侧同时显示常用键、音量和全部应用（超出可在应用区内滚动），右侧是大圆盘；panel 视图下竖屏改为上下排布，圆盘在下方 |

| 按钮 | 行为 |
|---|---|
| 圆盘方向键 | 发送电视方向键，按住连发；按下时圆环对应方向亮起 |
| 圆盘中央 | 发送电视 OK |
| 底部四键 | 依次为电视返回、主页、播放/暂停、菜单 |
| 应用磁贴 | 直接点击指定磁贴才请求启动；翻页按钮仅翻页 |

圆盘在所有页面含义一致：方向/确认始终控制电视，绕圈或滚轮发送电视上下键，不会选择或启动应用。应用没有默认选中项；只有明确激活指定磁贴（触摸、点击或聚焦后的键盘激活）才发送该应用的启动请求。此请求不等于前台状态确认，卡片也不提供播放状态页或电视截图。

**长按连发**：按住方向键 300 ms 后开始重发，之后每 300 ms 一次；按住音量加减 300 ms 后每 200 ms 一次；松手、触摸被取消或页面失焦即停。节奏照抄 TCL 手机遥控器——电视协议没有按下/抬起报文，长按就是重复同一个键（见[协议说明](docs/protocol.md)）。短按仍是一次；从方向键起手绕圈只发绕圈的上下键，不会叠加连发。上一条指令还在途时下一次连发会顺延，不会在松手后积压补发。

**触感反馈**：每次真正发出电视指令（包括长按的每一次重发和绕圈的每一格）、以及切换页面/翻页时，卡片向 HA 前端发 `haptic` 事件；电视离线或指令失败时发 `failure`。HA Companion App（Android/iOS）把它转成手机原生震动，Android 端走系统触感（`KEYBOARD_TAP`），需开启系统“触摸反馈”；普通浏览器仅在 HA 个人资料开启“振动”且浏览器支持 `navigator.vibrate` 时震动（iOS Safari 不支持）。

## 协议研究与支持范围

完整参考：[局域网协议说明](docs/protocol.md)，包括帧格式、精确 AES 参数、发现与握手字段、55 位能力字符串、全部已发现消息、按键、应用记录、WOL 和明确未知项。

文档区分手机应用静态行为、既有离线验证与上述实机结果。它公开研究所得协议事实，不附带 APK、原生库或反编译源码。投屏、语音、应用安装/卸载、账号、清理、AV 协商等协议目录条目**不表示本 HA 集成实现或验证了这些功能**。不支持其他协议电视的自动适配，也不承诺前台应用、屏幕状态、任意浏览器 URL 打开或精确 HDMI 切换。

## 更新记录

### 0.4.0

- 去掉卡片里默认的大标题，状态灯并入分段控件一行；panel 视图下卡片铺满页头下方整屏，手机无需滑动，圆盘随剩余高度缩放。
- 平板/桌面（卡片宽 ≥ 640 px）改为双栏：常用键、音量、全部应用与大圆盘同屏，不再分页；panel 竖屏为上下排布。
- 音量合并进遥控页；底部改为返回、主页、播放/暂停、菜单四个电视键，删除只切回本地遥控页的按钮。
- 方向键、绕圈与确认键按下时圆环对应位置亮起；分段控件滑块带过渡。

### 0.3.3

- 方向键、音量加减支持按住连发，节奏与 TCL 手机遥控器一致；松手不积压补发。
- 每次发出指令、切页、翻页触发 HA `haptic` 触感反馈，离线/失败发 `failure`。
- 修复触摸时从方向键起手绕圈只发一格：按键隐式捕获移交圆环时的 `lostpointercapture` 冒泡被误当成松手。

### 0.3.2

- 卡片加载从仅首页 `extra_module_url` 改为 Lovelace 资源表：storage 模式自动创建、更新版本并去重；YAML 模式给出明确配置路径，不改写用户 YAML。
- 在实际 HA 页面用不含 TCL 启动导入的同源 HTML 重现“Custom element doesn't exist”，注册资源后同一加载条件恢复。
- 验证了现代 Chromium 的 Android UA、触摸和标准/缺失启动导入路径；未连接用户出错的 Android 设备，不将模拟视为实机验收。


### 0.3.1

- 修复默认应用页预选第一个 App，导致圆盘确认误启动云视听小电视等应用的问题。
- 默认进入遥控页；圆盘方向、确认、旋转和键盘操作不再随上方面板切换含义。
- 删除隐式应用选择状态；应用只能从明确点击的磁贴启动，翻页不发送电视指令。
- 在真实 HA 页面拦截设备服务调用，以 CDP 触摸验证三页 × 五个圆盘按键、绕圈、键盘、分页和显式应用启动，不打扰电视播放。


### 0.3.0

- 全新 TCL Glass Remote：整体 Liquid Glass 面板、圆形方向键、磨砂应用图块，提供遥控/应用/音量三页与音量滑条。
- 按页面区分圆形控制区操作；底部遥控图标仅进行本地导航，返回图标独立发送电视返回键。
- 不模拟电视播放状态，明确应用选择与前台状态的区别；保留既有卡片类型名以兼容配置。
- 公开完整已研究协议目录与不确定性，补充中国区电视安装和验证边界。

### 初始实现

- 加入 TCL 局域网发现、TCP 握手、AES 控制与心跳。
- 提供 `media_player` / `remote` 实体、音量控制、应用列表与启动请求。
- 附带自动加载的遥控卡片，提供 HACS 自定义仓库及手动安装方式。

## 许可与致谢

本项目代码与原创文档采用 [MIT License](LICENSE)，按现状提供，不保证所有电视兼容。

感谢 MIT 项目 [jarvis2f/tcl-remote](https://github.com/jarvis2f/tcl-remote) 提供的局域网协议与遥控实现参考。扩展协议事实来自 **T-Cast / MagiConnect 10.2.0000**（`com.tnscreen.main`）静态研究；详见协议文档的证据范围和逐项类/方法引用。TCL、T-Cast 等名称属于相应权利人；本项目非官方，与 TCL 或 Home Assistant 官方无隶属关系。MIT 许可不覆盖第三方 APK、源码或商标。
