const track = document.getElementById("track");
const caption = document.getElementById("caption");
const counter = document.getElementById("counter");
const progress = document.getElementById("progress");

let slides = [];
let current = -1;
let ticking = false;

/* ---------- load memories ---------- */
fetch("memories.json")
  .then((r) => {
    if (!r.ok) throw new Error("memories.json not found");
    return r.json();
  })
  .then(build)
  .catch((err) => {
    console.error(err);
    track.innerHTML =
      "<p style='padding:40px;width:100%'>Could not load memories. Make sure you ran <code>node generate-media.js</code>.</p>";
  });

function build(list) {
  if (!list.length) {
    track.innerHTML = "<p style='padding:40px;width:100%'>Add photos and videos to public/memories 📷</p>";
    return;
  }

  list.forEach((m, i) => {
    const s = document.createElement("div");
    s.className = "slide";
    s.dataset.caption = m.caption || "";

    if (m.type === "video") {
      const v = document.createElement("video");
      v.src = m.src;
      v.muted = true;
      v.loop = true;
      v.playsInline = true;
      v.setAttribute("playsinline", "");
      v.setAttribute("muted", "");
      v.preload = "auto";

      const btn = document.createElement("button");
      btn.className = "mute";
      btn.textContent = "🔇";
      btn.onclick = (e) => {
        e.stopPropagation();
        v.muted = !v.muted;
        btn.textContent = v.muted ? "🔇" : "🔊";
      };

      const badge = document.createElement("span");
      badge.className = "badge";
      badge.textContent = "▶ Video";

      s.append(v, btn, badge);
    } else {
      const img = document.createElement("img");
      img.src = m.src;
      img.alt = m.caption || "Memory " + (i + 1);
      img.draggable = false;
      img.decoding = "async";
      if (i > 4) img.loading = "lazy";
      s.append(img);
    }

    s.addEventListener("click", () => {
      if (dragMoved) return;
      const idx = slides.indexOf(s);
      if (idx !== current) goTo(idx);
    });

    track.append(s);
  });

  slides = [...track.children];
  setActive(0);
}

/* ---------- active slide logic ---------- */
function centerIndex() {
  const center = track.scrollLeft + track.clientWidth / 2;
  let best = 0, bestDist = Infinity;
  slides.forEach((s, i) => {
    const d = Math.abs(s.offsetLeft + s.offsetWidth / 2 - center);
    if (d < bestDist) { bestDist = d; best = i; }
  });
  return best;
}

function setActive(i) {
  if (i === current || !slides.length) return;
  current = i;

  slides.forEach((s, idx) => {
    const on = idx === i;
    s.classList.toggle("active", on);
    const v = s.querySelector("video");
    if (v) {
      if (on) {
        v.play().catch(() => {});
      } else {
        v.pause();
        v.muted = true;
        const b = s.querySelector(".mute");
        if (b) b.textContent = "🔇";
      }
    }
  });

  caption.textContent = slides[i].dataset.caption;
  counter.textContent = `${i + 1} / ${slides.length}`;
  progress.style.width = ((i + 1) / slides.length) * 100 + "%";
}

track.addEventListener(
  "scroll",
  () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      setActive(centerIndex());
    });
  },
  { passive: true }
);

/* ---------- navigation ---------- */
function goTo(i) {
  if (!slides.length) return;
  i = (i + slides.length) % slides.length; // loop around
  const s = slides[i];
  track.scrollTo({
    left: s.offsetLeft + s.offsetWidth / 2 - track.clientWidth / 2,
    behavior: "smooth",
  });
}

document.getElementById("prev").onclick = () => goTo(current - 1);
document.getElementById("next").onclick = () => goTo(current + 1);

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") goTo(current + 1);
  if (e.key === "ArrowLeft") goTo(current - 1);
});

/* ---------- mouse drag (desktop) ---------- */
let down = false, dragMoved = false, startX = 0, startLeft = 0;

track.addEventListener("pointerdown", (e) => {
  if (e.pointerType !== "mouse" || e.target.closest(".mute")) return;
  down = true;
  dragMoved = false;
  startX = e.clientX;
  startLeft = track.scrollLeft;
  track.classList.add("dragging");
});

window.addEventListener("pointermove", (e) => {
  if (!down) return;
  const dx = e.clientX - startX;
  if (Math.abs(dx) > 5) dragMoved = true;
  track.scrollLeft = startLeft - dx;
});

window.addEventListener("pointerup", () => {
  if (!down) return;
  down = false;
  track.classList.remove("dragging");
  goTo(centerIndex());
  setTimeout(() => (dragMoved = false), 50);
});

/* ---------- confetti ---------- */
const canvas = document.getElementById("confetti");
const ctx = canvas.getContext("2d");
let pieces = [];

function resize() { canvas.width = innerWidth; canvas.height = innerHeight; }
resize();
addEventListener("resize", resize);

function burst() {
  const colors = ["#ff6b9d", "#ffc371", "#6bd5ff", "#8aff9c", "#c78bff"];
  for (let i = 0; i < 160; i++) {
    pieces.push({
      x: innerWidth / 2, y: innerHeight / 2,
      vx: (Math.random() - 0.5) * 16, vy: Math.random() * -14 - 4,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * 6, life: 220,
    });
  }
}

(function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  pieces = pieces.filter((p) => p.life > 0);
  pieces.forEach((p) => {
    p.x += p.vx; p.y += p.vy; p.vy += 0.3; p.rot += 0.1; p.life--;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
    ctx.restore();
  });
  requestAnimationFrame(animate);
})();

document.getElementById("celebrate").onclick = burst;
addEventListener("load", () => setTimeout(burst, 500));