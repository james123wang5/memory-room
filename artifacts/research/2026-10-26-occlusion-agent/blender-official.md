[Join the **official Blender Survey 2026**\! 🧡](https://www.blender.org/news/blender-survey-2026/)  
[blender.org homepage](https://www.blender.org/)
Toggle navigation **  
-  [Roadmap](https://www.blender.org/roadmap/)  
-  [Download](https://www.blender.org/download/)  
-  [Support](https://www.blender.org/support/)  
-  [Get Involved](https://www.blender.org/get-involved/)  
-  [About](https://www.blender.org/about/)  
-  [Jobs](https://www.blender.org/jobs/)  
-  [Store](https://store.blender.org/)  
-  [** Donate](https://fund.blender.org/?utm_medium=www-nav)  
-  [ Blender Lab ](https://www.blender.org/lab/)  
-  **  
-  [ MCP Server ](https://www.blender.org/lab/mcp-server/)  
-  [Roadmap](https://www.blender.org/roadmap/)  
-  [Download](https://www.blender.org/download/)  
-  [Support](https://www.blender.org/support/)  
-  [Get Involved](https://www.blender.org/get-involved/)  
-  [About](https://www.blender.org/about/)  
-  [Jobs](https://www.blender.org/jobs/)  
-  [Store](https://store.blender.org/)  
-  [** Donate](https://fund.blender.org/?utm_medium=www-nav)  
-  [ Blender Lab ](https://www.blender.org/lab/)  
-  **  
-  [ MCP Server ](https://www.blender.org/lab/mcp-server/)  

# MCP Server 

A lightweight MCP \(Model Context Protocol\) server for Blender. It offers a natural language interface with Blender’s Python API, improving access to documentation, and allowing users to explore and understand complex setups.

For technical details and documentation about the architecture check the [source code](https://projects.blender.org/lab/blender_mcp).

**Security Warning**
The MCP server will execute LLM generated code in Blender without any guards in place to protect your data from removal or being sent to a remote location. To keep your data safe it is recommended to use a virtual machine, or a system without access to sensitive information.

## Installation

**Blender does not have any built\-in functionality for connecting to LLMs.**

In order for Blender to connect with LLMs, **three external tools must be manually downloaded, installed, and run**.

Requirements:
1. [Blender 5.1](https://www.blender.org/download/) or newer 
2. [Add\-on](https://www.blender.org/lab/mcp-server/#addon) 
3. [LLM Client](https://www.blender.org/lab/mcp-server/#llm-client) 
4. [MCP Server](https://www.blender.org/lab/mcp-server/#mcp-server) 
---

### Add\-on

In order to interact with your Blender session you need to install a specific add\-on for the MCP Server integration.
[** Drag and Drop into Blender ](https://projects.blender.org/lab/blender_mcp/releases/download/v1.0.3/mcp-1.0.3.zip?repository=https%3A%2F%2Flab.blender.org%2F&blender_version_min=5.1.0)

…or [download](https://projects.blender.org/lab/blender_mcp/releases/download/v1.0.3/mcp-1.0.3.zip?repository=https%3A%2F%2Flab.blender.org%2F&blender_version_min=5.1.0) and [Install from Disk](https://docs.blender.org/manual/en/latest/editors/preferences/extensions.html#install)

If you drag & drop into Blender **you will need to do it twice**. First to add the Blender Lab repository, secondly to install the add\-on itself. This method allows you to receive update notifications whenever a new version of this add\-on is available.
---

### LLM Client

MCP Servers follow a well defined standard and are compatible with a myriad of clients. Please follow the [LLama.cpp](https://projects.blender.org/lab/blender_mcp/wiki/Llama.cpp) documentation, or install a LLM client of your preference.
---

### MCP Server

There are different ways to install the MCP Server depending on your LLM client capabilities.
- **MCP Bundle**: For newer clients that support `.mcpb` files, download the [latest package](https://projects.blender.org/lab/blender_mcp/releases) from the release page. *Llama.cpp doesn’t support this yet.* 
- **MCP Server**: To install from the source code check the [Llama.cpp documentation](https://projects.blender.org/lab/blender_mcp/wiki/Llama.cpp#mcp-server-installation) or the [setup instructions](https://projects.blender.org/lab/blender_mcp/wiki/Setup). 

## Running

Once if you have your MCP Server setup within your LLM Client, you can start to explore your Blender scenes.
![](https://www.blender.org/wp-content/uploads/2026/03/llama_cpp-1280x514.webp)  llama.cpp web interface running the blender\-mcp server.
---

### Example 1: Scene Analysis

MCP can be used to programatically analyze the scene for performance bottomnecks. Take for instance the [Classroom demo file](https://download.blender.org/demo/test/classroom.zip):
![](https://www.blender.org/wp-content/uploads/2026/03/classroom-1280x575.webp)  Classroom demo file.

This scene is one of the [Blender benchmark](https://opendata.blender.org/) files. The reason those files are in the benchmark is because they are a good representation of real production files created by artists. And it is no surprise that it can contain objects prone to be optimized.

While checking for polygon count is often enough, even more interesting is to plot the number of polygons based on how big they show on the final render. This can be obtained with the following prompt.

`Analyze the scene and list the outliers: objects with highest polygon count but smaller size from the camera point of view.`

The plotted resulting data shows clearly two objects which stand out from the rest: `alphabet` and `coat 1`:
![Graph analysis of the polycount per screen area](https://www.blender.org/wp-content/uploads/2026/03/outlier.webp)  Graph analysis of the polycount per screen area for the classroom demo scene.

The `alphabet` object has 20k polygons. Because of its flat disposition it could be replaced by a texture with little downside to the final result. The `coat 1` object has 37k polygons due to its Subsurf modifier. Lowering the subdivision level could alleviate the scene, if memory was the bottleneck in your system. 
![](https://www.blender.org/wp-content/uploads/2026/03/outlier-1-1280x575.webp)  The alphabet sits at the back of the scene and could easily be replaced by a texture. The coat is also far enough that could have its mesh simplified.

**How reliable are those results?**

The initial analysis returned by the LLM only considered the modifiers which influenced the viewport. The `coat 1` object has a Solidify modifier which doubles its poly count, making it an even more outlier. And although this scene had no Simplify enabled, this settings would have also affected the final analysis.
---

### Example 2: Various Prompts

Those are some of the other tested use cases. You will need to paste the entire “Prompt” content for them to work. As a start point you should use the corresponding demo file. The sucess of the operation will depend on the model used.

| Use Case | Prompt | Demo File | Result |
|---|---|---|---|
| Data\-block renaming: fix typos | `With the current open Blender file fix the name of all the data\-blocks to remove typos. Report back which data\-blocks got fixed.` | [Scattering Pebbles](https://www.blender.org/download/demo/geometry-nodes/fields/pebble_scattering.blend) | GRP\-rocks → GRP\-pebble, LGT\-Lights → LGT\-lights, Compositing Nodetree → Compositing Node Tree |
| Data\-block renaming: better names | `With the current open Blender file suggest descriptive names for all data\-blocks, and apply if approved.` | [Scattering Pebbles](https://www.blender.org/download/demo/geometry-nodes/fields/pebble_scattering.blend) | Camera → CAM\-main, Area → LGT\-sun\-key, Area.001 → LGT\-sun\-fill, Area.002 → LGT\-area\-rim, GEO\-pebble.001 → GEO\-pebble\-B, … |
| Querying data relations using natural language | `Which objects are using the following material: pebbles` | [Scattering Pebbles](https://www.blender.org/download/demo/geometry-nodes/fields/pebble_scattering.blend) | 7 objects: GEO\-pebble, GEO\-pebble.001, GEO\-pebble.002, GEO\-pebble.003, GEO\-pebble.004, GEO\-pebble.005, GEO\-pebble.006 |
| Scene debugging | `What is the object with the highest poly\-count on this file? Ignore objects which are not linked to any scene.` | [Scattering Pebbles](https://www.blender.org/download/demo/geometry-nodes/fields/pebble_scattering.blend) | GEO\-ground with 4,096 faces. |
| Geometry Nodes Documentation | `With the current open Blender file explain what the main geometry nodes setup is doing. Add inline documentation for it with frame elements. Create a Text data\-block with the result of analysis.` | [Scattering Pebbles](https://www.blender.org/download/demo/geometry-nodes/fields/pebble_scattering.blend) | 4 major color\-coded frames \+ text file with explanation. |

Other prompts yet to be explored:
- Translate all the data\-blocks from French to English. 
- My mesh is not being deformed by my armature, how can I fix that? 
- Blender is running out of memory rendering this scene, how can I optimize it? 
- This mesh has strange shading artifacts, how can I you fix that? 
- Find objects that have meshes with bad normals. 
- Check my scene for non\-uniformally transformed mesh objects. 
- The video I exported doesn’t play in my web browsers, which settings should I change? 
- Which sculpt brushes should I use for creating and detailing tree branches? 
- Set up compositing nodes to save my image both as SDR and HDR. 
- Verify this checklist:: meshes must be manifold, all objects must have materials, naming must follow convention, no absolute paths, … 
Data\-block renaming: fix typos     Data\-block renaming: better names             Geometry Nodes Documentation  
![Documentation frames added to the geometry nodes setup.](https://www.blender.org/wp-content/uploads/2026/03/labs-frames-1280x927.webp)  Documentation frames added to the geometry nodes setup.
[About ](https://www.blender.org/about/)
-  [ Blender Foundation ](https://www.blender.org/about/foundation/)  
-  [ Blender Institute ](https://www.blender.org/about/institute/)  
-  [ Blender Studio ](https://www.blender.org/about/studio/)  
-  [ License ](https://www.blender.org/about/license/)  
-  [ Logo & Trademark ](https://www.blender.org/about/logo/)  
-  [ Credits ](https://www.blender.org/about/credits/)  
-  [ Privacy Policy ](https://www.blender.org/privacy-policy/)  
-  [ Code of Conduct ](https://developer.blender.org/docs/handbook/communication/code_of_conduct/)  
Organization 
-  [ People ](https://www.blender.org/about/people/)  
-  [ Jobs ](https://www.blender.org/jobs/)  
[Blender Network ](https://network.blender.org/)
[Download ](https://www.blender.org/download/)
-  [ Latest Blender ](https://www.blender.org/download/)  
-  [ Blender LTS ](https://www.blender.org/download/lts/)  
-  [ Previous Versions ](https://www.blender.org/download/previous-versions/)  
-  [ Experimental Builds ](https://builder.blender.org/download/daily/?utm_medium=www-footer)  
-  [ Source Code ](https://projects.blender.org/blender/blender?utm_medium=www-footer)  
-  [ Requirements ](https://www.blender.org/download/requirements/)  
-  [ Benchmark ](https://opendata.blender.org/?utm_medium=www-footer)  
-  [ Flamenco ](https://flamenco.blender.org/?utm_medium=www-footer)  
[Extensions ](https://extensions.blender.org/?utm_medium=www-footer)
-  [ Add\-ons ](https://extensions.blender.org/add-ons/?utm_medium=www-footer)  
-  [ Themes ](https://extensions.blender.org/themes/?utm_medium=www-footer)  
[Developers ](https://developer.blender.org/?utm_medium=www-footer)
-  [ Get Started ](https://developer.blender.org/?utm_medium=www-footer)  
-  [ Roadmap ](https://code.blender.org/roadmap/?utm_medium=www-footer)  
-  [ Projects ](https://projects.blender.org/?utm_medium=www-footer)  
-  [ Docs ](https://developer.blender.org/docs/?utm_medium=www-footer)  
-  [ Blog ](https://code.blender.org/?utm_medium=www-footer)  
-  [ Forum ](https://devtalk.blender.org/?utm_medium=www-footer)  
-  [ YouTube ](https://www.youtube.com/blenderdevelopers)  
-  [ Python API ](https://docs.blender.org/api/current/?utm_medium=www-footer)  
[Blender Studio ](https://studio.blender.org/?utm_medium=www-footer)
-  [ Films ](https://studio.blender.org/films/?utm_medium=www-footer)  
-  [ Training ](https://studio.blender.org/training/?utm_medium=www-footer)  
-  [ Tools & Pipeline ](https://studio.blender.org/tools/?utm_medium=www-footer)  
[Support ](https://www.blender.org/support/)
-  [ Manual ](https://docs.blender.org/manual/?utm_medium=www-footer)  
-  [ Community ](https://www.blender.org/community/)  
-  [ FAQ ](https://www.blender.org/support/faq/)  
[Get Involved ](https://www.blender.org/get-involved/)
-  [ Documentation ](https://www.blender.org/get-involved/documenters/)  
-  [ Education ](https://www.blender.org/get-involved/)  
[News ](https://www.blender.org/news/)
-  [ Press Releases ](https://www.blender.org/category/press/)  
-  [ User Stories ](https://www.blender.org/get-involved/user-stories/)  
[Blender Conference ](https://conference.blender.org/)
[Follow Blender ](https://bsky.app/profile/blender.org)
-  [Blender's Official YouTube channel](https://youtube.com/BlenderFoundation)  
-  [Blender's PeerTube instance](https://video.blender.org/)  
-  [Follow Blender on Bluesky](https://bsky.app/profile/blender.org)  
-  [Follow Blender on Instagram](https://instagram.com/blender.official/)  
-  [Follow Blender on Facebook](https://www.facebook.com/YourOwn3DSoftware/)  
-  [Follow Blender on LinkedIn](https://www.linkedin.com/company/blender-org/)  
-  [Follow Blender on Mastodon](https://mastodon.social/@blender)  
-  [Follow Blender on TikTok](https://www.tiktok.com/@blender_org)  
-  [Follow Blender on Bilibili](https://space.bilibili.com/3546814074587443)  
[Support Blender ](https://fund.blender.org/?utm_medium=www-footer)
-  [** Donate](https://fund.blender.org/?utm_medium=www-footer)  
-  [ One\-time Donation ](https://fund.blender.org/donate-once/?utm_medium=www-footer)  
Artistic freedom starts with Blender ** The Free and Open Source 3D Creation Suite 
Close  Previous 
![]() 
![]() 
Next  
