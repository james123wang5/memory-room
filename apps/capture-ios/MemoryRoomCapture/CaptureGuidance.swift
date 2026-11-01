import Foundation
import simd

// Coverage records accepted camera observations, not reconstruction quality.
struct GuideSurface: Codable, Equatable {
    var id: String
    var kind: String
    var transform: [[Double]]
    var width: Double
    var height: Double
}
struct GuidePatch: Identifiable {
    let id: String
    let position: SIMD3<Double>
    let surface: String
    var normal = SIMD3<Double>(0, 0, 1)
    var size = 0.18
    var currentlyVisible = false
    var observations = 0
    var baseline = false
    var firstCamera: SIMD3<Double>?
    var firstDirection: SIMD3<Double>?
    var hiddenObservations = 0
    var hiddenCamera: SIMD3<Double>?
    var hiddenBaseline = false
    var ready: Bool { observations >= 3 && baseline }
    var occluded: Bool { observations == 0 && hiddenObservations >= 3 && hiddenBaseline }
}
struct GuideView {
    var time: Double
    var pose: simd_double4x4
    var intrinsics: Intrinsics
    var depth: [Float]
    var depthWidth: Int
    var depthHeight: Int
    var run = 0
}
struct FrameQuality: Codable {
    var speed_mps: Double
    var angular_speed_rps: Double
    var predicted_blur_pixels: Double
    var brightness: Double
    var clipped_fraction: Double
    var edge_energy: Double
    var overlap: Double
    var depth_valid_fraction: Double
    var capture_run: Int? = nil
    var matched_run: Int? = nil
    var continuity: String? = nil
}
struct GuideInput {
    var view: GuideView
    var tracking: Bool
    var speed: Double
    var angularSpeed: Double
    var exposure: Double
    var brightness: Double
    var clipped: Double
    var edgeEnergy: Double
    var depthValid: Double
    var distance: Double
    var hasDepth = true
}
struct GuideSummary: Codable {
    var version = 1
    var phase: String
    var accepted_frames: Int
    var rejected_frames: Int
    var walls: Int
    var floor_detected: Bool
    var observed_patches: Int
    var occluded_patches: Int = 0
    var multiview_patches: Int
    var multiview_fraction: Double
    var heading_bins: Int
    var object_orbit_bins: Int
    var path_meters: Double
    var loop_distance_meters: Double?
    var gate_passed: Bool
    var issues: [String]
    var surface_patches: Int? = nil
    var surface_ready: Int? = nil
    var surface_pending: Int? = nil
    var coverage_limit_reached: Bool? = nil
    var object_directions: [Int]? = nil
    var object_heights: [String]? = nil
    var room_view_counts: [String: Int]? = nil
    var room_side_counts: [String: Int]? = nil
    var capture_run_count: Int? = nil
    var estimated_components: Int? = nil
    var region_connections: [[Int]]? = nil
    var waiting_for_region: Bool? = nil
    var visible_patches: Int? = nil
    var visible_ready: Int? = nil
    var policy = "experimental-v1; capture checks do not guarantee reconstruction quality"
}
struct GuideDecision {
    var accept: Bool
    var title: String
    var detail: String
    var quality: FrameQuality
}

func guideMatrix(_ rows: [[Double]]) -> simd_double4x4 {
    simd_double4x4(columns: (SIMD4(rows[0][0], rows[1][0], rows[2][0], rows[3][0]),
                            SIMD4(rows[0][1], rows[1][1], rows[2][1], rows[3][1]),
                            SIMD4(rows[0][2], rows[1][2], rows[2][2], rows[3][2]),
                            SIMD4(rows[0][3], rows[1][3], rows[2][3], rows[3][3])))
}
func guidePosition(_ pose: simd_double4x4) -> SIMD3<Double> { SIMD3(pose.columns.3.x, pose.columns.3.y, pose.columns.3.z) }
func guideForward(_ pose: simd_double4x4) -> SIMD3<Double> { -SIMD3(pose.columns.2.x, pose.columns.2.y, pose.columns.2.z) }

