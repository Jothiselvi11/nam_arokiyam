/* =========================================================
   Nam Arokiyam — site interactions
   ========================================================= */

// >>> Replace with the client's WhatsApp number: country code + number, digits only (e.g. "919876543210")
const WHATSAPP_NUMBER = "910000000000";

const OILS = {
  gingelly: {
    name: "Gingelly Oil", ta: "நல்லெண்ணெய்", img: "assets/gingelly-bottle.webp",
    why: "Deep, nutty and aromatic — the classic Tamil choice for kuzhambu, tempering, podi and the traditional oil bath."
  },
  coconut: {
    name: "Coconut Oil", ta: "தேங்காய் எண்ணெய்", img: "assets/coconut-bottle.webp",
    why: "Light, clean and naturally fragrant — perfect for coconut-based dishes and a trusted everyday companion for hair and skin."
  },
  groundnut: {
    name: "Groundnut Oil", ta: "கடலை எண்ணெய்", img: "assets/groundnut-bottle.webp",
    why: "Rich and full-bodied with a high smoke point — made for crispy frying, sweets, snacks and everyday cooking."
  }
};

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

/* ---------- Language (English / Tamil) ---------- */
// English text is read from the page itself; Tamil comes from i18n.js.
const TA = window.I18N_TA || {};
const EN = {
  "meta.title": document.title,
  "why.gingelly": OILS.gingelly.why,
  "why.coconut": OILS.coconut.why,
  "why.groundnut": OILS.groundnut.why,
  "err.name": "Please tell us your name.",
  "err.phone": "Please enter a valid phone number."
};
$$("[data-i18n]").forEach(el => { EN[el.dataset.i18n] ??= el.innerHTML; });
$$("[data-i18n-ph]").forEach(el => { EN[el.dataset.i18nPh] ??= el.placeholder; });

let lang = "en";
const t = key => (lang === "ta" && TA[key]) || EN[key] || "";

function setLang(next) {
  lang = next === "ta" ? "ta" : "en";
  document.documentElement.lang = lang;
  document.title = t("meta.title");
  $$("[data-i18n]").forEach(el => { el.innerHTML = t(el.dataset.i18n); });
  $$("[data-i18n-ph]").forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
  $$("#langSwitch button").forEach(b => b.setAttribute("aria-pressed", b.dataset.lang === lang));
  // refresh text that JS writes at runtime
  if (matchKey) $("#resultWhy").textContent = t("why." + matchKey);
  const err = $("#formError");
  if (err && err.dataset.key) err.textContent = t(err.dataset.key);
  try { localStorage.setItem("lang", lang); } catch (e) {}
}
$$("#langSwitch button").forEach(b => b.addEventListener("click", () => setLang(b.dataset.lang)));

/* ---------- Nav ---------- */
const nav = $("#nav");
const floatWa = $(".float-wa");
const onScroll = () => {
  const y = window.scrollY;
  nav.classList.toggle("scrolled", y > 30);
  floatWa.classList.toggle("show", y > window.innerHeight * 0.8);
};
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

const navToggle = $("#navToggle");
navToggle.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", open);
  document.body.style.overflow = open ? "hidden" : "";
});
$$("#navLinks a").forEach(a => a.addEventListener("click", () => {
  nav.classList.remove("open");
  navToggle.setAttribute("aria-expanded", "false");
  document.body.style.overflow = "";
}));

/* ---------- Hero oil switcher ---------- */
const switchBtns = $$(".switch-btn");
const bottles = $$(".bottle");
let current = "gingelly";
let autoTimer;

function setOil(key) {
  if (key === current) return;
  document.body.dataset.oil = key;
  switchBtns.forEach(b => {
    const on = b.dataset.oil === key;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", on);
  });
  bottles.forEach(b => {
    b.classList.remove("is-leaving");
    if (b.dataset.oil === current) b.classList.add("is-leaving");
    b.classList.toggle("is-active", b.dataset.oil === key);
  });
  $("#heroTa").textContent = OILS[key].ta;
  $("#heroEn").textContent = OILS[key].name;
  current = key;
}

const order = Object.keys(OILS);
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
function startAuto() {
  if (reduceMotion) return;
  clearInterval(autoTimer);
  autoTimer = setInterval(() => {
    setOil(order[(order.indexOf(current) + 1) % order.length]);
  }, 4500);
}
switchBtns.forEach(b => b.addEventListener("click", () => { setOil(b.dataset.oil); startAuto(); }));
startAuto();

