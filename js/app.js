/*
 * 진담 한자어 놀이터 — 기본 틀
 * 배포할 때마다 APP_VERSION 을 올리면 화면 아래 번호로 최신 반영 여부를 확인할 수 있어요.
 */
var APP_VERSION = "1.0.0";

(function () {
  var J = (window.JINDAM = window.JINDAM || {});
  J.version = APP_VERSION;
  J.weeks = [];
  J.screens = {};
  J.addWeek = function (w) {
    w.words = (w.words || []).map(function (x, i) { x.id = w.id + "-" + i; return x; });
    J.weeks.push(w);
  };

  /* ───────── 확대·스크롤·복사 방지 ───────── */
  function guard() {
    var stop = function (e) { e.preventDefault(); };
    ["copy", "cut", "paste", "contextmenu", "dragstart", "selectstart"].forEach(function (t) {
      document.addEventListener(t, function (e) {
        if (e.target.closest && e.target.closest("input, textarea, select")) return;
        e.preventDefault();
      });
    });
    // iOS Safari 핀치 확대
    ["gesturestart", "gesturechange", "gestureend"].forEach(function (t) { document.addEventListener(t, stop, { passive: false }); });
    document.addEventListener("touchmove", function (e) {
      if (e.touches && e.touches.length > 1) { e.preventDefault(); return; }
      if (!e.target.closest || !e.target.closest(".scroll, .word-chips")) e.preventDefault();
    }, { passive: false });
    // 두 번 탭 확대는 CSS touch-action: manipulation 으로 막음 (빠른 연속 탭은 그대로 됨)
    // PC: Ctrl+휠, Ctrl +/-/0, Ctrl+C/V/X/A/S/P/U
    document.addEventListener("wheel", function (e) { if (e.ctrlKey || e.metaKey) e.preventDefault(); }, { passive: false });
    document.addEventListener("keydown", function (e) {
      if ((e.ctrlKey || e.metaKey) && /^(\+|=|-|_|0|c|v|x|a|s|p|u)$/i.test(e.key)) e.preventDefault();
    });
  }

  /* ───────── 작은 도구 ───────── */
  J.$ = function (sel, root) { return (root || document).querySelector(sel); };
  J.$$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  J.h = function (html) { var t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  J.shuffle = function (a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
  J.pick = function (a, n) { return J.shuffle(a).slice(0, n); };
  J.esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  J.partsText = function (w) { return w.parts.map(function (p) { return p[1] + " " + p[2]; }).join(" + "); };

  J.toast = function (msg) {
    var t = J.h('<div class="toast">' + J.esc(msg) + "</div>");
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 1600);
  };

  J.confetti = function () {
    var box = J.h('<div class="confetti"></div>');
    var colors = ["#C8372D", "#FFE7A0", "#CFEDE0", "#D6E9FA", "#FCD9E2", "#E5DDF7"];
    for (var i = 0; i < 40; i++) {
      var p = document.createElement("i");
      p.style.left = Math.random() * 100 + "%";
      p.style.background = colors[i % colors.length];
      p.style.animationDuration = 1.6 + Math.random() * 1.4 + "s";
      p.style.animationDelay = Math.random() * 0.4 + "s";
      box.appendChild(p);
    }
    document.body.appendChild(box);
    setTimeout(function () { box.remove(); }, 3600);
  };

  /* 효과음 (작게) */
  var actx = null;
  J.sfx = function (kind) {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      var notes = { ok: [660, 880], no: [300, 220], flip: [520], win: [523, 659, 784, 1046] }[kind] || [440];
      notes.forEach(function (f, i) {
        var o = actx.createOscillator(), g = actx.createGain();
        o.type = kind === "no" ? "triangle" : "sine";
        o.frequency.value = f;
        var t0 = actx.currentTime + i * 0.09;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(0.12, t0 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
        o.connect(g).connect(actx.destination);
        o.start(t0); o.stop(t0 + 0.2);
      });
    } catch (e) {}
  };

  /* 중국어 듣기 버튼 */
  J.speakBtn = function (text, cls) {
    var b = J.h('<button class="' + (cls || "speak-btn") + '" type="button" aria-label="중국어 듣기">🔊</button>');
    b.addEventListener("click", function (e) {
      e.stopPropagation();
      b.classList.add("playing");
      JTTS.speak(text).then(function () { b.classList.remove("playing"); });
    });
    return b;
  };

  /* 도장 기록 (이 기기에만 저장) */
  var KEY = "jindam_hanja_stamps_v1";
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  J.stamp = function (weekId, game) {
    var s = load(); s[weekId] = s[weekId] || {}; s[weekId][game] = (s[weekId][game] || 0) + 1;
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
  };
  J.stamps = function (weekId) { return load()[weekId] || {}; };

  /* ───────── 주차 ───────── */
  J.week = null;
  J.setWeek = function (id) {
    J.week = J.weeks.find(function (w) { return w.id === id; }) || J.weeks[J.weeks.length - 1];
  };

  /* ───────── 화면 ───────── */
  J.GAMES = [
    { key: "study", name: "한자어 카드", desc: "글자를 쪼개서 뜻 알아보기", icon: "學", color: "c-sun" },
    { key: "write", name: "따라 쓰기", desc: "획순 따라 한 글자 3번씩", icon: "筆", color: "c-pink" },
    { key: "flip", name: "카드 짝 맞추기", desc: "한자와 우리말 짝 찾기", icon: "雙", color: "c-mint" },
    { key: "find", name: "같은 글자 찾기", desc: "같은 한자가 숨은 낱말 찾기", icon: "生", color: "c-sky" },
    { key: "quiz", name: "뜻 조립 퀴즈", desc: "글자 뜻을 이어 낱말 맞히기", icon: "合", color: "c-lilac" },
    { key: "listen", name: "중국어 소리 퀴즈", desc: "듣고 어떤 낱말인지 맞히기", icon: "聽", color: "c-peach" }
  ];

  var stage, back, titleEl, current = null, lastKey = null;
  window.addEventListener("hashchange", function () {
    var k = location.hash.replace("#", "");
    if (k !== lastKey && (J.screens[k] || k === "")) J.go(k || "home");
  });
  J.go = function (key, opts) {
    if (current && current.leave) try { current.leave(); } catch (e) {}
    if (window.speechSynthesis) speechSynthesis.cancel();
    stage.innerHTML = "";
    var game = J.GAMES.find(function (g) { return g.key === key; });
    back.hidden = key === "home";
    titleEl.textContent = game ? game.name : "";
    J.$(".brand").style.display = key === "home" ? "" : "none";
    var screen = J.h('<section class="screen"></section>');
    stage.appendChild(screen);
    current = (key === "home" ? home : J.screens[key])(screen, opts || {}) || null;
    lastKey = key;
    if (location.hash !== "#" + key) history.replaceState(null, "", key === "home" ? location.pathname + location.search : "#" + key);
  };

  function home(root) {
    var w = J.week;
    var st = J.stamps(w.id);
    var weekOpts = J.weeks.map(function (x) {
      return '<option value="' + x.id + '"' + (x.id === w.id ? " selected" : "") + ">" + x.no + "주차 · " + J.esc(x.title) + "</option>";
    }).reverse().join("");
    var done = J.GAMES.filter(function (g) { return st[g.key]; }).length;
    root.classList.add("scroll");
    root.innerHTML =
      '<div class="hero">' +
        '<div class="hero__week"><select aria-label="주차 고르기">' + weekOpts + "</select></div>" +
        "<h1>" + J.esc(w.title) + "<br><em>놀이터</em></h1>" +
        "<p>" + J.esc(w.intro || w.subtitle || "") + "</p>" +
        '<div class="hero__progress"><span class="stamp-dot' + (done ? " on" : "") + '">🏅 도장 ' + done + " / " + J.GAMES.length + "</span>" +
        '<span class="stamp-dot">낱말 ' + w.words.length + "개</span></div>" +
        '<div class="hero__seal">' + J.esc((w.keyChars && w.keyChars[0] && w.keyChars[0].c) || "學") + "</div>" +
      "</div>" +
      '<div class="tiles">' + J.GAMES.map(function (g) {
        return '<button class="tile ' + g.color + '" data-go="' + g.key + '">' +
          '<span class="tile__icon">' + g.icon + "</span>" +
          '<span class="tile__name">' + g.name + "</span>" +
          '<span class="tile__desc">' + g.desc + "</span>" +
          (st[g.key] ? '<span class="tile__stamp">참<br>잘</span>' : "") +
          "</button>";
      }).join("") + "</div>" +
      J.promoHTML();
    J.$("select", root).addEventListener("change", function (e) { J.setWeek(e.target.value); J.go("home"); });
    J.$$("[data-go]", root).forEach(function (b) { b.addEventListener("click", function () { J.sfx("flip"); J.go(b.dataset.go); }); });
    bindKakao(root);
  }

  J.promoHTML = function () {
    return '<div class="promo">' +
      '<div class="promo__eyebrow">한자어로 넓히는 어휘력, 중국어로 여는 소통과 기회</div>' +
      "<h2>&lt;한자어로 시작하는 중국어 과정&gt; <em>모집</em></h2>" +
      '<div class="promo__courses"><span>초등과정 (저학년 / 고학년)</span><span>중·고등과정</span><span>HSK + 스피킹 과정</span></div>' +
      '<div class="promo__contact"><span class="promo__tag">문의처</span><button class="kakao-btn" type="button" data-kakao>💬 카톡 jindam1799</button></div>' +
      '<div class="promo__brand">진담중국어 · 진심을 담은 중국어</div>' +
      "</div>";
  };

  function bindKakao(root) {
    J.$$("[data-kakao]", root).forEach(function (b) {
      b.addEventListener("click", function () {
        var ok = function () { J.toast("카톡 아이디 jindam1799 복사됐어요"); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText("jindam1799").then(ok, function () { J.toast("카톡에서 jindam1799 를 검색해 주세요"); });
        else J.toast("카톡에서 jindam1799 를 검색해 주세요");
      });
    });
  }
  J.bindKakao = bindKakao;

  /* 결과 화면 */
  J.result = function (root, o) {
    J.stamp(J.week.id, o.game);
    J.sfx("win");
    J.confetti();
    root.innerHTML =
      '<div class="result">' +
        '<div class="result__stamp">참<br>잘했어요</div>' +
        "<h2>" + J.esc(o.title || "다 했어요!") + "</h2>" +
        (o.sub ? '<div class="muted">' + o.sub + "</div>" : "") +
        (o.review && o.review.length ? '<div class="muted">헷갈렸던 낱말 — 한 번 더 소리 내어 읽어 봐요</div><div class="result__review">' +
          o.review.map(function (w) { return "<span><b class=\"hanja\">" + J.esc(w.hanja) + "</b> " + J.esc(w.hangul) + "</span>"; }).join("") + "</div>" : "") +
        '<div class="row row--center"><button class="btn btn--red" data-again>한 번 더</button><button class="btn" data-home>다른 놀이</button></div>' +
        '<div class="result__promo">한자어로 넓히는 어휘력, 중국어로 여는 소통과 기회<br><b>&lt;한자어로 시작하는 중국어 과정&gt; 모집</b> &nbsp;<button class="kakao-btn" type="button" data-kakao>💬 jindam1799</button></div>' +
      "</div>";
    J.$("[data-again]", root).addEventListener("click", function () { J.go(o.game); });
    J.$("[data-home]", root).addEventListener("click", function () { J.go("home"); });
    bindKakao(root);
  };

  /* ───────── 시작 ───────── */
  function loadScript(src) {
    return new Promise(function (res) {
      var s = document.createElement("script");
      s.src = src + "?v=" + APP_VERSION;
      s.onload = res;
      s.onerror = function () { console.warn("못 불러옴: " + src); res(); };
      document.body.appendChild(s);
    });
  }

  J.boot = function () {
    guard();
    stage = J.$(".stage"); back = J.$(".topbar__back"); titleEl = J.$(".topbar__title");
    J.$$(".js-version").forEach(function (e) { e.textContent = "v" + APP_VERSION; });
    J.$$(".js-year").forEach(function (e) { e.textContent = Math.max(2026, new Date().getFullYear()); });
    back.addEventListener("click", function () { J.go("home"); });
    bindKakao(J.$(".footer"));
    var files = window.JINDAM_WEEK_FILES || [];
    files.reduce(function (p, f) { return p.then(function () { return loadScript("data/" + f + ".js"); }); }, Promise.resolve()).then(function () {
      if (!J.weeks.length) { stage.innerHTML = '<p class="card">이번 주 자료를 불러오지 못했어요. 새로고침해 주세요.</p>'; return; }
      J.setWeek(null); // 늘 가장 최근 주차로 시작
      var start = location.hash.replace("#", "");
      J.go(J.screens[start] ? start : "home");
    });
  };
})();
