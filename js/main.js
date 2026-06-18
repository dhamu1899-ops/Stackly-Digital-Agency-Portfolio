const dotHTML = '<span class="accent-dots" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span>';

document.querySelectorAll("[data-dots]").forEach((node) => {
  node.insertAdjacentHTML("beforeend", dotHTML);
});

document.body.insertAdjacentHTML("beforeend", '<div class="toast-message" role="status" aria-live="polite"></div>');
const toast = document.querySelector(".toast-message");

const showToast = (message) => {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2400);
};

const formatStatValue = (value, suffix) => {
  if (suffix === "%") return `${value}%`;
  if (suffix === "/7") return `${value}/7`;
  return `${value}${suffix || ""}`;
};

document.querySelectorAll(".stat strong").forEach((node) => {
  const text = node.textContent.trim();
  const match = text.match(/^(\d+)(.*)$/);
  if (!match) return;
  node.dataset.target = match[1];
  node.dataset.suffix = match[2] || "";
  node.textContent = formatStatValue(0, node.dataset.suffix);
});

document.querySelectorAll(".menu-toggle").forEach((button) => {
  button.addEventListener("click", () => {
    const menu = document.querySelector(".nav-menu");
    menu?.classList.toggle("open");
  });
});

document.querySelectorAll("[data-year]").forEach((node) => {
  node.textContent = new Date().getFullYear();
});

document.querySelectorAll(".slider-controls button").forEach((button) => {
  button.addEventListener("click", () => {
    const section = button.closest("section");
    const reviewTrack = section?.querySelector(".testimonial-track");
    if (reviewTrack) {
      const cards = [...reviewTrack.querySelectorAll(".testimonial-card")];
      const avatars = [...section.querySelectorAll(".avatar-strip img")];
      if (!cards.length) return;
      const current = Number(reviewTrack.dataset.active || 1);
      const direction = button.classList.contains("next") ? 1 : -1;
      const next = (current + direction + cards.length) % cards.length;
      setReviewCarousel(reviewTrack, next);
      const focusAvatar = avatars.findIndex((_, index) => index % cards.length === next);
      avatars.forEach((avatar, index) => avatar.classList.toggle("active", index === focusAvatar));
      button.closest(".slider-controls")?.querySelectorAll("button").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      window.setTimeout(() => button.classList.remove("active"), 320);
      return;
    }
    const track = section?.querySelector(".projects-grid");
    if (!track) return;
    const amount = button.classList.contains("next") ? 420 : -420;
    button.closest(".slider-controls")?.querySelectorAll("button").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    window.setTimeout(() => button.classList.remove("active"), 320);
    track.scrollBy({ left: amount, behavior: "smooth" });
  });
});

document.querySelectorAll("section, header, footer, .auth-card, .not-found").forEach((node) => {
  node.classList.add("reveal");
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("show");
      entry.target.classList.remove("zoom-out");
      entry.target.querySelectorAll?.(".stat strong").forEach((node) => {
        if (node.dataset.counted) return;
        node.dataset.counted = "true";
        const target = Number(node.dataset.target || 0);
        const suffix = node.dataset.suffix || "";
        const start = performance.now();
        const duration = 1500;
        const tick = (now) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          node.textContent = formatStatValue(Math.round(target * eased), suffix);
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    } else if (entry.target.classList.contains("show")) {
      entry.target.classList.add("zoom-out");
      entry.target.classList.remove("show");
    }
  });
}, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

document.querySelectorAll(".reveal").forEach((node) => revealObserver.observe(node));

const cardObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("slide-in");
      cardObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.18 });

document.querySelectorAll(".project-card").forEach((card) => cardObserver.observe(card));

const setReviewCarousel = (track, activeIndex) => {
  const cards = [...track.querySelectorAll(".testimonial-card")];
  if (!cards.length) return;
  const active = ((activeIndex % cards.length) + cards.length) % cards.length;
  const left = (active - 1 + cards.length) % cards.length;
  const right = (active + 1) % cards.length;
  track.dataset.active = String(active);
  cards.forEach((card, index) => {
    card.classList.remove("active", "featured", "position-left", "position-right");
    if (index === active) card.classList.add("active");
    if (index === left) card.classList.add("position-left");
    if (index === right) card.classList.add("position-right");
  });
};

document.querySelectorAll(".testimonial-track").forEach((track) => {
  const cards = [...track.querySelectorAll(".testimonial-card")];
  const section = track.closest("section");
  const avatars = [...section.querySelectorAll(".avatar-strip img")];
  setReviewCarousel(track, 1);
  avatars.forEach((avatar, index) => {
    avatar.classList.toggle("active", index === 1);
    avatar.addEventListener("click", () => {
      const target = index % cards.length;
      setReviewCarousel(track, target);
      avatars.forEach((item, avatarIndex) => item.classList.toggle("active", avatarIndex === index));
    });
  });
});

