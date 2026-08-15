(function() {
  'use strict';

  document.addEventListener('DOMContentLoaded', function() {

    // --- Mobile hamburger menu ---
    var toggle = document.getElementById('navToggle');
    var navLinks = document.getElementById('navLinks');

    if (toggle && navLinks) {
      toggle.addEventListener('click', function() {
        var isOpen = navLinks.classList.toggle('open');
        toggle.classList.toggle('active');
        toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });

      // Close menu when a link is clicked
      navLinks.querySelectorAll('a').forEach(function(link) {
        link.addEventListener('click', function() {
          navLinks.classList.remove('open');
          toggle.classList.remove('active');
          toggle.setAttribute('aria-expanded', 'false');
        });
      });
    }

    // --- Smooth scroll for anchor links ---
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
      anchor.addEventListener('click', function(e) {
        var targetId = this.getAttribute('href');
        if (targetId === '#') return;
        var target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          var navHeight = 64;
          var top = target.getBoundingClientRect().top + window.pageYOffset - navHeight;
          window.scrollTo({ top: top, behavior: 'smooth' });
        }
      });
    });

    // --- Scroll reveal observer ---
    var revealElements = document.querySelectorAll('.reveal');
    if (revealElements.length > 0) {
      var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15 });

      revealElements.forEach(function(el) { observer.observe(el); });
    }

    // --- Savings calculator demo widget ---
    var calcBtn = document.getElementById('demoCalc');
    var demoResult = document.getElementById('demoResult');

    if (calcBtn) {
      calcBtn.addEventListener('click', function() {
        var amount = parseFloat(document.getElementById('demoAmount').value) || 0;
        var months = parseInt(document.getElementById('demoMonths').value) || 0;
        var current = parseFloat(document.getElementById('demoCurrent').value) || 0;

        if (months <= 0) return;

        var target = amount * months;
        var remaining = Math.max(0, target - current);
        var perMonth = remaining / months;

        document.getElementById('resultTarget').textContent = '$' + formatNumber(target);
        document.getElementById('resultMonthly').textContent = '$' + formatNumber(Math.round(perMonth * 100) / 100);

        var percent = Math.min(100, Math.max(0, (current / target) * 100));
        document.getElementById('progressPercent').textContent = percent.toFixed(1) + '%';
        document.getElementById('progressFill').style.width = percent + '%';

        var note = document.getElementById('resultNote');
        if (current >= target) {
          note.textContent = 'Great news! You\'ve already reached your goal!';
        } else if (current > 0) {
          note.textContent = 'At this rate, you\'re on track to reach your goal in ' + months + ' months.';
        } else {
          note.textContent = 'Start saving today and watch your progress grow.';
        }

        demoResult.style.display = 'block';
      });
    }

    // --- CTA form ---
    var ctaForm = document.getElementById('ctaForm');
    var ctaFeedback = document.getElementById('ctaFeedback');
    var ctaBtn = document.getElementById('ctaBtn');

    if (ctaForm) {
      ctaForm.addEventListener('submit', function(e) {
        e.preventDefault();
        var emailInput = document.getElementById('ctaEmail');
        var email = emailInput.value.trim();

        // Basic email validation
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          ctaFeedback.textContent = 'Please enter a valid email address.';
          ctaFeedback.className = 'cta-feedback error';
          ctaFeedback.style.display = 'block';
          return;
        }

        // Simulate submission
        ctaBtn.textContent = 'Sending...';
        ctaBtn.disabled = true;

        setTimeout(function() {
          ctaFeedback.textContent = 'You\'re in! Check your inbox for next steps.';
          ctaFeedback.className = 'cta-feedback success';
          ctaFeedback.style.display = 'block';
          ctaBtn.textContent = 'Get Started Free';
          ctaBtn.disabled = false;
          emailInput.value = '';
        }, 1200);
      });
    }

    // --- Format number with commas ---
    function formatNumber(num) {
      return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

  });
})();
