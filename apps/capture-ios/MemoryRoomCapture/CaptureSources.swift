import ARKit
import AVFoundation
import CoreImage
import Metal
import SceneKit
import RoomPlan
import UIKit

/// Delivers original-orientation RGB and C2W. No screen-orientation rotation or crop.
final class HardwareCaptureSource: NSObject, ARSessionDelegate, RoomCaptureSessionDelegate {
    let session = ARSession()
    var onSample: ((CameraSample) -> Void)?
    var onState: ((String, Bool) -> Void)?
    var onInterruption: ((String) -> Void)?
    var onGuidance: ((GuideDecision, GuideSummary, [GuidePatch], SIMD3<Double>?) -> Void)?
    var onLayout: (([GuideSurface]) -> Void)?
    var onImageSize: ((Int, Int) -> Void)?
    let guidance = CaptureGuidance()
    private var roomCapture: RoomCaptureSession?
    private var lastLayoutTime = -Double.infinity
    private var lastPose: simd_float4x4?
    private var lastPoseTime: Double?
    private var speed = 0.0, angularSpeed = 0.0
    private var guideSurfaces: [GuideSurface] = []
    var recording = false { didSet { if oldValue != recording { generation = UUID() } } }
    private var generation = UUID()
    private let queue = DispatchQueue(label: "memoryroom.camera", qos: .userInitiated)
    private let context = CIContext(options: [.cacheIntermediates: false])
    private var lastTimestamp = -Double.infinity
    private var busy = false
    private var imageSize: (Int, Int)?

