# Changelog

Reconstructed from the project's dated notes. Versions follow the iOS capture app / overall milestone; the npm package stays `0.1.0` (private).
根据项目内带日期的笔记整理；版本号对应整体里程碑与 iOS 采集 App。

## v0.4.0 — 2026-10-25 → 10-30 · Real captures, real reconstruction
- iOS guided capture app v0.4.0 (build 4): space-only guided scan and generation flow.
- Phone → Mac / NTU school-GPU reconstruction via OOOSplat; first real room trained (≈1M Gaussians, 236 MB). Quality below target — diagnosis in `docs/research/2026-10-27_*`.
- Spaces library, memory content and interaction framework (cards, attachments, clickable points, hierarchy, door/drawer pivots, multi-space, snapshots).
- Independent-object workbench; checked dataset conversion tools.
- Research: commercial capture products, Postshot / Aholo / KIRI / Scaniverse, occlusion & part-level reconstruction, walk-into-memory review.

## v0.1.0 — 2026-10-19 → 10-21 · Web prototype
- Three.js + Spark 2.3.1 viewer, procedural demo room (14,080-Gaussian vase), scene graph, joints, inspect & return-to-place.
- Project package (`.room.zip`), local save to disk with history.
