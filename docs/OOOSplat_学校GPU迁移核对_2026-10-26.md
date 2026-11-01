# MemoryRoom：按用户指定恢复 OOOSplat 学校 GPU 链路

日期：2026-10-26。本文保留首次源码、采集文件与学校配置核对。后续已安装同源运行时，正式重建47102运行、训练47113等待配准成功；详见 [学校运行与取回](OOOSplat_学校GPU运行与取回_2026-10-26.md)。下文“尚未迁移/提交”为首次审计时状态，不是最新执行状态；仍未声称训练或成片成功。

## 1. 用户要求与纠正

用户明确要求保留 OOOSplat 的重建链路，仅将训练等计算迁移到学校服务器，不接受默认换成旧 Brush 或 Nerfstudio/Splatfacto/gsplat。

此前学校教程实际运行了 Nerfstudio/Splatfacto，后来又准备了 ARKit 位姿 + LiDAR → Splatfacto，均不等于 OOOSplat；这是执行路线偏离，而不是“同为 PLY 所以相同”。本次停止推进替代入口、保留历史代码/数据/环境，不删除原始素材，不再默认提交这些旧命令。

根目录“启动手机位姿GPU训练.command”已加停止保护，旧入口备份在 artifacts/source-backups/route-correction-2026-10-26/。只读进度入口现已切换到新的OOOSplat任务，不会提交任务。恢复旧入口并不等于恢复用户指定链路。

## 2. 最新 ZIP 的实际内容

已读取 Downloads 中最新的采集 ZIP：

`1ebc5b7a-3127-4516-840b-53b61fb4ab1a-1792955783.capture.zip`

其中 session.json 明确写有 `reconstruction_route: ooosplat-colmap`，真实 ARKit 采集，493 帧。顶层为 images、depth、frames.jsonl、session.json、room-layout.json，没有训练源码。因此该 ZIP 保存素材和路线意图；执行器仍必须遵守这个路线标记，不能忽略后改用另一引擎。

## 3. 当前核对的真正上游链路

官方 main 文档标记 OOOSplat v0.7.0，普通图片路线为：

```text
原始图片
→ 图片预检、原始分辨率保留、工程内复用
→ COLMAP 特征提取与匹配
→ COLMAP 相机/稀疏重建与有效模型选择
→ OOOBrush 高斯训练
→ PLY 校验、原子发布 final.ply
→ MemoryRoom / Spark 导入房间背景
```

此处 OOOBrush 是 OOOSplat 指定的 Brush 分支/运行时，不是本项目旧版 Brush v0.3.0，也不是 gsplat 或 Splatfacto。

官方 Linux manifest 锁定：

| 组件 | 版本与来源 |
|---|---|
| COLMAP | 4.2.1，commit bd1fcf654d2dd8fefa1466999c190a246f83f4b9 |
| COLMAP runtime | colmap-4.2.1-runtime.1，官方 ooosplat-colmap release |
| OOOBrush | ooo-v1.0.0，commit 866a7d65b4d6a591ba0d52a88f8b20ea3465c1e5 |
| 训练可执行程序 | headless brush-cli，按官方清单改名 brush_app；排除桌面 viewer |
| 训练参数 | src-tauri/src/engines/brush.rs 的 train_args，配置来自 config/pipeline-optimization.json 与 presets |
| Linux 训练后端 | Vulkan / wgpu；不能用“CUDA正常”替代对该后端的实际接入 |

官方普通图片默认穷举匹配；确认连续顺序后才能选择顺序匹配。不能仅因文件名按时间排序，就把跨区或长间隔的采集认定为连续相邻视角。原图保留，不能随意重编码或删帧。

自动优化均衡档的官方普通素材说明为约15,000次训练、最大长边1,920，COLMAP长边1,600、特征8,192；确切运行预算还依具体输入规划与配置。不能继续把先前 Splatfacto 的30,000步当成 OOOSplat 默认值。精细档、全景档不能混用。

## 4. 必须复用而非另造的关键规则

1. 从全部有效稀疏子模型中选择注册图像最多的模型，而非硬编码 sparse/0。
2. 普通任务有至少一张注册图像与有效三维点时可以进入 Brush；注册率低于80%给出警告，官方不单因低注册率阻断。此前70%硬停止是本项目学校脚本新增规则，不是 OOOSplat 规则。
3. 低注册率结果只能作为带缺失警告的预览，不能标成“全屋已完整复现”。多个子模型不能直接相加或在未配准时拼成一个房间。
4. 保留官方质量档/优化参数、必要的回退逻辑、引擎版本及哈希、完整日志与最终 PLY 发布规则。只有实际实现的部分才标为已接入，不把少量同名参数说成完整迁移了全部优化器。
5. 学校 Slurm 只负责分配资源、调度与取回，不应改变训练引擎。服务端适配层不是官方已经提供的“远程 SSH 功能”，需要清楚标注我们新增的包装部分。
6. 既有网页的 PLY 支持可复用；格式兼容不能证明上游引擎相同。导出成功、导入成功、画质和整屋覆盖仍分别检查。

## 5. 对学校的实际只读检查

复用了用户已建立的 SSH ControlMaster 连接，只读取了系统/调度配置、自己项目的模型头与学校公开共享的硬件记录；没有安装或运行新引擎、编译、测试、训练或提交新作业。

