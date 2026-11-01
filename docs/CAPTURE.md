# 手机采集与数据契约

首台设备：用户确认 iPhone 17 Pro。Apple 官方规格列出 LiDAR Scanner：[官方规格](https://support.apple.com/en-us/125090)。实际 ARKit 模式仍要运行时检查，不把机型名等同于每个 API 一定可用。

当前电脑已配置 Xcode 27。`apps/capture-ios/` 的原生 ARKit 采集端直接输出下面的 normalized session 格式，跳过 iPhone 单平台暂时不需要的 MCAP 中间层；Stera 适配器继续保留给后续多平台输入。已完成首次真实 RGB、位姿与 LiDAR 采集和本机试训；首次画质不达预期。v0.3 已改为引导采集，详见 `GUIDED_CAPTURE.md`。新版实拍效果由用户验证。安装与操作见 `IOS_SETUP.md`。

## 用户流程

1. `room`：沿可到达区域绕行、换位置观察、按红点补扫并回到起点；保留通过实时筛选的原方向 RGB、位姿与深度，不再以录够帧数作为完成条件。
2. `object:<id>`：选择物品并进入登记；物品固定、相机绕拍。
3. `empty:<id>`：物品移走时补拍被遮挡表面。
4. `placement:<id>`：放回并确认位置。移动过渡期间不做静态重建。
5. 柜门/抽屉补拍开合两侧和内部，活动部件分别登记。

## 归一化格式

图像不自动转成竖屏、不裁剪。内参与图像像素尺寸必须一致。`camera_to_world` 永远是相机到世界，平移单位米；使用列向量。`camera_axes` 显式指定 `opengl`（右、上、后）或 `opencv`（右、下、前）。世界坐标保持右手系；不在转换时偷偷重新定向或缩放。

```json
{
  "version": 1,
  "units": "meter",
  "camera_axes": "opengl",
  "frames": [{
    "image": "images/000000.png",
    "mask": "masks/000000.png",
    "timestamp": 123.4,
    "segment": "object:book-001",
    "intrinsics": {"w": 1920, "h": 1440, "fl_x": 1400, "fl_y": 1400, "cx": 960, "cy": 720},
    "camera_to_world": [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]
  }]
}
```

该例只说明格式，内参不是 iPhone 17 Pro 的实测值。不要拿它代替真实相机参数。

蒙版为与图像同尺寸的灰度 PNG：白色保留，黑色排除。房间蒙版排除所有已登记活动物品及手部。独立物品蒙版只保留目标本体。

## 已可运行的转换

```sh
.venv/bin/python tools/dataset/convert.py data/raw/session/session.json data/processed/room-v1 --mode room --segment room
.venv/bin/python tools/dataset/convert.py data/raw/session/session.json data/processed/book-v1 --mode object --segment object:book-001
```

输出 `images/`、可选 `masks/`、Nerfstudio `transforms.json` 和 `job.json`。房间使用单独排除蒙版；独立物品输出 RGBA PNG，不输出单独 masked-loss 蒙版。`job.json` 记录预期 alpha 模式；单独调用转换器仍只转换数据。网站“导入手机采集”通过 `automatic_reconstruction.py` 自动启动房间训练和验收。独立物品训练尚未接入。

转换器拒绝缺少坐标声明、非正交相机矩阵、越界路径、无效内参、图像/蒙版尺寸不一致、缺失物品蒙版、输出目录已存在。当前只接已去畸变的针孔图像。

## 实验性 Stera MCAP 提取

`extract_stera.py` 已按上游实际 API 编写，但尚无真实 MCAP 录像验证，未默认安装 SDK。安装时只在项目虚拟环境中引入所需依赖，避免额外手部、面部模型：

```sh
.venv/bin/python -m pip install --cache-dir .cache/pip 'git+https://github.com/fpv-labs/stera-sdk.git@df6a5ec8919053c5cd448db83d4816e1faaaec62'
.venv/bin/python tools/dataset/extract_stera.py data/raw/recording.mcap data/processed/extracted-session --every 6
```

Stera SDK 的 Python 版本与依赖兼容性尚未安装验证；当前项目 `.venv` 使用 Python 3.14，必要时为重建工具另建兼容版本环境。不要在 UI 基础环境里自动安装整套深度学习栈。

提取时将 camera_link 到世界的旋转与录制中的 optical-to-link 变换合成，输出 OpenCV C2W；下一步转换器再转成 OpenGL。采集图像必须保留原像素方向。SDK 会预读深度，初次测试应使用短片段，观察内存。

v0.3 首次实拍先只扫房间，按 `GUIDED_CAPTURE.md` 操作；通过房间门槛后可选“只保存房间，结束采集”。物品后续再做，不要手持任意旋转。

新增兼容字段：根级 `quality_version=1`、`quality`（按片段记录预检）；每帧 `quality` 保存运动、光照、重叠与深度指标；`room-layout.json` 保存结构表面。重扫的旧片段重命名为 `discarded:…`，原图保留，房间转换只选择有效的 `room`。旧格式仍能安全导入和手动预览，但不会绕过自动成片预检。
