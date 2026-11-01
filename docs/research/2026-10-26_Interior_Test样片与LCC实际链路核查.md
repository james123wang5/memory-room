# Interior_Test样片与LCC实际链路核查

日期：2026-10-26。用户提供 https://superspl.at/scene/a7988961 ，明确该类高清实拍家具房间背景就是目标。使用AnySearch十项检索、Lightpanda正文，并用内置浏览器查看第三方场景实际画面；未用Kimi。未下载模型、未安装LCC、未上传房间、未训练、未切换当前OOOSplat后端。

## 一、纠正与确定的新基准

前面过早把重心移向Agent整屋建模，未把这种优质实拍样片的软件来源和处理流程查透。现在应把本样片作为空间背景的视觉目标，优先复用已有重建产品，再增加选定物件的独立扫描与交互。

该链接直接证明有可在网页展示的高质量高斯房间，不证明同质量必定在普通手机几分钟生成，也不证明作者用的特定采集设备。视觉质量与生成门槛需要分别核查。

## 二、该作品公开可确认的信息

[作品页](https://superspl.at/scene/a7988961)：标题Interior_Test，作者vegas3334；[作者主页](https://superspl.at/user/vegas3334)显示Max。页面标注Software Used: LCC Studio；资源168.17MB，实际浏览器无障碍信息显示7,469,368个高斯，约750万。查看器有动画播放和六个编号视点，实际打开后看到清晰室内客厅、家具、地毯与窗帘。

没有作品说明、无评论，没有披露采集设备/视频、照片数、耗时、训练机器、参数与HD Enhancement是否启用。因此只能确定软件标注和产物，不声称作者一定使用PortalCam、Lixel或手机。

## 三、已经有官方文档支持的制作到发布链路

### 1. 采集分支

- 专业设备分支：XGRIDS扫描设备采集激光/视觉，导入LCC做空间重建；该分支使用SLAM/激光几何约束。[LCC概览](https://docs.xgrids.com/en-us/06-lixel-cybercolor/01-lcc-studio/v2.5.0/01-getting-started.html)
- 普通相机分支：当前LCC Studio另有视频/照片序列重建入口，自动抽帧、估计相机位姿并重建。不能只根据概览里“先使用自家设备”的描述就说普通手机不支持；这是不同输入分支。[视频/序列手册](https://docs.xgrids.com/en-us/06-lixel-cybercolor/01-lcc-studio/v2.6.0/16-video-reconstruction.html)

视频手册列MP4/MOV/WEBM，720p至4K范围（每边720—4090px），约1000秒上限；此入口不支持全景/畸变视频。照片入口支持JPG/JPEG/PNG、同分辨率、最多1000张，建议相邻≥60%重叠；不是推荐每房间拍满1000张。原生视频和图像必须先满足明确格式检查，不能把任意zip直接导入。

### 2. 重建与局部增强

LCC在制作端处理3DGS，选择质量和高斯数量。对关键区域可额外照片做HD Enhancement，这是上游可用功能，不是已经证实作者用了。它也提供裁剪、颜色和分离等编辑；“分离”工具本身不代表任意家具已全自动获得完整背面和关节。

### 3. 导出和网页交付

导出高斯PLY/LCC2等。SuperSplat公开支持来自XGRIDS的相关格式；[导入导出手册](https://developer.playcanvas.com/user-manual/supersplat/editor/import-export/)与[发布集成说明](https://blog.playcanvas.com/new-in-supersplat-introducing-the-new-publishing-api/)已核对。

LCC Studio已有直接发布SuperSplat的集成：在My Models中选模型、选择目标并分享。也可以先导出再进SuperSplat编辑发布。尚不知道本作者走了哪一种发布操作，因此不把官方可用流程当其个人已证实步骤。

SuperSplat承担查看、优化与发布，不能因为展示网址是superspl.at就说模型是在该网页训练出来的。

```text
手机普通视频/照片序列，或XGRIDS设备原始数据
  → LCC Studio对应重建入口
  → 可选重点区域高清增强、清理/裁剪
  → 高斯PLY/LCC2等
  → SuperSplat编辑/导航视点/网页发布
```

## 四、费用、配置和时间的当前事实

[官网当前功能表](https://www.xgrids.com/us/lcc)把Video Reconstruction、PLY/LCC2导出列在Studio Free支持项；HD Enhancement在Studio端列为Premium。部分手册概览仍将全部导出列在Premium描述，与当前官网表存在差异，执行时以实际版本权限/条款为准；不保证未安装版本的所有权限。免费版不是开源，不能直接搬其重建源码到MemoryRoom。

[当前下载页](https://www.xgrids.com/us/support/download/lcc-studio)显示Windows V2.6.1、2026-10-23发布；基础列NVIDIA RTX3060 12GB或A4000 16GB、64GB系统内存，推荐显卡更高。不能只看学校48GB显存就认为满足：当前学校作业内存配额此前为30GB，普通Studio也是Windows软件，不是Linux Slurm可直接运行的训练脚本。独立Linux Server版本的供应/许可另核，不自动安装或购买。

手册的设备数据概述给出5分钟采集约100—150分钟生成，属于上游参考，不是此样片的实际耗时，也不能自动套到普通视频重建。作者本人训练耗时、照片数量、是否补拍和硬件仍未知。750万点和168MB是模型规模，不是拍摄时长或手机性能测试。

## 五、新发现：同厂手机LCC Scan

[官方产品页](https://www.xgrids.com/us/lccscan)、[App Store](https://apps.apple.com/us/app/lcc-scan/id6751404953)。官方页支持人物、物体与小场景，带采集引导、手机本地处理、PLY/LCC2导出，写明免费下载；App Store也显示Free，但应用安装与功能可用系统要求不同，不能仅按安装最低系统推断重建可用。

官方以iPhone17Pro给出Fast约1分37秒、质量模式约2分19秒的处理示例；是厂商单例，不是本房间达标保证。产品定位小场景/物品，不能把这些时间当成样片尺寸整屋的保证。用户恰为iPhone17Pro，该入口值得优先对照单物件/小区域采集，不需先开发另一套采集器。未在手机安装或试扫，不能声称胜过Scaniverse或已经兼容本查看器。

## 六、接回MemoryRoom的最短架构

```text
房间：真实重建高斯 → 高斯PLY等 → 现有Three.js/Spark导入
物件：单独稳定采集 → 独立高斯/网格 → 场景独立节点
结构：位置/尺度/碰撞代理/柜门轴限位
内容：现有记忆、附件与时间版本
```

优先高斯PLY通道，先核对属性、坐标、尺度和显示，不为导入而把高斯转换成普通三角网格。LCC/LCC2/SOG的完整直接支持不假定现有Spark已具备。网页发布并非必须托管SuperSplat；其开源编辑/查看技术可参考，模型能否导出和自托管按实际授权确认。

选定可拿物件须有独立资产和稳定ID；房间原来那一份要隐藏/去除并补背景，避免拿起后残留同一个杯子。采集默认物品固定、手机绕拍。柜门仍需分件和内部观测，参数化代理/关节由我们控制。这里不再把布料自由变形、全屋自动分件作为房间画质的前置条件。

## 七、当前下一步

把本样片定为视觉参照；核对用户已有原始视频/照片是否满足LCC视频/序列输入，评估可执行的Windows重建环境与本地手机入口。可行时先做桌面/柜体同一区域对照，再对一个独立物件完成拿取/归位。这是新增候选provider，现有OOOSplat工程与训练成果保留。本轮仅核查，不运行上述实验。
