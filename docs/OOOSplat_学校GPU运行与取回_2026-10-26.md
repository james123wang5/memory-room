# OOOSplat 学校运行与取回

## 本次实际运行

用户明确授权远程控制、安装必要运行时与处理真实采集。本次复用已有 SSH 控制连接，没有把用户提供的密码写入代码、配置或文档。所有原图继续保留。

- 输入：采集 `1ebc5b7a-3127-4516-840b-53b61fb4ab1a`，493 张原始 JPEG。
- 学校目录：`~/memoryroom/jobs/ooosplat_1ebc5b7a`。
- 真实重建作业：**47102**；已完成特征提取，进入 exhaustive 照片匹配。
- 真实训练作业：**47113**；依赖 `afterok:47102`，配准成功才开始申请并使用 GPU。
- 运行时显卡接入任务 **47112** 已完成：Vulkan 只枚举一张 A40，UUID 与 Slurm 实际分配的 CUDA UUID 一致。该任务没有进行样例渲染或训练；不等于 OOOBrush 已完成训练。

没有继续使用旧的 Nerfstudio / Splatfacto / gsplat 或旧 Brush v0.3。原来训练入口已停止自动提交，旧文件与学校结果保留。

## 采用了 OOOSplat 哪些部分

本项目写了薄的 Python/Slurm 调度适配器，实际执行 OOOSplat 官方锁定的 **COLMAP 4.2.1 + OOOBrush ooo-v1.0.0** 引擎、普通照片 exhaustive 流程、最大有效稀疏模型选择、均衡训练配方和临时文件完成后发布方式。没有移植整个桌面 GUI、编辑器、视频 bridge 回填、Caspar 自动探测。因此这是同源引擎的学校运行适配，不能称整个官方桌面应用已完整接入。

参考入口：

- [OOOSplat](https://github.com/ooolabdev/ooosplat)
- [官方 Linux 引擎清单](https://github.com/ooolabdev/ooosplat/blob/main/engines/manifest.linux.json)
- [OOOBrush ooo-v1.0.0](https://github.com/ooolabdev/OOOBrush/releases/tag/ooo-v1.0.0)
- [COLMAP runtime](https://github.com/ooolabdev/ooosplat-colmap/releases/tag/colmap-4.2.1-runtime.1)

版本/归档哈希保存在 `tools/ooosplat-remote/engine-lock.json`。官方归档在学校直接下载并校验；不是把 macOS 程序直接搬去 Linux。

## 学校兼容适配

1. 宿主 Rocky 9 的 glibc 2.34 不能直接运行该 Brush 二进制；用户目录建立 Enroot Ubuntu 24.04，保留宿主系统。
2. COLMAP 官方包自带 CUDA 13.2，而学校 570 驱动低于该包要求。因此本次仍用同一 COLMAP 4.2.1 的 CPU SIFT / 匹配 / Ceres 配准后端，训练才使用 A40。配准会较慢，没有据此虚构预计完成时间。
3. OOOBrush 使用 Vulkan。用户目录安装 NVIDIA container 工具与官方 Enroot hook，仅挂载当前 Slurm 分配 GPU，禁止按宿主物理序号猜测。容器显卡 UUID 不匹配就停止。
4. 学校缺少可用 ICD 入口，按 NVIDIA 官方说明使用 headless EGL ICD，指向当前 570.148.08 用户态驱动。容器安装 libvulkan1、vulkan-tools、libxext6、libx11-6、libxrandr2、libxcb1、libxrender1、libwayland-client0、libglvnd0 等必要依赖；未修改宿主驱动。该 ICD 路径与当前驱动版本绑定，学校升级驱动后需重新适配。
5. 主作业 4 CPU / 28G / 5小时50分，训练另申请 GPU 1 张。账户最多同时提交两项作业、30G 内存；没有绕过配额。

[NVIDIA 驱动组件说明](https://download.nvidia.com/XFree86/Linux-x86_64/570.190/README/installedcomponents.html)说明 EGL 可作为无 X11 环境的 Vulkan ICD；实际学校检测仍以 570.148.08 的运行日志为准。源文快照保存在 artifacts。

## 数据和训练约定

- 原图保持 1920×1440，不重编码、不混入样例。
- COLMAP 特征长边 1600、均衡配置 maxFeatures 8192。相机 SIMPLE_RADIAL / single_camera，初始化使用这次手机测得的内参中位数 fx≈1357.53、cx≈965.27、cy≈721.44，径向畸变初值0，之后仍由 COLMAP 求解。没有把 ARKit 位姿伪称 COLMAP 配准结果。
- 所有子模型均读取相机/注册图片/三维点数，选有效且注册图片最多的模型。不得把互不对齐的子模型简单相加当完整房间。
- 低于官方 80% 注册比例提示覆盖警告，不沿用旧脚本的 70% 硬中止门槛。比例不是画质评分；低覆盖模型可能只包含房间一部分。
- OOOBrush 均衡档：15000 步、最大图像分辨率1920、目标最多100万高斯（至少保留初始化点数量），每200步 refine，梯度阈值0.002、增长选择比例0.12、增长截止13000步。
- 输出先写 `output/final.ply.tmp`；进程成功、PLY基础结构检查通过后发布 `output/final.ply` 和 `EXPORT_COMPLETED.txt`。检查格式不等于画质验收。

## 你接下来怎样查看

在 Mac 双击项目根目录的 **查看学校GPU进度.command**。它只更新小型只读进度脚本并查看任务，不重启、取消或提交训练。现在显示的是 OOOSplat 的 47102 / 47113，不再是旧的 cap_1ebc5b7a Splatfacto 作业。

- RUNNING：该步骤在执行。
- PENDING / Dependency：训练等待配准成功，属于已提交、尚未开始训练。
- COMPLETED：Slurm 进程结束；还需面板显示模型已生成并确认导出文件。
- FAILED / CANCELLED / TIMEOUT / OUT_OF_MEMORY：任务没有成功，需要查看对应日志；后续依赖任务可能停留 DependencyNeverSatisfied。

关闭终端或 VPN 不会取消已经提交的 Slurm 作业。断网期间无法查进度；重连后打开面板即可。用户目录中的运行时/归档保留，后续不需因新作业编号重新下载依赖。没有安排后台自动监控或通知。

## 完成后拿回 Mac

双击 **取回学校OOOSplat模型.command**。它先确认完整模型与导出标记存在，再下载：

- `final.ply`：真实训练的高斯模型。
- `registration-report.json`：本次配准覆盖与警告。
- `engine-lock.json`：引擎来源。
- `EXPORT_COMPLETED.txt`：导出标记。

本地保存到 `data/processed/gpu-results/ooosplat_1ebc5b7a/`。模型不会自动出现在 Mac；本次尚未运行取回入口，因为模型尚未生成。

下载后打开 **启动工作台.command**，在网页新建空空间，导入 `final.ply` 为固定背景。先检查方向、比例、主要家具、缺失区域和手机帧率。COLMAP 纯视觉重建尺度通常未标定为米，不能默认与原 ARKit 房间布局一比一对齐；本次未进行尺度/坐标注册。全屋场景中的物品也不会自动分离、空位不会自动补全，抽屉关节和记忆内容不是本轮训练的产物。

## 尚未验证

本次没有新增单元测试、样例训练、构建验证、网页验证或画质验收。只做了真实生产任务必需的安装、驱动元数据核对与正式重建提交。当前特征完成、匹配中；OOOBrush 15000步训练、PLY生成、网页显示和完整房间质量仍待真实任务结果。CPU exhaustive 是否能在作业时限内完成，也尚未得到结果。
