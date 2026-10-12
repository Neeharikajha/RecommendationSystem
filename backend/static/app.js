const $ = (sel) => document.querySelector(sel);
const picked = new Map(); // movie_id -> { movie, rating }

async function api(path, options) {
  const res = await fetch(`/api${path}`, options);
  if (!res.ok)
    throw new Error(
      (await res.json().catch(() => ({}))).detail || res.statusText,
    );
  return res.json();
}

// Tiny DOM helper. Strings become text nodes, so API data can never inject HTML.
function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key.startsWith("on")) el.addEventListener(key.slice(2), value);
    else if (key === "class") el.className = value;
    else el.setAttribute(key, value);
  }
  el.append(...kids.flat().filter((k) => k != null && k !== false));
  return el;
}

const hue = (text) =>
  [...text].reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) % 360, 7);
const pct = (x) => `${Math.round(x * 100)}%`;
const setStatus = (msg, error = false) => {
  const el = $("#status");
  el.textContent = msg;
  el.className = error ? "error" : "";
};

// ---------- rendering ----------
function card(rec) {
  const { movie } = rec;
  const base = hue(movie.title);
  return h(
    "div",
    { class: "card", onclick: () => openModal(rec) },
    h(
      "div",
      {
        class: "poster",
        style: `background:linear-gradient(160deg,hsl(${base} 60% 35%),hsl(${(base + 40) % 360} 55% 14%))`,
      },
      movie.title,
    ),
    h(
      "div",
      { class: "meta" },
      h("span", { class: "match" }, `${pct(rec.score)} match`),
      h("span", { class: "muted" }, movie.year ?? ""),
    ),
    h(
      "div",
      { class: "muted", style: "font-size:.75rem" },
      movie.genres.slice(0, 2).join(" · "),
    ),
  );
}

function renderHome({ profile, rows }) {
  const w = profile.weights;
  $("#profile").replaceChildren(
    h(
      "div",
      {},
      h(
        "strong",
        {},
        profile.n_ratings
          ? `${profile.n_ratings} ratings`
          : "New viewer (cold start)",
      ),
      profile.favourite_genres.length
        ? h("span", { class: "muted" }, "  ·  favourite genres: ")
        : null,
      ...profile.favourite_genres.map((g) => h("span", { class: "chip" }, g)),
    ),
    h(
      "div",
      { class: "chips" },
      h("span", { class: "muted" }, "Model blend:"),
      ...Object.entries(w).map(([name, v]) =>
        h("span", { class: "chip" }, `${name} ${pct(v)}`),
      ),
    ),
    h(
      "div",
      { class: "weights" },
      ...Object.entries(w).map(([name, v]) =>
        h("span", { class: `w-${name}`, style: `width:${v * 100}%` }),
      ),
    ),
    profile.top_rated.length
      ? h(
          "div",
          { class: "chips" },
          h("span", { class: "muted" }, "Top rated:"),
          ...profile.top_rated.map((r) =>
            h("span", { class: "chip" }, `${r.movie.title} ★${r.rating}`),
          ),
        )
      : null,
  );
  $("#rows").replaceChildren(
    ...rows.map((row) =>
      h(
        "div",
        { class: "row" },
        h("h2", {}, row.title),
        h("div", { class: "strip" }, ...row.items.map(card)),
      ),
    ),
  );
}

function openModal(rec) {
  const { movie, explanation: why } = rec;
  const similar = h("div", { class: "strip" });
  const modal = $("#modal");
  modal.replaceChildren(
    h(
      "h2",
      { style: "margin-top:0" },
      `${movie.title} `,
      h("span", { class: "muted" }, movie.year ?? ""),
    ),
    h(
      "p",
      { class: "muted" },
      `${movie.genres.join(" · ")}  |  ★ ${movie.avg_rating ?? "n/a"} from ${movie.n_ratings} ratings`,
    ),
    h(
      "p",
      {},
      h("strong", {}, "Why this? "),
      why.reason,
      why.shared_genres.length
        ? ` (shared: ${why.shared_genres.join(", ")})`
        : "",
    ),
    ...Object.entries(why.signals).map(([name, v]) =>
      h(
        "div",
        { class: "bar-row" },
        name,
        h(
          "div",
          { class: "track" },
          h("div", { class: "fill", style: `width:${Math.max(0, v) * 100}%` }),
        ),
        pct(v),
      ),
    ),
    h(
      "div",
      { style: "display:flex; gap:.6rem; margin:1rem 0" },
      h(
        "button",
        {
          class: "primary",
          onclick: async () => {
            similar.replaceChildren(h("span", { class: "muted" }, "Loading…"));
            const recs = await api(`/movies/${movie.movie_id}/similar?k=8`);
            similar.replaceChildren(...recs.map(card));
          },
        },
        "More like this",
      ),
      h("button", { onclick: () => modal.close() }, "Close"),
    ),
    similar,
  );
  modal.showModal();
}

