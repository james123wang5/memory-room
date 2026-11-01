import ARKit
import Combine
import Foundation
import UIKit
import ZIPFoundation
import simd

@MainActor final class CaptureStore: ObservableObject {
    enum Screen { case welcome, capture, review }
    @Published var screen: Screen = .welcome
    @Published var roomName = "我的房间"
    @Published var captureScope: CaptureScope = .area
    @Published var roomOnly = true
    @Published var drafts: [URL] = []
    @Published var objectName = "一本书"
    @Published var phase: CapturePhase = .room
    @Published var recording = false
    @Published var tracking = "准备采集"
    @Published var trackingNormal = false
    @Published var interrupted = false
    @Published var busy = false
    @Published var errorMessage: String?
    @Published var preview: UIImage?
    @Published var previewAspect = 0.75
    @Published var document: CaptureDocument?
    @Published var exportURL: URL?
    @Published var recent: [URL] = []
    @Published var isDemo: Bool
    @Published var guideTitle = "准备识别房间"
    @Published var guideDetail = "从门口开始，拍到墙角和地面，等待识别结构。"
    @Published var guideSummary: GuideSummary?
    @Published var guidePatches: [GuidePatch] = []
    @Published var guideTarget: SIMD3<Double>?
    @Published var preparationConfirmed = false
    @Published var roomBoundaryConfirmed = false
    @Published var stillSceneConfirmed = false
    @Published var detailsConfirmed = false
    @Published var captureNotes = ""
    @Published var lastFrameAccepted = false
    let hardware = HardwareCaptureSource()
    private var demo: DemoCaptureSource?
    private var timer: Timer?
    private var directory: URL?
    private var currentObject: RegisteredObject?
    private var journal: FileHandle?
    private var phaseFrames = 0
    private var lastHaptic = Date.distantPast
    @Published private(set) var frameCount = 0
    @Published private(set) var totalFrames = 0

