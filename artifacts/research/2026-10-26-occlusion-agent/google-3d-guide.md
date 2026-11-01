[![Google AI Studio](https://www.gstatic.com/aistudio-static/mobile/ais-logo.svg)](https://aistudio.google.com/welcome)
[Pricing](https://aistudio.google.com/docs/pricing)
[Documentation](https://aistudio.google.com/docs)
[Case studies](https://aistudio.google.com/case-studies)
[Get started](https://aistudio.google.com/)
3D Workflow Guide

# Building 3D Games and Procedural Worlds with Gemini 4 Argon

How to choose the right 3D tools, six core workflows for building 3D scenes with Gemini 4 Argon, and a behind\-the\-scenes look at Desk Racer.
![Geneviève Huskens](https://www.gstatic.com/aistudio-static/editorial/page-msrgq2u0/genevieve-huskens.webp)
[Geneviève Huskens](https://aistudio.google.com/)
Staff Developer Relations Engineer
[@genevieve\_\_h](https://x.com/genevieve__h)
Published October 13, 2026
A highly detailed model of a Pagoda \(and surrounding environment\) built using loops with Gemini 4 Argon. A highly detailed model of a Pagoda \(and surrounding environment\) built using loops with Gemini 4 Argon.


Over the last several weeks, engineers and creative technologists across Google pushed **Gemini 4 Argon** across hundreds of 3D builds \- from historical architectural reconstructions and physics puzzle games to real\-time WebGPU shaders. What makes Argon capable for 3D comes down to three things:
1. 

**Long\-horizon autonomy**: With a 1M\-token context and output window, Argon can plan, write large multi\-file 3D codebases, and iterate autonomously for long stretches without losing track of the architecture.
2. 

**Native multimodality**: Like previous Gemini models, Argon can look at your photos, rough sketches, concept mocks, and its own rendered screenshots to understand 3D space, lighting, and proportions.
3. 

**Strong spatial and mathematical reasoning**: You provide the creative direction and visual taste, and Argon handles the 3D coordinate math, physics, camera optics, and mesh geometry under the hood.

We wrote this guide **both for humans and for agents** \- you can follow these steps yourself, or simply send the link to this guide to your coding agent and ask it to follow these best practices. Below, we cover how to choose the right tools, the six core workflows we used across our builds, and a behind\-the\-scenes look at how I put them into action to build *Desk Racer*.

## Choosing Your Gemini Tools


Before jumping into prompts, pick the right environment and 3D stack for what you are building:

|  Environment  |  Best For  |  Typical Stack  |
|---|---|---|
| **Google AI Studio** \(Build Mode\) | Self\-contained 3D web games, procedural scenes, interactive WebGPU shaders, and fast prototypes right in the browser. | Three.js \(WebGLRenderer or WebGPURenderer\), React Three Fiber, or raw WebGPU. |
| **Antigravity or Your Own Agentic IDE** | Multi\-file 3D games, long\-running /goal loops, parallel subagents, automated browser screenshot checks, and local Blender pipelines. | Vite \+ Three.js \+ Headless Blender MCP \+ headless browser screenshots. |
| **Gemini API** | Custom multi\-agent harnesses, automated 3D asset pipelines, and in\-game dynamic workflows. | gemini\-4\-argon with tool calling, paired with other genmedia models such as Nano Banana and Lyria. |

### Choosing your 3D Tools: Three.js vs. Headless Blender MCP

- 

**Three.js alone**: You can skip Blender entirely for most browser games, procedural landscapes, stylized or low\-poly worlds, architectural scenes, and shader\-heavy visuals \(like water, particles, or bioluminescent creatures\). Argon can generate surprisingly rich procedural geometry, lighting, and physics purely in Three.js code.
- 

**Pairing Three.js with Headless Blender MCP**: Bring in Blender when your scene needs bespoke, high\-detail hero models \- like sculpted vehicles, intricate architectural carvings, or custom objects \- that would look too blocky if built only from basic browser shapes. You don't need to know how to use Blender yourself: Argon can write Python scripts to model those hero objects in headless Blender, export .glb files, and load them straight into your Three.js scene for real\-time gameplay and lighting.

### 1. Align on creative direction first
Aligning on creative direction first with Gemini 4 Argon 


Gemini 4 Argon is intelligent enough to build a working 3D scene without a formal plan. However, because Argon can run autonomously for a very long time and execute in high detail, spending a few minutes aligning on creative direction upfront ensures all that long\-horizon effort goes toward executing the *exact* creative vision in your head.
- 

**Feed Argon visual references and ask it to generate Nano Banana mocks**: Because Argon is natively multimodal, you can start by dropping in phone photos of your real\-life scene, a sketch on a napkin, or a 15\-second walkaround video of a real object. If you don’t have these at hand, you can even ask Argon to do its own research on objects you want to render \- for instance, pulling together detailed reports and reference images of historical sites. Then, ask Argon to use **Nano Banana** to generate sample concept renders of the scene and key objects, and show them in chat for you to review. Reviewing 2D concept mocks together is the fastest way to zone in on lighting, scale, and mood before Argon writes complex 3D code. You can do this in AI Studio Playground, or directly in Antigravity.
- 

**Use `/grill\-me` to align on the plan**: In an agentic IDE like Antigravity, `/grill\-me` prompts Argon to interview you with clarifying questions to lock in your goals and ideal approach before writing any code. This can help you clarify your vision on camera perspective, scale and gameplay mechanics before touching code. In AI Studio Build, we're rolling out the ability for Gemini to ask you clarifying questions \- you can proactively prompt “Ask me questions about the plan first”.
- 

**Have Argon draft your `/goal` command**: In Antigravity, `/goal` sets Argon to work autonomously for a long time on a measurable task without drifting off course. Rather than writing the `/goal` prompt yourself, ask Argon to draft the `/goal` command for you once you've aligned on the plan. This is also a great place to tell Argon to use Nano Banana to generate seamless textures \(like natural wood grain, brushed metal, asphalt, or custom labels\) so your 3D surfaces don't look like flat plastic.

**Prompt:**
prompt Copy

/grill\-me We're going to build a 3D miniature racing game set on top of an office desk using these photos of my desk. Do NOT write any 3D code yet:
1. Ask me clarifying questions about the gameplay mechanics, lighting, and how we should handle the objects. 
2. Use Nano Banana to generate sample concept renders of the scene so we can lock in the visual style \(and plan to use Nano Banana to generate textures for specific items\). Your aim will be to replicate these renders in 3D, as accurately as possible. Show me these renders in a chat response or .md file for my review, don't proceed until I've signed off. 
3. Once I approve the concept renders and have answered your questions, write a comprehensive PLAN.md with clear milestones and give me a ready\-to\-run `/goal` command I can set to keep you running for a long time. 

### 2. Ask Argon to orchestrate parallel subagents
![Placeholder: Insert Workflow 2 image \(Ask Argon to orchestrate parallel subagents\)](https://www.gstatic.com/aistudio-static/editorial/building-3d-games-and-worlds-with-gemini-4-argon/f75fe594.gif)Gemini 4 Argon orchestrating subagents to build Desk Racer


3D worlds have a lot of distinct pieces \- terrain, buildings, foliage, props, lighting, and physics. Rather than having a single agent build every piece one after another in one giant file, in Antigravity you can ask Argon to orchestrate parallel subagents. This speeds up your tasks and helps you reach better output. Argon knows how to divide the architecture cleanly, align the subagents on shared coordinates, and merge their work back together.

**Prompt:**
prompt Copy
Split the work across parallel subagents, so each one builds a separate part of the world at the same time. Each should execute to the highest possible standard.

### 3. Tell Argon to invoke an adversarial critic subagent
Invoking an adversarial critic subagent with Gemini 4 Argon 


Telling an AI model to *"keep iterating until the 3D scene looks amazing"* often doesn’t work as well as you’d hope \- many models will stop after Round 2, pat themselves on the back, and declare their work complete.

To get the most out of Argon's long\-horizon runs, tell Argon to invoke a separate **Adversarial Critic subagent** at the end of each round. The Critic subagent can serve as a neutral party to give thorough critical feedback \- inspecting rendered screenshots from multiple camera angles, scoring the scene, and sending it back for fixes until it clears a high bar \(for example, a rating of 9/10 or higher\).

If you’re using Google AI Studio Build instead, you can drop screenshots of your scene in the chat and ask Gemini to critically evaluate the scene and identify key areas for improvement.

**Prompt:**
prompt Copy

Build this 3D scene over iterative rounds by invoking a strict Art Director Critic subagent after each round. At the end of every round, render 4 screenshots of the scene:
1. A 3/4 overview showing the overall composition
2. A close\-up showing surface details and textures
3. A low angle checking that objects sit cleanly on the ground without floating
4. A wireframe view proving clean 3D geometry to check for collisions

Have the Adversarial Critic subagent inspect all 4 screenshots to give thorough critical feedback—listing at least 3 specific visual flaws to fix \(such as boxy shapes, floating parts, clipped shadows, or flat materials\) and rating the scene out of 10. Keep iterating until the Critic rates the scene 9/10 or higher.

### 4. Let Argon build the tools to keep you in the art director's seat
![Placeholder: Insert Workflow 4 image \(Let Argon build the tools to keep you in the art director's seat\)](https://www.gstatic.com/aistudio-static/editorial/building-3d-games-and-worlds-with-gemini-4-argon/57248b7e.webp)Gemini 4 Argon built a detailed lighting control panel to let me pick the ideal settings across a range of light sources


While an adversarial critic subagent is great for catching technical flaws and pushing geometric detail, diagnostic screenshots and live controls give you a chance to give feedback about your personal creative vision that a subagent may not pick up on. Two lightweight tools can make human art direction really easy:
- 

**A live screenshot gallery \(`progress.html`\)**: Ask Argon to save screenshots after each milestone into a simple HTML page, so you can review how the scene is evolving and nudge the creative direction whenever you spot something you want to change.
- 

**Custom controls for lighting, textures, and camera angles**: We've found it really helpful to ask Argon to build precise on\-screen controls \(like sliders for sun angle, light intensity, material roughness, and camera distance\). These let you make quick visual tweaks in real time to figure out your ideal preferences. You can then copy your preferred settings as JSON \(or screenshot them\), have Argon hardcode them into the scene, and remove the controls before shipping your result

**Prompt:**
prompt Copy
1. After each milestone, save screenshots from our main camera angles into a `progress.html` gallery so I can review the creative direction and give feedback. Clearly title all images and versions.  
2. Build an on\-screen control panel with sliders for the lighting, textures, and camera angles—plus a "Copy Settings as JSON" button—so I can tweak the look interactively. Once I paste back the JSON of my preferred settings, bake those values in as the permanent defaults. We'll remove the control panel in a subsequent step. 

### 5. Use Nano Banana to Improve 3D Renders
![A 3D scene before and after using Nano Banana as a reference target render ](https://www.gstatic.com/aistudio-static/editorial/building-3d-games-and-worlds-with-gemini-4-argon/6b0b2e50.gif)A 3D scene before and after using Nano Banana as a reference target render


Pushing an existing 3D scene toward photorealism by tweaking lighting and material numbers in the dark can stall, because the model lacks a concrete visual target matched to your exact camera framing. To fix this, you can use **Nano Banana** to create a photorealistic target version of your current scene, and then let Argon upgrade the 3D code to match it

**1. Generate realistic target renders with Nano Banana**: Have Argon take clean screenshots of your current 3D scene from a few key camera angles \- making sure to hide all UI buttons, sliders, and HUD text first so the image model doesn't mistake them for floating signs in the 3D world. Pass each screenshot to Nano Banana to generate a 2K photorealistic version that upgrades the lighting, surface textures, water, and atmosphere while keeping your exact camera angle and layout intact:
prompt Copy

Hide all UI controls and HUD overlays, then capture clean screenshots of our 3D scene from 3–5 key camera viewpoints. Pass each screenshot to Nano Banana at 2K resolution with this prompt:

"Transform this 3D viewport screenshot into a photorealistic render with natural lighting, realistic surface textures, and atmospheric depth. Keep the exact same camera angle, composition, and architectural layout so it can be used as a 1:1 visual reference target."


**2. Have Argon replicate the target renders in 3D code**: Feed those Nano Banana renders back to Argon alongside your current 3D screenshots. Ask Argon to compare them side by side, identify the visual differences, and iteratively upgrade the real 3D geometry, materials, and lighting until the live scene matches the target renders. Prompt:
prompt Copy
Compare our current 3D screenshots side by side against the new 2K Nano Banana target renders. Identify the visual differences across lighting, shadows, surface textures, foliage, water, and atmosphere, then iteratively upgrade our real 3D geometry, shaders, and materials until the live scene matches the target renders across every viewpoint \(without pasting the 2D images as flat backgrounds\).

### 6. For your most complex builds, ground proportions with a 2D plan first
![Placeholder: Insert Workflow 6 image \(Ground proportions with a 2D plan first\)](https://www.gstatic.com/aistudio-static/editorial/building-3d-games-and-worlds-with-gemini-4-argon/b76f7b2e.webp)Target floor plans and visual reference guides built by Argon


Finally \- you don't need this step for most 3D projects. However, if you want to render a real\-world subject with high accuracy or build something that is spatially very difficult to execute, asking Argon to create a 2D spatial guide before building 3D shapes can prevent proportions from drifting.
- 

**For multi\-room interiors and complex architecture**: Ask Argon to generate a top\-down 2D floorplan with meter measurements first \(for instance, as an `.svg` file\) to verify that rooms, columns, and pathways are laid out as you have in mind, and then extrude the 3D world from that floorplan.
- 

**For photorealistic renders**: Ask Argon to write a quick script that overlays a numbered `X/Y` grid on top of your reference photos so it can read off exact proportions and feature alignments before modeling.
- 

**For recreating exact photos in 3D**: Ask Argon to calculate the camera angle and horizon line from the photo first so the 3D scene lines up 1:1 with the original framing before the viewer flies inside it.

**Prompt:**
prompt Copy
Look at these reference photos. Because this build needs to be spatially exact, do not generate 3D meshes yet. First, generate a top\-down 2D floorplan as an `.svg` file with meter dimensions \(and overlay a numbered X/Y grid on the reference photos\) to map out the exact size and position of every major element. Once we verify the 2D proportions, use those coordinates to build the 3D scene.

## Putting it all together: How I built Desk Racer
How I built Desk Racer with Gemini 4 Argon 


While testing Gemini 4 Argon ahead of launch, its spatial reasoning stood out immediately \- so I wondered if I could turn my own desk into a playable go\-kart game. Here’s how I got to my result:
1. 

**Aligning with desk photos, Nano Banana mocks, and /grill\-me**: I uploaded photos of my desk and ran /grill\-me, asking Argon to interview me, use Nano Banana to mock up the track design and item textures, and output a plan with a /goal command. Early mocks helped me steer the look toward dramatic lighting, textured tracks, and oversized desk objects so the player felt tiny.

Prompt:
prompt Copy

Hi\! I’d like you to build a 3D racing game on top of my desk. Here are pictures of my desk.

I want you to use whichever 3D tools are most suitable to create a playable go\-cart track that swerves around the items on my desk.
- you should use nano banana to render mocks of the track design, pass them back to me in a chat response or .md file, and wait for my approval
- you may use nano banana to render textures for specific items
- you should launch subagents to help with the project
- you should first make a very comprehensive plan with tasks and milestones

/grill\-me ask me questions, then when you're done, give me a plan that I can review and a /goal I can set to keep you running for a long time.

1. 

**Executing with `/goal` and subagents**: Once the creative renders looked good to me, I ran the `/goal` command Argon drafted. It orchestrated parallel subagents across Blender MCP and [Three.js](https://threejs.org/) \- even running mathematical intersection checks so all 68 coaster pillars landed flush on my desk and props without clipping through the surface.
2. 

**Looping toward higher ambition**: After the first playable build, I kept setting more ambitious goals \- pushing driving physics, object fidelity, video\-game lighting, and even expanding the scene to render the rest of my bedroom around the desk. Argon verified each iteration with automated screenshots before passing it back to me.
3. 

**Fine\-tuning scale from screenshot checkpoints**: Looking at early screenshots, I realized my initial `1:87` scale made the kart feel cramped on the race track Argon had designed. In one prompt, I asked Argon to shift to **`1:150` scale** while moving the chase camera closer \- keeping the kart the exact same size on screen while making the road feel nearly twice as wide and the desk objects tower overhead. Argon executed this change perfectly in one shot.

## Availability & Next Steps


You can start building with **Gemini 4 Argon** today across Google’s developer platforms:
- 

**Google AI Studio:** Test prompts in [Playground](https://aistudio.google.com/) or build full\-stack apps in [Google AI Studio Build](https://aistudio.google.com/build) \(available to developers with Google AI Ultra plans or paid Gemini API keys\).
- 

**Gemini API:** Use `gemini\-4\-argon` in the [Interactions API](https://aistudio.google.com/docs) with day\-one support across the `google\-genai` SDKs and in [Managed Agents](https://ai.google.dev/gemini-api/docs/custom-agents).
- 

**Google Antigravity:** For Google AI Ultra subscribers, select **Gemini 4 Argon** \(`gemini\-4\-argon`\) as your active model in [Google Antigravity](https://antigravity.google/) for complex planning, `/goal` runs, and multi\-agent orchestration.
- 

**Developer Documentation & Launch Apps:** Read the [Gemini 4 Argon: Developer Guide](https://aistudio.google.com/learn/gemini-4-argon-developer-guide) and the [Gemini 4 Argon documentation](https://aistudio.google.com/docs/latest-model), or try and remix our [interactive 3D launch apps](https://aistudio.google.com/learn/gemini-4-argon-showcase).
- 

**Gemini API skill:** Install the [`gemini\-api\-dev` skill](https://aistudio.google.com/docs/coding-agents#gemini-api-dev) in your coding agent and ask it to migrate your codebase to `gemini\-4\-argon`.

## Try Gemini 4 Argon
Test prompts in Playground or create apps in Build.
[Playground](https://aistudio.google.com/prompts/new_chat?model=gemini-4-argon)
[Build](https://aistudio.google.com/build)

### Related guides
Build with Gemini 4 Argon Overview & starter prompts
[https://aistudio.google.com/learn/gemini-4-argon](https://aistudio.google.com/learn/gemini-4-argon)
Gemini 4 Argon Builders Showcase Play & remix all 14 starter apps
[https://aistudio.google.com/learn/gemini-4-argon-showcase](https://aistudio.google.com/learn/gemini-4-argon-showcase)
Developer guide \(API & code\) thinking\_level, Long Decode & SDKs
[https://aistudio.google.com/learn/gemini-4-argon-developer-guide](https://aistudio.google.com/learn/gemini-4-argon-developer-guide)

Start exploring and building with Google’s latest models.
[Sign up and get started](https://aistudio.google.com/apps)

#### Models
[Gemini 3](https://aistudio.google.com/models/gemini-3)
[Nano Banana](https://aistudio.google.com/models/nano-banana)
[Veo](https://aistudio.google.com/models/veo-3)
[Lyria](https://aistudio.google.com/models/lyria)
[TTS](https://aistudio.google.com/models/gemini-tts)
[Transcribe](https://aistudio.google.com/models/transcribe)

#### Product
[API key](https://aistudio.google.com/api-keys)
[App gallery](https://aistudio.google.com/apps)
[Documentation](https://aistudio.google.com/docs)
[Pricing](https://aistudio.google.com/docs/pricing)

#### Capabilities
[Live API](https://aistudio.google.com/live-api)
[Managed agents](https://aistudio.google.com/managed-agents)
[Vibe coding](https://aistudio.google.com/vibe-code)

#### Information
[Gemini app](https://gemini.google/about/)
[Privacy](https://policies.google.com/privacy)
[Terms](https://aistudio.google.com/docs/terms)
![Google AI Studio large logo](https://www.gstatic.com/aistudio-static/vibe_code/Google_AIS_Product_Lockup_RGB_Black.svg)
