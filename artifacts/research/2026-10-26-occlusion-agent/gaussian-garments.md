
## Gaussian Garments:
Reconstructing Simulation\-Ready Clothing with Photo\-Realistic Appearance from Multi\-View Video
[Boxiang Rong](https://ribosome-rbx.github.io/)\* 1,  [Artur Grigorev](https://dolorousrtur.github.io/)\* 1,2,  [Wenbo Wang](https://wenbwa.github.io/)1,   [Michael J. Black](https://ps.is.mpg.de/~black)2,   [Bernhard Thomaszewski](https://n.ethz.ch/~bthomasz/index.html)1,   [Christina Tsalicoglou](https://ait.ethz.ch/people/ctsalico)1   [Otmar Hilliges](https://ait.ethz.ch/people/hilliges)1,  
1 ETH Zurich, Switzerland, 2 Max Planck Institute for Intelligent Systems, Tübingen, Germany 
[**  arXiv ](https://arxiv.org/abs/2409.08189)    [  **  Video ](https://youtu.be/hi-SHdvRkVY)    [  **  Code ](https://github.com/eth-ait/Gaussian-Garments)  

## A novel approach for reconstructing **realistic\-looking**, **simulation\-ready garments** from **multi\-view videos**. The resulting virtual garments can then be combined into complex outfits, automatically *resized* and *simulated* in dynamic scenes. 

## Abstract

We introduce Gaussian Garments, a novel approach for reconstructing realistic\-looking, simulation\-ready garment assets from multi\-view videos. Our method represents garments with a combination of a 3D mesh and a Gaussian texture that encodes both the color and high\-frequency surface details. This representation enables accurate registration of garment geometries to multi\-view videos and helps disentangle albedo textures from lighting effects. Furthermore, we demonstrate how a pre\-trained Graph Neural Network \(GNN\) can be fine\-tuned to replicate the real behavior of each garment. The reconstructed Gaussian Garments can be automatically combined into multi\-garment outfits and animated with the fine\-tuned GNN. 


## Method Overview
---

Our pipeline consists of four stages: 1\) We initialize the garment's 3D mesh and 3DGS\-based appearance from a single multi\-view frame. 2\) We register the garment geometry to all multi\-view videos. 3\) We optimize the garment's appearance using the multi\-view videos and registered sequences. 4\) We refine the garment's behavior, by fine\-tuning parameters of the garment simulation Graph Neural Network. The resulting garment assets can be directly simulated with the GNN, combined into multi\-garment outfits, and resized to fit different body shapes. 

## Tracking\-based Registration

We reconstruct each garment using a "mesh\+Gaussian" representation, which allows us to track Gaussians across different frames and register the underlying mesh. Our method facilitates the registration of garments with various topologies using only the visual guidance of RGB images and physical constraints. \[[More results here](https://drive.google.com/drive/folders/1wFfYHYYXzfhwxe9EhMQ3m925s-AyTkV4?usp=sharing)\] 

## Appearance Decomposition

The wrinkles on the garment are constantly changing, leading to varying shadow patterns and reflections. We train an appearance model to predict these changes based on mesh characteristics, including the normal map and ambient occlusions of both the inner and outer surfaces. The predicted color offsets effectively decouple the lighting effects from the albedo Gaussian textures. \[[More results here](https://drive.google.com/drive/folders/1dntb01LFly40ZeJNaPQuYUm6dUn0uzO1?usp=drive_link)\] 

## Finetuned Garment Behavior

We fine\-tune the parameters of a neural simulator to accurately replicate the real\-world behavior of garments. In the videos above, bright colors indicate a large deviation from the ground truth \(registered mesh\), while dark colors signify a close match. Our final output achieves a closer alignment with the ground truth, resulting in a more realistic garment appearance. \[[More results here](https://drive.google.com/drive/folders/17xzk8hhPEQsDXSTUFMu2jVrGUsUb8lQe?usp=sharing)\] 

## Applications
---

## Garment Mix\-and\-Match

We can combine garments recovered from different subjects into complex multi\-layer outfits and simulate them together. 

## Garment Resizing 

With the trained gaussian appearance, we can also automatically resize the garments to match desired body shapes. 

## Multi\-layer Simulations

We use a Graph Neural Network \(GNN\) and fine\-tune its parameters to simulate garments with real\-world behavior. Our trained appearance model can be applied to any novel pose, here simulated by the GNN, and is robust in dynamic sequences with multi\-layer settings. Additionally, we check the visibility of Gaussians on inner layers and filter out occluded Gaussians to prevent penetrations. 

## BibTeX

```

      @inproceedings{rong2024gaussiangarments,
      title={{Gaussian Garments}: Reconstructing Simulation-Ready Clothing with Photorealistic Appearance from Multi-View Video}, 
      author={Boxiang Rong and Artur Grigorev and Wenbo Wang and Michael J. Black and Bernhard Thomaszewski and Christina Tsalicoglou and Otmar Hilliges},
      booktitle={International Conference on 3D Vision 2025},
      year={2025}
}
```
[](https://arxiv.org/abs/2409.08189)
[](https://github.com/eth-ait/Gaussian-Garments)

This website is licensed under a [Creative Commons Attribution\-ShareAlike 4.0 International License](http://creativecommons.org/licenses/by-sa/4.0/). 

This webpage is built with the template from [NeRFies](https://github.com/nerfies/nerfies.github.io). 
We sincerely thank [Keunhong Park](https://keunhong.com/) for developing and open\-sourcing this template. 