    static var simulator: Bool {
        #if targetEnvironment(simulator)
        return true
        #else
        return false
        #endif
    }
    init() {
        isDemo = Self.simulator || ProcessInfo.processInfo.arguments.contains("--demo")
        hardware.onState = { [weak self] text, valid in
            guard let self = self, !self.interrupted else { return }
            self.tracking = text; self.trackingNormal = valid
        }
        hardware.onSample = { [weak self] sample in self?.receive(sample) }
        hardware.onImageSize = { [weak self] w,h in
            self?.previewAspect = Double(min(w,h))/Double(max(w,h))
        }
        hardware.onInterruption = { [weak self] text in self?.handleInterruption(text) }
        hardware.onGuidance = { [weak self] decision, summary, patches, target in
            guard let self = self, self.screen == .capture else { return }
            if self.recording && !decision.accept && self.guideTitle != decision.title && decision.title != "这个位置已经记录" && Date().timeIntervalSince(self.lastHaptic) > 3 {
                UINotificationFeedbackGenerator().notificationOccurred(.warning); self.lastHaptic = Date()
                UIAccessibility.post(notification:.announcement,argument:decision.title)
            }
            self.guideTitle = decision.title; self.guideDetail = decision.detail
            self.guideSummary = summary; self.lastFrameAccepted = decision.accept
            self.guidePatches = patches; self.guideTarget = target
            if !self.needsRegistration { self.document?.quality?[self.segmentKey] = summary }
        }
        hardware.onLayout = { [weak self] surfaces in
            guard let directory = self?.directory else { return }
            try? JSONEncoder().encode(surfaces).write(to:directory.appendingPathComponent("room-layout.json"),options:.atomic)
        }
        refreshRecent()
    }
    var root: URL { FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0] }
    var segmentKey: String {
        phase == .room ? "room" : "\(phase.rawValue):\(currentObject?.id ?? "unregistered")"
    }
    var needsRegistration: Bool { phase == .object && currentObject == nil }
    var currentObjectLabel: String { currentObject?.name ?? "尚未登记" }
    var phaseIndex: Int { CapturePhase.allCases.firstIndex(of: phase) ?? 0 }
    var minimumFrames: Int { isDemo ? 3 : (phase == .room && captureScope == .room ? 60 : 30) }
    var requiresPreparation: Bool { phase != .room && !isDemo }
    var canRecord: Bool { trackingNormal && !interrupted && (isDemo || phase != .room || stillSceneConfirmed) && (!requiresPreparation || preparationConfirmed) }
    var canComplete: Bool {
        if isDemo { return frameCount >= minimumFrames && !interrupted && !ProcessInfo.processInfo.arguments.contains("--demo-blocked") }
        return !interrupted && frameCount >= minimumFrames
    }
    var hasRecommendations: Bool { !isDemo && !completionIssues.isEmpty }
    var completionIssues: [String] {
        if isDemo { return ["演练只检查界面，不评价真实扫描质量。"] }
        var issues = guideSummary?.issues ?? ["等待相机与结构识别。"]
        if frameCount < minimumFrames { issues.insert("还需换角度采集，至少记录 \(minimumFrames) 个有效视角。", at:0) }
        if phase == .room && !detailsConfirmed { issues.append("请检查目标边缘、顶部和低处；到不了或反光的区域可以写在备注里。") }
        if phase == .room && !roomBoundaryConfirmed { issues.append(captureScope == .room ? "建议走遍可到达的区域，并回到开始位置。" : "建议从左右两侧和不同高度看过这个区域。") }
        return issues
    }
    var targetDirection: String {
        guard let target = guideTarget, let frame = hardware.session.currentFrame else { return captureScope == .area ? "从目标中央起拍，向左右侧移，再换高低视角。" : "从起点缓慢绕行，再补高处和低处；不要求把未知表面刷绿。" }
        let pose = guideMatrix(rowMajor(frame.camera.transform)), forward = guideForward(pose)
        let offset = target-guidePosition(pose)
        guard simd_length(offset) > 0.001 else { return "侧移一小步，换角度观察这个位置。" }
        let delta = simd_normalize(offset)
        if abs(forward.y) > 0.9 { return "把手机放平一些，让墙角和家具同时入镜。" }
        if simd_dot(delta,forward) < 0 { return "转身寻找放大的补扫格。" }
        let right = simd_normalize(simd_cross(forward,SIMD3<Double>(0,1,0)))
        let horizontal = simd_dot(delta,right)
        if abs(horizontal) > 0.3 { return horizontal > 0 ? "向右转，找到放大的补扫格。" : "向左转，找到放大的补扫格。" }
        if delta.y > 0.35 { return "抬高手机，补拍上方色块。" }
        if delta.y < -0.35 { return "降低视角，补拍下方色块。" }
        return "对准前方色块，侧移一小步，换角度拍。"
    }

    func startSession() {
        guard !busy else { return }
        do {
            hardware.pause(); timer?.invalidate(); try journal?.close()
            let id = UUID().uuidString.lowercased()
            let folder = root.appendingPathComponent("Captures/\(id)", isDirectory: true)
            try FileManager.default.createDirectory(at: folder.appendingPathComponent("images"), withIntermediateDirectories: true)
            try FileManager.default.createDirectory(at: folder.appendingPathComponent("depth"), withIntermediateDirectories: true)
            let journalURL = folder.appendingPathComponent("frames.jsonl")
            FileManager.default.createFile(atPath: journalURL.path, contents: nil)
            journal = try FileHandle(forWritingTo: journalURL)
            directory = folder
            document = CaptureDocument(id:id, title:roomName.trimmingCharacters(in:.whitespacesAndNewlines).isEmpty ? "我的房间" : roomName,
                                       source:isDemo ? "simulator-demo" : "arkit", simulated:isDemo,
                                       created_at:ISO8601DateFormatter().string(from:Date()),
                                       warnings:isDemo ? ["程序生成的演练图像，不是真实扫描，不可用作实测质量结论"] : [])
            document?.quality_version = isDemo ? nil : 1; document?.quality = [:]
            document?.capture_scope = captureScope
            document?.reconstruction_route = "ooosplat-colmap"
            stillSceneConfirmed = false; detailsConfirmed = false; captureNotes = ""
            document?.space_id = id
            document?.capture_mode = roomOnly ? "space-only" : "space-and-objects"
            hardware.guidance.scope = captureScope
            currentObject = nil; phase = .room; frameCount = 0; phaseFrames = 0; totalFrames = 0
            recording = false; interrupted = false; exportURL = nil; errorMessage = nil
            guideSummary = nil; guidePatches = []; guideTarget = nil; preparationConfirmed = false; roomBoundaryConfirmed = false
            try persist()
            screen = .capture
            UIApplication.shared.isIdleTimerDisabled = true
            if isDemo {
                demo = DemoCaptureSource(); let sample = try demo!.sample(phase:phase)
                preview = UIImage(data:sample.jpeg); tracking = "演练模式 · 不使用相机或 LiDAR"; trackingNormal = true
                if ProcessInfo.processInfo.arguments.contains("--demo-blocked") {
                    guideTitle = "慢一点，画面会糊"; guideDetail = "质量反馈测试：坏帧不会增加可完成的有效视角。"
                }
            } else { demo = nil; hardware.start() }
        } catch { fail(error) }
    }
    func registerObject() {
        let name = objectName.trimmingCharacters(in:.whitespacesAndNewlines)
        guard !name.isEmpty else { errorMessage = "请给物品起个名称"; return }
        let object = RegisteredObject(id:UUID().uuidString.lowercased(), name:name)
        currentObject = object; document?.objects.append(object)
        do { try persist(); if isDemo { startRecording() } } catch { fail(error) }
    }
    func startRecording() {
        guard canRecord && !busy && !needsRegistration && exportURL == nil else { return }
        UIApplication.shared.isIdleTimerDisabled = true
        recording = true; hardware.recording = !isDemo
        if isDemo {
            timer?.invalidate()
            timer = Timer.scheduledTimer(withTimeInterval:0.25, repeats:true) { [weak self] _ in
                Task { @MainActor in
                    guard let self = self, self.recording else { return }
                    do { if let sample = try self.demo?.sample(phase:self.phase) { self.receive(sample) } }
                    catch { self.fail(error) }
                }
            }
        }
    }
    func pauseRecording() {
        recording = false; hardware.recording = false; timer?.invalidate(); timer = nil
        if let index = document?.segments.firstIndex(where: { $0.id == segmentKey }), let last = document?.frames.last?.timestamp {
            document?.segments[index].end = last + 0.0001
        }
        do { try journal?.synchronize(); try persist() } catch { fail(error) }
    }
    func continueInNewRegion() {
        guard !isDemo, phase == .room, !interrupted, !busy, exportURL == nil else { return }
        guard canRecord else { errorMessage = "先完成静态场景确认并等待跟踪稳定；若跟踪一直恢复不了，请导出已有内容再新建采集。"; return }
        hardware.guidance.continueFromHere()
        if !recording { startRecording() }
        guideTitle = "准备从这里继续"
        guideDetail = "稳住手机，让光线和清晰度合适。旧照片与绿色覆盖保留；缺少衔接的片段会写入采集记录。"
    }
    private func receive(_ sample: CameraSample) {
        guard recording, !interrupted, let directory = directory, document != nil else { return }
        if isDemo && ProcessInfo.processInfo.arguments.contains("--demo-blocked") {
            let input = GuideInput(view:GuideView(time:sample.timestamp,pose:guideMatrix(sample.transform),intrinsics:sample.intrinsics,
                                                  depth:[],depthWidth:0,depthHeight:0),tracking:true,speed:2,angularSpeed:0,
                                   exposure:0.01,brightness:0.5,clipped:0,edgeEnergy:100,depthValid:1,distance:2)
            let decision = hardware.guidance.evaluate(input,recording:true)
            guideTitle = decision.title; guideDetail = decision.detail; guideSummary = hardware.guidance.summary()
            return
        }
        do {
            let number = totalFrames
            let imagePath = String(format:"images/%06d.jpg", number)
            try sample.jpeg.write(to:directory.appendingPathComponent(imagePath), options:.atomic)
            var depth: DepthMetadata?
            if let data = sample.depth, let k = sample.depthIntrinsics {
                let path = String(format:"depth/%06d.f32", number)
                try data.write(to:directory.appendingPathComponent(path), options:.atomic)
                depth = DepthMetadata(path:path, width:k.w, height:k.h, intrinsics:k)
            }
            let frame = CapturedFrame(image:imagePath, timestamp:sample.timestamp, segment:segmentKey,
                                      intrinsics:sample.intrinsics, camera_to_world:sample.transform, tracking_state:"normal", depth:depth,quality:sample.quality)
            if document!.segments.firstIndex(where: { $0.id == segmentKey }) == nil {
                document!.segments.append(CaptureSegment(id:segmentKey, phase:phase, object_id:currentObject?.id,
                                                         start:sample.timestamp, frame_count:0))
            }
            let i = document!.segments.firstIndex(where: { $0.id == segmentKey })!
            document!.segments[i].frame_count += 1; document!.segments[i].end = nil
            document!.frames.append(frame)
            let line = try JSONEncoder().encode(frame)
            try journal?.write(contentsOf:line + Data([10]))
            totalFrames += 1; phaseFrames += 1; frameCount = phaseFrames
            if isDemo { preview = UIImage(data:sample.jpeg) }
            if totalFrames % 5 == 0 { try persist() }
            if totalFrames >= 9000 { handleInterruption("本次已达到 9,000 帧上限，请结束并导出。") }
        } catch { fail(error) }
    }
    func completePhase() {
        guard canComplete else { errorMessage = completionIssues.joined(separator:"\n"); return }
        if hasRecommendations { document?.guidance_override = true }
        pauseRecording()
        if phase == .room && roomOnly { screen = .review; return }
        switch phase {
        case .room: phase = .object; currentObject = nil
        case .object: phase = .empty
        case .empty: phase = .placement
        case .placement: screen = .review
        }
        if screen == .review { return }
        phaseFrames = 0; frameCount = 0
        preparationConfirmed = false; guideSummary = nil; guidePatches = []; guideTarget = nil
        hardware.beginPhase(phase)
    }
    func addAnotherObject() {
        guard !interrupted && exportURL == nil else { return }
        phase = .object; currentObject = nil; objectName = "另一件物品"; frameCount = 0; phaseFrames = 0; screen = .capture
        preparationConfirmed = false; guideSummary = nil; guidePatches = []; guideTarget = nil; hardware.beginPhase(.object)
    }
    func retakePhase() {
        pauseRecording()
        let key = segmentKey, retired = "discarded:\(UUID().uuidString.lowercased()):\(key)"
        for i in document?.frames.indices ?? 0..<0 where document?.frames[i].segment == key { document?.frames[i].segment = retired }
        for i in document?.segments.indices ?? 0..<0 where document?.segments[i].id == key { document?.segments[i].id = retired }
        if let old = document?.quality?[key] { document?.quality?[retired] = old; document?.quality?.removeValue(forKey:key) }
        document?.warnings.append("\(key) 的旧片段已保留为 \(retired)，不参与当前重建。")
        phaseFrames = 0; frameCount = 0; guideSummary = nil; guidePatches = []; guideTarget = nil
        preparationConfirmed = false; if phase == .room { roomBoundaryConfirmed = false; detailsConfirmed = false }
        hardware.beginPhase(phase); try? persist()
    }
    func showReview() {
        if hasRecommendations { document?.guidance_override = true }
        pauseRecording(); screen = .review
    }
    func appBackgrounded() {
        guard document != nil, exportURL == nil, screen != .welcome else { return }
        handleInterruption("采集应用离开前台，坐标连续性不能保证。请导出已有内容，再新建采集。")
    }
    private func handleInterruption(_ message: String) {
        UIApplication.shared.isIdleTimerDisabled = false
        interrupted = true; recording = false; hardware.recording = false; timer?.invalidate()
        document?.warnings.append(message); tracking = "跟踪中断 · 已停止记录"; trackingNormal = false
        try? persist(); errorMessage = message
    }
    private func persist() throws {
        guard let directory = directory else { return }
        document?.capture_notes = captureNotes.trimmingCharacters(in:.whitespacesAndNewlines)
        document?.capture_checklist = ["static_scene":stillSceneConfirmed, "reachable_area":roomBoundaryConfirmed, "details_reviewed":detailsConfirmed]
        guard let document = document else { return }
        let encoder = JSONEncoder(); encoder.outputFormatting = [.prettyPrinted, .sortedKeys, .withoutEscapingSlashes]
        try encoder.encode(document).write(to:directory.appendingPathComponent("session.json"), options:.atomic)
    }
    func finishAndExport() {
        guard !busy, totalFrames > 0, let directory = directory, let id = document?.id else { return }
        pauseRecording(); hardware.pause(); busy = true
        UIApplication.shared.isIdleTimerDisabled = false
        do {
            document?.status = isDemo ? "simulated-not-reconstructed" : (interrupted ? "partial" : "captured-not-reconstructed")
            try journal?.synchronize(); try journal?.close(); journal = nil; try persist()
            let exports = root.appendingPathComponent("Exports", isDirectory:true)
            try FileManager.default.createDirectory(at:exports, withIntermediateDirectories:true)
            // A fresh filename leaves every earlier export untouched.
            let destination = exports.appendingPathComponent("\(id)-\(Int(Date().timeIntervalSince1970)).capture.zip")
            DispatchQueue.global(qos:.userInitiated).async {
                do {
                    try FileManager.default.zipItem(at:directory, to:destination, shouldKeepParent:false, compressionMethod:.deflate)
                    DispatchQueue.main.async { self.exportURL = destination; self.busy = false; self.refreshRecent() }
                } catch { DispatchQueue.main.async { self.busy = false; self.fail(error) } }
            }
        } catch { busy = false; fail(error) }
    }
    func returnHome() {
        UIApplication.shared.isIdleTimerDisabled = false
        pauseRecording(); hardware.pause()
        if exportURL == nil { document?.status = "partial"; try? persist() }
        try? journal?.close(); journal = nil
        screen = .welcome; refreshRecent()
    }
    private func refreshRecent() {
        recent = ((try? FileManager.default.contentsOfDirectory(at:root.appendingPathComponent("Exports"), includingPropertiesForKeys:[.creationDateKey])) ?? [])
            .filter { $0.pathExtension == "zip" }.sorted { $0.lastPathComponent > $1.lastPathComponent }
        drafts = ((try? FileManager.default.contentsOfDirectory(at:root.appendingPathComponent("Captures"),includingPropertiesForKeys:[.creationDateKey])) ?? [])
            .filter { FileManager.default.fileExists(atPath:$0.appendingPathComponent("session.json").path) }
            .sorted { a, b in
                let ad = (try? a.resourceValues(forKeys:[.creationDateKey]).creationDate) ?? .distantPast
                let bd = (try? b.resourceValues(forKeys:[.creationDateKey]).creationDate) ?? .distantPast
                return ad > bd
            }
    }
    func recoverDraft(_ folder: URL) {
        guard !busy else { return }
        do {
            hardware.pause(); timer?.invalidate(); try journal?.close(); journal = nil
            let saved = try JSONDecoder().decode(CaptureDocument.self, from:Data(contentsOf:folder.appendingPathComponent("session.json")))
            directory = folder; document = saved; roomName = saved.title
            captureNotes = saved.capture_notes ?? ""
            stillSceneConfirmed = saved.capture_checklist?["static_scene"] ?? false
            roomBoundaryConfirmed = saved.capture_checklist?["reachable_area"] ?? false
            detailsConfirmed = saved.capture_checklist?["details_reviewed"] ?? false
            captureScope = saved.capture_scope ?? .room; roomOnly = saved.capture_mode != "space-and-objects"
            isDemo = saved.simulated; totalFrames = saved.frames.count
            frameCount = saved.frames.filter { $0.segment == "room" }.count; phase = .room
            recording = false; interrupted = true; trackingNormal = false; exportURL = nil
            guideSummary = saved.quality?["room"]; errorMessage = nil; screen = .review
        } catch { fail(error) }
    }
    private func fail(_ error: Error) {
        UIApplication.shared.isIdleTimerDisabled = false
        recording = false; hardware.recording = false; timer?.invalidate(); errorMessage = error.localizedDescription
    }
}
