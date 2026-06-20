// ==========================================
// BAYTKOM DIGITAL - PROJECT DETAILS CONTROLLER
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get("id");

  if (!projectId) {
    // Redirect to portfolio if no ID is specified
    window.location.href = "portfolio.html";
    return;
  }

  // Load project details
  fetch("data/projects.json")
    .then(response => {
      if (!response.ok) throw new Error("Could not load projects data");
      return response.json();
    })
    .then(projects => {
      const project = projects.find(p => p.id === projectId);
      
      if (!project) {
        // Not found, redirect to portfolio
        window.location.href = "portfolio.html";
        return;
      }

      // Populate project fields
      renderProjectPage(project, projects);
    })
    .catch(err => {
      console.error("Error loading project details:", err);
    });

  // Watch for language changes to re-translate the dynamic sections
  window.addEventListener("langchanged", () => {
    // Reload projects.json to re-render dynamic content
    fetch("data/projects.json")
      .then(res => res.json())
      .then(projects => {
        const project = projects.find(p => p.id === projectId);
        if (project) {
          renderProjectPage(project, projects);
        }
      });
  });
  
  // Setup Lightbox Close
  const lightbox = document.getElementById("lightbox-modal");
  const lightboxClose = document.getElementById("lightbox-close");
  if (lightbox && lightboxClose) {
    lightboxClose.addEventListener("click", () => {
      lightbox.classList.remove("active");
    });
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) {
        lightbox.classList.remove("active");
      }
    });
  }
});

// ==========================================
// PAGE POPULATOR ROUTINES
// ==========================================

function renderProjectPage(project, allProjects) {
  const currentLang = document.documentElement.lang || "ar";

  // 1. Text elements
  document.getElementById("project-title").textContent = project.name.en;
  document.getElementById("project-category").textContent = project.category[currentLang];
  document.getElementById("project-desc").textContent = project.description[currentLang];

  // 2. Cover image setup
  const heroSection = document.getElementById("project-hero");
  if (heroSection) {
    // Use first image as cover by default
    const coverUrl = `projects/${project.id}/images/1.jpg`;
    
    // Check if hero image elements exist, else create one
    let coverImg = document.getElementById("project-hero-cover-img");
    if (!coverImg) {
      coverImg = document.createElement("img");
      coverImg.id = "project-hero-cover-img";
      coverImg.className = "project-hero-cover";
      heroSection.prepend(coverImg);
    }
    coverImg.src = coverUrl;
    coverImg.onerror = () => {
      coverImg.src = "assets/images/default-cover.jpg";
    };
  }

  // 3. Brand logo setup
  probeLogo(project.id);

  // 4. Services list
  const servicesList = document.getElementById("project-services-list");
  if (servicesList) {
    servicesList.innerHTML = "";
    const services = project.services[currentLang] || [];
    services.forEach(service => {
      const item = document.createElement("div");
      item.className = "sidebar-service-tag";
      // Icon inside service
      item.innerHTML = `
        <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><polyline points="20 6 9 17 4 12"></polyline></svg>
        <span>${service}</span>
      `;
      servicesList.appendChild(item);
    });
  }

  // 5. Results KPIs
  const resultsGrid = document.getElementById("project-results-grid");
  const resultsSection = document.getElementById("project-results-section");
  if (resultsGrid) {
    resultsGrid.innerHTML = "";
    const results = project.results[currentLang] || [];
    
    if (results.length > 0) {
      if (resultsSection) resultsSection.style.display = "block";
      results.forEach(res => {
        const item = document.createElement("div");
        item.className = "metric-item";
        item.innerHTML = `
          <span class="metric-val">${res.value}</span>
          <span class="metric-lbl">${res.metric}</span>
        `;
        resultsGrid.appendChild(item);
      });
    } else {
      if (resultsSection) resultsSection.style.display = "none";
    }
  }

  // 6. Probing Gallery Files (Images and Videos)
  probeImages(project);
  probeVideos(project);

  // 7. Render Related Projects
  renderRelatedProjects(project, allProjects, currentLang);
}

// ==========================================
// MEDIA PROBERS (ZERO CODING DIRECTORY SCAN)
// ==========================================

