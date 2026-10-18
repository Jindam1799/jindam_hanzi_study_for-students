/*
 * 중국어 음성 (Tingting 우선)
 * 순서: Tingting → 그 밖의 zh-CN 기본 음성(맥 캐릭터 음성 제외) → Google 普通话 → 아무 중국어 음성
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
  var chosen = null;

  function pickVoice() {
    if (!synth) return null;
    var voices = synth.getVoices();
    if (!voices.length) return null;
    var zh = voices.filter(function (v) { return /^zh[-_](CN|Hans)/i.test(v.lang) || /^cmn/i.test(v.lang); });
    var anyZh = voices.filter(function (v) { return /^zh/i.test(v.lang); });
    var v =
      zh.find(function (v) { return /ting-?ting/i.test(v.name); }) ||
      anyZh.find(function (v) { return /ting-?ting/i.test(v.name); }) ||
      zh.find(function (v) { return !CHARACTER_VOICES.test(v.name) && v.localService; }) ||
      zh.find(function (v) { return /Google/i.test(v.name); }) ||
      zh.find(function (v) { return !CHARACTER_VOICES.test(v.name); }) ||
      anyZh.find(function (v) { return !/HK|TW|yue/i.test(v.lang); }) ||
      anyZh[0] || null;
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
    return new Promise(function (resolve) {
      synth.cancel();
      var u = new SpeechSynthesisUtterance(text);
      var v = chosen || pickVoice();
      if (v) u.voice = v;
      u.lang = v ? v.lang : "zh-CN";
      u.rate = opts.rate || 0.85;
      u.pitch = 1;
      var started = false, finished = false;
      u.onstart = function () { started = true; note("start: " + text); };
      u.onend = function () { finished = true; resolve(true); };
      u.onerror = function (e) { finished = true; note("error: " + (e.error || e)); resolve(false); };
      // 짧게 쉬었다가 말해야 Chrome에서 첫소리가 덜 잘림
      setTimeout(function () { synth.speak(u); }, 60);
      // 감시: 1.5초가 지나도 시작 신호가 없고, 브라우저도 '말하는 중'이 아니면 한 번만 다시 시도
      setTimeout(function () {
        if (started || finished || synth.speaking) return;
        note("watchdog: retry");
        synth.cancel();
        synth.speak(u);
      }, 1500);
      setTimeout(function () { if (!finished) resolve(started); }, 8000);
    });
  }

  window.JTTS = {
    speak: speak,
    available: function () { return !!synth; },
    voiceName: function () { var v = chosen || pickVoice(); return v ? v.name : null; }
  };
})();
