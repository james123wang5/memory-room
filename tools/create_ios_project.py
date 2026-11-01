"""Generate a small inspectable Xcode project without an extra project-generator dependency."""
import hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / 'apps/capture-ios'
objects = {}

def ident(name):
    return hashlib.sha1(('memoryroom:' + name).encode()).hexdigest()[:24].upper()

def obj(name, body):
    objects[ident(name)] = body
    return ident(name)

def refs(names):
    return '(' + ', '.join(ident(n) for n in names) + ',)'

sources = sorted(p.name for p in (ROOT / 'MemoryRoomCapture').glob('*.swift'))
tests = ['CaptureFlowTests.swift']
for filename in sources + tests:
    obj('file:'+filename, f'isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = {filename}; sourceTree = "<group>";')
    obj('build:'+filename, f'isa = PBXBuildFile; fileRef = {ident("file:"+filename)};')
obj('app-product','isa = PBXFileReference; explicitFileType = wrapper.application; includeInIndex = 0; path = MemoryRoomCapture.app; sourceTree = BUILT_PRODUCTS_DIR;')
obj('test-product','isa = PBXFileReference; explicitFileType = wrapper.cfbundle; includeInIndex = 0; path = MemoryRoomCaptureUITests.xctest; sourceTree = BUILT_PRODUCTS_DIR;')
obj('info','isa = PBXFileReference; lastKnownFileType = text.plist.xml; path = Info.plist; sourceTree = "<group>";')
obj('assets','isa = PBXFileReference; lastKnownFileType = folder.assetcatalog; path = Assets.xcassets; sourceTree = "<group>";')
obj('build-assets',f'isa = PBXBuildFile; fileRef = {ident("assets")};')
obj('app-group',f'isa = PBXGroup; children = {refs(["file:"+s for s in sources]+["info","assets"])}; path = MemoryRoomCapture; sourceTree = "<group>";')
obj('test-group',f'isa = PBXGroup; children = {refs(["file:"+s for s in tests])}; path = MemoryRoomCaptureUITests; sourceTree = "<group>";')
obj('products',f'isa = PBXGroup; children = {refs(["app-product","test-product"])}; name = Products; sourceTree = "<group>";')
obj('main-group',f'isa = PBXGroup; children = {refs(["app-group","test-group","products"])}; sourceTree = "<group>";')
obj('sources',f'isa = PBXSourcesBuildPhase; buildActionMask = 2147483647; files = {refs(["build:"+s for s in sources])}; runOnlyForDeploymentPostprocessing = 0;')
obj('test-sources',f'isa = PBXSourcesBuildPhase; buildActionMask = 2147483647; files = {refs(["build:"+s for s in tests])}; runOnlyForDeploymentPostprocessing = 0;')
obj('resources',f'isa = PBXResourcesBuildPhase; buildActionMask = 2147483647; files = {refs(["build-assets"])}; runOnlyForDeploymentPostprocessing = 0;')
obj('test-resources','isa = PBXResourcesBuildPhase; buildActionMask = 2147483647; files = (); runOnlyForDeploymentPostprocessing = 0;')
obj('zip-package','isa = XCRemoteSwiftPackageReference; repositoryURL = "https://github.com/weichsel/ZIPFoundation.git"; requirement = {kind = exactVersion; version = 0.9.20;};')
obj('zip-product',f'isa = XCSwiftPackageProductDependency; package = {ident("zip-package")}; productName = ZIPFoundation;')
obj('zip-build',f'isa = PBXBuildFile; productRef = {ident("zip-product")};')
obj('frameworks',f'isa = PBXFrameworksBuildPhase; buildActionMask = 2147483647; files = {refs(["zip-build"])}; runOnlyForDeploymentPostprocessing = 0;')
obj('test-frameworks','isa = PBXFrameworksBuildPhase; buildActionMask = 2147483647; files = (); runOnlyForDeploymentPostprocessing = 0;')
obj('test-proxy',f'isa = PBXContainerItemProxy; containerPortal = {ident("project")}; proxyType = 1; remoteGlobalIDString = {ident("app-target")}; remoteInfo = MemoryRoomCapture;')
obj('test-dependency',f'isa = PBXTargetDependency; target = {ident("app-target")}; targetProxy = {ident("test-proxy")};')
obj('app-target',f'isa = PBXNativeTarget; buildConfigurationList = {ident("app-configs")}; buildPhases = {refs(["sources","frameworks","resources"])}; buildRules = (); dependencies = (); name = MemoryRoomCapture; packageProductDependencies = {refs(["zip-product"])}; productName = MemoryRoomCapture; productReference = {ident("app-product")}; productType = "com.apple.product-type.application";')
obj('test-target',f'isa = PBXNativeTarget; buildConfigurationList = {ident("test-configs")}; buildPhases = {refs(["test-sources","test-frameworks","test-resources"])}; buildRules = (); dependencies = {refs(["test-dependency"])}; name = MemoryRoomCaptureUITests; productName = MemoryRoomCaptureUITests; productReference = {ident("test-product")}; productType = "com.apple.product-type.bundle.ui-testing";')
for category in ['project','app','test']:
    for configuration in ['Debug','Release']:
        settings = 'IPHONEOS_DEPLOYMENT_TARGET = 18.0; SDKROOT = iphoneos; SWIFT_VERSION = 5.0; CLANG_ENABLE_MODULES = YES;'
        if configuration == 'Debug': settings += ' SWIFT_OPTIMIZATION_LEVEL = "-Onone"; DEBUG_INFORMATION_FORMAT = dwarf; ONLY_ACTIVE_ARCH = YES;'
        else: settings += ' SWIFT_OPTIMIZATION_LEVEL = "-O"; DEBUG_INFORMATION_FORMAT = "dwarf-with-dsym";'
        if category == 'app':
            settings += ' PRODUCT_BUNDLE_IDENTIFIER = local.memoryroom.capture; PRODUCT_NAME = "$(TARGET_NAME)"; INFOPLIST_FILE = MemoryRoomCapture/Info.plist; ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon; TARGETED_DEVICE_FAMILY = 1; CODE_SIGN_STYLE = Automatic; SUPPORTED_PLATFORMS = "iphoneos iphonesimulator"; ENABLE_USER_SCRIPT_SANDBOXING = YES;'
        elif category == 'test':
            settings += ' PRODUCT_BUNDLE_IDENTIFIER = local.memoryroom.capture.uitests; PRODUCT_NAME = "$(TARGET_NAME)"; GENERATE_INFOPLIST_FILE = YES; TARGETED_DEVICE_FAMILY = 1; TEST_TARGET_NAME = MemoryRoomCapture; CODE_SIGN_STYLE = Automatic;'
        obj(f'{category}-{configuration}',f'isa = XCBuildConfiguration; buildSettings = {{{settings}}}; name = {configuration};')
    obj(category+'-configs',f'isa = XCConfigurationList; buildConfigurations = {refs([category+"-Debug",category+"-Release"])}; defaultConfigurationIsVisible = 0; defaultConfigurationName = Release;')
