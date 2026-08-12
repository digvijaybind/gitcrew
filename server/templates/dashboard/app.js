// gitcrew dashboard demo — live simulated metrics, fully interactive.
(function () {
  "use strict";
  document.addEventListener("DOMContentLoaded", function () {
    var chart = document.getElementById("chart");
    var rows = document.getElementById("rows");
    var sActive = document.getElementById("s-active");
    var sTotal = document.getElementById("s-total");
    var sAvg = document.getElementById("s-avg");
    var sStatus = document.getElementById("s-status");
    var rangeBtn = document.getElementById("range-btn");
    var refreshBtn = document.getElementById("refresh-btn");

    var events = ["view", "click", "signup", "render", "fetch", "commit", "deploy"];
    var sources = ["web", "api", "crew", "worker", "cli"];
    var bars = [];
    var total = 0;
    var history = [];

    function rand(n) { return Math.floor(Math.random() * n); }

    function initBars() {
      for (var i = 0; i < 24; i++) bars.push(30 + rand(170));
    }
    function drawChart() {
      chart.innerHTML = "";
      bars.forEach(function (h) {
        var b = document.createElement("div");
        b.className = "bar";
        b.style.height = h + "px";
        chart.appendChild(b);
      });
    }

    function pushEvent() {
      total += 1;
      var ev = events[rand(events.length)];
      var src = sources[rand(sources.length)];
      var val = ev === "click" ? 1 + rand(40) : ev === "view" ? 5 + rand(120) : 1 + rand(20);
      var now = new Date();
      var ts = now.toISOString().slice(11, 19);
      var tr = document.createElement("tr");
      tr.innerHTML =
        "<td><span class='tag'>" + ev + "</span></td>" +
        "<td class='mono'>" + src + "</td>" +
        "<td class='mono'>+" + val + "</td>" +
        "<td class='mono'>" + ts + "</td>";
      rows.prepend(tr);
      while (rows.children.length > 8) rows.removeChild(rows.lastChild);

      bars.shift();
      bars.push(30 + rand(170));
      drawChart();
      history.push(val);
      if (history.length > 24) history.shift();
      var sum = history.reduce(function (a, b) { return a + b; }, 0);
      sTotal.textContent = total;
      sActive.textContent = 3 + rand(28);
      sAvg.textContent = (12 + rand(88)) + "ms";
    }

    function step() {
      pushEvent();
      setTimeout(step, 1500 + rand(2500));
    }

    initBars();
    drawChart();
    sTotal.textContent = "0";
    sActive.textContent = "—";
    sAvg.textContent = "—";
    sStatus.textContent = "building";
    setTimeout(step, 800);

    refreshBtn.addEventListener("click", pushEvent);
    rangeBtn.addEventListener("click", function () {
      var opts = ["Last 7 days", "Last 24 hours", "Live"];
      var cur = opts.indexOf(rangeBtn.textContent.replace(" ▾", ""));
      rangeBtn.textContent = opts[(cur + 1) % opts.length] + " ▾";
    });
  });
})();
