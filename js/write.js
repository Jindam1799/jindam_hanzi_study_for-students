/*
 * 따라 쓰기 — 한 글자를 3번씩
 * 1번째: 회색 글자를 보며 따라 쓰기 / 2번째: 한 번 더 / 3번째: 글자 없이 스스로 (두 번 틀리면 힌트)
 * 획순 자료: Hanzi Writer (Make Me a Hanzi 자료). 자료가 없는 글자는 손으로 따라 그리는 연습 칸으로 바뀌어요.
 */
(function () {
  var J = window.JINDAM;
  var HW_SRC = "https://cdn.jsdelivr.net/npm/hanzi-writer@3/dist/hanzi-writer.min.js";
  var hwReady = null;
  function loadHW() {
    if (window.HanziWriter) return Promise.resolve(true);
    if (hwReady) return hwReady;
    hwReady = new Promise(function (res) {
      var s = document.createElement("script");
      s.src = HW_SRC; s.onload = function () { res(true); }; s.onerror = function () { res(false); };
      document.head.appendChild(s);
    });
    return hwReady;
  }

  var ROUND_MSG = ["회색 글자를 따라 써요 ✏️", "한 번 더! 획순을 떠올리며 ✏️", "이번엔 스스로! 어려우면 힌트가 나와요 💪"];
  var GRID = '<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" style="pointer-events:none">' +
    '<g stroke="#F0C9C4" stroke-width=".5" stroke-dasharray="2 2"><line x1="0" y1="0" x2="100" y2="100"/><line x1="100" y1="0" x2="0" y2="100"/>' +
    '<line x1="50" y1="0" x2="50" y2="100"/><line x1="0" y1="50" x2="100" y2="50"/></g></svg>';

  J.screens.write = function (root) {
    var words = J.week.words, wi = 0, ci = 0, round = 0, done = {}, alive = true;
    var writer = null;
    root.innerHTML =
      '<div class="write">' +
        '<div class="word-chips">' + words.map(function (w, i) {
          return '<button class="chip" data-w="' + i + '"><span class="hanja">' + J.esc(w.hanja) + "</span>" + J.esc(w.hangul) + "</button>";
        }).join("") + "</div>" +
        '<div class="write__main">' +
          '<div class="write__info">' +
            '<div class="write__seq"></div>' +
            '<div class="write__label"></div>' +
            '<div class="rounds"><span class="round">1</span><span class="round">2</span><span class="round">3</span></div>' +
            '<div class="round-msg"></div>' +
          "</div>" +
          '<div class="write__padwrap"><div class="write__pad"></div></div>' +
        "</div>" +
        '<div class="write__tools">' +
          '<button class="btn btn--sm btn--sun" data-anim>👀 획순 보기</button>' +
          '<button class="btn btn--sm" data-retry>↺ 다시 쓰기</button>' +
          '<button class="btn btn--sm btn--mint" data-skip hidden>다 썼어요 ✓</button>' +
          '<button class="btn btn--sm" data-clear hidden>지우기</button>' +
        "</div>" +
      "</div>";

    var pad = J.$(".write__pad", root), padwrap = J.$(".write__padwrap", root);
    var seqEl = J.$(".write__seq", root), labelEl = J.$(".write__label", root), msgEl = J.$(".round-msg", root);
    var roundsEls = J.$$(".round", root);
    var btnAnim = J.$("[data-anim]", root), btnRetry = J.$("[data-retry]", root), btnSkip = J.$("[data-skip]", root), btnClear = J.$("[data-clear]", root);
    var fallback = null;

    function sizePad() {
      var r = padwrap.getBoundingClientRect();
      var s = Math.floor(Math.min(r.width, r.height, 520));
      s = Math.max(140, s);
      pad.style.width = pad.style.height = s + "px";
      return s;
    }

    function word() { return words[wi]; }

    function render() {
      var w = word();
      J.$$(".chip", root).forEach(function (c, i) {
        c.classList.toggle("active", i === wi);
        c.classList.toggle("done", !!done[i]);
      });
      var chip = J.$('.chip[data-w="' + wi + '"]', root);
      if (chip && chip.scrollIntoView) chip.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
      seqEl.innerHTML = w.parts.map(function (p, i) {
        return '<span class="hanja ' + (i < ci ? "ok" : i === ci ? "now" : "") + '">' + J.esc(p[0]) + "</span>";
      }).join("");
      var p = w.parts[ci];
      labelEl.innerHTML = J.esc(p[1]) + " " + J.esc(p[2]) + "<small>" + J.esc(w.hangul) + " · " + J.esc(w.meaning) + "</small>";
      roundsEls.forEach(function (el, i) {
        el.className = "round" + (i < round ? " ok" : i === round ? " now" : "");
        el.textContent = i < round ? "✓" : i + 1;
      });
      msgEl.textContent = ROUND_MSG[round];
      startRound();
    }

    function startRound() {
      var ch = word().parts[ci][0];
      var size = sizePad();
      pad.innerHTML = GRID;
      writer = null; fallback = null;
      btnSkip.hidden = btnClear.hidden = true;
      btnAnim.hidden = btnRetry.hidden = false;
      loadHW().then(function (ok) {
        if (!alive) return;
        if (!ok) return startFallback(ch, size);
        var holder = document.createElement("div");
        pad.appendChild(holder);
        var failed = false;
        writer = HanziWriter.create(holder, ch, {
          width: size, height: size, padding: Math.round(size * 0.06),
          showCharacter: false,
          showOutline: round < 2,
          strokeColor: "#2A2420",
          outlineColor: "#E6DDD0",
          highlightColor: "#C8372D",
          drawingColor: "#C8372D",
          drawingWidth: Math.max(16, Math.round(size / 22)),
          strokeAnimationSpeed: 1.2,
          delayBetweenStrokes: 180,
          showHintAfterMisses: round < 2 ? 1 : 2,
          highlightOnComplete: true,
          onLoadCharDataError: function () { failed = true; holder.remove(); startFallback(ch, size); }
        });
        if (failed) return;
        writer.quiz({
          leniency: round === 0 ? 1.3 : 1.1,
          onCorrectStroke: function () { J.sfx("flip"); },
          onMistake: function () { /* 힌트는 Hanzi Writer가 보여 줌 */ },
          onComplete: function () { setTimeout(roundDone, 450); }
        });
      });
    }

    /* 획순 자료가 없을 때: 흐린 글자 위에 손으로 따라 그리기 */
    function startFallback(ch, size) {
      btnAnim.hidden = true;
      btnSkip.hidden = btnClear.hidden = false;
      msgEl.textContent = round < 2 ? "흐린 글자를 따라 그려요 ✏️" : "글자 없이 스스로 써 봐요 💪";
      var ghost = J.h('<div class="ghost">' + J.esc(ch) + "</div>");
      ghost.style.fontSize = Math.round(size * 0.78) + "px";
      if (round === 2) ghost.style.opacity = "0";
      pad.appendChild(ghost);
      var cv = document.createElement("canvas");
      var dpr = window.devicePixelRatio || 1;
      cv.width = size * dpr; cv.height = size * dpr;
      pad.appendChild(cv);
      var ctx = cv.getContext("2d");
      ctx.scale(dpr, dpr);
      ctx.lineCap = ctx.lineJoin = "round";
      ctx.strokeStyle = "#C8372D"; ctx.lineWidth = Math.max(10, size / 26);
      var drawing = false, drew = false;
      function pt(e) { var r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
      cv.addEventListener("pointerdown", function (e) { drawing = true; cv.setPointerCapture(e.pointerId); var p = pt(e); ctx.beginPath(); ctx.moveTo(p[0], p[1]); });
      cv.addEventListener("pointermove", function (e) { if (!drawing) return; var p = pt(e); ctx.lineTo(p[0], p[1]); ctx.stroke(); drew = true; });
      cv.addEventListener("pointerup", function () { drawing = false; });
      fallback = { clear: function () { ctx.clearRect(0, 0, size, size); drew = false; }, drew: function () { return drew; } };
    }

    function roundDone() {
      if (!alive) return;
      J.sfx("ok");
      round++;
      if (round < 3) return render();
      round = 0; ci++;
      if (ci < word().parts.length) { J.toast("좋아요! 다음 글자"); return render(); }
      wordDone();
    }

    function wordDone() {
      var w = word();
      done[wi] = true;
      J.stamp(J.week.id, "write");
      J.sfx("win"); J.confetti();
      ci = 0;
      var allDone = words.every(function (_, i) { return done[i]; });
      pad.innerHTML = "";
      var box = J.h('<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;text-align:center;padding:16px">' +
        '<div class="hanja" style="font-size:' + Math.round(pad.clientWidth * 0.26) + 'px;line-height:1.1">' + J.esc(w.hanja) + "</div>" +
        '<div style="font-family:var(--font-fun);font-size:24px">' + J.esc(w.hangul) + " 다 썼어요! 🎉</div>" +
        (w.zh ? '<div class="zh-line"><span class="hanja">' + J.esc(w.zh) + '</span><span class="zh-line__py">' + J.esc(w.py) + "</span></div>" : "") +
        "</div>");
      pad.appendChild(box);
      if (w.zh) J.$(".zh-line", box).appendChild(J.speakBtn(w.zh));
      var nb = J.h('<button class="btn btn--red">' + (allDone ? "모두 끝! 🏅" : "다음 낱말 ▶") + "</button>");
      box.appendChild(nb);
      nb.addEventListener("click", function () {
        if (allDone) return J.result(root, { game: "write", title: "모든 낱말을 3번씩 썼어요!", sub: "손으로 쓴 글자는 오래 기억에 남아요." });
        var n = words.findIndex(function (_, i) { return i > wi && !done[i]; });
        if (n < 0) n = words.findIndex(function (_, i) { return !done[i]; });
        wi = n; round = 0; ci = 0; render();
      });
      btnAnim.hidden = btnRetry.hidden = true; btnSkip.hidden = btnClear.hidden = true;
      msgEl.textContent = "참 잘했어요!";
      labelEl.innerHTML = J.esc(w.hangul) + "<small>" + J.esc(J.partsText(w)) + "</small>";
      roundsEls.forEach(function (el) { el.className = "round ok"; el.textContent = "✓"; });
      seqEl.innerHTML = w.parts.map(function (p) { return '<span class="hanja ok">' + J.esc(p[0]) + "</span>"; }).join("");
      J.$('.chip[data-w="' + wi + '"]', root).classList.add("done");
    }

    J.$$(".chip", root).forEach(function (c) {
      c.addEventListener("click", function () { wi = +c.dataset.w; ci = 0; round = 0; J.sfx("flip"); render(); });
    });
    btnRetry.addEventListener("click", function () { startRound(); });
    btnAnim.addEventListener("click", function () {
      if (!writer) return;
      writer.cancelQuiz();
      writer.showOutline();
      writer.animateCharacter({ onComplete: function () { setTimeout(function () { if (alive) startRound(); }, 500); } });
    });
    btnClear.addEventListener("click", function () { if (fallback) fallback.clear(); });
    btnSkip.addEventListener("click", function () {
      if (fallback && !fallback.drew()) return J.toast("먼저 글자를 써 봐요!");
      roundDone();
    });

    var onResize = function () { if (writer || fallback) startRound(); };
    var rt = null;
    var resizeHandler = function () { clearTimeout(rt); rt = setTimeout(onResize, 250); };
    window.addEventListener("resize", resizeHandler);

    // 레이아웃이 잡힌 다음 시작
    requestAnimationFrame(function () { requestAnimationFrame(render); });
    return { leave: function () { alive = false; window.removeEventListener("resize", resizeHandler); } };
  };
})();
