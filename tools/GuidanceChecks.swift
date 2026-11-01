import Foundation
import simd

@main struct GuidanceChecks {
    static func input(x: Double = 0, speed: Double = 0.1, angular: Double = 0, light: Double = 0.5,
                      depth: Float = 2, time: Double = 0) -> GuideInput {
        var pose = matrix_identity_double4x4; pose.columns.3.x = x
        let view = GuideView(time:time,pose:pose,intrinsics:Intrinsics(w:640,h:480,fl_x:400,fl_y:400,cx:320,cy:240),
                             depth:[Float](repeating:depth,count:64*48),depthWidth:64,depthHeight:48)
        return GuideInput(view:view,tracking:true,speed:speed,angularSpeed:angular,exposure:0.001,
                          brightness:light,clipped:0,edgeEnergy:100,depthValid:1,distance:2)
    }
    static func main() {
        let motion = CaptureGuidance()
        assert(!motion.evaluate(input(speed:1),recording:true).accept)
        assert(!motion.evaluate(input(angular:2),recording:true).accept)
        assert(!motion.evaluate(input(light:0.05),recording:true).accept)
        assert(motion.summary().accepted_frames == 0)
        assert(!motion.summary().gate_passed)

        let stationary = CaptureGuidance()
        assert(stationary.evaluate(input(),recording:true).accept)
        for i in 1...200 { assert(!stationary.evaluate(input(time:Double(i)),recording:true).accept) }
        assert(stationary.summary().accepted_frames == 1)
        assert(!stationary.summary().gate_passed)

        let coverage = CaptureGuidance()
        let wall = GuideSurface(id:"wall",kind:"wall",transform:[[1,0,0,0],[0,1,0,0],[0,0,1,-2],[0,0,0,1]],width:2,height:2)
        coverage.updateSurfaces([wall])
        assert(coverage.evaluate(input(),recording:true).accept)
        assert(coverage.patches.filter(\.ready).isEmpty)
        assert(coverage.evaluate(input(x:0.4,time:1),recording:true).accept)
        assert(coverage.evaluate(input(x:0.7,time:2),recording:true).accept)
        assert(!coverage.patches.filter(\.ready).isEmpty)
        // The same visible wall behind an occluding foreground surface must stay red.
        let occluded = CaptureGuidance(); occluded.updateSurfaces([wall])
        for i in 0...5 { _ = occluded.evaluate(input(x:Double(i)*0.1,depth:1,time:Double(i)),recording:true) }
        assert(occluded.patches.allSatisfy { $0.observations == 0 })
        assert(!occluded.summary().gate_passed)

        let overlap = CaptureGuidance()
        _ = overlap.evaluate(input(),recording:true)
        let gap = overlap.evaluate(input(x:100,time:1),recording:true)
        assert(!gap.accept && gap.title == "和上一位置接不上")
        print("Guidance checks passed: motion/light rejection, duplicate rejection, multiview baseline, occlusion, overlap, completion gates.")
    }
}
