# 上游模块与来源

## 当前实际运行的依赖

| 模块 | 固定版本 | 用途 | 许可 / 来源 |
|---|---|---|---|
| Spark | 2.3.1 | SplatMesh、高斯加载与渲染 | MIT；https://github.com/sparkjsdev/spark |
| Three.js | 0.180.0 | 场景层级、网格、相机、OrbitControls | MIT；https://github.com/mrdoob/three.js |
| fflate | 0.8.2 | 本地项目包压缩/解压 | MIT；https://github.com/101arrowz/fflate |
| Zod | 3.25.76 | 场景输入验证 | MIT；https://github.com/colinhacks/zod |
| Pillow | 11.3.0 | 图像尺寸验证、RGBA 蒙版处理 | HPND；https://github.com/python-pillow/Pillow |
| NumPy | 2.5.4 | LiDAR 解投影与原始深度检查 | BSD-3-Clause；https://github.com/numpy/numpy |
| Brush | 0.3.0 Apple Silicon 官方发布版 | 本机高斯训练、PLY 导出 | Apache-2.0；https://github.com/ArthurBrussee/brush/releases/tag/v0.3.0 |
| ZIPFoundation | 0.9.20 | iPhone 端打包原始采集 | MIT；https://github.com/weichsel/ZIPFoundation |

没有复制上述项目的完整应用。通过 npm 或 Python 包接口复用；`package-lock.json` 与 iOS 工程的 `Package.resolved` 锁定依赖。网页不使用外部 CDN、远程字体或云端模型 API。合成示例模型完全由本项目代码生成。

`THIRD_PARTY_NOTICES.md` 保留当前运行时 JS 库的许可。未为本项目自有代码擅自选定开源许可证；是否公开与采用哪种许可由用户后续决定。

## 待接入的采集/重建组件

| 项目 | 已核对入口 | 状态 |
|---|---|---|
| Stera recorder | https://github.com/fpv-labs/stera-app/tree/main/packages/stera_recorder | Apache-2.0；保留为后续跨平台参考；当前 iPhone 端采用本项目原生 ARKit 录制，未引入其 Flutter 插件 |
| Stera SDK | https://github.com/fpv-labs/stera-sdk | Apache-2.0；实验性提取脚本已按 `MCAPReader`、`camera_pose.rotation/translation`、`R_optical_to_link` 编写，未安装/实机验证 |
| SAM2 | https://github.com/facebookresearch/sam2 | Apache-2.0；考虑 SAM2.1 tiny/small，尚未下载代码或权重 |
| Brush | https://github.com/ArthurBrussee/brush | 0.3.0 官方 ARM64 包已下载并通过 SHA-256 核对；已完成首个真实房间试训与 6000 步检查点；新版自动任务队列已写入，待新引导采集完整闭环 |
| OOOSplat | https://github.com/ooolabdev/ooosplat | 仅参考任务管理思路，未复制其桌面应用；其 Brush 分支参数不可直接照搬 |

本轮重看过 Stera SDK `_session.py`：RGB 同步帧、内参、相机 link 位姿及 optical 转换具备输出基础。但坐标、设备图像方向与深度使用仍需首个真机样本闭环验证。保留源码与接口核对、运行测试、实机结果之间的区别。

Brush 程序与原始许可证保留在 `vendor/brush/v0.3.0/`（不纳入 Git），版本元数据与官方接口核对在 `artifacts/brush-release.json`、`artifacts/brush-nerfstudio.rs`。仅从其官方 GitHub 发布下载；不发送采集数据到网络。

RoomPlan 通过 iOS 系统公开 SDK 调用，共享 ARSession，提供房间结构和扫描指令。不是开源重建代码，不将系统识别出的墙体等同于照片级高斯模型。
