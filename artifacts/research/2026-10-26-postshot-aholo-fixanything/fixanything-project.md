[FixAnything](https://fix-anything.github.io/#top)
[Overview](https://fix-anything.github.io/#overview)
[Method](https://fix-anything.github.io/#method)
[Ablations](https://fix-anything.github.io/#ablations)
[Results](https://fix-anything.github.io/#results)
[Uncertainty](https://fix-anything.github.io/#uncertainty)
[BibTeX](https://fix-anything.github.io/#bibtex)
[arXiv](https://arxiv.org/abs/2608.23549)

# FixAnything: 3D\-Consistent Rendering Refinement via Video Generative Priors
[Khiem Vuong](https://www.khiemvuong.com/), [Deva Ramanan](https://www.cs.cmu.edu/~deva/)\*, [Srinivasa Narasimhan](https://www.cs.cmu.edu/~srinivas/)\* 
Carnegie Mellon University
\(\* denotes equal contribution / advising\)
European Conference on Computer Vision \(ECCV\) 2026
[arXiv](https://arxiv.org/abs/2608.23549)
[Code](https://github.com/kvuong2711/fix-anything)
[Thread](https://x.com/kvuongdev/status/2092646009209778647)
[BibTeX](https://fix-anything.github.io/#bibtex)
TL;DR A single generalist video model that repairs rendering artifacts from *any* 3D representation — **3DGS, NeRF, mesh, or sparse point clouds** — by repurposing a pretrained video diffusion model with **minimal modification and finetuning**. 

### \(Degraded\) render *is* camera control

Every representation has its own artifacts — yet the render still preserves the **camera trajectory and coarse scene layout**, providing the control signal.

### A \(very sparse\) point cloud is enough

Even a very sparse point cloud \(e.g., from COLMAP\) gives the video model effective camera control, with only **minimal LoRA finetuning** on ** ~ 20 paired videos**.

### Pose accuracy *as* the reward for DPO

Camera poses recovered by COLMAP from each output serve as the **reward**; Flow\-DPO then steers the model toward **geometrically consistent** outputs.

Switch representation below, or use **Slider** to drag a seam between the input render and the repaired output — same frame, same camera trajectory.
Representation
3DGS  NeRF  Mesh  Sparse points
Side\-by\-side Slider
Sparse\-point input
FixAnything Output
1× 0.0 / 0.0s
Sparse\-point input video, unrolled
![First frame: a clean view](https://fix-anything.github.io/anchors/colmap_first.jpg) Frame 1 · clean view 
· · ·
![Middle frame: the degraded render](https://fix-anything.github.io/anchors/colmap_mid.jpg) Frame 40 · point\-cloud render 
· · ·
![Last frame: a clean view](https://fix-anything.github.io/anchors/colmap_last.jpg) Frame 65 · clean view 

Clean training views the trajectory passes through — the model treats these as anchors and propagates appearance, lighting and scene structure into the degraded frames in between.
01. Method

Rendering from 3DGS, NeRF, meshes or point clouds produces artifacts whenever input views are sparse or the target view lies far from them. FixAnything poses the fix as **video\-to\-video translation** and adapts a pretrained video diffusion model \(Wan2.1\-I2V\-14B\) in two stages: 

### Stage I — Supervised finetuning
- **Conditioning** — the degraded render's VAE latent is channel\-concatenated with the noisy latent, together with a per\-frame binary mask marking which frames to *trust* and which to *fix*. 
- **Data** — paired videos from DL3DV\-10K, rendered from all four representations and trained *jointly* as one model. 
- **Training** — a *rank\-64 LoRA adapter* \(< 1% of parameters\), 3000 iterations on a single H100; as few as 20 paired videos suffice.

### Stage II — Geometry\-aware preference optimization
- **Motivation** — the model sometimes hallucinates structures that look plausible per frame but are inconsistent across views. 
- **Reward** — how accurately COLMAP recovers the output video's camera poses \(AUC@5° against the input poses\). 
- **Flow\-DPO** — several rollouts are sampled per scene, ranked by this reward, and paired higher\-against\-lower \(AUC gap ≥ 0.2\); Flow\-DPO then finetunes the LoRA on these pairs, improving pose accuracy from *61.1 to 68.3 AUC@5°* with no additional inference cost.
02. Ablations

### Geometry\-aware preference optimization

Without DPO, some seeds hallucinate structure that shifts from frame to frame and breaks 3D consistency. Ranking rollouts by **recovered camera\-pose accuracy** steers generation toward geometrically faithful outputs.
Input
Ground truth
Before DPO \(hallucinated tree\-like structure breaks geometric consistency\)
After DPO
1× 0.0 / 0.0s

### Mask\-aware conditioning

Without the mask, the model cannot tell clean frames from mildly degraded ones and hallucinates over the training views. With it, those frames are preserved and serve as anchors for the frames around them.
Input
Ground truth
Without mask \(note the missing wet\-floor sign, which also corrupts nearby frames\)
With mask
1× 0.0 / 0.0s
03. Results

### DL3DV
Scene
01 02 03 04
Representation
3DGS  Mesh  Sparse points
Side\-by\-side Slider
3DGS input
FixAnything Output
1× 0.0 / 0.0s

### DL3DV\-Drone

Additional aerial DL3DV scenes with long trajectories. Trajectories longer than 61 frames are processed in overlapping chunks that share a clean anchor at each boundary.
Scene
01 02 03 04
Representation
3DGS  Sparse points
Side\-by\-side Slider
Sparse\-point input
FixAnything Output
1× 0.0 / 0.0s
![clean anchor view](https://fix-anything.github.io/assets/dl3dv_drone/15383a1/keyframes/0000.jpg) ![clean anchor view](https://fix-anything.github.io/assets/dl3dv_drone/15383a1/keyframes/0060.jpg) ![clean anchor view](https://fix-anything.github.io/assets/dl3dv_drone/15383a1/keyframes/0120.jpg) ![clean anchor view](https://fix-anything.github.io/assets/dl3dv_drone/15383a1/keyframes/0180.jpg) ![clean anchor view](https://fix-anything.github.io/assets/dl3dv_drone/15383a1/keyframes/0240.jpg) ![clean anchor view](https://fix-anything.github.io/assets/dl3dv_drone/15383a1/keyframes/0300.jpg)

Clean training views the trajectory passes through. The model treats these as anchors and propagates appearance, lighting and scene structure into the degraded frames in between.

### MipNeRF\-360 \(cross\-dataset generalization\)
Scene
Counter Room Bonsai Garden Bicycle Treehill
Side\-by\-side Slider
3DGS input
FixAnything Output
1× 0.0 / 0.0s

### LLFF \(cross\-dataset generalization\)
Scene
Trex Room Horns Fern Orchids
Side\-by\-side Slider
3DGS input
FixAnything Output
1× 0.0 / 0.0s
04. Can we tell where the model is hallucinating?
- **Uncertainty estimate** — as a preliminary analysis, we run inference five times with different random seeds and take the per\-pixel standard deviation as an uncertainty estimate. 
- **Strong correlation with error** — uncertainty is low where the model confidently propagates input texture \(sky, ground\) and high where several completions are plausible \(buildings\), closely tracking reconstruction error: on DL3DV with six views, mean PSNR is *25.7 dB* over the most\-confident 25% of pixels versus *14.4 dB* over the least\-confident 25%.
Mesh input
FixAnything output \(seed 1\)
Ground truth
Error  \|output − GT\|
Uncertainty  std over 5 seeds low ** high
1× 0.0 / 0.0s
05. BibTeX
Copy 

```
@inproceedings{vuong2026fixanything,
  title     = {FixAnything: 3D-Consistent Rendering Refinement via Video Generative Priors},
  author    = {Vuong, Khiem and Ramanan, Deva and Narasimhan, Srinivasa},
  booktitle = {European Conference on Computer Vision},
  year      = {2026}
}
```

**Acknowledgements:** We thank Shubham Tulsiani, Nikhil Keetha, Sriram Narayanan, Anurag Ghosh, and other members of Deva's and Srinivas' groups at CMU for their valuable feedback and suggestions at various stages of this project. This work used Bridges\-2 at Pittsburgh Supercomputing Center through allocation cis240119p from the Advanced Cyberinfrastructure Coordination Ecosystem: Services & Support \(ACCESS\) program, which is supported by National Science Foundation grants \#2138259, \#2138286, \#2138307, \#2137603, and \#2138296. This work was supported by Intelligence Advanced Research Projects Activity \(IARPA\) via Department of the Interior/Interior Business Center \(DOI/IBC\) contract number 140D0423C0074. The U.S. Government is authorized to reproduce and distribute reprints for Governmental purposes notwithstanding any copyright annotation thereon. *Disclaimer:* The views and conclusions contained herein are those of the authors and should not be interpreted as necessarily representing the official policies or endorsements, either expressed or implied, of IARPA, DOI/IBC, or the U.S. Government. 