final class CaptureGuidance {
    var scope: CaptureScope = .room
    private(set) var phase: CapturePhase = .room
    private(set) var surfaces: [GuideSurface] = []
    private(set) var patches: [GuidePatch] = []
    private(set) var accepted = 0
    private(set) var rejected = 0
    private(set) var distance = 0.0
    private var headings = Set<Int>()
    private var orbit = Set<Int>()
    private var views: [GuideView] = []
    private var last: GuideView?
    private var first: SIMD3<Double>?
    private var objectCenter: SIMD3<Double>?
    private var live: GuideView?
    private var targetID: String?
    private var heightBands = Set<String>()
    private var firstObjectHeight: Double?
    private var roomStart: GuideView?
    private var roomViews = [String: Int]()
    private var roomSides = [String: Int]()
    private let surfaceLimit = 12000
    private var anchors: [GuideView] = []
    private var anchorCursor = 0
    private var run = 0
    private var connections = Set<String>()
    private var pendingRegion = false
    private var regionCandidate: GuideView?
    private var waitingForRegion = false

    // Keeps the same AR world and all saved coverage. Only the image-continuity
    // chain is restarted; this is not relocalization or a new coordinate system.
    func continueFromHere() {
        pendingRegion = true; regionCandidate = nil; targetID = nil
    }
    private func connect(_ a: Int, _ b: Int) {
        if a != b { connections.insert("\(min(a,b)):\(max(a,b))") }
    }
    private var edges: [[Int]] { connections.sorted().map { $0.split(separator:":").compactMap { Int($0) } } }
    private var componentCount: Int {
        var reached = Set<Int>(), components = 0
        for start in 0...run where !reached.contains(start) {
            components += 1; var queue = [start]; reached.insert(start)
            while let next = queue.popLast() {
                for edge in edges where edge.contains(next) {
                    for other in edge where !reached.contains(other) { reached.insert(other); queue.append(other) }
                }
            }
        }
        return accepted == 0 ? 0 : components
    }
    var target: SIMD3<Double>? {
        let candidates = patches.filter { !$0.ready && !$0.occluded && $0.currentlyVisible }
        if let current = candidates.first(where: { $0.id == targetID }) { return current.position }
        guard let view = live else { return nil }
        let camera = guidePosition(view.pose), forward = guideForward(view.pose)
        let next = candidates.min { a, b in
            func score(_ patch: GuidePatch) -> Double {
                let offset = patch.position-camera
                let alignment = simd_dot(simd_normalize(offset), forward)
                return simd_length(offset) + (1-alignment)*3 + (patch.observations == 0 ? 0 : 0.3)
            }
            return score(a) < score(b)
        }
        targetID = next?.id
        return next?.position
    }

