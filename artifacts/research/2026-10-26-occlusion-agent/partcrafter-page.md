
# PartCrafter: Structured 3D Mesh Generation via Compositional Latent Diffusion Transformers 
[Yuchen Lin](https://wgsxm.github.io/)1,3\*,   [Chenguo Lin](https://chenguolin.github.io/)1\*,   [Panwang Pan](https://paulpanwang.github.io/)2†, 
[Honglei Yan](https://openreview.net/profile?id=~Honglei_Yan1)2,   [Yiqiang Feng](https://openreview.net/profile?id=~Feng_Yiqiang1)2,   [Yadong Mu](http://www.muyadong.com/)1,   [Katerina Fragkiadaki](https://www.cs.cmu.edu/~katef/)3  
1Peking University   2PICO, ByteDance   3Carnegie Mellon University 
✉️: [linyuchen@stu.pku.edu.cn](mailto:linyuchen@stu.pku.edu.cn), [panpanwang@bytedance.com](mailto:panpanwang@bytedance.com) 
*\* denotes equal contribution, † denotes project lead* 
**Neural Information Processing Systems \(NeurIPS\) 2025** 
[** arXiv ](https://arxiv.org/abs/2506.05573)      [ ** Code ](https://github.com/wgsxm/PartCrafter)      [  **  Video ](https://www.youtube.com/watch?v=ZaZHbkkPtXY)      [ ** Model ](https://huggingface.co/wgsxm/PartCrafter)      [ ** Demo ](https://huggingface.co/spaces/alexnasa/PartCrafter)  
![](https://wgsxm.github.io/projects/partcrafter/static/images/teaser.png)  

## **PartCrafter** **is a structured 3D generative model that** 
**jointly generates multiple parts and objects from a single RGB image in one shot.** 

## 🎥   Overview Video   🎥

## 🧩   Abstract   🧩

We introduce **PartCrafter**, **the first structured 3D generative model that jointly synthesizes multiple semantically meaningful and geometrically distinct 3D meshes from a single RGB image.** Unlike existing methods that either produce monolithic 3D shapes or follow two\-stage pipelines, *i.e.*, first segmenting an image and then reconstructing each segment, **PartCrafter** adopts a unified, compositional generation architecture that does not rely on pre\-segmented inputs. Conditioned on a single image, it simultaneously denoises multiple 3D parts, enabling end\-to\-end part\-aware generation of both individual objects and complex multi\-object scenes. 

**PartCrafter** builds upon a pretrained 3D mesh diffusion transformer \(DiT\) trained on whole objects, inheriting the pretrained weights, encoder, and decoder, and introduces two key innovations: **\(1\) A compositional latent space**, where each 3D part is represented by a set of disentangled latent tokens; **\(2\) A hierarchical attention mechanism** that enables structured information flow both within individual parts and across all parts, ensuring global coherence while preserving part\-level detail during generation. To support part\-level supervision, **we curate a new dataset by mining part\-level annotations from large\-scale 3D object datasets.** Experiments show that **PartCrafter** outperforms existing approaches in generating decomposable 3D meshes, including parts that are not directly visible in input images, demonstrating the strength of part\-aware generative priors for 3D understanding and synthesis. Code and training data have been released [here](https://github.com/wgsxm/PartCrafter). 

## 🔮   Method   🔮

### Architecture
![](https://wgsxm.github.io/projects/partcrafter/static/images/method.png) 

The capability of **PartCrafter** in generating structured 3D assets, *e.g.*, 3D part\-decomposable objects or 3D scenes composed of multiple object parts, is achieved by **\(1\) Compositional Latent Space**, where each 3D part is represented by a set of disentangled latent tokens. To distinguish across parts, we add a learnable part identity embedding to the tokens of each part. **\(2\) Local\-Global Denoising Transformer**, where information across sets of latent tokens is fused to enable both local\-level and global\-level reasoning. Incorporation of the image condition into both local and global features ensure the independence and semantic coherence of the generated parts. 

### Dataset Curation
![](https://wgsxm.github.io/projects/partcrafter/static/images/dataset.jpg) 

Large\-scale 3D object datasets often contain rich part annotations. The pie chart and bin chart visualize the distribution of an object's part count. We curate a dataset by combining multiple sources, yielding 130,000 3D objects, of which 100,000 contain multiple parts. We further refine this dataset by filtering based on texture quality, part count, and average part\-level Intersection over Union \(IoU\) to ensure high\-quality supervision. **The resulting dataset comprises approximately 50,000 part\-labeled objects and 300,000 individual parts.** 

## 📝   Image to 3D Part\-Level Object Generation   📝

| ![](https://wgsxm.github.io/projects/partcrafter/static/images/object/gt/00.png) |   |   | 
|---|---|---|
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/object/gt/01.png) |   |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/object/gt/02.png) |   |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/object/gt/03.png) |   |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/object/gt/04.png) |   |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/object/gt/05.png) |   |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/object/gt/06.png) |   |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/object/gt/07.png) |   |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/object/gt/08.png) |   |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/object/gt/09.png) |   |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/object/gt/10.png) |   |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/object/gt/11.png) |   |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/object/gt/12.png) |   |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/object/gt/13.png) |   |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/object/gt/14.png) |   |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/object/gt/15.png) |   |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/object/gt/16.png) |   |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/object/gt/17.png) |   |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/object/gt/18.png) |   |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/object/gt/19.png) |   |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/object/gt/20.png) |   |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/object/gt/21.png) |   |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/object/gt/22.png) |   |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/object/gt/23.png) |   |   | 