/* ---------- Product size toggles ---------- */
$$(".oil-card").forEach(card => {
  const btns = $$(".size-toggle button", card);
  btns.forEach(btn => btn.addEventListener("click", () => {
    btns.forEach(b => {
      b.classList.toggle("is-active", b === btn);
      b.setAttribute("aria-checked", b === btn);
    });
    card.classList.toggle("size-small", btn.dataset.size === "500 ml");
  }));
});

/* ---------- Prefill order form from cards / finder ---------- */
function prefill(product, size) {
  const p = $(`#productPick input[value="${product}"]`);
  if (p) p.checked = true;
  if (size) {
    const s = $(`#sizePick input[value="${size}"]`);
    if (s) s.checked = true;
  }
}
$$(".btn-card").forEach(btn => btn.addEventListener("click", () => {
  const card = btn.closest(".oil-card");
  const size = $(".size-toggle .is-active", card).dataset.size;
  prefill(btn.dataset.product, size);
}));
$("#resultBtn").addEventListener("click", e => prefill(e.currentTarget.dataset.product));

/* ---------- Oil finder ---------- */
const chips = $$(".chip");
const result = $("#finderResult");
let matchKey = null;
chips.forEach(chip => chip.addEventListener("click", () => {
  chips.forEach(c => c.classList.toggle("is-active", c === chip));
  const key = chip.dataset.match;
  matchKey = key;
  const oil = OILS[key];
  result.dataset.oil = "none";               // retrigger pop animation
  void result.offsetWidth;
  result.dataset.oil = key;
  $("#resultImg").src = oil.img;
  $("#resultImg").alt = oil.name + " bottle";
  $("#resultName").textContent = oil.name;
  $("#resultTa").textContent = oil.ta;
  $("#resultWhy").textContent = t("why." + key);
  $("#resultBtn").dataset.product = oil.name;
}));

/* ---------- Quantity stepper ---------- */
const qty = $("#fQty");
$$(".qty button").forEach(b => b.addEventListener("click", () => {
  const v = Math.min(999, Math.max(1, (parseInt(qty.value, 10) || 1) + Number(b.dataset.step)));
  qty.value = v;
}));

/* ---------- Order form → WhatsApp ---------- */
$("#orderForm").addEventListener("submit", e => {
  e.preventDefault();
  const f = e.target;
  const name = f.name.value.trim();
  const phone = f.phone.value.trim();
  const err = $("#formError");
  f.name.classList.toggle("invalid", !name);
  const phoneOk = /^[0-9+\s-]{10,15}$/.test(phone);
  f.phone.classList.toggle("invalid", !phoneOk);
  if (!name || !phoneOk) {
    err.dataset.key = !name ? "err.name" : "err.phone";
    err.textContent = t(err.dataset.key);
    return;
  }
  delete err.dataset.key;
  err.textContent = "";
  const q = Math.max(1, parseInt(f.qty.value, 10) || 1);
  const lines = [
    "Hello Nam Arokiyam! I'd like to place an order.",
    "",
    `Name: ${name}`,
    `Phone: ${phone}`,
    `Oil: ${f.product.value}`,
    `Size: ${f.size.value}`,
    `Quantity: ${q} bottle${q > 1 ? "s" : ""}`
  ];
  const note = f.note.value.trim();
  if (note) lines.push(`Note: ${note}`);
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
  window.open(url, "_blank", "noopener");
});

/* ---------- Reveal on scroll + counters ---------- */
const io = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (!en.isIntersecting) return;
    en.target.classList.add("in");
    $$("[data-count]", en.target).forEach(countUp);
    io.unobserve(en.target);
  });
}, { threshold: 0.15 });
$$(".reveal").forEach(el => io.observe(el));

function countUp(el) {
  const end = Number(el.dataset.count);
  if (reduceMotion || end === 0) { el.textContent = end; return; }
  const dur = 1400, t0 = performance.now();
  const tick = t => {
    const p = Math.min(1, (t - t0) / dur);
    el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* ---------- Footer year + phone link ---------- */
$("#year").textContent = new Date().getFullYear();
$$(".js-phone").forEach(a => (a.href = `tel:+${WHATSAPP_NUMBER}`));

/* ---------- Apply saved language ---------- */
setLang(document.documentElement.lang === "ta" ? "ta" : "en");