    func start() {
        guidance.reset(phase:.room); lastPose = nil; lastPoseTime = nil; lastTimestamp = -Double.infinity
        guideSurfaces = []; lastLayoutTime = -Double.infinity; speed = 0; angularSpeed = 0
        guard ARWorldTrackingConfiguration.isSupported else {
            onState?("此设备不支持 AR 世界跟踪，请使用演练模式。", false); return
        }
        AVCaptureDevice.requestAccess(for: .video) { [weak self] granted in
            DispatchQueue.main.async {
                guard let self = self else { return }
                guard granted else { self.onState?("未获得相机权限，请在系统设置中为此应用开启相机。", false); return }
                self.session.delegate = self
                self.session.delegateQueue = .main
                let config = ARWorldTrackingConfiguration()
                config.worldAlignment = .gravity
                if ARWorldTrackingConfiguration.supportsFrameSemantics(.sceneDepth) { config.frameSemantics.insert(.sceneDepth) }
                self.session.run(config, options: [.resetTracking, .removeExistingAnchors])
                if RoomCaptureSession.isSupported {
                    let room = RoomCaptureSession(arSession:self.session)
                    room.delegate = self; self.roomCapture = room
                    var configuration = RoomCaptureSession.Configuration(); configuration.isCoachingEnabled = true
                    room.run(configuration:configuration)
                }
                self.onState?("移动手机，等待跟踪稳定…", false)
            }
        }
    }
    func pause() { recording = false; roomCapture?.stop(pauseARSession:false); roomCapture = nil; session.pause() }
    func beginPhase(_ phase: CapturePhase) {
        recording = false
        if phase != .room { roomCapture?.stop(pauseARSession:false); roomCapture = nil }
        guidance.reset(phase:phase)
    }
    func session(_ session: ARSession, didUpdate frame: ARFrame) {
        let state: String, normal: Bool
        switch frame.camera.trackingState {
        case .normal: state = "跟踪稳定 · 可以记录"; normal = true
        case .notAvailable: state = "跟踪不可用"; normal = false
        case .limited(let reason):
            normal = false
            switch reason {
            case .excessiveMotion: state = "移动过快，请放慢速度"
            case .insufficientFeatures: state = "纹理不足，请对准有细节且光线充足的区域"
            case .relocalizing: state = "正在重新定位，请保持手机稳定"
            default: state = "正在初始化跟踪"
            }
        }
        onState?(state, normal)
        if let previous = lastPose, let time = lastPoseTime {
            let dt = frame.timestamp-time
            if dt > 0 && dt < 0.5 {
                let a = previous.columns.3, b = frame.camera.transform.columns.3
                speed = speed*0.7 + Double(simd_length(SIMD3(b.x-a.x,b.y-a.y,b.z-a.z)))/dt*0.3
                let rotation = simd_quatf(previous).inverse * simd_quatf(frame.camera.transform)
                let angle = 2*acos(min(1,abs(Double(rotation.real))))
                angularSpeed = angularSpeed*0.7 + angle/dt*0.3
            }
        }
        lastPose = frame.camera.transform; lastPoseTime = frame.timestamp
        guard !busy && frame.timestamp - lastTimestamp >= 0.25 else { return }
        busy = true; lastTimestamp = frame.timestamp
        // One in-flight frame prevents retaining a backlog of ARFrame buffers.
        let pixelBuffer = frame.capturedImage
        let k = frame.camera.intrinsics
        let w = CVPixelBufferGetWidth(pixelBuffer), h = CVPixelBufferGetHeight(pixelBuffer)
        if imageSize?.0 != w || imageSize?.1 != h { imageSize = (w,h); onImageSize?(w,h) }
        let intr = Intrinsics(w: w, h: h, fl_x: Double(k[0][0]), fl_y: Double(k[1][1]), cx: Double(k[2][0]), cy: Double(k[2][1]))
        let transform = rowMajor(frame.camera.transform), timestamp = frame.timestamp, generation = self.generation
        let depthMap = frame.sceneDepth?.depthMap
        let confidenceMap = frame.sceneDepth?.confidenceMap
        let currentSpeed = speed, currentAngularSpeed = angularSpeed
        let exposure = frame.camera.exposureDuration
        queue.async { [weak self] in
            guard let self = self else { return }
            autoreleasepool {
                let image = CIImage(cvPixelBuffer: pixelBuffer)
                var mean = 0.0, clipped = 0.0, edgeEnergy = 0.0
                CVPixelBufferLockBaseAddress(pixelBuffer,.readOnly)
                if let base = CVPixelBufferGetBaseAddressOfPlane(pixelBuffer,0) {
                    let stride = CVPixelBufferGetBytesPerRowOfPlane(pixelBuffer,0)
                    let p = base.assumingMemoryBound(to:UInt8.self)
                    var count = 0
                    for y in Swift.stride(from:8,to:h-8,by:12) { for x in Swift.stride(from:8,to:w-8,by:12) {
                        let value = Double(p[y*stride+x]); mean += value/255
                        if value >= 248 { clipped += 1 }
                        let lap = Double(p[y*stride+x-4])+Double(p[y*stride+x+4])+Double(p[(y-4)*stride+x])+Double(p[(y+4)*stride+x])-4*value
                        edgeEnergy += lap*lap; count += 1
                    }}
                    if count > 0 { mean /= Double(count); clipped /= Double(count); edgeEnergy /= Double(count) }
                }
                CVPixelBufferUnlockBaseAddress(pixelBuffer,.readOnly)
                guard let cg = self.context.createCGImage(image, from: image.extent),
                      let jpeg = UIImage(cgImage: cg).jpegData(compressionQuality: 0.95) else {
                    DispatchQueue.main.async { self.busy = false; self.onInterruption?("图像编码失败，请结束本次采集并检查可用空间。") }; return
                }
                var sample = CameraSample(jpeg: jpeg, timestamp: timestamp, intrinsics: intr, transform: transform)
                var guideDepth = [Float](repeating: .nan,count:64*48)
                var validDepth = 0, centerDepth: [Float] = []
                if let depthMap = depthMap {
                    CVPixelBufferLockBaseAddress(depthMap, .readOnly)
                    let dw = CVPixelBufferGetWidth(depthMap), dh = CVPixelBufferGetHeight(depthMap)
                    let stride = CVPixelBufferGetBytesPerRow(depthMap)
                    if let confidenceMap = confidenceMap { CVPixelBufferLockBaseAddress(confidenceMap,.readOnly) }
                    if let base = CVPixelBufferGetBaseAddress(depthMap) {
                        var data = Data(capacity: dw * dh * 4)
                        for row in 0..<dh { data.append(base.advanced(by: row * stride).assumingMemoryBound(to: UInt8.self), count: dw * 4) }
                        sample.depth = data
                        let sx = Double(dw) / Double(w), sy = Double(dh) / Double(h)
                        sample.depthIntrinsics = Intrinsics(w: dw, h: dh, fl_x: intr.fl_x * sx, fl_y: intr.fl_y * sy, cx: intr.cx * sx, cy: intr.cy * sy)
                        for y in 0..<48 { for x in 0..<64 {
                            let px = min(dw-1,x*dw/64), py = min(dh-1,y*dh/48)
                            let z = base.advanced(by:py*stride).assumingMemoryBound(to:Float.self)[px]
                            var confident = true
                            if let confidenceMap = confidenceMap, let cp = CVPixelBufferGetBaseAddress(confidenceMap) {
                                confident = cp.assumingMemoryBound(to:UInt8.self)[py*CVPixelBufferGetBytesPerRow(confidenceMap)+px] >= 1
                            }
                            if confident && z.isFinite && z >= 0.25 && z <= 4.5 {
                                guideDepth[y*64+x] = z; validDepth += 1
                                if (24..<40).contains(x) && (18..<30).contains(y) { centerDepth.append(z) }
                            }
                        }}
                    }
                    if let confidenceMap = confidenceMap { CVPixelBufferUnlockBaseAddress(confidenceMap,.readOnly) }
                    CVPixelBufferUnlockBaseAddress(depthMap, .readOnly)
                }
                centerDepth.sort()
                let distance = centerDepth.isEmpty ? 2.0 : Double(centerDepth[centerDepth.count/2])
                let view = GuideView(time:timestamp,pose:guideMatrix(transform),intrinsics:intr,
                                     depth:guideDepth,depthWidth:64,depthHeight:48)
                let input = GuideInput(view:view,tracking:normal,speed:currentSpeed,angularSpeed:currentAngularSpeed,
                                       exposure:exposure,brightness:mean,clipped:clipped,edgeEnergy:edgeEnergy,
                                       depthValid:Double(validDepth)/Double(64*48),distance:distance,hasDepth:depthMap != nil)
                DispatchQueue.main.async {
                    self.busy = false
                    guard self.generation == generation else { return }
                    let decision = self.guidance.evaluate(input,recording:self.recording)
                    self.onGuidance?(decision,self.guidance.summary(),self.guidance.patches,self.guidance.target)
                    if decision.accept { sample.quality = decision.quality; self.onSample?(sample) }
                }
            }
        }
    }
    func sessionWasInterrupted(_ session: ARSession) { onInterruption?("AR 跟踪被中断。本次已记录内容已保留；请结束并新建采集，避免把不同坐标混在一起。") }
    func session(_ session: ARSession, didFailWithError error: Error) { onInterruption?("AR 会话失败：\(error.localizedDescription)") }
    func captureSession(_ session: RoomCaptureSession, didUpdate room: CapturedRoom) { if session === roomCapture { updateRoom(room) } }
    func captureSession(_ room: RoomCaptureSession, didStartWith configuration: RoomCaptureSession.Configuration) {
        DispatchQueue.main.async {
            guard room === self.roomCapture,
                  ARWorldTrackingConfiguration.supportsFrameSemantics(.sceneDepth),
                  let config = self.session.configuration as? ARWorldTrackingConfiguration,
                  !config.frameSemantics.contains(.sceneDepth) else { return }
            // RoomPlan may supply its own configuration. Preserve the same AR
            // world and enable the public depth stream needed by our recorder.
            config.frameSemantics.insert(.sceneDepth)
            self.session.run(config)
        }
    }
    func captureSession(_ session: RoomCaptureSession, didAdd room: CapturedRoom) { if session === roomCapture { updateRoom(room) } }
    func captureSession(_ session: RoomCaptureSession, didChange room: CapturedRoom) { if session === roomCapture { updateRoom(room) } }
    private func updateRoom(_ room: CapturedRoom) {
        DispatchQueue.main.async {
            guard self.guidance.phase == .room, Date.timeIntervalSinceReferenceDate-self.lastLayoutTime > 3 else { return }
            self.lastLayoutTime = Date.timeIntervalSinceReferenceDate
            self.guideSurfaces = (room.walls+room.floors).map { s in
                GuideSurface(id:s.identifier.uuidString,kind:s.category == .wall ? "wall" : "floor",
                             transform:rowMajor(s.transform),width:Double(s.dimensions.x),height:Double(s.dimensions.y))
            }
            self.guidance.updateSurfaces(self.guideSurfaces); self.onLayout?(self.guideSurfaces)
        }
    }
    func captureSession(_ session: RoomCaptureSession, didProvide instruction: RoomCaptureSession.Instruction) {
        // RoomPlan's native feedback complements our image and coverage checks.
        let text: String
        switch instruction {
        case .moveCloseToWall: text = "靠近这面墙一些，把墙角和地面一起拍到。"
        case .moveAwayFromWall: text = "离墙太近，后退一点。"
        case .slowDown: text = "移动过快，请小步慢走。"
        case .turnOnLight: text = "房间光线不足，请先开灯。"
        case .lowTexture: text = "别只拍白墙，让门框或家具边角入镜。"
        case .normal: return
        @unknown default: return
        }
        DispatchQueue.main.async { self.onState?(text,true) }
    }
    func captureSession(_ session: RoomCaptureSession, didEndWith data: CapturedRoomData, error: Error?) {
        guard session === roomCapture else { return }
        if let error = error { DispatchQueue.main.async { self.onInterruption?("房间结构识别中断：\(error.localizedDescription)") } }
    }
}

