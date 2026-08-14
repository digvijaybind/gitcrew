(function () {
  "use strict";

  /* ── Constants ── */
  const STORAGE_KEY = "studybuddy_cards";
  const NEW_INTERVAL = 1; // days for brand-new cards
  const DEFAULT_EASE = 2.5;

  /* ── DOM refs ── */
  const dueCountEl = document.getElementById("due-count");
  const totalCountEl = document.getElementById("total-count");
  const emptyState = document.getElementById("empty-state");
  const reviewZone = document.getElementById("review-zone");
  const reviewCounter = document.getElementById("review-counter");
  const cardContainer = document.getElementById("card-container");
  const cardInner = document.getElementById("card-inner");
  const cardFrontText = document.getElementById("card-front-text");
  const cardBackText = document.getElementById("card-back-text");
  const flipHint = cardContainer.querySelector(".flip-hint");
  const ratingPanel = document.getElementById("rating-panel");
  const ratingButtons = document.querySelectorAll(".btn-rating");
  const completeState = document.getElementById("complete-state");
  const reviewLabel = document.querySelector(".review-label");

  const toggleFormBtn = document.getElementById("toggle-form-btn");
  const addForm = document.getElementById("add-form");
  const frontInput = document.getElementById("card-front-input");
  const backInput = document.getElementById("card-back-input");
  const cancelFormBtn = document.getElementById("cancel-form-btn");
  const formFeedback = document.getElementById("form-feedback");
  const addFirstBtn = document.getElementById("add-first-btn");
  const addCardBtn = document.getElementById("add-card-btn");

  /* ── State ── */
  let allCards = [];
  let dueQueue = [];
  let currentIndex = 0;
  let cardFlipped = false;

  /* ── LocalStorage ── */
  function loadCards() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveCards() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allCards));
  }

  /* ── SM-2 Engine ── */
  function calculateNextInterval(card, quality) {
    const { easeFactor, interval, repetitions } = card;
    let newEase = easeFactor;
    let newInterval = interval;
    let newRepetitions = repetitions;

    if (quality === 0) {
      // Again: reset
      newRepetitions = 0;
      newInterval = NEW_INTERVAL;
    } else {
      // Adjust ease factor: SM-2 style
      // newEase = ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
      newEase = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
      if (newEase < 1.3) newEase = 1.3;

      newRepetitions = repetitions + 1;

      if (newRepetitions === 1) {
        newInterval = NEW_INTERVAL;
      } else if (newRepetitions === 2) {
        newInterval = Math.max(1, Math.round(interval * 1.2));
      } else {
        newInterval = Math.max(1, Math.round(interval * easeFactor));
      }
    }

    return {
      easeFactor: parseFloat(newEase.toFixed(2)),
      interval: newInterval,
      repetitions: newRepetitions,
    };
  }

  function getToday() {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }

  function addDays(dateStr, days) {
    const d = new Date(dateStr + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
  }

  /* ── Card CRUD ── */
  function createCard(front, back) {
    return {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      front: front.trim(),
      back: back.trim(),
      dueDate: getToday(),
      interval: 0,
      easeFactor: DEFAULT_EASE,
      repetitions: 0,
      createdAt: new Date().toISOString(),
    };
  }

  function addCardToFrontend(card) {
    allCards.push(card);
    saveCards();
    refreshDueQueue();
    render();
  }

  function updateCardMetadata(cardId, updates) {
    const card = allCards.find((c) => c.id === cardId);
    if (!card) return;
    Object.assign(card, updates);
    saveCards();
  }

  /* ── Due queue ── */
  function refreshDueQueue() {
    const today = getToday();
    dueQueue = allCards
      .filter((c) => c.dueDate <= today)
      .sort((a, b) => {
        // New cards (interval 0) first, then by due date
        if (a.interval === 0 && b.interval > 0) return -1;
        if (b.interval === 0 && a.interval > 0) return 1;
        return a.dueDate.localeCompare(b.dueDate);
      });
  }

  /* ── UI Render ── */
  function updateStatusBar() {
    dueCountEl.textContent = `${dueQueue.length} card${dueQueue.length !== 1 ? "s" : ""} due`;
    totalCountEl.textContent = `${allCards.length} card${allCards.length !== 1 ? "s" : ""} total`;
  }

  function showReviewZone() {
    emptyState.hidden = true;
    reviewZone.hidden = false;
    completeState.hidden = true;
  }

  function showEmptyState() {
    reviewZone.hidden = true;
    emptyState.hidden = false;
  }

  function showCompleteState() {
    reviewZone.hidden = false;
    emptyState.hidden = true;
    completeState.hidden = false;
  }

  function renderCard() {
    if (currentIndex >= dueQueue.length) {
      showCompleteState();
      return;
    }

    const card = dueQueue[currentIndex];
    const total = dueQueue.length;

    reviewLabel.textContent = "Reviewing";
    reviewCounter.textContent = `${currentIndex + 1} / ${total}`;

    cardFrontText.textContent = card.front;
    cardBackText.textContent = card.back;

    // Reset flip state
    cardFlipped = false;
    cardInner.classList.remove("flipped");
    flipHint.style.display = "";
    ratingPanel.hidden = true;
  }

  function render() {
    updateStatusBar();

    if (dueQueue.length === 0) {
      showEmptyState();
      return;
    }

    showReviewZone();
    renderCard();
  }

  /* ── Card interactions ── */
  function flipCard() {
    if (cardFlipped) return;
    cardFlipped = true;
    cardInner.classList.add("flipped");
    flipHint.style.display = "none";
    ratingPanel.hidden = false;
  }

  function rateCard(quality) {
    const card = dueQueue[currentIndex];
    const result = calculateNextInterval(card, quality);

    // Calculate new due date
    const newDueDate = addDays(card.dueDate, result.interval);

    updateCardMetadata(card.id, {
      easeFactor: result.easeFactor,
      interval: result.interval,
      repetitions: result.repetitions,
      dueDate: newDueDate,
    });

    // Advance to next card
    currentIndex++;
    refreshDueQueue();
    renderCard();
  }

  /* ── Add card form ── */
  function openForm() {
    addForm.hidden = false;
    toggleFormBtn.style.display = "none";
    frontInput.focus();
  }

  function closeForm() {
    addForm.hidden = true;
    toggleFormBtn.style.display = "";
    frontInput.value = "";
    backInput.value = "";
    formFeedback.hidden = true;
  }

  function submitForm(e) {
    e.preventDefault();

    const front = frontInput.value.trim();
    const back = backInput.value.trim();

    if (!front || !back) {
      formFeedback.textContent = "Both fields are required.";
      formFeedback.style.color = "var(--danger)";
      formFeedback.style.background = "rgba(255, 95, 110, 0.08)";
      formFeedback.hidden = false;
      return;
    }

    const card = createCard(front, back);
    addCardToFrontend(card);

    formFeedback.textContent = "Card saved — ready for review!";
    formFeedback.style.color = "var(--accent2)";
    formFeedback.style.background = "rgba(67, 217, 163, 0.08)";
    formFeedback.hidden = false;

    closeForm();
  }

  /* ── Event listeners ── */
  cardContainer.addEventListener("click", flipCard);
  cardContainer.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      flipCard();
    }
  });

  ratingButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const quality = parseInt(btn.dataset.quality, 10);
      rateCard(quality);
    });
  });

  toggleFormBtn.addEventListener("click", openForm);
  addFirstBtn.addEventListener("click", openForm);
  addCardBtn.addEventListener("click", openForm);
  cancelFormBtn.addEventListener("click", closeForm);
  addForm.addEventListener("submit", submitForm);

  /* ── Keyboard shortcuts (only when form not focused) ── */
  document.addEventListener("keydown", (e) => {
    // Don't trigger shortcuts when typing in inputs
    if (
      document.activeElement === frontInput ||
      document.activeElement === backInput
    )
      return;

    if (cardFlipped && dueQueue.length > 0 && currentIndex < dueQueue.length) {
      switch (e.key) {
        case "1":
        case "a":
          rateCard(0);
          break;
        case "2":
        case "h":
          rateCard(1);
          break;
        case "3":
        case "g":
          rateCard(2);
          break;
        case "4":
        case "e":
          rateCard(3);
          break;
      }
    }
  });

  /* ── Init ── */
  allCards = loadCards();
  refreshDueQueue();
  render();
})();
