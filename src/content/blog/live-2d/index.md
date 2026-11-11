---
title: The fun experience on Live2d
publishDate: 2025-3-11
description: 'The first time I tried to make a live2d model.'
tags:
  - invention
  - project
  - technology
heroImage: { src: './thumbnail.jpg', color: '#4891B2' }
language: 'English'
---

<script>
  // Load the Live2D library without blocking the page, and reuse it if the
  // site-wide loader has already fetched it.
  (() => {
    const SRC = 'https://unpkg.com/oh-my-live2d@0.19.3/dist/index.min.js';
    const run = () => OML2D.loadOml2d({
   mobileDisplay: true,
   models: [{
        path: 'https://raw.githubusercontent.com/the-lord-of-stars/warehouse/main/model/duck_model/duck.model3.json',
        position: [0, 0],
        scale:0.12,
        mobileScale: 0.12,
        mobileStageStyle:{
            marginBottom: '10px',
            marginLeft: '15px',
            shadow: '0 0 10px rgba(0, 0, 0, 0.05)',
            borderRadius: '20px',
            backgroundColor: '#FFFFFF',
        },
        stageStyle:{
            marginBottom: '10px',
            marginLeft: '15px',
            shadow: '0 0 10px rgba(0, 0, 0, 0.05)',
            borderRadius: '20px',
            backgroundColor: '#FFFFFF',
        },
   }],
   statusBar: {
        restMessage: 'Resting',
        loadSuccessMessage: 'Success'
   },
   tips: {
        mobileStyle: {
               display: 'none',
        },
        style: {
               display: 'none',
               }
        },
   menus: {
        mobileStyle: {
               marginRight: '20px',
        },
        style: {
               marginRight: '20px',
        },
        items: [{
               id: 'Rest',
               icon: 'icon-rest',
               title: 'rest',
               onClick: (oml2d) => {
                                    oml2d.stageSlideOut();
                                    oml2d.setStatusBarClickEvent(
                                        () => {
                                            oml2d.stageSlideIn();
                                            oml2d.statusBarClose('Success');
                                        }
                                    );
                                    oml2d.statusBarOpen('Resting');}
               }]
        },
  });
    if (window.OML2D) return run();
    const existing = document.querySelector(`script[src="${SRC}"]`);
    if (existing) return existing.addEventListener('load', run, { once: true });
    const s = document.createElement('script');
    s.src = SRC;
    s.async = true;
    s.onload = run;
    document.head.appendChild(s);
  })();
</script>