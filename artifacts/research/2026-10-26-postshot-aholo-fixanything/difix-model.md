[![Hugging Face's logo](https://huggingface.co/front/assets/huggingface_logo-noborder.svg) Hugging Face](https://huggingface.co/)
- [ Models ](https://huggingface.co/models)
- [ Datasets ](https://huggingface.co/datasets)
- [ Spaces ](https://huggingface.co/spaces)
- [ Buckets new](https://huggingface.co/storage)
- [ Docs ](https://huggingface.co/docs)
- [ Enterprise ](https://huggingface.co/enterprise) 
- [Pricing](https://huggingface.co/pricing) 
- 
  - 
Website
    - [ Tasks](https://huggingface.co/tasks) 
    - [ HuggingChat](https://huggingface.co/chat) 
    - [ Collections](https://huggingface.co/collections) 
    - [ Languages](https://huggingface.co/languages) 
    - [ Organizations](https://huggingface.co/organizations) 
  - 
Community
    - [ Blog](https://huggingface.co/blog) 
    - [ Posts](https://huggingface.co/posts) 
    - [ Daily Papers](https://huggingface.co/papers) 
    - [ Hardware](https://huggingface.co/hardware) 
    - [ Learn](https://huggingface.co/learn) 
    - [ Discord](https://huggingface.co/join/discord) 
    - [ Forum](https://discuss.huggingface.co/) 
    - [ GitHub](https://github.com/huggingface) 
  - 
Solutions
    - [ Team & Enterprise](https://huggingface.co/enterprise) 
    - [ Hugging Face PRO](https://huggingface.co/pro) 
    - [ Enterprise Support](https://huggingface.co/support) 
    - [ Inference Providers](https://huggingface.co/inference/models) 
    - [ Inference Endpoints](https://huggingface.co/inference-endpoints) 
    - [ Storage Buckets](https://huggingface.co/storage) 
- 
---
- [Log In](https://huggingface.co/login) 
- [Sign Up](https://huggingface.co/join)

# ![](https://cdn-avatars.huggingface.co/v1/production/uploads/65df9200dc3292a8983e5017/Vs5FPVCH-VZBipV3qKTuy.png) 
[https://huggingface.co/nvidia](https://huggingface.co/nvidia)
[nvidia](https://huggingface.co/nvidia)  
/
[difix](https://huggingface.co/nvidia/difix)
Like  37
Follow
![](https://cdn-avatars.huggingface.co/v1/production/uploads/65df9200dc3292a8983e5017/Vs5FPVCH-VZBipV3qKTuy.png) NVIDIA 72.8k
Diffusers  
[https://huggingface.co/models?library=diffusers](https://huggingface.co/models?library=diffusers)
Safetensors  
[https://huggingface.co/models?library=safetensors](https://huggingface.co/models?library=safetensors)
DL3DV/DL3DV\-10K\-Sample  
English  
[https://huggingface.co/models?language=en](https://huggingface.co/models?language=en)
DifixPipeline  
[https://huggingface.co/models?other=diffusers%3ADifixPipeline](https://huggingface.co/models?other=diffusers%3ADifixPipeline)
arxiv: 2503.01774  
[Model card  ](https://huggingface.co/nvidia/difix)
Files Files and versions  
xet
[https://huggingface.co/nvidia/difix/tree/main](https://huggingface.co/nvidia/difix/tree/main)
Deploy   
Copy to bucket new   
Use this model  

### Instructions to use nvidia/difix with libraries, inference providers, notebooks, and local apps. Follow these links to get started.
- Libraries 
- [ Diffusers](https://huggingface.co/nvidia/difix?library=diffusers) 

How to use nvidia/difix with Diffusers:

```
pip install -U diffusers transformers accelerate
```

```
import torch
from diffusers import DiffusionPipeline

# switch to "mps" for apple devices
pipe = DiffusionPipeline.from_pretrained("nvidia/difix", dtype=torch.bfloat16, device_map="cuda")

prompt = "Astronaut in a jungle, cold color palette, muted colors, detailed, 8k"
image = pipe(prompt).images[0]
```
- Notebooks 
- [ Google Colab](https://huggingface.co/nvidia/difix/colab)  
- [ Kaggle](https://huggingface.co/nvidia/difix/kaggle)      
- [**Difix3D\+: Improving 3D Reconstructions with Single\-Step Diffusion Models**](https://huggingface.co/nvidia/difix#difix3d-improving-3d-reconstructions-with-single-step-diffusion-models) 
  - [📣📣 The commercially available model \(Fixer\) is now released here 📣📣](https://huggingface.co/nvidia/difix#%F0%9F%93%A3%F0%9F%93%A3-the-commercially-available-model-fixer-is-now-released-herehttpshuggingfaceconvidiafixer-%F0%9F%93%A3%F0%9F%93%A3) 
  - [Use the Difix Model](https://huggingface.co/nvidia/difix#use-the-difix-model) 
  - [Description:](https://huggingface.co/nvidia/difix#description) 
    - [License/Terms of Use:](https://huggingface.co/nvidia/difix#licenseterms-of-use)
    - [Use Case:](https://huggingface.co/nvidia/difix#use-case)
  - [Model Architecture](https://huggingface.co/nvidia/difix#model-architecture) 
  - [Input](https://huggingface.co/nvidia/difix#input) 
  - [Output](https://huggingface.co/nvidia/difix#output) 
  - [Software Integration](https://huggingface.co/nvidia/difix#software-integration) 
  - [Inference](https://huggingface.co/nvidia/difix#inference) 
  - [Difix Dataset](https://huggingface.co/nvidia/difix#difix-dataset) 
  - [Ethical Considerations:](https://huggingface.co/nvidia/difix#ethical-considerations) 
  - [ModelCard\+\+](https://huggingface.co/nvidia/difix#modelcard) 
    - [Bias](https://huggingface.co/nvidia/difix#bias)
    - [Explainability](https://huggingface.co/nvidia/difix#explainability)
    - [Privacy](https://huggingface.co/nvidia/difix#privacy)
    - [Safety & Security](https://huggingface.co/nvidia/difix#safety--security)
  - [Support](https://huggingface.co/nvidia/difix#support) 

# [](https://huggingface.co/nvidia/difix#difix3d-improving-3d-reconstructions-with-single-step-diffusion-models)  **Difix3D\+: Improving 3D Reconstructions with Single\-Step Diffusion Models**  

CVPR 2025 \(Oral\)
[**Code**](https://github.com/nv-tlabs/Difix3D) \| [**Project Page**](https://research.nvidia.com/labs/toronto-ai/difix3d/) \| [**Paper**](https://arxiv.org/abs/2503.01774)

## [](https://huggingface.co/nvidia/difix#%F0%9F%93%A3%F0%9F%93%A3-the-commercially-available-model-fixer-is-now-released-here-%F0%9F%93%A3%F0%9F%93%A3)  📣📣 The commercially available model \(Fixer\) is now released [here](https://huggingface.co/nvidia/Fixer) 📣📣  

## [](https://huggingface.co/nvidia/difix#use-the-difix-model)  Use the Difix Model  

Please visit the [Difix3D repository](https://github.com/nv-tlabs/Difix3D) to access all relevant files and code needed to use Difix

## [](https://huggingface.co/nvidia/difix#description)  Description:  

Difix is a single\-step image diffusion model trained to enhance and remove artifacts in rendered novel views caused by underconstrained regions of 3D representation. The technology behind Difix is based on the concepts outlined in the paper titled [DIFIX3D\+: Improving 3D Reconstructions with Single\-Step Diffusion Models](https://arxiv.org/abs/2503.01774).

Difix has two operation modes: 
- Offline mode: Used during the reconstruction phase to clean up pseudo\-training views that are rendered from the reconstruction and then distill them back into 3D. This greatly enhances underconstrained regions and improves the overall 3D representation quality.  
- Online mode: Acts as a neural enhancer during inference, effectively removing residual artifacts arising from imperfect 3D supervision and the limited capacity of current reconstruction models. 

Difix is an all\-encompassing solution, a single model compatible for both NeRF and 3DGS representations.

**This model is ready for research and development/non\-commercial use only.**

**Model Developer:** NVIDIA

**Model Versions:** difix

**Deployment Geography:** Global

### [](https://huggingface.co/nvidia/difix#licenseterms-of-use)  License/Terms of Use:  

The use of the model and code is governed by the NVIDIA License. Additional Information: [LICENSE.md · stabilityai/sd\-turbo at main](https://huggingface.co/stabilityai/sd-turbo/blob/main/LICENSE.md)

### [](https://huggingface.co/nvidia/difix#use-case)  Use Case:  

Difix is intended for Physical AI developers looking to enhance and improve their Neural Reconstruction pipelines. The model takes an image as an input and outputs a fixed image

**Release Date:** Github: [June 2025](https://github.com/nv-tlabs/Difix3D)

## [](https://huggingface.co/nvidia/difix#model-architecture)  Model Architecture  

**Architecture Type**: UNet

**Network Architecture**: A latent diffusion\-based UNet coupled with a variational autoencoder \(VAE\).

## [](https://huggingface.co/nvidia/difix#input)  Input  

**Input Type\(s\)**: Image

**Input Format\(s\)**: Red, Green, Blue \(RGB\)

**Input Parameters**: Two\-Dimensional \(2D\)

**Other Properties Related to Input**:
- Specific Resolution: \[576px x 1024px\] 

## [](https://huggingface.co/nvidia/difix#output)  Output  

**Output Type\(s\)**: Image

**Output Format\(s\)**: Red, Green, Blue \(RGB\)

**Output Parameters**: Two\-Dimensional \(2D\)

**Other Properties Related to Output**:
- Specific Resolution: \[576px x 1024px\] 

## [](https://huggingface.co/nvidia/difix#software-integration)  Software Integration  

**Runtime Engine\(s\)**: PyTorch

**Supported Hardware Microarchitecture Compatibility**:
- NVIDIA Ampere 
- NVIDIA Hopper 

**Note**: We are testing with FP32 Precision.

## [](https://huggingface.co/nvidia/difix#inference)  Inference  

**Acceleration Engine**: [PyTorch](https://pytorch.org/)

**Test Hardware**: 
- A100 
- H100 

**Operating System\(s\):** Linux \(We have not tested on other operating systems.\)

**System Requirements and Performance:** This model requires X GB of GPU VRAM. The following table shows inference time for a single generation across different NVIDIA GPU hardware:

| GPU Hardware |  Inference Runtime | 
|---|---|
| NVIDIA A100 |  0.355 sec | 
| NVIDIA H100 |  0.223 sec | 

## [](https://huggingface.co/nvidia/difix#difix-dataset)  Difix Dataset  
- Data Collection Method: Human 
- Labeling Method by Dataset: Human 
- Properties: Difix was trained, tested, and evaluated using the [DL3DV\-10k dataset](https://huggingface.co/datasets/DL3DV/DL3DV-10K-Sample), where 80% of the data was used for training, 10% for evaluation, and 10% for testing. DL3DV\-10K is a large\-scale dataset consisting of 10,510 high\-resolution \(4K\) real\-world video sequences, totaling approximately 51.2 million frames. The scenes span 65 diverse categories across indoor and outdoor environments. Each video is accompanied by metadata describing environmental conditions such as lighting \(natural, artificial, mixed\), surface materials \(e.g., reflective or transparent\), and texture complexity. The dataset is designed to support the development and evaluation of learning\-based 3D vision methods. 

## [](https://huggingface.co/nvidia/difix#ethical-considerations)  Ethical Considerations:  

NVIDIA believes Trustworthy AI is a shared responsibility and we have established policies and practices to enable development for a wide array of AI applications. When downloaded or used in accordance with our terms of service, developers should work with their internal model team to ensure this model meets requirements for the relevant industry and use case and addresses unforeseen product misuse. 

Please report security vulnerabilities or NVIDIA AI Concerns [here](https://www.nvidia.com/en-us/support/submit-security-vulnerability/)
---

## [](https://huggingface.co/nvidia/difix#modelcard)  ModelCard\+\+  

### [](https://huggingface.co/nvidia/difix#bias)  Bias  

| Field |  Response | 
|---|---|
| Participation considerations from adversely impacted groups [protected classes](https://www.senate.ca.gov/content/protected-classes) in model design and testing: |  None | 
| Measures taken to mitigate against unwanted bias: |  None | 

### [](https://huggingface.co/nvidia/difix#explainability)  Explainability  

| Field |  Response | 
|---|---|
| Intended Domain: |  Advanced Driver Assistance Systems | 
| Model Type: |  Image\-to\-Image | 
| Intended Users: |  Autonomous Vehicles developers enhancing and improving Neural Reconstruction pipelines. | 
| Output: |  Image | 
| Describe how the model works: |  The model takes as an input an image, and outputs a fixed image | 
| Name the adversely impacted groups this has been tested to deliver comparable outcomes regardless of: |  None | 
| Technical Limitations: |  The reconstruction relies on the quality and consistency of input images and camera calibrations; any deficiencies in these areas can negatively impact the final output. | 
| Verified to have met prescribed NVIDIA quality standards: |  Yes | 
| Performance Metrics: |  FID \(Fréchet Inception Distance\), PSNR \(Peak Signal\-to\-Noise Ratio\), LPIPS \(Learned Perceptual Image Patch Similarity\) | 
| Potential Known Risks: |  The model is not guaranteed to fix 100% of the image artifacts. please verify the generated scenarios are context and use appropriate. | 
| Licensing: |  The use of the model and code is governed by the NVIDIA License. Additional Information: [LICENSE.md · stabilityai/sd\-turbo at main](https://huggingface.co/stabilityai/sd-turbo/blob/main/LICENSE.md). | 

### [](https://huggingface.co/nvidia/difix#privacy)  Privacy  

| Field |  Response | 
|---|---|
| Generatable or reverse engineerable personal data? |  No | 
| Personal data used to create this model? |  No | 
| How often is the dataset reviewed? |  Before release | 
| Is there provenance for all datasets used in training? |  Yes | 
| Does data labeling \(annotation, metadata\) comply with privacy laws? |  Yes | 
| Is data compliant with data subject requests for data correction or removal, if such a request was made? |  Yes | 

### [](https://huggingface.co/nvidia/difix#safety--security)  Safety & Security  

| Field |  Response | 
|---|---|
| Model Application\(s\): |  Image Enhancement | 
| List types of specific high\-risk AI systems, if any, in which the model can be integrated: |  The model can be used to develop Autonomous Vehicles stacks that can be integrated inside vehicles. The Difix model should not be deployed in a vehicle. | 
| Describe the life critical impact \(if present\). |  N/A \- The model should not be deployed in a vehicle and will not perform life\-critical tasks. | 
| Use Case Restrictions: |  Your use of the model and code is governed by the NVIDIA License. Additional Information: LICENSE.md · stabilityai/sd\-turbo at main | 
| Model and dataset restrictions: |  The Principle of least privilege \(PoLP\) is applied limiting access for dataset generation and model development. Restrictions enforce dataset access during training, and dataset license constraints adhered to. | 

## [](https://huggingface.co/nvidia/difix#support)  Support  

**DiFix is a previous\-generation model:** please use [Fixer](https://github.com/nv-tlabs/Fixer) for active development and support.

**Usage questions and discussion:** please post on the [NVIDIA Developer Forum \(Omniverse / NuRec\)](https://forums.developer.nvidia.com/c/omniverse/platform/nurec/752).

**Code\-level bugs, documentation issues, and feature requests:** file a [GitHub issue](https://github.com/nv-tlabs/Fixer/issues/new/choose) for Fixer using the appropriate template.

**Security vulnerabilities:** use [NVIDIA's Vulnerability Disclosure Program](https://app.intigriti.com/programs/nvidia/nvidiavdp/detail). Do not file security issues publicly in this repository.

*The Hugging Face Community tab for this model card will be disabled on 08/10/2026. Please use the channels above.*
Downloads last month 16,304 
Safetensors[](https://huggingface.co/docs/safetensors)
Model size
0.9B params
Tensor type
F32 
·

Files info
Inference Providers 
[NEW](https://huggingface.co/docs/inference-providers)
This model isn't deployed by any Inference Provider. 
[🙋  Ask for provider support](https://huggingface.co/spaces/huggingface/InferenceSupport/discussions/new?title=nvidia/difix&description=React%20to%20this%20comment%20with%20an%20emoji%20to%20vote%20for%20%5Bnvidia%2Fdifix%5D(%2Fnvidia%2Fdifix)%20to%20be%20supported%20by%20Inference%20Providers.%0A%0A(optional)%20Which%20providers%20are%20you%20interested%20in%3F%20(Novita%2C%20Hyperbolic%2C%20Together%E2%80%A6)%0A)

## Dataset used to train nvidia/difix

#### DL3DV/DL3DV\-10K\-Sample
Updated Jan 5, 2024  •  1.36k  •  31 
[https://huggingface.co/datasets/DL3DV/DL3DV-10K-Sample](https://huggingface.co/datasets/DL3DV/DL3DV-10K-Sample)

## Spaces using nvidia/difix 4
![](https://cdn-avatars.huggingface.co/v1/production/uploads/65df9200dc3292a8983e5017/Vs5FPVCH-VZBipV3qKTuy.png) 
nvidia/difix
[https://huggingface.co/spaces/nvidia/difix](https://huggingface.co/spaces/nvidia/difix)
🚀
georgeniu/difix
[https://huggingface.co/spaces/georgeniu/difix](https://huggingface.co/spaces/georgeniu/difix)
🚀
wuutiing2/difix
[https://huggingface.co/spaces/wuutiing2/difix](https://huggingface.co/spaces/wuutiing2/difix)
🚀
Keem0/difix
[https://huggingface.co/spaces/Keem0/difix](https://huggingface.co/spaces/Keem0/difix)

## Paper for nvidia/difix

#### Difix3D\+: Improving 3D Reconstructions with Single\-Step Diffusion Models
Paper • 2503.01774 • Published Mar 3, 2025 •  44 
[https://huggingface.co/papers/2503.01774](https://huggingface.co/papers/2503.01774)
System theme   
Company
[TOS](https://huggingface.co/terms-of-service)
[Privacy](https://huggingface.co/privacy)
[About](https://huggingface.co/huggingface)
[Careers](https://apply.workable.com/huggingface/)
[Hugging Face](https://huggingface.co/)
Website
[Models](https://huggingface.co/models)
[Datasets](https://huggingface.co/datasets)
[Spaces](https://huggingface.co/spaces)
[Pricing](https://huggingface.co/pricing)
[Docs](https://huggingface.co/docs)
Inference providers allow you to run inference using different serverless providers.