## 📷   Real\-World Images   📷
We evaluated our model using real\-world object images from the [CO3D](https://github.com/facebookresearch/co3d.git) dataset. Since our model was trained on rendered images from Objaverse, we observed that directly testing it on real\-world images led to suboptimal performance due to the domain gap. 
To address this issue, we **stylized the input images to resemble 3D renderings** before feeding them into the model, which significantly improved the results. We used [Doubao](https://www.doubao.com/)'s raw image transformation feature with the following prompt: *"Preserve all details and perform image\-to\-image style transfer to convert the image into the style of a 3D rendering \(Objaverse\-style rendering\)."* 


| **Input** |  **Remove Background** |  **RMBG\-Result** |  **Stylized** |  **Stylized\-Result** | 
|---|---|---|---|---|
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/real2sim/input_images/0.png) |  ![](https://wgsxm.github.io/projects/partcrafter/static/images/real2sim/real_images/0.png) |   |  ![](https://wgsxm.github.io/projects/partcrafter/static/images/real2sim/sim_images/0.png) |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/real2sim/input_images/1.png) |  ![](https://wgsxm.github.io/projects/partcrafter/static/images/real2sim/real_images/1.png) |   |  ![](https://wgsxm.github.io/projects/partcrafter/static/images/real2sim/sim_images/1.png) |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/real2sim/input_images/2.png) |  ![](https://wgsxm.github.io/projects/partcrafter/static/images/real2sim/real_images/2.png) |   |  ![](https://wgsxm.github.io/projects/partcrafter/static/images/real2sim/sim_images/2.png) |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/real2sim/input_images/3.png) |  ![](https://wgsxm.github.io/projects/partcrafter/static/images/real2sim/real_images/3.png) |   |  ![](https://wgsxm.github.io/projects/partcrafter/static/images/real2sim/sim_images/3.png) |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/real2sim/input_images/4.png) |  ![](https://wgsxm.github.io/projects/partcrafter/static/images/real2sim/real_images/4.png) |   |  ![](https://wgsxm.github.io/projects/partcrafter/static/images/real2sim/sim_images/4.png) |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/real2sim/input_images/5.png) |  ![](https://wgsxm.github.io/projects/partcrafter/static/images/real2sim/real_images/5.png) |   |  ![](https://wgsxm.github.io/projects/partcrafter/static/images/real2sim/sim_images/5.png) |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/real2sim/input_images/6.png) |  ![](https://wgsxm.github.io/projects/partcrafter/static/images/real2sim/real_images/6.png) |   |  ![](https://wgsxm.github.io/projects/partcrafter/static/images/real2sim/sim_images/6.png) |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/real2sim/input_images/7.png) |  ![](https://wgsxm.github.io/projects/partcrafter/static/images/real2sim/real_images/7.png) |   |  ![](https://wgsxm.github.io/projects/partcrafter/static/images/real2sim/sim_images/7.png) |   | 

## 🖼️   Image to 3D Scene Generation   🖼️

| ![](https://wgsxm.github.io/projects/partcrafter/static/images/scene/gt/00.png) |   | 
|---|---|
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/scene/gt/01.png) |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/scene/gt/02.png) |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/scene/gt/03.png) |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/scene/gt/04.png) |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/scene/gt/05.png) |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/scene/gt/06.png) |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/scene/gt/07.png) |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/scene/gt/08.png) |   | 

