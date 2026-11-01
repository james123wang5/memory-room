
ODGS: 3D Scene Reconstruction from OmniDirectional Images with 3D Gaussian Splatting 

**NeurIPS 2024** 
[Suyoung Lee](https://esw0116.github.io/)1\*,  [Jaeyoung Chung](https://robot0321.github.io/)1\*,  Jaeyoo Huh2,  [Kyoung Mu Lee](https://cv.snu.ac.kr/index.php/~kmlee/)1,2, 
\*Denotes Equal Contribution 


1,2 Computer Vision Lab, Seoul National University   
[![](https://robot0321.github.io/imgs/logo_cvlab.png) ](https://cv.snu.ac.kr/) 
[**  Paper ](https://neurips.cc/virtual/2024/poster/96122)    [  **  ArXiv ](https://arxiv.org/abs/2410.20686)    [  **  Poster ](https://robot0321.github.io/odgs/imgs/odgs_poster.jpg)    [  **  Slides ](https://robot0321.github.io/odgs/imgs/odgs_slides.pdf)    [  **  Code ](https://github.com/esw0116/ODGS)  

**TL;DR.** Designing 3DGS rasterizer for omnidirectional image, implemented in CUDA, verifed mathematically. 

![method](https://robot0321.github.io/odgs/imgs/method.jpg) 

**Illustration on rasterization process of ODGS.** We describe the process of projecting a 3D Gaussian to the omnidirectional pixel space. \(a\) Transforming the coordinate from the original to target. \(b\) Projecting Gaussians onto the tangent plane. \(c\) Compensating equirectangular space stretch. \(d\) Scaling to pixel space and blending with other Gaussians. 


## Abstract

Omnidirectional \(or 360\-degree\) images are increasingly being used for 3D applications since they allow the rendering of an entire scene with a single image. Existing works based on neural radiance fields demonstrate successful 3D reconstruction quality on egocentric videos, yet they suffer from long training and rendering times. Recently, 3D Gaussian splatting has gained attention for its fast optimization and real\-time rendering. However, directly using a perspective rasterizer to omnidirectional images results in severe distortion due to the different optical properties between two image domains. In this work, we present ODGS, a novel rasterization pipeline for omnidirectional images, with geometric interpretation. For each Gaussian, we define a tangent plane that touches the unit sphere and is perpendicular to the ray headed toward the Gaussian center. We then leverage a perspective camera rasterizer to project the Gaussian onto the corresponding tangent plane. The projected Gaussians are transformed and combined into the omnidirectional image, finalizing the omnidirectional rasterization process. This interpretation reveals the implicit assumptions within the proposed pipeline, which we verify through mathematical proofs. The entire rasterization process is parallelized using CUDA, achieving optimization and rendering speeds 100 times faster than NeRF\-based methods. Our comprehensive experiments highlight the superiority of ODGS by delivering the best reconstruction and perceptual quality across various datasets. Additionally, results on roaming datasets demonstrate that ODGS restores fine details effectively, even when reconstructing large 3D scenes. The source code is available on our project page. 

### Qualitative Results
![indoor compare](https://robot0321.github.io/odgs/imgs/odgs_qual1.jpg) 
![indoor compare](https://robot0321.github.io/odgs/imgs/odgs_qual2.jpg) 

## BibTeX

```
@article{lee2024odgs,
      title={ODGS: 3D Scene Reconstruction from Omnidirectional Images with 3D Gaussian Splattings},
      author={Lee, Suyoung and Chung, Jaeyoung and Huh, Jaeyoo and Lee, Kyoung Mu},
      journal={Advances in Neural Information Processing Systems (NeurIPS)},
      volume={37},
      year={2024}
}
```
