![Argus logo](https://argus-paper.realsee.ai/static/images/argus_logo.png) 
Accepted to ECCV 2026

# Argus: Metric Panoramic 3D Reconstruction
for Indoor Scenes

A data\-driven feed\-forward network that reconstructs complete, consistent, metric\-scale indoor 3D scenes from sparse, unordered panoramic images.
Xi Li1 Linyuan Li1 Yan Wu1 Tong Rao1 Kai Zhang1 Xinchen Hui1 Cihui Pan1,2\* 
1Realsee, China    2Quanzhou University of Information Engineering, China 
\*Corresponding author: [pancihui001@realsee.com](mailto:pancihui001@realsee.com) 
[Paper](https://arxiv.org/abs/2606.30047)
[Code](https://github.com/realsee-developer/Argus)
[Model](https://huggingface.co/RealseeTechnology/argus-realsee3d)
[Demo](https://huggingface.co/spaces/RealseeDeveloper/Argus)
[Dataset](https://dataset.realsee.ai/)
[Citation](https://argus-paper.realsee.ai/#citation)
![Argus teaser: from sparse panoramic views to a complete metric 3D indoor scene](https://argus-paper.realsee.ai/static/images/teaser.png) 

**Argus** takes a sparse, unordered set of panoramic images and reconstructs a complete, geometrically consistent, and metric\-scale 3D indoor scene in a single feed\-forward pass.
Your browser does not support the video tag.  

## Abstract

Metric feed\-forward 3D reconstruction for panoramic data remains under\-explored due to the lack of large\-scale panoramic RGB\-D training data. We present **Realsee3D**, a hybrid dataset of 10K indoor scenes \(1K real, 9K synthetic\) with 299K panoramic viewpoints and precise metric annotations, and **Argus**, a feed\-forward network trained on it for metric panoramic 3D reconstruction. In the sparse unordered capture setting of Realsee3D, a poorly chosen coordinate anchor can cause global pose drift.

Argus addresses this with a learned **covisibility module** that selects the geometrically optimal reference view to anchor the metric world frame. To further improve multi\-task learning, we decompose the bidirectional pixel\-to\-world mapping into interpretable sub\-steps with per\-step supervision and cross\-coordinate joint constraints, reinforcing geometric consistency across prediction branches. On the Realsee3D benchmark, Argus achieves **state\-of\-the\-art** metric performance in camera pose estimation, depth estimation, and point cloud reconstruction.

## Interactive Reconstruction

From a sparse set of panoramic views, Argus reconstructs a complete, metric\-scale 3D point cloud in a single feed\-forward pass. Pick a scene, then **drag to rotate**, scroll to zoom, and right\-drag to pan the live reconstruction below.
Real · FactoryReal · IndoorSynthetic · IndoorWeak CovisibilityCurved WallCartoonInk WashAnimation
Input panoramic views
![Input panoramic view](https://argus-paper.realsee.ai/static/demos/real_factory/img/v1.jpg)![Input panoramic view](https://argus-paper.realsee.ai/static/demos/real_factory/img/v2.jpg)![Input panoramic view](https://argus-paper.realsee.ai/static/demos/real_factory/img/v3.jpg)![Input panoramic view](https://argus-paper.realsee.ai/static/demos/real_factory/img/v4.jpg)
Loading 3D model…
Drag · rotate   Scroll · zoom   Right\-drag · pan
Reset view Pause rotation Point size   

## Method

Argus first extracts patch tokens from each panoramic view with a DINOv2 backbone. A lightweight **Covisibility Transformer** predicts a global covisibility score per view and selects the highest\-scoring view as the reference frame, which receives a dedicated reference camera token. A deeper **Geometry Transformer** then aggregates multi\-view geometric features, after which several prediction heads regress camera poses \(from camera tokens via MLP\) and dense outputs — depth and cross\-coordinate\-frame point maps — via independent DPT heads.

The core idea is to **explicitly factorize** the bidirectional pixel\-to\-world transform into several interpretable intermediate geometric representations, supervising each sub\-step individually and enforcing joint pose constraints across coordinate frames. This lowers optimization difficulty and strengthens multi\-task synergy. The model outputs native metric scale without post\-hoc alignment.
![Argus network architecture](https://argus-paper.realsee.ai/static/images/network.png) 

**Network overview.** A Covisibility Transformer selects the reference view, a reference\-based Geometry Transformer aggregates multi\-view features, and multiple heads predict the factorized geometric representations.
![Pixel\-to\-world geometric factorization](https://argus-paper.realsee.ai/static/images/decomp.png) 

**Geometric factorization.** The bidirectional pixel↔world transform of a single view is decomposed into explicit, individually supervised geometric steps.

## Realsee3D Dataset
1,000
Real\-world scenes
Galois\-P4 LiDAR
9,000
Synthetic scenes
from real floorplans
95,962
Total rooms
9,483 real \+ 86,479 synth
299,073
Total viewpoints
24,263 real \+ 274,810 synth
![Realsee3D dataset overview](https://argus-paper.realsee.ai/static/images/realsee3d_overview.png) 

**Realsee3D** combines LiDAR\-captured real scenes with large\-scale synthetic scenes, providing sparse unordered panoramic image sets that reflect practical acquisition.
[Explore the Realsee3D Dataset](https://dataset.realsee.ai/)

## Results
![Qualitative comparison with prior methods](https://argus-paper.realsee.ai/static/images/comparison.png) 

**Qualitative comparison.** Argus reconstructs more accurate metric geometry and sharper structural boundaries than prior methods.
![Reference view selection visualization](https://argus-paper.realsee.ai/static/images/ref_vis.png) 

**Covisibility learning.** Argus selects reference views that are more central and better connected within the scene, anchoring a stable metric coordinate system.
![Zero\-shot reconstruction on unseen datasets](https://argus-paper.realsee.ai/static/images/other_pano.png) 

**Zero\-shot reconstruction.** Argus generalizes to unseen panoramic datasets it was never trained on.

## Citation
Copy

```
@inproceedings{li2026argus,
  title={Argus: Metric panoramic 3D reconstruction for indoor scenes},
  author={Li, Xi and Li, Linyuan and Wu, Yan and Rao, Tong and Zhang, Kai and Hui, Xinchen and Pan, Cihui},
  booktitle={European Conference on Computer Vision},
  pages={628--647},
  year={2026},
  organization={Springer}
}
```

© 2026 Realsee. Code released under the [Apache License 2.0](https://github.com/realsee-developer/Argus/blob/main/LICENSE).

Website template adapted from [Nerfies](https://github.com/nerfies/nerfies.github.io), used under a [CC BY\-SA 4.0](http://creativecommons.org/licenses/by-sa/4.0/) license.
