# Postshot、Aholo、FixAnything与博物馆链路补充核查

日期：2026-10-26。此次纠正前轮候选覆盖不完整的问题。AnySearch检索10项，Lightpanda读取公开产品、文档、代码；Aholo价格由内置浏览器读取渲染后的公开页面；未用Kimi。arXiv作为Lightpanda提取的补充读取；未安装/执行模型，未上传房间或付费。

## 一、修正方法和结论

先前对开源仓库和复杂物品全自动交互的关注过重，没有用足够完整的成熟重建产品建立视觉与操作基准。Postshot虽然提过，但没有及时核实其完整流程及导出许可；Aholo这种直接覆盖手机引导、空间/物件重建、混合编辑和生活记忆的产品，应更早纳入。

当前应先以成熟重建工具获得合格真实空间，再增加局部修复和独立交互物件。Agent-Blender用于局部结构/关节/代理，暂不作为默认整屋替代。前轮主观分数不构成这些产品同样本质量对比，不能拿分数代替未做的实际基准。

## 二、Postshot：明确可用的本地重建器

[官网](https://www.jawset.com/)、[手册](https://www.jawset.com/docs/d/Postshot+User+Guide)、[价格](https://www.jawset.com/shop/pricing)。

照片/视频→跟踪与场景训练→编辑→导出辐射场文件→第三方查看器。支持外部相机/点数据、遮挡/背景mask和重点区域训练；官方称本地处理。桌面Windows、NVIDIA计算能力7.5+，不是Mac原生软件或现有Slurm脚本。不能根据官网“数分钟”营销描述保证本房间时间。

当前价格页默认年付显示：Free可训练/渲染至4K SDR，仅非商业、可导相机和普通点；Indie列PLY/SPZ辐射场导出、商用、€204/年（折合€17/月、按年收）；Studio列命令行等，€468/年。月付不同，不把年付折合当月付价格。免费导出相机/点不等于免费导出最终高斯资产。对本项目而言，本地生产和自动服务端编排又是不同权限/功能边界。

## 三、Aholo：与MemoryRoom前半段高度匹配的成熟产品候选

用户提供的主站 https://www.aholo3d.cn/ 当前聚合多个产品：Lux3D资产生成、SpatialGen空间生成、Reality实景重建。优先研究[Reality入口](https://studio.aholo3d.cn/)，不要把首页图生空间等同于实拍还原。

已核实官方资料：

- [多端适配](https://aholo.featurebase.app/zh-CN/help/articles/9450782-duo-duan-gua-pei)：手机物体/空间拍摄引导、上传重建、Web同步；多端Viewer与热点内容。
- [编辑](https://aholo.featurebase.app/zh-CN/help/articles/6605957-bian-ji-chong-jian-jie-guo)：扫描高斯中加入网格资产、变换、吸附、裁剪、坐标/尺寸调整；滤镜只改显示，不能当原模型修复。
- [导出](https://aholo.featurebase.app/zh-CN/help/articles/5128443-fen-xiang-yu-dao-chu)：高斯PLY/SPZ文件、链接、视频，不局限平台内观看。
- [3D生活记忆](https://studio.aholo3d.cn/solution/3d-life-memory)：明确展示手机记录房间、纪念物、三维回忆场景，与本项目背景目标直接重合。不能据此宣称已经实现本项目的独立拿取、嵌套记忆和关节逻辑。
- [API方案](https://studio.aholo3d.cn/solution/openapi)：公开描述视频、图片、全景视频重建，任务状态、元数据和PLY获取。属于可集成候选；本轮没有拿API Key、调接口或验证计费/自动导出细节。

[当前价格页](https://studio.aholo3d.cn/pricing)初始正文未加载，随后内置浏览器实际读到：Free中的Reality有20次极速/标准试用、一个并发；Pro¥21.9/月、300积分/月、有效期30天，Reality两并发及专业/至臻档。积分表：极速20、标准50、专业80、至臻100积分/次；超图片/视频长度另加。300积分不是300间房；免费试用是否重置、免费导出具体权益未明确，不推断为永久免费。Pro列资产私有设置和全部可用格式导出。页面还列部件拆分、关节化，但适用资产、端点与实际效果未验证。

## 四、FixAnything：用户提出的修复方向有直接资源，接口须接准确

[官方项目](https://fix-anything.github.io/)、[代码](https://github.com/kvuong2711/fix-anything)、[论文](https://arxiv.org/abs/2608.23549)。

公开代码是渲染视频/帧序列→修复视频，README明确输出generated.mp4、input.mp4、side_by_side.mp4；不是直接输入损坏PLY输出修好的PLY。用干净实拍视图作为锚点，提升沿相机轨迹的一致性，对稀疏/有伪影输入有参考价值。模型以Wan2.1-I2V-14B为基座；README约60GB指下载权重体积，不是最低显存。代码和作者权重列Apache2.0；未验证本机/学校GPU配置和端到端时间。

用于可自由漫游三维房间还需桥接：保留已知相机→渲染待修轨迹→修复视图→与真实观测联合约束，回写/蒸馏到可渲染的三维资产→检查新视角。论文提高一致性不等于得到隐藏面真实值；修复区保留生成来源。不能让用户每移动一次镜头就跑视频模型，也不能因一段修复视频好看就标记整屋已修复。

更贴近“回写三维”的参考：

- [Difix3D+](https://github.com/nv-tlabs/Difix3D)：公开有gsplat/nerfstudio微调示例，[官方模型卡](https://huggingface.co/nvidia/difix)描述离线清理伪视图后蒸馏回三维。许可为NVIDIA及基座相关条款，不称MIT/Apache；接OOOBrush需格式、相机、参数适配，不自动替换成gsplat训练路线。模型卡另外指向可商用Fixer，尚未核完其独立许可/接口，不自动采用。
- [3DGS-Enhancer](https://github.com/xiliu8006/3DGS-Enhancer)：有增强视图用于三维优化的研究，但当前README仍列部分推理/置信度三维代码未开放，不当整套可直接运行后处理器。

修复是可插拔质量提升分支；严重位姿错误、没拍到的重要个人细节、独立物件身份仍需要原始证据或用户确认。不能以这些限制为由忽略已可用的画面修复技术。

## 五、数字博物馆的具体案例

[Volinga公布的德国LWL Open-Air Museum Detmold案例](https://www.volinga.ai/insights/students-create-digital-museum-experience-with-gaussian-splatting/)描述DJI Mini4Pro航拍、XGRIDS K1室内采集，经高斯处理，使用Volinga/Unreal做带摇杆的大屏空间浏览。说明高质量采集与高斯实时展示有实际机构应用；没有证明廉价手机一次随手扫描同质量或全部藏品自动可拿。机构项目页本轮提取失败，具体链路按供应商案例注明来源，不冒充机构独立验证。

Smithsonian官方Labs搜索结果也列高斯探索，但原页两种读取均失败，不将其具体工作流作为已读事实。不能把有案例扩大成所有数字博物馆都采用同一路线。

## 六、修正后的产品链路

```text
手机引导/照片视频/专业设备输入
    ↓
重建provider（Aholo云端 / Postshot本地 / LCC / 现有OOOSplat）
    ↓
标准高斯资产＋尺度坐标＋采集依据
    ↓
质量分支
  ├─ 已合格：裁剪、压缩、分级、发布
  └─ 有局部缺陷：补拍/再优化，或AI修复＋回写三维
    ↓
房间背景＋单独采集的独立物件
    ↓
局部网格代理/柜门关节/物件ID
    ↓
现有Three.js/Spark网页和记忆内容
```

对照优先级：Aholo最值得先看普通用户采集UX和云端一条龙；Postshot为本地重建画质对照；LCC对应用户给出的Interior_Test样片；开源OOOSplat/Brush/LichtFeld保留自主部署选项。最终选择需要同素材质量、人工操作量、资源文件导出和总费用比较，当前不再先给缺少实测的品牌排名。

不要求每条分支都串行跑一遍；保留共同SceneGraph/资产接口。API支持页不等于已有开源核心或自托管；云服务不是默认免费无限。用户尚未授权向Aholo等上传房间，本轮仅公开资料读取。

## 七、本轮结果与未做内容

新增公开候选与可核查桥接工作，未安装Postshot/Aholo/FixAnything，未申请账户/密钥或下载权重，未上传房间，未支付，未运行测试/训练，未修改当前OOOSplat训练线路。Aholo定价经只读浏览器核对，免费额度/页面价格应在真正使用时再看实际版本；不基于本轮资料直接承诺用户成品质量。
