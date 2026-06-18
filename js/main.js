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


/* FINAL FIX: dynamic login profile + password show/hide */
(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const makeName = (emailValue) => {
    const prefix = String(emailValue || '').trim().toLowerCase().split('@')[0] || 'user';
    return prefix
      .replace(/[._-]+/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') || 'User';
  };

  const saveUser = (email, role) => {
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanRole = String(role || 'user').trim().toLowerCase() === 'admin' ? 'admin' : 'user';
    const user = {
      name: makeName(cleanEmail),
      email: cleanEmail,
      role: cleanRole,
      loginRoleLabel: cleanRole === 'admin' ? 'Login Admin' : 'Login User',
      loggedInAt: Date.now()
    };
    localStorage.setItem('stacklyAuthUser', JSON.stringify(user));
    localStorage.setItem('stacklyLastLoginEmail', user.email);
    localStorage.setItem('stacklyLastLoginName', user.name);
    localStorage.setItem('stacklyLastLoginRole', user.role);
    sessionStorage.setItem('stacklyCurrentLoginEmail', user.email);
    sessionStorage.setItem('stacklyCurrentLoginName', user.name);
    sessionStorage.setItem('stacklyCurrentLoginRole', user.role);
    return user;
  };

  const getSavedUser = () => {
    const params = new URLSearchParams(window.location.search);
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('stacklyAuthUser') || 'null'); } catch (e) { stored = null; }
    const email = String(
      params.get('email') ||
      sessionStorage.getItem('stacklyCurrentLoginEmail') ||
      localStorage.getItem('stacklyLastLoginEmail') ||
      stored?.email ||
      ''
    ).trim().toLowerCase();
    const pageRole = document.body.classList.contains('user-dashboard-body') ? 'user' : 'admin';
    const role = String(params.get('role') || sessionStorage.getItem('stacklyCurrentLoginRole') || localStorage.getItem('stacklyLastLoginRole') || stored?.role || pageRole).toLowerCase() === 'admin' ? 'admin' : 'user';
    const name = email ? makeName(email) : makeName(params.get('name') || stored?.email || 'user@example.com');
    return { name, email: email || 'user@example.com', role: pageRole, loginRoleLabel: pageRole === 'admin' ? 'Login Admin' : 'Login User' };
  };

  const applyDashboardUser = () => {
    if (!document.body.classList.contains('admin-dashboard-body')) return;
    const user = getSavedUser();
    if (user.email && user.email !== 'user@example.com') saveUser(user.email, user.role);

    document.querySelectorAll('.admin-profile, .admin-mini-profile').forEach((profile) => {
      const strong = profile.querySelector('strong');
      const roleText = profile.querySelector('span:not(.admin-icon):not(.admin-dot)');
      const small = profile.querySelector('small');
      if (strong) strong.textContent = user.name;
      if (roleText) roleText.textContent = user.loginRoleLabel;
      if (small) small.textContent = user.email;
    });

    document.querySelectorAll('.admin-title-row h1, .dashboard-welcome h1').forEach((heading) => {
      const text = heading.textContent.trim();
      if (/welcome back/i.test(text)) heading.textContent = `Welcome back, ${user.name}! 👋`;
    });

    document.querySelectorAll('.profile-card h3').forEach((node) => { node.textContent = user.name; });
    document.querySelectorAll('.profile-card p').forEach((node) => { node.textContent = user.loginRoleLabel; });
    document.querySelectorAll('.profile-form input').forEach((input) => {
      const labelText = input.closest('label')?.textContent || '';
      if (/Full Name/i.test(labelText)) input.value = user.name;
      if (/Email Address/i.test(labelText)) input.value = user.email;
    });
    document.querySelectorAll('td').forEach((cell) => {
      if (/^(Guest|User|Admin|Dhamu)$/i.test(cell.textContent.trim())) cell.textContent = user.name;
    });
  };

  const prepareAuth = () => {
    document.querySelectorAll('.auth-page input[type="email"]').forEach((input) => {
      input.setAttribute('autocapitalize', 'none');
      input.setAttribute('spellcheck', 'false');
      input.addEventListener('input', () => { input.value = input.value.toLowerCase(); });
    });

    document.querySelectorAll('.auth-page input[type="password"]').forEach((input) => {
      if (input.parentElement?.querySelector('.password-toggle-btn')) return;
      input.parentElement?.classList.add('password-field-wrap');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'password-toggle-btn';
      btn.setAttribute('aria-label', 'Show password');
      btn.textContent = '👁';
      btn.addEventListener('click', () => {
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        btn.textContent = show ? '🙈' : '👁';
        btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      });
      input.insertAdjacentElement('afterend', btn);
    });
  };

  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || !form.closest('.auth-page')) return;
    event.preventDefault();
    event.stopImmediatePropagation();

    const emailInput = form.querySelector('input[type="email"]');
    const passwordInput = form.querySelector('input[type="password"], input[type="text"][name*="password" i]');
    const terms = form.querySelector('.terms-inline input[type="checkbox"]');
    const email = String(emailInput?.value || '').trim().toLowerCase();
    if (emailInput) emailInput.value = email;

    if (!emailRegex.test(email)) {
      if (typeof showToast === 'function') showToast('Please enter a correct email address.');
      emailInput?.focus();
      return;
    }
    if (passwordInput && !passwordInput.value.trim()) {
      if (typeof showToast === 'function') showToast('Password is required.');
      passwordInput.focus();
      return;
    }
    if (terms && !terms.checked) {
      if (typeof showToast === 'function') showToast('Please agree to the terms and conditions.');
      terms.focus();
      return;
    }

    const role = form.querySelector('.role-btn.active')?.textContent.trim().toLowerCase() || 'user';
    const user = saveUser(email, role);
    const targetPage = user.role === 'admin' ? 'admin-dashboard.html' : 'user-dashboard.html';
    const query = new URLSearchParams({ email: user.email, name: user.name, role: user.role, t: String(Date.now()) }).toString();
    if (typeof showToast === 'function') showToast('Login successful. Opening your dashboard...');
    window.setTimeout(() => { window.location.href = `${targetPage}?${query}`; }, 150);
  }, true);

  prepareAuth();
  applyDashboardUser();
  document.addEventListener('DOMContentLoaded', () => { prepareAuth(); applyDashboardUser(); });
})();

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
      const emailInput = form.querySelector('input[type="email"]');
      const loginEmail = (emailInput?.value.trim() || "").toLowerCase();
      const emailPrefix = loginEmail.split("@")[0] || "user";
      const displayName = emailPrefix
        .replace(/[._-]+/g, " ")
        .split(" ")
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ") || "User";

      localStorage.setItem("stacklyAuthUser", JSON.stringify({
        name: displayName,
        email: loginEmail,
        role: activeRole
      }));
      sessionStorage.setItem("stacklyCurrentLoginEmail", loginEmail);
      sessionStorage.setItem("stacklyCurrentLoginName", displayName);
      sessionStorage.setItem("stacklyCurrentLoginRole", activeRole);

      showToast("Login successful. Opening your dashboard...");
      window.setTimeout(() => {
        const targetPage = activeRole === "admin" ? "admin-dashboard.html" : "user-dashboard.html";
        const query = new URLSearchParams({ email: loginEmail, name: displayName, role: activeRole }).toString();
        window.location.href = `${targetPage}?${query}`;
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


// Keep login/signup email fields lowercase only
document.querySelectorAll('input[type="email"]').forEach((input) => {
  input.setAttribute("autocapitalize", "none");
  input.setAttribute("autocomplete", input.name === "email" ? "email" : input.getAttribute("autocomplete") || "off");
  input.addEventListener("input", () => {
    const lowerValue = input.value.toLowerCase();
    if (input.value !== lowerValue) input.value = lowerValue;
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


// Dashboard user details from login email
(() => {
  if (!document.body.classList.contains("admin-dashboard-body")) return;

  const pageRole = document.body.classList.contains("user-dashboard-body") ? "user" : "admin";

  const makeNameFromEmail = (emailValue) => {
    const prefix = (emailValue || "").split("@")[0] || "user";
    return prefix
      .replace(/[._-]+/g, " ")
      .split(" ")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ") || "User";
  };

  let authUser = null;
  try {
    authUser = JSON.parse(localStorage.getItem("stacklyAuthUser") || "null");
  } catch (error) {
    authUser = null;
  }

  const params = new URLSearchParams(window.location.search);
  const paramEmail = (params.get("email") || "").trim().toLowerCase();
  const paramName = (params.get("name") || "").trim();
  const storedEmail = (paramEmail || authUser?.email || sessionStorage.getItem("stacklyCurrentLoginEmail") || "guest@example.com").toLowerCase();
  const email = storedEmail;
  const name = paramName || makeNameFromEmail(email);
  const roleLabel = pageRole === "admin" ? "Login Admin" : "Login User";

  // keep latest login details clean and reusable for next page refresh
  localStorage.setItem("stacklyAuthUser", JSON.stringify({ name, email, role: pageRole }));

  document.querySelectorAll(".admin-profile, .admin-mini-profile").forEach((profile) => {
    const strong = profile.querySelector("strong");
    const roleText = profile.querySelector("span:not(.admin-icon):not(.admin-dot)");
    const small = profile.querySelector("small");
    if (strong) strong.textContent = name;
    if (roleText) roleText.textContent = roleLabel;
    if (small) small.textContent = email;
  });

  document.querySelectorAll(".admin-title-row h1").forEach((heading) => {
    heading.textContent = `Welcome back, ${name}! 👋`;
  });

  document.querySelectorAll("td").forEach((cell) => {
    const text = cell.textContent.trim();
    if (["Dhamu", "User", "Admin"].includes(text)) cell.textContent = name;
  });

  document.querySelectorAll(".profile-card h3").forEach((node) => { node.textContent = name; });
  document.querySelectorAll(".profile-card p").forEach((node) => {
    if (/Login User|Login Admin|User|Admin/i.test(node.textContent.trim())) node.textContent = roleLabel;
  });

  document.querySelectorAll('input[value="Dhamu"], input[value="User"], input[value="Admin"], input[value="Guest"]').forEach((input) => { input.value = name; });
  document.querySelectorAll('input[value="dhamu@gmail.com"], input[value="user@example.com"], input[value="admin@example.com"], input[value="guest@example.com"]').forEach((input) => { input.value = email; });
  document.querySelectorAll(".profile-form input").forEach((input) => {
    const labelText = input.closest("label")?.textContent || "";
    if (/Full Name/i.test(labelText)) input.value = name;
    if (/Email Address/i.test(labelText)) input.value = email;
  });

  document.querySelectorAll(".mini-member span").forEach((node) => {
    node.innerHTML = node.innerHTML.replace(/^(Dhamu|User|Admin)(<br>|\s)/i, `${name}$2`);
  });
})();


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

/* Final auth/dashboard dynamic details fix - no hardcoded Guest/Dhamu/User values after login */
(() => {
  const makeNameFromEmailFinal = (emailValue) => {
    const prefix = String(emailValue || "").trim().toLowerCase().split("@")[0] || "user";
    return prefix
      .replace(/[._-]+/g, " ")
      .split(" ")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ") || "User";
  };

  const saveLoginFinal = (email, role) => {
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanRole = String(role || "user").trim().toLowerCase() === "admin" ? "admin" : "user";
    const cleanName = makeNameFromEmailFinal(cleanEmail);
    const payload = { name: cleanName, email: cleanEmail, role: cleanRole, loggedInAt: Date.now() };
    localStorage.setItem("stacklyAuthUser", JSON.stringify(payload));
    localStorage.setItem("stacklyLastLoginEmail", cleanEmail);
    localStorage.setItem("stacklyLastLoginName", cleanName);
    localStorage.setItem("stacklyLastLoginRole", cleanRole);
    sessionStorage.setItem("stacklyCurrentLoginEmail", cleanEmail);
    sessionStorage.setItem("stacklyCurrentLoginName", cleanName);
    sessionStorage.setItem("stacklyCurrentLoginRole", cleanRole);
    return payload;
  };

  document.querySelectorAll('.auth-page input[type="email"]').forEach((input) => {
    input.setAttribute("autocapitalize", "none");
    input.setAttribute("spellcheck", "false");
    input.addEventListener("input", () => {
      input.value = input.value.toLowerCase();
    });
  });

  document.addEventListener("submit", (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || !form.closest(".auth-page")) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const emailInput = form.querySelector('input[type="email"]');
    const passwordInput = form.querySelector('input[type="password"]');
    const email = (emailInput?.value || "").trim().toLowerCase();
    if (emailInput) emailInput.value = email;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast?.("Please enter a correct email address.");
      emailInput?.focus();
      return;
    }
    if (passwordInput && !passwordInput.value.trim()) {
      showToast?.("Password is required.");
      passwordInput.focus();
      return;
    }

    const role = form.querySelector(".role-btn.active")?.textContent.trim().toLowerCase() || "user";
    const user = saveLoginFinal(email, role);
    const targetPage = user.role === "admin" ? "admin-dashboard.html" : "user-dashboard.html";
    const query = new URLSearchParams({ email: user.email, name: user.name, role: user.role, t: String(Date.now()) }).toString();
    showToast?.("Login successful. Opening your dashboard...");
    window.location.href = `${targetPage}?${query}`;
  }, true);

  if (!document.body.classList.contains("admin-dashboard-body")) return;

  const dashboardRole = document.body.classList.contains("user-dashboard-body") ? "user" : "admin";
  const params = new URLSearchParams(window.location.search);
  let stored = null;
  try { stored = JSON.parse(localStorage.getItem("stacklyAuthUser") || "null"); } catch (error) { stored = null; }

  const email = (
    params.get("email") ||
    sessionStorage.getItem("stacklyCurrentLoginEmail") ||
    localStorage.getItem("stacklyLastLoginEmail") ||
    stored?.email ||
    ""
  ).trim().toLowerCase();

  const name = makeNameFromEmailFinal(email || params.get("name") || stored?.email || "user@example.com");
  const roleLabel = dashboardRole === "admin" ? "Login Admin" : "Login User";

  if (email) saveLoginFinal(email, dashboardRole);

  document.querySelectorAll(".admin-profile, .admin-mini-profile").forEach((profile) => {
    const strong = profile.querySelector("strong");
    const roleText = profile.querySelector("span:not(.admin-icon):not(.admin-dot)");
    const small = profile.querySelector("small");
    if (strong) strong.textContent = name;
    if (roleText) roleText.textContent = roleLabel;
    if (small) small.textContent = email || "";
  });

  document.querySelectorAll(".admin-title-row h1, .dashboard-welcome h1").forEach((heading) => {
    heading.textContent = `Welcome back, ${name}! 👋`;
  });

  document.querySelectorAll(".profile-card h3").forEach((node) => { node.textContent = name; });
  document.querySelectorAll(".profile-card p").forEach((node) => { node.textContent = roleLabel; });
  document.querySelectorAll(".profile-form input").forEach((input) => {
    const labelText = input.closest("label")?.textContent || "";
    if (/Full Name/i.test(labelText)) input.value = name;
    if (/Email Address/i.test(labelText)) input.value = email;
  });
})();

/* ULTIMATE FIX: login email/name must always replicate in Admin/User dashboard */
(() => {
  const STORAGE_KEY = 'stacklyAuthUser';
  const LIVE_EMAIL_KEY = 'stacklyLiveLoginEmail';
  const LIVE_ROLE_KEY = 'stacklyLiveLoginRole';

  const titleName = (email) => {
    const prefix = String(email || '').trim().toLowerCase().split('@')[0] || 'user';
    return prefix
      .replace(/[._-]+/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ') || 'User';
  };

  const cleanRole = (role) => String(role || 'user').trim().toLowerCase() === 'admin' ? 'admin' : 'user';

  const saveProfile = (email, role) => {
    const cleanEmail = String(email || '').trim().toLowerCase().replace(/\s+/g, '');
    const finalRole = cleanRole(role);
    const profile = {
      name: titleName(cleanEmail),
      email: cleanEmail,
      role: finalRole,
      loginRoleLabel: finalRole === 'admin' ? 'Login Admin' : 'Login User',
      loggedInAt: Date.now()
    };
    if (cleanEmail) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      localStorage.setItem('stacklyLastLoginEmail', cleanEmail);
      localStorage.setItem('stacklyLastLoginName', profile.name);
      localStorage.setItem('stacklyLastLoginRole', finalRole);
      localStorage.setItem(LIVE_EMAIL_KEY, cleanEmail);
      localStorage.setItem(LIVE_ROLE_KEY, finalRole);
      sessionStorage.setItem('stacklyCurrentLoginEmail', cleanEmail);
      sessionStorage.setItem('stacklyCurrentLoginName', profile.name);
      sessionStorage.setItem('stacklyCurrentLoginRole', finalRole);
    }
    return profile;
  };

  const readProfile = () => {
    const params = new URLSearchParams(window.location.search);
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch (e) { stored = null; }
    const pageRole = document.body.classList.contains('user-dashboard-body') ? 'user' : 'admin';
    const email = String(
      params.get('email') ||
      sessionStorage.getItem('stacklyCurrentLoginEmail') ||
      localStorage.getItem(LIVE_EMAIL_KEY) ||
      localStorage.getItem('stacklyLastLoginEmail') ||
      (stored && !/^guest@|^user@/i.test(stored.email || '') ? stored.email : '') ||
      ''
    ).trim().toLowerCase().replace(/\s+/g, '');
    const role = cleanRole(params.get('role') || sessionStorage.getItem('stacklyCurrentLoginRole') || localStorage.getItem(LIVE_ROLE_KEY) || pageRole);
    return saveProfile(email, pageRole || role);
  };

  const applyProfile = () => {
    if (!document.body.classList.contains('admin-dashboard-body')) return;
    const profile = readProfile();
    if (!profile.email) return;
    const roleLabel = document.body.classList.contains('user-dashboard-body') ? 'Login User' : 'Login Admin';

    document.querySelectorAll('.admin-profile, .admin-mini-profile').forEach((card) => {
      const strong = card.querySelector('strong');
      const small = card.querySelector('small');
      const span = Array.from(card.querySelectorAll('span')).find((node) => !node.classList.contains('admin-icon') && !node.classList.contains('admin-dot'));
      if (strong) strong.textContent = profile.name;
      if (span) span.textContent = roleLabel;
      if (small) small.textContent = profile.email;
    });

    document.querySelectorAll('.admin-title-row h1, .dashboard-welcome h1').forEach((heading) => {
      heading.textContent = `Welcome back, ${profile.name}! 👋`;
    });
    document.querySelectorAll('.profile-card h3').forEach((node) => { node.textContent = profile.name; });
    document.querySelectorAll('.profile-card p').forEach((node) => { node.textContent = roleLabel; });
    document.querySelectorAll('.profile-form input').forEach((input) => {
      const label = input.closest('label')?.textContent || '';
      if (/Full Name/i.test(label)) input.value = profile.name;
      if (/Email Address/i.test(label)) input.value = profile.email;
    });
  };

  // Store the email while typing, so dashboard never falls back to Guest.
  document.querySelectorAll('.auth-page input[type="email"]').forEach((input) => {
    input.setAttribute('autocapitalize', 'none');
    input.setAttribute('spellcheck', 'false');
    input.addEventListener('input', () => {
      input.value = input.value.toLowerCase().replace(/\s+/g, '');
      const role = input.closest('form')?.querySelector('.role-btn.active')?.textContent || localStorage.getItem(LIVE_ROLE_KEY) || 'user';
      if (input.value) saveProfile(input.value, role);
    });
  });

  document.querySelectorAll('.auth-page .role-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const email = btn.closest('form')?.querySelector('input[type="email"]')?.value || localStorage.getItem(LIVE_EMAIL_KEY) || '';
      localStorage.setItem(LIVE_ROLE_KEY, cleanRole(btn.textContent));
      if (email) saveProfile(email, btn.textContent);
    });
  });

  // Window capture runs before the older document handlers in this file.
  window.addEventListener('submit', (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || !form.closest('.auth-page')) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const emailInput = form.querySelector('input[type="email"]');
    const passwordInput = form.querySelector('input[type="password"], input[type="text"][name*="password" i]');
    const terms = form.querySelector('.terms-inline input[type="checkbox"]');
    const email = String(emailInput?.value || '').trim().toLowerCase().replace(/\s+/g, '');
    if (emailInput) emailInput.value = email;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast?.('Please enter a correct email address.'); emailInput?.focus(); return; }
    if (passwordInput && !passwordInput.value.trim()) { showToast?.('Password is required.'); passwordInput.focus(); return; }
    if (terms && !terms.checked) { showToast?.('Please agree to the terms and conditions.'); terms.focus(); return; }

    const role = cleanRole(form.querySelector('.role-btn.active')?.textContent || localStorage.getItem(LIVE_ROLE_KEY) || 'user');
    const profile = saveProfile(email, role);
    const target = role === 'admin' ? 'admin-dashboard.html' : 'user-dashboard.html';
    const query = new URLSearchParams({ email: profile.email, name: profile.name, role: profile.role, t: String(Date.now()) }).toString();
    window.location.href = `${target}?${query}`;
  }, true);

  applyProfile();
  document.addEventListener('DOMContentLoaded', applyProfile);
  window.addEventListener('pageshow', applyProfile);
})();
