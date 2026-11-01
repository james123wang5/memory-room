[Skip to main content](https://developer.playcanvas.com/user-manual/supersplat/editor/import-export/#__docusaurus_skipToContent_fallback)
![PlayCanvas Logo](https://developer.playcanvas.com/img/playcanvas.webp)
**PlayCanvas Docs**
[https://developer.playcanvas.com/](https://developer.playcanvas.com/)
[User Manual](https://developer.playcanvas.com/user-manual/)
[Examples](https://developer.playcanvas.com/user-manual/supersplat/editor/import-export/#)
- [Engine Examples](https://playcanvas.com/examples)
- [Editor Tutorials](https://developer.playcanvas.com/tutorials/)
- [React Examples](https://developer.playcanvas.com/user-manual/react/examples/)
- [Web Components Examples](https://playcanvas.github.io/web-components/examples/)
[API](https://api.playcanvas.com/)
[English](https://developer.playcanvas.com/user-manual/supersplat/editor/import-export/#)
- [English](https://developer.playcanvas.com/user-manual/supersplat/editor/import-export/)
- [日本語](https://developer.playcanvas.com/ja/user-manual/supersplat/editor/import-export/)
[Discord Invite](https://discord.gg/RSaMRzg)
[GitHub Repository](https://github.com/playcanvas/engine)
Search⌘K
- 
Introduction
- [Welcome](https://developer.playcanvas.com/user-manual/)
- 
[Getting Started](https://developer.playcanvas.com/user-manual/getting-started/)
- 
[Account Management](https://developer.playcanvas.com/user-manual/account-management/)
- 
Core Products
- 
[PlayCanvas Engine](https://developer.playcanvas.com/user-manual/engine/)
- 
[PlayCanvas Editor](https://developer.playcanvas.com/user-manual/editor/)
- 
[PlayCanvas React](https://developer.playcanvas.com/user-manual/react/)
- 
[PlayCanvas Web Components](https://developer.playcanvas.com/user-manual/web-components/)
- 
[SuperSplat](https://developer.playcanvas.com/user-manual/supersplat/)
  - [Getting Started](https://developer.playcanvas.com/user-manual/supersplat/getting-started/)
  - 
[Editor](https://developer.playcanvas.com/user-manual/supersplat/editor/)
    - [Interface Overview](https://developer.playcanvas.com/user-manual/supersplat/editor/interface/)
    - [Import and Export](https://developer.playcanvas.com/user-manual/supersplat/editor/import-export/)
    - [Managing Projects](https://developer.playcanvas.com/user-manual/supersplat/editor/managing-projects/)
    - [Managing Splats](https://developer.playcanvas.com/user-manual/supersplat/editor/scene-management/)
    - [Camera Controls](https://developer.playcanvas.com/user-manual/supersplat/editor/camera-controls/)
    - [Selection and Cleanup](https://developer.playcanvas.com/user-manual/supersplat/editor/editing-splats/)
    - [Transform, Measure and Align](https://developer.playcanvas.com/user-manual/supersplat/editor/transform-measure-align/)
    - [Color and Appearance](https://developer.playcanvas.com/user-manual/supersplat/editor/color-and-appearance/)
    - [Data Panel](https://developer.playcanvas.com/user-manual/supersplat/editor/data-panel/)
    - [Keyboard Shortcuts](https://developer.playcanvas.com/user-manual/supersplat/editor/keyboard-shortcuts/)
    - [Timeline](https://developer.playcanvas.com/user-manual/supersplat/editor/timeline/)
    - [Rendering Media](https://developer.playcanvas.com/user-manual/supersplat/editor/rendering/)
    - [Publishing](https://developer.playcanvas.com/user-manual/supersplat/editor/publishing/)
    - [Troubleshooting](https://developer.playcanvas.com/user-manual/supersplat/editor/troubleshooting/)
  - [Direct Upload](https://developer.playcanvas.com/user-manual/supersplat/upload/)
  - [Manage](https://developer.playcanvas.com/user-manual/supersplat/manage/)
  - 
[Studio](https://developer.playcanvas.com/user-manual/supersplat/studio/)
  - [Scene Page](https://developer.playcanvas.com/user-manual/supersplat/scene-page/)
  - [Explore](https://developer.playcanvas.com/user-manual/supersplat/explore/)
  - [User Profile](https://developer.playcanvas.com/user-manual/supersplat/user-profile/)
  - [Following Creators](https://developer.playcanvas.com/user-manual/supersplat/following/)
  - [Streaming & Performance](https://developer.playcanvas.com/user-manual/supersplat/streaming/)
  - 
[Viewer](https://developer.playcanvas.com/user-manual/supersplat/viewer/)
  - [Convert](https://developer.playcanvas.com/user-manual/supersplat/convert/)
  - 
[API & Integrations](https://developer.playcanvas.com/user-manual/supersplat/api-integrations/)
- 
[SplatTransform](https://developer.playcanvas.com/user-manual/splat-transform/)
- 
Common Topics
- 
[Entity Component System](https://developer.playcanvas.com/user-manual/ecs/)
- 
[Assets](https://developer.playcanvas.com/user-manual/assets/)
- 
[Scripting](https://developer.playcanvas.com/user-manual/scripting/)
- 
[Graphics](https://developer.playcanvas.com/user-manual/graphics/)
- 
[Gaussian Splatting](https://developer.playcanvas.com/user-manual/gaussian-splatting/)
- 
[Animation](https://developer.playcanvas.com/user-manual/animation/)
- 
[Physics](https://developer.playcanvas.com/user-manual/physics/)
- 
[2D](https://developer.playcanvas.com/user-manual/2D/)
- 
[User Interface](https://developer.playcanvas.com/user-manual/user-interface/)
- 
[XR](https://developer.playcanvas.com/user-manual/xr/)
- 
[Optimization](https://developer.playcanvas.com/user-manual/optimization/)
- 
Foundational APIs
- 
[REST API](https://developer.playcanvas.com/user-manual/api/)
- 
[PCUI](https://developer.playcanvas.com/user-manual/pcui/)
- 
Additional Resources
- [Glossary](https://developer.playcanvas.com/user-manual/glossary/)
- [Press Pack](https://developer.playcanvas.com/user-manual/press-pack/)
- [Security](https://developer.playcanvas.com/user-manual/security/)
- [Home page](https://developer.playcanvas.com/)
- [SuperSplat](https://developer.playcanvas.com/user-manual/supersplat/)
- [Editor](https://developer.playcanvas.com/user-manual/supersplat/editor/)
- Import and Export
On this page

# Import and Export

SuperSplat's import and export capabilities are essential for working with Gaussian Splat data throughout your entire workflow. Import allows you to bring in splat scenes from various capture tools and formats for editing, cleanup, and optimization. Once your editing work is complete, export enables you to save your refined splats in the optimal format for your target platform \- whether that's a compressed format for web deployment, a full\-quality PLY for archival, or a standalone HTML viewer for easy sharing. This flexibility ensures SuperSplat can integrate seamlessly into any Gaussian Splat production pipeline.

## Supported File Formats[​](https://developer.playcanvas.com/user-manual/supersplat/editor/import-export/#supported-file-formats)

SuperSplat supports several Gaussian Splat scene formats, plus COLMAP and INRIA camera poses for creating timeline keyframes:

| Format | Import | Export | Description |
|---|---|---|---|
| `.ply` | ✅ | ✅ | Standard PLY format \- most common interchange format, widely supported but heavyweight |
| `.compressed.ply` | ✅ | ✅ | Compressed PLY format \- far smaller than uncompressed PLY, quantizes data. [Learn more](https://blog.playcanvas.com/compressing-gaussian-splats/) |
| `.sog` | ✅ | ✅ | Bundled super\-compressed format \(a zip file containing `meta.json` and `.webp` textures\). Recommended for runtime applications |
| `meta.json` | ✅ | ❌ | Unbundled super\-compressed format \(accompanied by `.webp` textures\). Use [SplatTransform](https://developer.playcanvas.com/user-manual/splat-transform/) CLI tool to export |
| `lod\-meta.json` | ✅ | ❌ | [Streamed SOG](https://developer.playcanvas.com/user-manual/supersplat/streaming/) bundle \(accompanied by per\-LOD `.sog` chunks\). Use [SplatTransform](https://developer.playcanvas.com/user-manual/splat-transform/) CLI tool to export |
| `.splat` | ✅ | ✅ | Legacy compressed splat format \(antimatter15\) \- less efficient than compressed PLY |
| `.ksplat` | ✅ | ❌ | KSplat compressed splat format. Import only |
| `.spz` | ✅ | ✅ | Niantic compressed format. Exports as SPZ version 4 by default, with SPZ version 3 available for older readers |
| `.lcc` / `.lcc2` | ✅ | ❌ | XGRIDS proprietary multi\-LOD formats. SuperSplat asks which level of detail to load |
| `images.txt` | ✅ | ❌ | Camera poses from a [COLMAP reconstruction](https://colmap.github.io/format.html#images-txt). Importing the file creates [Timeline keyframes](https://developer.playcanvas.com/user-manual/supersplat/editor/timeline/#importing-camera-poses-as-keyframes); it does not load a splat scene |
| Camera pose `.json` | ✅ | ❌ | Camera poses in the INRIA JSON format. Importing the file creates [Timeline keyframes](https://developer.playcanvas.com/user-manual/supersplat/editor/timeline/#importing-camera-poses-as-keyframes); it does not load a splat scene |
| `.html` | ❌ | ✅ | Self\-contained viewer app with the compressed splat data embedded in one HTML file |
| `.zip` | ❌ | ✅ | Viewer package containing an HTML app and a separate bundled SOG file \(`index.sog`\) |
warning

Only `.ply` files containing 3D Gaussian Splat data can be loaded \- other PLY file types will fail to import.

## Importing Splats[​](https://developer.playcanvas.com/user-manual/supersplat/editor/import-export/#importing-splats)

SuperSplat can import Gaussian Splat scenes in `.ply`, `.compressed.ply`, `.splat`, `.ksplat`, `.spz`, `.lcc`, `.lcc2`, `.sog` \(bundled SOG\), `meta.json` \(unbundled SOG\), and `lod\-meta.json` \(Streamed SOG\) formats. It can also import COLMAP `images.txt` and INRIA camera pose `.json` files to create [camera animation keyframes](https://developer.playcanvas.com/user-manual/supersplat/editor/timeline/#importing-camera-poses-as-keyframes).

There are four ways to load a Gaussian Splat file:
1.  

**Drag and drop** \- Drop one or more splat files, or a whole folder, from your file system into SuperSplat's window. For multi\-file formats \(such as `.lcc`, `.lcc2`, unbundled SOG, or Streamed SOG\), drag the parent folder containing those files.
2.  

**File menu** \- Select `File` > `Import` and choose one or more splat files from your file system. `File` > `Import Recent` lists the files and folders you have imported before so you can reload them without browsing for them again; `Clear Recent` at the bottom of the list empties it.
3.  

**Direct file opening** \- If you have installed SuperSplat as an app from your browser's address bar, you can double\-click a `.ply`, `.splat`, `.sog`, `.spz`, `.ksplat`, or `.ssproj` file in File Explorer \(Windows\) or Finder \(macOS\) to open it in the Editor.
4.  

**URL loading** \- Use the `load` query parameter in the form: `https://superspl.at/editor?load=<SPLAT\_URL>`. For example:

[https://superspl.at/editor?load=https://raw.githubusercontent.com/willeastcott/assets/main/biker.ply](https://superspl.at/editor?load=https://raw.githubusercontent.com/willeastcott/assets/main/biker.ply)

This is particularly useful for sharing splats with others on social platforms like X and LinkedIn.

URL loading also supports multi\-file `.lcc`, `.lcc2`, unbundled SOG, and Streamed SOG scenes. Keep their related chunk or texture files at the relative paths referenced by the container.

### Choosing a Level of Detail[​](https://developer.playcanvas.com/user-manual/supersplat/editor/import-export/#choosing-a-level-of-detail)

When a file contains multiple levels of detail, SuperSplat displays a **Load Options** dialog before allocating the splats. The dialog lists each LOD and its splat count. It initially selects the most detailed level containing fewer than 20 million splats, helping large scenes avoid excessive memory use.

Choose the LOD that fits your editing needs and available memory, then click **Load**. Lower\-detail levels load faster and consume less memory. Click **Cancel** to stop the import without loading a level.

### Importing PLY Sequences[​](https://developer.playcanvas.com/user-manual/supersplat/editor/import-export/#ply-sequences)

SuperSplat supports importing sequences of PLY files to create splat animations. This allows you to view animated Gaussian Splats where each PLY file represents a single frame in the animation.

To import a PLY sequence:
1.  

Ensure your PLY files follow a naming convention with sequential frame numbers appended, such as:
  - `animation\_0001.ply` 
  - `animation\_0002.ply` 
  - `animation\_0003.ply` 
  - etc. 
2.  

Load the sequence into SuperSplat by either:
  - **Dragging and dropping** all the PLY files from your file system into SuperSplat 
  - **Dragging and dropping** a folder containing the PLY files onto SuperSplat 
  - Using **File > Import** and selecting multiple PLY files 

Once loaded, SuperSplat will automatically recognize the sequence and enable the [Timeline](https://developer.playcanvas.com/user-manual/supersplat/editor/timeline/) panel, allowing you to:
- Step through frames using the arrow buttons 
- Play the animation using the play button 
- Scrub through the animation using the timeline slider 
note

PLY sequences are memory\-intensive since each frame loads a complete splat scene. For optimal performance, consider the file sizes and number of frames when working with animated splats.

## Exporting Splats[​](https://developer.playcanvas.com/user-manual/supersplat/editor/import-export/#exporting-splats)

To export your currently loaded scene, open the `File` > `Export` submenu and choose **PLY**, **SOG**, **SPZ**, **Splat**, or **Viewer App**. Exports include the visible splats only. Every export uses the same dialog:

![The export dialog with its Location and Filename rows](https://developer.playcanvas.com/assets/images/export-dialog-0bc77814b65615db89c6ba80119bd376.png)
- **Location** \- The output folder. The Editor remembers the folder you last exported to; click **Choose output folder…** \(or **Change…**\) to pick another. In browsers without the File System Access API this row is hidden and the file is delivered as a download instead. 
- **Filename** \- The name of the output file. The dialog warns if the name is invalid or already exists in the folder \(the button then reads **Overwrite**\), and it refuses to overwrite a file that the current scene is still reading from. 
- Format\-specific options: 
  - **PLY**: **Compress PLY** writes a `.compressed.ply` instead of a full\-size PLY; **SH Bands** chooses how many spherical harmonic bands to include. 
  - **SOG**: **SH Bands**, and **Iterations** \(1–20, default 10\), the number of clustering passes used to compress the spherical harmonic data. More iterations give slightly better quality at the cost of export time. 
  - **SPZ**: **SH Bands**, and **Version**. **SPZ 4** \(the latest version of the spec\) is the default, while **SPZ 3** \(legacy gzip container\) is available for compatibility with older third\-party SPZ readers. 
  - **Viewer App**: the options for a standalone HTML viewer are described in [Self\-Hosting the Viewer](https://developer.playcanvas.com/user-manual/supersplat/viewer/self-hosting/). 

Choose `File` > `Re\-export` \(`Ctrl \+ Shift \+ E`\) to repeat the last export with the same options to the same file. It overwrites the previous output without further prompts, which is handy while iterating on a cleanup.
[Edit this page](https://github.com/playcanvas/developer-site/tree/main/docs/user-manual/supersplat/editor/import-export.md)
Previous
Interface Overview
[https://developer.playcanvas.com/user-manual/supersplat/editor/interface/](https://developer.playcanvas.com/user-manual/supersplat/editor/interface/)
Next
Managing Projects
[https://developer.playcanvas.com/user-manual/supersplat/editor/managing-projects/](https://developer.playcanvas.com/user-manual/supersplat/editor/managing-projects/)
- [Supported File Formats](https://developer.playcanvas.com/user-manual/supersplat/editor/import-export/#supported-file-formats)
- [Importing Splats](https://developer.playcanvas.com/user-manual/supersplat/editor/import-export/#importing-splats)
  - [Choosing a Level of Detail](https://developer.playcanvas.com/user-manual/supersplat/editor/import-export/#choosing-a-level-of-detail)
  - [Importing PLY Sequences](https://developer.playcanvas.com/user-manual/supersplat/editor/import-export/#ply-sequences)
- [Exporting Splats](https://developer.playcanvas.com/user-manual/supersplat/editor/import-export/#exporting-splats)
Docs
- [User Manual](https://developer.playcanvas.com/user-manual/)
- [Tutorials](https://developer.playcanvas.com/tutorials/)
- [API Reference](https://api.playcanvas.com/)
Social
- [X](https://x.com/playcanvas)
- [LinkedIn](https://www.linkedin.com/company/playcanvas)
- [Facebook](https://www.facebook.com/playcanvas)
Community
- [Discord](https://discord.gg/RSaMRzg)
- [Forum](https://forum.playcanvas.com/)
- [Reddit](https://www.reddit.com/r/PlayCanvas/)
Resources
- [Blog](https://blog.playcanvas.com/)
- [GitHub](https://github.com/playcanvas)
- [YouTube](https://www.youtube.com/@playcanvas)
Copyright © 2026 PlayCanvas Ltd.
