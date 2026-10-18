/* 진담 한자어 놀이터 — 카드, 짝 맞추기, 같은 글자 찾기, 퀴즈 2종 */
(function () {
  var J = window.JINDAM;

  /* ───────── 한자어 카드 ───────── */
  J.screens.study = function (root, opts) {
    var words = (opts && opts.only) || J.week.words, i = 0;
    if (opts && opts.only) J.toast("헷갈렸던 낱말 " + words.length + "개를 복습해요");
    root.innerHTML =
      '<div class="study">' +
        '<div class="progress"><i></i></div>' +
        '<div class="card study__card"></div>' +
        '<div class="row"><button class="btn" data-prev>◀ 앞</button><span class="grow"></span><button class="btn btn--red" data-next>다음 ▶</button></div>' +
      "</div>";
    var card = J.$(".study__card", root), bar = J.$(".progress i", root);
    var prev = J.$("[data-prev]", root), next = J.$("[data-next]", root);

    function show() {
      var w = words[i];
      bar.style.width = ((i + 1) / words.length) * 100 + "%";
      card.innerHTML =
        '<span class="pill study__subject">' + J.esc(w.subject) + "</span>" +
        '<span class="pill study__count">' + (i + 1) + " / " + words.length + "</span>" +
        '<div class="hanja study__hanja">' + J.esc(w.hanja) + "</div>" +
        '<div class="study__hangul">' + J.esc(w.hangul) + "</div>" +
        '<div class="parts">' + w.parts.map(function (p) {
          return '<span class="part"><span class="hanja">' + J.esc(p[0]) + "</span>" + J.esc(p[1]) + " " + J.esc(p[2]) + "</span>";
        }).join("") + "</div>" +
        '<div class="study__meaning">' + J.esc(w.meaning) + "</div>" +
        (w.tip ? '<div class="study__tip">💡 ' + J.esc(w.tip) + "</div>" : "");
      if (w.zh) {
        var line = J.h('<div class="zh-line"><span class="muted" style="color:inherit">중국어</span><span class="hanja">' + J.esc(w.zh) + '</span><span class="zh-line__py">' + J.esc(w.py || "") + '</span><span class="zh-line__ko">' + J.esc(w.zhKo || "") + "</span></div>");
        line.appendChild(J.speakBtn(w.zh));
        card.appendChild(line);
      }
      prev.disabled = i === 0;
      next.textContent = i === words.length - 1 ? "다 봤어요 ✓" : "다음 ▶";
    }
    prev.addEventListener("click", function () { if (i > 0) { i--; J.sfx("flip"); show(); } });
    next.addEventListener("click", function () {
      if (i < words.length - 1) { i++; J.sfx("flip"); show(); }
      else J.result(root, { game: "study", title: words.length + "개 낱말을 다 봤어요!", sub: "이제 놀이로 한 번 더 만나 볼까요?" });
    });
    // 밀어서 넘기기
    var sx = null;
    card.addEventListener("pointerdown", function (e) { sx = e.clientX; });
    card.addEventListener("pointerup", function (e) {
      if (sx == null) return;
      var dx = e.clientX - sx; sx = null;
      if (dx < -50) next.click(); else if (dx > 50 && i > 0) prev.click();
    });
    show();
  };

  /* ───────── 카드 짝 맞추기 ───────── */
  J.screens.flip = function (root) {
    var pairs = J.pick(J.week.words, Math.min(6, J.week.words.length));
    var cards = [];
    pairs.forEach(function (w) {
      cards.push({ id: w.id, html: '<div class="hanja">' + J.esc(w.hanja) + "</div>" });
      cards.push({ id: w.id, html: '<div class="fun">' + J.esc(w.hangul) + "<small>" + J.esc(w.subject) + "</small></div>" });
    });
    cards = J.shuffle(cards);
    root.innerHTML =
      '<div class="flip">' +
        '<div class="row"><span class="pill">🃏 한자 ↔ 우리말 짝 찾기</span><span class="grow"></span><span class="pill" data-moves>0번 뒤집음</span></div>' +
        '<div class="flip__grid">' + cards.map(function (c, k) {
          return '<button class="fcard" data-k="' + k + '"><div class="fcard__in"><div class="fcard__face fcard__back"><span class="fcard__logo">진담</span></div><div class="fcard__face fcard__front">' + c.html + "</div></div></button>";
        }).join("") + "</div>" +
        '<div class="muted" style="text-align:center;font-size:14px" data-msg>👀 카드 자리를 잘 기억하세요!</div>' +
      "</div>";
    var open = [], lock = true, moves = 0, matched = 0;
    var movesEl = J.$("[data-moves]", root), msg = J.$("[data-msg]", root);
    // 처음 3초 동안 카드를 모두 보여 주고, 뒤집으며 시작
    var all = J.$$(".fcard", root), sec = 3, alive = true;
    all.forEach(function (c) { c.classList.add("open"); });
    movesEl.textContent = "⏱ " + sec;
    var timer = setInterval(function () {
      if (!alive) return clearInterval(timer);
      sec--;
      if (sec > 0) { movesEl.textContent = "⏱ " + sec; J.sfx("flip"); return; }
      clearInterval(timer);
      all.forEach(function (c) { c.classList.remove("open"); });
      J.sfx("ok");
      movesEl.textContent = "0번 뒤집음";
      msg.textContent = "카드 두 장을 뒤집어 같은 낱말을 찾아요";
      setTimeout(function () { lock = false; }, 400);
    }, 1000);
    J.$$(".fcard", root).forEach(function (el) {
      el.addEventListener("click", function () {
        if (lock || el.classList.contains("open") || el.classList.contains("matched")) return;
        el.classList.add("open"); J.sfx("flip");
        open.push(el);
        if (open.length < 2) return;
        moves++; movesEl.textContent = moves + "번 뒤집음";
        var a = cards[open[0].dataset.k], b = cards[open[1].dataset.k];
        if (a.id === b.id) {
          var w = pairs.find(function (p) { return p.id === a.id; });
          open.forEach(function (o) { o.classList.add("matched"); });
          open = []; matched++; J.sfx("ok");
          msg.innerHTML = '<b class="hanja">' + J.esc(w.hanja) + "</b> " + J.esc(w.hangul) + " — " + J.esc(J.partsText(w));
          if (matched === pairs.length) setTimeout(function () {
            J.result(root, { game: "flip", title: "짝을 모두 찾았어요!", sub: moves + "번 만에 성공했어요." });
          }, 700);
        } else {
          lock = true; J.sfx("no");
          open.forEach(function (o) { o.classList.add("shake"); });
          setTimeout(function () {
            open.forEach(function (o) { o.classList.remove("open", "shake"); });
            open = []; lock = false;
          }, 850);
        }
      });
    });
    return { leave: function () { alive = false; clearInterval(timer); } };
  };

  /* ───────── 같은 글자 찾기 ───────── */
  J.screens.find = function (root) {
    var keys = (J.week.keyChars || []).slice();
    if (!keys.length) { // 자동으로: 두 낱말 이상에 들어간 글자
      var count = {};
      J.week.words.forEach(function (w) { Array.from(new Set(w.hanja)).forEach(function (c) { count[c] = (count[c] || 0) + 1; }); });
      Object.keys(count).filter(function (c) { return count[c] >= 2; }).forEach(function (c) {
        var w = J.week.words.find(function (x) { return x.hanja.indexOf(c) >= 0; });
        var p = w.parts.find(function (pp) { return pp[0] === c; });
        keys.push({ c: c, hun: p[1], eum: p[2] });
      });
    }
    if (!keys.length) { root.innerHTML = '<p class="card">이번 주에는 같은 글자 찾기 문제가 없어요.</p>'; return; }
    var k = keys[Math.floor(Math.random() * keys.length)];
    var pool = J.week.words.map(function (w) { return { hanja: w.hanja, hangul: w.hangul }; }).concat(k.extra || []);
    var yes = J.pick(pool.filter(function (w) { return w.hanja.indexOf(k.c) >= 0; }), 5);
    var no = J.pick(pool.filter(function (w) { return w.hanja.indexOf(k.c) < 0; }), 9 - yes.length);
    var cells = J.shuffle(yes.concat(no));
    root.innerHTML =
      '<div class="find">' +
        '<div class="find__key"><div class="find__char hanja">' + J.esc(k.c) + '</div>' +
        '<div class="find__q"><b>' + J.esc(k.hun) + " " + J.esc(k.eum) + "</b>이 들어간<br>낱말을 모두 찾아요! <span class=\"pill\" data-left>" + yes.length + "개 남음</span></div></div>" +
        '<div class="find__grid">' + cells.map(function (w, i) {
          return '<button class="find__cell" data-i="' + i + '">' + J.esc(w.hangul) + "<small>" + J.esc(w.hanja) + "</small></button>";
        }).join("") + "</div>" +
      "</div>";
    var left = yes.length, miss = [];
    var leftEl = J.$("[data-left]", root);
    J.$$(".find__cell", root).forEach(function (el) {
      el.addEventListener("click", function () {
        var w = cells[el.dataset.i];
        if (w.hanja.indexOf(k.c) >= 0) {
          el.classList.add("ok"); J.sfx("ok"); left--;
          leftEl.textContent = left ? left + "개 남음" : "다 찾았어요!";
          if (!left) setTimeout(function () {
            J.result(root, { game: "find", title: k.c + "(" + k.hun + " " + k.eum + ") 낱말을 다 찾았어요!", sub: yes.map(function (y) { return y.hangul; }).join(" · "), review: miss });
          }, 800);
        } else {
          el.classList.add("no"); J.sfx("no"); miss.push(w);
        }
      });
    });
  };

  /* ───────── 문제 풀이 공통: 틀리면 두 문제 뒤에 다시 ───────── */
  function runDeck(root, o) {
    var deck = o.deck.slice(), total = deck.length, solved = 0, wrongIds = {}, review = [];
    root.innerHTML =
      '<div class="quiz">' +
        '<div class="row"><div class="progress grow"><i></i></div><span class="pill" data-count></span></div>' +
        '<div class="card quiz__q"></div>' +
        '<div class="quiz__tools" hidden><button class="hint-btn" type="button" data-hint>💡 힌트</button><span class="hint-text"></span></div>' +
        '<div class="quiz__opts"></div>' +
      "</div>";
    var qEl = J.$(".quiz__q", root), optsEl = J.$(".quiz__opts", root), bar = J.$(".progress i", root), cnt = J.$("[data-count]", root);

    function next() {
      if (!deck.length) {
        return J.result(root, {
          game: o.game,
          title: total + "문제 모두 맞혔어요!",
          sub: review.length ? "틀린 문제도 끝까지 다시 풀어서 맞혔어요." : "한 번에 다 맞혔어요. 대단해요!",
          review: review
        });
      }
      var item = deck.shift();
      bar.style.width = (solved / total) * 100 + "%";
      cnt.textContent = (solved + 1) + " / " + total;
      var others = o.words.filter(function (x) { return x.id !== item.w.id && x.hangul !== item.w.hangul; });
      // 글자 수가 같은 낱말을 먼저 섞어서 보기를 고르기 어렵게
      var same = J.shuffle(others.filter(function (x) { return x.hanja.length === item.w.hanja.length; }));
      var rest = J.shuffle(others.filter(function (x) { return x.hanja.length !== item.w.hanja.length; }));
      var opts = J.shuffle([item.w].concat(same.concat(rest).slice(0, 3)));
      o.render(qEl, item);
      optsEl.innerHTML = "";
      // 힌트: 문제마다 단계별로 (마지막 단계는 틀린 보기 2개 지우기)
      var tools = J.$(".quiz__tools", root), hintBtn = J.$("[data-hint]", root), hintText = J.$(".hint-text", root);
      var hints = (o.hints ? o.hints(item) : []).concat([{ text: "틀린 보기 2개를 지웠어요", act: function () {
        var wrong = J.shuffle(J.$$(".opt", optsEl).filter(function (b, k) { return opts[k].id !== item.w.id; })).slice(0, 2);
        wrong.forEach(function (b) { b.classList.add("gone"); });
      } }]);
      var hi = 0;
      tools.hidden = !o.hints;
      hintText.innerHTML = "";
      hintBtn.disabled = false;
      hintBtn.textContent = "💡 힌트 " + hints.length + "개";
      hintBtn.onclick = function () {
        if (hi >= hints.length || optsEl.dataset.lock) return;
        var h = hints[hi++];
        J.sfx("flip");
        if (h.act) h.act();
        hintText.innerHTML = h.text;
        hintBtn.textContent = hi < hints.length ? "💡 힌트 더 보기 (" + (hints.length - hi) + ")" : "힌트 다 썼어요";
        hintBtn.disabled = hi >= hints.length;
      };
      opts.forEach(function (w) {
        var b = J.h('<button class="opt' + (o.small && o.small(item) ? " small" : "") + '">' + o.label(w, item) + "</button>");
        b.addEventListener("click", function () {
          if (optsEl.dataset.lock) return;
          optsEl.dataset.lock = "1";
          var ok = w.id === item.w.id;
          b.classList.add(ok ? "ok" : "no");
          if (ok) {
            J.sfx("ok"); solved++;
          } else {
            J.sfx("no");
            J.$$(".opt", optsEl)[opts.indexOf(item.w)].classList.add("ok");
            if (!wrongIds[item.w.id]) { wrongIds[item.w.id] = 1; review.push(item.w); }
            deck.splice(Math.min(2, deck.length), 0, item); // 두 문제 뒤에 다시
          }
          o.reveal(qEl, item, ok, function () { delete optsEl.dataset.lock; next(); });
        });
        optsEl.appendChild(b);
      });
      if (o.onShow) o.onShow(item);
    }
    next();
  }

  function nextBtn(qEl, go, label) {
    var b = J.h('<button class="btn btn--red btn--sm">' + (label || "다음 ▶") + "</button>");
    b.addEventListener("click", go);
    qEl.appendChild(b);
  }

  /* ───────── 뜻 조립 퀴즈 ───────── */
  J.screens.quiz = function (root) {
    var words = J.week.words;
    var picked = J.pick(words, Math.min(10, words.length));
    var deck = picked.map(function (w, i) { return { w: w, type: i % 2 ? "meaning" : "parts" }; });
    runDeck(root, {
      game: "quiz", words: words, deck: deck,
      small: function (item) { return item.type === "meaning"; },
      label: function (w, item) { return item.type === "meaning" ? J.esc(w.meaning) : '<span class="hanja opt__hanja">' + J.esc(w.hanja) + "</span>"; },
      hints: function (item) {
        var w = item.w;
        if (item.type === "parts") return [
          { text: "우리말로 읽으면 <b>" + J.esc(w.hangul) + "</b>" }
        ];
        return [{ text: "글자 뜻: <b>" + J.esc(J.partsText(w)) + "</b>" }];
      },
      render: function (q, item) {
        var w = item.w;
        if (item.type === "parts") {
          q.innerHTML = '<span class="pill quiz__type">글자 뜻을 이으면 어떤 한자어?</span>' +
            '<div class="quiz__prompt">' + w.parts.map(function (p) {
              return "<span>" + J.esc(p[1]) + " " + J.esc(p[2]) + "</span>";
            }).join('<span class="plus">+</span>') + "</div>";
        } else {
          q.innerHTML = '<span class="pill quiz__type">이 낱말의 뜻은?</span>' +
            '<div class="quiz__prompt"><span class="hanja">' + J.esc(w.hanja) + "</span>" + J.esc(w.hangul) + "</div>";
        }
      },
      reveal: function (q, item, ok, go) {
        var w = item.w;
        var fb = J.h('<div class="quiz__feedback">' + (ok ? "⭕ 맞았어요! " : "앗, 정답은 이거예요. ") +
          '<b class="hanja">' + J.esc(w.hanja) + "</b> " + J.esc(w.hangul) + " = " + J.esc(J.partsText(w)) +
          (ok ? "" : '<br><span class="muted">조금 뒤에 다시 나와요!</span>') + "</div>");
        q.appendChild(fb);
        if (ok) setTimeout(go, 1100); else nextBtn(q, go);
      }
    });
  };

  /* ───────── 중국어 소리 퀴즈 ───────── */
  J.screens.listen = function (root) {
    var words = J.week.words.filter(function (w) { return w.zh; });
    if (words.length < 4) { root.innerHTML = '<p class="card">이번 주에는 소리 퀴즈 낱말이 부족해요.</p>'; return; }
    var deck = J.pick(words, Math.min(8, words.length)).map(function (w) { return { w: w }; });
    runDeck(root, {
      game: "listen", words: words, deck: deck,
      label: function (w) { return J.esc(w.hangul); },
      render: function (q, item) {
        q.innerHTML = '<span class="pill quiz__type">중국어 소리를 듣고, 어떤 우리말 낱말인지 골라요</span>';
        var sp = J.speakBtn(item.w.zh, "big-speaker");
        q.appendChild(sp);
        q.appendChild(J.h('<div class="muted" style="font-size:14px">🔊 눌러서 몇 번이든 다시 들을 수 있어요</div>'));
      },
      onShow: function (item) { setTimeout(function () { var b = J.$(".big-speaker", root); if (b) b.click(); }, 350); },
      reveal: function (q, item, ok, go) {
        var w = item.w;
        J.$$(".muted", q).forEach(function (m) { m.remove(); });
        q.appendChild(J.h('<div class="reveal">' + (ok ? "⭕ 맞았어요!" : "정답은 <b>" + J.esc(w.hangul) + "</b>") +
          '<div><span class="hanja">' + J.esc(w.hanja) + "</span> → 중국어 <span class=\"hanja\">" + J.esc(w.zh) + "</span></div>" +
          "<div>" + J.esc(w.py) + ' <b style="color:var(--red)">' + J.esc(w.zhKo || "") + "</b></div>" +
          (ok ? "" : '<div class="muted">조금 뒤에 다시 나와요!</div>') + "</div>"));
        nextBtn(q, go, ok ? "다음 ▶" : "알겠어요 ▶");
      }
    });
  };
})();
