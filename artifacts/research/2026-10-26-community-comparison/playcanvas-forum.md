[PlayCanvas Discussion](https://forum.playcanvas.com/)

# [Gaussian Splatting \+ PlayCanvas](https://forum.playcanvas.com/t/gaussian-splatting-playcanvas/33503) 
[Useful Resources  ](https://forum.playcanvas.com/c/useful-resources/18)   
[TRT](https://forum.playcanvas.com/u/TRT)     October 19, 2023, 11:49am   1  

Hi

I made a rough port of
[https://github.com/antimatter15/splat](https://github.com/antimatter15/splat)

It supports .PLY and .splat streaming.

In order to correctly render with the scene, I reversed the splat rendering and changed the blending. The results look identical but correctly merge with the scene geometry:
![](https://forum-files-playcanvas-com.s3.dualstack.eu-west-1.amazonaws.com/original/3X/d/8/d8abbbcd5b81718ff7261691576196fc3c5c551c.jpeg) 
[PlayCanvas](https://playcanv.as/p/22UuSvsW)
![](https://forum-files-playcanvas-com.s3.dualstack.eu-west-1.amazonaws.com/original/3X/3/b/3bdee8b46ceb9df2d7b3cb5164242f88e97cc90f.jpeg) 

### [Gaussian Splatting](https://playcanv.as/p/22UuSvsW)

A dirty port of https://github.com/antimatter15/splat to Playcanvas

Project:
[https://playcanvas.com/project/1150775/overview/gaussian\-splatting](https://playcanvas.com/project/1150775/overview/gaussian-splatting)

Known issues:
I query the gl device directly so it does change the blend/vertex/vbo attributes, so stuff after the splat may create artifacts. So next step would be to correctly using Playcanvas vertex buffers and shaders.

PS: You can just add any splat or ply Url to view scene from from the original paper, like
[https://playcanv.as/p/22UuSvsW?url=https://huggingface.co/cakewalk/splat\-data/resolve/main/train.splat](https://playcanv.as/p/22UuSvsW?url=https://huggingface.co/cakewalk/splat-data/resolve/main/train.splat)
6 Likes 
[LeXXik](https://forum.playcanvas.com/u/LeXXik)    October 19, 2023, 11:58am   2  

Thank you for sharing\! [@slimbuck](https://forum.playcanvas.com/u/slimbuck) is also working on splats recently.
[will](https://forum.playcanvas.com/u/will)    October 19, 2023, 4:29pm   3  

Yes. Check out the latest:
[twitter.com](https://twitter.com/willeastcott/status/1715009622262636833)

#### [Will Eastcott](https://twitter.com/willeastcott/status/1715009622262636833)
[@willeastcott](https://twitter.com/willeastcott/status/1715009622262636833)
3D Gaussian Splatting in @playcanvas\! 🪄 Try it out in the Model Viewer\! 👀 https://t.co/ErCJgKliQM \#webgl \#webgpu 
[](https://twitter.com/willeastcott/status/1715009622262636833)
1 Like 
[TRT](https://forum.playcanvas.com/u/TRT)     October 19, 2023, 6:15pm   4  

[@will](https://forum.playcanvas.com/u/will) looks like yours is based on the same shaders and sorting idea ![:slight\_smile:](https://forum.playcanvas.com/images/emoji/twitter/slight_smile.png?v=12) and it runs very smooth\!

I have some blue splats in the your implementation:
![image](https://forum-files-playcanvas-com.s3.dualstack.eu-west-1.amazonaws.com/optimized/3X/4/7/470718a6028a695ecfb692bc5ab32ebb628d16c8_2_345x218.jpeg)
image1393×883 75.9 KB
[image](https://forum-files-playcanvas-com.s3.dualstack.eu-west-1.amazonaws.com/original/3X/4/7/470718a6028a695ecfb692bc5ab32ebb628d16c8.jpeg)


I had this once when I was not copying all vbo data after sorting, not sure if the same case or just my GPU/OS/Browser.

I guess you sort by distance and re\-arrange the VBO by shuffling all vertex data around. I recently started to experiment with texelFetch in the vertex shader, suppliying all data as texture, just sort the particle indices \([@LeXXik](https://forum.playcanvas.com/u/lexxik) yes indices again ![:slight\_smile:](https://forum.playcanvas.com/images/emoji/twitter/slight_smile.png?v=12) \) and fetch vertex attributes, which means much less memory copying from the worker and less cpu/gpu transfer.

The speedup is not great for large scenes, maybe its now vertex shader bound, I have to do some benchmarks.

Have you tried something in this regard?
1 Like 
[mvaligursky](https://forum.playcanvas.com/u/mvaligursky)    October 20, 2023, 8:09am   5  

Yep, we store colors in the texture, and the rest of the data fill follow shortly.
[will](https://forum.playcanvas.com/u/will)     October 20, 2023, 10:08am   6  

[@TRT](https://forum.playcanvas.com/u/trt) Rather than work on separate implementations, it’d be cool to join forces\! If you feel that you would like to contribute, check out the Model Viewer codebase:
![](https://github.githubassets.com/favicons/favicon.svg) 
[GitHub](https://github.com/playcanvas/model-viewer)
![](https://forum-files-playcanvas-com.s3.dualstack.eu-west-1.amazonaws.com/optimized/3X/8/3/83820c9b9f549f4319942a9e6d2095a8943a5cbd_2_690x345.png)

### [GitHub \- playcanvas/model\-viewer: glTF 2.0 model viewer](https://github.com/playcanvas/model-viewer)

glTF 2.0 model viewer. Contribute to playcanvas/model\-viewer development by creating an account on GitHub.

Things are developing very rapidly, but it’d be great to build on the current momentum around this. ![:rocket:](https://forum.playcanvas.com/images/emoji/twitter/rocket.png?v=12)

BTW, I noticed the blue splats on iOS too yesterday. Doesn’t happen on my PC. Not entirely sure why that happens. Your suspicions could be correct…
[TRT](https://forum.playcanvas.com/u/TRT)    October 21, 2023, 10:53am   7  

Looks like you guys are already making great progress with indexed sorting. I need some time to dig into the viewer source.
1 Like 
[will](https://forum.playcanvas.com/u/will)    October 23, 2023, 10:06am   8  

Yes, we’re moving quite quickly. But if you spot any way to contribute, don’t hesitate to get involved. ![:smile:](https://forum.playcanvas.com/images/emoji/twitter/smile.png?v=12)
[Nelson\_Alves](https://forum.playcanvas.com/u/Nelson_Alves)    October 30, 2023, 11:38pm   9  

Hi [@will](https://forum.playcanvas.com/u/will)
How did you remove the points around your captured PLY file, just remaining the main element itself?
[will](https://forum.playcanvas.com/u/will)    October 31, 2023, 2:16pm   10  

We have a tool that you can use to delete unwanted splats. We’ll hopefully release a first version of it in the 24 hours or so. ![:smile:](https://forum.playcanvas.com/images/emoji/twitter/smile.png?v=12)
[Nelson\_Alves](https://forum.playcanvas.com/u/Nelson_Alves)    October 31, 2023, 2:38pm   11  

Great news\!\!\!
Thanks a lot\!\!\!
![:clap:](https://forum.playcanvas.com/images/emoji/twitter/clap.png?v=12) ![:clap:](https://forum.playcanvas.com/images/emoji/twitter/clap.png?v=12) ![:clap:](https://forum.playcanvas.com/images/emoji/twitter/clap.png?v=12)
[Matterfield](https://forum.playcanvas.com/u/Matterfield)    October 31, 2023, 6:02pm   12  

Will this be supported in editor? I’d love to do walkthroughs with audio…
[slimbuck](https://forum.playcanvas.com/u/slimbuck)    November 7, 2023, 6:30pm   13  

Our gaussian splat tool has been published to [Supersplat](https://playcanvas.com/super-splat)
2 Likes 
[Nelson\_Alves](https://forum.playcanvas.com/u/Nelson_Alves)    November 7, 2023, 6:37pm   14  

Great work\!
I saw a review of it last week and it is an amazing tool\!
1 Like 
[Jarod\_Abel](https://forum.playcanvas.com/u/Jarod_Abel)    November 7, 2023, 7:24pm   15  

I am looking for some example / documentation on how render a ply \(GS model\) in my own viewer \(playcanvas npm module\). I can load my model into playcanvas using the load= query parameter. But I want to know how to do it in javascript on my own app.

I have the simple example here running in my application, [GitHub \- playcanvas/engine: Fast and lightweight JavaScript game engine built on WebGL and glTF](https://github.com/playcanvas/engine). But I want to extend this to load a ply by url and render in the viewer.

I have been trying to reverse engineer the model viewer code, but its getting a bit too complicated. So, before I implement the whole entire model viewer in my app I am looking for some help with exactly what methods I need without extra stuff like the sidebar and icons.
[slimbuck](https://forum.playcanvas.com/u/slimbuck)    November 7, 2023, 8:33pm   16  

We are very busy adding splat support directly to the engine. We initially added support to model\-viewer so we could iterate quickly, but the next minor engine release will have the support instead.
4 Likes 
[will](https://forum.playcanvas.com/u/will)     November 13, 2023, 4:29pm   17  

Here’s a little update on where we are at with 3D Gaussian Splatting:

[https://twitter.com/willeastcott/status/1724029460263940320](https://twitter.com/willeastcott/status/1724029460263940320)
![](https://forum-files-playcanvas-com.s3.dualstack.eu-west-1.amazonaws.com/original/3X/c/1/c1331bbe0312c2c6481e530a986229c40c86b0aa.png) 
[linkedin.com](https://www.linkedin.com/feed/update/urn:li:activity:7129800582583726081/)
![](https://forum-files-playcanvas-com.s3.dualstack.eu-west-1.amazonaws.com/optimized/3X/f/7/f742581e98d1fc2a2e58907a3ddd39e25b0a2f60_2_690x380.jpeg)

### [Will Eastcott on LinkedIn: \#gaussiansplatting](https://www.linkedin.com/feed/update/urn:li:activity:7129800582583726081/)

Incredible progress building a high quality \#GaussianSplatting pipeline: 🤳 Capture with Luma AI or Polycam ✂ Edit in the PlayCanvas SuperSplat tool 👀 Render…

3DGS support is now merged into the engine codebase:
[github.com/playcanvas/engine](https://github.com/playcanvas/engine/pull/5785)

#### [3D Gaussian Splat support](https://github.com/playcanvas/engine/pull/5785) 
`playcanvas:main` ← `playcanvas:mv\-splats` 
opened 11:35AM \- 03 Nov 23 UTC 
[![mvaligursky](https://forum-files-playcanvas-com.s3.dualstack.eu-west-1.amazonaws.com/original/3X/3/6/36dea9b86b20502ac9f6c65589060ac84090e98f.png) mvaligursky ](https://github.com/mvaligursky)
[\+1551 \-3 ](https://github.com/playcanvas/engine/pull/5785/files)

\- initial version based on the code in https://github.com/playcanvas/model\-viewe[…](https://github.com/playcanvas/engine/pull/5785)r/ \- engine example \!\[Screenshot 2023\-11\-03 at 11 36 25\]\(https://github.com/playcanvas/engine/assets/59932779/bb68348b\-6be0\-4f01\-bf56\-24a81952ec5f\)

Exciting times\! ![:smile:](https://forum.playcanvas.com/images/emoji/twitter/smile.png?v=12)
4 Likes 
[Lodewijk\_Luijt](https://forum.playcanvas.com/u/Lodewijk_Luijt)    November 27, 2023, 5:03pm   18  

Hi,

I’m new here. came in searching for a way to present my splatts via the web.
Any news or resources I should check out?
I tried making a PlayCanvas modelviewer project but my .PLY was too big.

Thanks for any help.

Lolo
[mvaligursky](https://forum.playcanvas.com/u/mvaligursky)    November 27, 2023, 7:29pm   19  

[@slimbuck](https://forum.playcanvas.com/u/slimbuck)
[slimbuck](https://forum.playcanvas.com/u/slimbuck)    November 27, 2023, 7:42pm   20  

Hi [@Lodewijk\_Luijt](https://forum.playcanvas.com/u/lodewijk_luijt) , what do you mean your PLY was too big?
**[next page →](https://forum.playcanvas.com/t/gaussian-splatting-playcanvas/33503?page=2)** 
-   [Home ](https://forum.playcanvas.com/)   
-   [Categories ](https://forum.playcanvas.com/categories)   
-   [Guidelines ](https://forum.playcanvas.com/guidelines)   
-   [Terms of Service ](http://playcanvas.com/terms)   
-   [Privacy Policy ](http://playcanvas.com/privacy)   

Powered by [Discourse](https://www.discourse.org/), best viewed with JavaScript enabled
