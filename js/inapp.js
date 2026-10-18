/*
 * 항상 Chrome에서 열기
 * - 카카오톡·네이버·인스타그램 등 앱 안 브라우저 → Chrome으로 바로 넘김
 * - Android 다른 브라우저(삼성 인터넷 등) / iPhone Safari → "Chrome으로 열기" 안내 띠
 * - ?stay=1 을 붙이면 넘기지 않음 (테스트용)
 * 이 파일은 <head>에서 가장 먼저 실행됩니다.
 */
(function () {
  var ua = navigator.userAgent || "";
  var url = location.href;
  var params = new URLSearchParams(location.search);
  if (params.get("stay") === "1") return;

  var isAndroid = /Android/i.test(ua);
  var isIOS = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  var isKakao = /KAKAOTALK/i.test(ua);
  var isInApp = isKakao || /NAVER|Instagram|FBAN|FBAV|Line\/|DaumApps|everytimeApp|BAND\/|; wv\)/i.test(ua);
  var isChrome = /CriOS/i.test(ua) ||
    (/Chrome\//.test(ua) && !/Edg\/|OPR\/|SamsungBrowser|Whale|YaBrowser|; wv\)/i.test(ua) && !isInApp);

  window.JINDAM_BROWSER = { isAndroid: isAndroid, isIOS: isIOS, isInApp: isInApp, isChrome: isChrome };
  if (isChrome) return;

  var noScheme = url.replace(/^https?:\/\//, "");
  var androidIntent = "intent://" + noScheme + "#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=" + encodeURIComponent(url) + ";end";
  var iosChrome = "googlechromes://" + noScheme;

  // 1) 앱 안 브라우저는 바로 넘기기
  if (isInApp) {
    if (isAndroid) {
      location.href = androidIntent;
    } else if (isIOS) {
      location.href = iosChrome; // Chrome이 없으면 아무 일도 없고 아래 안내가 보임
      if (isKakao) {
        setTimeout(function () {
          if (!document.hidden) location.href = "kakaotalk://web/openExternal?url=" + encodeURIComponent(url);
        }, 1200);
      }
    } else if (isKakao) {
      location.href = "kakaotalk://web/openExternal?url=" + encodeURIComponent(url);
    }
  }

  // 2) 화면 위쪽에 안내 띠 (넘어가지 않았을 때 대비)
  document.addEventListener("DOMContentLoaded", function () {
    var bar = document.createElement("div");
    bar.className = "chrome-bar";
    var target = isAndroid ? androidIntent : (isIOS ? iosChrome : null);
    var msg = isInApp
      ? "이 게임은 <b>Chrome</b>에서 열어야 소리와 쓰기가 잘 돼요."
      : "이 게임은 <b>Chrome</b>에서 가장 잘 작동해요.";
    bar.innerHTML = '<span>' + msg + '</span>' +
      (target ? '<a class="chrome-bar__btn" href="' + target + '">Chrome으로 열기</a>' : '') +
      '<button class="chrome-bar__copy" type="button">주소 복사</button>' +
      (isInApp ? '' : '<button class="chrome-bar__close" type="button" aria-label="닫기">×</button>');
    document.body.prepend(bar);
    bar.querySelector(".chrome-bar__copy").addEventListener("click", function () {
      var done = function () { bar.querySelector(".chrome-bar__copy").textContent = "복사됨 ✓"; };
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, function () { prompt("주소를 복사하세요", url); });
      else prompt("주소를 복사하세요", url);
    });
    var close = bar.querySelector(".chrome-bar__close");
    if (close) close.addEventListener("click", function () { bar.remove(); });
  });
})();
