import ARKit
import SceneKit
import SwiftUI

private let ink = Color(red:0.18, green:0.32, blue:0.23)
private let paper = Color(red:0.96, green:0.97, blue:0.93)

struct ContentView: View {
    @StateObject private var store = CaptureStore()
    @Environment(\.scenePhase) private var scenePhase
    @State private var earlyFinish = false
    @State private var finishWithSuggestions = false
    @State private var showCoverage = true
    @State private var filledCoverage = true
    @State private var coverageOpacity = 0.65
    @State private var previewZoom = 1.0
    @State private var zoomStart = 1.0
    var body: some View {
        ScrollView {
            VStack(alignment:.leading, spacing:22) {
                header
                if store.isDemo { demoBanner }
                switch store.screen {
                case .welcome: welcome
                case .capture: capture
                case .review: review
                }
            }.padding(24).frame(maxWidth:600).frame(maxWidth:.infinity)
        }
        .background(paper.ignoresSafeArea()).tint(ink)
        .safeAreaInset(edge:.bottom) {
            if store.screen == .capture {
                HStack(spacing:12) {
                    Button(store.recording ? "暂停扫描" : "开始扫描") {
                        if store.recording { store.pauseRecording() } else { store.startRecording() }
                    }.buttonStyle(RoomButtonStyle()).disabled(store.needsRegistration || (!store.recording && !store.canRecord)).accessibilityIdentifier("record-toggle")
                    Button(store.roomOnly ? "完成空间扫描" : (store.phase == .placement ? "完成采集" : "完成阶段，继续")) {
                        if store.hasRecommendations { finishWithSuggestions = true } else { store.completePhase() }
                    }
                        .buttonStyle(RoomButtonStyle(outlined:true)).disabled(!store.canComplete).accessibilityIdentifier("complete-phase")
                }.padding(.horizontal,20).padding(.vertical,10).background(paper)
            }
        }
        .alert("采集提示", isPresented:Binding(get:{store.errorMessage != nil}, set:{if !$0 {store.errorMessage = nil}})) {
            Button("知道了", role:.cancel) { store.errorMessage = nil }
        } message: { Text(store.errorMessage ?? "") }
        .confirmationDialog("结束当前采集？已有图像和相机数据会保留。", isPresented:$earlyFinish, titleVisibility:.visible) {
            Button("检查并导出已有内容") { store.showReview() }
            Button("继续采集", role:.cancel) {}
        }
        .confirmationDialog("还有补拍建议，可以继续拍，也可以先生成预览。", isPresented:$finishWithSuggestions, titleVisibility:.visible) {
            Button("先完成，生成后由我查看") { store.completePhase() }
            Button("继续补拍", role:.cancel) {}
        }
        .onChange(of:scenePhase) { _, newPhase in if newPhase == .background { store.appBackgrounded() } }
    }
    private var header: some View {
        HStack(spacing:12) {
            Image(systemName:"cube.transparent").font(.system(size:29,weight:.light))
                .frame(width:45,height:45).overlay(RoundedRectangle(cornerRadius:12).stroke(ink.opacity(0.5)))
            VStack(alignment:.leading,spacing:3) {
                Text("MemoryRoom").font(.system(size:22,weight:.semibold,design:.rounded))
                Text("把生活的空间，留在身边。 ").font(.system(size:10)).tracking(1).foregroundStyle(.secondary)
            }
            Spacer()
        }.foregroundStyle(ink).padding(.top,8)
    }
    private var demoBanner: some View {
        Label("演练模式 · 画面与相机数据由程序生成", systemImage:"testtube.2")
            .font(.system(size:11,weight:.medium)).foregroundStyle(Color(red:0.52,green:0.35,blue:0.15))
            .padding(12).frame(maxWidth:.infinity,alignment:.leading)
            .background(Color(red:0.95,green:0.9,blue:0.78),in:RoundedRectangle(cornerRadius:10))
            .accessibilityIdentifier("demo-banner")
    }
    private var welcome: some View {
        VStack(alignment:.leading,spacing:22) {
            VStack(alignment:.leading,spacing:10) {
                Text("从一间房间开始。").font(.system(size:31,weight:.regular,design:.serif)).foregroundStyle(ink)
                Text("先选书桌区域或整间房，跟着提示移动手机。\n完成后导出到电脑生成，效果由你查看和保存。")
                    .font(.system(size:13)).foregroundStyle(.secondary).lineSpacing(5)
            }.padding(.top,12)
            VStack(alignment:.leading,spacing:14) {
                Text("空间名称").font(.system(size:12)).foregroundStyle(.secondary)
                TextField("例如：我的书房",text:$store.roomName).textFieldStyle(.roundedBorder).accessibilityIdentifier("room-name")
                Picker("扫描范围", selection:$store.captureScope) {
                    ForEach(CaptureScope.allCases, id:\.self) { scope in Text(scope.title).tag(scope) }
                }.pickerStyle(.segmented)
                Text(store.captureScope.instructions).font(.system(size:12)).foregroundStyle(.secondary)
                Toggle("只扫描空间（推荐）", isOn:$store.roomOnly).font(.system(size:13))
                Text("第一批生成静态空间。物品分段可保留素材，独立物品生成在下一批接入。").font(.system(size:11)).foregroundStyle(.secondary)
                Toggle("使用演练数据",isOn:$store.isDemo).font(.system(size:13)).disabled(CaptureStore.simulator)
                Text(CaptureStore.simulator ? "模拟器没有真实 AR 相机。可以在这里完整演练登记、分段和导出，真实扫描留到手机上。" : "真实模式会请求相机权限；图像、相机位姿与可用深度只保存在本机。")
                    .font(.system(size:11)).foregroundStyle(.secondary).lineSpacing(4)
            }.padding(18).background(.white,in:RoundedRectangle(cornerRadius:14))
            VStack(alignment:.leading,spacing:15) {
                ForEach(Array((store.roomOnly ? [CapturePhase.room] : CapturePhase.allCases).enumerated()), id:\.element) { index, phase in
                    HStack(spacing:14) {
                        Text(String(format:"%02d",index+1)).font(.system(size:11,design:.monospaced)).foregroundStyle(.secondary)
                        Image(systemName:phase.symbol).frame(width:21).foregroundStyle(ink)
                        Text(phase.title).font(.system(size:13)); Spacer()
                    }
                }
            }.padding(.vertical,5)
            VStack(alignment:.leading,spacing:9) {
                Text("房间怎么扫").font(.system(size:14,weight:.semibold))
                Text(store.captureScope == .area ? "① 擦净镜头，开灯，让目标与周围边角一起入镜。\n② 先在正前方起拍，再向左右小步侧移，始终看着目标。\n③ 稍微抬高或降低手机，再拍回来，补足侧面。" : "① 擦净镜头，保持室内光线稳定。\n② 从门口出发沿可走路线慢走，拍到墙角、地面和家具。\n③ 换位置看同一片表面，再回到起点。")
                    .font(.system(size:12)).foregroundStyle(.secondary).lineSpacing(5)
                Text("房间里的门和家具先保持不动。不要只站在原地转手机；不要为了扫描跨过障碍物。")
                    .font(.system(size:11)).foregroundStyle(.secondary)
            }.padding(16).background(.white,in:RoundedRectangle(cornerRadius:12))
            Button { store.startSession() } label: { Label("新建并进入采集",systemImage:"arrow.right") }
                .buttonStyle(RoomButtonStyle()).accessibilityIdentifier("start-session")
            if !store.drafts.isEmpty {
                DisclosureGroup("找回已有采集记录") {
                    Text("中断或退出后的记录可以重新打包导出；不会把新会话混入旧坐标。").font(.system(size:11)).foregroundStyle(.secondary)
                    ForEach(Array(store.drafts.prefix(10)), id:\.path) { folder in
                        Button("打开记录 " + String(folder.lastPathComponent.prefix(12))) { store.recoverDraft(folder) }
                            .font(.system(size:12)).padding(.vertical,4)
                    }
                }
            }
            if !store.recent.isEmpty {
                VStack(alignment:.leading,spacing:12) {
                    Text("已保留的采集包").font(.system(size:12,weight:.medium))
                    ForEach(Array(store.recent.prefix(5)),id:\.path) { url in
                        ShareLink(item:url) { Label(String(url.lastPathComponent.prefix(18)) + "…",systemImage:"doc.zipper").font(.system(size:11,design:.monospaced)) }
                    }
                }.padding(.top,10)
            }
        }
    }
    private var capture: some View {
        VStack(alignment:.leading,spacing:17) {
            HStack {
                VStack(alignment:.leading,spacing:6) {
                    Text(store.roomOnly ? "空间扫描 · \(store.captureScope.title)" : "STEP \(store.phaseIndex+1) / 4").font(.system(size:10,weight:.medium,design:.monospaced)).tracking(2).foregroundStyle(.secondary)
                    Text(store.phase == .room ? "扫描\(store.captureScope.title)" : store.phase.title).font(.system(size:29,design:.serif)).foregroundStyle(ink).accessibilityIdentifier("phase-title")
                }
                Spacer()
                Button("结束") { earlyFinish = true }.font(.system(size:12)).accessibilityIdentifier("end-early")
            }
            HStack(spacing:5) { ForEach(0..<(store.roomOnly ? 1 : 4)) { index in Capsule().fill(index <= store.phaseIndex ? ink : ink.opacity(0.12)).frame(height:3) } }
            Text(store.phase == .room ? store.captureScope.instructions : store.phase.instruction).font(.system(size:12)).foregroundStyle(.secondary).lineSpacing(5).fixedSize(horizontal:false,vertical:true)
            if store.phase == .room && !store.isDemo {
                VStack(alignment:.leading,spacing:9) {
                    Toggle("镜头已擦净，光线稳定，家具和门保持不动",isOn:$store.stillSceneConfirmed)
                        .font(.system(size:12,weight:.medium)).disabled(store.recording)
                    Text("先在目标正前方开始。小步移动身体，始终保留相邻画面共同的边角；再补左右、高处和低处。不要走动时挪椅子，也不要只原地转手机。")
                        .font(.system(size:11)).foregroundStyle(.secondary).lineSpacing(4)
                }.padding(14).background(.white,in:RoundedRectangle(cornerRadius:12))
            }
            if store.requiresPreparation {
                Toggle(isOn:$store.preparationConfirmed) {
                    Text(store.phase == .object ? "物品已放稳，接下来只移动手机" : store.phase == .empty ? "物品和手已移开，画面里只留空位" : "物品已放回并保持静止")
                        .font(.system(size:12,weight:.medium))
                }.accessibilityIdentifier("preparation-confirmed")
            }
            if store.needsRegistration {
                VStack(alignment:.leading,spacing:10) {
                    Text("先登记这件物品").font(.system(size:13,weight:.medium))
                    TextField("物品名称",text:$store.objectName).textFieldStyle(.roundedBorder).accessibilityIdentifier("object-name")
                    Button { store.registerObject() } label: { Label("登记并开始补扫",systemImage:"plus.circle") }
                        .buttonStyle(RoomButtonStyle()).disabled(!store.canRecord).accessibilityIdentifier("register-object")
                }
            }
            if !store.isDemo {
                Toggle("显示表面覆盖", isOn:$showCoverage).font(.system(size:12))
                if showCoverage {
                    Toggle("整格填色",isOn:$filledCoverage).font(.system(size:12))
                    HStack {
                        Text("覆盖强度").font(.system(size:11))
                        Slider(value:$coverageOpacity,in:0.2...0.85).accessibilityLabel("覆盖颜色强度")
                    }
                }
            }
            ZStack(alignment:.bottomLeading) {
                Group {
                    if store.isDemo {
                        if let image = store.preview { Image(uiImage:image).resizable().aspectRatio(contentMode:.fill).frame(height:340).clipped() }
                        else { Color.gray.opacity(0.1).frame(height:340) }
                    } else {
                        GeometryReader { geometry in
                            ARPreview(session:store.hardware.session,patches:showCoverage ? store.guidePatches : [],target:store.guideTarget,
                                      filled:filledCoverage,opacity:coverageOpacity)
                                .frame(width:geometry.size.width,height:geometry.size.height)
                                .scaleEffect(previewZoom)
                        }.aspectRatio(store.previewAspect,contentMode:.fit)
                    }
                }.clipped()
                    .simultaneousGesture(MagnificationGesture().onChanged { scale in
                        previewZoom = min(3,max(1,zoomStart*Double(scale)))
                    }.onEnded { _ in zoomStart = previewZoom })
                Label(store.recording ? "检查并记录有效视角" : "预览 · 尚未记录",systemImage:store.recording ? "record.circle.fill" : "viewfinder")
                    .font(.system(size:11)).padding(10).background(.ultraThinMaterial,in:Capsule()).padding(12)
            }.clipShape(RoundedRectangle(cornerRadius:15)).overlay(alignment:.topLeading) {
                if !store.isDemo {
                    VStack(alignment:.leading,spacing:5) {
                        Text(store.guideTitle).font(.system(size:13,weight:.semibold))
                        Text(store.targetDirection).font(.system(size:11))
                    }.padding(10).background(.regularMaterial,in:RoundedRectangle(cornerRadius:10)).padding(10)
                }
            }
            if !store.isDemo {
                HStack(spacing:8) {
                    Text("预览").font(.system(size:11))
                    ForEach([1.0,1.5,2.0,3.0],id:\.self) { value in
                        Button(value == 1 ? "全幅 1×" : String(format:"%.1f×",value)) { previewZoom = value; zoomStart = value }
                            .font(.system(size:11,weight:previewZoom == value ? .bold : .regular))
                            .padding(7).background(previewZoom == value ? ink.opacity(0.12) : .white,in:Capsule())
                    }
                }
                Text("双指或按钮放大预览；保存的仍是完整原图，不增加真实细节，也不是 0.5× 超广角。补细节时请在安全距离移动身体。")
                    .font(.system(size:10)).foregroundStyle(.secondary)
            }
            HStack {
                Circle().fill(store.trackingNormal && !store.interrupted ? Color.green.opacity(0.7) : Color.orange).frame(width:6,height:6)
                Text(store.tracking).font(.system(size:10)).foregroundStyle(.secondary)
                Spacer()
                Text("\(store.frameCount) 有效视角").font(.system(size:12,weight:.medium,design:.monospaced)).accessibilityIdentifier("phase-frame-count")
            }
            guidancePanel
            if store.phase == .room && !store.isDemo {
                VStack(alignment:.leading,spacing:9) {
                    Button("从这里继续 · 保留已扫区域") { store.continueInNewRegion() }
                        .buttonStyle(RoomButtonStyle(outlined:true)).disabled(!store.canRecord || store.busy)
                    Text("换区域后找不到原机位也可以继续。跟踪稳定、画面清楚时会建立新片段；稍后补拍共同的门框或家具来连接。")
                        .font(.system(size:11)).foregroundStyle(.secondary)
                    if !store.trackingNormal || store.interrupted {
                        Text("现在是相机跟踪未恢复，与照片重叠不足不同。对准有纹理的位置慢慢移动；不能把丢失的坐标当成原来的坐标。")
                            .font(.system(size:11)).foregroundStyle(.orange)
                        if store.totalFrames > 0 {
                            Button("跟踪恢复不了，先保存已有内容") { store.showReview() }.font(.system(size:12))
                        }
                    }
                }
            }
            if store.phase == .room && !store.isDemo {
                VStack(alignment:.leading,spacing:10) {
                    Toggle("已检查目标边缘、顶部和低处",isOn:$store.detailsConfirmed).font(.system(size:12))
                    TextField("缺失备注，例如：柜子背后到不了，玻璃有反光",text:$store.captureNotes,axis:.vertical)
                        .lineLimit(2...4).textFieldStyle(.roundedBorder).font(.system(size:12))
                    Text("无法看见的背面和底面不会因覆盖变绿而自动恢复。备注会随原始照片交给电脑。")
                        .font(.system(size:10)).foregroundStyle(.secondary)
                }
            }
            if !store.needsRegistration {
                if store.phase != .room {
                    HStack { Image(systemName:"cube"); Text(store.currentObjectLabel); Spacer(); Text("独立物品").foregroundStyle(.secondary) }
                        .font(.system(size:11)).padding(12).background(.white,in:RoundedRectangle(cornerRadius:9))
                }
                if store.phase == .room && !store.roomOnly {
                    Button("只保存空间，结束采集") { store.showReview() }
                        .buttonStyle(RoomButtonStyle(outlined:true)).disabled(!store.canComplete).accessibilityIdentifier("room-export-review")
                }
                if !store.isDemo && store.frameCount > 0 {
                    Button("重扫本阶段（保留旧片段）") { store.retakePhase() }.font(.system(size:11)).accessibilityIdentifier("retake-phase")
                }
            }
            Text("采集包保存原始图像和相机数据，还不是高斯模型。重建与物品分割将在电脑端进行。")
                .font(.system(size:10)).foregroundStyle(.secondary).lineSpacing(4)
            if !store.isDemo {
                Text("这些是采集预检，不是画质保证。绿色只代表已识别表面的多角度观察达标；未识别、被遮挡或反光的区域仍可能缺失。生成后由你查看并决定是否保存。")
                    .font(.system(size:10)).foregroundStyle(.secondary).lineSpacing(4)
            }
        }
    }
    private var guidancePanel: some View {
        VStack(alignment:.leading,spacing:12) {
            Label(store.isDemo ? (ProcessInfo.processInfo.arguments.contains("--demo-blocked") ? store.guideTitle : "演练不评价实拍质量") : store.guideTitle,
                  systemImage:store.lastFrameAccepted ? "checkmark.circle.fill" : "viewfinder")
                .font(.system(size:15,weight:.semibold)).foregroundStyle(store.lastFrameAccepted || !store.recording ? ink : Color.orange).accessibilityIdentifier("guide-title")
            Text(store.isDemo ? "真实手机会检查光线、运动、视角衔接，并用房间结构指出补扫区域。" : store.guideDetail)
                .font(.system(size:12)).foregroundStyle(.secondary).lineSpacing(4)
            if !store.isDemo, let summary = store.guideSummary {
                if store.phase == .room, let count = summary.capture_run_count {
                    Text("已记录 \(count) 个片段 · 估计待衔接 \(max(0,(summary.estimated_components ?? 1)-1)) 处")
                        .font(.system(size:12,weight:.semibold))
                    if summary.waiting_for_region == true {
                        Text("新位置暂时没有找到共同视角；稳住约两秒即可另起片段，不必退回完全相同的机位。")
                            .font(.system(size:11)).foregroundStyle(.orange)
                    }
                }
                if let visible = summary.visible_patches, let ready = summary.visible_ready {
                    Text("当前原始画幅：\(ready) / \(visible) 个已发现格有多角度记录")
                        .font(.system(size:11,weight:.medium))
                }
                if store.phase == .room {
                    VStack(alignment:.leading,spacing:8) {
                        Text("这次走到了哪些视角").font(.system(size:12,weight:.medium))
                        HStack(spacing:12) {
                            viewCount("起始高度",summary.room_view_counts?["middle"] ?? 0)
                            viewCount("高处",summary.room_view_counts?["raised"] ?? 0)
                            viewCount("低处",summary.room_view_counts?["lowered"] ?? 0)
                        }
                        if store.captureScope == .area {
                            HStack(spacing:12) {
                                viewCount("左侧",summary.room_side_counts?["left"] ?? 0)
                                viewCount("中间",summary.room_side_counts?["center"] ?? 0)
                                viewCount("右侧",summary.room_side_counts?["right"] ?? 0)
                            }
                        }
                        Text("以第一张有效照片的位置为参照，只统计已保存视角。数字增加不代表对应表面已拍完整；仍需让目标保持入镜。")
                            .font(.system(size:10)).foregroundStyle(.secondary)
                    }
                }
                HStack(spacing:10) {
                    Label("未记录",systemImage:"square.dashed").foregroundStyle(.red)
                    Label("需换角度",systemImage:"square.lefthalf.filled").foregroundStyle(.orange)
                    Label("多角度已记",systemImage:"checkmark.square.fill").foregroundStyle(.green)
                }.font(.system(size:10,weight:.medium))
                Text("无色区域可能尚未发现；被遮挡的标记暂时隐藏。放大的格子是当前建议补拍处。").font(.system(size:10)).foregroundStyle(.secondary)
                if let total = summary.surface_patches, let ready = summary.surface_ready {
                    HStack {
                        Text("已发现的实际表面").font(.system(size:12,weight:.medium))
                        Spacer()
                        Text("\(ready) / \(total) 格已有多角度").font(.system(size:11,design:.monospaced))
                    }
                    ProgressView(value:Double(ready),total:Double(max(1,total)))
                    Text("先发现表面 → 侧移补橙格 → 换高度 → 补边缘和背面。发现新表面时进度可能下降。").font(.system(size:11)).foregroundStyle(.secondary)
                    if summary.coverage_limit_reached == true {
                        Text("覆盖提示已达到本阶段容量。相机仍在记录，建议结束这一片区域；未着色处不代表已扫完。").font(.system(size:11)).foregroundStyle(.orange)
                    }
                }
                if store.phase == .room && store.captureScope == .room {
                    HStack {
                        Text("已发现区域的综合覆盖（非房间完整度）").font(.system(size:11))
                        Spacer(); Text("\(Int(summary.multiview_fraction*100))%").font(.system(size:14,weight:.semibold,design:.monospaced))
                    }
                    ProgressView(value:summary.multiview_fraction)
                    HStack {
                        Text("\(summary.walls) 面墙 · \(summary.floor_detected ? "已发现地面" : "还需拍地面")")
                        Spacer(); Text("只统计已发现区域")
                    }.font(.system(size:10)).foregroundStyle(.secondary)
                    if summary.occluded_patches > 0 { Text("\(summary.occluded_patches) 个表面格被遮挡，未承诺还原这些区域。").font(.system(size:10)).foregroundStyle(.secondary) }
                    if store.guideTarget != nil {
                        Text("换一个位置对准放大的格子，不要只原地转手机；尽量同时拍到周围的墙角、门框和家具。")
                            .font(.system(size:11)).foregroundStyle(ink)
                    }
                    Toggle("已走遍房间可到达区域，并回到起点",isOn:$store.roomBoundaryConfirmed)
                        .font(.system(size:11)).accessibilityIdentifier("room-boundary-confirmed")
                } else if store.phase == .object {
                    ObjectOrbitGuide(directions:summary.object_directions ?? [])
                    Text("绕拍方向 \(summary.object_orbit_bins) / 12 · 已到过：\((summary.object_heights ?? []).joined(separator:"、"))")
                        .font(.system(size:11,weight:.medium))
                    Text("开始时先让物品位于取景中央，物品保持不动。先绕一圈，再抬高手机补拍顶部；圈格只记录方向，不代表每个面都拍清。").font(.system(size:11)).foregroundStyle(.secondary)
                }
                if store.phase == .room && store.captureScope == .area {
                    Text("局部扫描不用凑齐墙面或绕整间房。让目标保持在画面里，左右侧移，再换一个高度。").font(.system(size:11)).foregroundStyle(.secondary)
                    Toggle("已从左右两侧和不同高度看过这个区域", isOn:$store.roomBoundaryConfirmed).font(.system(size:11))
                }
                if store.hasRecommendations {
                    ForEach(Array(store.completionIssues.prefix(3).enumerated()),id:\.offset) { _,issue in
                        Label(issue,systemImage:"arrow.triangle.turn.up.right.diamond").font(.system(size:11)).foregroundStyle(.secondary)
                    }
                } else { Label("已记录足够视角，可以结束并生成预览",systemImage:"checkmark.circle").font(.system(size:12)).foregroundStyle(ink) }
                Text("自动排除 \(summary.rejected_frames) 次不合格或重复视角").font(.system(size:10)).foregroundStyle(.secondary)
            }
        }.padding(15).frame(maxWidth:.infinity,alignment:.leading).background(.white,in:RoundedRectangle(cornerRadius:12))
    }
    private var review: some View {
        VStack(alignment:.leading,spacing:20) {
            Text(store.exportURL == nil ? "保存这次采集" : "采集包准备好了")
                .font(.system(size:30,design:.serif)).foregroundStyle(ink).accessibilityIdentifier("review-title")
            Text(store.document?.title ?? "我的空间").font(.system(size:14,weight:.medium))
            HStack(spacing:28) {
                metric("总图像", "\(store.totalFrames)")
                metric("独立物品", "\(store.document?.objects.count ?? 0)")
                metric("扫描片段", "\(store.document?.segments.count ?? 0)")
            }.padding(18).frame(maxWidth:.infinity,alignment:.leading).background(.white,in:RoundedRectangle(cornerRadius:14))
            VStack(alignment:.leading,spacing:15) {
                ForEach(store.document?.segments ?? []) { segment in
                    HStack {
                        Image(systemName:segment.phase.symbol).frame(width:24).foregroundStyle(ink)
                        VStack(alignment:.leading,spacing:3) {
                            Text(segment.phase.title).font(.system(size:13))
                            if let id = segment.object_id, let object = store.document?.objects.first(where:{$0.id == id}) {
                                Text(object.name).font(.system(size:10)).foregroundStyle(.secondary)
                            }
                        }
                        Spacer(); Text("\(segment.frame_count) 帧").font(.system(size:11,design:.monospaced)).foregroundStyle(.secondary)
                    }
                }
            }
            if let url = store.exportURL {
                Label("原始采集已保存，接下来交给电脑生成空间",systemImage:"doc.zipper").font(.system(size:12)).foregroundStyle(ink)
                ShareLink(item:url) { Label("导出采集包",systemImage:"square.and.arrow.up") }
                    .buttonStyle(RoomButtonStyle()).accessibilityIdentifier("share-capture")
                Button("返回首页") { store.returnHome() }.buttonStyle(RoomButtonStyle(outlined:true)).accessibilityIdentifier("return-home")
                Text("通过 AirDrop 或“存储到文件”带回 Mac，在工作台选择“手机采集 · Mac 重建”。先整理原始照片，再交给 OOOSplat 生成；完成后导回标准高斯 PLY，查看效果后再保存。")
                    .font(.system(size:11)).foregroundStyle(.secondary).lineSpacing(4)
            } else {
                Button { store.finishAndExport() } label: {
                    if store.busy { ProgressView().tint(.white); Text("正在整理采集包…") }
                    else { Label("打包采集",systemImage:"doc.zipper") }
                }.buttonStyle(RoomButtonStyle()).disabled(store.busy || store.totalFrames == 0).accessibilityIdentifier("finish-export")
                if !store.roomOnly {
                    Button("再登记一件物品") { store.addAnotherObject() }.buttonStyle(RoomButtonStyle(outlined:true)).disabled(store.interrupted || store.busy)
                }
                if !store.interrupted {
                    Button("返回当前阶段继续补拍") { store.screen = .capture }.buttonStyle(RoomButtonStyle(outlined:true)).disabled(store.busy)
                }
                if store.totalFrames == 0 {
                    Button("返回首页，保留已有记录") { store.returnHome() }.font(.system(size:12)).disabled(store.busy)
                }
                Text(store.interrupted ? "本次跟踪曾中断，已有内容会作为不完整采集保留。" : "打包时会停止相机，原始照片与深度保留在手机。传回电脑后无需手工整理照片。")
                    .font(.system(size:11)).foregroundStyle(.secondary).lineSpacing(4)
            }
        }
    }
    private func metric(_ label:String,_ value:String) -> some View {
        VStack(alignment:.leading,spacing:7) { Text(value).font(.system(size:26,weight:.light,design:.rounded)); Text(label).font(.system(size:10)).foregroundStyle(.secondary) }
    }
    private func viewCount(_ label:String,_ count:Int) -> some View {
        VStack(alignment:.leading,spacing:4) {
            Label(count > 0 ? "\(count) 张" : "待补拍",systemImage:count > 0 ? "camera.fill" : "camera")
                .font(.system(size:11,weight:.medium)).foregroundStyle(count > 0 ? ink : Color.orange)
            Text(label).font(.system(size:10)).foregroundStyle(.secondary)
        }.frame(maxWidth:.infinity,alignment:.leading)
    }
}

