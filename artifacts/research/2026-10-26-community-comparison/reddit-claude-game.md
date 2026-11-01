[Skip to main content](https://www.reddit.com/r/ClaudeGameDev/comments/1x5fa73/i_built_a_3d_horror_game_that_runs_in_a_browser/?solution=a2d02e09814caf3da2d02e09814caf3d&js_challenge=1&jsc_token=2824be10929bdc604753c70a67a1c3310e9274d021c825e6287a4bb98af75dbe&jsc_orig_r=#main-content)                             I built a 3D horror game that runs in a browser tab with Claude Code. Free, no install : r/ClaudeGameDev           
[Home](https://www.reddit.com/)     
![](https://styles.redditmedia.com/t5_j7gr80/styles/communityIcon_zyq5l798g7hh1.jpg?width=32&height=32&frame=1&auto=webp&s=f22e28699a1f55f27fbfe27b93258fa037a79ed0)
[Sign Up](https://www.reddit.com/register/)             [Log In](https://www.reddit.com/login/)      
[Skip to Sign up](https://www.reddit.com/r/ClaudeGameDev/comments/1x5fa73/i_built_a_3d_horror_game_that_runs_in_a_browser/?solution=a2d02e09814caf3da2d02e09814caf3d&js_challenge=1&jsc_token=2824be10929bdc604753c70a67a1c3310e9274d021c825e6287a4bb98af75dbe&jsc_orig_r=#left-sidebar-container) [Skip to Right Sidebar](https://www.reddit.com/r/ClaudeGameDev/comments/1x5fa73/i_built_a_3d_horror_game_that_runs_in_a_browser/?solution=a2d02e09814caf3da2d02e09814caf3d&js_challenge=1&jsc_token=2824be10929bdc604753c70a67a1c3310e9274d021c825e6287a4bb98af75dbe&jsc_orig_r=#right-sidebar-container)      
Back      
![](https://styles.redditmedia.com/t5_j7gr80/styles/communityIcon_zyq5l798g7hh1.jpg?width=96&height=96&frame=1&auto=webp&s=4e076c5fd4d932790290fe9fb6cbbf3fabf339d8)  
Go to ClaudeGameDev   
[https://www.reddit.com/r/ClaudeGameDev/](https://www.reddit.com/r/ClaudeGameDev/)
[r/ClaudeGameDev](https://www.reddit.com/r/ClaudeGameDev/)      13d ago 

# I built a 3D horror game that runs in a browser tab with Claude Code. Free, no install 
0:00    0:00 / 0:00          

I'm one half of a two\-person studio in Taiwan. I love Stranger Things, and I wanted to see if I could make something with that feeling: an 80s small town, a dark copy of it on the other side, and a friend to bring back. This is **The Flip Side**. The monster, the town and the story are my own.
Play it here \(free, no sign\-up, works on phone and desktop\): [https://play.twinbuilds.com/flip\-side/](https://play.twinbuilds.com/flip-side/)
We're trying to ship one small browser game a day. This was the first.
**What Claude did**
Wrote the whole game: three.js, one HTML file, no build step
Rigged the monster. The mesh came from an image\-to\-3D generator as a soup of disconnected shells, so automatic weights failed. Claude wrote headless Blender scripts that build a closed stand\-in mesh, compute the weights on that, and transfer them back
Synthesised all the music and sound in WebAudio. There are no audio files
Tested itself with headless Chrome and screenshots
**What went wrong**
The first time the monster appeared, phones stuttered. Cause: adding a light mid\-game recompiled every shader. Fix: keep the number of lights constant and precompile on the title screen
A 2D puzzle screen inside a 3D game felt wrong, so it was rebuilt as a 3D room
**What I did:** decided what the game is, threw away a lot of versions, and playtested on my phone.
Happy to answer anything about the workflow. 
Upvote    5      Downvote       5    Go to comments           Share     
Best             
Search Comments  Expand comment search    

# Comments Section 

# Community Info Section 
r/ClaudeGameDev 
[https://www.reddit.com/r/ClaudeGameDev/](https://www.reddit.com/r/ClaudeGameDev/)
Join  
ClaudeGameDev 
A community for AI game development using Claude 
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
