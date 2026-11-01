> 2026-10-25 更新：当前以 [第一批使用说明](第一批开发与实拍使用说明.md) 为准。以下保留旧版背景；其中自动验收、64 MB、强制覆盖门槛等描述已由第一批实现替代。新版未运行测试或构建。

> 当前用户实拍版为 v0.3：请优先按 [引导采集说明](GUIDED_CAPTURE.md) 操作。以下 v0.2 演练记录保留作开发背景；新版完成条件不再是每阶段 30 帧。

# iPhone 采集端与模拟器演练

更新时间：2026-10-15。源代码在 `apps/capture-ios/`，目标设备为 iPhone 17 Pro。

## 当前已完成

- 本机 Xcode 27.0（27A266a）已完成首次启动，开发目录正确。
- 已在 iOS 26.5 / iPhone 17 Pro 模拟器安装 `MemoryRoom采集`。
- 原生 SwiftUI + ARKit 采集代码；直接输出项目约定的 session.json，不强制经过 MCAP。
- 房间、物品、空位、放回四个阶段，共用同一个 AR 会话；可再登记另一件物品。
- 真机记录原方向 RGB JPEG、逐帧内参、米制 OpenGL C2W、时间戳和分段。支持时保留 LiDAR float32 深度及缩放到深度分辨率的内参。
- 仅记录 AR 跟踪 normal 的图像，约 5 fps；运动过渡可暂停。后台或 AR 中断后禁止继续拼接同一坐标，已有文件保留，可导出部分结果。
- 模拟器使用 SceneKit 生成的原创三维测试画面与已知相机参数；源文件、画面、ZIP 均标注 simulated，不是假装实拍。
- 导出 ZIP 包含 session.json、images/、可用的 depth/ 与 frames.jsonl 日志。

采集包仍是原始数据，不是高斯模型；SAM2 分割、背景去重与 Brush 训练尚未接入。

## 自己试一遍

双击项目根目录的 **启动采集演练.command**。它会增量构建并打开模拟器；Xcode 27 的模拟器界面叫 **Device Hub**。

在 iPhone 模拟器上：

1. 首页填写房间名称，点“新建并进入采集”。
2. 房间阶段点“开始记录”，演练积累至少 3 帧，点“完成阶段，继续”。
3. 给物品起名，点“登记并开始补扫”，再完成阶段。
4. 在“补拍空位”阶段开始记录并完成。
5. 在“放回确认”阶段开始记录，完成并检查采集。
6. 点“结束并生成采集包”。可以试“导出采集包”，选择存储位置。自动测试不代替你向第三方分享。
7. 双击根目录的 **接收模拟器采集包.command**，将该应用自己的导出包复制到移动硬盘 `data/raw/simulator-exports/`。

真实模式至少记录 30 帧才能完成阶段。这个数量只是基础检查，不保证角度覆盖、表面完整或重建质量。正式扫全屋之前，先拍 10–20 秒桌面与一本书。

## 导入与转换

```sh
.venv/bin/python tools/dataset/import_capture.py /path/to/phone.capture.zip data/raw/my-first-capture
.venv/bin/python tools/dataset/convert.py data/raw/my-first-capture/session.json data/processed/my-first-room --mode room --segment room
```

`import_capture.py` 不覆盖已有目录，检查 ZIP 路径和符号链接、来源标记、矩阵与引用文件。转换工具检查图像和内参尺寸。

独立物品需要先生成前景蒙版，不能直接把 room 数据拿去训练物品。物品片段名称为 `object:<UUID>`，空位与放回为 `empty:<UUID>`、`placement:<UUID>`。同一物品三段共用 UUID。转换后的 `job.json` 保留 simulated 和 capture_source，演练数据不会被标成实拍。

## 在自己的 iPhone 17 Pro 上安装

2026-10-15 已连接用户的 iPhone 17 Pro（iOS 27.0），配对成功、开发者模式已开启，个人开发签名构建与真机安装成功。用户已在手机完成首次启动和真实采集；首个采集包已通过数据线取回 Lexar，含 616 帧 RGB、位姿和深度。房间段已完成首次高斯试训。以后重新安装时：

1. 用 USB 连接并解锁 iPhone。在手机上自行完成“信任这台电脑”等系统验证。
2. 打开 `apps/capture-ios/MemoryRoomCapture.xcodeproj`。
3. 在 Xcode 的 Settings → Accounts 中使用你自己的 Apple 账号；账号密码与验证码由你自行输入。
4. 选择 MemoryRoomCapture target → Signing & Capabilities → 你的 Personal Team，保留自动签名。若 bundle identifier 冲突，可在 Xcode 改为你自己的唯一值。
5. 按 iPhone 的系统要求开启 Developer Mode；运行目标选真实 iPhone，点击 Run。遇到新增许可或账号协议请你阅读处理。
6. 若提示不受信任的开发者，在手机“设置 → 通用 → VPN 与设备管理 → 开发者 App”中自行信任自己的账号。本次签名描述文件到期日为 2026-10-22；过期后需连接电脑重新签名安装，不要删除含未导出采集的应用。
7. 真机首页默认关闭演练模式。确认关闭后，新建采集并授权相机。使用过程中不切后台、不锁屏；中断后导出已有片段，另开一次采集。
8. 先拍桌面、登记一本合上的书、固定书绕拍、移走补空位、放回拍定位。不要在手里随意翻转。
9. 完成后导出到你自己的电脑，并将文件保留到 Lexar 项目的 data/raw/。

首次实拍已检查图像尺寸、矩阵、分段、深度布局与相邻视角深度一致性；已完成房间段初步训练。外部尺度精度、全屋完整度、物件分离仍需继续验证。详见 `FIRST_SCAN.md`。

## 存储与测试

源码、Swift 包缓存、构建结果与测试产物在 Lexar 的 `.cache/` 和 `artifacts/ios/`。Apple 的运行时和模拟设备容器由 Xcode 管理；本机 CoreSimulator 拒绝对移动硬盘直接创建模拟设备，因此沿用系统中的现有 iPhone 17 Pro。没有迁移或删除其他模拟器。

截图导出同样受 CoreSimulator 的外置目录限制；工具使用短暂系统临时文件，复制到 Lexar 后清理。复制出的采集包永久保存在 Lexar，模拟设备自己的应用容器也保留原件。

自动界面测试源代码在 `MemoryRoomCaptureUITests/CaptureFlowTests.swift`。已检查完整演练与空阶段禁止完成。模拟器导出样本已成功解包，并将 room 段导出为 5 帧 Nerfstudio 数据；该结果尚未训练。

模拟器启动与提取命令：

```sh
python3 tools/ios_simulator.py launch
python3 tools/ios_simulator.py collect
python3 tools/ios_simulator.py screenshot --output artifacts/ios/simulator.png
```

所有传给 Xcode 的项目、缓存路径使用绝对路径，避免 Swift 包在相对路径配置下未解析的问题。Swift 包 ZIPFoundation 固定为 0.9.20。Apple Silicon 模拟器构建与测试固定 arm64。