function probeLogo(projectId) {
  const container = document.getElementById("project-logo-container");
  if (!container) return;
  
  container.innerHTML = "";
  const img = document.createElement("img");
  
  const formats = ["png", "svg", "jpg", "webp"];
  let found = false;
  
  const tryFormat = (idx) => {
    if (idx >= formats.length || found) return;
    const format = formats[idx];
    const logoUrl = `projects/${projectId}/logo/logo.${format}`;
    
    const testImg = new Image();
    testImg.onload = () => {
      img.src = logoUrl;
      img.alt = "Brand Logo";
      container.appendChild(img);
      found = true;
    };
    testImg.onerror = () => {
      tryFormat(idx + 1);
    };
    testImg.src = logoUrl;
  };
  
  tryFormat(0);
}

function probeImages(project) {
  const container = document.getElementById("project-gallery");
  if (!container) return;
  container.innerHTML = "";

  const projectId = project.id;

  // Option A: If custom image files are specified in projects.json
  if (project.imagesList && Array.isArray(project.imagesList) && project.imagesList.length > 0) {
    project.imagesList.forEach((fileName, index) => {
      const imgUrl = `projects/${projectId}/images/${fileName}`;
      renderImageItem(imgUrl, index + 1, container);
    });
    return;
  }

  // Option B: Probe numerically (1.jpg, 2.jpg, etc.)
  const maxImages = 20;
  const extensions = ["jpg", "png", "webp", "jpeg", "gif"];
  let imagesFound = 0;

  for (let i = 1; i <= maxImages; i++) {
    probeSingleImage(projectId, i, extensions, container, () => {
      imagesFound++;
    });
  }

  // Fallback helper after 1.5 seconds if no files were loaded
  setTimeout(() => {
    if (imagesFound === 0) {
      const currentLang = document.documentElement.lang || "ar";
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; color: var(--text-dim); padding: 3rem; border: 1px dashed var(--border-glass); border-radius: 12px;">
          <p>${currentLang === 'ar' ? 'أضف صوراً في المجلد: ' : 'Add images to: '} <code>/projects/${projectId}/images/</code></p>
          <p style="font-size:0.85rem; margin-top:0.5rem; color:var(--secondary);">${currentLang === 'ar' ? 'تسمية الملفات يجب أن تكون رقمية (1.jpg, 2.jpg, إلخ) أو حددها في projects.json' : 'Rename images numerically (e.g. 1.jpg, 2.jpg) or list them in projects.json'}</p>
        </div>
      `;
    }
  }, 1500);
}

function renderImageItem(imgUrl, index, container) {
  const galleryItem = document.createElement("div");
  galleryItem.className = "gallery-item glass-panel reveal";
  galleryItem.innerHTML = `
    <img src="${imgUrl}" alt="Gallery ${index}" loading="lazy">
    <div class="gallery-overlay">
      <span class="view-icon">🔍</span>
    </div>
  `;

  galleryItem.addEventListener("click", () => openLightbox(imgUrl));
  container.appendChild(galleryItem);
  
  if (window.revealObserver) {
    window.revealObserver.observe(galleryItem);
  } else {
    galleryItem.classList.add("active");
  }
}

function probeSingleImage(projectId, index, extensions, container, onSuccess) {
  let extIdx = 0;

  const tryNext = () => {
    if (extIdx >= extensions.length) return;
    const ext = extensions[extIdx];
    const imgUrl = `projects/${projectId}/images/${index}.${ext}`;

    const img = new Image();
    img.onload = () => {
      // Create gallery elements
      const galleryItem = document.createElement("div");
      galleryItem.className = "gallery-item glass-panel reveal";
      galleryItem.innerHTML = `
        <img src="${imgUrl}" alt="Gallery ${index}" loading="lazy">
        <div class="gallery-overlay">
          <span class="view-icon">🔍</span>
        </div>
      `;

      galleryItem.addEventListener("click", () => openLightbox(imgUrl));
      container.appendChild(galleryItem);
      
      if (window.revealObserver) {
        window.revealObserver.observe(galleryItem);
      } else {
        galleryItem.classList.add("active");
      }
      
      onSuccess();
    };
    img.onerror = () => {
      extIdx++;
      tryNext();
    };
    img.src = imgUrl;
  };

  tryNext();
}

function probeVideos(project) {
  const container = document.getElementById("project-videos");
  const section = document.getElementById("videos-section");
  if (!container) return;
  container.innerHTML = "";

  const projectId = project.id;
  let videosFound = 0;

  const onVideoFound = () => {
    videosFound++;
    if (section) section.style.display = "block";
  };

  // Option A: If custom video files are specified in projects.json
  if (project.videosList && Array.isArray(project.videosList) && project.videosList.length > 0) {
    project.videosList.forEach((fileName) => {
      const videoUrl = `projects/${projectId}/videos/${fileName}`;
      renderVideo(videoUrl, container);
      onVideoFound();
    });
    return;
  }

  // Option B: Probe numerically (1.mp4, 2.mp4, etc.)
  const maxVideos = 10;
  const extensions = ["mp4", "webm", "mov"];

  for (let i = 1; i <= maxVideos; i++) {
    probeSingleVideo(projectId, i, extensions, container, onVideoFound);
  }

  // Check if we found any videos after 1.5 seconds, if not hide section
  setTimeout(() => {
    if (videosFound === 0 && section) {
      section.style.display = "none";
    }
  }, 1500);
}

function probeSingleVideo(projectId, index, extensions, container, onSuccess) {
  let extIdx = 0;

  const tryNext = () => {
    if (extIdx >= extensions.length) return;
    const ext = extensions[extIdx];
    const videoUrl = `projects/${projectId}/videos/${index}.${ext}`;

    const controller = new AbortController();
    fetch(videoUrl, { signal: controller.signal })
      .then(res => {
        if (res.ok) {
          renderVideo(videoUrl, container);
          onSuccess();
        } else {
          extIdx++;
          tryNext();
        }
        controller.abort();
      })
      .catch(err => {
        if (err.name === 'AbortError') {
          // Aborted, this is expected
        } else {
          extIdx++;
          tryNext();
        }
      });
  };

  tryNext();
}

function renderVideo(url, container) {
  const card = document.createElement("div");
  card.className = "video-card glass-panel reveal";
  card.innerHTML = `
    <video controls preload="metadata">
      <source src="${url}" type="video/mp4">
      Your browser does not support the video tag.
    </video>
  `;
  container.appendChild(card);
  
  if (window.revealObserver) {
    window.revealObserver.observe(card);
  } else {
    card.classList.add("active");
  }
}

// ==========================================
// LIGHTBOX CONTROL MODAL
// ==========================================

function openLightbox(src) {
  const lightbox = document.getElementById("lightbox-modal");
  const lightboxImg = document.getElementById("lightbox-img");
  
  if (lightbox && lightboxImg) {
    lightboxImg.src = src;
    lightbox.classList.add("active");
  }
}

// ==========================================
// RELATED PROJECTS RENDERER
// ==========================================

function renderRelatedProjects(currentProj, allProjects, lang) {
  const container = document.getElementById("related-projects-grid");
  if (!container) return;
  container.innerHTML = "";

  // Filter projects by matching category and excluding the current project
  const related = allProjects
    .filter(p => p.id !== currentProj.id && p.categoryKey === currentProj.categoryKey)
    .slice(0, 2);

  // If we don't have enough, pick any other projects
  if (related.length < 2) {
    const fallbackProjects = allProjects
      .filter(p => p.id !== currentProj.id && !related.includes(p))
      .slice(0, 2 - related.length);
    related.push(...fallbackProjects);
  }

  related.forEach((proj, idx) => {
    const card = document.createElement("a");
    card.href = `project.html?id=${proj.id}`;
    card.className = "project-card glass-panel reveal";
    card.style.animationDelay = `${idx * 0.1}s`;

    const coverPath = `projects/${proj.id}/images/1.jpg`;

    card.innerHTML = `
      <img src="${coverPath}" alt="${proj.name.en}" class="project-cover" onerror="this.src='assets/images/default-cover.jpg'; this.onerror=null;">
      <div class="project-overlay">
        <span class="project-card-cat">${proj.category[lang]}</span>
        <h3 class="project-card-title">${proj.name.en}</h3>
        <p class="project-card-desc">${proj.description[lang]}</p>
      </div>
    `;

    container.appendChild(card);
  });

  if (window.revealObserver) {
    container.querySelectorAll(".project-card.reveal").forEach(el => window.revealObserver.observe(el));
  } else {
    setTimeout(() => {
      container.querySelectorAll(".project-card").forEach(el => el.classList.add("active"));
    }, 100);
  }
}
