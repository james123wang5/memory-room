[![Logo](https://docs.multiset.ai/~gitbook/image?url=https%3A%2F%2F3364986340-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Forganizations%252FlPGXi0JxunnVIiK2Enzo%252Fsites%252Fsite_63CAr%252Flogo%252F4UXPcmogbBRyB5EvGEo1%252Flogo-black.png%3Falt%3Dmedia%26token%3D92f5ea0c-8770-4b6a-843a-194cdd4947ff&width=260&dpr=3&quality=100&sign=6e0cf4d5d6c9138c3ec94d1d0d8edde1&sv=3)![Logo](https://docs.multiset.ai/~gitbook/image?url=https%3A%2F%2F3364986340-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Forganizations%252FlPGXi0JxunnVIiK2Enzo%252Fsites%252Fsite_63CAr%252Flogo%252FLyg9zabysHd8jJ8dllMK%252FNew-logo.png%3Falt%3Dmedia%26token%3D0c421a04-67b2-42e4-a96a-855daa78ded2&width=260&dpr=3&quality=100&sign=303f8b645832a472e15afeb459bf290e&sv=3)](https://docs.multiset.ai/)
⌘Ctrlk
[Developer Portal](https://developer.multiset.ai/)
[Demos](https://www.youtube.com/@MultiSetAI)
[Github](https://github.com/MultiSet-AI)
More
For the complete documentation index, see [llms.txt](https://docs.multiset.ai/llms.txt). This page is also available as [Markdown](https://docs.multiset.ai/fundamentals/third-party-scans/gaussian-splat/xgrids-gaussian-splat.md).
Copy
On this page
1. [Fundamentals](https://docs.multiset.ai/fundamentals/maps)
2. [Third Party Scans](https://docs.multiset.ai/fundamentals/third-party-scans)
3. [Gaussian Splat](https://docs.multiset.ai/fundamentals/third-party-scans/gaussian-splat)

# Xgrids Gaussian Splat Export

Export a Gaussian Splat from Xgrids Lixel CyberColor for use with Multiset VPS.

All Xgrids scanners \(K1, K2, PortalCam, L2 Pro, L3 Pro\) can produce a Gaussian Splat reconstruction via **Lixel CyberColor**. This page walks through the export steps and how to package the output for upload to Multiset.

For the e57 point\-cloud workflow, see [Xgrids Scans](https://docs.multiset.ai/fundamentals/third-party-scans/xgrids-scans) instead. The steps below are specific to the **Gaussian Splat** upload path.

**Coordinate frame: right\-handed, Z up.** The Multiset Gaussian Splat pipeline expects the splat and its camera poses in a **right\-handed coordinate system with \+Z up**, which is exactly what Lixel CyberColor writes. Xgrids exports need no conversion. Splats from other tools do, see [Splats from Other Tools](https://docs.multiset.ai/fundamentals/third-party-scans/gaussian-splat/splats-from-other-tools).

#### You will need[Direct link to heading](https://docs.multiset.ai/fundamentals/third-party-scans/gaussian-splat/xgrids-gaussian-splat#you-will-need)
- 

An Xgrids scan \(K1, K2, PortalCam, L2 Pro, L3 Pro\).
- 

**Lixel CyberColor** \(v1.12.1 or newer\), available from Xgrids support downloads.

## Step 1: Generate the Gaussian Splat model[Direct link to heading](https://docs.multiset.ai/fundamentals/third-party-scans/gaussian-splat/xgrids-gaussian-splat#step-1-generate-the-gaussian-splat-model)
1. 

Open **Lixel CyberColor** and click **Create** to start a new model.
2. 

Choose **Single Model** as the reconstruction type.
3. 

Give the project a name \(e.g. `splats\_for\_vps`\) and set the **Scan data** path to your captured `portalcam\_capture\_data` folder.
4. 

In the **Parameters** panel on the right:
  - 

**Reconstruction Settings**: choose **Slow** for the best quality suitable for VPS.
  - 

**Maximum Gaussian Splats**: leave at the recommended value \(e.g. `28M`\) or raise it for larger scenes.
  - 

**Portability**: **On**. This is important, it produces a metric\-scaled, portable output that Multiset VPS can use.
  - 

Leave **Exposure Optimization** and **Low Memory Reconstruction** at defaults unless you have a specific reason to change them.
5. 

Click **Start** and let the reconstruction run.
![](https://docs.multiset.ai/~gitbook/image?url=https%3A%2F%2F3163433004-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252FokTDI7QVY04Zvb1pQ8Ry%252Fuploads%252Fgit-blob-c424a7fc8c5e512532708364b6ddd75b405fd8e3%252Fxgrids-gs-generate-model.png%3Falt%3Dmedia&width=768&dpr=3&quality=100&sign=32410729f65bb6d4923af2f7a70dc90a&sv=3)
Lixel CyberColor: Generate Model with Portability On and Slow reconstruction.

**Portability must be On.** Without it the Gaussian Splat will not be in metric scale and cannot be used for VPS.

## Step 2: Locate the exported `.ply`[Direct link to heading](https://docs.multiset.ai/fundamentals/third-party-scans/gaussian-splat/xgrids-gaussian-splat#step-2-locate-the-exported-.ply)

Once the reconstruction finishes, Lixel CyberColor writes the point cloud \(`.ply`\) outputs under the project's output directory:
Copy

```
<output>\ply-result\point_cloud\iteration_100\
```

Inside `iteration\_100` you will find files like:
- 

`point\_cloud.ply` \(**this is the file you upload**\)
- 

`point\_cloud\_1.ply`, `point\_cloud\_2.ply`, `point\_cloud\_3.ply` \(lower levels of detail\)
- 

`environment.ply`

Use the top\-level `**point\_cloud.ply**`, the full\-resolution Gaussian Splat.
![](https://docs.multiset.ai/~gitbook/image?url=https%3A%2F%2F3163433004-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252FokTDI7QVY04Zvb1pQ8Ry%252Fuploads%252Fgit-blob-f50678fb89cb79eef8f21e89bf12a1caa798ef67%252Fxgrids-gs-point-cloud-ply.png%3Falt%3Dmedia&width=768&dpr=3&quality=100&sign=58d90889a887a4add5a3ef5f06bbf52b&sv=3)
point\_cloud.ply inside `output\\ply\-result\\point\_cloud\\iteration\_100`.

## Step 3: Locate `poses.json`[Direct link to heading](https://docs.multiset.ai/fundamentals/third-party-scans/gaussian-splat/xgrids-gaussian-splat#step-3-locate-poses.json)

The camera poses used to train the splat are written by Lixel CyberColor at:
Copy

```
<DATA>\<project-id>\output\render\assets\poses.json
```
![](https://docs.multiset.ai/~gitbook/image?url=https%3A%2F%2F3163433004-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252FokTDI7QVY04Zvb1pQ8Ry%252Fuploads%252Fgit-blob-3101ad077fae7c9108b10414dcf6bd9f0c455a02%252Fxgrids-gs-poses-json.png%3Falt%3Dmedia&width=768&dpr=3&quality=100&sign=7454acba63c4ce56698f08fe721f7899&sv=3)
poses.json inside `output\\render\\assets`.

This file contains an array of per\-frame poses \(`ts`, translation `T`, rotation quaternion `R`\) that Multiset uses to register the splat against query images.

## Step 4: Zip `.ply` and `poses.json` together[Direct link to heading](https://docs.multiset.ai/fundamentals/third-party-scans/gaussian-splat/xgrids-gaussian-splat#step-4-zip-.ply-and-poses.json-together)

Multiset expects a **single zip** containing both files at the root:
Copy

```
my-xgrids-splat.zip
├── point_cloud.ply
└── poses.json
```

Select both files, right\-click → **Compress** \(macOS\) or **Send to → Compressed \(zipped\) folder** \(Windows\).

Do not place the files inside a subfolder inside the zip. Multiset reads them from the root of the archive.

## Step 5: Upload to Multiset[Direct link to heading](https://docs.multiset.ai/fundamentals/third-party-scans/gaussian-splat/xgrids-gaussian-splat#step-5-upload-to-multiset)

On the Multiset developer portal:
1. 

Open **Upload Existing Map**.
2. 

**Select Provider** → **XGRIDS**.
3. 

**File Format** → **Gaussian Splat \(ply and poses.json compressed in same zip\)**.
4. 

Click **Next** and answer the configuration prompts:
  - 

*Is the Gaussian Splat metric scaled?* → **Yes** \(because Portability was On in Step 1\).
  - 

*Indoor or outdoor?* → pick the one that matches your capture.
  - 

*Does the Gaussian Splat have poses.json?* → **Yes**.
5. 

Upload the zip from Step 4.
![](https://docs.multiset.ai/~gitbook/image?url=https%3A%2F%2F3163433004-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252FokTDI7QVY04Zvb1pQ8Ry%252Fuploads%252Fgit-blob-3bec0d7028c4a76e62d228eb5924a73cd82449f0%252Fmultiset-upload-gs-xgrids.png%3Falt%3Dmedia&width=768&dpr=3&quality=100&sign=d0cca76d9487b736872c687d175fdc9c&sv=3)
Upload Existing Map: XGRIDS plus Gaussian Splat file format.
![](https://docs.multiset.ai/~gitbook/image?url=https%3A%2F%2F3163433004-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252FokTDI7QVY04Zvb1pQ8Ry%252Fuploads%252Fgit-blob-f871004aeaef98ba9cb5f8ca001baf3b40b0b4db%252Fmultiset-upload-gs-config.png%3Falt%3Dmedia&width=768&dpr=3&quality=100&sign=bcf8901aeed58db439ac4f2b6d42e67c&sv=3)
Gaussian Splat configuration: metric\-scaled, indoor or outdoor, poses.json.

Once processing completes the map behaves like any other Multiset map: you can query it via the REST API, Unity SDK, or native SDKs.
PreviousGaussian Splat
[https://docs.multiset.ai/fundamentals/third-party-scans/gaussian-splat](https://docs.multiset.ai/fundamentals/third-party-scans/gaussian-splat)
NextSplats from Other Tools
[https://docs.multiset.ai/fundamentals/third-party-scans/gaussian-splat/splats-from-other-tools](https://docs.multiset.ai/fundamentals/third-party-scans/gaussian-splat/splats-from-other-tools)

Last updated 1 month ago

Was this helpful?
[X/Twitter](https://x.com/multiset_ai)
[LinkedIn](https://linkedin.com/company/multiset-ai)
[Discord](https://discord.com/tD6BBnjR5)
