Source: https://colmap.github.io/

[Skip to main content](https://colmap.github.io/#main-content)
**Back to top  
![](https://colmap.github.io/_static/colmap-logo.svg) ![](https://colmap.github.io/_static/colmap-logo-dark.svg) 

COLMAP
[https://colmap.github.io/#](https://colmap.github.io/#)
-  [ Installation ](https://colmap.github.io/install.html)  
-  [ Tutorial ](https://colmap.github.io/tutorial.html)  
-  [ Key Concepts ](https://colmap.github.io/concepts.html)  
-  [ 3D Viewer ](https://colmap.github.io/viewer.html)  
-   More  
  -  [ Feature Extraction and Matching ](https://colmap.github.io/features.html)  
  -  [ Database Format ](https://colmap.github.io/database.html)  
  -  [ Camera Models ](https://colmap.github.io/cameras.html)  
  -  [ Rig Support ](https://colmap.github.io/rigs.html)  
  -  [ Output Format ](https://colmap.github.io/format.html)  
  -  [ Datasets ](https://colmap.github.io/datasets.html)  
  -  [ Graphical User Interface ](https://colmap.github.io/gui.html)  
  -  [ Command\-line Interface ](https://colmap.github.io/cli.html)  
  -  [ PyCOLMAP ](https://colmap.github.io/pycolmap/index.html)  
  -  [ Frequently Asked Questions ](https://colmap.github.io/faq.html)  
  -  [ Changelog ](https://colmap.github.io/changelog.html)  
  -  [ Contribution ](https://colmap.github.io/contribution.html)  
  -  [ License ](https://colmap.github.io/license.html)  
  -  [ Bibliography ](https://colmap.github.io/bibliography.html)  
  -  [ Legacy Documentations ](https://colmap.github.io/legacy.html)  
** Search ⌘\+K  
** ** **  
- **System Settings 
- **Light 
- **Dark 
-  [GitHub](https://github.com/colmap/colmap)  
-  [PyPI](https://pypi.org/project/pycolmap/)  
-  [Docker Hub](https://hub.docker.com/r/colmap/colmap)  
** Search ⌘\+K  
-  [ Installation ](https://colmap.github.io/install.html)  
-  [ Tutorial ](https://colmap.github.io/tutorial.html)  
-  [ Key Concepts ](https://colmap.github.io/concepts.html)  
-  [ 3D Viewer ](https://colmap.github.io/viewer.html)  
-  [ Feature Extraction and Matching ](https://colmap.github.io/features.html)  
-  [ Database Format ](https://colmap.github.io/database.html)  
-  [ Camera Models ](https://colmap.github.io/cameras.html)  
-  [ Rig Support ](https://colmap.github.io/rigs.html)  
-  [ Output Format ](https://colmap.github.io/format.html)  
-  [ Datasets ](https://colmap.github.io/datasets.html)  
-  [ Graphical User Interface ](https://colmap.github.io/gui.html)  
-  [ Command\-line Interface ](https://colmap.github.io/cli.html)  
-  [ PyCOLMAP ](https://colmap.github.io/pycolmap/index.html)  
-  [ Frequently Asked Questions ](https://colmap.github.io/faq.html)  
-  [ Changelog ](https://colmap.github.io/changelog.html)  
-  [ Contribution ](https://colmap.github.io/contribution.html)  
-  [ License ](https://colmap.github.io/license.html)  
-  [ Bibliography ](https://colmap.github.io/bibliography.html)  
-  [ Legacy Documentations ](https://colmap.github.io/legacy.html)  
** ** **  
- **System Settings 
- **Light 
- **Dark 
-  [GitHub](https://github.com/colmap/colmap)  
-  [PyPI](https://pypi.org/project/pycolmap/)  
-  [Docker Hub](https://hub.docker.com/r/colmap/colmap)  

# COLMAP[\#](https://colmap.github.io/#colmap)

General\-purpose Structure\-from\-Motion & Multi\-View Stereo

COLMAP is a general\-purpose Structure\-from\-Motion \(SfM\) and Multi\-View Stereo \(MVS\) pipeline with a graphical and command\-line interface. It offers a wide range of features for reconstruction of ordered and unordered image collections, and is free and open source. 
[Get Started](https://colmap.github.io/install.html)
[Install](https://colmap.github.io/#install-colmap)
[GitHub](https://github.com/colmap/colmap)
![Sparse reconstruction of central Rome.](https://colmap.github.io/_images/sparse.webp)  

Sparse model of central Rome using 21K photos produced by COLMAP’s SfM pipeline.[\#](https://colmap.github.io/#id2)

## Install COLMAP[\#](https://colmap.github.io/#install-colmap)

Select your platform below to get the recommended install command or download.
OS
LinuxmacOSWindows
Package
pipCondaDockerBinarySource
Compute
CUDA \(GPU\)CPU
`$ pip install pycolmap\-cuda12`Copy

For all installation options and build\-from\-source instructions, see the [installation guide](https://colmap.github.io/install.html#installation).

## Features[\#](https://colmap.github.io/#features)
Structure\-from\-Motion

Robust incremental SfM to recover camera poses and sparse 3D structure from ordered or unordered image collections.
[Tutorial](https://colmap.github.io/tutorial.html)
Multi\-View Stereo

Dense reconstruction with PatchMatch stereo and stereo fusion to produce detailed dense point clouds and meshes.
[Tutorial](https://colmap.github.io/tutorial.html)
Graphical & Command\-Line

A full\-featured GUI for interactive reconstruction plus a scriptable command\-line interface for automated pipelines.
[Graphical User Interface](https://colmap.github.io/gui.html)
PyCOLMAP

Python bindings exposing most of COLMAP’s functionality, from the reconstruction pipeline to robust geometric estimators.
[PyCOLMAP](https://colmap.github.io/pycolmap/index.html)
Camera Models & Rigs

A wide range of camera models and multi\-camera rig support for diverse capture setups.
[Camera Models](https://colmap.github.io/cameras.html)
Datasets & Formats

Ready\-to\-use sample datasets and well\-documented input/output formats for easy integration.
[Datasets](https://colmap.github.io/datasets.html)

## Getting Started[\#](https://colmap.github.io/#getting-started)
1. 

Install COLMAP using the selector above, download the [pre\-built binaries](https://github.com/colmap/colmap/releases), or build from [source](https://colmap.github.io/install.html) \(see [Installation](https://colmap.github.io/install.html#installation)\).
2. 

Download one of the provided datasets \(see [Datasets](https://colmap.github.io/datasets.html#datasets)\) or use your own images.
3. 

Use the **automatic reconstruction** to easily build models with a single click \(see [Quickstart](https://colmap.github.io/tutorial.html#quick-start)\).

## Support[\#](https://colmap.github.io/#support)

Please, use [GitHub Discussions](https://github.com/colmap/colmap/discussions) for questions and the [GitHub issue tracker](https://github.com/colmap/colmap) for bug reports, feature requests/additions, etc.

## Citation[\#](https://colmap.github.io/#citation)

If you use this project for your research, please cite:

```
@inproceedings{schoenberger2016sfm,
    author={Sch\"{o}nberger, Johannes Lutz and Frahm, Jan-Michael},
    title={Structure-from-Motion Revisited},
    booktitle={Conference on Computer Vision and Pattern Recognition (CVPR)},
    year={2016},
}

@inproceedings{schoenberger2016mvs,
    author={Sch\"{o}nberger, Johannes Lutz and Zheng, Enliang and Pollefeys, Marc and Frahm, Jan-Michael},
    title={Pixelwise View Selection for Unstructured Multi-View Stereo},
    booktitle={European Conference on Computer Vision (ECCV)},
    year={2016},
}
```

If you use the global SfM pipeline \(GLOMAP\), please cite:

```
@inproceedings{pan2024glomap,
    author={Pan, Linfei and Barath, Daniel and Pollefeys, Marc and Sch\"{o}nberger, Johannes Lutz},
    title={{Global Structure-from-Motion Revisited}},
    booktitle={European Conference on Computer Vision (ECCV)},
    year={2024},
}
```

If you use the image retrieval / vocabulary tree engine, please cite:

```
@inproceedings{schoenberger2016vote,
    author={Sch\"{o}nberger, Johannes Lutz and Price, True and Sattler, Torsten and Frahm, Jan-Michael and Pollefeys, Marc},
    title={A Vote-and-Verify Strategy for Fast Spatial Verification in Image Retrieval},
    booktitle={Asian Conference on Computer Vision (ACCV)},
    year={2016},
}
```

## Acknowledgments[\#](https://colmap.github.io/#acknowledgments)

COLMAP was originally written by [Johannes Schönberger](https://demuc.de/) with funding provided by his PhD advisors Jan\-Michael Frahm and Marc Pollefeys. The team of core project maintainers currently includes [Johannes Schönberger](https://github.com/ahojnnes), [Paul\-Edouard Sarlin](https://github.com/sarlinpe), and [Shaohui Liu](https://github.com/B1ueber2y).

The Python bindings in PyCOLMAP were originally added by [Mihai Dusmanu](https://github.com/mihaidusmanu), [Philipp Lindenberger](https://github.com/Phil26AT), and [Paul\-Edouard Sarlin](https://github.com/sarlinpe).

The project has also benefitted from countless community contributions, including bug fixes, improvements, new features, third\-party tooling, and community support \(special credits to [Torsten Sattler](https://tsattler.github.io/)\).

next

Installation
** 
[next page](https://colmap.github.io/install.html)

© Copyright 2026, COLMAP Team. 

COLMAP 4.3.0.dev0 \| 3e5c915 \(2026\-10\-11\)

Built with the [PyData Sphinx Theme](https://pydata-sphinx-theme.readthedocs.io/en/stable/index.html) 0.23.0. 