## 🛠️   Ablation Study   🛠️

| **Input** |  **2 Parts** |  **3 Parts** |  **4 Parts** | 
|---|---|---|---|
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/ab/1.png) |   |   |   | 
| **5 Parts** |  **6 Parts** |  **7 Parts** |  **8 Parts** | 
|  |   |   |   | 
| **Input** |  **2 Parts** |  **3 Parts** |  **4 Parts** | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/ab/2.png) |   |   |   | 
| **5 Parts** |  **6 Parts** |  **7 Parts** |  **8 Parts** | 
|  |   |   |   | 

## 🎨   More Results   🎨

### A. Comparison with [HoloPart](https://vast-ai-research.github.io/HoloPart/) 

| **Input** |  **HoloPart** |  **Ours** | 
|---|---|---|
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/object/gt/00.png) |   |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/object/gt/01.png) |   |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/object/gt/02.png) |   |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/object/gt/03.png) |   |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/object/gt/04.png) |   |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/object/gt/06.png) |   |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/object/gt/07.png) |   |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/object/gt/08.png) |   |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/object/gt/09.png) |   |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/object/gt/11.png) |   |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/object/gt/12.png) |   |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/object/gt/13.png) |   |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/object/gt/14.png) |   |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/object/gt/16.png) |   |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/object/gt/17.png) |   |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/object/gt/18.png) |   |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/object/gt/20.png) |   |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/object/gt/21.png) |   |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/object/gt/22.png) |   |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/object/gt/23.png) |   |   | 

### B. Comparison with [MIDI](https://huanngzh.github.io/MIDI-Page/) 

| **Input** |  **MIDI** |  **Ours** | 
|---|---|---|
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/scene/gt/00.png) |   |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/scene/gt/01.png) |   |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/scene/gt/02.png) |   |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/scene/gt/03.png) |   |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/scene/gt/04.png) |   |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/scene/gt/05.png) |   |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/scene/gt/06.png) |   |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/scene/gt/07.png) |   |   | 
| ![](https://wgsxm.github.io/projects/partcrafter/static/images/scene/gt/08.png) |   |   | 

## 📚   BibTeX   📚

If you find our work helpful, please consider citing: 

```
@misc{lin2025partcrafter,
  title={PartCrafter: Structured 3D Mesh Generation via Compositional Latent Diffusion Transformers}, 
  author={Yuchen Lin and Chenguo Lin and Panwang Pan and Honglei Yan and Yiqiang Feng and Yadong Mu and Katerina Fragkiadaki},
  year={2025},
  eprint={2506.05573},
  url={https://arxiv.org/abs/2506.05573}
}
```

Website template is borrowed from [Nerfies](https://nerfies.github.io/). Thanks for their effort. 
