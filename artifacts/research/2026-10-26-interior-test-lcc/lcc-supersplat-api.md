[Skip to main content](https://blog.playcanvas.com/new-in-supersplat-introducing-the-new-publishing-api/#__docusaurus_skipToContent_fallback)
![PlayCanvas Logo](https://blog.playcanvas.com/img/playcanvas.png)
**PlayCanvas Blog**
[https://blog.playcanvas.com/](https://blog.playcanvas.com/)
[Discord Invite](https://discord.gg/RSaMRzg)
[GitHub](https://github.com/playcanvas)
Recent posts

### 2026
- [Snapchat Now Supports PlayCanvas Games](https://blog.playcanvas.com/snapchat-now-supports-playcanvas-games)
- [New in PlayCanvas Editor: A New Projects Home, and Projects over MCP](https://blog.playcanvas.com/new-in-playcanvas-editor-projects-home-and-mcp)
- [New in PlayCanvas Editor: Gravity Scale, the Inspector and Splat Budget Mode](https://blog.playcanvas.com/new-in-playcanvas-editor-gravity-scale-inspector-and-splat-budget)
- [From iPhone Video to Photorealistic 3D Digital Twin \- Developer Spotlight on Solaya](https://blog.playcanvas.com/from-iphone-video-to-photorealistic-3d-digital-twin-developer-spotlight-on-solaya)
- [New in PlayCanvas Editor: Joints, Parallax Occlusion and Splat LOD](https://blog.playcanvas.com/new-in-playcanvas-editor-joints-parallax-occlusion-and-splat-lod)
- [New in SuperSplat: Editor 3.0 Rebuilt on WebGPU](https://blog.playcanvas.com/new-in-supersplat-editor-3-0-rebuilt-on-webgpu)
- [New in SuperSplat: Introducing the New Publishing API](https://blog.playcanvas.com/new-in-supersplat-introducing-the-new-publishing-api)
- [Building the Grace Cathedral Experience](https://blog.playcanvas.com/building-the-grace-cathedral-experience)
- [New in SuperSplat: Vibe Code Splat Apps, 360° Video and splat\-transform 3.0](https://blog.playcanvas.com/new-in-supersplat-vibe-code-splat-apps)
- [New in SuperSplat: WebGPU and Streaming Bring Huge Performance Wins](https://blog.playcanvas.com/new-in-supersplat-webgpu-and-streaming-bring-huge-performance-wins)
- [New in SuperSplat: Software Attribution, Collision Generation and GPU\-Powered Histogram](https://blog.playcanvas.com/new-in-supersplat-software-attribution-collision-generation-and-histogram)
- [Turning a Gaussian Splat Into a Videogame](https://blog.playcanvas.com/turning-a-gaussian-splat-into-a-videogame)
- [New in SuperSplat: Downloadable Splats, Licenses and Social Links](https://blog.playcanvas.com/new-in-supersplat-downloadable-splats-licenses-and-social-links)
- [New in SuperSplat: Walk Mode, Streamed LOD and Easy Upload](https://blog.playcanvas.com/new-in-supersplat-walk-mode-streamed-lod-and-easy-upload)
- [Build Gaussian Splat Experiences with SuperSplat Studio](https://blog.playcanvas.com/build-gaussian-splat-experiences-with-supersplat-studio)

# New in SuperSplat: Introducing the New Publishing API
August 17, 2026 · 8 min read
[![Will Eastcott](https://github.com/willeastcott.png)](https://blog.playcanvas.com/authors/will)
[Will Eastcott](https://blog.playcanvas.com/authors/will)
CEO
[X](https://x.com/willeastcott)
[LinkedIn](https://www.linkedin.com/in/willeastcott/)
[GitHub](https://github.com/willeastcott)

Last month we shipped **[Vibe Code Splat Apps, 360° Video and splat\-transform 3.0](https://blog.playcanvas.com/new-in-supersplat-vibe-code-splat-apps)** — everything you need to turn a splat into a real, shippable app. Today we're opening SuperSplat up to the rest of the ecosystem. A new **publishing API** lets any capture app, scanner or training pipeline upload straight to superspl.at, and **three launch partners are live with it today**: **Teleport by Varjo**, **XGRIDS LCC Studio** and **LichtFeld Studio**. If you build splat software, you can ship the same thing.
[![Teleport by Varjo](https://blog.playcanvas.com/img/logo-teleport.png) Teleport by Varjo](https://superspl.at/explore/software/teleport-by-varjo)
[![XGRIDS LCC Studio](https://blog.playcanvas.com/img/logo-lcc-studio.png) XGRIDS LCC Studio](https://superspl.at/explore/software/lcc-studio)
[![LichtFeld Studio](https://blog.playcanvas.com/img/logo-lichtfeld-studio.svg) LichtFeld Studio](https://superspl.at/explore/software/lichtfeld-studio)

### 🔌 The Publishing API[​](https://blog.playcanvas.com/new-in-supersplat-introducing-the-new-publishing-api/#-the-publishing-api)

Until now, getting a splat onto SuperSplat meant exporting a file from whatever tool you trained it in, then uploading it by hand. For a large scene that's a multi\-gigabyte round trip — and it's the least interesting part of anyone's workflow.

The **SuperSplat API** removes that step entirely. It's a REST API that lets an application publish a splat directly to superspl.at on behalf of a signed\-in user, and inspect the scenes they already own. A few things worth knowing:
- **Authentication** uses a **PlayCanvas access token**, sent as a bearer token. Users generate one from the API Tokens section of their account page and paste it into the integration once. Some apps label the field "API key" or "API token" — it's the same thing. 
- **Uploads are resumable.** The API uses multipart uploads — a client opens a session, requests signed URLs for each part, pushes those parts straight to storage and then completes the upload. A dropped connection halfway through a 2 GB scene is no longer fatal. 
- **Scenes arrive unlisted** by default, so nothing goes public until the creator decides it should. 
- **Metadata comes along for the ride** — title, description and the `softwareTools` field that records which tools made the scene. Integrations can identify *themselves* separately through the optional `uploadClient` field. 

It's all documented in the new **[API & Integrations guide](https://developer.playcanvas.com/user-manual/supersplat/api-integrations/)**, with complete endpoint and schema detail in the **[SuperSplat API reference](https://developer.playcanvas.com/user-manual/api/supersplat/)**.

Now for the fun part — three tools that already use it.

### 🥽 Teleport by Varjo[​](https://blog.playcanvas.com/new-in-supersplat-introducing-the-new-publishing-api/#-teleport-by-varjo)

**[Teleport](https://get.teleport.varjo.com/)** is Varjo's 3D reconstruction platform. It takes phone images, 360 video or up to 10,000 drone images, and trains georeferenced Gaussian splats up to 100 million splats. It's API\-first, so teams wire it into their own pipelines. Finished scenes publish directly to SuperSplat.

You connect the integration once, under **Settings → Integrations**: paste in your access token and hit **Save**. From then on, every capture gets a **Publish capture** option — pick **SuperSplat** as the destination, give the scene a title and description, and hit publish.

And here's what Teleport manages with nothing but an iPhone. This is Turun Ekotori, a large second\-hand and recycling center in Turku, Finland — captured with the Teleport iOS app and published straight to SuperSplat:
tip

No lidar rig, no drone — just a phone. Splat by [jjames](https://superspl.at/user/jjames).

Browse everything the community is making with it in the **[Teleport by Varjo collection](https://superspl.at/explore/software/teleport-by-varjo)**.

### 📡 XGRIDS LCC Studio[​](https://blog.playcanvas.com/new-in-supersplat-introducing-the-new-publishing-api/#-xgrids-lcc-studio)

**[XGRIDS](https://www.xgrids.com/)** builds handheld lidar scanners, and **Lixel CyberColor Studio** — LCC Studio — is the desktop software that turns those scans into splats. Publishing is now built right in.

Open **My Models**, pick a model and publish it to **SuperSplat**. Paste your access token, choose a format and hit **Share**. **LCC2 \(SOG\)** is the recommended option, which hands you SuperSplat's compressed streaming format straight out of the box. When the upload finishes, a dialog gives you the live viewer link.

See what LCC Studio users are publishing in the **[LCC Studio collection](https://superspl.at/explore/software/lcc-studio)**.

### 💡 LichtFeld Studio[​](https://blog.playcanvas.com/new-in-supersplat-introducing-the-new-publishing-api/#-lichtfeld-studio)

**[LichtFeld Studio](https://lichtfeld.io/)** is a fast, open source Gaussian splat trainer — and this integration is one we built ourselves. The **[SuperSplat plugin for LichtFeld Studio](https://github.com/playcanvas/supersplat-lichtfeld-plugin)** is developed and maintained by the PlayCanvas team, MIT licensed and open source like everything else we ship.

The plugin adds a **SuperSplat** tab alongside Rendering and Training. Sign in once — your credentials are stored securely — then pick which splats to upload, set a title and description and hit **Upload to SuperSplat**. It exports to PLY or SOG, reports live progress and resumes if the connection drops.

Have a look at the **[LichtFeld Studio collection](https://superspl.at/explore/software/lichtfeld-studio)** to see what it's producing. And because we wrote it, the plugin doubles as the **reference implementation** of the API — if you're building your own integration, that repo is the fastest way to see the entire flow working end to end.

### 🤝 Why Build a SuperSplat Integration?[​](https://blog.playcanvas.com/new-in-supersplat-introducing-the-new-publishing-api/#-why-build-a-supersplat-integration)

If you make a capture app, a scanner, a trainer or a reconstruction pipeline, here's the case for wiring SuperSplat publishing into it.
- **You don't have to build a viewer.** Your users get a hosted, production\-grade [WebGPU splat renderer](https://blog.playcanvas.com/new-in-supersplat-webgpu-and-streaming-bring-huge-performance-wins) with shareable links and embeds. No renderer to write, no bandwidth to serve, no mobile GPU matrix to chase. 
- **You get a gallery that fills itself.** Every scene published through your integration carries your tool in its `softwareTools` metadata, which puts your logo chip on the scene page and files the scene into your own collection. Our launch partners already have collections filling up — [Teleport by Varjo](https://superspl.at/explore/software/teleport-by-varjo), [LCC Studio](https://superspl.at/explore/software/lcc-studio) and [LichtFeld Studio](https://superspl.at/explore/software/lichtfeld-studio) — and those pages grow every time one of your users hits publish. 
- **Permanent attribution in front of exactly the right audience.** That logo chip is a clickable credit on every scene your users share, seen by the people already out looking for splat tools. See **[Software Attribution](https://blog.playcanvas.com/new-in-supersplat-software-attribution-collision-generation-and-histogram)** for how it works. 
- **You finish your users' workflow instead of dead\-ending it.** Capture, train, publish, share. Nobody has to export a multi\-gigabyte PLY and re\-upload it by hand. 
- **Your output inherits everything SuperSplat can do.** SOG compression, streamed LOD, walk mode, Studio editing, 360° video and one\-click starter projects all apply to scenes that arrive through the API. 
- **The integration itself is small.** A REST API, a bearer token and a resumable upload — with our LichtFeld Studio plugin as a complete working example to crib from. 

Start with the **[API & Integrations guide](https://developer.playcanvas.com/user-manual/supersplat/api-integrations/)**. And if you're building an integration, come and tell us about it on [Discord](https://discord.com/invite/T3pnhRTTAY) — we'll help you get it shipped.

### 💚 Free and Open Source[​](https://blog.playcanvas.com/new-in-supersplat-introducing-the-new-publishing-api/#-free-and-open-source)

SuperSplat, SplatTransform and the PlayCanvas Engine are all **free and open source** under the MIT license. We believe the best tools for 3D on the web should be accessible to everyone.

If you're building a splat\-based application, we'd love for you to build it on PlayCanvas. Check out our repos on GitHub:
- [PlayCanvas Engine](https://github.com/playcanvas/engine) 
- [SuperSplat Editor](https://github.com/playcanvas/supersplat) 
- [SuperSplat Viewer](https://github.com/playcanvas/supersplat-viewer) 
- [SplatTransform](https://github.com/playcanvas/splat-transform) 

New to Gaussian splatting on PlayCanvas? Our [Gaussian Splatting documentation](https://developer.playcanvas.com/user-manual/gaussian-splatting/) is the best place to get started.

### 👂 We Want to Hear from You[​](https://blog.playcanvas.com/new-in-supersplat-introducing-the-new-publishing-api/#-we-want-to-hear-from-you)

What do you think of the new features? What would you like to see next? Come and join us on the [PlayCanvas Discord](https://discord.com/invite/T3pnhRTTAY) — it's where the world's best splat creators hang out and we'd love to have you there.

See you in there\!
**Tags:**
- [gaussian\-splats](https://blog.playcanvas.com/tags/gaussian-splats)
- [supersplat](https://blog.playcanvas.com/tags/supersplat)
- [api](https://blog.playcanvas.com/tags/api)
- [open\-source](https://blog.playcanvas.com/tags/open-source)
[Edit this page](https://github.com/playcanvas/blog/tree/main/blog/2026-08-17-new-in-supersplat-introducing-the-new-publishing-api.md)
Newer post
New in SuperSplat: Editor 3.0 Rebuilt on WebGPU
[https://blog.playcanvas.com/new-in-supersplat-editor-3-0-rebuilt-on-webgpu](https://blog.playcanvas.com/new-in-supersplat-editor-3-0-rebuilt-on-webgpu)
Older post
Building the Grace Cathedral Experience
[https://blog.playcanvas.com/building-the-grace-cathedral-experience](https://blog.playcanvas.com/building-the-grace-cathedral-experience)
- [🔌 The Publishing API](https://blog.playcanvas.com/new-in-supersplat-introducing-the-new-publishing-api/#-the-publishing-api)
- [🥽 Teleport by Varjo](https://blog.playcanvas.com/new-in-supersplat-introducing-the-new-publishing-api/#-teleport-by-varjo)
- [📡 XGRIDS LCC Studio](https://blog.playcanvas.com/new-in-supersplat-introducing-the-new-publishing-api/#-xgrids-lcc-studio)
- [💡 LichtFeld Studio](https://blog.playcanvas.com/new-in-supersplat-introducing-the-new-publishing-api/#-lichtfeld-studio)
- [🤝 Why Build a SuperSplat Integration?](https://blog.playcanvas.com/new-in-supersplat-introducing-the-new-publishing-api/#-why-build-a-supersplat-integration)
- [💚 Free and Open Source](https://blog.playcanvas.com/new-in-supersplat-introducing-the-new-publishing-api/#-free-and-open-source)
- [👂 We Want to Hear from You](https://blog.playcanvas.com/new-in-supersplat-introducing-the-new-publishing-api/#-we-want-to-hear-from-you)
Docs
- [User Manual](https://developer.playcanvas.com/user-manual/)
- [Tutorials](https://developer.playcanvas.com/tutorials/)
- [API Reference](https://api.playcanvas.com/)
Social
- [X](https://x.com/playcanvas)
- [LinkedIn](https://www.linkedin.com/company/playcanvas)
- [Facebook](https://www.facebook.com/playcanvas)
Community
- [Discord](https://discord.gg/RSaMRzg)
- [Forum](https://forum.playcanvas.com/)
- [Reddit](https://www.reddit.com/r/PlayCanvas/)
Resources
- [Blog](https://blog.playcanvas.com/)
- [GitHub](https://github.com/playcanvas)
- [YouTube](https://www.youtube.com/@playcanvas)
Copyright © 2026 PlayCanvas Ltd.
