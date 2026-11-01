# Scaniverse 与成熟开源重建工具：最新选择

2026-10-26。用户已纠正：Scaniverse 免费，之前误认了收费情况。此前“因三天试用而排除”的建议不再作为当前选型约束。本文只做资料与现有代码记录核对，没有采集、安装、训练、画质测试或上传房间。

## 结论

对 MemoryRoom 当前阶段，优先采用 **Scaniverse Classic 手机采集与本机处理 → 导出 SPZ/PLY → 现有 Spark / Scene Graph / 记忆交互**。理由是现成、免费、设备端处理和资产可导出，能减少自研采集器与远程训练的操作成本。

这属于产品适配推荐，不是“Scaniverse 重建画质最好”的研究结论。本轮未找到能支持它全面胜过 Brush、OpenSplat、gsplat 等方法的可靠同场景、同输入、同观看位置比较。也没有用户这间房的 Scaniverse 成片。不能用产品展示片、App下载量或GitHub星数代替质量比较。

## 免费能力与闭源边界

[官方App Store说明](https://apps.apple.com/us/app/scaniverse-3d-scanner/id1541433223)明确保留Classic模式不限次数的设备端高斯采集/处理及SPZ等导出；平台新增云端重建、360相机、团队协作等有不同计划。本文推荐Classic手机模式，不把企业云功能视为全部免费。

[Niantic官方说明](https://www.nianticspatial.com/en/blog/scaniverse)确认高斯资产可导出PLY/SPZ。[SPZ项目](https://github.com/nianticlabs/spz)本身MIT开源，但不等于Scaniverse训练核心开源。采用外部资产入口不意味着已获同款扫描SDK或可以把闭源代码复制进我们App。

现有查看器源码已经允许PLY/SPZ，通过Spark加载，故文件接口可复用；仍未用Scaniverse实际导出验收其格式版本、朝向、尺度、初始视点和性能。SPZ适合传输，PLY可保留作原始导出；压缩文件小不等于运行时GPU内存及排序开销同比降低。当前整项目容量仍为256MB，导入多物品需控制总量。

## “最好效果”应分开评判

| 目标 | 当前判断 |
|---|---|
| 普通用户用iPhone较少步骤获得可导出的房间 | Scaniverse是很适合当前项目的优先选择；此为产品判断，未实测比较所有App |
| 近看桌面文字、椅腿、房间边缘的视觉细节 | 需要相同场景与观看距离比较，无法只凭官方介绍排名 |
| 几何测量、碰撞与柜门关节准确 | 高斯外观不能独立提供全部这些能力，需代理几何与尺度/坐标核对 |
| 大场景和高画质上限、可控参数 | 桌面开源工具可控制输入、分辨率、优化时长和资产数量，存在进一步改善的空间；这是工程判断，不是保证一定更好 |
| 完全自主、长期嵌入自有App | 开源采集/训练路线有价值，但手机端完整体验仍需工程整合 |

成熟App同样不能可靠恢复没有拍到的背面/内部或保证透明、镜面场景任意视点完美。采集时的颜色/覆盖反馈主要反映观察与跟踪条件；不应把刷绿理解为最终图像必然高清。[官方扫描指南](https://www.nianticspatial.com/docs/scaniverse/techniques/)本身也强调重叠、覆盖和补扫；该文档部分面向Site/VPS流程，不能混当Classic所有功能的直接说明。

## 更成熟的开源候选

本轮公开页面显示 Brush约5.2k星、OpenSplat约2.2k星、gsplat约5.8k星（会变化，非画质评分）。因此开源生态不只几个小型iOS项目。

| 项目 | 能力/设备 | 适合我们哪部分 | 许可与边界 |
|---|---|---|---|
| [Brush](https://github.com/ArthurBrussee/brush) | COLMAP/Nerfstudio数据训练，Mac/Windows/Linux等后端 | 电脑本地高斯训练，现有OOOBrush同源路线继续保留 | Apache-2.0；并非完整iPhone采集App |
| [OpenSplat](https://github.com/WebODM/OpenSplat) | Windows/Mac/Linux，CPU/GPU，接受COLMAP/OpenSfM等已配准输入 | 另一个Mac/桌面训练候选 | AGPLv3；源码集成和部署需按实际方式处理许可，不默认替换当前引擎 |
| [gsplat](https://github.com/nerfstudio-project/gsplat) | Python/PyTorch/CUDA高斯库，含训练例程 | NVIDIA机器研究和更灵活训练 | Apache-2.0；不是手机引导采集成品，不能把换库直接当质量升级 |
| [COLMAP](https://colmap.github.io/) | 相机配准与稀疏/稠密重建 | 桌面相机求解底座 | 不负责完整手机扫描体验或最终高斯训练 |
| [apple-spatial-capture](https://github.com/A7ALABS/apple-spatial-capture) | 含Swift采集、手机msplat训练和PLY导出 | 未来自有App流程参考 | MIT，iOS训练仍experimental；不是当前主产品依赖 |
| [frs0n/msplat-ios](https://github.com/frs0n/msplat-ios) | Metal/iOS训练、内存控制与PLY/SPZ导出 | 未来自有手机训练内核候选 | Apache-2.0，示例从已有相机数据开始，完整采集需要另接 |

OOOSplat本身是桌面应用，当前官方说明列Windows、Apple Silicon macOS、Ubuntu，没有核实到配套官方iPhone扫描端。手机照片/视频导入OOOSplat可行；不能把我们自研采集器或第三方采集App说成OOOSplat官方手机版。[OOOSplat](https://github.com/ooolabdev/ooosplat)

## 现成引导采集＋本地训练的补充入口

[Splatcatcher](https://splatcatcher.warp-gate.com/)明确提供LiDAR覆盖着色、模糊/弱特征/跟踪提醒、闭环指导、手机位姿细化，以及标准COLMAP图片/相机/点云导出。[App Store说明](https://apps.apple.com/us/app/splatcatcher-lidar-capture/id6759800588)包含这些功能。

其[Forge](https://splatcatcher.warp-gate.com/forge)可将采集直接送到用户自己的Mac/PC训练，再返回手机。这是用户所描述工作流的现成例子。但手机App官网写“Free for a limited time”，未核实全套源码开放，也没有本项目画质对比，不能把它当永久免费开源替代品。可只取标准相机数据交给兼容训练器；OOOSplat默认照片入口未必消费该相机数据，不能悄悄丢弃位姿再跑COLMAP后声称节省了配准。

KIRI官方将3DGS放在Pro；Polycam免费计划列有限捕获及GLTF导出，不能自动等同免费Gaussian PLY/SPZ导出。[KIRI定价](https://www.kiriengine.app/pricing)、[Polycam定价](https://poly.cam/pricing)。Scantic官方提供手机端生成，但本轮没有核实无限制完整质量免费导出，因此不当作已确认的永久免费替代推荐。

## 以前第一版实际用了什么

本地 `docs/FIRST_SCAN.md` 与 `tools/automatic_reconstruction.py`记录首次真实训练用 **Brush0.3.0**，不是msplat。初轮112张房间图、768分辨率上限、3000步/18万高斯，之后另有细化记录。最新学校成功任务是COLMAP4.2.1 + OOOBrush ooo-v1.0.0。

因此不能根据以前不满意的结果认定msplat已经失败；此前msplat主要是调研候选。早期画面问题可能同时涉及素材覆盖、位姿/内参、训练配置和查看视点，未进行控制变量对比，不单方面归因拍摄者或训练器。

## 当前选择

1. 默认入口采用Scaniverse Classic导出模型，先集中做好MemoryRoom浏览、物品与记忆体验，不要求用户操作学校GPU。
2. 保留当前已经跑通的OOOSplat/OOOBrush路线，供需要自主处理和参数控制的场景使用，不自动修改现存任务。
3. 将开源iPhone采集/训练内核列为后续自主化项目，不把其成熟度等同现成App。
4. 用户实际查看Scaniverse房间时，重点看相同位置的近景细节、缺洞/漂浮、走到其他视点的稳定性和网页性能；未做同房间比较前不宣称哪个画质第一。

原始公开资料与检索记录：`artifacts/research/2026-10-26-mobile-products/`，此前候选源码快照：`artifacts/research/2026-10-26-scaniverse/`。AnySearch认证没有写进研究文件或查询。中途被打断前的产品检索10项、最新质量与开源检索6项均已提交反馈。
