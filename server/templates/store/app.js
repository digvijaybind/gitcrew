// gitcrew storefront — working cart + checkout, no backend needed.
(function () {
  "use strict";
  document.addEventListener("DOMContentLoaded", function () {
    var cartCount = document.getElementById("cart-count");
    var grid = document.getElementById("grid");
    var form = document.getElementById("form");
    var formMsg = document.getElementById("form-msg");
    var count = 0;

    function updateCart(n) {
      count += n;
      cartCount.textContent = count;
    }

    grid.addEventListener("click", function (e) {
      var btn = e.target.closest(".add");
      if (!btn) return;
      updateCart(1);
      var original = btn.textContent;
      btn.textContent = "Added ✓";
      btn.classList.add("btn-primary");
      setTimeout(function () {
        btn.textContent = original;
        btn.classList.remove("btn-primary");
      }, 900);
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = form.email.value.trim();
      var name = form.name.value.trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        formMsg.textContent = "That email doesn't look right.";
        formMsg.classList.add("error");
        return;
      }
      formMsg.classList.remove("error");
      formMsg.textContent = "Order placed ✓ " + name + ", check your inbox for " + email;
      form.reset();
      setTimeout(function () { formMsg.textContent = ""; }, 6000);
    });

    document.querySelectorAll("[data-scroll]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var t = document.querySelector(btn.getAttribute("data-scroll"));
        if (t) t.scrollIntoView({ behavior: "smooth" });
      });
    });
  });
})();