    func reset(phase: CapturePhase) {
        self.phase = phase; accepted = 0; rejected = 0; distance = 0
        headings.removeAll(); orbit.removeAll(); views.removeAll(); last = nil; first = nil; objectCenter = nil
        surfaces.removeAll(); patches.removeAll(); live = nil; targetID = nil
        heightBands.removeAll(); firstObjectHeight = nil
        roomStart = nil; roomViews.removeAll(); roomSides.removeAll()
        anchors.removeAll(); anchorCursor = 0; run = 0; connections.removeAll()
        pendingRegion = false; regionCandidate = nil; waitingForRegion = false
    }
    func updateSurfaces(_ surfaces: [GuideSurface]) {
        guard phase == .room else { return }
        if self.surfaces == surfaces { return }
        self.surfaces = surfaces
        // Rebuild against current RoomPlan geometry: old wall estimates may move.
        var next: [GuidePatch] = []
        for (index, s) in surfaces.enumerated() {
            let nx = min(20, max(1, Int(ceil(s.width / 0.5))))
            let ny = min(12, max(1, Int(ceil(s.height / 0.5))))
            let pose = guideMatrix(s.transform)
            for y in 0..<ny { for x in 0..<nx {
                let local = SIMD4((Double(x)+0.5)/Double(nx)*s.width-s.width/2,
                                  (Double(y)+0.5)/Double(ny)*s.height-s.height/2, 0.0, 1.0)
                let p = pose * local
                next.append(GuidePatch(id:"\(s.id):\(x):\(y)", position:SIMD3(p.x,p.y,p.z), surface:"\(s.kind == "wall" ? "墙面" : "地面") \(index+1)", normal:SIMD3(pose.columns.2.x,pose.columns.2.y,pose.columns.2.z), size:max(0.05,min(s.width/Double(nx),s.height/Double(ny))*0.95)))
            }}
        }
        let measured = patches.filter { $0.id.hasPrefix("depth:") }
        let previous = Dictionary(uniqueKeysWithValues:patches.map { ($0.id,$0) })
        var retained: [GuidePatch] = [], fresh: [GuidePatch] = []
        for var patch in next {
            if let old = previous[patch.id], simd_distance(old.position,patch.position) < 0.12,
               simd_dot(old.normal,patch.normal) > 0.96 {
                patch.observations = old.observations; patch.baseline = old.baseline
                patch.firstCamera = old.firstCamera; patch.firstDirection = old.firstDirection
                patch.hiddenObservations = old.hiddenObservations; patch.hiddenCamera = old.hiddenCamera
                patch.hiddenBaseline = old.hiddenBaseline; retained.append(patch)
            } else { fresh.append(patch) }
        }
        // Replay only genuinely new cells. Replaying every update would count the
        // same photographs repeatedly and erase completed old walls.
        patches = fresh
        for view in views { observe(view) }
        patches.append(contentsOf:retained); patches.append(contentsOf:measured)
        if let live = live { updateVisibility(live) }
    }
    private func depthAt(_ view: GuideView, u: Double, v: Double) -> Double? {
        guard view.depthWidth > 0, view.depthHeight > 0, !view.depth.isEmpty,
              u >= 0, v >= 0, u < Double(view.intrinsics.w), v < Double(view.intrinsics.h) else { return nil }
        let x = min(view.depthWidth-1, Int(u / Double(view.intrinsics.w) * Double(view.depthWidth)))
        let y = min(view.depthHeight-1, Int(v / Double(view.intrinsics.h) * Double(view.depthHeight)))
        let z = Double(view.depth[y * view.depthWidth + x])
        return z.isFinite && z >= 0.25 && z <= 4.5 ? z : nil
    }
    private func visible(_ point: SIMD3<Double>, in view: GuideView, inverse: simd_double4x4? = nil) -> Bool {
        let q = (inverse ?? view.pose.inverse) * SIMD4(point.x,point.y,point.z,1)
        let z = -q.z
        guard z >= 0.4, z <= 4.0 else { return false }
        let k = view.intrinsics, u = k.fl_x*q.x/z+k.cx, v = -k.fl_y*q.y/z+k.cy
        guard u > Double(k.w)*0.06, u < Double(k.w)*0.94,
              v > Double(k.h)*0.06, v < Double(k.h)*0.94,
              let d = depthAt(view,u:u,v:v) else { return false }
        // Depth agreement prevents painting a wall green through a foreground object.
        return abs(d-z) <= max(0.12, z*0.05)
    }
    private func observe(_ view: GuideView) {
        let camera = guidePosition(view.pose)
        let inverse = view.pose.inverse
        for i in patches.indices where !patches[i].ready {
            let point = patches[i].position
            let local = inverse * SIMD4(point.x,point.y,point.z,1)
            let z = -local.z, k = view.intrinsics
            if z >= 0.4 && z <= 4 {
                let u = k.fl_x*local.x/z+k.cx, v = -k.fl_y*local.y/z+k.cy
                if let d = depthAt(view,u:u,v:v), d < z-max(0.2,z*0.07) {
                    patches[i].hiddenObservations += 1
                    if let previous = patches[i].hiddenCamera {
                        if simd_distance(camera,previous) >= 0.2 { patches[i].hiddenBaseline = true }
                    } else { patches[i].hiddenCamera = camera }
                }
            }
            guard visible(point,in:view,inverse:inverse) else { continue }
            patches[i].observations += 1
            let direction = simd_normalize(camera-point)
            if let oldCamera = patches[i].firstCamera, let oldDirection = patches[i].firstDirection {
                let angle = acos(max(-1.0,min(1.0,simd_dot(direction,oldDirection))))
                if simd_distance(camera,oldCamera) >= 0.2 && angle >= 0.14 { patches[i].baseline = true }
            } else { patches[i].firstCamera = camera; patches[i].firstDirection = direction }
        }
    }
    // Sample actual surfaces (desks, furniture, objects), independently of RoomPlan.
    // Each world voxel is counted at most once per accepted view.
    private func addSurfacePatches(_ view: GuideView) {
        guard view.depthWidth > 4, view.depthHeight > 4 else { return }
        var keys = Set(patches.map(\.id))
        var count = patches.filter { $0.id.hasPrefix("depth:") }.count
        let k = view.intrinsics
        func point(_ x: Int, _ y: Int) -> SIMD3<Double>? {
            let u = (Double(x)+0.5)/Double(view.depthWidth)*Double(k.w)
            let v = (Double(y)+0.5)/Double(view.depthHeight)*Double(k.h)
            guard let z = depthAt(view,u:u,v:v), z <= 4 else { return nil }
            let p = view.pose * SIMD4((u-k.cx)*z/k.fl_x, -(v-k.cy)*z/k.fl_y, -z, 1)
            return SIMD3(p.x,p.y,p.z)
        }
        for y in stride(from:2,to:view.depthHeight-2,by:4) {
            for x in stride(from:2,to:view.depthWidth-2,by:4) {
                guard count < surfaceLimit, let p = point(x,y), let a = point(x+1,y), let b = point(x,y+1),
                      simd_distance(a,p) < 0.18, simd_distance(b,p) < 0.18 else { continue }
                let cross = simd_cross(a-p,b-p)
                guard simd_length(cross) > 0.000001 else { continue }
                var normal = simd_normalize(cross)
                if simd_dot(normal,guidePosition(view.pose)-p) < 0 { normal = -normal }
                let axis = abs(normal.x) > abs(normal.y) ? (abs(normal.x) > abs(normal.z) ? 0 : 2) : (abs(normal.y) > abs(normal.z) ? 1 : 2)
                let id = "depth:\(Int(floor(p.x/0.18))):\(Int(floor(p.y/0.18))):\(Int(floor(p.z/0.18))):\(axis):\(normal[axis] >= 0 ? 1 : -1)"
                if keys.insert(id).inserted {
                    patches.append(GuidePatch(id:id,position:p,surface:"实际表面",normal:normal))
                    count += 1
                }
            }
        }
    }
    private func updateVisibility(_ view: GuideView) {
        let inverse = view.pose.inverse
        for i in patches.indices { patches[i].currentlyVisible = visible(patches[i].position,in:view,inverse:inverse) }
    }
    private func overlap(_ current: GuideView, _ previous: GuideView) -> Double {
        guard current.depthWidth > 0, current.depthHeight > 0 else { return 0 }
        var total = 0, matched = 0
        let k = current.intrinsics, inverse = previous.pose.inverse
        for y in stride(from:3,to:current.depthHeight-3,by:6) {
            for x in stride(from:3,to:current.depthWidth-3,by:6) {
                let u = (Double(x)+0.5)/Double(current.depthWidth)*Double(k.w)
                let v = (Double(y)+0.5)/Double(current.depthHeight)*Double(k.h)
                guard let z = depthAt(current,u:u,v:v) else { continue }
                let p = current.pose * SIMD4((u-k.cx)*z/k.fl_x, -(v-k.cy)*z/k.fl_y, -z, 1)
                total += 1
                if visible(SIMD3(p.x,p.y,p.z),in:previous,inverse:inverse) { matched += 1 }
            }
        }
        return total > 0 ? Double(matched)/Double(total) : 0
    }
    private func reference(for view: GuideView) -> (fraction:Double, previousFraction:Double, view:GuideView?, linkedRuns:[Int]) {
        guard let last = last else { return (1,1,nil,[]) }
        let previousFraction = overlap(view,last)
        var best = (fraction:previousFraction, previousFraction:previousFraction, view:Optional(last), linkedRuns:[Int]())
        if best.fraction >= 0.50 { best.linkedRuns.append(last.run) }
        let needsBridge = componentCount > 1
        if phase != .room || (best.fraction >= 0.65 && !needsBridge) { return best }
        let camera = guidePosition(view.pose), forward = guideForward(view.pose)
        let nearby = anchors.filter { abs($0.time-last.time) > 0.001 &&
            simd_distance(camera,guidePosition($0.pose)) < 4 && simd_dot(forward,guideForward($0.pose)) > 0.2
        }.sorted { a,b in
            func score(_ v:GuideView) -> Double {
                simd_distance(camera,guidePosition(v.pose)) + 2*(1-simd_dot(forward,guideForward(v.pose)))
            }
            return score(a) < score(b)
        }
        let candidates = needsBridge ? Array(nearby.filter { $0.run != run }.prefix(8)) + Array(nearby.filter { $0.run == run }.prefix(4)) : Array(nearby.prefix(10))
        for old in candidates {
            let fraction = overlap(view,old)
            if fraction >= 0.50 { best.linkedRuns.append(old.run) }
            if fraction > best.fraction { best.fraction = fraction; best.view = old }
            if best.fraction >= 0.75 && !needsBridge { break }
        }
        return best
    }
    func evaluate(_ input: GuideInput, recording: Bool) -> GuideDecision {
        var view = input.view
        let position = guidePosition(view.pose)
        live = view; waitingForRegion = false
        let match = reference(for:view), overlapValue = match.fraction
        let blur = view.intrinsics.fl_x * (input.angularSpeed + input.speed/max(0.4,input.distance)) * input.exposure
        var quality = FrameQuality(speed_mps:input.speed,angular_speed_rps:input.angularSpeed,
                                   predicted_blur_pixels:blur,brightness:input.brightness,clipped_fraction:input.clipped,
                                   edge_energy:input.edgeEnergy,overlap:overlapValue,depth_valid_fraction:input.depthValid)
        var title = "画面可记录", detail = "保持这个速度，横向移动，换角度覆盖同一片表面。", valid = true
        if !input.tracking { title = "先让跟踪稳定"; detail = "对准门框或家具边角，缓慢移动手机。"; valid = false }
        else if !input.hasDepth { title = "等待 LiDAR 深度"; detail = "先对准普通墙面和家具。如果一直没有深度，请保留本次记录并反馈，不要反复盲扫。"; valid = false }
        else if input.speed > 0.55 || input.angularSpeed > 0.8 || blur > 5 {
            title = "慢一点，画面会糊"; detail = "暂停快走和甩动，稳住后小步移动；这张不会计入。"; valid = false
        } else if input.brightness < 0.12 { title = "这里太暗"; detail = "先开灯，再回到这块区域补扫。"; valid = false }
        else if input.clipped > 0.28 { title = "亮部丢失太多"; detail = "避开直射窗户和灯，转向室内，让曝光稳定。"; valid = false }
        else if input.depthValid < 0.45 { title = "距离或表面不合适"; detail = "退开近距离物体，避开镜面，让正常墙面和家具进入画面。"; valid = false }
        else if input.edgeEnergy < 12 { title = "画面缺少可识别细节"; detail = "不要只对着白墙，让门框、墙角或家具同时入镜。"; valid = false }
        if !valid { regionCandidate = nil }
        var newRegion = false
        if valid && last != nil && (pendingRegion || match.previousFraction < 0.50) {
            if phase == .room {
                if pendingRegion {
                    newRegion = true; title = "从这里开始新片段"; detail = "旧照片和覆盖保留。稍后拍到两边共同的墙角或家具，帮助电脑连接。"
                } else if overlapValue >= 0.50 {
                    newRegion = true; title = "接上之前拍过的区域"; detail = "已经找到相近的旧视角，继续拍摄即可；不用回到上一张照片的位置。"
                } else {
                    waitingForRegion = true
                    if let candidate = regionCandidate,
                       simd_distance(position,guidePosition(candidate.pose)) < 0.18,
                       simd_dot(guideForward(view.pose),guideForward(candidate.pose)) > 0.97,
                       input.speed < 0.18 && input.angularSpeed < 0.25 {
                        if view.time-candidate.time >= 1.5 {
                            newRegion = true; title = "新区域开始记录"; detail = "旧区域已保留；不用找回原机位。之后补一段连接两边的视角。"
                        } else {
                            valid = false; title = "正在接上新区域"; detail = "稳住手机约两秒就会继续记录，也可以点“从这里继续”。"
                        }
                    } else {
                        regionCandidate = view; valid = false; title = "可以从新区域继续"; detail = "不用退回原机位。稳住手机约两秒，或点“从这里继续”；之后补拍连接处。"
                    }
                }
            } else {
                valid = false; title = "物品视角衔接不足"; detail = "把同一件物品和周围边角一起拍进来；不要移动物品。需要换对象时结束本阶段。"
            }
        } else if valid { regionCandidate = nil }
        if valid && !newRegion, let old = last {
            let angle = acos(max(-1,min(1,simd_dot(guideForward(view.pose),guideForward(old.pose)))))
            if simd_distance(position,guidePosition(old.pose)) < 0.06 && angle < 0.09 {
                title = "这个位置已经记录"; detail = "横向挪一小步，别只站在原地转手机。"; valid = false
            }
        }
        // Discover visible surfaces even before their first accepted photograph.
        // Discovery is red; only accepted views below can change coverage to green.
        if input.tracking && input.hasDepth && input.speed < 0.55 && input.angularSpeed < 0.8 { addSurfacePatches(view) }
        if recording && valid {
            if newRegion { run += 1; regionCandidate = nil; waitingForRegion = false }
            view.run = run
            for matchedRun in match.linkedRuns { connect(run,matchedRun) }
            quality.capture_run = run; quality.matched_run = overlapValue >= 0.50 ? match.view?.run : nil
            quality.continuity = newRegion ? (pendingRegion ? "manual-new-region" : overlapValue >= 0.50 ? "rejoined-region" : "automatic-new-region") : "connected"
            pendingRegion = false
            if !newRegion, let old = last { distance += simd_distance(position,guidePosition(old.pose)) }
            if first == nil { first = position }
            let forward = guideForward(view.pose)
            let heading = atan2(forward.x,forward.z)+Double.pi
            headings.insert(min(7,Int(heading/(2*Double.pi)*8)))
            if phase == .object {
                if firstObjectHeight == nil { firstObjectHeight = position.y }
                let height = position.y-(firstObjectHeight ?? position.y)
                heightBands.insert(height > 0.2 ? "高处" : height < -0.2 ? "低处" : "起始高度")
                if objectCenter == nil, let z = depthAt(view,u:view.intrinsics.cx,v:view.intrinsics.cy) {
                    objectCenter = position + forward*z
                }
                if let center = objectCenter {
                    let delta = position-center, angle = atan2(delta.x,delta.z)+Double.pi
                    orbit.insert(min(11,Int(angle/(2*Double.pi)*12)))
                }
            }
            if phase == .room {
                if roomStart == nil { roomStart = view }
                if let start = roomStart {
                    let difference = position-guidePosition(start.pose)
                    let height = difference.y
                    let band = height > 0.2 ? "raised" : height < -0.2 ? "lowered" : "middle"
                    roomViews[band, default:0] += 1
                    let right = SIMD3(start.pose.columns.0.x, start.pose.columns.0.y, start.pose.columns.0.z)
                    let sideways = simd_dot(difference, right)
                    let side = sideways < -0.25 ? "left" : sideways > 0.25 ? "right" : "center"
                    roomSides[side, default:0] += 1
                }
            }
            accepted += 1; last = view
            if phase == .room {
                views.append(view); if views.count > 300 { views.removeFirst() }
                if accepted % 3 == 1 || newRegion {
                    if anchors.count < 1200 { anchors.append(view) }
                    else { anchors[600 + anchorCursor % 600] = view; anchorCursor += 1 }
                }
            }
            observe(view)
        } else if recording && !valid { rejected += 1 }
        if input.tracking { updateVisibility(view) }
        else { for i in patches.indices { patches[i].currentlyVisible = false } }
        return GuideDecision(accept:recording && valid,title:title,detail:detail,quality:quality)
    }
    func summary() -> GuideSummary {
        let walls = surfaces.filter { $0.kind == "wall" }.count
        let floor = surfaces.contains { $0.kind == "floor" }
        let measured = patches.filter { $0.id.hasPrefix("depth:") }
        let measuredReady = measured.filter(\.ready).count
        let ready = patches.filter(\.ready).count
        let hidden = patches.filter(\.occluded).count
        let fraction = patches.count > hidden ? Double(ready)/Double(patches.count-hidden) : 0
        let loop = first.flatMap { start in last.map { simd_distance(start,guidePosition($0.pose)) } }
        var issues: [String] = []
        if phase == .room {
            if componentCount > 1 { issues.append("有 \(componentCount) 组片段尚未估计出衔接。沿共同的门框、墙角或家具补拍连接路线；不用找回完全相同的机位。") }
            if (roomViews["raised"] ?? 0) < 8 { issues.append("稍抬高手机，保持目标入镜，补拍上方和顶部；不要攀爬。") }
            if (roomViews["lowered"] ?? 0) < 8 { issues.append("在方便的位置降低手机，补拍低处和家具侧面；无法到达处请记为缺失。") }
            if scope == .area {
                if (roomSides["left"] ?? 0) < 8 || (roomSides["right"] ?? 0) < 8 { issues.append("以起拍位置为中心，分别向左右移动身体，补足目标两侧的视角。") }
                if accepted < 45 { issues.append("继续从左右两侧和稍高处观察这个区域，增加不同视角。") }
                if distance < 1 { issues.append("沿目标侧面移动身体，避免只转动手机。") }
                if measured.isEmpty || Double(measuredReady)/Double(max(1,measured.count)) < 0.7 { issues.append("实际表面还有橙色区域，请换位置和高度补拍。") }
            } else {
            if walls < 3 || !floor { issues.append("房间结构还没识别完整：先拍清墙角和地面。") }
            if accepted < 100 { issues.append("有效视角还不够，继续沿房间缓慢走一圈。") }
            if fraction < 0.75 { issues.append("已识别表面仍有缺少多角度观察的区域，请跟着红色补扫点。") }
            if headings.count < 6 { issues.append("朝向覆盖不足，继续看向未扫到的方向。") }
            if distance < 4 { issues.append("移动距离不足，请移动身体，别只原地转手机。") }
            if (loop ?? 100) > 0.8 { issues.append("请回到开始扫描的位置，连接房间这一圈。") }
            }
        } else if phase == .object {
            if accepted < 45 || orbit.count < 9 { issues.append("把物品固定，手机围着它继续绕拍；还没有覆盖大部分方向。") }
        } else if accepted < 12 { issues.append("从不同位置继续补拍，保持物品或空位静止。") }
        var result = GuideSummary(phase:phase.rawValue,accepted_frames:accepted,rejected_frames:rejected,walls:walls,
                            floor_detected:floor,observed_patches:patches.count,occluded_patches:hidden,multiview_patches:ready,
                            multiview_fraction:fraction,heading_bins:headings.count,object_orbit_bins:orbit.count,
                            path_meters:distance,loop_distance_meters:loop,gate_passed:issues.isEmpty,issues:issues)
        result.capture_run_count = accepted == 0 ? 0 : run+1
        result.estimated_components = componentCount
        result.region_connections = edges
        result.waiting_for_region = waitingForRegion
        result.visible_patches = patches.filter(\.currentlyVisible).count
        result.visible_ready = patches.filter { $0.currentlyVisible && $0.ready }.count
        result.policy = "region-recovery-v2; coverage and estimated connections are not reconstruction guarantees"
        result.room_view_counts = roomViews
        result.room_side_counts = roomSides
        result.surface_patches = measured.count
        result.surface_ready = measuredReady
        result.surface_pending = measured.count-measuredReady
        result.coverage_limit_reached = measured.count >= surfaceLimit
        result.object_directions = orbit.sorted()
        result.object_heights = heightBands.sorted()
        return result
    }
}