obj('project',f'isa = PBXProject; attributes = {{LastUpgradeCheck = 2700; BuildIndependentTargetsInParallel = YES; TargetAttributes = {{{ident("app-target")} = {{CreatedOnToolsVersion = 27.0;}}; {ident("test-target")} = {{CreatedOnToolsVersion = 27.0; TestTargetID = {ident("app-target")};}};}};}}; buildConfigurationList = {ident("project-configs")}; compatibilityVersion = "Xcode 14.0"; developmentRegion = "zh-Hans"; knownRegions = (en, "zh-Hans", Base); mainGroup = {ident("main-group")}; productRefGroup = {ident("products")}; projectDirPath = ""; projectRoot = ""; packageReferences = {refs(["zip-package"])}; targets = {refs(["app-target","test-target"])};')
project = ROOT / 'MemoryRoomCapture.xcodeproj'
project.mkdir(exist_ok=True)
body = '\n'.join(f'\t\t{key} = {{{value}}};' for key,value in objects.items())
(project / 'project.pbxproj').write_text('// !$*UTF8*$!\n{\n archiveVersion = 1; classes = {}; objectVersion = 56;\n objects = {\n' + body + '\n };\n rootObject = ' + ident('project') + ';\n}\n')
workspace = project / 'project.xcworkspace'; workspace.mkdir(exist_ok=True)
(workspace / 'contents.xcworkspacedata').write_text('<?xml version="1.0" encoding="UTF-8"?><Workspace version="1.0"><FileRef location="self:"></FileRef></Workspace>')
scheme = f'''<?xml version="1.0" encoding="UTF-8"?>
<Scheme LastUpgradeVersion="2700" version="1.3">
<BuildAction parallelizeBuildables="YES" buildImplicitDependencies="YES"><BuildActionEntries>
<BuildActionEntry buildForTesting="YES" buildForRunning="YES" buildForProfiling="YES" buildForArchiving="YES" buildForAnalyzing="YES"><BuildableReference BuildableIdentifier="primary" BlueprintIdentifier="{ident('app-target')}" BuildableName="MemoryRoomCapture.app" BlueprintName="MemoryRoomCapture" ReferencedContainer="container:MemoryRoomCapture.xcodeproj"/></BuildActionEntry>
</BuildActionEntries></BuildAction>
<TestAction buildConfiguration="Debug" selectedDebuggerIdentifier="Xcode.DebuggerFoundation.Debugger.LLDB" selectedLauncherIdentifier="Xcode.IDEFoundation.Launcher.LLDB" shouldUseLaunchSchemeArgsEnv="YES"><Testables><TestableReference skipped="NO"><BuildableReference BuildableIdentifier="primary" BlueprintIdentifier="{ident('test-target')}" BuildableName="MemoryRoomCaptureUITests.xctest" BlueprintName="MemoryRoomCaptureUITests" ReferencedContainer="container:MemoryRoomCapture.xcodeproj"/></TestableReference></Testables></TestAction>
<LaunchAction buildConfiguration="Debug" selectedDebuggerIdentifier="Xcode.DebuggerFoundation.Debugger.LLDB" selectedLauncherIdentifier="Xcode.IDEFoundation.Launcher.LLDB" launchStyle="0" useCustomWorkingDirectory="NO" ignoresPersistentStateOnLaunch="NO" debugDocumentVersioning="YES" debugServiceExtension="internal" allowLocationSimulation="NO"><BuildableProductRunnable runnableDebuggingMode="0"><BuildableReference BuildableIdentifier="primary" BlueprintIdentifier="{ident('app-target')}" BuildableName="MemoryRoomCapture.app" BlueprintName="MemoryRoomCapture" ReferencedContainer="container:MemoryRoomCapture.xcodeproj"/></BuildableProductRunnable></LaunchAction>
<ProfileAction buildConfiguration="Release" shouldUseLaunchSchemeArgsEnv="YES" savedToolIdentifier="" useCustomWorkingDirectory="NO" debugDocumentVersioning="YES"/>
<AnalyzeAction buildConfiguration="Debug"/><ArchiveAction buildConfiguration="Release" revealArchiveInOrganizer="YES"/>
</Scheme>'''
scheme_dir = project / 'xcshareddata/xcschemes'; scheme_dir.mkdir(parents=True,exist_ok=True)
(scheme_dir / 'MemoryRoomCapture.xcscheme').write_text(scheme)
print(project)
