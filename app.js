document.addEventListener('DOMContentLoaded', () => {

  // --- State ---
  let selectedSeason = null;
  let selectedLength = null;
  let checkedItems = new Set();

  // --- DOM refs ---
  const form = document.getElementById('packing-form');
  const destSelect = document.getElementById('destination');
  const seasonHidden = document.getElementById('season');
  const lengthHidden = document.getElementById('trip-length');
  const generateBtn = document.getElementById('generate-btn');
  const resultsSection = document.getElementById('results');
  const resultsTitle = document.getElementById('results-title');
  const itemsContainer = document.getElementById('items-container');
  const printBtn = document.getElementById('print-btn');
  const startOverBtn = document.getElementById('start-over-btn');
  const seasonPills = document.querySelectorAll('[data-season]');
  const lengthPills = document.querySelectorAll('[data-length]');

  // --- Season pills ---
  seasonPills.forEach(pill => {
    pill.addEventListener('click', () => {
      seasonPills.forEach(p => p.setAttribute('aria-checked', 'false'));
      pill.setAttribute('aria-checked', 'true');
      selectedSeason = pill.dataset.season;
      seasonHidden.value = selectedSeason;
      checkReady();
    });
  });

  // --- Length pills ---
  lengthPills.forEach(pill => {
    pill.addEventListener('click', () => {
      lengthPills.forEach(p => p.setAttribute('aria-checked', 'false'));
      pill.setAttribute('aria-checked', 'true');
      selectedLength = pill.dataset.length;
      lengthHidden.value = selectedLength;
      checkReady();
    });
  });

  // --- Check if form is ready ---
  function checkReady() {
    generateBtn.disabled = !(destSelect.value && selectedSeason && selectedLength);
  }
  destSelect.addEventListener('change', checkReady);

  // --- Generate ---
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (generateBtn.disabled) return;

    const destination = destSelect.value;
    const items = generateList(destination, selectedSeason, selectedLength);
    renderResults(destination, selectedSeason, selectedLength, items);
  });

  // --- Print ---
  printBtn.addEventListener('click', () => {
    window.print();
  });

  // --- Start over ---
  startOverBtn.addEventListener('click', () => {
    resultsSection.style.display = 'none';
    checkedItems.clear();
    selectedSeason = null;
    selectedLength = null;
    seasonHidden.value = '';
    lengthHidden.value = '';
    destSelect.value = '';
    seasonPills.forEach(p => p.setAttribute('aria-checked', 'false'));
    lengthPills.forEach(p => p.setAttribute('aria-checked', 'false'));
    generateBtn.disabled = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // --- Data ---
  const destinations = {
    bangkok: { name: 'Bangkok', country: 'Thailand', flag: '🇹🇭' },
    tokyo: { name: 'Tokyo', country: 'Japan', flag: '🇯🇵' },
    paris: { name: 'Paris', country: 'France', flag: '🇫🇷' },
    newyork: { name: 'New York', country: 'USA', flag: '🇺🇸' },
    london: { name: 'London', country: 'UK', flag: '🇬🇧' },
    sydney: { name: 'Sydney', country: 'Australia', flag: '🇦🇺' },
    cairo: { name: 'Cairo', country: 'Egypt', flag: '🇪🇬' },
    mumbai: { name: 'Mumbai', country: 'India', flag: '🇮🇳' },
    dubai: { name: 'Dubai', country: 'UAE', flag: '🇦🇪' },
    capetown: { name: 'Cape Town', country: 'South Africa', flag: '🇿🇦' },
    reykjavik: { name: 'Reykjavík', country: 'Iceland', flag: '🇮🇸' },
    cancun: { name: 'Cancún', country: 'Mexico', flag: '🇲🇽' }
  };

  const itemSets = {
    // --- Bangkok ---
    bangkok: {
      winter: {
        clothing: ['Lightweight t-shirts (4)', 'Light long-sleeve shirt', 'Light jacket or cardigan', 'Shorts', 'Comfortable walking shoes', 'Sandals', 'Light sweater for evenings', 'Underwear & socks'],
        toiletries: ['Sunscreen (SPF 50+)', 'Insect repellent', 'Lip balm with SPF', 'Hand sanitizer', 'Aloe vera gel', 'Tweezers'],
        electronics: ['Phone + charger', 'Power bank', 'Universal adapter (Type A/C/G)', 'Waterproof phone pouch'],
        documents: ['Passport', 'Hotel confirmation', 'Travel insurance card', 'Flight itinerary'],
        misc: ['Reusable water bottle', 'Small umbrella or poncho', 'Tote bag for day trips', 'Hand fan']
      },
      spring: {
        clothing: ['Lightweight t-shirts (5)', 'Short-sleeve shirts', 'Light shorts', 'Light trousers', 'Comfortable walking shoes', 'Sandals', 'Light jacket for malls/AC', 'Underwear & socks'],
        toiletries: ['Sunscreen (SPF 50+)', 'Insect repellent', 'Lip balm with SPF', 'Hand sanitizer', 'Moisturizer', 'Tweezers'],
        electronics: ['Phone + charger', 'Power bank', 'Universal adapter (Type A/C/G)', 'Camera'],
        documents: ['Passport', 'Hotel confirmation', 'Travel insurance card', 'Flight itinerary'],
        misc: ['Reusable water bottle', 'Small umbrella', 'Tote bag', 'Hand fan']
      },
      summer: {
        clothing: ['Lightweight t-shirts (6)', 'Tank tops', 'Shorts', 'Lightweight trousers', 'Breathable walking shoes', 'Sandals', 'Swimwear', 'Hat/cap', 'Underwear & socks'],
        toiletries: ['Sunscreen (SPF 50+)', 'Insect repellent', 'After-sun aloe gel', 'Lip balm with SPF', 'Hand sanitizer', 'Electrolyte packets'],
        electronics: ['Phone + charger', 'Power bank', 'Universal adapter (Type A/C/G)', 'Waterproof phone pouch'],
        documents: ['Passport', 'Hotel confirmation', 'Travel insurance card', 'Flight itinerary'],
        misc: ['Reusable water bottle', 'Small umbrella/poncho', 'Tote bag', 'Hand fan', 'Rechargeable fan']
      },
      fall: {
        clothing: ['Lightweight t-shirts (4)', 'Light long-sleeve shirt', 'Light jacket or cardigan', 'Shorts', 'Comfortable walking shoes', 'Sandals', 'Underwear & socks'],
        toiletries: ['Sunscreen (SPF 50+)', 'Insect repellent', 'Lip balm with SPF', 'Hand sanitizer', 'Aloe vera gel', 'Tweezers'],
        electronics: ['Phone + charger', 'Power bank', 'Universal adapter (Type A/C/G)', 'Waterproof phone pouch'],
        documents: ['Passport', 'Hotel confirmation', 'Travel insurance card', 'Flight itinerary'],
        misc: ['Reusable water bottle', 'Small umbrella or poncho', 'Tote bag for day trips', 'Hand fan']
      }
    },

    // --- Tokyo ---
    tokyo: {
      winter: {
        clothing: ['Warm t-shirts (3)', 'Thermal base layer', 'Fleece or mid-layer', 'Warm coat', 'Jeans or warm trousers', 'Comfortable walking shoes', 'Warm socks', 'Scarf & gloves', 'Underwear'],
        toiletries: ['Moisturizer', 'Lip balm', 'Hand cream', 'Hand sanitizer', 'Lipstick/balm', 'Tweezers'],
        electronics: ['Phone + charger', 'Power bank', 'Universal adapter (Type A)', 'Camera', 'Portable heater'],
        documents: ['Passport', 'Hotel confirmation', 'JR Pass (if applicable)', 'Travel insurance card'],
        misc: ['Compact umbrella', 'Reusable shopping bag', 'Wrist wallet', 'Tote bag']
      },
      spring: {
        clothing: ['Light jackets (2)', 'Long-sleeve shirts', 'T-shirts (3)', 'Jeans', 'Comfortable walking shoes', 'Light scarf', 'Underwear'],
        toiletries: ['Moisturizer', 'Lip balm', 'Sunscreen (SPF 30+)', 'Hand sanitizer', 'Tweezers'],
        electronics: ['Phone + charger', 'Power bank', 'Universal adapter (Type A)', 'Camera'],
        documents: ['Passport', 'Hotel confirmation', 'JR Pass (if applicable)', 'Travel insurance card'],
        misc: ['Compact umbrella', 'Reusable shopping bag', 'Daypack', 'Hand warmers']
      },
      summer: {
        clothing: ['T-shirts (6)', 'Light short-sleeve shirts', 'Shorts', 'Light trousers', 'Breathable walking shoes', 'Sandals', 'Light jacket for AC', 'Underwear & socks'],
        toiletries: ['Sunscreen (SPF 50+)', 'Lip balm', 'Hand sanitizer', 'Moisturizer', 'Small towel', 'Tweezers'],
        electronics: ['Phone + charger', 'Power bank', 'Universal adapter (Type A)', 'Camera'],
        documents: ['Passport', 'Hotel confirmation', 'JR Pass (if applicable)', 'Travel insurance card'],
        misc: ['Compact umbrella', 'Reusable water bottle', 'Daypack', 'Hand fan']
      },
      fall: {
        clothing: ['Light jackets (2)', 'Long-sleeve shirts', 'T-shirts (3)', 'Jeans', 'Comfortable walking shoes', 'Light scarf', 'Underwear'],
        toiletries: ['Moisturizer', 'Lip balm', 'Sunscreen (SPF 30+)', 'Hand sanitizer', 'Tweezers'],
        electronics: ['Phone + charger', 'Power bank', 'Universal adapter (Type A)', 'Camera'],
        documents: ['Passport', 'Hotel confirmation', 'JR Pass (if applicable)', 'Travel insurance card'],
        misc: ['Compact umbrella', 'Reusable shopping bag', 'Daypack', 'Hand warmers']
      }
    },

    // --- Paris ---
    paris: {
      winter: {
        clothing: ['T-shirts (3)', 'Turtleneck or warm top', 'Wool sweater', 'Warm coat', 'Jeans', 'Comfortable walking shoes', 'Warm socks', 'Scarf & gloves', 'Underwear'],
        toiletries: ['Moisturizer', 'Lip balm', 'Hand cream', 'Hand sanitizer', 'Lipstick/balm'],
        electronics: ['Phone + charger', 'Power bank', 'Universal adapter (Type C/E)', 'Camera'],
        documents: ['Passport', 'Hotel confirmation', 'Flight itinerary', 'Travel insurance card'],
        misc: ['Compact umbrella', 'Reusable shopping bag', 'Tote bag', 'Hand warmers']
      },
      spring: {
        clothing: ['Light jacket', 'Long-sleeve shirts', 'T-shirts (3)', 'Jeans or trousers', 'Comfortable walking shoes', 'Light scarf', 'Underwear'],
        toiletries: ['Moisturizer', 'Lip balm', 'Sunscreen (SPF 30+)', 'Hand sanitizer', 'Tweezers'],
        electronics: ['Phone + charger', 'Power bank', 'Universal adapter (Type C/E)', 'Camera'],
        documents: ['Passport', 'Hotel confirmation', 'Flight itinerary', 'Travel insurance card'],
        misc: ['Compact umbrella', 'Reusable shopping bag', 'Daypack']
      },
      summer: {
        clothing: ['T-shirts (5)', 'Light dresses or shirts', 'Light trousers or shorts', 'Comfortable walking shoes', 'Sandals', 'Light jacket for evenings', 'Underwear'],
        toiletries: ['Sunscreen (SPF 50+)', 'Lip balm', 'Hand sanitizer', 'Moisturizer', 'Tweezers'],
        electronics: ['Phone + charger', 'Power bank', 'Universal adapter (Type C/E)', 'Camera'],
        documents: ['Passport', 'Hotel confirmation', 'Flight itinerary', 'Travel insurance card'],
        misc: ['Small crossbody bag', 'Reusable shopping bag', 'Daypack']
      },
      fall: {
        clothing: ['Light jacket', 'Long-sleeve shirts', 'T-shirts (3)', 'Jeans', 'Comfortable walking shoes', 'Scarf', 'Underwear'],
        toiletries: ['Moisturizer', 'Lip balm', 'Sunscreen (SPF 30+)', 'Hand sanitizer', 'Tweezers'],
        electronics: ['Phone + charger', 'Power bank', 'Universal adapter (Type C/E)', 'Camera'],
        documents: ['Passport', 'Hotel confirmation', 'Flight itinerary', 'Travel insurance card'],
        misc: ['Compact umbrella', 'Reusable shopping bag', 'Daypack']
      }
    },

    // --- New York ---
    newyork: {
      winter: {
        clothing: ['T-shirts (3)', 'Thermal base layer', 'Fleece or sweater', 'Warm winter coat', 'Jeans', 'Comfortable walking shoes', 'Warm socks', 'Scarf, gloves & beanie', 'Underwear'],
        toiletries: ['Moisturizer', 'Lip balm', 'Hand cream', 'Hand sanitizer', 'Lipstick/balm'],
        electronics: ['Phone + charger', 'Power bank', 'Universal adapter (Type A/B)', 'Camera'],
        documents: ['Passport', 'Hotel confirmation', 'Flight itinerary', 'Travel insurance card'],
        misc: ['Compact umbrella', 'Reusable shopping bag', 'Tote bag', 'Hand warmers']
      },
      spring: {
        clothing: ['Light jacket', 'Long-sleeve shirts', 'T-shirts (3)', 'Jeans', 'Comfortable walking shoes', 'Light scarf', 'Underwear'],
        toiletries: ['Moisturizer', 'Lip balm', 'Sunscreen (SPF 30+)', 'Hand sanitizer', 'Tweezers'],
        electronics: ['Phone + charger', 'Power bank', 'Universal adapter (Type A/B)', 'Camera'],
        documents: ['Passport', 'Hotel confirmation', 'Flight itinerary', 'Travel insurance card'],
        misc: ['Compact umbrella', 'Reusable shopping bag', 'Daypack']
      },
      summer: {
        clothing: ['T-shirts (5)', 'Short-sleeve shirts', 'Shorts or light trousers', 'Comfortable walking shoes', 'Sandals', 'Light jacket for evenings', 'Underwear'],
        toiletries: ['Sunscreen (SPF 50+)', 'Lip balm', 'Deodorant', 'Hand sanitizer', 'Tweezers'],
        electronics: ['Phone + charger', 'Power bank', 'Universal adapter (Type A/B)', 'Camera'],
        documents: ['Passport', 'Hotel confirmation', 'Flight itinerary', 'Travel insurance card'],
        misc: ['Small crossbody bag', 'Reusable water bottle', 'Daypack']
      },
      fall: {
        clothing: ['Light jacket', 'Long-sleeve shirts', 'T-shirts (3)', 'Jeans', 'Comfortable walking shoes', 'Scarf', 'Underwear'],
        toiletries: ['Moisturizer', 'Lip balm', 'Sunscreen (SPF 30+)', 'Hand sanitizer', 'Tweezers'],
        electronics: ['Phone + charger', 'Power bank', 'Universal adapter (Type A/B)', 'Camera'],
        documents: ['Passport', 'Hotel confirmation', 'Flight itinerary', 'Travel insurance card'],
        misc: ['Compact umbrella', 'Reusable shopping bag', 'Daypack']
      }
    },

    // --- London ---
    london: {
      winter: {
        clothing: ['T-shirts (3)', 'Warm sweater', 'Fleece or mid-layer', 'Waterproof coat', 'Jeans', 'Waterproof walking shoes', 'Warm socks', 'Scarf, gloves & hat', 'Underwear'],
        toiletries: ['Moisturizer', 'Lip balm', 'Hand cream', 'Hand sanitizer', 'Lipstick/balm'],
        electronics: ['Phone + charger', 'Power bank', 'Universal adapter (Type G)', 'Camera'],
        documents: ['Passport', 'Hotel confirmation', 'Flight itinerary', 'Travel insurance card'],
        misc: ['Compact umbrella', 'Reusable shopping bag', 'Tote bag', 'Hand warmers']
      },
      spring: {
        clothing: ['Waterproof jacket', 'Long-sleeve shirts', 'T-shirts (3)', 'Jeans or trousers', 'Waterproof walking shoes', 'Light scarf', 'Underwear'],
        toiletries: ['Moisturizer', 'Lip balm', 'Sunscreen (SPF 30+)', 'Hand sanitizer', 'Tweezers'],
        electronics: ['Phone + charger', 'Power bank', 'Universal adapter (Type G)', 'Camera'],
        documents: ['Passport', 'Hotel confirmation', 'Flight itinerary', 'Travel insurance card'],
        misc: ['Compact umbrella', 'Reusable shopping bag', 'Daypack']
      },
      summer: {
        clothing: ['T-shirts (5)', 'Light jackets (2)', 'Light trousers or shorts', 'Comfortable walking shoes', 'Sandals', 'Light waterproof layer', 'Underwear'],
        toiletries: ['Sunscreen (SPF 50+)', 'Lip balm', 'Hand sanitizer', 'Moisturizer', 'Tweezers'],
        electronics: ['Phone + charger', 'Power bank', 'Universal adapter (Type G)', 'Camera'],
        documents: ['Passport', 'Hotel confirmation', 'Flight itinerary', 'Travel insurance card'],
        misc: ['Compact umbrella', 'Reusable shopping bag', 'Daypack']
      },
      fall: {
        clothing: ['Waterproof jacket', 'Long-sleeve shirts', 'T-shirts (3)', 'Jeans', 'Waterproof walking shoes', 'Scarf', 'Underwear'],
        toiletries: ['Moisturizer', 'Lip balm', 'Sunscreen (SPF 30+)', 'Hand sanitizer', 'Tweezers'],
        electronics: ['Phone + charger', 'Power bank', 'Universal adapter (Type G)', 'Camera'],
        documents: ['Passport', 'Hotel confirmation', 'Flight itinerary', 'Travel insurance card'],
        misc: ['Compact umbrella', 'Reusable shopping bag', 'Daypack']
      }
    },

    // --- Sydney ---
    sydney: {
      winter: {
        clothing: ['T-shirts (3)', 'Long-sleeve shirt', 'Light sweater', 'Light jacket', 'Jeans or trousers', 'Comfortable walking shoes', 'Sandals', 'Underwear & socks'],
        toiletries: ['Sunscreen (SPF 50+)', 'Lip balm with SPF', 'Hand sanitizer', 'Moisturizer', 'Tweezers'],
        electronics: ['Phone + charger', 'Power bank', 'Universal adapter (Type I)', 'Camera'],
        documents: ['Passport', 'Hotel confirmation', 'Flight itinerary', 'Travel insurance card'],
        misc: ['Reusable water bottle', 'Daypack', 'Sunglasses', 'Swimwear']
      },
      spring: {
        clothing: ['T-shirts (4)', 'Short-sleeve shirts', 'Shorts', 'Light trousers', 'Comfortable walking shoes', 'Sandals', 'Swimwear', 'Hat', 'Underwear'],
        toiletries: ['Sunscreen (SPF 50+)', 'Lip balm with SPF', 'Hand sanitizer', 'Moisturizer', 'Tweezers'],
        electronics: ['Phone + charger', 'Power bank', 'Universal adapter (Type I)', 'Camera'],
        documents: ['Passport', 'Hotel confirmation', 'Flight itinerary', 'Travel insurance card'],
        misc: ['Reusable water bottle', 'Daypack', 'Sunglasses', 'Swimwear']
      },
      summer: {
        clothing: ['T-shirts (6)', 'Tank tops', 'Shorts', 'Light trousers', 'Breathable walking shoes', 'Sandals', 'Swimwear', 'Hat/cap', 'Light jacket for evenings', 'Underwear'],
        toiletries: ['Sunscreen (SPF 50+)', 'Insect repellent', 'Lip balm with SPF', 'Aloe vera gel', 'Hand sanitizer', 'Tweezers'],
        electronics: ['Phone + charger', 'Power bank', 'Universal adapter (Type I)', 'Camera', 'GoPro/action cam'],
        documents: ['Passport', 'Hotel confirmation', 'Flight itinerary', 'Travel insurance card'],
        misc: ['Reusable water bottle', 'Daypack', 'Sunglasses', 'Swimwear', 'Beach towel']
      },
      fall: {
        clothing: ['T-shirts (3)', 'Long-sleeve shirt', 'Light sweater', 'Light jacket', 'Jeans or trousers', 'Comfortable walking shoes', 'Sandals', 'Underwear & socks'],
        toiletries: ['Sunscreen (SPF 50+)', 'Lip balm with SPF', 'Hand sanitizer', 'Moisturizer', 'Tweezers'],
        electronics: ['Phone + charger', 'Power bank', 'Universal adapter (Type I)', 'Camera'],
        documents: ['Passport', 'Hotel confirmation', 'Flight itinerary', 'Travel insurance card'],
        misc: ['Reusable water bottle', 'Daypack', 'Sunglasses', 'Swimwear']
      }
    },

    // --- Cairo ---
    cairo: {
      winter: {
        clothing: ['T-shirts (4)', 'Long-sleeve shirt', 'Light jacket', 'Light trousers', 'Comfortable walking shoes', 'Scarf', 'Underwear & socks'],
        toiletries: ['Sunscreen (SPF 50+)', 'Lip balm', 'Moisturizer', 'Hand sanitizer', 'Tweezers'],
        electronics: ['Phone + charger', 'Power bank', 'Universal adapter (Type C/E)', 'Camera'],
        documents: ['Passport', 'Hotel confirmation', 'Flight itinerary', 'Travel insurance card'],
        misc: ['Reusable water bottle', 'Daypack', 'Sunglasses', 'Buff/scarf for dust']
      },
      spring: {
        clothing: ['T-shirts (5)', 'Light trousers', 'Light jacket', 'Comfortable walking shoes', 'Hat', 'Underwear'],
        toiletries: ['Sunscreen (SPF 50+)', 'Lip balm', 'Moisturizer', 'Hand sanitizer', 'Tweezers'],
        electronics: ['Phone + charger', 'Power bank', 'Universal adapter (Type C/E)', 'Camera'],
        documents: ['Passport', 'Hotel confirmation', 'Flight itinerary', 'Travel insurance card'],
        misc: ['Reusable water bottle', 'Daypack', 'Sunglasses', 'Buff/scarf for dust']
      },
      summer: {
        clothing: ['Lightweight t-shirts (6)', 'Light trousers', 'Light jacket for mosques/AC', 'Comfortable walking shoes', 'Hat', 'Underwear'],
        toiletries: ['Sunscreen (SPF 50+)', 'Lip balm', 'Moisturizer', 'Hand sanitizer', 'Tweezers', 'Electrolyte packets'],
        electronics: ['Phone + charger', 'Power bank', 'Universal adapter (Type C/E)', 'Camera'],
        documents: ['Passport', 'Hotel confirmation', 'Flight itinerary', 'Travel insurance card'],
        misc: ['Reusable water bottle', 'Daypack', 'Sunglasses', 'Buff/scarf for dust']
      },
      fall: {
        clothing: ['T-shirts (4)', 'Long-sleeve shirt', 'Light jacket', 'Light trousers', 'Comfortable walking shoes', 'Underwear & socks'],
        toiletries: ['Sunscreen (SPF 50+)', 'Lip balm', 'Moisturizer', 'Hand sanitizer', 'Tweezers'],
        electronics: ['Phone + charger', 'Power bank', 'Universal adapter (Type C/E)', 'Camera'],
        documents: ['Passport', 'Hotel confirmation', 'Flight itinerary', 'Travel insurance card'],
        misc: ['Reusable water bottle', 'Daypack', 'Sunglasses', 'Buff/scarf for dust']
      }
    },

    // --- Mumbai ---
    mumbai: {
      winter: {
        clothing: ['T-shirts (5)', 'Light shirts', 'Light trousers', 'Comfortable walking shoes', 'Sandals', 'Light jacket for evenings', 'Underwear'],
        toiletries: ['Sunscreen (SPF 50+)', 'Insect repellent', 'Lip balm', 'Hand sanitizer', 'Oral rehydration salts', 'Tweezers'],
        electronics: ['Phone + charger', 'Power bank', 'Universal adapter (Type C/D/M)', 'Camera'],
        documents: ['Passport', 'Hotel confirmation', 'Flight itinerary', 'Travel insurance card'],
        misc: ['Reusable water bottle', 'Daypack', 'Sunglasses', 'Small towel']
      },
      spring: {
        clothing: ['T-shirts (6)', 'Light shirts', 'Light trousers or shorts', 'Comfortable walking shoes', 'Sandals', 'Underwear'],
        toiletries: ['Sunscreen (SPF 50+)', 'Insect repellent', 'Lip balm', 'Hand sanitizer', 'Oral rehydration salts', 'Tweezers'],
        electronics: ['Phone + charger', 'Power bank', 'Universal adapter (Type C/D/M)', 'Camera'],
        documents: ['Passport', 'Hotel confirmation', 'Flight itinerary', 'Travel insurance card'],
        misc: ['Reusable water bottle', 'Daypack', 'Sunglasses', 'Small towel']
      },
      summer: {
        clothing: ['T-shirts (7)', 'Light shirts', 'Light trousers or shorts', 'Breathable walking shoes', 'Sandals', 'Hat', 'Underwear'],
        toiletries: ['Sunscreen (SPF 50+)', 'Insect repellent', 'Lip balm', 'Hand sanitizer', 'Oral rehydration salts', 'Electrolyte packets', 'Tweezers'],
        electronics: ['Phone + charger', 'Power bank', 'Universal adapter (Type C/D/M)', 'Camera'],
        documents: ['Passport', 'Hotel confirmation', 'Flight itinerary', 'Travel insurance card'],
        misc: ['Reusable water bottle', 'Daypack', 'Sunglasses', 'Small towel', 'Hand fan']
      },
      fall: {
        clothing: ['T-shirts (5)', 'Light shirts', 'Light trousers', 'Comfortable walking shoes', 'Sandals', 'Underwear'],
        toiletries: ['Sunscreen (SPF 50+)', 'Insect repellent', 'Lip balm', 'Hand sanitizer', 'Oral rehydration salts', 'Tweezers'],
        electronics: ['Phone + charger', 'Power bank', 'Universal adapter (Type C/D/M)', 'Camera'],
        documents: ['Passport', 'Hotel confirmation', 'Flight itinerary', 'Travel insurance card'],
        misc: ['Reusable water bottle', 'Daypack', 'Sunglasses', 'Small towel']
      }
    },

    // --- Dubai ---
    dubai: {
      winter: {
        clothing: ['T-shirts (4)', 'Short-sleeve shirts', 'Light trousers', 'Light jacket for evenings/AC', 'Comfortable walking shoes', 'Sandals', 'Underwear'],
        toiletries: ['Sunscreen (SPF 50+)', 'Lip balm', 'Moisturizer', 'Hand sanitizer', 'Tweezers'],
        electronics: ['Phone + charger', 'Power bank', 'Universal adapter (Type G/C)', 'Camera'],
        documents: ['Passport', 'Hotel confirmation', 'Flight itinerary', 'Travel insurance card'],
        misc: ['Reusable water bottle', 'Daypack', 'Sunglasses', 'Swimwear', 'Cover-up for mosque']
      },
      spring: {
        clothing: ['T-shirts (5)', 'Short-sleeve shirts', 'Light trousers', 'Light jacket for AC', 'Comfortable walking shoes', 'Sandals', 'Hat', 'Underwear'],
        toiletries: ['Sunscreen (SPF 50+)', 'Lip balm', 'Moisturizer', 'Hand sanitizer', 'Tweezers'],
        electronics: ['Phone + charger', 'Power bank', 'Universal adapter (Type G/C)', 'Camera'],
        documents: ['Passport', 'Hotel confirmation', 'Flight itinerary', 'Travel insurance card'],
        misc: ['Reusable water bottle', 'Daypack', 'Sunglasses', 'Swimwear', 'Cover-up for mosque']
      },
      summer: {
        clothing: ['Lightweight t-shirts (7)', 'Light trousers', 'Light jacket for heavy AC', 'Comfortable walking shoes', 'Sandals', 'Hat', 'Swimwear', 'Underwear'],
        toiletries: ['Sunscreen (SPF 50+)', 'Lip balm', 'Aloe vera gel', 'Hand sanitizer', 'Tweezers', 'Electrolyte packets'],
        electronics: ['Phone + charger', 'Power bank', 'Universal adapter (Type G/C)', 'Camera'],
        documents: ['Passport', 'Hotel confirmation', 'Flight itinerary', 'Travel insurance card'],
        misc: ['Reusable water bottle', 'Daypack', 'Sunglasses', 'Swimwear', 'Cover-up for mosque', 'Rechargeable fan']
      },
      fall: {
        clothing: ['T-shirts (4)', 'Short-sleeve shirts', 'Light trousers', 'Light jacket for evenings/AC', 'Comfortable walking shoes', 'Sandals', 'Underwear'],
        toiletries: ['Sunscreen (SPF 50+)', 'Lip balm', 'Moisturizer', 'Hand sanitizer', 'Tweezers'],
        electronics: ['Phone + charger', 'Power bank', 'Universal adapter (Type G/C)', 'Camera'],
        documents: ['Passport', 'Hotel confirmation', 'Flight itinerary', 'Travel insurance card'],
        misc: ['Reusable water bottle', 'Daypack', 'Sunglasses', 'Swimwear', 'Cover-up for mosque']
      }
    },

    // --- Cape Town ---
    capetown: {
      winter: {
        clothing: ['T-shirts (3)', 'Long-sleeve shirt', 'Warm sweater', 'Waterproof jacket', 'Jeans or trousers', 'Waterproof walking shoes', 'Warm socks', 'Scarf & gloves', 'Underwear'],
        toiletries: ['Moisturizer', 'Lip balm', 'Hand cream', 'Hand sanitizer', 'Tweezers'],
        electronics: ['Phone + charger', 'Power bank', 'Universal adapter (Type S/D/M)', 'Camera'],
        documents: ['Passport', 'Hotel confirmation', 'Flight itinerary', 'Travel insurance card'],
        misc: ['Daypack', 'Sunglasses', 'Reusable water bottle']
      },
      spring: {
        clothing: ['T-shirts (4)', 'Short-sleeve shirts', 'Light jacket', 'Light trousers or shorts', 'Comfortable walking shoes', 'Sandals', 'Underwear'],
        toiletries: ['Sunscreen (SPF 50+)', 'Lip balm', 'Hand sanitizer', 'Moisturizer', 'Tweezers'],
        electronics: ['Phone + charger', 'Power bank', 'Universal adapter (Type S/D/M)', 'Camera'],
        documents: ['Passport', 'Hotel confirmation', 'Flight itinerary', 'Travel insurance card'],
        misc: ['Daypack', 'Sunglasses', 'Reusable water bottle']
      },
      summer: {
        clothing: ['T-shirts (6)', 'Tank tops', 'Shorts', 'Light trousers', 'Comfortable walking shoes', 'Sandals', 'Swimwear', 'Hat/cap', 'Underwear'],
        toiletries: ['Sunscreen (SPF 50+)', 'Lip balm with SPF', 'Insect repellent', 'Hand sanitizer', 'Aloe vera gel', 'Tweezers'],
        electronics: ['Phone + charger', 'Power bank', 'Universal adapter (Type S/D/M)', 'Camera'],
        documents: ['Passport', 'Hotel confirmation', 'Flight itinerary', 'Travel insurance card'],
        misc: ['Daypack', 'Sunglasses', 'Reusable water bottle', 'Swimwear', 'Beach towel']
      },
      fall: {
        clothing: ['T-shirts (3)', 'Long-sleeve shirt', 'Warm sweater', 'Light waterproof jacket', 'Jeans or trousers', 'Comfortable walking shoes', 'Underwear & socks'],
        toiletries: ['Moisturizer', 'Lip balm', 'Sunscreen (SPF 30+)', 'Hand sanitizer', 'Tweezers'],
        electronics: ['Phone + charger', 'Power bank', 'Universal adapter (Type S/D/M)', 'Camera'],
        documents: ['Passport', 'Hotel confirmation', 'Flight itinerary', 'Travel insurance card'],
        misc: ['Daypack', 'Sunglasses', 'Reusable water bottle']
      }
    },

    // --- Reykjavík ---
    reykjavik: {
      winter: {
        clothing: ['Thermal base layers (3)', 'Wool sweaters (2)', 'Fleece mid-layer', 'Waterproof winter coat', 'Waterproof trousers', 'Warm boots', 'Thermal socks (5 pairs)', 'Hat, gloves & neck warmer', 'Underwear'],
        toiletries: ['Moisturizer (heavy duty)', 'Lip balm', 'Hand cream', 'Hand sanitizer', 'Lipstick/balm'],
        electronics: ['Phone + charger', 'Power bank', 'Universal adapter (Type C/F)', 'Camera', 'Headlamp'],
        documents: ['Passport', 'Hotel confirmation', 'Flight itinerary', 'Travel insurance card'],
        misc: ['Swimsuit (hot pools!)', 'Reusable water bottle', 'Daypack', 'Hand warmers', 'Sunglasses']
      },
      spring: {
        clothing: ['T-shirts (3)', 'Fleece or sweater', 'Light waterproof jacket', 'Jeans', 'Waterproof walking shoes', 'Warm socks', 'Scarf', 'Underwear'],
        toiletries: ['Moisturizer', 'Lip balm', 'Hand cream', 'Hand sanitizer', 'Tweezers'],
        electronics: ['Phone + charger', 'Power bank', 'Universal adapter (Type C/F)', 'Camera', 'Headlamp'],
        documents: ['Passport', 'Hotel confirmation', 'Flight itinerary', 'Travel insurance card'],
        misc: ['Swimsuit (hot pools!)', 'Reusable water bottle', 'Daypack', 'Hand warmers']
      },
      summer: {
        clothing: ['T-shirts (4)', 'Light long-sleeve shirts', 'Light fleece', 'Waterproof jacket', 'Light trousers', 'Waterproof walking shoes', 'Light socks', 'Underwear'],
        toiletries: ['Sunscreen (SPF 50+)', 'Lip balm', 'Moisturizer', 'Hand sanitizer', 'Tweezers'],
        electronics: ['Phone + charger', 'Power bank', 'Universal adapter (Type C/F)', 'Camera', 'Headlamp'],
        documents: ['Passport', 'Hotel confirmation', 'Flight itinerary', 'Travel insurance card'],
        misc: ['Swimsuit (hot pools!)', 'Reusable water bottle', 'Daypack', 'Sunglasses']
      },
      fall: {
        clothing: ['T-shirts (3)', 'Fleece or sweater', 'Light waterproof jacket', 'Jeans or trousers', 'Waterproof walking shoes', 'Warm socks', 'Scarf', 'Underwear'],
        toiletries: ['Moisturizer', 'Lip balm', 'Hand cream', 'Hand sanitizer', 'Tweezers'],
        electronics: ['Phone + charger', 'Power bank', 'Universal adapter (Type C/F)', 'Camera', 'Headlamp'],
        documents: ['Passport', 'Hotel confirmation', 'Flight itinerary', 'Travel insurance card'],
        misc: ['Swimsuit (hot pools!)', 'Reusable water bottle', 'Daypack', 'Hand warmers']
      }
    },

    // --- Cancún ---
    cancun: {
      winter: {
        clothing: ['T-shirts (4)', 'Short-sleeve shirts', 'Shorts', 'Light trousers', 'Comfortable walking shoes', 'Sandals', 'Swimwear', 'Light jacket for evenings', 'Underwear'],
        toiletries: ['Sunscreen (SPF 50+)', 'Insect repellent', 'Lip balm with SPF', 'Aloe vera gel', 'Hand sanitizer', 'Tweezers'],
        electronics: ['Phone + charger', 'Power bank', 'Universal adapter (Type A/B)', 'Camera', 'Waterproof phone pouch'],
        documents: ['Passport', 'Hotel confirmation', 'Flight itinerary', 'Travel insurance card'],
        misc: ['Reusable water bottle', 'Daypack', 'Sunglasses', 'Swimwear', 'Beach towel']
      },
      spring: {
        clothing: ['T-shirts (5)', 'Tank tops', 'Shorts', 'Light trousers', 'Comfortable walking shoes', 'Sandals', 'Swimwear', 'Hat/cap', 'Underwear'],
        toiletries: ['Sunscreen (SPF 50+)', 'Insect repellent', 'Lip balm with SPF', 'Aloe vera gel', 'Hand sanitizer', 'Tweezers'],
        electronics: ['Phone + charger', 'Power bank', 'Universal adapter (Type A/B)', 'Camera', 'Waterproof phone pouch'],
        documents: ['Passport', 'Hotel confirmation', 'Flight itinerary', 'Travel insurance card'],
        misc: ['Reusable water bottle', 'Daypack', 'Sunglasses', 'Swimwear', 'Beach towel']
      },
      summer: {
        clothing: ['T-shirts (7)', 'Tank tops', 'Shorts', 'Light trousers', 'Breathable walking shoes', 'Sandals', 'Swimwear', 'Hat/cap', 'Underwear'],
        toiletries: ['Sunscreen (SPF 50+)', 'Insect repellent', 'Lip balm with SPF', 'Aloe vera gel', 'Hand sanitizer', 'Electrolyte packets', 'Tweezers'],
        electronics: ['Phone + charger', 'Power bank', 'Universal adapter (Type A/B)', 'Camera', 'Waterproof phone pouch'],
        documents: ['Passport', 'Hotel confirmation', 'Flight itinerary', 'Travel insurance card'],
        misc: ['Reusable water bottle', 'Daypack', 'Sunglasses', 'Swimwear', 'Beach towel']
      },
      fall: {
        clothing: ['T-shirts (5)', 'Short-sleeve shirts', 'Shorts', 'Light trousers', 'Comfortable walking shoes', 'Sandals', 'Swimwear', 'Hat/cap', 'Underwear'],
        toiletries: ['Sunscreen (SPF 50+)', 'Insect repellent', 'Lip balm with SPF', 'Aloe vera gel', 'Hand sanitizer', 'Tweezers'],
        electronics: ['Phone + charger', 'Power bank', 'Universal adapter (Type A/B)', 'Camera', 'Waterproof phone pouch'],
        documents: ['Passport', 'Hotel confirmation', 'Flight itinerary', 'Travel insurance card'],
        misc: ['Reusable water bottle', 'Daypack', 'Sunglasses', 'Swimwear', 'Beach towel']
      }
    }
  };

  // --- Fallback for unknown destinations ---
  const fallback = {
    winter: {
      clothing: ['T-shirts (3)', 'Long-sleeve shirts', 'Warm sweater or fleece', 'Warm coat', 'Jeans or trousers', 'Comfortable walking shoes', 'Warm socks', 'Scarf & gloves', 'Underwear'],
      toiletries: ['Moisturizer', 'Lip balm', 'Hand cream', 'Hand sanitizer', 'Tweezers'],
      electronics: ['Phone + charger', 'Power bank', 'Universal adapter', 'Camera'],
      documents: ['Passport', 'Hotel confirmation', 'Flight itinerary', 'Travel insurance card'],
      misc: ['Compact umbrella', 'Reusable water bottle', 'Daypack', 'Hand warmers']
    },
    spring: {
      clothing: ['T-shirts (4)', 'Light jacket', 'Long-sleeve shirts', 'Jeans or trousers', 'Comfortable walking shoes', 'Light scarf', 'Underwear'],
      toiletries: ['Moisturizer', 'Lip balm', 'Sunscreen (SPF 30+)', 'Hand sanitizer', 'Tweezers'],
      electronics: ['Phone + charger', 'Power bank', 'Universal adapter', 'Camera'],
      documents: ['Passport', 'Hotel confirmation', 'Flight itinerary', 'Travel insurance card'],
      misc: ['Compact umbrella', 'Reusable water bottle', 'Daypack']
    },
    summer: {
      clothing: ['T-shirts (5)', 'Short-sleeve shirts', 'Shorts', 'Light trousers', 'Comfortable walking shoes', 'Sandals', 'Hat/cap', 'Underwear'],
      toiletries: ['Sunscreen (SPF 50+)', 'Lip balm', 'Hand sanitizer', 'Moisturizer', 'Tweezers'],
      electronics: ['Phone + charger', 'Power bank', 'Universal adapter', 'Camera'],
      documents: ['Passport', 'Hotel confirmation', 'Flight itinerary', 'Travel insurance card'],
      misc: ['Reusable water bottle', 'Daypack', 'Sunglasses']
    },
    fall: {
      clothing: ['T-shirts (3)', 'Long-sleeve shirts', 'Warm sweater', 'Light jacket', 'Jeans or trousers', 'Comfortable walking shoes', 'Underwear & socks'],
      toiletries: ['Moisturizer', 'Lip balm', 'Sunscreen (SPF 30+)', 'Hand sanitizer', 'Tweezers'],
      electronics: ['Phone + charger', 'Power bank', 'Universal adapter', 'Camera'],
      documents: ['Passport', 'Hotel confirmation', 'Flight itinerary', 'Travel insurance card'],
      misc: ['Compact umbrella', 'Reusable water bottle', 'Daypack']
    }
  };

  // --- Generate list ---
  function generateList(destination, season, length) {
    const dest = itemSets[destination] || fallback;
    const seasonItems = dest[season] || dest.summer;
    const items = {};

    const categories = ['clothing', 'toiletries', 'electronics', 'documents', 'misc'];
    const categoryLabels = {
      clothing: '👕 Clothing',
      toiletries: '🧴 Toiletries & Health',
      electronics: '📱 Electronics',
      documents: '📄 Documents & Money',
      misc: '🎒 Misc / Gear'
    };

    categories.forEach(cat => {
      const rawItems = seasonItems[cat];
      let count = rawItems.length;

      // Scale items by trip length
      if (length === 'short') {
        count = Math.max(1, Math.ceil(count * 0.6));
      } else if (length === 'long') {
        count = Math.min(rawItems.length, Math.ceil(count * 1.3));
      }

      items[cat] = { label: categoryLabels[cat], items: rawItems.slice(0, count) };
    });

    return items;
  }

  // --- Render results ---
  function renderResults(destination, season, length, items) {
    const destInfo = destinations[destination];
    if (!destInfo) return;

    // Update title
    resultsTitle.textContent = `${destInfo.flag} ${destInfo.name} — ${season.charAt(0).toUpperCase() + season.slice(1)} pack list`;

    // Count totals
    let totalItems = 0;
    let totalCategories = 0;
    Object.keys(items).forEach(cat => {
      totalCategories++;
      totalItems += items[cat].items.length;
    });

    // Build HTML
    let html = '';

    // Progress bar
    html += `
      <div class="progress-container" id="progress-container">
        <div class="progress-label">
          <span>Packing progress</span>
          <span id="progress-count">0 / ${totalItems} checked</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" id="progress-fill"></div>
        </div>
      </div>
    `;

    // Categories
    const order = ['clothing', 'toiletries', 'electronics', 'documents', 'misc'];
    order.forEach(cat => {
      if (!items[cat]) return;
      html += `<div class="category">`;
      html += `<div class="category-title">${items[cat].label}</div>`;
      html += `<ul class="checklist">`;
      items[cat].items.forEach((item, i) => {
        const id = `${cat}-${i}`;
        html += `
          <li>
            <div class="checklist-item">
              <input type="checkbox" id="${id}" data-cat="${cat}" data-index="${i}">
              <label for="${id}">${item}</label>
            </div>
          </li>`;
      });
      html += `</ul></div>`;
    });

    itemsContainer.innerHTML = html;

    // Show results
    resultsSection.style.display = 'block';

    // Attach checkbox listeners
    document.querySelectorAll('.checklist-item input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', updateProgress);
    });

    // Scroll to results
    setTimeout(() => {
      resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  // --- Update progress ---
  function updateProgress() {
    const allCheckboxes = document.querySelectorAll('.checklist-item input[type="checkbox"]');
    let checked = 0;
    allCheckboxes.forEach(cb => {
      if (cb.checked) checked++;
    });
    const total = allCheckboxes.length;
    const fill = document.getElementById('progress-fill');
    const count = document.getElementById('progress-count');
    if (fill) fill.style.width = `${(checked / total) * 100}%`;
    if (count) count.textContent = `${checked} / ${total} checked`;
  }
});
