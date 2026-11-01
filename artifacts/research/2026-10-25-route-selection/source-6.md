Source: https://agisoft.freshdesk.com/support/solutions/articles/31000163268-turntable-capturing-scenario-and-processing-workflow

[** ![Logo](https://s3.amazonaws.com/cdn.freshdesk.com/data/helpdesk/attachments/production/31044655846/logo/-pFyXjKRyh7vYKaP8LeFndmpZQjDemgjFg.png) ](https://www.agisoft.com/)

# Helpdesk Portal
Welcome **** 
**[**Login**](https://agisoft.freshdesk.com/support/login)**  **[**Sign up**](https://agisoft.freshdesk.com/support/signup)** 
[](https://agisoft.freshdesk.com/support/solutions/articles/31000163268-turntable-capturing-scenario-and-processing-workflow#)
[Home](https://agisoft.freshdesk.com/support/home)
[Solutions](https://agisoft.freshdesk.com/support/solutions)
Enter your search term here...  
**  Search   
[New support ticket  ](https://agisoft.freshdesk.com/support/tickets/new)
[Check ticket status ](https://agisoft.freshdesk.com/support/tickets)
[Solution home ](https://agisoft.freshdesk.com/support/solutions)
[Tutorials](https://agisoft.freshdesk.com/support/solutions/31000076245)
[Close range data processing](https://agisoft.freshdesk.com/support/solutions/folders/31000119082)
** **** ** 

## Turntable capturing scenario and processing workflow [  Print ](https://agisoft.freshdesk.com/support/solutions/articles/31000163268-turntable-capturing-scenario-and-processing-workflow#) 

Modified on: Tue, 15 Apr, 2025 at 4:12 PM
---

In this article, we introduce our recommendations for the shooting scenario with the use of a turntable. All stages are described: from the planning of capturing session and to uploading the complete model on Sketchfab. 



The workflow can be used in both editions of ***Agisoft Metashape: Standard*** and ***Professional***.



The main steps:
- [Photo session planning](https://agisoft.freshdesk.com/support/solutions/articles/31000163268-turntable-capturing-scenario-and-processing-workflow#Photo-session-planning)
- [3D model reconstruction in Agisoft Metashape](https://agisoft.freshdesk.com/support/solutions/articles/31000163268-turntable-capturing-scenario-and-processing-workflow#3D-model-reconstruction-in-Agisoft-Metashape)
  - [Add Photos](https://agisoft.freshdesk.com/support/solutions/articles/31000163268-turntable-capturing-scenario-and-processing-workflow#Add-Photos)
  - [Masks “empty” images](https://agisoft.freshdesk.com/support/solutions/articles/31000163268-turntable-capturing-scenario-and-processing-workflow#Masks-%E2%80%9Cempty%E2%80%9D-images)
  - [Align Photos](https://agisoft.freshdesk.com/support/solutions/articles/31000163268-turntable-capturing-scenario-and-processing-workflow#Align-Photos)
  - [Build Model](https://agisoft.freshdesk.com/support/solutions/articles/31000163268-turntable-capturing-scenario-and-processing-workflow#Build-Model)
  - [Build Texture](https://agisoft.freshdesk.com/support/solutions/articles/31000163268-turntable-capturing-scenario-and-processing-workflow#Build-Texture)
  - [Inspection and texture improvement \(only for Metashape Professional edition\)](https://agisoft.freshdesk.com/support/solutions/articles/31000163268-turntable-capturing-scenario-and-processing-workflow#Inspection-and-texture-improvement-(only-for%C2%A0Metashape-Professional%C2%A0edition))
- [Upload model to Sketchfab](https://agisoft.freshdesk.com/support/solutions/articles/31000163268-turntable-capturing-scenario-and-processing-workflow#Upload-model-to-Sketchfab)



```
Sample data is available on our website - [https://www.agisoft.com/downloads/sample-data/](https://www.agisoft.com/downloads/sample-data/)
```





## Photo session planning
---

Correct planning of the shooting scenario would help to improve the final results of the 3D digital reconstruction of the object. We suggest to keep in mind following recommendations:
- The following *Equipment* is required: a camera on a tripod, a remote shutter controller and a turntable. Good lighting is essential: lighting conditions should not change during shooting; use diffuse lighting if possible. The background should contrast with the object: a plain white or black background can be used.



[![](https://s3.amazonaws.com/cdn.freshdesk.com/data/helpdesk/attachments/production/31037322078/original/JdhMNUFDNtvNuym-RxaJOrY48GaanpU-IA.png?1643120404)](https://s3.amazonaws.com/cdn.freshdesk.com/data/helpdesk/attachments/production/31037322078/original/JdhMNUFDNtvNuym-RxaJOrY48GaanpU-IA.png?1643120404)


- *Camera settings:*** **

            ISO 100 to reduce noise,

            Aperture 9\-10 to ensure that the depth field is enough for the object, 

            Focus – auto. 



```
Before starting the shooting session - take a control photo to make sure that the object is in focus. 
```



            Field of view: make sure that the object occupies most of the image and fits in the field of view.



[![](https://s3.amazonaws.com/cdn.freshdesk.com/data/helpdesk/attachments/production/31037342204/original/jlGWXJETjV5LiEs2Z1Ma55Jh6j9rWi4_Yw.png?1643186085)](https://s3.amazonaws.com/cdn.freshdesk.com/data/helpdesk/attachments/production/31037342204/original/jlGWXJETjV5LiEs2Z1Ma55Jh6j9rWi4_Yw.png?1643186085)




- *Capturing scenario: *

First, take a photo of the turntable alone \(without the object\). This photo will later be used to suppress tie points that belong to the background and to the turntable itself. When the camera position is fixed, the rotation of the turntable between shots should be about 10\-15 degrees.

[![](https://s3.amazonaws.com/cdn.freshdesk.com/data/helpdesk/attachments/production/31037323213/original/ptftneHVsl-lu-XY21qn9YyStLm4P_XhfQ.png?1643122394)](https://s3.amazonaws.com/cdn.freshdesk.com/data/helpdesk/attachments/production/31037323213/original/ptftneHVsl-lu-XY21qn9YyStLm4P_XhfQ.png?1643122394)
Rotate the object to ensure that all surfaces are captured. Sometimes it requires placing the object on a side to capture the surface on the bottom.



[![](https://s3.amazonaws.com/cdn.freshdesk.com/data/helpdesk/attachments/production/31037323615/original/Y6V2BkxHQ2mDkGw1olbtNQIfS9UdF28dGw.png?1643123124)](https://s3.amazonaws.com/cdn.freshdesk.com/data/helpdesk/attachments/production/31037323615/original/Y6V2BkxHQ2mDkGw1olbtNQIfS9UdF28dGw.png?1643123124)



Capture the object from different heights to provide for better coverage. Take extra shots to cover parts with overshadowed geometry.



```
- check that object fits in the field of view when being rotated before shooting the whole circle;
- you can slightly rotate the table to help camera focus on the object. Alternatively put your hand in the field of view to focus the camera on, then take the hand out and capture the object. Use manual focus for problematic shots;
– separate subsets of images with an "empty" photo of a turntable without the object. This will ease inspection of the subsets in Metashape.
```



## 3D model reconstruction in Agisoft Metashape
---

Once the images are taken and downloaded to the computer with Agisoft Metashape installed the next steps should be performed:

### 

### Add Photos
---

To add photos to the project select *Workflow > Add Photos... *command. In the *Add Photos* dialog browse to the source folder and select files to be processed.  The images will be added to the active chunk of the project:



### [![](https://s3.amazonaws.com/cdn.freshdesk.com/data/helpdesk/attachments/production/31037342685/original/C7GKsC9T8J4-8Co9Kkk8saemm4SAkCBoYw.png?1643187313)](https://s3.amazonaws.com/cdn.freshdesk.com/data/helpdesk/attachments/production/31037342685/original/C7GKsC9T8J4-8Co9Kkk8saemm4SAkCBoYw.png?1643187313)


Masks “empty” images
---

It is convenient to use masks to exclude the tie points that could be detected on the image areas that do not include the object. As suggested before, images of an "empty" turntable should be added in the dataset. 



[![](https://s3.amazonaws.com/cdn.freshdesk.com/data/helpdesk/attachments/production/31037342965/original/ILYokVPkTbD7O7u-5I1ZvQWb1UQj06-qFQ.png?1643187806)](https://s3.amazonaws.com/cdn.freshdesk.com/data/helpdesk/attachments/production/31037342965/original/ILYokVPkTbD7O7u-5I1ZvQWb1UQj06-qFQ.png?1643187806)


```
If the height of the camera is changed during the photography, then you need to take pictures of the turntable from each camera position.
```

### 

Open the image in the *Photo *view mode by double\-clicking on it in the *Workspace* or on the *Photos *pane. Create a mask by first clicking *Show mask* button; then using the *Rectangle selection* tool from the* Toolbar *to select the whole image; finally click *Add selection *button on the *Toolbar *as illustrated in the animation below



[![](https://s3.amazonaws.com/cdn.freshdesk.com/data/helpdesk/attachments/production/31037343208/original/X96IxB9tkPhKhArfHfg3ae7BIAgP3QOmIg.gif?1643188460)](https://s3.amazonaws.com/cdn.freshdesk.com/data/helpdesk/attachments/production/31037343208/original/X96IxB9tkPhKhArfHfg3ae7BIAgP3QOmIg.gif?1643188460)



Repeat the described procedure for each "empty" background image.



### Align Photos
---

After the masks for the background images were created you may use* Apply masks to tie points *parameter in the Alignment step. Select *Workflow > Align Photos...,* then set the parameters in the *Align photos* dialog window as illustrated below 

[![](https://s3.amazonaws.com/cdn.freshdesk.com/data/helpdesk/attachments/production/31064770772/original/9f00autJa5gMdrLTtc8eLpJliRJwIAWlgQ.png?1744721865)](https://s3.amazonaws.com/cdn.freshdesk.com/data/helpdesk/attachments/production/31064770772/original/9f00autJa5gMdrLTtc8eLpJliRJwIAWlgQ.png?1744721865)



```
The use of *Exclude stationary tie points* feature is recommend in a turntable scenario for fixed camera. In addition enabling this option will help to eliminate false tie points related to the camera sensor or lens artefacts.
```





The result of the alignment step is the tie point cloud \- it will be displayed on the* Model view*: 

[![](https://s3.amazonaws.com/cdn.freshdesk.com/data/helpdesk/attachments/production/31037343965/original/d2_-oK6l7tTzjrMvDecBNX5XW4uR7NwZGg.png?1643190221)](https://s3.amazonaws.com/cdn.freshdesk.com/data/helpdesk/attachments/production/31037343965/original/d2_-oK6l7tTzjrMvDecBNX5XW4uR7NwZGg.png?1643190221)



### 
Build Model
---

It is important to exclude images of the empty background covered with a mask before starting the model generation step. On the *Photos* pane use *Disable cameras* command available in the images context menu. The disabled image will be marked as shown on the image below:

[![](https://s3.amazonaws.com/cdn.freshdesk.com/data/helpdesk/attachments/production/31037344535/original/xUziIHuTVeRKfV8HX9_l3GHHcKX-Ncu3yg.png?1643191441)](https://s3.amazonaws.com/cdn.freshdesk.com/data/helpdesk/attachments/production/31037344535/original/xUziIHuTVeRKfV8HX9_l3GHHcKX-Ncu3yg.png?1643191441)



Select *Build Model...* command from the *Workflow *menu \(*Workflow > Build Model...*\) and set the values for the parameters in the *Build Mesh* dialog as suggested on the image below:

[![](https://s3.amazonaws.com/cdn.freshdesk.com/data/helpdesk/attachments/production/31064770834/original/1ADHOr8RaeVT4S3GipHTc_T9NSJS7D6fyg.png?1744722013)](https://s3.amazonaws.com/cdn.freshdesk.com/data/helpdesk/attachments/production/31064770834/original/1ADHOr8RaeVT4S3GipHTc_T9NSJS7D6fyg.png?1744722013)



The resulting model will be available for display on the *Model view *tab. You may switch between different modes of the model representation using the commands from the drop\-down menu from the toolbar \(see the animation below\). If the parameter *Calculate vertex colors* is not enabled in the *Build Model* dialog then the model will not be available in *Shaded *mode. 



[![](https://s3.amazonaws.com/cdn.freshdesk.com/data/helpdesk/attachments/production/31037344161/original/yGvqS5-iEetBqzKTAst_D1eW2yvwf6BIbQ.gif?1643190607)](https://s3.amazonaws.com/cdn.freshdesk.com/data/helpdesk/attachments/production/31037344161/original/yGvqS5-iEetBqzKTAst_D1eW2yvwf6BIbQ.gif?1643190607)





### Build Texture
---

Select* Build Texture...* command from the *Workflow* menu \(*Workflow > Build Texture...*\). Set the recommended values for the parameters in the *Build Texture* dialog as presented on the image below:

[![](https://s3.amazonaws.com/cdn.freshdesk.com/data/helpdesk/attachments/production/31064770867/original/xQvl-FtgUsKXQX-qtybjQopHgCPZJ7zgrQ.png?1744722080)](https://s3.amazonaws.com/cdn.freshdesk.com/data/helpdesk/attachments/production/31064770867/original/xQvl-FtgUsKXQX-qtybjQopHgCPZJ7zgrQ.png?1744722080)



```
In the *Build Texture* dialog there are the following Advanced parameters that can be selected depending on the particular project requirements:

*Enable hole filling* - using this parameter allows for interpolated texture generation in the areas, that are not presented on the images in the dataset.

*Enable ghosting filter* - this parameter helps to improve the texture if the quality of the dataset is not very good (for example, there can be moving objects, patches of reflected light, unwanted objects in the foreground, etc.). In our case the problems with the texture are not expected, so the feature is disabled to decrease processing time.

*Anti-aliasing* option helps to minimize the loss of texture quality when baking textures at such stages as Transfer Texture, baking vertex colors and building Normal map, Occlusion map, Displacement map. During the texture baking the algorithm casts several rays instead of one for each resulting texture pixel, and then averages the result.
```





The result will be displayed on the *Model view* tab: 

[![](https://s3.amazonaws.com/cdn.freshdesk.com/data/helpdesk/attachments/production/31037344421/original/blt8Vm29CitgG7iFuZ4uL5oH-Q_IFZEvsw.png?1643191141)](https://s3.amazonaws.com/cdn.freshdesk.com/data/helpdesk/attachments/production/31037344421/original/blt8Vm29CitgG7iFuZ4uL5oH-Q_IFZEvsw.png?1643191141)





### Inspection and texture improvement \(only for***** ********Metashape Professional****** ***edition\)
---

The quality of the resulting texture depends on the source images. If the texture is blurred, this can signal that some images are out of focus. To improve the quality of the texture we suggest the following approach:



1. Scale the model to its real size. To learn how to apply scale using scale bars please read the article [Creating scale bars in the project without coded targets](https://agisoft.freshdesk.com/a/solutions/articles/31000162602). 



[![](https://s3.amazonaws.com/cdn.freshdesk.com/data/helpdesk/attachments/production/31037345152/original/SfY3eriWNUPQlx-iUE_AhpCC4r_aMB4h5w.png?1643192460)](https://s3.amazonaws.com/cdn.freshdesk.com/data/helpdesk/attachments/production/31037345152/original/SfY3eriWNUPQlx-iUE_AhpCC4r_aMB4h5w.png?1643192460)



2. Mask the blurred areas on the images following the steps described in this article:  [Texture quality improvement with the defocus masking feature](https://agisoft.freshdesk.com/a/solutions/articles/31000162211) 



3. Re\-build texture with the following parameters \(*Tools > Build Texture..*.\): 



[![](https://s3.amazonaws.com/cdn.freshdesk.com/data/helpdesk/attachments/production/31064771100/original/_ehzpH_tOz0kAjLRlGKMA3gMs-Nai3LP7A.png?1744722514)](https://s3.amazonaws.com/cdn.freshdesk.com/data/helpdesk/attachments/production/31064771100/original/_ehzpH_tOz0kAjLRlGKMA3gMs-Nai3LP7A.png?1744722514)





```
*Defocus masking feature is available in ***Agisoft ******Metashape Professional*** edition only: the algorithm relies on the model's dimensions in the real-world scale.*
```

## 

## Upload model to Sketchfab
---

Metashape supports direct uploading Models to various online resources: [4DMapper](https://4dmapper.com/), [Agisoft Cloud,](https://www.agisoft.com/features/cloud/) [Cesium](https://cesium.com/), [Mapbox](https://account.mapbox.com/), [Picterra](https://picterra.ch/), [](http://www.mapbox.com/)[PointBox](https://www.pointbox.xyz/), [Pointscene](http://pointscene.com/), [Sketchfab](http://sketchfab.com/). 



```
[4DMapper](https://4dmapper.com/), [Cesium](https://cesium.com/), [Mapbox](https://account.mapbox.com/) are available only if your model georeferenced.
```



We describe the workflow for uploading the model to Sketchfab just to set an example. The uploading process for other resources is similar.



Before uploading the model to Sketchfab we recommend checking the orientation axes on the *Model view. *When the model is oriented upwards the Z\-axis should also point up. To adjust the model orientation use *Rotate Object* tool available on the *Toolbar*:



[![](https://s3.amazonaws.com/cdn.freshdesk.com/data/helpdesk/attachments/production/31037482420/original/THzoeOh5ZMqtI4M6SCA9cqcQIlkjAJ87QQ.gif?1643700123)](https://s3.amazonaws.com/cdn.freshdesk.com/data/helpdesk/attachments/production/31037482420/original/THzoeOh5ZMqtI4M6SCA9cqcQIlkjAJ87QQ.gif?1643700123)





```
To apply changes to the model orientation click Update *Transform button* on the *Toolbar*.
```

### 

To publish the model online use *Upload Data...* command from the* File *menu \(*File > Upload Data...*\). In the *Upload Data* dialog window specify parameters for uploading data on Sektchfab:

[![](https://s3.amazonaws.com/cdn.freshdesk.com/data/helpdesk/attachments/production/31064770943/original/cxuc9Zsc56T4H-p0fum8Jy5WDUop3tv7FQ.png?1744722272)](https://s3.amazonaws.com/cdn.freshdesk.com/data/helpdesk/attachments/production/31064770943/original/cxuc9Zsc56T4H-p0fum8Jy5WDUop3tv7FQ.png?1744722272)



[ Geralt Battling a Griffin statue ](https://sketchfab.com/3d-models/geralt-battling-a-griffin-statue-293b7913eaee44a79c6fa910086a0f0a?utm_medium=embed&utm_campaign=share-popup&utm_content=293b7913eaee44a79c6fa910086a0f0a) by [ Agisoft ](https://sketchfab.com/agisoft?utm_medium=embed&utm_campaign=share-popup&utm_content=293b7913eaee44a79c6fa910086a0f0a) on [Sketchfab](https://sketchfab.com/?utm_medium=embed&utm_campaign=share-popup&utm_content=293b7913eaee44a79c6fa910086a0f0a):

[](https://sketchfab.com/3d-models/geralt-battling-a-griffin-statue-293b7913eaee44a79c6fa910086a0f0a?utm_medium=embed&utm_campaign=share-popup&utm_content=293b7913eaee44a79c6fa910086a0f0a)




---

Did you find it helpful? Yes No
Send feedback
Sorry we couldn't be helpful. Help us improve this article with your feedback.
**
![Preview](https://agisoft.freshdesk.com/support/solutions/articles/31000163268-turntable-capturing-scenario-and-processing-workflow)

[Download](https://agisoft.freshdesk.com/support/solutions/articles/31000163268-turntable-capturing-scenario-and-processing-workflow)
****

### Related Articles
-  
[3D model reconstruction](https://agisoft.freshdesk.com/support/solutions/articles/31000152092-3d-model-reconstruction)
-  
[Close\-range objects scanning](https://agisoft.freshdesk.com/support/solutions/articles/31000149340-close-range-objects-scanning)
-  
[How to build a complete \(360 degree\) model of an object](https://agisoft.freshdesk.com/support/solutions/articles/31000155265-how-to-build-a-complete-360-degree-model-of-an-object)
-  
[Agisoft Texture De\-Lighter \- general workflow](https://agisoft.freshdesk.com/support/solutions/articles/31000158376-agisoft-texture-de-lighter-general-workflow)
-  
[4D processing](https://agisoft.freshdesk.com/support/solutions/articles/31000155179-4d-processing)
-  
[Normal map generation](https://agisoft.freshdesk.com/support/solutions/articles/31000153952-normal-map-generation)
-  
[Processing spherical panoramas in Agisoft Metashape](https://agisoft.freshdesk.com/support/solutions/articles/31000161406-processing-spherical-panoramas-in-agisoft-metashape)
-  
[Texture quality improvement with the defocus masking feature](https://agisoft.freshdesk.com/support/solutions/articles/31000162211-texture-quality-improvement-with-the-defocus-masking-feature)
-  
[Automatic masking from the model](https://agisoft.freshdesk.com/support/solutions/articles/31000163388-automatic-masking-from-the-model)
-  
[Block Model](https://agisoft.freshdesk.com/support/solutions/articles/31000171950-block-model)
[Home](https://agisoft.freshdesk.com/support/home)
[Solutions](https://agisoft.freshdesk.com/support/solutions)
[Cookie policy ](https://agisoft.freshdesk.com/support/solutions/articles/31000163268-turntable-capturing-scenario-and-processing-workflow#portal-cookie-info)
<p>We use cookies to try and give you a better experience in Freshdesk. </p> <p>You can learn more about what kind of cookies we use, why, and how from our <a href="https://www.freshworks.com/privacy/" target="\_blank" rel="nofollow">Privacy Policy</a>. If you hate cookies, or are just on a diet, you can disable them altogether too. Just note that the Freshdesk service is pretty big on some cookies \(we love the choco\-chip ones\), and some portions of Freshdesk may not work properly if you disable cookies.</p> <p>We’ll also assume you agree to the way we use cookies and are ok with it as described in our <a href="https://www.freshworks.com/privacy/" target="\_blank" rel="nofollow">Privacy Policy</a>, unless you choose to disable them altogether through your browser.</p> 
[Help Desk Software ](https://www.freshworks.com/freshdesk/?utm_source=portal&utm_medium=reflink&utm_campaign=portal_reflink) by Freshdesk 
