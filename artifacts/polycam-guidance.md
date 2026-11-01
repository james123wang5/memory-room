[Skip to main content](https://learn.poly.cam/hc/en-us/articles/48339214285844-How-to-Capture-High-Fidelity-Interior-Scans-in-Object-Mode#main-content) 
[![Polycam Help Center](https://learn.poly.cam/hc/theming_assets/01KTY0PCPWJCPZR96E1ZV87PKS) ](https://learn.poly.cam/hc/en-us)
[Sign in](https://learn.poly.cam/hc/en-us/signin?return_to=https%3A%2F%2Flearn.poly.cam%2Fhc%2Fen-us%2Farticles%2F48339214285844-How-to-Capture-High-Fidelity-Interior-Scans-in-Object-Mode)
[Submit a request](https://learn.poly.cam/hc/en-us/requests/new)
Best Practices for Capturing Different Subjects
[How to Capture High\-Fidelity Interior Scans in Object Mode](https://learn.poly.cam/hc/en-us/articles/48339214285844-How-to-Capture-High-Fidelity-Interior-Scans-in-Object-Mode)
[How to Capture As\-Built Drawings](https://learn.poly.cam/hc/en-us/articles/48338504343188-How-to-Capture-As-Built-Drawings)
[How to 3D Scan Mechanical Parts](https://learn.poly.cam/hc/en-us/articles/48336423303572-How-to-3D-Scan-Mechanical-Parts)
[Scanning Small Objects in Object Mode](https://learn.poly.cam/hc/en-us/articles/37064519912724-Scanning-Small-Objects-in-Object-Mode)
[How to Capture a Large Objects in Polycam](https://learn.poly.cam/hc/en-us/articles/30549135578388-How-to-Capture-a-Large-Objects-in-Polycam)
[How to Capture a Person](https://learn.poly.cam/hc/en-us/articles/28271869062420-How-to-Capture-a-Person)
1.  [Polycam Help Center](https://learn.poly.cam/hc/en-us)  
2.  [Scanning & Capture](https://learn.poly.cam/hc/en-us/categories/27208943206676-Scanning-Capture)  
3.  [Best Practices for Capturing Different Subjects](https://learn.poly.cam/hc/en-us/sections/27426674886164-Best-Practices-for-Capturing-Different-Subjects)  
Best Practices for Capturing Different Subjects

# How to Capture High\-Fidelity Interior Scans in Object Mode

Object Mode can produce higher\-fidelity interior meshes than Space Mode. This guide covers the three\-pass capture method required to achieve consistent results. 

## Before You Start

Interior photogrammetry requires spaces that are:
-  **Evenly lit with soft lighting** \- bright, blown\-out windows can degrade the capture quality  
-  **Low in reflective surfaces** \- glass, mirrors, and shiny objects cause reconstruction errors  
-  **Static throughout all passes** \- do not move furniture, curtains, or adjust the door swing once the capture process begins  

Start at the door. This gives you a fixed reference point to confirm you have completed a full circuit of the room. 

## The Three\-Pass Method

A complete interior scan requires three passes. Each pass adds a layer of information the software needs, and each acts as an anchor that connects the other image. 

### 1 Pass One \- Outer Ring \(Back to the Wall\) 

Start with your back against the wall and work around the entire perimeter. This is the foundation pass. 
-  Take **5–6 photos** from each position before taking a single step to the left.  
-  Aim the camera **slightly downward toward the floor** rather than holding it level at eye height. This creates parallax variation between shots, which is needed to create the capture.  
-  Make sure each photo has at least **75% overlap** with the previous one.  
-  At every corner, shoot the wall **straight\-on, then at 45°, then at 90°** before continuing. Corners need extra coverage to register correctly  
-  If an obstacle prevents you from hugging the wall, hold the phone up above it and continue your path rather than stepping onto or over it  
**Keep the space undisturbed throughout all passes.** 

Photogrammetry assumes every object stays in exactly the same position across all photos. Even a slight shift in a cushion, rug, or curtain between passes can confuse the algorithm and introduce errors. Don't move any furnishings once you begin. 

The outer ring pass typically takes **5–10 minutes** depending on the size of the room. 

### 2 Pass Two \- Center Ring 

Move to the center of the room and complete a slow circle with a diameter of approximately 1\-2 meters, shooting outward toward the walls. This pass covers the same surfaces as the outer ring from a different viewpoint. That difference in perspective gives the algorithm the cross\-referencing it needs to connect the outer ring and detail pass into a single coherent model. 
-  Aim the camera outward toward the walls and any key objects as you circle  
-  Maintain the same photo\-overlap discipline as the outer ring \- 70\-75% overlap between frames  

### 3 Pass Three \- Detail Passes 

Move in close to areas requiring higher resolution: shelves, textured walls, furniture with complex geometry. Take dozens to hundreds of photos from all angles \- high, low, and around every side \- so no part of any object is permanently blocked from view. 
-  Get close enough to fill the frame with the detail you want to capture  
-  Shoot from **above, below, and every side** \- the goal is to ensure no part of any object is hidden from the camera in every photo  
-  On a shelf of objects, work methodically so that each item is visible from multiple angles and not permanently blocked by something in front of it  
**Always close the loop after a detail pass.** 

After finishing a tight detail pass, the software may not know how those close\-up images relate to the rest of the room. Before moving to the next area, step back and take a series of photos that gradually pull back to re\-establish your position \- connecting the detail pass back to both the center ring and the outer ring. Without these frames, detail passes can end up as floating, disconnected geometry. 

## Troubleshooting

### Objects appear to merge into the wall

Insufficient coverage between the foreground object and the wall behind it. Shoot from angles that clearly show the gap between object and wall. Straight\-on shots cause the two surfaces to appear merged. 

### The detail pass does not connect to the rest of the model

Glue frames are missing. After every close\-up detail pass, step progressively back and shoot frames that bridge the tight detail shots to the center ring pass. Without these transitional frames, the algorithm cannot anchor the detail pass into the larger model. 

### Holes or gaps near corners

Each corner requires shots from three angles: straight\-on, 45°, and 90°. A single angle does not provide enough data to reconstruct a corner accurately. 

### Blurry or low\-detail overall

Caused by moving too quickly between shots. Slow down, allow the camera to settle fully before each shot, and maintain overlap between consecutive frames across all three passes. 
Was this article helpful?
Yes No 0 out of 0 found this helpful 

## Related articles
-  [How to Capture As\-Built Drawings](https://learn.poly.cam/hc/en-us/related/click?data=BAh7CjobZGVzdGluYXRpb25fYXJ0aWNsZV9pZGwrCJReYa%2F2KzoYcmVmZXJyZXJfYXJ0aWNsZV9pZGwrCBQ8stn2KzoLbG9jYWxlSSIKZW4tdXMGOgZFVDoIdXJsSSJHL2hjL2VuLXVzL2FydGljbGVzLzQ4MzM4NTA0MzQzMTg4LUhvdy10by1DYXB0dXJlLUFzLUJ1aWx0LURyYXdpbmdzBjsIVDoJcmFua2kG--0d97148e1e060723cb0b6a4ead541ae5bf63b1b8)  
-  [How to Use Space Mode with \(LiDAR\-enabled devices\)](https://learn.poly.cam/hc/en-us/related/click?data=BAh7CjobZGVzdGluYXRpb25fYXJ0aWNsZV9pZGwrCBR8P4tWIToYcmVmZXJyZXJfYXJ0aWNsZV9pZGwrCBQ8stn2KzoLbG9jYWxlSSIKZW4tdXMGOgZFVDoIdXJsSSJXL2hjL2VuLXVzL2FydGljbGVzLzM2NjU1NTg3MDk3NjIwLUhvdy10by1Vc2UtU3BhY2UtTW9kZS13aXRoLUxpREFSLWVuYWJsZWQtZGV2aWNlcwY7CFQ6CXJhbmtpBw%3D%3D--edd2e0848ae222cdb1ae104376c3ed19f386d4a5)  
-  [Getting Started with Polycam](https://learn.poly.cam/hc/en-us/related/click?data=BAh7CjobZGVzdGluYXRpb25fYXJ0aWNsZV9pZGwrCJRM%2FYG5IzoYcmVmZXJyZXJfYXJ0aWNsZV9pZGwrCBQ8stn2KzoLbG9jYWxlSSIKZW4tdXMGOgZFVDoIdXJsSSJDL2hjL2VuLXVzL2FydGljbGVzLzM5Mjc5NjU2NzgyOTk2LUdldHRpbmctU3RhcnRlZC13aXRoLVBvbHljYW0GOwhUOglyYW5raQg%3D--42b607c52084046f116bcec73af8b81aa3b5cde0)  
-  [How to 3D Scan Mechanical Parts](https://learn.poly.cam/hc/en-us/related/click?data=BAh7CjobZGVzdGluYXRpb25fYXJ0aWNsZV9pZGwrCJQ5VzP2KzoYcmVmZXJyZXJfYXJ0aWNsZV9pZGwrCBQ8stn2KzoLbG9jYWxlSSIKZW4tdXMGOgZFVDoIdXJsSSJGL2hjL2VuLXVzL2FydGljbGVzLzQ4MzM2NDIzMzAzNTcyLUhvdy10by0zRC1TY2FuLU1lY2hhbmljYWwtUGFydHMGOwhUOglyYW5raQk%3D--ff214a112d48b8161d29e197e5c6e92b349278f3)  
-  [How to Create Floorplan Captures](https://learn.poly.cam/hc/en-us/related/click?data=BAh7CjobZGVzdGluYXRpb25fYXJ0aWNsZV9pZGwrCBSqSZSOGzoYcmVmZXJyZXJfYXJ0aWNsZV9pZGwrCBQ8stn2KzoLbG9jYWxlSSIKZW4tdXMGOgZFVDoIdXJsSSJHL2hjL2VuLXVzL2FydGljbGVzLzMwMjk5MTg3MTYxNjIwLUhvdy10by1DcmVhdGUtRmxvb3JwbGFuLUNhcHR1cmVzBjsIVDoJcmFua2kK--1f788d6f5fe92e822aac3612dca0a8004faeac53)  
On this page
- [Before You Start](https://learn.poly.cam/hc/en-us/articles/48339214285844-How-to-Capture-High-Fidelity-Interior-Scans-in-Object-Mode#h_01KPEHKDSBH13QZXA761XZ7994)
- [The Three\-Pass Method](https://learn.poly.cam/hc/en-us/articles/48339214285844-How-to-Capture-High-Fidelity-Interior-Scans-in-Object-Mode#h_01KPEHKDSBG4KYDVG5SASGPTB7)
- [Troubleshooting](https://learn.poly.cam/hc/en-us/articles/48339214285844-How-to-Capture-High-Fidelity-Interior-Scans-in-Object-Mode#h_01KPEHKDSBNH17YDKWE5DF17FY)
**Polycam Help Center** 
[Help Center](https://learn.poly.cam/hc/en-us)
[Submit a request](https://learn.poly.cam/hc/en-us/requests/new)
English \(United States\) 
[العربية](https://learn.poly.cam/hc/change_language/ar?return_to=%2Fhc%2Far)
[Deutsch](https://learn.poly.cam/hc/change_language/de?return_to=%2Fhc%2Fde)
[Español](https://learn.poly.cam/hc/change_language/es?return_to=%2Fhc%2Fes)
[Français](https://learn.poly.cam/hc/change_language/fr?return_to=%2Fhc%2Ffr)
[Русский](https://learn.poly.cam/hc/change_language/ru?return_to=%2Fhc%2Fru)
[Українська](https://learn.poly.cam/hc/change_language/uk?return_to=%2Fhc%2Fuk)
