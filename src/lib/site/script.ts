/** Browser behaviour for a generated site. Static text, no user content is interpolated. */
export const SITE_SCRIPT = `(function () {
  "use strict";
  var root = document.documentElement;
  root.classList.add("js");

  var themeBtn = document.querySelector("[data-theme-toggle]");
  var key = "site-theme:" + location.pathname;
  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    if (themeBtn) {
      themeBtn.textContent = theme === "dark" ? "Light mode" : "Dark mode";
      themeBtn.setAttribute("aria-pressed", String(theme === "dark"));
    }
  }
  var saved = null;
  try { saved = localStorage.getItem(key); } catch (e) {}
  applyTheme(saved === "light" || saved === "dark" ? saved : root.getAttribute("data-theme"));
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
      try { localStorage.setItem(key, next); } catch (e) {}
    });
  }

  var menuBtn = document.querySelector("[data-menu-toggle]");
  var nav = document.getElementById("nav");

  // In-page links are handled here: inside an embedded preview, a bare "#id"
  // href would otherwise resolve against the embedding page's URL.
  document.addEventListener("click", function (e) {
    var link = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!link || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var id = link.getAttribute("href").slice(1);
    var target = id ? document.getElementById(id) : document.body;
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView();
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
    try { history.replaceState(null, "", "#" + id); } catch (err) {}
  });
  function setMenu(open) {
    nav.classList.toggle("open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
  }
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", function () { setMenu(!nav.classList.contains("open")); });
    nav.addEventListener("click", function (e) { if (e.target.tagName === "A") setMenu(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
  }

  if (nav && "IntersectionObserver" in window) {
    var pairs = [];
    nav.querySelectorAll('a[href^="#"]').forEach(function (link) {
      var target = document.getElementById(link.getAttribute("href").slice(1));
      if (target) pairs.push([link, target]);
    });
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        pairs.forEach(function (pair) {
          if (pair[1] === entry.target) pair[0].setAttribute("aria-current", "true");
          else pair[0].removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    pairs.forEach(function (pair) { observer.observe(pair[1]); });
  }

  var form = document.getElementById("contact-form");
  if (form) {
    var status = document.getElementById("form-status");
    var rules = {
      name: function (v) { return v.trim().length >= 2 ? "" : "Please enter your name."; },
      email: function (v) { return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(v.trim()) ? "" : "Please enter a valid email address."; },
      message: function (v) { return v.trim().length >= 10 ? "" : "Please write at least 10 characters."; }
    };
    var check = function (field) {
      var message = rules[field.name](field.value);
      document.getElementById("err-" + field.name).textContent = message;
      if (message) field.setAttribute("aria-invalid", "true");
      else field.removeAttribute("aria-invalid");
      return !message;
    };
    Object.keys(rules).forEach(function (name) {
      var field = form.elements[name];
      field.addEventListener("blur", function () { check(field); });
      field.addEventListener("input", function () { if (field.getAttribute("aria-invalid")) check(field); });
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var first = null;
      Object.keys(rules).forEach(function (name) {
        var field = form.elements[name];
        if (!check(field) && !first) first = field;
      });
      if (first) { status.textContent = ""; first.focus(); return; }
      var recipient = form.getAttribute("data-recipient");
      if (!recipient) {
        status.textContent = "The site owner has not configured a contact email yet.";
        return;
      }
      var name = form.elements["name"].value.trim();
      var email = form.elements["email"].value.trim();
      var message = form.elements["message"].value.trim();
      var subject = "Website enquiry from " + name;
      var body = "Name: " + name + "\\nEmail: " + email + "\\n\\nMessage:\\n" + message;
      var address = encodeURIComponent(recipient).replace(/%40/gi, "@");
      var mailto = "mailto:" + address +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);
      status.textContent = "Your message has not been sent. Choose where to open a draft, then review it and press Send: ";
      var gmail = document.createElement("a");
      gmail.href = "https://mail.google.com/mail/?view=cm&fs=1" +
        "&to=" + encodeURIComponent(recipient) +
        "&su=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);
      gmail.target = "_blank";
      gmail.rel = "noopener noreferrer";
      gmail.textContent = "Open in Gmail (new tab)";
      status.appendChild(gmail);
      status.appendChild(document.createTextNode(" or "));
      var link = document.createElement("a");
      link.href = mailto;
      link.textContent = "Open your email app";
      status.appendChild(link);
    });
  }
})();
`;

