import Foundation
import simd

enum CaptureScope: String, Codable, CaseIterable {
    case area, room
    var title: String { self == .area ? "局部区域" : "整间房" }
    var instructions: String {
        self == .area
        ? "先在书桌或墙角正前方起拍，分别向左、向右侧移，再换高低视角。让目标保持入镜，相邻画面保留相同的家具边角。"
        : "从门口或容易记住的位置出发，沿可走的路线慢走。依次拍清墙角、地面和家具，换位置观察，再回到起点。"
    }
}

enum CapturePhase: String, Codable, CaseIterable {
    case room, object, empty, placement
    var title: String {
        switch self {
        case .room: return "扫描房间"
        case .object: return "物品补扫"
        case .empty: return "补拍空位"
        case .placement: return "放回确认"
        }
    }
    var instruction: String {
        switch self {
        case .room: return "缓慢移动手机，让墙面、桌面和家具从多个角度进入画面。先试拍一小块桌面即可。"
        case .object: return "把物品放稳，手机围绕它移动。不要一直拿在手里翻转；移动物品时暂停记录。"
        case .empty: return "将刚才的物品移开，拍清它遮挡的桌面或地板。这样拿走物品后才不会留下缺洞。"
        case .placement: return "把物品放回原位，从几个角度拍清物品与周围环境的关系。稍后还需要在工作台校准位置。"
        }
    }
    var symbol: String {
        switch self { case .room: return "viewfinder"; case .object: return "cube.transparent"; case .empty: return "square.dashed"; case .placement: return "arrow.down.to.line" }
    }
}

struct Intrinsics: Codable {
    let w: Int, h: Int
    let fl_x: Double, fl_y: Double, cx: Double, cy: Double
}

struct DepthMetadata: Codable {
    let path: String
    let width: Int, height: Int
    var encoding = "float32-little-endian"
    var units = "meter"
    let intrinsics: Intrinsics
}

struct CapturedFrame: Codable {
    let image: String
    let timestamp: Double
    var segment: String
    let intrinsics: Intrinsics
    let camera_to_world: [[Double]]
    let tracking_state: String
    let depth: DepthMetadata?
    var quality: FrameQuality? = nil
}

struct RegisteredObject: Codable, Identifiable {
    let id: String
    let name: String
}

struct CaptureSegment: Codable, Identifiable {
    var id: String
    let phase: CapturePhase
    let object_id: String?
    let start: Double
    var end: Double?
    var frame_count: Int
}

struct CaptureDocument: Codable {
    var version = 1
    var units = "meter"
    var camera_axes = "opengl"
    let id: String
    let title: String
    let source: String
    let simulated: Bool
    let created_at: String
    var status = "in-progress"
    var frames: [CapturedFrame] = []
    var objects: [RegisteredObject] = []
    var segments: [CaptureSegment] = []
    var warnings: [String] = []
    var quality_version: Int? = nil
    var quality: [String: GuideSummary]? = nil
    var capture_scope: CaptureScope? = nil
    var space_id: String? = nil
    var capture_mode: String? = nil
    var guidance_override: Bool? = nil
    var reconstruction_route: String? = nil
    var capture_notes: String? = nil
    var capture_checklist: [String: Bool]? = nil
}

struct CameraSample {
    let jpeg: Data
    let timestamp: Double
    let intrinsics: Intrinsics
    let transform: [[Double]]
    var depth: Data? = nil
    var depthIntrinsics: Intrinsics? = nil
    var quality: FrameQuality? = nil
}

func rowMajor(_ matrix: simd_float4x4) -> [[Double]] {
    (0..<4).map { row in (0..<4).map { column in Double(matrix[column][row]) } }
}

enum CaptureFailure: LocalizedError {
    case message(String)
    var errorDescription: String? { if case .message(let message) = self { return message }; return nil }
}
