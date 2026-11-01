import XCTest

final class CaptureFlowTests: XCTestCase {
    func testDemoCaptureCanRegisterObjectAndExport() {
        let app = XCUIApplication(); app.launchArguments = ["--demo"]; app.launch()
        XCTAssertTrue(app.buttons["start-session"].waitForExistence(timeout:15))
        app.buttons["start-session"].tap()
        XCTAssertTrue(app.staticTexts["demo-banner"].exists)
        recordAndAdvance(app)
        XCTAssertTrue(app.textFields["object-name"].waitForExistence(timeout:5))
        app.buttons["register-object"].tap()
        advanceWhenReady(app)
        recordAndAdvance(app)
        recordAndAdvance(app)
        XCTAssertTrue(app.buttons["finish-export"].waitForExistence(timeout:5))
        app.buttons["finish-export"].tap()
        XCTAssertTrue(app.buttons["share-capture"].waitForExistence(timeout:30))
        XCTAssertEqual(app.staticTexts["review-title"].label,"采集包准备好了")
        let screenshot = XCTAttachment(screenshot:app.screenshot()); screenshot.name = "采集演练完成"; screenshot.lifetime = .keepAlways; add(screenshot)
    }
    func testEmptyPhaseCannotBeCompleted() {
        let app = XCUIApplication(); app.launchArguments = ["--demo"]; app.launch()
        app.buttons["start-session"].tap()
        XCTAssertTrue(app.buttons["complete-phase"].waitForExistence(timeout:10))
        XCTAssertFalse(app.buttons["complete-phase"].isEnabled)
    }
    func testBadQualityFeedbackDoesNotAllowCompletion() {
        let app = XCUIApplication(); app.launchArguments = ["--demo", "--demo-blocked"]; app.launch()
        app.buttons["start-session"].tap()
        XCTAssertTrue(app.staticTexts["guide-title"].waitForExistence(timeout:10))
        XCTAssertEqual(app.staticTexts["guide-title"].label,"慢一点，画面会糊")
        app.buttons["record-toggle"].tap()
        let count = app.staticTexts["phase-frame-count"]
        let frames = XCTNSPredicateExpectation(predicate:NSPredicate(format:"label CONTAINS '有效视角'"),object:count)
        XCTAssertEqual(XCTWaiter.wait(for:[frames],timeout:10),.completed)
        XCTAssertFalse(app.buttons["complete-phase"].isEnabled)
    }
    private func recordAndAdvance(_ app:XCUIApplication) {
        XCTAssertTrue(app.buttons["record-toggle"].waitForExistence(timeout:10))
        app.buttons["record-toggle"].tap(); advanceWhenReady(app)
    }
    private func advanceWhenReady(_ app:XCUIApplication) {
        let next = app.buttons["complete-phase"]
        let ready = XCTNSPredicateExpectation(predicate:NSPredicate(format:"enabled == true"),object:next)
        XCTAssertEqual(XCTWaiter.wait(for:[ready],timeout:20),.completed)
        next.tap()
    }
}
