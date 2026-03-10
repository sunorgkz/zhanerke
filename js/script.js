(function() {
  'use strict';
  // Treat event time as Aktobe, Kazakhstan (UTC+05:00)
  var AKTOBE_OFFSET = '+05:00';
  var KZ_MONTHS = {
    'қаңтар': 0,
    'ақпан': 1,
    'наурыз': 2,
    'сәуір': 3,
    'мамыр': 4,
    'маусым': 5,
    'шілде': 6,
    'тамыз': 7,
    'қыркүйек': 8,
    'қазан': 9,
    'қараша': 10,
    'желтоқсан': 11
  };

  var KZ_MONTHS_DISPLAY = [
    'Қаңтар',
    'Ақпан',
    'Наурыз',
    'Сәуір',
    'Мамыр',
    'Маусым',
    'Шілде',
    'Тамыз',
    'Қыркүйек',
    'Қазан',
    'Қараша',
    'Желтоқсан'
  ];

  function pad2(n) {
    return String(n).padStart(2, '0');
  }

  function getEventDateFromDOM() {
    var dayEl = document.querySelector('.date-block .event-date-day');
    var monthEl = document.querySelector('.date-block .event-date-month');
    var timeEl = document.querySelector('.date-block .event-time');

    if (!dayEl || !monthEl || !timeEl) return null;

    var day = parseInt((dayEl.textContent || '').trim(), 10);
    var monthText = (monthEl.textContent || '').trim();
    var timeText = (timeEl.textContent || '').trim();

    // monthText expected: "Мамыр 2026" (kk) or similar
    var monthParts = monthText.split(/\s+/).filter(Boolean);
    var monthName = (monthParts[0] || '').toLowerCase();
    var year = parseInt(monthParts[1], 10);

    var monthIndex = KZ_MONTHS[monthName];
    if (!Number.isFinite(day) || !Number.isFinite(year) || monthIndex === undefined) return null;

    var m = timeText.match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return null;
    var hh = parseInt(m[1], 10);
    var mm = parseInt(m[2], 10);
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;

    var iso = year + '-' + pad2(monthIndex + 1) + '-' + pad2(day) + 'T' + pad2(hh) + ':' + pad2(mm) + ':00' + AKTOBE_OFFSET;
    var d = new Date(iso);
    return isNaN(d.getTime()) ? null : d;
  }

  var EVENT_DATE = null;

  function initModal() {
    var modal = document.getElementById('invitation-modal');
    var btn = document.getElementById('view-invitation');
    var audio = document.getElementById('bg-sound');
    var musicBtn = document.getElementById('hero-music-btn');
    if (!modal || !btn) return;
    btn.addEventListener('click', function() {
      modal.classList.add('hidden');
      // start background music once user opens invite
      if (audio) {
        audio.volume = 0.4;
        audio.play().then(function() {
          if (musicBtn) {
            var playIcon = musicBtn.querySelector('.music-play-icon');
            if (playIcon) playIcon.textContent = '❚❚';
            musicBtn.classList.add('playing');
          }
        }).catch(function() {
          // ignore autoplay errors
        });
      }
    });
    modal.addEventListener('click', function(e) {
      if (e.target === modal) btn.click();
    });
  }

  function initCountdown() {
    var daysEl = document.getElementById('days');
    var hoursEl = document.getElementById('hours');
    var minutesEl = document.getElementById('minutes');
    var secondsEl = document.getElementById('seconds');
    if (!daysEl) return;

    function update() {
      if (!EVENT_DATE) EVENT_DATE = getEventDateFromDOM();
      if (!EVENT_DATE) return;

      var now = new Date();
      var diff = EVENT_DATE - now;
      if (diff <= 0) {
        daysEl.textContent = '00';
        hoursEl.textContent = '00';
        minutesEl.textContent = '00';
        secondsEl.textContent = '00';
        return;
      }
      var d = Math.floor(diff / 86400000);
      var h = Math.floor((diff % 86400000) / 3600000);
      var m = Math.floor((diff % 3600000) / 60000);
      var s = Math.floor((diff % 60000) / 1000);
      daysEl.textContent = String(d).padStart(2, '0');
      hoursEl.textContent = String(h).padStart(2, '0');
      minutesEl.textContent = String(m).padStart(2, '0');
      secondsEl.textContent = String(s).padStart(2, '0');
    }
    update();
    setInterval(update, 1000);
  }

  function initCalendar() {
    var container = document.getElementById('calendar-days');
    if (!container) return;
    if (!EVENT_DATE) EVENT_DATE = getEventDateFromDOM();
    var base = EVENT_DATE || new Date();
    var year = base.getFullYear();
    var month = base.getMonth();
    var eventDay = base.getDate();
    var firstDay = new Date(year, month, 1).getDay();
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var kzStart = firstDay === 0 ? 6 : firstDay - 1;
    var empty = '';
    for (var i = 0; i < kzStart; i++) {
      empty += '<span></span>';
    }
    var html = empty;
    for (var d = 1; d <= daysInMonth; d++) {
      var cls = d === eventDay ? 'event-day' : '';
      html += '<span class="' + cls + '">' + d + '</span>';
    }
    container.innerHTML = html;

    // Update calendar month headline and selected date label
    var monthTitle = document.querySelector('.calendar-month');
    if (monthTitle && KZ_MONTHS_DISPLAY[month]) {
      monthTitle.textContent = KZ_MONTHS_DISPLAY[month] + ' ' + year;
    }
    var selectedLabel = document.getElementById('calendar-selected-text');
    if (selectedLabel && KZ_MONTHS_DISPLAY[month]) {
      selectedLabel.textContent = eventDay + ' ' + KZ_MONTHS_DISPLAY[month];
    }
  }

  function setRsvpStatus(status) {
    var statusInput = document.getElementById('rsvp-status');
    if (statusInput) {
      statusInput.value = status;
    }
    var toggle = document.getElementById('rsvp-toggle');
    if (toggle) {
      var buttons = toggle.querySelectorAll('.rsvp-toggle-option');
      buttons.forEach(function(btn) {
        var s = btn.getAttribute('data-status');
        btn.classList.toggle('active', s === status);
      });
    }

    // show guests field only when coming
    var guestsField = document.getElementById('rsvp-guests-field');
    if (guestsField) {
      if (status === 'no') {
        guestsField.style.display = 'none';
        var guestsInput = document.getElementById('rsvp-guests');
        if (guestsInput) guestsInput.value = '';
      } else {
        guestsField.style.display = '';
      }
    }
  }

  function initFloatingButton() {
    var btn = document.getElementById('rsvp-button');
    if (!btn) return;

    var lastScrollY = window.scrollY || window.pageYOffset;
    var idleTimer = null;
    var IDLE_DELAY = 3000;

    function showButton() {
      btn.classList.remove('hidden');
    }

    function hideButton() {
      btn.classList.add('hidden');
    }

    function resetIdleTimer() {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(showButton, IDLE_DELAY);
    }

    function onScroll() {
      var currentScrollY = window.scrollY || window.pageYOffset;
      var viewportBottom = currentScrollY + window.innerHeight;
      var docHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      );
      var nearBottom = viewportBottom >= docHeight - 200;

      // Near footer: always hide and do not reshow automatically
      if (nearBottom) {
        hideButton();
        if (idleTimer) clearTimeout(idleTimer);
        lastScrollY = currentScrollY;
        return;
      }

      if (currentScrollY > lastScrollY) {
        // scrolling down – hide, show again only after idle
        hideButton();
        if (idleTimer) clearTimeout(idleTimer);
        idleTimer = setTimeout(showButton, IDLE_DELAY);
      } else if (currentScrollY < lastScrollY) {
        // scrolling up – show immediately and keep 3s idle behaviour
        showButton();
        resetIdleTimer();
      }
      lastScrollY = currentScrollY;
    }

    window.addEventListener('scroll', function() {
      onScroll();
    });

    var yesBtn = btn.querySelector('.rsvp-btn-yes');
    var noBtn = btn.querySelector('.rsvp-btn-no');

    function openForm(status) {
      var overlay = document.getElementById('rsvp-form-overlay');
      if (!overlay) return;
      setRsvpStatus(status);
      overlay.classList.remove('hidden');
    }

    if (yesBtn) yesBtn.addEventListener('click', function() { openForm('yes'); });
    if (noBtn) noBtn.addEventListener('click', function() { openForm('no'); });
  }

  function initRsvpForm() {
    var overlay = document.getElementById('rsvp-form-overlay');
    var form = document.getElementById('rsvp-form');
    var backBtn = document.getElementById('rsvp-form-back');
    var toggle = document.getElementById('rsvp-toggle');
    if (!overlay || !form) return;

    function closeForm() {
      overlay.classList.add('hidden');
    }

    if (backBtn) {
      backBtn.addEventListener('click', function() {
        closeForm();
      });
    }

    if (toggle) {
      toggle.addEventListener('click', function(e) {
        var btn = e.target.closest('.rsvp-toggle-option');
        if (!btn) return;
        var status = btn.getAttribute('data-status') === 'no' ? 'no' : 'yes';
        setRsvpStatus(status);
      });
    }

    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var status = document.getElementById('rsvp-status').value || 'yes';
      var name = document.getElementById('rsvp-name').value.trim();
      var guests = document.getElementById('rsvp-guests').value.trim();
      var wish = document.getElementById('rsvp-wish').value.trim();

      if (!name) {
        alert('Есіміңізді жазыңыз.');
        return;
      }

      var payload = {
        status: status,
        name: name,
        guests: guests,
        wish: wish,
        timestamp: new Date().toISOString()
      };

      fetch('https://script.google.com/macros/s/AKfycbwspv3qevEF-S_ZL-wXdDtmYknN6TyIrhJbaYBnvVDRVOonHeQn50o-EAuopG45FXRPog/exec', {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }).then(function() {
        alert('Рақмет! Жауабыңыз сақталды.');
        form.reset();
        closeForm();
      }).catch(function() {
        alert('Қате кетті. Кейінірек қайталап көріңіз.');
      });
    });
  }

  function initMusicButton() {
    var musicBtn = document.getElementById('hero-music-btn');
    var audio = document.getElementById('bg-sound');
    if (!musicBtn || !audio) return;
    audio.volume = 0.4;
    var playIcon = musicBtn.querySelector('.music-play-icon');
    musicBtn.addEventListener('click', function() {
      if (audio.paused) {
        if (playIcon) playIcon.textContent = '❚❚';
        musicBtn.classList.add('playing');
        audio.play().catch(function() {});
      } else {
        audio.pause();
        if (playIcon) playIcon.textContent = '▶';
        musicBtn.classList.remove('playing');
      }
    });
  }

  function init() {
    initModal();
    initCountdown();
    initCalendar();
    initFloatingButton();
    initRsvpForm();
    initMusicButton();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