private struct RoomButtonStyle: ButtonStyle {
    var outlined = false
    @Environment(\.isEnabled) var enabled
    func makeBody(configuration:Configuration) -> some View {
        configuration.label.font(.system(size:14,weight:.medium)).frame(maxWidth:.infinity).padding(.vertical,15)
            .foregroundStyle(outlined ? ink : .white)
            .background(outlined ? Color.clear : ink,in:RoundedRectangle(cornerRadius:10))
            .overlay(RoundedRectangle(cornerRadius:10).stroke(ink.opacity(outlined ? 0.25 : 0),lineWidth:1))
            .opacity(enabled ? (configuration.isPressed ? 0.75 : 1) : 0.4)
    }
}

private struct ARPreview: UIViewRepresentable {
    let session: ARSession
    var patches: [GuidePatch]
    var target: SIMD3<Double>?
    var filled: Bool
    var opacity: Double
    func makeCoordinator() -> Coordinator { Coordinator() }
    final class Coordinator {
        var markers: [String: SCNNode] = [:]
        var lastUpdate = Date.distantPast
        var textures: [String:UIImage] = [:]
        func texture(_ state:Int,filled:Bool) -> UIImage {
            let key = "\(state)-\(filled)"
            if let existing = textures[key] { return existing }
            let image = UIGraphicsImageRenderer(size:CGSize(width:96,height:96)).image { context in
                let color = state == 2 ? UIColor.systemGreen : state == 1 ? UIColor.systemOrange : UIColor.systemRed
                let rect = CGRect(x:4,y:4,width:88,height:88)
                if filled { color.setFill(); UIBezierPath(roundedRect:rect,cornerRadius:8).fill() }
                (filled ? UIColor.white : color).setStroke()
                let border = UIBezierPath(roundedRect:rect,cornerRadius:8); border.lineWidth = filled ? 3 : 7; border.stroke()
                context.cgContext.setStrokeColor(UIColor.white.cgColor); context.cgContext.setLineWidth(6)
                context.cgContext.setLineCap(.round)
                if state == 2 {
                    context.cgContext.move(to:CGPoint(x:29,y:48)); context.cgContext.addLine(to:CGPoint(x:43,y:62)); context.cgContext.addLine(to:CGPoint(x:69,y:33))
                } else if state == 1 {
                    context.cgContext.move(to:CGPoint(x:30,y:63)); context.cgContext.addLine(to:CGPoint(x:64,y:29))
                    context.cgContext.move(to:CGPoint(x:44,y:29)); context.cgContext.addLine(to:CGPoint(x:64,y:29)); context.cgContext.addLine(to:CGPoint(x:64,y:49))
                } else {
                    context.cgContext.move(to:CGPoint(x:48,y:27)); context.cgContext.addLine(to:CGPoint(x:48,y:56))
                    context.cgContext.move(to:CGPoint(x:48,y:69)); context.cgContext.addLine(to:CGPoint(x:48,y:70))
                }
                context.cgContext.strokePath()
            }
            textures[key] = image; return image
        }
    }
    func makeUIView(context:Context) -> ARSCNView {
        let view = ARSCNView(frame:.zero); view.session = session; view.automaticallyUpdatesLighting = true; return view
    }
    func updateUIView(_ uiView:ARSCNView, context:Context) {
        guard Date().timeIntervalSince(context.coordinator.lastUpdate) > 0.35 else { return }
        context.coordinator.lastUpdate = Date()
        let camera = session.currentFrame.map { guidePosition(guideMatrix(rowMajor($0.camera.transform))) } ?? SIMD3<Double>(0,0,0)
        // Nearby visible patches first: never display a wall marker through furniture.
        let visible = Array(patches.filter(\.currentlyVisible).sorted {
            simd_distance($0.position,camera) < simd_distance($1.position,camera)
        }.prefix(1000)), keys = Set(visible.map(\.id))
        for key in Array(context.coordinator.markers.keys) where !keys.contains(key) {
            context.coordinator.markers[key]?.removeFromParentNode(); context.coordinator.markers.removeValue(forKey:key)
        }
        for patch in visible {
            let node: SCNNode
            if let existing = context.coordinator.markers[patch.id] { node = existing }
            else {
                let tile = SCNPlane(width:CGFloat(patch.size),height:CGFloat(patch.size))
                tile.cornerRadius = CGFloat(patch.size*0.15)
                node = SCNNode(geometry:tile)
                node.geometry?.firstMaterial?.isDoubleSided = true
                node.geometry?.firstMaterial?.writesToDepthBuffer = false
                node.geometry?.firstMaterial?.lightingModel = .constant
                uiView.scene.rootNode.addChildNode(node); context.coordinator.markers[patch.id] = node
            }
            if let tile = node.geometry as? SCNPlane { tile.width = CGFloat(patch.size); tile.height = CGFloat(patch.size) }
            let position = patch.position + patch.normal*0.008
            node.simdPosition = SIMD3(Float(position.x),Float(position.y),Float(position.z))
            let normal = SIMD3<Float>(Float(patch.normal.x),Float(patch.normal.y),Float(patch.normal.z))
            node.simdOrientation = simd_quatf(from:SIMD3<Float>(0,0,1),to:simd_normalize(normal))
            node.geometry?.firstMaterial?.diffuse.contents = context.coordinator.texture(patch.ready ? 2 : patch.observations == 0 ? 0 : 1,filled:filled)
            node.opacity = CGFloat(opacity)
            let isTarget = target.map { simd_distance($0,patch.position) < 0.01 } ?? false
            node.scale = isTarget ? SCNVector3(1.25,1.25,1.25) : SCNVector3(1,1,1)
        }
    }
}

private struct ObjectOrbitGuide: View {
    let directions: [Int]
    var body: some View {
        ZStack {
            VStack(spacing:3) {
                Image(systemName:"cube.transparent").font(.title2)
                Text("手机绕物品走").font(.system(size:10))
            }
            ForEach(0..<12,id:\.self) { index in
                let angle = Double(index)/12 * 2 * Double.pi
                Image(systemName:directions.contains(index) ? "checkmark.circle.fill" : "circle.dashed")
                    .foregroundStyle(directions.contains(index) ? Color.green : Color.orange)
                    .offset(x:CGFloat(sin(angle)*72),y:CGFloat(-cos(angle)*58))
                    .accessibilityLabel("方向 \(index+1) \(directions.contains(index) ? "已记录" : "待拍")")
            }
        }.frame(maxWidth:.infinity).frame(height:145)
    }
}