export interface ColorPickerOptions {
  /** Approved swatches, each a validated #rrggbb value. */
  swatches: Array<{ name: string; color: string }>;
  /** The site's own accent, restored by "Reset". */
  defaultAccent: string;
}

/**
 * Lets a visitor recolor the finished site. Only the accent variables are
 * overridden, through the CSSOM, which the site's strict CSP allows (inline
 * style attributes would be blocked). Saved values are re-validated on load.
 */
export function colorPickerScript(options: ColorPickerOptions): string {
  return `(function () {
  "use strict";
  var swatches = ${JSON.stringify(options.swatches)};
  var defaultAccent = ${JSON.stringify(options.defaultAccent)};
  var HEX = /^#[0-9a-f]{6}$/i;
  var root = document.documentElement;
  var toggle = document.querySelector("[data-color-toggle]");
  var panel = document.getElementById("color-panel");
  var list = document.getElementById("swatch-list");
  var custom = document.getElementById("custom-accent");
  var reset = document.querySelector("[data-color-reset]");
  if (!toggle || !panel || !list || !custom || !reset) return;
  var key = "site-accent:" + location.pathname;

  function lum(hex) {
    var n = parseInt(hex.slice(1), 16);
    return [n >> 16 & 255, n >> 8 & 255, n & 255].map(function (v) {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    }).reduce(function (sum, c, i) { return sum + c * [0.2126, 0.7152, 0.0722][i]; }, 0);
  }
  function readable(bg) {
    var l = lum(bg);
    return 1.05 / (l + 0.05) >= (l + 0.05) / 0.05 ? "#ffffff" : "#000000";
  }

  var buttons = swatches.map(function (s) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "swatch";
    b.setAttribute("aria-label", s.name);
    b.title = s.name;
    b.style.backgroundColor = s.color;
    b.addEventListener("click", function () { choose(s.color); });
    list.appendChild(b);
    return { el: b, color: s.color };
  });

  function paint(color) {
    var active = color || defaultAccent;
    if (color) {
      root.style.setProperty("--accent", color);
      root.style.setProperty("--accent-text", readable(color));
    } else {
      root.style.removeProperty("--accent");
      root.style.removeProperty("--accent-text");
    }
    custom.value = active.toLowerCase();
    buttons.forEach(function (b) {
      b.el.setAttribute("aria-pressed", String(b.color.toLowerCase() === active.toLowerCase()));
    });
  }
  function choose(color) {
    if (!HEX.test(color)) return;
    paint(color.toLowerCase());
    try { localStorage.setItem(key, color.toLowerCase()); } catch (e) {}
  }

  var saved = null;
  try { saved = localStorage.getItem(key); } catch (e) {}
  paint(saved && HEX.test(saved) ? saved : null);

  custom.addEventListener("input", function () { choose(custom.value); });
  reset.addEventListener("click", function () {
    paint(null);
    try { localStorage.removeItem(key); } catch (e) {}
  });

  function setOpen(open) {
    panel.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
  }
  toggle.addEventListener("click", function () { setOpen(panel.hidden); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !panel.hidden) { setOpen(false); toggle.focus(); }
  });
  document.addEventListener("click", function (e) {
    if (!panel.hidden && !panel.contains(e.target) && !toggle.contains(e.target)) setOpen(false);
  });
})();
`;
}
