// gitcrew landing demo widget — a real, working product demo.
(function () {
  "use strict";
  document.addEventListener("DOMContentLoaded", function () {
    var demoBtn = document.getElementById("demo-btn");
    var demoReset = document.getElementById("demo-reset");
    var output = document.querySelector(".demo-output");
    var log = document.getElementById("demo-log");
    if (!demoBtn || !output || !log) return;

    var words = ["shipped", "built", "launched", "polished", "committed", "deployed"];
    var ticks = 0;

    function tick() {
      ticks += 1;
      var word = words[Math.floor(Math.random() * words.length)];
      log.textContent = "log › " + word + " in " + (ticks * 0.4).toFixed(1) + "s · " + ticks + " iteration" + (ticks === 1 ? "" : "s");
      output.textContent = word;
      if (ticks < 8) {
        setTimeout(tick, 240 + Math.random() * 220);
      } else {
        log.textContent = "log › done. " + ticks + " iterations in one sitting.";
      }
    }

    function reset() {
      ticks = 0;
      output.textContent = "—";
      log.textContent = "Ready.";
    }

    demoBtn.addEventListener("click", function () {
      if (ticks > 0 && ticks < 8) return;
      output.textContent = "…";
      setTimeout(tick, 300);
    });
    demoReset.addEventListener("click", reset);
    reset();

    document.querySelectorAll("[data-cta]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        btn.textContent = "Done — check the repo ✦";
      });
    });
    document.querySelectorAll("[data-scroll]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var t = document.querySelector(btn.getAttribute("data-scroll"));
        if (t) t.scrollIntoView({ behavior: "smooth" });
      });
    });
  });
})();