// ---------- modes ----------
async function run(request) {
  setStatus("Ranking…");
  try {
    renderHome(await request());
    setStatus("");
  } catch (err) {
    setStatus(err.message, true);
  }
}

const loadUser = () =>
  run(() => api(`/users/${$("#user-select").value}/home?k=12`));
const loadCustom = () =>
  run(() =>
    api("/home", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        k: 12,
        ratings: [...picked.values()].map(({ movie, rating }) => ({
          movie_id: movie.movie_id,
          rating: Number(rating),
        })),
      }),
    }),
  );

function renderPicked() {
  $("#picked").replaceChildren(
    ...[...picked.values()].map((entry) =>
      h(
        "span",
        { class: "pill" },
        entry.movie.title,
        h("input", {
          type: "number",
          min: 0.5,
          max: 5,
          step: 0.5,
          value: entry.rating,
          onchange: (e) => {
            entry.rating = e.target.value;
          },
        }),
        h(
          "button",
          {
            onclick: () => {
              picked.delete(entry.movie.movie_id);
              renderPicked();
            },
          },
          "×",
        ),
      ),
    ),
  );
}

let searchTimer;
$("#search").addEventListener("input", (e) => {
  clearTimeout(searchTimer);
  const q = e.target.value.trim();
  if (q.length < 2) return $("#search-results").replaceChildren();
  searchTimer = setTimeout(async () => {
    const movies = await api(
      `/movies/search?q=${encodeURIComponent(q)}&limit=6`,
    );
    $("#search-results").replaceChildren(
      ...movies.map((movie) =>
        h(
          "li",
          {
            onclick: () => {
              picked.set(movie.movie_id, { movie, rating: 5 });
              renderPicked();
              $("#search-results").replaceChildren();
              $("#search").value = "";
            },
          },
          `${movie.title} (${movie.year ?? "?"})`,
        ),
      ),
    );
  }, 250);
});

function table(rows, label) {
  const cols = Object.keys(Object.values(rows)[0]);
  return h("table", {},
    h("tr", {}, h("th", {}, label), ...cols.map((c) => h("th", {}, c))),
    ...Object.entries(rows).map(([name, m]) => h("tr", {}, h("td", {}, name), ...cols.map((c) => h("td", {}, m[c])))));
}

async function showMetrics() {
  const panel = $("#panel-metrics");
  try {
    const { k, users_evaluated, results, segments, mmr_tradeoff } = await api("/metrics");
    const ndcgBySegment = Object.fromEntries(Object.entries(segments).map(([model, bySegment]) =>
      [model, Object.fromEntries(Object.entries(bySegment).map(([segment, m]) => [segment, m.ndcg]))]));
    panel.replaceChildren(
      h("p", { class: "muted full" }, `Temporal holdout · ${users_evaluated} users · K=${k}`),
      h("h3", {}, "Overall"), table(results, "model"),
      h("h3", {}, "NDCG by user activity (ratings in training history)"), table(ndcgBySegment, "model"),
      h("h3", {}, "Accuracy vs diversity (MMR λ)"), table(mmr_tradeoff, "λ"),
      h("div", { class: "plots" },
        h("img", { src: "/reports/segments_ndcg.png", alt: "NDCG by user activity" }),
        h("img", { src: "/reports/mmr_tradeoff.png", alt: "Accuracy vs diversity" })));
  } catch (err) { panel.replaceChildren(h("span", { class: "muted" }, err.message)); }
}

document.querySelectorAll(".tab").forEach((tab) =>
  tab.addEventListener("click", () => {
    document
      .querySelectorAll(".tab")
      .forEach((t) => t.classList.toggle("active", t === tab));
    for (const mode of ["user", "custom", "metrics"])
      $(`#panel-${mode}`).hidden = mode !== tab.dataset.mode;
    if (tab.dataset.mode === "metrics") showMetrics();
  }),
);

$("#user-go").addEventListener("click", loadUser);
$("#user-random").addEventListener("click", () => {
  const options = $("#user-select").options;
  $("#user-select").selectedIndex = Math.floor(Math.random() * options.length);
  loadUser();
});
$("#custom-go").addEventListener("click", loadCustom);

(async () => {
  const meta = await api("/meta");
  $("#user-select").replaceChildren(
    ...meta.user_ids.map((id) => h("option", { value: id }, `User ${id}`)),
  );
  loadUser();
})();
