/*
 * 중국어 음성 (Tingting 우선)
 * 순서: 설정에서 고른 목소리 → Tingting → 그 밖의 zh-CN 기본 음성(맥 캐릭터 음성 제외) → Google 普通话 → 아무 중국어 음성
 *
 * 맥 Chrome에서는 Tingting이 '말하는 중' 상태로 멈춰 소리가 안 나는 일이 있어요(2026-10-18 확인, Chrome 155).
 * 그래서 2.5초 안에 소리가 시작되지 않으면 그 목소리를 이번 접속 동안 건너뛰고 다음 목소리로 다시 읽어요.
 * 진단: 콘솔 [TTS] 로그, window.__ttsLog
 */
(function () {
  var synth = window.speechSynthesis;
  var log = (window.__ttsLog = []);
  function note(msg) {
    var line = new Date().toISOString().slice(11, 19) + " " + msg;
    log.push(line);
    if (log.length > 50) log.shift();
    console.log("[TTS] " + msg);
  }

  var CHARACTER_VOICES = /Eddy|Flo|Grandma|Grandpa|Reed|Rocko|Sandy|Shelley|Bad News|Bells|Bubbles|Jester|Whisper|Zarvox/i;
  var bad = {};          // 이번 접속에서 소리가 안 났던 목소리
  var chosen = null;
  var keep = null;       // Chrome이 말하는 도중 utterance를 버리지 않도록 붙잡아 둠

  function settings() { return (window.JINDAM && JINDAM.settings) || {}; }

  // 고를 수 있는 중국어(보통화) 목소리 목록, 추천 순서
  function list() {
    if (!synth) return [];
    var voices = synth.getVoices();
    var zh = voices.filter(function (v) { return /^zh[-_](CN|Hans)/i.test(v.lang) || /^cmn/i.test(v.lang); })
      .filter(function (v) { return !CHARACTER_VOICES.test(v.name); });
    var rank = function (v) {
      if (/ting-?ting/i.test(v.name)) return 0;
      if (v.localService) return 1;
      if (/Google/i.test(v.name)) return 2;
      return 3;
    };
    return zh.sort(function (a, b) { return rank(a) - rank(b); });
  }

  function pickVoice() {
    if (!synth) return null;
    var all = list();
    var want = settings().voiceName;
    var v = (want && all.find(function (x) { return x.name === want && !bad[x.name]; })) ||
      all.find(function (x) { return !bad[x.name]; }) ||
      synth.getVoices().find(function (x) { return /^zh/i.test(x.lang) && !bad[x.name]; }) || null;
    if (v && (!chosen || chosen.name !== v.name)) note("voice: " + v.name + " (" + v.lang + ")");
    chosen = v;
    return v;
  }
  if (synth) {
    pickVoice();
    synth.addEventListener && synth.addEventListener("voiceschanged", pickVoice);
  }

  function speak(text, opts) {
    opts = opts || {};
    if (!synth || !text) { note("speechSynthesis 없음"); return Promise.resolve(false); }
    var st = settings();
    var volume = st.ttsVolume == null ? 1 : st.ttsVolume;
    if (volume <= 0) return Promise.resolve(false);

    return new Promise(function (resolve) {
      var tries = 0, done = false;
      function finish(ok) { if (!done) { done = true; resolve(ok); } }

      function attempt() {
        tries++;
        synth.cancel();
        var v = pickVoice();
        var u = new SpeechSynthesisUtterance(text);
        keep = u;
        if (v) u.voice = v;
        u.lang = v ? v.lang : "zh-CN";
        u.rate = opts.rate || st.ttsRate || 0.85;
        u.volume = volume;
        u.pitch = 1;
        var started = false, ended = false;
        u.onstart = function () { started = true; note("start: " + text + " / " + (v ? v.name : "기본")); };
        u.onend = function () { ended = true; finish(true); };
        u.onerror = function (e) {
          ended = true;
          if (e.error === "canceled" || e.error === "interrupted") return; // 우리가 끊은 경우
          note("error: " + e.error);
          finish(false);
        };
        // 짧게 쉬었다가 말해야 Chrome에서 첫소리가 덜 잘림
        setTimeout(function () { synth.speak(u); }, 60);
        // 감시: 2.5초 안에 시작하지 않으면 이 목소리를 건너뛰고 다음 목소리로
        setTimeout(function () {
          if (started || ended || done) return;
          if (v) bad[v.name] = true;
          note("watchdog: " + (v ? v.name : "기본") + " 시작 안 됨 → 다른 목소리로");
          if (tries < 3) attempt(); else { synth.cancel(); finish(false); }
        }, 2500);
      }
      attempt();
      setTimeout(function () { finish(false); }, 12000);
    });
  }

  // 첫 터치 때 음성 엔진 깨우기 (iPhone·Chrome은 사용자 터치 뒤에만 소리가 남)
  function unlock() {
    if (!synth) return;
    try { var u = new SpeechSynthesisUtterance(" "); u.volume = 0; keep = u; synth.speak(u); setTimeout(function () { synth.cancel(); }, 300); } catch (e) {}
    pickVoice();
  }

  window.JTTS = {
    unlock: unlock,
    speak: speak,
    available: function () { return !!synth; },
    voices: function () { return list().map(function (v) { return { name: v.name, local: v.localService, bad: !!bad[v.name] }; }); },
    voiceName: function () { var v = chosen || pickVoice(); return v ? v.name : null; },
    refresh: function () { chosen = null; return pickVoice(); }
  };
})();
