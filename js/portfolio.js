// ==========================================
// BAYTKOM DIGITAL - PORTFOLIO GRID ENGINE
// ==========================================

let allProjectsData = [];

document.addEventListener("DOMContentLoaded", () => {
  const portfolioGrid = document.getElementById("portfolio-grid");
  const filterContainer = document.getElementById("portfolio-filter");
  
  if (!portfolioGrid) return; // Not on portfolio page or home grid section

  // Load projects from JSON
  fetch("data/projects.json")
    .ajaxLoad = true; // flag indicator
  
  fetch("data/projects.json")
    .then(response => {
      if (!response.ok) throw new Error("Failed to load projects database");
      return response.json();
    })
    .then(data => {
      allProjectsData = data;
      
      // Determine active page constraints: Limit to featured on homepage
      const isHomepage = portfolioGrid.hasAttribute("data-featured-only");
      const projectsToRender = isHomepage 
        ? allProjectsData.filter(p => p.featured) 
        : allProjectsData;

      renderProjectsGrid(projectsToRender);
      
      // Setup filter button event listeners
      if (filterContainer) {
        setupFilterButtons(filterContainer, isHomepage);
      }
    })
    .catch(err => {
      console.error("Error loading portfolio:", err);
      portfolioGrid.innerHTML = `
        <div class="grid-error-msg" style="grid-column: 1/-1; text-align: center; color: var(--secondary); padding: 3rem;">
          <p>عذراً، تعذر تحميل المشروعات حالياً. يرجى إعادة المحاولة لاحقاً.</p>
          <p style="font-size:0.9rem; color:var(--text-dim); margin-top:0.5rem;">Error loading projects.json data.</p>
        </div>
      `;
    });

  // Re-render when language changes
  window.addEventListener("langchanged", () => {
    const activeFilterBtn = document.querySelector(".filter-btn.active");
    const activeCat = activeFilterBtn ? activeFilterBtn.getAttribute("data-filter") : "all";
    filterAndRender(activeCat, portfolioGrid.hasAttribute("data-featured-only"));
  });
});

// ==========================================
// CORE RENDER AND MAPPING FUNCTIONS
// ==========================================

function renderProjectsGrid(projects) {
  const grid = document.getElementById("portfolio-grid");
  if (!grid) return;
  
  const currentLang = document.documentElement.lang || "ar";
  grid.innerHTML = "";

  if (projects.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; color: var(--text-dim); padding: 4rem 2rem;">
        <p>${currentLang === "ar" ? "لا توجد مشروعات مطابقة لهذا القسم حالياً." : "No projects found matching this category."}</p>
      </div>
    `;
    return;
  }

  projects.forEach((proj, idx) => {
    const card = document.createElement("a");
    card.href = `project.html?id=${proj.id}`;
    card.className = "project-card glass-panel reveal";
    card.style.animationDelay = `${idx * 0.1}s`;
    
    // Auto cover path convention: projects/project-name/images/1.jpg or default placeholder
    const coverPath = `projects/${proj.id}/images/1.jpg`;
    
    // Services tags markup
    const tagsArray = proj.services[currentLang] || [];
    const tagsMarkup = tagsArray.map(tag => `<span class="project-tag">${tag}</span>`).slice(0, 3).join("");

    card.innerHTML = `
      <img src="${coverPath}" alt="${proj.name.en}" class="project-cover" onerror="this.src='assets/images/default-cover.jpg'; this.onerror=null;">
      <div class="project-overlay">
        <div class="project-header-box">
          <span class="project-card-cat">${proj.category[currentLang]}</span>
          <div class="project-logo-ph" id="logo-ph-${proj.id}">
            <!-- Logo will be probed dynamically in project details page, here we display project name or default logo icon -->
            <img src="projects/${proj.id}/logo/logo.png" alt="" onerror="this.parentElement.style.display='none';">
          </div>
        </div>
        <h3 class="project-card-title">${proj.name.en}</h3>
        <p class="project-card-desc">${proj.description[currentLang]}</p>
        <div class="project-services-tags">
          ${tagsMarkup}
        </div>
      </div>
    `;

    grid.appendChild(card);
    
    // Trigger image checking for logo to see if svg/jpg exists instead of png
    probeCardLogo(proj.id);
  });

  // Re-observe newly added elements
  if (window.revealObserver) {
    document.querySelectorAll(".project-card.reveal").forEach(el => window.revealObserver.observe(el));
  } else {
    // Immediate activation fallback
    setTimeout(() => {
      document.querySelectorAll(".project-card").forEach(el => el.classList.add("active"));
    }, 100);
  }
}

// Check logo format extension support in background
function probeCardLogo(projectId) {
  const formats = ["png", "svg", "jpg", "webp"];
  const container = document.getElementById(`logo-ph-${projectId}`);
  if (!container) return;
  const imgEl = container.querySelector("img");
  
  let found = false;
  
  const testFormat = (idx) => {
    if (idx >= formats.length || found) return;
    const testImg = new Image();
    const url = `projects/${projectId}/logo/logo.${formats[idx]}`;
    
    testImg.onload = () => {
      imgEl.src = url;
      container.style.display = "flex";
      found = true;
    };
    
    testImg.onerror = () => {
      testFormat(idx + 1);
    };
    
    testImg.src = url;
  };

  testFormat(0);
}

// ==========================================
// CATEGORY FILTER ALGORITHMS
// ==========================================

function setupFilterButtons(container, isHomepage) {
  const buttons = container.querySelectorAll(".filter-btn");
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      const filterValue = btn.getAttribute("data-filter");
      filterAndRender(filterValue, isHomepage);
    });
  });
}

function filterAndRender(category, isHomepage) {
  let filtered = isHomepage 
    ? allProjectsData.filter(p => p.featured) 
    : allProjectsData;

  if (category !== "all") {
    filtered = filtered.filter(p => {
      // Map filter key to english services content
      const services = p.services.en.map(s => s.toLowerCase());
      
      switch(category) {
        case "branding":
          return services.some(s => s.includes("branding") || s.includes("identity"));
        case "social-media":
          return services.some(s => s.includes("social") || s.includes("community") || s.includes("designs"));
        case "websites":
          return services.some(s => s.includes("web") || s.includes("landing") || s.includes("develop"));
        case "ai-videos":
          return services.some(s => s.includes("ai") || s.includes("video") || s.includes("commercial") || s.includes("graphics"));
        case "advertising":
          return services.some(s => s.includes("ad") || s.includes("campaign") || s.includes("lead") || s.includes("paid"));
        default:
          return false;
      }
    });
  }

  renderProjectsGrid(filtered);
}
