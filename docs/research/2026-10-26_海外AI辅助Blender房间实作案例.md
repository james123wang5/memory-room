# 海外 AI 辅助 Blender 房间实作案例

2026-10-26。用户分享抖音《Opus5.5+Blender构建房间过程》，要求用AnySearch查找国外类似案例和可复用项目。

## 检索与核实范围

本轮AnySearch共15个查询，均已提交反馈；公开正文用Lightpanda。抖音短链解析为 `https://www.douyin.com/video/7700681847738502440`，Lightpanda仅取得壳页面，真实浏览器报服务器问题，未成功观看，不能确认海外案例就是该抖音视频原始出处。

使用kimi-webbridge读取作者X原帖和YouTube描述。YouTube主页面可读，视频区域提示媒体不可播放；没有声称逐帧看完制作过程。作者LinkedIn部分帖子公开可读，Yokohara制作说明的LinkedIn页面被登录墙挡住，以其公开X帖与YouTube作者描述为准。没有注册账号、私信、下载私有资料、上传用户房间或执行任何建模。

## 1. 最贴近用户方案：Lukas Timm，扫描和照片重建真实Robot Dojo

- [作者LinkedIn原帖](https://www.linkedin.com/posts/lukastimm_rebuilding-my-robot-dojo-in-blender-with-activity-7516151679784787968-wKF8)
- [作者Instagram演示](https://www.instagram.com/reel/DeeqQMPjaS6/)

作者明确说明输入为LiDAR扫描、188张参考照片、指令与人工反馈。Claude用Blender脚本搭房间壳体及精确结构；14件物品由自己的照片裁切后经Tripo生成，再检查、修补并匹配回真实房间。帖子介绍包含物件检查、家具摆放、材质与灯光，以及实拍对比和日夜漫游。

与用户的匹配点是“扫描提供空间锚点＋照片提供外观＋AI脚本建结构＋独立物品资产”，比泛泛文字生房间更有直接参考价值。作者同时说明灵感来自Hirokazu Yokohara。

边界：已核对作者公开文字，没有拿到工程文件独立检验尺寸、所有视角、物品拓扑或运行性能；所读帖子未见完整Blender工程/脚本仓库/提示词清单。Tripo生成不等于原物一比一复刻，不将此当作免费无限制开源资产流水线。

## 2. 视觉目标相似：Hirokazu Yokohara，Blender室内场景转UE5实时运行

- [作者YouTube制作说明：Creating a high-quality Blender scene with AI](https://www.youtube.com/watch?v=kCuoHpv-uZY)
- [作者X原帖：实时版](https://x.com/Yokohara_h/status/2111118974704591350)
- [作者X主页](https://x.com/Yokohara_h)

YouTube作者描述确认：通过Astra和Opus制作Blender场景，自己不直接操作Blender，但持续提供指令和反馈。2026-10-16的X原帖确认用Opus将Blender场景迁移UE5实时运行，还提到想以该房间做小型恐怖游戏。

它与用户目标中的“有真实感的房间＋游戏式探索”相似。不能据此确认其输入就是用户现实房间的扫描，也不能断言所有物件可以拿取/柜门可开合或已公开完整工程。

来源辨别：检索命中rewind02关于该类房间的转述，包含“2–3张图、1876个物体”等说法；回复指出原作者为Yokohara。另有Reddit汇总提供制作时间和API费用估计，但本轮未从作者一手文字核实全部数字，因此不把这些数字当复现承诺。

参考转述仅作溯源：[rewind02帖](https://x.com/rewind02/status/2112890224426553836)、[Reddit汇总](https://www.reddit.com/r/TopologyAI/comments/1x93oxh/blender_scene_claude_opus_ue5_a_realtime_room/)。不能把转述中的操作步骤当已公开、已验证的原作者工作流。

## 3. 不靠图生3D的路径：Alan Martínez，《黑客帝国》Neo公寓复刻

- [作者LinkedIn原帖](https://www.linkedin.com/posts/alan-mart%C3%ADnez-1a7a60234_blender-claude-mcp-activity-7516511500661043200-yasL)
- [作者Instagram演示](https://www.instagram.com/reel/DehP1eOpQDI/)

作者称使用Claude经MCP操作Blender，从头建模，没有使用Meshy/Tripo这类图生3D工具；包含建模、UV、相机、材质和合成，纹理结合外部贴图及生成的矢量图。使用图上批注和持续反馈，按作者自述兼职约5天，RTX3070渲染。

作者明确说不是完美1:1：参考有限、包含创作性调整，也需要3D基础与美术指导。其20美元套餐是订阅背景，不是每个房间固定20美元账单；受限额与等待影响，不能据此承诺同等速度或费用。

这表明Blender脚本建模和图生3D资产是两种可替换物品制作策略。少量规则几何可以脚本建立；复杂物品若全部从零程序建模，指令、迭代和人工检查成本可能很高。

边界：未在所读帖子发现完整可下载工程或开源复刻仓库，没有独立运行其作品。

## 4. 结构约束的实作：Sidharth Satapathy，户型图到家具化三维住宅

- [作者完整文章](https://www.sidharthsatapathy.com/blog/claude-blender-mcp-floor-plan-to-3d-house/)

作者将真实2D户型图交给Claude，通过Blender MCP搭建、摆家具和渲染漫游。文章包含像素/英尺到米制的坐标转换片段、俯视结构与成品图、执行→截图→修正循环，作者报告约2天。文章明确专业美术在材质、照明与艺术判断上仍更强；户型及可识别细节没有公开。

可借鉴的是“先建立尺寸/坐标依据，锁定结构，再处理家具和材质”，不能将其说成仅凭照片忠实还原所有真实物品。公开文章不是完整可导入自家房间的现成产品。

## 5. 真正可取得源码的公共底座

[MCP for Blender](https://github.com/ahujasid/mcp-for-blender)（旧链接blender-mcp当前重定向到该仓库）提供AI控制Blender、执行Python与读取场景/截图等工具。它是通用操作桥；上面案例的房间场景、提示词、资产与人工反馈不是因此自动开源。

可复用链路为：输入资料 → 明确米制坐标/物件清单/来源 → Blender脚本 → 固定参考相机截图比对 → 修正 → 网页适配资产导出。素材检索、图生3D、模型订阅和渲染各有成本，免费桥接不等于免费生产全部资产。

## 对MemoryRoom的具体启示

1. 优先参考Robot Dojo的扫描约束方式：现有GLB/深度和尺寸作几何依据，原始照片与高斯作视觉参照。
2. 墙、桌板、柜体等规则结构由脚本重建；重要物品使用独立扫描，确需生成时记录为生成/近似资产。
3. 柜门、抽屉等交互部件从建模时拆开，设置支点、轴向和行程；上述展示尚不能证明已有自动完成这部分的通用产品。
4. 复用现有Three.js/Spark运行时，先导出GLB和场景元数据，不因为案例使用UE5就立即切换引擎。
5. 专业人员持续反馈、多视角检查与资产修补是案例工作量的重要部分。“没有亲手操作软件”不等于“一次提示词自动完成”或“手机扫描数分钟后即交付”。

本轮结论：有人已经做过用户提出的扫描/照片约束AI建模方式；目前查到最直接的作者实作为Robot Dojo。没有证据证明已经存在可开源下载、免费一键完成任意房间完整交互复刻的整套成品。

原始检索/正文/浏览器描述记录：`artifacts/research/2026-10-26-ai-blender-social/`。没有把密钥写入查询或研究文件。
