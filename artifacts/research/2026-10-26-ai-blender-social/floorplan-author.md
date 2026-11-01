Source: https://www.sidharthsatapathy.com/blog/claude-blender-mcp-floor-plan-to-3d-house/

[~/sidharth.dev—/blog/claude\-blender\-mcp\-floor\-plan\-to\-3d\-house](https://www.sidharthsatapathy.com/)
[/blog](https://www.sidharthsatapathy.com/blog/)
![Beyond Code: I Gave Claude a Floor Plan and It Built the House in 3D](https://www.sidharthsatapathy.com/images/blog/blender-home-cover.png)
fig.0: claude\-blender\-mcp\-floor\-plan\-to\-3d\-house 

[~/blog](https://www.sidharthsatapathy.com/blog/)/claude\-blender\-mcp\-floor\-plan\-to\-3d\-house
⏺ 4 min · 2026\-06\-08 · 754 words
[share](https://x.com/intent/tweet?text=Beyond%20Code%3A%20I%20Gave%20Claude%20a%20Floor%20Plan%20and%20It%20Built%20the%20House%20in%203D&url=https%3A%2F%2Fwww.sidharthsatapathy.com%2Fblog%2Fclaude-blender-mcp-floor-plan-to-3d-house%2F)
copy link

# Beyond Code: I Gave Claude a Floor Plan and It Built the House in 3D

Everyone uses Claude to write code. I pointed it at something with nothing to do with software — a 2D floor plan of a family home — and let it drive Blender end to end. Two days later: a furnished, rendered 3D walkthrough. I don't know Blender.
\#claude\#ai\-agents\#mcp\#blender\#3d\-modelling\#agentic\-workflows
![A living room, rendered from a 2D plan — sofa, TV, coffee table. Claude laid all of it out.](https://www.sidharthsatapathy.com/images/blog/blender-home-cover.png)
A living room, rendered from a 2D plan — sofa, TV, coffee table. Claude laid all of it out.

>  

**The idea:** a coding agent isn't really a *coding* agent. It's a loop — act, look, correct — wired to a tool that happens to be a compiler. Swap the compiler for Blender and the loop doesn't care. Code was just the first tool we plugged in.

## The unlock

There's an MCP server for Blender. It hands Claude two things that matter: `execute\_blender\_code` \(run any Python in a live Blender session — so, do anything\) and `get\_viewport\_screenshot` \(render the view and hand the image *back* to the model\). Act, then **look at what you did**, then fix it.

I gave it a real job: take the 2D plan of a family home and rebuild it in 3D — accurate, furnished, rendered.

## Reading the drawing is the hard part

Not the geometry. Geometry is just coordinates. The hard part is a human drawing full of conventions nobody wrote down: north pointed *down*, dimensions in feet on a pixel\-scaled SVG, room labels that disagreed with the rectangles actually drawn.

So the first move wasn't modelling — it was a conversion function:
python

```python
PX_PER_FT = 16.5
FT = 0.3048                       # feet -> metres
def X(px): return ((SVG_W - px) / PX_PER_FT) * FT   # pixel -> world metres
def Y(py): return ((py - SVG_TOP) / PX_PER_FT) * FT
```

After that, every wall is just a segment in pixel space; door and window openings are *gaps left in the list*. The leverage is in the representation, not the grind.

## The screenshot\-verify loop is the superpower

This is the part that felt like watching a person. Claude rendered a top\-down view, *compared it to the plan*, caught its own mistakes — a wall a few inches proud, a door on the wrong face — and fixed them.

That's TDD. Write → run → read the failure → fix. Except the "test" is an image and the assertion is *does this match the drawing*. The loop doesn't need a stack trace; a picture works.
![The untextured "clay" massing, straight from the plan — the verification stage, not a failure. Lock geometry first, texture later.](https://www.sidharthsatapathy.com/images/blog/blender-home-roof-clay.png)
The untextured "clay" massing, straight from the plan — the verification stage, not a failure. Lock geometry first, texture later.

The one instruction that mattered most wasn't technical: **the plan is the source of truth — flag conflicts, don't silently "improve" them.** Left alone, an agent will confidently straighten things and move a door to where it *thinks* it goes. Same fix as AI "fixing" code you didn't ask it to touch.

## Furnishing it like a designer

Empty rooms are easy to fill badly — sofas through walls, a table you can't walk around. The trick was handing Claude the constraints a real designer carries: ~3 ft walkways, ~2.5 ft to pull out a chair, keep door swings clear. After each room it screenshotted, checked for blocked paths, and adjusted.
![A furnished interior — placed with real clearances, so paths stay walkable.](https://www.sidharthsatapathy.com/images/blog/blender-home-ldk.png)
A furnished interior — placed with real clearances, so paths stay walkable.
![Same rooftop, textured and planted. Grey blocks to this, all through the MCP.](https://www.sidharthsatapathy.com/images/blog/blender-home-roof-final.png)
Same rooftop, textured and planted. Grey blocks to this, all through the MCP.

Then — because cameras are just more Python — it rendered the motion too:
![A rooftop flythrough, rendered from the model Claude built. Camera path and render, all via the MCP.](https://www.sidharthsatapathy.com/images/blog/blender-home-flythrough.gif)
A rooftop flythrough, rendered from the model Claude built. Camera path and render, all via the MCP.

## Pro vs beginner vs Claude

|  | Pro arch\-viz artist | Me, solo | Me \+ Claude |
|---|---|---|---|
| Skill needed | Years | Couldn't | I direct, it operates |
| Time to a furnished walkthrough | Days–weeks | Months \(or I quit\) | **~2 days** |
| Ceiling | Photoreal, art\-directed | — | "Clearly shows the design" |

I won't fudge that last row: **a senior artist still wins on taste** — materials, lighting, the choices that make a render *sell*. Claude didn't replace that. It collapsed a different gap — the one between *"can't operate this software at all"* and *"accurate furnished model that matches the plan."* That gap used to *be* the skill: months of tutorials, or you pay someone. Claude turned it into a director's job. No rabbit\-holing, no abandoning it half\-built. The expertise tax that kills hobby projects just wasn't charged.

It's the same shift developers already felt: the floor came up. Knowing how to *operate* the tool stopped being the moat. The ceiling — taste, art direction, the last 20% — is still very human. The competent middle is now a conversation.
---

*Built with Claude driving Blender through the [Blender MCP](https://github.com/ahujasid/blender-mcp). Floor plan and identifying details kept private — these renders are deliberately generic.*
share →
[x](https://x.com/intent/tweet?text=Beyond%20Code%3A%20I%20Gave%20Claude%20a%20Floor%20Plan%20and%20It%20Built%20the%20House%20in%203D&url=https%3A%2F%2Fwww.sidharthsatapathy.com%2Fblog%2Fclaude-blender-mcp-floor-plan-to-3d-house%2F)
[linkedin](https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fwww.sidharthsatapathy.com%2Fblog%2Fclaude-blender-mcp-floor-plan-to-3d-house%2F)
copy link
![Sidharth Satapathy](https://www.sidharthsatapathy.com/sid_profile.jpeg)

### Sidharth Satapathy

AI Engineer & Builder. 8\+ years shipping at scale. Building AI\-native tools with Claude Code, MCP servers, and agentic workflows.
[Follow on X](https://x.com/satapathy9)
[GitHub](https://github.com/xlreon)
[LinkedIn](https://linkedin.com/in/sidharthsatapathy)

Related posts
-  1.[Substrate: A Local\-First Knowledge Layer for AI Agents](https://www.sidharthsatapathy.com/blog/substrate-knowledge-bundles-mcp-ai-agents/)2026\-05\-24 · 6 min
-  2.[I Turned My Agent Orchestration Into an RPG \(And It Made Everything Click\)](https://www.sidharthsatapathy.com/blog/rpg-agent-orchestration-voxel-office/)2026\-05\-02 · 8 min
-  3.[My AI Agent Stopped Reading Files: What a Dual Knowledge Graph Actually Looks Like in Production](https://www.sidharthsatapathy.com/blog/gitnexus-dual-graph-engine-token-savings/)2026\-04\-14 · 18 min

[ask sid about this post](https://www.sidharthsatapathy.com/?q=Beyond%20Code%3A%20I%20Gave%20Claude%20a%20Floor%20Plan%20and%20It%20Built%20the%20House%20in%203D)

/toc
- [The unlock](https://www.sidharthsatapathy.com/blog/claude-blender-mcp-floor-plan-to-3d-house/#the-unlock)
- [Reading the drawing is the hard part](https://www.sidharthsatapathy.com/blog/claude-blender-mcp-floor-plan-to-3d-house/#reading-the-drawing-is-the-hard-part)
- [The screenshot\-verify loop is the superpower](https://www.sidharthsatapathy.com/blog/claude-blender-mcp-floor-plan-to-3d-house/#the-screenshot-verify-loop-is-the-superpower)
- [Furnishing it like a designer](https://www.sidharthsatapathy.com/blog/claude-blender-mcp-floor-plan-to-3d-house/#furnishing-it-like-a-designer)
- [Pro vs beginner vs Claude](https://www.sidharthsatapathy.com/blog/claude-blender-mcp-floor-plan-to-3d-house/#pro-vs-beginner-vs-claude)
