# MemoryRoom：Remy 与 KIRI Engine 接入评估

日期：2026-10-27。本次只查阅公开资料。这个会话没有 Lightpanda，改用内置的网页搜索和读取工具；百度百科返回 403，没有读到。没有安装应用、注册账号、调用 API、上传房间数据或付费。

## 一、结论

**Remy 本身不能接入：它只支持华为鸿蒙手机，也没有找到可导出高斯文件的官方说明。** 能接入的是同一团队的专业产品 **KIRI Engine**：iOS 和 Android 都有，能导出 3DGS 的 PLY 文件，还有按次计费的 API。但 KIRI 不解决本项目最难的两件事：从整屋扫描里分离物品，以及物品拿走后的干净背景。它可以作为可替换的重建后端之一，排进[画质诊断](2026-10-27_正式成片画质诊断与路线重新评估.md)中 D 组的同素材对照。

Remy 更重要的意义在于，它是直接竞品：定位就是“3D 空间记忆”，有华为渠道，9 天用户破百万。MemoryRoom 的差异要放在可交互的物品、记忆内容和版本上，而不是“能把房间拍成 3D”。

## 二、Remy 是什么

| 项目 | 公开信息 | 来源 |
| --- | --- | --- |
| 开发方 | KIRI Innovations（KIRI Engine 团队）与华为合作 | [虎嗅专访](https://www.huxiu.com/article/4835090.html)、[IT之家](https://www.ithome.com/0/891/138.htm) |
| 上线 | 2025-10-22 随 HarmonyOS 6 在华为应用市场首发；9 天用户破百万 | 同上 |
| 平台 | 仅鸿蒙。端侧重建要求麒麟 9010s 及以上的 nova / Pura / Mate，HarmonyOS 7（API 26）及以上 | [人人都是产品经理，2026-10-12](https://www.woshipm.com/?p=6477583) |
| 拍摄方式 | 环绕拍普通视频；有引导球，另有“自由扫描”模式用于精细拍重点物品 | 同上 |
| 处理位置与耗时 | 2026-02 时为云端：物体约 5 分钟、人像约 15 分钟、场景约 40 分钟。2026-10 文章称已改为手机端重建，几分钟完成 | 虎嗅；人人都是产品经理 |
| 房间 | 2026-02-10 更新加入房间扫描，竖屏全景看、横屏像游戏一样漫游 | 虎嗅 |
| 输出 | 存入华为图库，形式是 3D 影像加 MP4；可设为锁屏、碰一碰分享；非鸿蒙用户只能收到 MP4 | 人人都是产品经理、IT之家 |
| 导出 | 创始人 2026-02 原话是“Remy 无法导出 3D 模型”，专业格式交给 KIRI Engine。之后没有找到官方开放导出的说明 | 虎嗅 |

还有一条只见于单篇二手报道、没有核实原文的信息：Insta360 X6 的空间捕捉条款写明，3D 重建由觅睿（Remy Innovation Technology，深圳）完成，见 [Radiance Fields](https://radiancefields.com/insta360-brings-gaussian-splatting-to-the-x6-with-spatial-capture)。GitHub 上的 Remy3D-Android 是社区项目，不是官方客户端。

**与本项目的关系：** 你的采集设备是 iPhone 17 Pro，用不了 Remy。即使换华为手机，也拿不到可以导入 MemoryRoom 的标准高斯文件。

## 三、KIRI Engine：能接入的部分

### 3.1 用户自己拍，再导出文件给我们

- iOS 和 Android 都有 App。3DGS 原生格式是 PLY，也能转成网格，导出 OBJ、FBX、GLB、GLTF、USDZ、PLY、XYZ，见[官方导出格式页](https://www.kiriengine.app/features/export-formats)。
- 3DGS 功能需要付费的 Pro。2024 年的报道写的是 Pro 用户专享（[CG Channel](https://www.cgchannel.com/2024/03/kiri-engine-adds-support-for-3d-gaussian-splatting)），第三方指南提到约 €90/年（[Radiance Fields](https://radiancefields.com/getting-started-with-gaussian-splatting-tools-for-beginners)）。当前价格没有核实。
- 官方文档说 3DGS 项目存成“特殊的 PLY”。它能否直接被我们的 Spark 查看器读取、朝向和尺度如何，都要拿实际文件验证。

### 3.2 我们直接调用 API

依据[官方 API 文档](http://docs.kiriengine.app/3dgs-scan/video-upload/)和 [API 介绍页](https://www.kiriengine.app/api)：

| 项目 | 内容 |
| --- | --- |
| 接口 | `POST /api/v1/open/3dgs/video`（另有图片组上传），Bearer token 认证；用 webhook 或查询获取状态 |
| 输入限制 | 视频不超过 1920×1080，时长不超过 3 分钟；图片数量上限未写明 |
| 参数 | `isMesh`（同时生成网格）、`fileFormat`（网格格式）、`isMask`（自动物体蒙版） |
| 输出 | 3DGS 的 PLY；可选网格文件 |
| 价格 | 每次调用 1 credit，1 credit = 1 美元，最低充值 500 credits，新用户送 10 credits；页面注明价格可能变动 |
| 保留期 | 生成的模型只在服务器保留 3 天；上传素材保留多久没有写明 |

## 四、对本项目各层的适配度

| 层 | KIRI 能做什么 | 判断 |
| --- | --- | --- |
| 空间背景 | 视频生成 3DGS 并导出 PLY | **可作为对照后端。** 但 API 限制视频 1080p、3 分钟，房间细节可能不如我们的高质量输入方案，要实测 |
| 可拿物品 | 物体模式加 `isMask` 自动蒙版，可同时生成网格 | **可作为 Object Capture 的备选。** 尤其适合安卓用户或反光物体；画质需要对比 |
| 从整屋分离物品 | 没有 | 不解决 |
| 干净背景 | 没有 | 不解决，仍靠“先拍物品、移走、再扫背景” |
| 朝向与尺度 | 没有看到对齐信息 | 导入时仍需我们自己校正 |
| 柜门、交互、记忆 | 没有 | 由 MemoryRoom 自己实现 |

## 五、限制与风险

- **上传和付费：** 走 API 等于把房间视频上传到第三方服务器，并且需要付费。按 AGENTS.md，这需要用户另行授权。
- **隐私：** 上传素材保留多久、是否用于训练，文档没有写明，接入前要读用户协议。
- **输入上限：** 1080p 的上限低于我们现有的 1920×1440 帧，也低于 4K 视频方案。
- **商业依赖：** 价格页注明“测试中、可能变动”；如果把 API 当默认后端，成本和可用性由对方决定。

## 六、建议

1. Remy 不接入，作为竞品跟踪，重点看它会不会加入物品交互或开放导出。
2. 把 KIRI Engine App 加进 D 组对照：用户在 iPhone 上拍同一个角落，导出 PLY，再导入工作台，和 OOOSplat 成片对比。这需要用户决定是否购买 Pro。
3. 等对照结果出来再决定是否接 API。如果接，就写成独立的 provider，不改 OOOSplat 主线；默认关闭，用户授权后才上传。
4. 可拿物品继续优先用 Apple Object Capture（免费、本机）；KIRI 的物体扫描作为跨平台备选。