/// Original synthetic scene. These are rendered test images, never real camera frames.
final class DemoCaptureSource {
    private let scene = SCNScene()
    private let camera = SCNNode()
    private let book = SCNNode()
    private let renderer: SCNRenderer
    private var index = 0
    init() {
        renderer = SCNRenderer(device: MTLCreateSystemDefaultDevice(), options: nil)
        scene.background.contents = UIColor(red: 0.9, green: 0.92, blue: 0.85, alpha: 1)
        func box(_ size: SCNVector3, _ p: SCNVector3, _ color: UIColor) -> SCNNode {
            let node = SCNNode(geometry: SCNBox(width: CGFloat(size.x), height: CGFloat(size.y), length: CGFloat(size.z), chamferRadius: 0.005))
            node.geometry?.firstMaterial?.diffuse.contents = color
            node.position = p; scene.rootNode.addChildNode(node); return node
        }
        _ = box(SCNVector3(4,0.04,4), SCNVector3(0,-0.03,0), UIColor(red:0.68,green:0.54,blue:0.38,alpha:1))
        _ = box(SCNVector3(1.5,0.07,0.8), SCNVector3(0,0.7,0), UIColor(red:0.66,green:0.47,blue:0.29,alpha:1))
        for x in [Float(-0.6),0.6] { for z in [Float(-0.3),0.3] {
            _ = box(SCNVector3(0.05,0.66,0.05), SCNVector3(x,0.34,z), .brown)
        }}
        book.geometry = SCNBox(width:0.24,height:0.05,length:0.34,chamferRadius:0.004)
        book.geometry?.firstMaterial?.diffuse.contents = UIColor(red:0.17,green:0.38,blue:0.27,alpha:1)
        book.position = SCNVector3(0.12,0.76,0.02); scene.rootNode.addChildNode(book)
        for i in 0..<8 {
            let stripe = box(SCNVector3(0.006,0.003,0.32), SCNVector3(0,0,0), .systemYellow)
            book.addChildNode(stripe); stripe.position = SCNVector3(-0.085 + Float(i)*0.025,0.027,0)
        }
        let ambient = SCNNode(); ambient.light = SCNLight(); ambient.light?.type = .ambient; ambient.light?.intensity = 700; scene.rootNode.addChildNode(ambient)
        let sun = SCNNode(); sun.light = SCNLight(); sun.light?.type = .omni; sun.light?.intensity = 1100; sun.position = SCNVector3(-2,4,3); scene.rootNode.addChildNode(sun)
        camera.camera = SCNCamera(); camera.camera?.fieldOfView = 55; camera.camera?.projectionDirection = .vertical
        camera.camera?.zNear = 0.02; camera.camera?.zFar = 30; scene.rootNode.addChildNode(camera)
        renderer.scene = scene; renderer.pointOfView = camera
    }
    func sample(phase: CapturePhase) throws -> CameraSample {
        let angle = Float(index) * 0.1
        let isObject = phase == .object
        book.isHidden = phase == .empty
        let radius: Float = isObject ? 0.65 : 2.2
        camera.position = SCNVector3(sin(angle)*radius, isObject ? 1.0 : 1.55, cos(angle)*radius)
        camera.look(at: SCNVector3(0.12, isObject ? 0.76 : 0.55, 0.02))
        let image = renderer.snapshot(atTime: Double(index)/5, with: CGSize(width:640,height:480), antialiasingMode:.multisampling4X)
        guard let jpeg = image.jpegData(compressionQuality:0.9) else { throw CaptureFailure.message("演练图像生成失败") }
        let fy = 480.0 / (2 * tan(55 * .pi / 360))
        let result = CameraSample(jpeg:jpeg, timestamp:Double(index)/5,
                                 intrinsics:Intrinsics(w:640,h:480,fl_x:fy,fl_y:fy,cx:320,cy:240), transform:rowMajor(camera.simdWorldTransform))
        index += 1; return result
    }
}
