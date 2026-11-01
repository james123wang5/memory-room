[](https://keunhong.com/)
More Research 
[HDFusion ](https://hd-fusion.github.io/)
[GIR ](https://3dgir.github.io/)
[GEA ](https://3d-aigc.github.io/GEA)

# Splatter\-360: Generalizable 360 Gaussian Splatting for Wide\-baseline Panoramic Images
[Zheng Chen](https://scholar.google.com/citations?hl=zh-CN&user=fmbBnegAAAAJ)1\*,  [Chenming Wu](https://chenming-wu.github.io/)2\*,  [Zhelun Shen](https://scholar.google.com/citations?hl=zh-CN&user=pfzhh0IAAAAJ)2,  [Chen Zhao](https://openreview.net/profile?id=~Chen_Zhao9)2,  [Weicai Ye](https://ywcmaike.github.io/)3, 
[Haocheng Feng](https://scholar.google.com/citations?hl=zh-CN&user=pnuQ5UsAAAAJ)2,  [Errui Ding](https://scholar.google.com/citations?user=1wzEtxcAAAAJ&hl=en)2,   [Song\-Hai Zhang](https://scholar.google.com/citations?hl=zh-CN&user=AWtV-EQAAAAJ)1†  
1Tsinghua University,  2Baidu VIS,  3Zhejiang University 
**Accepted to CVPR 2025** 
\*Equal contribution †Corresponding author 
[**  Paper ](https://arxiv.org/pdf/2412.06250)   [  **  arXiv ](https://3d-aigc.github.io/Splatter-360/)      [  **  Code ](https://github.com/thucz/splatter360)     

## Abstract
Wide\-baseline panoramic images are frequently used in applications like VR and simulations to minimize capturing labor costs and storage needs. However, synthesizing novel views from these panoramic images in real time remains a significant challenge, especially due to panoramic imagery's high resolution and inherent distortions. Although existing 3D Gaussian splatting \(3DGS\) methods can produce photo\-realistic views under narrow baselines, they often overfit the training views when dealing with widebaseline panoramic images due to the difficulty in learning precise geometry from sparse 360◦ views. This paper presents Splatter\-360, a novel end\-to\-end generalizable 3DGS framework designed to handle wide\-baseline panoramic images. Unlike previous approaches, Splatter\- 360 performs multi\-view matching directly in the spherical domain by constructing a spherical cost volume through a spherical sweep algorithm, enhancing the network's depth perception and geometry estimation. Additionally, we introduce a 3D\-aware bi\-projection encoder to mitigate the distortions inherent in panoramic images and integrate crossview attention to improve feature interactions across multiple viewpoints. This enables robust 3D\-aware feature representations and real\-time rendering capabilities. Experimental results on the HM3D \[27\] and Replica \[32\] demonstrate that Splatter\-360 significantly outperforms state\-ofthe\-art NeRF and 3DGS methods \(e.g., PanoGRF, MVSplat, DepthSplat, and HiSplat\) in both synthesis quality and generalization performance for wide\-baseline panoramic images. 

## Method
![Interpolate start reference image](https://3d-aigc.github.io/Splatter-360/static/images/fig_pipeline.jpg) 

Our Splatter\-360 processes 360° panoramic images using a bi\-projection encoder that extracts features from both equirectangular projection \(ERP\) and cube\-map projection \(CP\) through multi\-view transformers. These features are used for spherical cost volume construction, and multi\-view matching is performed between the reference and source views in spherical space. Next, a refinement U\-Net is applied to enhance the spherical cost volume, yielding refined cost volumes and more accurate spherical depth estimations. These refined outputs are then fed into the Gaussian decoder, which produces pixel\-aligned Gaussian primitives for synthesizing novel views.



## Video 

Novel view rendering with wide\-baseline inputs on HM3D and Replica.

## More results 
![Interpolate start reference image](https://3d-aigc.github.io/Splatter-360/static/images/hm3d_cmp.jpg) 

Novel view synthesis results on HM3D with wide\-baseline inputs.

![Interpolate start reference image](https://3d-aigc.github.io/Splatter-360/static/images/replica_cmp.jpg) 

Novel view synthesis results on Replica with wide\-baseline inputs.
![Interpolate start reference image](https://3d-aigc.github.io/Splatter-360/static/images/depth_cmp_replica.jpg)

**Novel perspective view depth results on Replica with wide\-baseline inputs.**
** ![Interpolate start reference image](https://3d-aigc.github.io/Splatter-360/static/images/threeviews.jpg) 

Quantitative Results with three\-view inputs.
![Interpolate start reference image](https://3d-aigc.github.io/Splatter-360/static/images/narrow_baseline.jpg) 

Quantitative Results with narrow\-baseline inputs.
**
** **
** **
** **
** **
**  
**
** 

## BibTeX

```
@article{panogrf,
      title={Splatter-360: Generalizable 360◦ Gaussian Splatting for Wide-baseline
        Panoramic Images}, 
      author={Zheng Chen and Chenming Wu and Zhelun Shen and Chen Zhao and Errui Ding and Song-Hai Zhang},
      year={2024},
      
}
```
[](https://3d-aigc.github.io/Splatter-360/static/videos/nerfies_paper.pdf)
[](https://github.com/keunhong)

This website is licensed under a [Creative Commons Attribution\-ShareAlike 4.0 International License](http://creativecommons.org/licenses/by-sa/4.0/). 

This website borrows the template from [Nerfies](https://github.com/nerfies/nerfies.github.io) and [HyperNeRF](https://hypernerf.github.io/). 
[![](https://mapmyvisitors.com/map.png?d=V1QdKPCWxEKaqBChctRV5hdvmreU-vbh4a-rO_5Occc&cl=ffffff)](https://mapmyvisitors.com/web/1bw4d)
**