- 系统为 Rocky Linux 9 系列、x86_64，glibc 2.34。
- 当前账户 normal / MGPU-TC2，单GPU、CPU≤10、内存≤30G、最多2作业、6小时；QoS MinTRES未设置。
- 学校已有 /usr/bin/enroot；尚未导入、启动或验证容器。
- 当前共享硬件记录中的 A40 驱动为570.148.08；COLMAP所需cuda/12.8.0模块已由用户成功加载过。
- 读取squeue时本账户无活动任务；未执行取消命令。
- 登录节点 PATH 未显示 cargo、rustc 或 vulkaninfo。登录节点没有这些工具不等于计算节点一定缺失，不能据此确认 Vulkan 不可用。

学校指南要求计算/编译通过调度在计算节点执行。不能为了绕过兼容问题把实际重建、训练或源码编译放回登录节点；下载、文件管理与作业提交和计算是不同操作。

## 6. 二进制兼容性：已查明与未查明

已下载官方固定版 OOOBrush Linux 归档到本项目 artifacts/upstream，并校验：

- 归档123,487,865字节，SHA256 EEA89703D98B2FCC090309746EF4EF54271EF402C2B67E644ED7AC1390DCFB4E，与官方manifest一致。
- 归档内 ./brush-cli 的SHA256为CA819F94716C04ADD531E69E5F6812A2D1E9A8CEFBC2803DA000D905D4FCCB0A，与官方headless运行时清单一致。
- 仅读取ELF段/版本依赖，未执行二进制。其动态依赖包含GLIBC_2.35，学校宿主只有2.34，因此不能直接在宿主启动该预编译文件。
- 官方Linux应用只声明Ubuntu24.04 Alpha支持，不声明Rocky支持。可研究使用学校现有Enroot提供对应用户空间，保留同一官方引擎；也可同源重编译适配宿主，但两者均尚未完成。
- 官方COLMAP Linux包使用CUDA13.2，manifest的最低驱动为580.00，而学校当前记录570.148.08。官方允许CPU/Ceres回退，但不能宣称该官方预编译包能在当前驱动上使用CUDA加速；容器不会升级宿主GPU驱动。
- OOOBrush Vulkan与COLMAP CUDA是两套GPU路径。后续必须确保只使用Slurm分配的GPU；不能假设CUDA_VISIBLE_DEVICES自动限制Vulkan，也不能自动选择多卡节点上的“最佳GPU”后直接训练。

因此，迁移要处理实际环境兼容与调度绑定，不能再次用更换训练框架代替。

## 7. 前次33帧结果的正确解释

已直接读取用户自己学校目录 processed/colmap/sparse/*/images.bin 的模型计数：

| 子模型 | 注册图像数 |
|---|---:|
| 0 | 33 |
| 1 | 102 |
| 2 | 158 |
| 3 | 90 |
| 4 | 43 |

旧Nerfstudio包装器默认仅导出0号，33不能代表全部模型，也不能直接证明用户只拍好了33张。最大的单一模型为158张，仍不足以称为整个房间的完整重建。不同模型可能有重叠，计数不能直接相加当作唯一视角数或共同坐标系。

这些是COLMAP3.8旧路线产生的结果，保留作诊断，不冒充官方新链路COLMAP4.2.1的结果。新的正确路线应从原始493张图按OOOSplat策略重新处理，或明确标识任何兼容导入/复用步骤。

## 8. 当前状态与下一步交付边界

已完成：确认用户路线、核对采集包、读取上游核心源码与manifest、检查学校基础配置、检查官方OOOBrush二进制ABI、确认旧数据实际分成多个子模型、停用误接的本地替代启动入口。

尚未完成：OOOSplat同源服务端执行器、Enroot对应用户空间或宿主兼容运行时、Vulkan/Slurm GPU绑定、官方质量预算/配准编排的实际迁移、真正OOOBrush训练、final.ply导出与网页成片验收。

下一份可执行入口必须明确记录provider=ooosplat、实际COLMAP/OOOBrush版本、官方配置来源、采用的GPU/CPU路径及原因、子模型选择与覆盖警告。只有接入完成且路径符合用户要求后才提供启动命令；当前旧Splatfacto命令不再作为默认下一步。

## 官方来源

- [OOOSplat README / 处理流程与Linux边界](https://github.com/ooolabdev/ooosplat)
- [Linux引擎清单与哈希](https://github.com/ooolabdev/ooosplat/blob/main/engines/manifest.linux.json)
- [官方训练命令与设备策略](https://github.com/ooolabdev/ooosplat/blob/main/src-tauri/src/engines/brush.rs)
- [官方子模型选择与流程编排](https://github.com/ooolabdev/ooosplat/blob/main/src-tauri/src/pipeline/runner.rs)
- [质量/优化参数](https://github.com/ooolabdev/ooosplat/blob/main/config/pipeline-optimization.json)
- [同源OOOBrush固定发行版](https://github.com/ooolabdev/OOOBrush/releases/tag/ooo-v1.0.0)

公开正文优先使用Lightpanda提取，失败时使用内置网页工具。源码/引擎快照仅供本项目核对，不能把main移动分支和固定发行包的全部功能混为一谈。