document.querySelectorAll("form").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    let valid = true;

    form.querySelectorAll(".field-wrap").forEach((wrap) => {
      const input = wrap.querySelector("input");
      const error = wrap.querySelector(".field-error");
      if (!input || !error) return;

      const value = input.value.trim();
      let message = "";

      if (input.required && !value) {
        message = "This field is required.";
      } else if (input.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        message = "Please enter a correct email address.";
      }

      wrap.classList.toggle("invalid", Boolean(message));
      error.textContent = message;
      if (message && valid) {
        input.focus();
      }
      if (message) valid = false;
    });

    const terms = form.querySelector('.terms-inline input[type="checkbox"]');
    if (terms && !terms.checked) {
      showToast("Please agree to the terms and conditions.");
      valid = false;
    }

    form.querySelectorAll('input[required]:not(.field-wrap input), textarea[required]:not(.field-wrap textarea)').forEach((input) => {
      const value = input.value.trim();
      let message = "";
      if (!value) {
        message = "This field is required.";
      } else if (input.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        message = "Please enter a correct email address.";
      }
      input.classList.toggle("input-error", Boolean(message));
      if (message && valid) input.focus();
      if (message) {
        showToast(message);
        valid = false;
      }
    });

    if (!valid) return;

    if (form.dataset.emailRedirect) {
      window.location.href = form.dataset.emailRedirect;
      return;
    }

    if (form.closest(".auth-page")) {
      const activeRole = form.querySelector(".role-btn.active")?.textContent.trim().toLowerCase() || "user";
      showToast("Login successful. Opening your dashboard...");
      window.setTimeout(() => {
        window.location.href = activeRole === "admin" ? "admin-dashboard.html" : "user-dashboard.html";
      }, 550);
      return;
    }

    showToast("Thanks. Stackly will contact you soon.");
    form.reset();
  });

  form.querySelectorAll("input, textarea").forEach((input) => {
    input.addEventListener("input", () => {
      const wrap = input.closest(".field-wrap");
      input.classList.remove("input-error");
      if (!wrap) return;
      wrap.classList.remove("invalid");
      const error = wrap.querySelector(".field-error");
      if (error) error.textContent = "";
    });
  });
});


document.querySelectorAll(".feature-card").forEach((card) => {
  const target = card.querySelector('a[href="404.html"]')?.getAttribute("href");
  if (!target) return;
  card.setAttribute("role", "link");
  card.setAttribute("tabindex", "0");
  card.addEventListener("click", (event) => {
    if (event.target.closest("a")) return;
    window.location.href = target;
  });
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      window.location.href = target;
    }
  });
});

document.querySelectorAll(".socials a").forEach((link) => {
  link.addEventListener("click", () => {
    sessionStorage.setItem("stacklyLastSocial", link.getAttribute("aria-label") || "social");
  });
});

document.querySelectorAll("[data-filter]").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    document.querySelectorAll("[data-filter]").forEach((item) => item.classList.remove("pill-btn"));
    document.querySelectorAll("[data-filter]").forEach((item) => item.classList.add("ghost-btn"));
    button.classList.remove("ghost-btn");
    button.classList.add("pill-btn");
    showToast(`${button.textContent.trim()} projects selected.`);
  });
});

document.querySelectorAll("[data-go-back]").forEach((button) => {
  button.addEventListener("click", () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "index.html";
    }
  });
});

document.querySelectorAll(".role-select").forEach((group) => {
  group.querySelectorAll(".role-btn").forEach((button) => {
    button.addEventListener("click", () => {
      group.querySelectorAll(".role-btn").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
    });
  });
});


// Premium mouse pointer glow
(() => {
  if (window.matchMedia("(pointer: coarse)").matches) return;
  const cursor = document.createElement("div");
  cursor.className = "cursor-glow";
  document.body.appendChild(cursor);

  let x = -100;
  let y = -100;
  let tx = -100;
  let ty = -100;

  window.addEventListener("mousemove", (event) => {
    tx = event.clientX - 17;
    ty = event.clientY - 17;
  });

  document.querySelectorAll("a, button, input, .team-card-pro, .service-card, .value-card").forEach((node) => {
    node.addEventListener("mouseenter", () => cursor.classList.add("cursor-active"));
    node.addEventListener("mouseleave", () => cursor.classList.remove("cursor-active"));
  });

  const render = () => {
    x += (tx - x) * 0.18;
    y += (ty - y) * 0.18;
    cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    requestAnimationFrame(render);
  };
  render();
})();

// Mobile-only corrections: full menu overlay, close icon, and mobile Get in Touch item
(() => {
  const menu = document.querySelector('.nav-menu');
  const toggle = document.querySelector('.menu-toggle');
  if (!menu || !toggle) return;
  if (!menu.querySelector('.mobile-touch-link')) {
    const li = document.createElement('li');
    li.className = 'mobile-touch-item';
    li.innerHTML = '<a class="mobile-touch-link" href="signin.html">Get in Touch</a>';
    menu.appendChild(li);
  }
  const syncMenu = () => {
    const open = menu.classList.contains('open');
    toggle.classList.toggle('active', open);
    document.body.classList.toggle('mobile-menu-open', open && window.innerWidth <= 991);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  };
  toggle.addEventListener('click', () => requestAnimationFrame(syncMenu));
  menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
    menu.classList.remove('open');
    syncMenu();
  }));
  window.addEventListener('resize', syncMenu);
})();
