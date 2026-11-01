Source: https://re3sim.github.io/


# RE3SIM: Generating High\-Fidelity Simulation Data via 
3D\-Photorealistic Real\-to\-Sim for Robotic Manipulation

We introduced **RE3SIM**, a novel Real\-to\-Sim\-to\-Real pipeline that integrates Gaussian splatting with NVIDIA Isaac Sim's PhysX engine, improving scene reconstruction and sim\-to\-real transfer for robotic manipulation tasks.


## Highlights: 
- [High\-fidelity geometry and vision](https://re3sim.github.io/#visual-comparison): small sim\-to\-real gaps in both geometry and visual aspects. 
- [Highly efficient data collection](https://re3sim.github.io/#real-to-sim-to-real-efficiency): scene reconstruction in ~2.5 minutes and simulation data at 100 episodes per 10 minutes. 
- [Zero\-shot sim\-to\-real transfer:](https://re3sim.github.io/#zero-shot-sim-to-real) limited simulation data brings high success rates. 


## Key Observation: 
- [Scaling law](https://re3sim.github.io/#larger-scale-sim-to-real): Increasing the simulation data scale can enhance the success rate until it converges at a high\-performance level. 
- [Mixing Sim\-Real](https://re3sim.github.io/#co-train-and-fine-tune): Co\-training real\-world data can integrate the characteristics of both datasets. 
---
[Xiaoshen Han](https://scholar.google.com/citations?hl=en&user=Mo8I5WMAAAAJ)
\*   [Junqiu Yu](https://re3sim.github.io/) \*   [Minghuan Liu](https://minghuanliu.com/) ^  [Yilun Chen](https://yilunchen.com/about/)^ †   [Xiaoyang Lyu](https://shawlyu.github.io/)   [Yang Tian](https://github.com/Nimolty?tab=overview&from=2024-01-01&to=2024-01-31)   
[Bolun Wang](https://re3sim.github.io/)   [Weinan Zhang](https://wnzhang.net/)†   [Jiangmiao Pang](https://oceanpang.github.io/)†   


Shanghai Jiao Tong University   Shanghai AI Lab  The University of Hong Kong

\*Equal contribution     ^Project lead     †Corresponding author 

IEEE International Conference on Robotics and Automation \(ICRA 2026\) 
[**  arXiv ](https://arxiv.org/abs/2502.08645)   [    Paper ](https://re3sim.github.io/re3sim.pdf)   [    Code ](https://github.com/OpenRobotLab/Re3Sim)   [    Video ](https://youtu.be/vbARimN1WO0)   [  **  Bilibili ](https://www.bilibili.com/video/BV1imNreSESo/)   [    Summary ](https://x.com/ericliuof97/status/1891524364656676984)   
---
---

# ➤ Real\-to\-Sim\-to\-Real for Diverse Robotic Manipulation Tasks 
![zero\-shot\-sim\-to\-real](https://re3sim.github.io/static/images/tasks.png) 

**Note:** Four tasks with individual policies are used to validate the effectiveness of RE3SIM. 

## Visual Comparison: Low Vision Gap

| Background Rendering |  PSNR |  SSIM | 
|---|---|---|
| **[Polycam](http://poly.cam/)** |  11.52 ± 1.40 |  0.34 ± 0.04 | 
| **[OpenMVS](https://github.com/cdcseacave/openMVS)** |  **13.40 ± 0.96** |  0.27 ± 0.03 | 
| **3DGS** |  **13.29 ± 1.11** |  **0.37 ± 0.04** | 

**Note:** We manually aligned the objects with those in the simulation, but noticeable pixel\-level discrepancies remain. The background alignment also has some pixel\-level deviations. These factors collectively lead to the relatively low PSNR and SSIM values of all methods, especially in the texture\-rich scene. 
![visual\-stack](https://re3sim.github.io/static/images/compare_web.png) 

**Note:** 3DGS outperforms Polycam in both RSNR and SSIM. Its PSNR is comparable to OpenMVS, but SSIM is notably higher. OpenMVS's reconstruction has cracks, causing an obvious sim\-to\-real gap. The qualitative and quantitative results demonstrate that RE3SIM is capable of producing high\-quality and well\-aligned reconstruction results, making zero\-shot sim\-to\-real transfer possible. 

## Zero\-Shot Sim\-to\-Real

**Note:** RE3SIM can generate high\-quality simulation data for training generalizable robotic policies by zero\-shot sim\-to\-real transfer. Here are the videos of the real\-world experiments of tasks pick and drop a bottle into the basket, place a vegetable on the board, stack blocks and clear objects on the table. All videos are played at normal speed. 

**   

**  Pick and drop a bottle into the basket  ** 

**   
**   

**  Place a vegetable on the board  ** 

**   
**   

**  Stack blocks  ** 

**   
**   

**  Clear objects on the table  ** 

**   

## Real\-to\-Sim\-to\-Real Efficiency

**Note: human effort in reconstruction. ** The table presents estimated reconstruction times at the table level. Additionally, we show the human effort for reconstructing an object with ARCode. 

| Input Types |  Video |  Images |  ARCode | 
|---|---|---|---|
| **Human Efforts \(s\)** |  51.5 |  84.5 |  60.5 | 

**Note: time cost for simulation data collection. ** Time needed to collect 100 episodes of simulation data for each task, using a machine equipped with 8 RTX 4090 GPUs. 

| Tasks |  Time Cost \(minutes\) | 
|---|---|
| Pick and drop a bottle into the basket |  12.35 | 
| Place a vegetable on the board |  13.78 | 
| Stack blocks |  6.45 | 

## Large\-Scale Sim\-to\-Real

**Note:** To push the limit of utilizing synthetic data for real\-world manipulation problems, we choose a clear objects on the table task and evaluate the generalizability of a policy trained on a large\-scale simulation dataset. 


**Note:** Doubling the data size often results in a large improvement in success rate until convergence. 
![large\-scale\-sim\-to\-real](https://re3sim.github.io/static/images/scale_results.png) 

**Note:** A large dataset enables the policy to exhibit some robustness to variations in objects or lighting. 
![large\-scale\-sim\-to\-real](https://re3sim.github.io/static/images/dataset_size_ablation.png) 
---

# ➤ Comparison over Simulated and Real Data

**Note:** Real\-world and simulation data often exhibit variations in both distribution and quality, because of differences in scene initialization methods and trajectory preferences between human operators and the rule\-based policy. 

## Object Location
![data\-distribution](https://re3sim.github.io/static/images/data_distribution.png) 


**Note:** Despite efforts to randomize object positions, data distributions differ slightly due to the challenge of achieving true randomness in real\-world settings. 

## Data Quality
![data\-quality](https://re3sim.github.io/static/images/data_quality.png) 
- • In simulation, the motion planner tends to take the shortest path, resulting in shorter trajectories but with larger angular variations.  
- • Longer trajectories may include more pauses, which can negatively impact model training due to reduced action continuity. This is more often observed in real\-world data.  
---

# ➤ Co\-training and Fine\-tuning

**Note:** Left: Kernel Density Estimate \(KDE\) of the Euclidean distance traveled by the robotic arm's end effector between adjacent time steps. Right: The number of time steps taken by the robotic arm from the start of movement to the first closure of the gripper. "Sim" and "Real" indicate models trained on simulated and real data, respectively, while "Co\-train" and "Fine\-tune" refer to models trained on a mix of data and pre\-trained with real data, respectively. 
![joint\-train](https://re3sim.github.io/static/images/delta_distances_distribution.png) 
![close\-gripper\-index](https://re3sim.github.io/static/images/close_gripper_index.png) 

**Note:** The distribution of simulation and real data is generally similar. The data generated by our method can be integrated into real data through pretraining or co\-training, introducing new features without causing the training process to collapse. 
---

# ➤ More Details

## Framework

RE3SIM leverages 3D reconstruction and a physics\-based simulator, providing small 3D gaps that enable large\-scale simulation data generation for learning manipulation skills via sim\-to\-real transfer. We first reconstruct the background and the objects of the scene separately, and then align them with the robot in the real world. Then high\-quality simulation data can be generated in the reconstructed simulator, which can be used to train a policy that can be transferred to the real world. 
![pipeline](https://re3sim.github.io/static/images/pipeline.png) 

## More Visual Results in Simulation

Rendering results of place a vegetable on the board task. 
![visual\-place](https://re3sim.github.io/static/images/place.png) 

Rendering results of stack blocks task. 
![visual\-stack](https://re3sim.github.io/static/images/stack.png) 

Rendering results of clear objects on the table task. 
![visual\-multi\-item](https://re3sim.github.io/static/images/multi-items.png) 
[](https://re3sim.github.io/re3sim.pdf)
[](https://github.com/OpenRobotLab/Re3Sim)

The template is borrowed from [Nerfies](https://github.com/nerfies/nerfies.github.io) 
