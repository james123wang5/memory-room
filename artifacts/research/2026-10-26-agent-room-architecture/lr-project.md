Source: https://litereality.github.io/agent/

[LiteReality*\-Agent*](https://litereality.github.io/agent/#top)
[Blog](https://litereality.github.io/agent/litereality-agent-post/) [GitHub ↗](https://github.com/LiteReality/LiteReality-Agent/)
[Viewer ](https://litereality.github.io/agent/#viewer)
[Scanner app ](https://litereality.github.io/agent/#app)
[How it works ](https://litereality.github.io/agent/#how)
[Applications ](https://litereality.github.io/agent/#apps)
[Gallery ](https://litereality.github.io/agent/#gallery)
[Citation ](https://litereality.github.io/agent/#cite)
![LiteReality\-Agent logo](https://litereality.github.io/agent/assets/images/logo.png)

# LiteReality*\-*Agent

An Agentic System for Interactable 3D Indoor Scene Reconstruction

An **open\-source, end\-to\-end toolkit** for reconstructing interactable indoor 3D scenes. Scan a room with the iOS app; the agent turns it into a complete, graphics\-ready scene with articulated assets.
[Zhening Huang1,\*,†](https://zheninghuang.github.io/)
[Yueyan Li2,\*](https://www.linkedin.com/in/yueyan-li-1b21a1251/)
[Johnathan Chiu3,\*](https://johnathanchiu.github.io/)
[Xiaoyang Lyu1](https://shawlyu.github.io/)
[Matt Zhou3](https://mattzh72.github.io/)
[Yuxin Yao1](https://yuxinyao620.github.io/)
[Joan Lasenby1](https://scholar.google.com/citations?user=tZwXV7QAAAAJ&hl=en)
[Shangzhe Wu1](https://www.elliottwu.com/)

1University of Cambridge · 2Imperial College London · 3Independent Researcher 

\*Equal contribution · †Project lead
[GitHub](https://github.com/LiteReality/LiteReality-Agent/)
[Get the scanner app](https://apps.apple.com/gb/app/litereality/id6774158260)
[Blog](https://litereality.github.io/agent/litereality-agent-post/)
[Paper ↗](https://arxiv.org/abs/2610.01863)
01

## Look into a reconstruction

Live in the browser — orbit the scene, isolate groups, compare render against the real capture, or **walk through it in first person**.
Elliott Office MIL Meeting Room Fallside Kitchen Airbnb Sunroom
[open full viewer ↗](https://litereality.github.io/agent/vr/office-elliott-qc.html)
Click to explore this room 
![LiteReality app icon](https://litereality.github.io/agent/assets/images/app-logo.png)
The scanner app 

## LiteReality

Our iOS LiDAR room scanner. Walk a room with an iPhone or iPad and it exports one bundle — **posed RGB frames**, **LiDAR depth**, **ARKit camera poses** and the **RoomPlan layout** — everything the pipeline needs.
[Get the app](https://apps.apple.com/gb/app/litereality/id6774158260)
iOS · iPadOS \(LiDAR\) — on the App Store
02

## How it works

A deterministic pass rebuilds the empty room from the scan. Then the agent authors it — editing code, rendering, comparing against the capture — until quality control passes.
input

### Scan

Posed RGB and LiDAR from the iOS app.
deterministic

### Initialize

Walls, openings and cameras rebuilt into a blank room.
agentic loop

### Author

The agent edits Room.py, refining against the capture.
gate

### QC

Automatic checks before the scene ships.
output

### Scene

Realistic, interactive, articulated.

### The workspace is Room.py

Geometry, materials and articulation are one Python program. The agent edits lines of code, never raw meshes — so every change is legible, replayable, and exports straight to Blender, glTF or a simulator.

### The authoring loop
edit → render → compare → critique ↻
render\_and\_compare select\_view grid fetch\_materials critic compile bash glob read edit
03

## Applications

Because the scene is a program, a plain\-English request becomes a code edit. Every clip below is the same authored office.

### Text\-based editing

Retexture walls and floors from a typed request — exposed brick, walnut panelling, sage\-green paint. The geometry never moves.

### Rearrangement

Re\-lay out the room from a prompt while keeping everything grounded and collision\-free. Nothing is deleted.

### Decoration

The agent fetches real assets and writes procedural geometry — pendant lamps, banners, a party setup — all placed clear of the door swing.

### Intrinsics

A fully authored scene renders perfect intrinsics for free: pixel\-exact segmentation, depth, normals and albedo, from the same cameras.
04

## Gallery

Every reconstruction, walkable in the browser. Click a scene to step inside.
![The Studio Office — real capture beside reconstruction](https://litereality.github.io/agent/assets/gallery/studio-office.jpg?v=2) 
The Studio Office
office · fixtures
[https://litereality.github.io/agent/vr/office-elliott-qc.html](https://litereality.github.io/agent/vr/office-elliott-qc.html)
![The Private Office — real capture beside reconstruction](https://litereality.github.io/agent/assets/gallery/private-office.jpg?v=2) 
The Private Office
desk · blinds
[https://litereality.github.io/agent/vr/fallside-office-zhening-qc.html](https://litereality.github.io/agent/vr/fallside-office-zhening-qc.html)
![The Boardroom — real capture beside reconstruction](https://litereality.github.io/agent/assets/gallery/boardroom.jpg?v=2) 
The Boardroom
meeting · blinds
[https://litereality.github.io/agent/vr/mil-meeting-zhening-qc.html](https://litereality.github.io/agent/vr/mil-meeting-zhening-qc.html)
![The Meeting Room — real capture beside reconstruction](https://litereality.github.io/agent/assets/gallery/meeting-room.jpg?v=2) 
The Meeting Room
meeting · chairs
[https://litereality.github.io/agent/vr/psi_2_meeting-zhening-qc.html](https://litereality.github.io/agent/vr/psi_2_meeting-zhening-qc.html)
![The Seminar Room — real capture beside reconstruction](https://litereality.github.io/agent/assets/gallery/seminar-room.jpg?v=2) 
The Seminar Room
seminar · tables
[https://litereality.github.io/agent/vr/psi_2_seminar-zhening-qc.html](https://litereality.github.io/agent/vr/psi_2_seminar-zhening-qc.html)
![The Kitchenette — real capture beside reconstruction](https://litereality.github.io/agent/assets/gallery/kitchenette.jpg?v=2) 
The Kitchenette
kitchen nook
[https://litereality.github.io/agent/vr/fallside-kitchen-zhening-qc.html](https://litereality.github.io/agent/vr/fallside-kitchen-zhening-qc.html)
![The Garden Room — real capture beside reconstruction](https://litereality.github.io/agent/assets/gallery/garden-room.jpg?v=2) 
The Garden Room
sunroom · glazing
[https://litereality.github.io/agent/vr/airbnb-room-zhening-qc.html](https://litereality.github.io/agent/vr/airbnb-room-zhening-qc.html)
![The Bedroom — real capture beside reconstruction](https://litereality.github.io/agent/assets/gallery/bedroom.jpg?v=2) 
The Bedroom
bedroom
[https://litereality.github.io/agent/vr/airbnb-cam-zhening-qc.html](https://litereality.github.io/agent/vr/airbnb-cam-zhening-qc.html)
![The Library — real capture beside reconstruction](https://litereality.github.io/agent/assets/gallery/library.jpg?v=2) 
The Library
shelves · books
[https://litereality.github.io/agent/vr/corridors-mil-zhening-qc.html](https://litereality.github.io/agent/vr/corridors-mil-zhening-qc.html)

### Related work
Articraft ↗ 

A coding agent writes programs against an LLM\-friendly SDK to generate simulation\-ready articulated assets from text.
[https://articraft3d.github.io/](https://articraft3d.github.io/)
LiteReality ↗ 

The original pipeline turning casual phone scans into graphics\-ready articulated scenes — the foundation this extends.
[https://litereality.github.io/](https://litereality.github.io/)

### Citation

[Download BibTeX](https://litereality.github.io/agent/citation.bib)

```
@misc{huang2026literealityagentagenticinteractable3d,
  title         = {LiteReality-Agent: An Agentic System for
                   Interactable 3D Indoor Scene Reconstruction},
  author        = {Zhening Huang and Yueyan Li and Johnathan Chiu and
                   Xiaoyang Lyu and Matt Zhou and Yuxin Yao and
                   Joan Lasenby and Shangzhe Wu},
  year          = {2026},
  eprint        = {2610.01863},
  archivePrefix = {arXiv},
  primaryClass  = {cs.CV},
  url           = {https://arxiv.org/abs/2610.01863}
}
```
LiteReality\-Agent · agentic, code\-based indoor reconstruction [Scanner app ↗](https://apps.apple.com/gb/app/litereality/id6774158260) [GitHub ↗](https://github.com/LiteReality/LiteReality-Agent/) [Top ↑](https://litereality.github.io/agent/#top)
