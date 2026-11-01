[Skip to main content](https://www.reddit.com/r/GaussianSplatting/comments/1stjwtx/from_splat_to_videogame_how_i_made_a/?solution=3d321232afabf0ea3d321232afabf0ea&js_challenge=1&jsc_token=2824be10929bdc604753c70a67a1c3312ccd2ad04d9dc8b30e9f2617d3c0317d&jsc_orig_r=#main-content)                             From splat to videogame: how I made a photogrammetric scan walkable, shootable and populated with AI : r/GaussianSplatting           
[Home](https://www.reddit.com/)     
![](https://styles.redditmedia.com/t5_9ager1/styles/communityIcon_l0uc59dgrkub1.png?width=32&height=32&frame=1&auto=webp&s=34590d41a5c3790feeaaa55ff0a02fd783948740)
[Sign Up](https://www.reddit.com/register/)             [Log In](https://www.reddit.com/login/)      
[Skip to Sign up](https://www.reddit.com/r/GaussianSplatting/comments/1stjwtx/from_splat_to_videogame_how_i_made_a/?solution=3d321232afabf0ea3d321232afabf0ea&js_challenge=1&jsc_token=2824be10929bdc604753c70a67a1c3312ccd2ad04d9dc8b30e9f2617d3c0317d&jsc_orig_r=#left-sidebar-container) [Skip to Right Sidebar](https://www.reddit.com/r/GaussianSplatting/comments/1stjwtx/from_splat_to_videogame_how_i_made_a/?solution=3d321232afabf0ea3d321232afabf0ea&js_challenge=1&jsc_token=2824be10929bdc604753c70a67a1c3312ccd2ad04d9dc8b30e9f2617d3c0317d&jsc_orig_r=#right-sidebar-container)      
Back      
![](https://styles.redditmedia.com/t5_9ager1/styles/communityIcon_l0uc59dgrkub1.png?width=96&height=96&frame=1&auto=webp&s=193c05bbbd2076291a042af7bd73a4945b9de97b)  
Go to GaussianSplatting   
[https://www.reddit.com/r/GaussianSplatting/](https://www.reddit.com/r/GaussianSplatting/)
[r/GaussianSplatting](https://www.reddit.com/r/GaussianSplatting/)      6mo ago 

# From splat to videogame: how I made a photogrammetric scan walkable, shootable and populated with AI 
0:00    0:00 / 0:00          

Gaussian Splats give you photoreal environments for free. The problem: a splat is just a cloud of oriented blobs \- no triangles, no colliders, no navmesh, no lights. So I spent a couple of weeks fixing all of that in PlayCanvas project, on top of a gorgeous indoor scan from [Christoph Schindelar](https://superspl.at/user?id=schindelar3d), one of the best artists out there working with Gaussian Splats. The result is a browser FPS running on a real photogrammetric scene, with eight personality\-driven NPCs walking the actual geometry. 
-  

Play it \(WASD, mouse, left\-click\): [https://playcanv.as/p/qxGSuzYq/](https://playcanv.as/p/qxGSuzYq/) 
-  

Full writeup: [https://blog.playcanvas.com/turning\-a\-gaussian\-splat\-into\-a\-videogame](https://blog.playcanvas.com/turning-a-gaussian-splat-into-a-videogame) 
-  

Public PlayCanvas project \(fork it, every script is in there\): [https://playcanvas.com/project/1480299](https://playcanvas.com/project/1480299) 

What the post covers, step by step: 
-  

Grabbing a Creative Commons splat from SuperSplat's "Downloadable" filter. 
-  

Converting it to **Streamed LOD SOG** with `splat\-transform` so phones and slow connections don't stall on a multi\-million\-Gaussian scene. 
-  

Generating a **watertight collision mesh** straight from the splat with `splat\-transform \-K` \- it voxelizes the splat, flood\-fills the interior, and spits out a `.collision.glb` you can drop in as a static mesh rigidbody. No modeling, no cleanup. 
-  

Baking a **lightness probe grid** from the splat itself \(render 6 faces of a tiny cubemap per probe, average luminance, dump to JSON\). At runtime the weapon, NPCs and pickups bilinearly sample it and match the splat's lighting as you move between bright and dark rooms. 
-  

Building a **Recast navmesh** from that same collision GLB and loading `recast\-navigation` straight from esm.sh \- no bundler. 
-  

Giving the NPCs a **classic behavior tree** \(sequence/selector/condition/action in ~20 lines\) and plugging in a personality vector so the same tree produces wildly different agents: Sgt. Havoc pushes, Chicken retreats at 80% HP, Loot Goblin sprints across the map for a pickup, etc. 

Every piece of the stack is free and open source \- SuperSplat, splat\-transform, recast\-navigation, the PlayCanvas Engine, and the demo project itself. If you're sitting on a splat and wondering whether you can do more with it than spin a camera around, this should be a straight path. 

Happy to answer questions about any of the steps in the comments. 

If you want to keep poking at "splats into games" with the rest of us, come join the [PlayCanvas Discord](https://discord.com/invite/T3pnhRTTAY) \- that's where the splat\-creator community hangs out and where most of these conversations are happening right now. 
Upvote    568      Downvote       38    Go to comments          Share    
Best             
Search Comments  Expand comment search    

# Comments Section 

# People also ask about section 
People also ask about 
Best FPS games using Gaussian Splatting 
[https://www.reddit.com/search/?q=Best+FPS+games+using+Gaussian+Splatting&type=ai_search&ep=pdp_unit](https://www.reddit.com/search/?q=Best+FPS+games+using+Gaussian+Splatting&type=ai_search&ep=pdp_unit)
Best FPS games on iPhone 
[https://www.reddit.com/search/?q=Best+FPS+games+on+iPhone&type=ai_search&ep=pdp_unit](https://www.reddit.com/search/?q=Best+FPS+games+on+iPhone&type=ai_search&ep=pdp_unit)
Tips for boosting FPS in Zalith launcher 
[https://www.reddit.com/search/?q=Tips+for+boosting+FPS+in+Zalith+launcher&type=ai_search&ep=pdp_unit](https://www.reddit.com/search/?q=Tips+for+boosting+FPS+in+Zalith+launcher&type=ai_search&ep=pdp_unit)
Software for Gaussian splatting techniques 
[https://www.reddit.com/search/?q=Software+for+Gaussian+splatting+techniques&type=ai_search&ep=pdp_unit](https://www.reddit.com/search/?q=Software+for+Gaussian+splatting+techniques&type=ai_search&ep=pdp_unit)
How Gaussian splatting enhances digital art 
[https://www.reddit.com/search/?q=How+Gaussian+splatting+enhances+digital+art&type=ai_search&ep=pdp_unit](https://www.reddit.com/search/?q=How+Gaussian+splatting+enhances+digital+art&type=ai_search&ep=pdp_unit)

# Community Info Section 
r/GaussianSplatting 
[https://www.reddit.com/r/GaussianSplatting/](https://www.reddit.com/r/GaussianSplatting/)
![illuminati](https://emoji.redditmedia.com/mv60bklq1guz_t5_3nqvj/illuminati)    
Join  
GaussianSplatting 
Welcome to the hub for Gaussian Splatting Enthusiasts\! Share projects, WIPs, tools, launches, open source, demos, questions, VR, and discoveries. Please use a post flair\! ⚠️⚠️⚠️ Keep links clean\! Reddit may remove posts with suspicious links \(shops, LinkedIn, tracking, redirects\). Use direct URLs without tracking. If your post disappears, check your links and repost.⚠️⚠️⚠️ Be respectful, we're all humans here \(hopefully\!\) and help grow the community. Happy Splatting\! 🚀🚀🚀 
Public
-  [Home](https://www.reddit.com/?feed=home)  
-  [Popular](https://www.reddit.com/r/popular/)  
-  [News](https://www.reddit.com/news/)  
-  [Explore](https://www.reddit.com/explore/)  
-  [Best of Reddit](https://www.reddit.com/posts/2026/global/)  
-  [Best of Reddit in Portuguese](https://www.reddit.com/posts/2026/tl-pt-BR/)  
-  [Best of Reddit in German](https://www.reddit.com/posts/2026/tl-de/)  
-  [Reddit Rules](https://www.redditinc.com/policies/content-policy)  
-  [Privacy Policy](https://www.reddit.com/policies/privacy-policy)  
-  [User Agreement](https://www.redditinc.com/policies/user-agreement)  
-  [Accessibility](https://support.reddithelp.com/hc/sections/38303584022676-Accessibility)  
- [Reddit, Inc. © 2026. All rights reserved.](https://redditinc.com/)

Join the most real place on the internet 
Continue with Apple 
[](https://www.reddit.com/login/) [](https://www.reddit.com/register/)

By continuing, you agree to our [  User Agreement ](https://www.redditinc.com/policies/user-agreement) and acknowledge that you understand the [  Privacy Policy](https://www.redditinc.com/policies/privacy-policy). 
