/*
 * 진담 한자어 놀이터 — 기본 틀
 * 배포할 때마다 APP_VERSION 을 올리면 화면 아래 번호로 최신 반영 여부를 확인할 수 있어요.
 */
var APP_VERSION = "1.6.0";

(function () {
  var J = (window.JINDAM = window.JINDAM || {});
  J.version = APP_VERSION;
  J.KAKAO_LINK = "http://pf.kakao.com/_jZYxmxj"; // 카카오톡 채널 채팅 바로가기
  J.PHONE = "01031917524"; // 전화 문의
  J.REVIEW_LINK = "https://litt.ly/quanlaoshi1799"; // 후기 보러가기
  J.PHONE_BTN = '<button class="phone-btn" type="button" data-phone>📞 전화 문의</button>';
  J.KAKAO_CHAT = '<a class="kakao-btn kakao-btn--chat" href="http://pf.kakao.com/_jZYxmxj" target="_blank" rel="noopener">💬 카톡 채팅 바로가기</a>';
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
      if (!e.target.closest || !e.target.closest(".scroll, .word-chips, .modal__box, input")) e.preventDefault();
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
    if (!J.settings.sfxVolume) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      var notes = { ok: [660, 880], no: [300, 220], flip: [520], win: [523, 659, 784, 1046] }[kind] || [440];
      notes.forEach(function (f, i) {
        var o = actx.createOscillator(), g = actx.createGain();
        o.type = kind === "no" ? "triangle" : "sine";
        o.frequency.value = f;
        var t0 = actx.currentTime + i * 0.09;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(Math.max(0.0002, 0.2 * J.settings.sfxVolume), t0 + 0.02);
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

  /* 도장·복습 기록 (이 기기에만 저장) */
  var KEY = "jindam_hanja_stamps_v1", PKEY = "jindam_hanja_progress_v1";
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function loadP() { try { return JSON.parse(localStorage.getItem(PKEY)) || {}; } catch (e) { return {}; } }
  function saveP(p) { try { localStorage.setItem(PKEY, JSON.stringify(p)); } catch (e) {} }
  J.stamp = function (weekId, game) {
    var s = load(); s[weekId] = s[weekId] || {};
    var first = !s[weekId][game];
    s[weekId][game] = (s[weekId][game] || 0) + 1;
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
    if (first) J.justEarned = game;
    return first;
  };
  J.stamps = function (weekId) { return load()[weekId] || {}; };
  J.isComplete = function (weekId) { var st = J.stamps(weekId); return J.GAMES.every(function (g) { return st[g.key]; }); };
  J.addMisses = function (weekId, words) {
    if (!words || !words.length) return;
    var p = loadP(); p.misses = p.misses || {}; var m = p.misses[weekId] = p.misses[weekId] || [];
    words.forEach(function (w) { if (w.hanja && m.indexOf(w.hanja) < 0) m.push(w.hanja); });
    saveP(p);
  };
  J.missWords = function (weekId) {
    var w = J.weeks.find(function (x) { return x.id === weekId; }); var list = (loadP().misses || {})[weekId] || [];
    return w ? w.words.filter(function (x) { return list.indexOf(x.hanja) >= 0; }) : [];
  };
  J.flag = function (name, val) { var p = loadP(); p.flags = p.flags || {}; if (val === undefined) return p.flags[name]; p.flags[name] = val; saveP(p); };

  /* 다음 주차 예고: data/weeks.js 의 JINDAM_NEXT, 없으면 마지막 주차 + 7일 */
  J.nextInfo = function () {
    var last = J.weeks[J.weeks.length - 1];
    var n = window.JINDAM_NEXT || {};
    var date = n.date;
    if (!date && last && last.date) { var d = new Date(last.date + "T00:00:00+09:00"); d.setDate(d.getDate() + 7); date = d.toISOString().slice(0, 10); }
    var dday = null, label = "곧 열려요";
    if (date) {
      var today = new Date(); var t = new Date(date + "T00:00:00+09:00");
      dday = Math.ceil((t - today) / 86400000);
      var dd = date.replace(/^\d{4}-0?(\d+)-0?(\d+)$/, "$1월 $2일");
      label = dday > 0 ? "D-" + dday + " · " + dd + " 열려요" : "곧 열려요!";
    }
    return { no: (last ? last.no : 0) + 1, title: n.title || "새 한자어", hint: n.hint || "?", teaser: n.teaser || "", dday: dday, label: label };
  };

  /* ───────── 설정 (이 기기에만 저장) ───────── */
  var SKEY = "jindam_hanja_settings_v1";
  J.settings = { ttsVolume: 1, ttsRate: 0.85, sfxVolume: 0.6 };
  try { Object.assign(J.settings, JSON.parse(localStorage.getItem(SKEY)) || {}); } catch (e) {}
  function saveSettings() { try { localStorage.setItem(SKEY, JSON.stringify(J.settings)); } catch (e) {} }

  /* 팝업 */
  J.modal = function (html, opts) {
    opts = opts || {};
    var wrap = J.h('<div class="modal" role="dialog" aria-modal="true"><div class="modal__box">' +
      (opts.noClose ? "" : '<button class="modal__x" type="button" aria-label="닫기">×</button>') + html + "</div></div>");
    document.body.appendChild(wrap);
    var close = function () { wrap.classList.add("out"); setTimeout(function () { wrap.remove(); if (opts.onClose) opts.onClose(); }, 180); };
    var x = J.$(".modal__x", wrap); if (x) x.addEventListener("click", close);
    if (!opts.noClose) wrap.addEventListener("click", function (e) { if (e.target === wrap) close(); });
    wrap.close = close;
    return wrap;
  };

  J.openSettings = function () {
    var pct = function (v) { return Math.round(v * 100); };
    var m = J.modal(
      '<h3 class="modal__title">⚙️ 설정</h3>' +
      '<label class="set"><span class="set__name">🔊 중국어 음성 크기 <b data-v="ttsVolume"></b></span>' +
        '<input type="range" min="0" max="1" step="0.1" data-k="ttsVolume"></label>' +
      '<label class="set"><span class="set__name">🐢 말하기 빠르기 <b data-v="ttsRate"></b></span>' +
        '<input type="range" min="0.5" max="1.2" step="0.05" data-k="ttsRate">' +
        '<span class="set__ends"><span>천천히</span><span>보통</span><span>빠르게</span></span></label>' +
      '<label class="set"><span class="set__name">🎵 효과음 크기 <b data-v="sfxVolume"></b></span>' +
        '<input type="range" min="0" max="1" step="0.1" data-k="sfxVolume"></label>' +
      '<div class="row row--center"><button class="btn btn--sun btn--sm" data-test>🔊 들어 보기 · 学生</button></div>' +
      '<label class="set"><span class="set__name">🗣️ 중국어 목소리</span><select class="set__select" data-voice></select></label>' +
      '<div class="set__voice muted"></div>' +
      '<div class="row row--center"><button class="btn btn--sm" data-guide>안내 다시 보기</button><button class="btn btn--sm" data-reset>처음 값으로</button></div>' +
      '<div class="set__ver muted">진담 한자어 놀이터 v' + APP_VERSION + "</div>");
    function paint() {
      J.$$("[data-k]", m).forEach(function (r) { r.value = J.settings[r.dataset.k]; });
      J.$$("[data-v]", m).forEach(function (b) {
        var k = b.dataset.v, v = J.settings[k];
        b.textContent = k === "ttsRate" ? (v <= 0.7 ? "천천히" : v >= 1 ? "빠르게" : "보통") + " ×" + v.toFixed(2) : (v ? pct(v) + "%" : "끔");
      });
      var name = window.JTTS && JTTS.voiceName();
      J.$(".set__voice", m).textContent = name ? "지금 쓰는 목소리: " + name + " · 소리가 안 나면 다른 목소리를 골라 보세요" : "이 기기에서 중국어 목소리를 찾지 못했어요. Chrome에서 열어 주세요.";
      var sel = J.$("[data-voice]", m), vs = JTTS.voices();
      sel.innerHTML = '<option value="">자동 (Tingting 먼저)</option>' + vs.map(function (v) {
        return '<option value="' + J.esc(v.name) + '"' + (v.name === J.settings.voiceName ? " selected" : "") + ">" + J.esc(v.name) + (v.bad ? " — 소리 안 남" : "") + "</option>";
      }).join("");
    }
    J.$$("[data-k]", m).forEach(function (r) {
      r.addEventListener("input", function () { J.settings[r.dataset.k] = parseFloat(r.value); saveSettings(); paint(); });
      r.addEventListener("change", function () { if (r.dataset.k === "sfxVolume") J.sfx("ok"); });
    });
    J.$("[data-test]", m).addEventListener("click", function () { JTTS.speak("学生").then(paint); });
    J.$("[data-voice]", m).addEventListener("change", function (e) {
      J.settings.voiceName = e.target.value || null; saveSettings(); JTTS.refresh(); JTTS.speak("学生").then(paint);
    });
    J.$("[data-reset]", m).addEventListener("click", function () { J.settings.ttsVolume = 1; J.settings.ttsRate = 0.85; J.settings.sfxVolume = 0.6; J.settings.voiceName = null; saveSettings(); JTTS.refresh(); paint(); });
    J.$("[data-guide]", m).addEventListener("click", function () { m.close(); setTimeout(function () { J.showGuide(); }, 200); });
    paint();
  };

  /* 인트로 → 안내 → 로비 */
  J.showIntro = function (then) {
    var w = J.week;
    var intro = J.h('<div class="intro">' +
      '<div class="intro__bubbles"><i></i><i></i><i></i><i></i></div>' +
      '<img class="intro__logo" src="assets/icon-512.png" alt="">' +
      '<div class="intro__brand">진담중국어</div>' +
      '<h1 class="intro__title">한자어 놀이터</h1>' +
      '<p class="intro__sub">뜻을 알면 교과서가 <em>쉬워져요</em></p>' +
      '<div class="intro__chars"><span>學</span><span>生</span><span>分</span><span>光</span></div>' +
      '<div class="intro__tap">👆 화면을 터치해 주세요</div>' +
      '<div class="intro__copy">© ' + Math.max(2026, new Date().getFullYear()) + " 진담중국어(전진아). All rights reserved. · v" + APP_VERSION + "</div>" +
    "</div>");
    document.body.appendChild(intro);
    var started = false;
    function go() {
      if (started) return; started = true;
      if (window.JTTS) JTTS.unlock();
      J.sfx("win");
      intro.classList.add("out");
      setTimeout(function () { intro.remove(); J.showNotice(function () { J.showGuide(then); }, "다음 ▶"); }, 350);
    }
    intro.addEventListener("pointerup", go);
    intro.addEventListener("keydown", go);
    document.addEventListener("keydown", function k(e) { if (e.key === "Enter" || e.key === " ") { document.removeEventListener("keydown", k); go(); } });
  };

  J.showGuide = function (then) {
    var w = J.week;
    var m = J.modal(
      '<div class="guide__badge">' + (w ? w.no + "주차 · " + J.esc(w.title) : "안내") + "</div>" +
      '<h3 class="modal__title">이렇게 놀아요!</h3>' +
      '<ol class="guide">' +
        '<li><span class="guide__n c-sun">一</span><div><b>한자어 카드</b>로 먼저 보기<br><small>글자를 쪼개면 뜻이 보여요</small></div></li>' +
        '<li><span class="guide__n c-pink">二</span><div><b>따라 쓰기 · 놀이</b>로 여러 번 만나기<br><small>한 글자를 3번씩 써 봐요</small></div></li>' +
        '<li><span class="guide__n c-mint">三</span><div>틀려도 괜찮아요!<br><small>틀린 낱말은 다시 나와서 끝까지 익혀요</small></div></li>' +
      "</ol>" +
      '<div class="guide__tips"><span>🔊 소리를 켜 주세요</span><span>⚙️ 설정에서 음성 크기 조절</span><span>🏅 놀이를 끝내면 도장!</span></div>' +
      '<button class="btn btn--red guide__go" type="button">시작하기 ▶</button>',
      { noClose: true, onClose: then });
    J.$(".guide__go", m).addEventListener("click", function () { J.sfx("flip"); m.close(); });
  };

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
    var done = J.GAMES.filter(function (g) { return st[g.key]; }).length;
    var complete = done === J.GAMES.length;
    var next = J.nextInfo();
    var seen = J.flag("seenWeeks") || [];
    var fresh = J.justEarned; J.justEarned = null;
    var weeks = J.weeks.map(function (x) {
      var n = J.GAMES.filter(function (g) { return J.stamps(x.id)[g.key]; }).length;
      var isNew = seen.indexOf(x.id) < 0;
      return '<button class="wk' + (x.id === w.id ? " on" : "") + (n === J.GAMES.length ? " done" : "") + '" data-week="' + x.id + '">' +
        (isNew ? '<span class="wk__new">NEW</span>' : "") +
        '<span class="wk__no">' + x.no + "주차</span>" +
        '<span class="wk__title">' + J.esc(x.title) + "</span>" +
        '<span class="wk__stamp">' + (n === J.GAMES.length ? "🏅 완료" : n ? "도장 " + n + "/" + J.GAMES.length : "시작 전") + "</span></button>";
    }).join("") +
      '<button class="wk wk--soon" data-next><span class="wk__no">' + next.no + '주차</span><span class="wk__title">🔒 ' + J.esc(next.title) + '</span><span class="wk__stamp">' + J.esc(next.label) + "</span></button>";
    root.innerHTML =
      '<button class="notice" type="button" data-notice><span class="notice__tag">📢 안내</span>' +
        '<span class="notice__text">&lt;한자어로 시작하는 중국어 과정&gt; 모집 중</span><span class="notice__go">›</span></button>' +
      '<div class="weeks__head"><b>주차 고르기</b><span class="muted">매주 새 주차가 열려요!</span></div>' +
      '<div class="weeks">' + weeks + "</div>" +
      '<div class="hero">' +
        '<div class="hero__week">' + w.no + "주차" + (w.date ? " · " + J.esc(w.date.replace(/^\d{4}-0?(\d+)-0?(\d+)$/, "$1월 $2일")) : "") + "</div>" +
        "<h1>" + J.esc(w.title) + "<br><em>미션</em></h1>" +
        "<p>" + J.esc(w.intro || w.subtitle || "") + "</p>" +
        '<div class="mission-bar"><div class="progress"><i style="width:' + (done / J.GAMES.length * 100) + '%"></i></div><b>' + done + " / " + J.GAMES.length + "</b></div>" +
        (complete ? '<button class="hero__done" data-review><span class="seal-txt">' + w.no + "주차<br>완료</span></button>" :
          '<div class="hero__seal">' + J.esc((w.keyChars && w.keyChars[0] && w.keyChars[0].c) || "學") + "</div>") +
      "</div>" +
      '<div class="missions">' + J.GAMES.map(function (g, i) {
        var got = !!st[g.key];
        return '<button class="mission ' + g.color + (got ? " got" : "") + '" data-go="' + g.key + '">' +
          '<span class="mission__no">미션 ' + (i + 1) + "</span>" +
          '<span class="tile__icon">' + g.icon + "</span>" +
          '<span class="mission__body"><span class="tile__name">' + g.name + '</span><span class="tile__desc">' + g.desc + "</span></span>" +
          '<span class="mission__slot' + (got ? " on" : "") + (fresh === g.key ? " fresh" : "") + '">' + (got ? '<span class="seal-txt">참<br>잘했어요</span>' : "도장") + "</span>" +
          "</button>";
      }).join("") + "</div>" +
      '<button class="next-card" data-next>' +
        '<span class="next-card__q">' + J.esc(next.hint) + "</span>" +
        '<span class="next-card__body"><b>다음 주 예고 · ' + next.no + "주차</b>" +
        "<span>" + J.esc(next.title) + (next.teaser ? " — " + J.esc(next.teaser) : "") + "</span>" +
        '<span class="next-card__d">' + J.esc(next.label) + "</span></span></button>";
    // 위쪽 안내 띠는 늘 보이게, 나머지만 스크롤
    var body = document.createElement("div");
    body.className = "scroll lobby__body";
    Array.prototype.slice.call(root.children).forEach(function (el) { if (!el.classList.contains("notice")) body.appendChild(el); });
    root.appendChild(body);
    J.$$("[data-week]", root).forEach(function (b) {
      b.addEventListener("click", function () {
        if (b.dataset.week === J.week.id) return;
        J.sfx("flip"); J.setWeek(b.dataset.week); J.go("home");
        J.toast(J.week.no + "주차로 바꿨어요");
      });
    });
    J.$$("[data-next]", root).forEach(function (b) { b.addEventListener("click", function () { J.sfx("flip"); J.showNext(); }); });
    var on = J.$(".wk.on", root);
    if (on) requestAnimationFrame(function () { on.parentNode.scrollLeft = on.offsetLeft - 16; });
    J.$("[data-notice]", root).addEventListener("click", function () { J.sfx("flip"); J.showNotice(null, null, 1); });
    J.$$("[data-go]", root).forEach(function (b) { b.addEventListener("click", function () { J.sfx("flip"); J.go(b.dataset.go); }); });
    var rv = J.$("[data-review]", root); if (rv) rv.addEventListener("click", function () { J.showReview(); });
    bindKakao(root);
    if (seen.indexOf(w.id) < 0) { seen.push(w.id); J.flag("seenWeeks", seen); }
    if (fresh) { J.sfx("ok"); var slot = J.$(".mission__slot.fresh", root); if (slot) slot.scrollIntoView({ block: "center", behavior: "smooth" }); }
    // 모든 미션을 처음 끝냈을 때: 복습 안내 + 큰 도장
    if (complete && !J.booting && !J.flag("doneShown_" + w.id)) {
      J.flag("doneShown_" + w.id, true);
      setTimeout(function () { J.showReview(true); }, fresh ? 900 : 300);
    }
  }

  /* 주차 완료 → 복습 안내 */
  J.showReview = function (celebrate) {
    var w = J.week, next = J.nextInfo(), miss = J.missWords(w.id);
    if (celebrate) { J.sfx("win"); J.confetti(); }
    var m = J.modal(
      '<div class="big-stamp"><span>' + w.no + "주차</span><b>미션 완료</b><small>진담중국어</small></div>" +
      '<h3 class="modal__title">' + J.esc(w.title) + "<br>도장 6개를 다 모았어요!</h3>" +
      '<div class="review-tip"><b>📖 이렇게 복습해요</b>' +
        "<ol><li>한자어 카드를 보며 <b>소리 내어</b> 한 번 더 읽기</li>" +
        "<li>낱말 하나를 골라 <b>글자 뜻으로 쪼개서</b> 가족에게 설명하기</li>" +
        "<li>중국어 소리를 듣고 <b>따라 말하기</b> 🔊</li></ol></div>" +
      (miss.length ? '<div class="review-miss"><b>헷갈렸던 낱말</b><div class="result__review">' +
        miss.map(function (x) { return '<span><b class="hanja">' + J.esc(x.hanja) + "</b> " + J.esc(x.hangul) + "</span>"; }).join("") + "</div></div>" : "") +
      '<div class="review-next">🔒 <b>' + next.no + "주차 · " + J.esc(next.title) + "</b> " + J.esc(next.label) + "<br><small>다음 주에도 새 미션과 도장이 기다려요!</small></div>" +
      '<div class="row row--center"><button class="btn btn--red" data-study>한자어 카드로 복습</button><button class="btn" data-close>좋아요</button></div>');
    J.$("[data-study]", m).addEventListener("click", function () { m.close(); J.go("study", { only: miss.length ? miss : null }); });
    J.$("[data-close]", m).addEventListener("click", function () { m.close(); });
  };

  /* 다음 주 예고 팝업 */
  J.showNext = function () {
    var n = J.nextInfo();
    var m = J.modal(
      '<div class="next-pop__q">' + J.esc(n.hint) + "</div>" +
      '<h3 class="modal__title">' + n.no + "주차 예고</h3>" +
      '<div class="next-pop__title">' + J.esc(n.title) + "</div>" +
      (n.teaser ? '<div class="muted" style="text-align:center">' + J.esc(n.teaser) + "</div>" : "") +
      '<div class="next-pop__d">' + J.esc(n.label) + "</div>" +
      '<div class="muted" style="text-align:center;font-size:14px">새 주차가 열리면 새 미션 6개와 도장판이 생겨요.<br>이번 주 미션을 먼저 모두 끝내 볼까요?</div>' +
      '<button class="btn btn--red guide__go" type="button">기대할게요!</button>');
    J.$(".guide__go", m).addEventListener("click", function () { m.close(); });
  };

  /* 새 주차가 열렸을 때 (전에 와 본 학생) */
  J.showNewWeek = function (then) {
    var w = J.weeks[J.weeks.length - 1];
    J.sfx("win"); J.confetti();
    var m = J.modal(
      '<div class="new-week__badge">NEW</div>' +
      '<div class="next-pop__q hanja">' + J.esc((w.keyChars && w.keyChars[0] && w.keyChars[0].c) || "新") + "</div>" +
      '<h3 class="modal__title">' + w.no + "주차가 열렸어요! 🎉</h3>" +
      '<div class="next-pop__title">' + J.esc(w.title) + "</div>" +
      '<div class="muted" style="text-align:center">새 낱말 ' + w.words.length + "개 · 미션 6개 · 도장판이 준비됐어요.</div>" +
      '<button class="btn btn--red guide__go" type="button">' + w.no + "주차 시작! ▶</button>",
      { onClose: then });
    J.$(".guide__go", m).addEventListener("click", function () { m.close(); });
  };

  /* 모집 안내 팝업 */
  /* 진담중국어 안내 팝업: 1쪽 소개글, 2쪽 중국어 과정 모집 */
  J.noticePages = function () {
    return [
      '<div class="notice-pop">' +
        '<div class="notice-pop__tag">📢 진담중국어 안내</div>' +
        '<div class="notice-pop__title">🌱 한자어로 넓히는 어휘력,<br>중국어로 키우는 <em>소통의 힘!</em></div>' +
        '<p class="notice-pop__p">한자 한 글자에서 시작해<br>우리말 어휘력을 넓히고,<br>중국어로 세상과 소통하는 힘까지!</p>' +
        '<p class="notice-pop__p">쉽게 접하고, 재미있게 반복하고,<br>배운 것은 내 것으로!</p>' +
        '<p class="notice-pop__p">진담중국어는 즐겁게 배우고 반복하며<br>자연스럽게 익힐 수 있도록<br>다양한 학습게임을 직접 개발하여 제공합니다.</p>' +
        '<div class="notice-pop__sign">진담중국어 | 아웃풋에 진심</div>' +
      "</div>",
      '<div class="notice-pop">' +
        '<div class="notice-pop__tag">📢 중국어 과정 모집</div>' +
        '<div class="notice-pop__lead">한자어로 넓히는 어휘력,<br>중국어로 여는 소통과 기회</div>' +
        '<div class="notice-pop__title">&lt;한자어로 시작하는 중국어 과정&gt; <em>모집</em></div>' +
        '<ul class="notice-pop__list"><li>초등과정 <small>(저학년 / 고학년)</small></li><li>중·고등과정</li><li>HSK + 스피킹 과정</li></ul>' +
        '<div class="contact"><div class="contact__btns">' + J.PHONE_BTN + J.KAKAO_CHAT.replace("카톡 채팅 바로가기", "카톡 문의") + "</div>" +
          '<a class="review-btn" href="' + J.REVIEW_LINK + '" target="_blank" rel="noopener">⭐ 후기 보러가기</a></div>' +
      "</div>"
    ];
  };
  J.showNotice = function (then, label, startPage) {
    var pages = J.noticePages(), pg = startPage || 0;
    var m = J.modal(
      '<div class="npage"></div>' +
      '<div class="ndots">' + pages.map(function (_, i) { return "<i></i>"; }).join("") + "</div>" +
      '<div class="nnav"><button class="btn" type="button" data-prev>‹ 이전</button><button class="btn btn--red guide__go" type="button" data-nx></button></div>',
      { onClose: then, noClose: !!then });
    var box = J.$(".npage", m), prev = J.$("[data-prev]", m), nx = J.$("[data-nx]", m);
    function show() {
      box.innerHTML = pages[pg];
      J.$$(".ndots i", m).forEach(function (d, i) { d.classList.toggle("on", i === pg); });
      prev.hidden = pg === 0;
      nx.textContent = pg < pages.length - 1 ? "다음 ▶" : (label || "확인");
      bindKakao(box);
      var sc = J.$(".modal__box", m); if (sc) sc.scrollTop = 0;
    }
    prev.addEventListener("click", function () { if (pg > 0) { pg--; J.sfx("flip"); show(); } });
    nx.addEventListener("click", function () {
      J.sfx("flip");
      if (pg < pages.length - 1) { pg++; show(); } else m.close();
    });
    show();
  };


  J.promoHTML = function () {
    return '<div class="promo">' +
      '<div class="promo__eyebrow">한자어로 넓히는 어휘력, 중국어로 여는 소통과 기회</div>' +
      "<h2>&lt;한자어로 시작하는 중국어 과정&gt; <em>모집</em></h2>" +
      '<div class="promo__courses"><span>초등과정 (저학년 / 고학년)</span><span>중·고등과정</span><span>HSK + 스피킹 과정</span></div>' +
      '<div class="contact"><div class="contact__btns">' + J.PHONE_BTN + J.KAKAO_CHAT.replace("카톡 채팅 바로가기", "카톡 문의") + "</div></div>" +
      '<div class="promo__brand">진담중국어 · 진심을 담은 중국어</div>' +
      "</div>";
  };

  /* 전화 문의: 번호를 보여 주고 바로 걸 수 있게 */
  J.showPhone = function () {
    var n = J.PHONE, pretty = n.replace(/^(\d{3})(\d{4})(\d{4})$/, "$1-$2-$3");
    var m = J.modal(
      '<h3 class="modal__title">📞 전화 문의</h3>' +
      '<div class="phone-num">' + pretty + "</div>" +
      '<div class="muted" style="text-align:center;font-size:14px">진담중국어 · &lt;한자어로 시작하는 중국어 과정&gt;</div>' +
      '<a class="btn btn--red guide__go" href="tel:' + n + '">전화 걸기</a>' +
      '<button class="btn" type="button" data-copy>번호 복사</button>');
    J.$("[data-copy]", m).addEventListener("click", function () {
      if (navigator.clipboard) navigator.clipboard.writeText(pretty).then(function () { J.toast("전화번호를 복사했어요"); });
    });
  };

  function bindKakao(root) {
    J.$$("[data-phone]", root).forEach(function (b) {
      b.addEventListener("click", function () { J.sfx("flip"); J.showPhone(); });
    });
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
    var first = J.stamp(J.week.id, o.game);
    J.addMisses(J.week.id, o.review);
    var left = J.GAMES.filter(function (g) { return !J.stamps(J.week.id)[g.key]; }).length;
    var idx = J.GAMES.findIndex(function (g) { return g.key === o.game; }) + 1;
    J.sfx("win");
    J.confetti();
    root.innerHTML =
      '<div class="result">' +
        '<div class="result__stamp">참<br>잘했어요</div>' +
        "<h2>" + J.esc(o.title || "다 했어요!") + "</h2>" +
        (o.sub ? '<div class="muted">' + o.sub + "</div>" : "") +
        (o.review && o.review.length ? '<div class="muted">헷갈렸던 낱말 — 한 번 더 소리 내어 읽어 봐요</div><div class="result__review">' +
          o.review.map(function (w) { return "<span><b class=\"hanja\">" + J.esc(w.hanja) + "</b> " + J.esc(w.hangul) + "</span>"; }).join("") + "</div>" : "") +
        '<div class="result__mission">' + (first ? "미션 " + idx + " 도장 쾅! " : "") + (left ? "남은 미션 " + left + "개" : "🏅 이번 주 미션을 모두 끝냈어요!") + "</div>" +
        '<div class="row row--center"><button class="btn" data-again>한 번 더</button><button class="btn btn--red" data-home>' + (first ? "도장 보러 가기 ▶" : "미션판으로") + "</button></div>" +
        '<div class="result__promo">한자어로 넓히는 어휘력, 중국어로 여는 소통과 기회<br><b>&lt;한자어로 시작하는 중국어 과정&gt; 모집</b> &nbsp;' + J.KAKAO_CHAT + '</div>' +
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
    J.$(".topbar__gear").addEventListener("click", function () { J.sfx("flip"); J.openSettings(); });
    bindKakao(J.$(".footer"));
    var files = window.JINDAM_WEEK_FILES || [];
    files.reduce(function (p, f) { return p.then(function () { return loadScript("data/" + f + ".js"); }); }, Promise.resolve()).then(function () {
      if (!J.weeks.length) { stage.innerHTML = '<p class="card">이번 주 자료를 불러오지 못했어요. 새로고침해 주세요.</p>'; return; }
      J.setWeek(null); // 늘 가장 최근 주차로 시작
      var start = location.hash.replace("#", "");
      var seen = J.flag("seenWeeks") || [];
      var latest = J.weeks[J.weeks.length - 1];
      var newOpen = seen.length > 0 && seen.indexOf(latest.id) < 0;
      J.booting = true;
      J.go("home");
      J.showIntro(function () {
        J.booting = false;
        if (newOpen) J.showNewWeek(function () { J.go("home"); });
        else if (J.screens[start]) J.go(start);
      });
    });
  };
})();
