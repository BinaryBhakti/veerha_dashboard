/* =============================================================================
   VEERHA — prototype behaviours
   Modelled on superdmc/assets/shell.js §"Generic behaviours", remapped to the
   Veerha design system and extended to Veerha's own vocabulary.

   Everything here is presentation-only: it changes what is on screen, never
   any data. Loaded by every screen file and by the walkthrough.

   Scope rule: every behaviour is scoped to its own frame (.vs-frame) or, in the
   walkthrough, the active screen — so filtering one table cannot touch another.
   ============================================================================= */
(function () {
  'use strict';
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var scopeOf = function (el) { return el.closest('.vs-frame, .wt-screen') || document; };

  /* ---------------------------------------------------------------- toast -- */
  var ICONS = { ok: 'i-check', info: 'i-info', warn: 'i-alert', danger: 'i-alert' };
  function toast(title, body, tone) {
    tone = tone || 'ok';
    var box = document.querySelector('.v-toasts');
    if (!box) {
      box = document.createElement('div');
      box.className = 'v-toasts'; box.setAttribute('aria-live', 'polite');
      document.body.appendChild(box);
    }
    // Built from real nodes. An earlier innerHTML version put the body into the
    // icon span and dropped the glyph -- string concatenation made the bug
    // invisible in the source.
    var el = document.createElement('div');
    el.className = 'v-toast v-toast--' + tone;

    var id = ICONS[tone] || ICONS.info;
    if (document.getElementById(id)) {          // only draw a glyph that exists
      var ic = document.createElement('span');
      ic.className = 'v-toast__ic';
      ic.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
        'stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><use href="#' + id + '"/></svg>';
      el.appendChild(ic);
    }
    var wrap = document.createElement('div');
    var t = document.createElement('b'); t.textContent = title; wrap.appendChild(t);
    if (body) { var s2 = document.createElement('span'); s2.textContent = body; wrap.appendChild(s2); }
    el.appendChild(wrap);

    box.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('is-in'); });
    setTimeout(function () {
      el.classList.add('is-leaving');
      setTimeout(function () { el.remove(); }, 250);
    }, 2800);
  }
  window.V = { toast: toast };

  var TICK = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';

  /* -------------------------------------------------- row filtering engine -- */
  // Pills, scope tiles, segments and the search box all narrow the same list.
  // They write their predicate here so the last one does not silently undo the
  // others -- the live product's two competing filter mechanisms are exactly
  // the defect the audit called out.
  function listOf(scope) {
    return $('.v-table tbody', scope) || $('.v-rows', scope) || null;
  }
  function rowsOf(scope) {
    var body = listOf(scope); if (!body) return [];
    var rows = $$(':scope > tr, :scope > .v-record', body).length
      ? $$(':scope > tr, :scope > .v-record', body)
      : $$('tr, .v-record', body);
    return rows.filter(function (r) { return !r.hasAttribute('data-v-nomatch'); });
  }
  function applyFilters(scope) {
    var st = scope.__vf || (scope.__vf = {});
    var rows = rowsOf(scope), shown = 0;
    // Each control group owns a slot; every active facet must match.
    // A tab reads "Managers" while the rows say "Manager", so the plural form
    // matched nothing and the filter silently did nothing. Try the label, then
    // its singular, then the first word -- "Needs a reply" against a row that
    // just says "Reply".
    function variants(f) {
      var v = [f];
      if (/s$/.test(f)) v.push(f.slice(0, -1));
      var first = f.split(/\s+/)[0];
      if (first && first !== f && first.length > 3) {
        v.push(first);
        if (/s$/.test(first)) v.push(first.slice(0, -1));
      }
      return v;
    }
    var active = [];
    Object.keys(st.facets || {}).forEach(function (k) {
      var f = st.facets[k];
      if (!f) return;
      var pick = null;
      variants(f).some(function (cand) {
        var hits = rows.filter(function (r) { return r.textContent.toLowerCase().indexOf(cand) !== -1; }).length;
        if (hits > 0 && hits < rows.length) { pick = cand; return true; }   // must actually narrow
        return false;
      });
      // a facet the static rows do not carry is descriptive, not a filter
      if (pick) active.push(pick);
    });
    st.facetInert = Object.keys(st.facets || {}).some(function (k) { return st.facets[k]; }) && !active.length;
    rows.forEach(function (r) {
      var txt = r.textContent.toLowerCase();
      var ok = true;
      if (st.q) ok = ok && txt.indexOf(st.q) !== -1;
      if (ok) ok = active.every(function (f) { return txt.indexOf(f) !== -1; });
      r.hidden = !ok; if (ok) shown++;
    });
    // st.facet was never set (the slots live in st.facets), so a tab or pill
    // narrowed the list without saying so. Only a facet that narrows counts.
    var filtering = !!(st.q || active.length);
    var note = $('[data-v-note]', scope);
    if (!note && filtering) {
      var host = (listOf(scope) || {}).closest ? listOf(scope).closest('.v-card') : null;
      note = document.createElement('p');
      note.className = 't-meta muted'; note.setAttribute('data-v-note', '');
      note.style.margin = 'var(--s-2) 0 0';
      (host && host.parentNode ? host.parentNode : scope).appendChild(note);
    }
    if (note) {
      note.textContent = filtering
        ? shown + ' of ' + rows.length + ' shown' +
          (st.label ? ' · ' + st.label : '') + (st.q ? ' · matching “' + st.qRaw + '”' : '')
        : '';
    }
    var empty = $('.v-empty', scope);
    if (empty && rows.length) empty.hidden = shown > 0;
    else if (rows.length) noMatches(scope, shown === 0);
    return shown;
  }

  // A frame without a drawn empty state still must not leave a blank table.
  function noMatches(scope, on) {
    var body = listOf(scope); if (!body) return;
    var el = $('[data-v-nomatch]', body);
    if (!on) { if (el) el.remove(); return; }
    if (el) return;
    if (body.tagName === 'TBODY') {
      var cols = $$('thead th', body.closest('table')).length || 1;
      el = document.createElement('tr');
      var td = document.createElement('td'); td.colSpan = cols;
      td.className = 't-small muted'; td.style.textAlign = 'center'; td.style.padding = 'var(--s-8) var(--s-4)';
      td.textContent = 'Nothing matches these filters. Clear the search or pick another tab.';
      el.appendChild(td);
    } else {
      el = document.createElement('p');
      el.className = 't-small muted'; el.style.padding = 'var(--s-8) var(--s-4)'; el.style.textAlign = 'center';
      el.textContent = 'Nothing matches these filters. Clear the search or pick another tab.';
    }
    el.setAttribute('data-v-nomatch', '');
    body.appendChild(el);
  }

  // textContent runs "Stay page" and "One page with…" together; join the
  // text nodes with a space so a generated label reads as words.
  function words(el) {
    var out = [], w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while (w.nextNode()) { var t = w.currentNode.nodeValue.trim(); if (t) out.push(t); }
    return out.join(' ');
  }
  // A control drawn as a span still has to be reachable and announced.
  function control(el, role, on) {
    if (!el.hasAttribute('role')) el.setAttribute('role', role);
    if (!el.hasAttribute('tabindex')) el.tabIndex = 0;
    el.setAttribute('aria-checked', !!on);
    if (!el.hasAttribute('aria-label') && !el.hasAttribute('aria-labelledby')) {
      var t, tr = el.closest('tr');
      if (role === 'checkbox' && el.closest('thead')) t = 'Select all rows';
      else if (role === 'checkbox' && tr) {
        var who = $('.v-identity__name, .t-strong, b', tr);
        t = 'Select ' + (who ? words(who) : 'row');
      } else {
        var host = el.closest('label, .spread, .row') || el.parentNode;
        var title = host && host !== el && host.firstElementChild !== el ? host.firstElementChild : null;
        t = words(title && !title.contains(el) ? title : (host && host !== el ? host : el));
      }
      t = (t || '').replace(/\s+/g, ' ').trim().slice(0, 80);
      if (t) el.setAttribute('aria-label', t);
    }
  }

  /* ------------------------------------------------------------ one group -- */
  function single(scope, items, cls, onPick) {
    items.forEach(function (it) {
      if (it.dataset.vWired) return; it.dataset.vWired = '1';
      it.addEventListener('click', function (e) {
        e.preventDefault();
        items.forEach(function (x) {
          x.classList.toggle(cls, x === it);
          if (x.hasAttribute('aria-selected')) x.setAttribute('aria-selected', x === it);
          if (x.hasAttribute('aria-pressed'))  x.setAttribute('aria-pressed',  x === it);
        });
        onPick && onPick(it);
      });
    });
  }

  // a pill/tab label like "Hot 14" is a facet; strip the count to match rows
  function facetOf(el) {
    var t = (el.textContent || '').replace(/\s+/g, ' ').trim();
    t = t.replace(/\s*\d[\d,]*\s*$/, '').trim();
    return /^(all|everything|all open|any)\b/i.test(t) ? '' : t.toLowerCase();
  }

  function wire(scope) {
    if (!scope || scope.dataset && scope.dataset.vDone) return;
    if (scope.dataset) scope.dataset.vDone = '1';
    var st = scope.__vf || (scope.__vf = {});
    st.facets = st.facets || {};
    var slot = 0;

    /* tabs + pill tabs + segmented + scope tiles all narrow the same list */
    $$('.v-tabs', scope).forEach(function (g, gi) {
      single(scope, $$('.v-tab', g), 'is-active', function (it) {
        var p = it.getAttribute('aria-controls') && document.getElementById(it.getAttribute('aria-controls'));
        if (p) $$('[role="tabpanel"]', scope).forEach(function (x) { x.hidden = x !== p; });
        st.facets['tabs' + gi] = facetOf(it); st.label = it.textContent.trim(); applyFilters(scope);
      });
    });
    $$('.v-pilltabs', scope).forEach(function (g, gi) {
      single(scope, $$('.v-pill', g), 'is-active', function (it) {
        st.facets['pills' + gi] = facetOf(it); st.label = it.textContent.replace(/\s+/g,' ').trim(); applyFilters(scope);
      });
    });
    $$('.v-seg', scope).forEach(function (g, gi) {
      single(scope, $$('.v-seg__opt', g), 'is-active', function (it) {
        st.facets['seg' + gi] = facetOf(it); st.label = it.textContent.trim(); applyFilters(scope);
      });
    });
    var tiles = $$('.v-stat', scope);
    if (tiles.length > 1) single(scope, tiles, 'is-selected', function (it) {
      var cap = $('.v-stat__cap', it);
      st.facets.tiles = cap ? facetOf(cap) : ''; st.label = cap ? cap.textContent.trim() : ''; applyFilters(scope);
    });

    /* search */
    $$('.v-search input, input[placeholder*="Search" i]', scope).forEach(function (inp) {
      if (inp.dataset.vWired) return; inp.dataset.vWired = '1';
      inp.addEventListener('input', function () {
        st.qRaw = inp.value.trim(); st.q = st.qRaw.toLowerCase(); applyFilters(scope);
      });
    });

    /* toggles */
    $$('.v-toggle', scope).forEach(function (t) {
      if (t.dataset.vWired) return; t.dataset.vWired = '1';
      control(t, 'switch', t.classList.contains('is-on'));
      t.addEventListener('click', function () {
        var on = t.classList.toggle('is-on');
        t.setAttribute('aria-checked', on);
        var lbl = (t.parentNode.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 48);
        toast(on ? 'Turned on' : 'Turned off', lbl, on ? 'ok' : 'info');
      });
    });

    /* choice chips: a pressed/unpressed pair, not a menu */
    $$('.v-selectchip[aria-pressed]', scope).forEach(function (c) {
      if (c.dataset.vWired) return; c.dataset.vWired = '1';
      c.addEventListener('click', function () {
        var on = c.getAttribute('aria-pressed') !== 'true';
        c.setAttribute('aria-pressed', on); c.classList.toggle('is-active', on);
      });
    });

    /* radio cards */
    var cards = $$('.v-radiocard', scope);
    cards.forEach(function (c) { if (!c.querySelector('input')) control(c, 'radio', c.classList.contains('is-selected')); });
    cards.length > 1 && single(scope, cards, 'is-selected', function (it) {
      cards.forEach(function (c) { if (c.hasAttribute('role')) c.setAttribute('aria-checked', c === it); });
    });
    /* checkboxes drawn as spans (the ones with a native input need nothing) */
    $$('.v-check', scope).forEach(function (c) {
      if (!c.querySelector('input')) control(c, 'checkbox', c.classList.contains('is-checked'));
    });

    /* accordions */
    $$('.v-accordion__trigger', scope).forEach(function (b) {
      if (b.dataset.vWired) return; b.dataset.vWired = '1';
      b.addEventListener('click', function () {
        var a = b.closest('.v-accordion'); if (!a) return;
        var open = a.classList.toggle('is-open');
        b.setAttribute('aria-expanded', open);
        var panel = $('.v-accordion__panel', a); if (panel) panel.hidden = !open;
      });
    });

    /* tables: sort, select, row -> drawer */
    $$('.v-table', scope).forEach(function (t) { initTable(t, scope); });

    /* drawer open/close */
    var drawer = $('.vs-overlay', scope);
    if (drawer) {
      var opener = null;
      var shut = function () {
        drawer.style.display = 'none';
        if (opener && opener.focus) opener.focus({ preventScroll: true });
      };
      var show = function (from) {
        opener = from; drawer.style.display = 'flex';
        var box = $('.v-drawer, .v-modal', drawer);
        if (box) {
          if (!box.hasAttribute('tabindex')) box.tabIndex = -1;
          box.setAttribute('aria-modal', 'true');
          box.focus({ preventScroll: true });
        }
      };
      rowsOf(scope).forEach(function (r) {
        if (r.dataset.vRow) return; r.dataset.vRow = '1';
        if (!r.hasAttribute('tabindex')) r.tabIndex = 0;
        r.addEventListener('click', function (e) {
          if (e.target.closest('.v-check, .v-selectchip, button, a, input')) return;
          show(r);
        });
      });
      $$('.v-scrim, [data-close]', drawer).forEach(function (x) { x.addEventListener('click', shut); });
      $$('.v-drawer [aria-label="Close"]', drawer).forEach(function (x) { x.addEventListener('click', shut); });
      drawer.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.stopPropagation(); shut(); } });
    }

    /* pager */
    $$('.v-pager .v-pager__n', scope).length > 1 &&
      single(scope, $$('.v-pager .v-pager__n', scope), 'is-active', function (it) {
        toast('Page ' + it.textContent.trim(), 'Prototype — one page of data is loaded.', 'info');
      });
  }

  /* ------------------------------------------------------------- tables --- */
  var MONEY_LEAD = /^[₹$€£]\s*(-?[\d,]+(?:\.\d+)?)\s*(Cr|L|K)?\b/i;
  var MONEY_UNIT = { cr: 1e7, l: 1e5, k: 1e3 };
  var NUM_ONLY   = /^-?[\d,]+(\.\d+)?$/;
  var DATE_ONLY  = /^(\d{1,2}[-/ ][A-Za-z]{3,9}[-/ ]\d{2,4}|[A-Za-z]{3,9} \d{1,2},? \d{4}|\d{4}-\d{2}-\d{2})$/;
  var TIME_ONLY  = /^(\d{1,2}):(\d{2})(\s?[ap]m)?$/i;
  function sortValue(cell) {
    if (!cell) return '';
    if (cell.dataset && cell.dataset.sort !== undefined) {
      var d = cell.dataset.sort; return isNaN(+d) ? String(d).toLowerCase() : +d;
    }
    var first = cell.textContent.trim().split('\n')[0].trim();
    var m = first.match(MONEY_LEAD);
    if (m) return +m[1].replace(/,/g, '') * (m[2] ? MONEY_UNIT[m[2].toLowerCase()] : 1);
    if (NUM_ONLY.test(first)) return +first.replace(/,/g, '');
    var tm = first.match(TIME_ONLY);
    if (tm) return (+tm[1] % 12 + (/pm/i.test(tm[3] || '') ? 12 : 0)) * 60 + +tm[2];
    if (DATE_ONLY.test(first)) { var t = Date.parse(first); if (!isNaN(t)) return t; }
    return first.toLowerCase();
  }

  function initTable(table, scope) {
    if (table.dataset.vWired) return; table.dataset.vWired = '1';
    var ths = $$('thead th', table);
    ths.forEach(function (th, i) {
      if (!th.textContent.trim() || $('.v-check', th)) return;
      th.classList.add('is-sortable');
      if (!th.hasAttribute('tabindex')) th.tabIndex = 0;
      th.addEventListener('click', function () {
        var dir = th.getAttribute('aria-sort') === 'ascending' ? 'descending' : 'ascending';
        ths.forEach(function (x) { x.removeAttribute('aria-sort'); });
        th.setAttribute('aria-sort', dir);
        var body = $('tbody', table); if (!body) return;
        var all = $$('tr', body);
        var data = all.filter(function (r) { return r.children.length === ths.length; });
        var rest = all.filter(function (r) { return r.children.length !== ths.length; });
        data.sort(function (a, b) {
          var x = sortValue(a.children[i]), y = sortValue(b.children[i]);
          return (x > y ? 1 : x < y ? -1 : 0) * (dir === 'ascending' ? 1 : -1);
        }).forEach(function (r) { body.appendChild(r); });
        rest.forEach(function (r) { body.appendChild(r); });
        toast('Sorted by ' + th.textContent.trim(),
              dir === 'ascending' ? 'Lowest first' : 'Highest first', 'info');
      });
    });

    var head = $('thead .v-check', table);
    var paint = function (c, on) {
      c.classList.toggle('is-checked', on);
      if (c.hasAttribute('role')) c.setAttribute('aria-checked', on);
      var box = $('.v-check__box', c); if (box) box.innerHTML = on ? TICK : '';
    };
    if (head) {
      var boxes = function () { return $$('tbody .v-check', table); };
      var bar = document.createElement('div');
      bar.className = 'v-bulkbar'; bar.hidden = true;
      bar.innerHTML = '<span class="v-bulkbar__n"></span><span class="t-small secondary">selected</span>' +
        '<span class="grow"></span>' +
        '<button class="v-btn v-btn--secondary v-btn--sm" data-bulk="Assign">Assign</button>' +
        '<button class="v-btn v-btn--secondary v-btn--sm" data-bulk="Export">Export</button>' +
        '<button class="v-btn v-btn--ghost v-btn--sm" data-bulk="clear">Clear</button>';
      var card = table.closest('.v-card') || table.parentNode;
      card.parentNode.insertBefore(bar, card);
      var sync = function () {
        var all = boxes(), n = all.filter(function (b) { return b.classList.contains('is-checked'); }).length;
        paint(head, n > 0 && n === all.length);
        head.classList.toggle('is-indeterminate', n > 0 && n < all.length);
        all.forEach(function (b) { var tr = b.closest('tr'); if (tr) tr.classList.toggle('is-selected', b.classList.contains('is-checked')); });
        bar.hidden = !n; bar.querySelector('.v-bulkbar__n').textContent = n + (n === 1 ? ' row' : ' rows');
      };
      head.addEventListener('click', function (e) {
        e.stopPropagation();
        var on = !head.classList.contains('is-checked');
        boxes().forEach(function (b) { paint(b, on); }); sync();
      });
      table.addEventListener('click', function (e) {
        var c = e.target.closest('tbody .v-check');
        if (c) { e.stopPropagation(); paint(c, !c.classList.contains('is-checked')); sync(); }
      });
      bar.addEventListener('click', function (e) {
        var b = e.target.closest('[data-bulk]'); if (!b) return;
        var n = boxes().filter(function (x) { return x.classList.contains('is-checked'); }).length;
        if (b.dataset.bulk === 'clear') { boxes().forEach(function (x) { paint(x, false); }); sync(); return; }
        toast(b.dataset.bulk + ' ' + n + (n === 1 ? ' row' : ' rows'), 'Prototype — nothing is changed.', 'info');
      });
      sync();
    }
  }

  /* --------------------------------------------------- everything else ----- */
  // Any other button confirms the action by name. It never says "not wired".
  var QUIET = /^(close|back|cancel|dismiss|←|→|×)$/i;
  document.addEventListener('click', function (e) {
    var el = e.target.closest('button, a[href="#"], [role="button"]');
    if (!el) return;
    if (el.dataset.vWired || el.dataset.bulk) return;
    if (el.closest('.v-tabs, .v-pilltabs, .v-seg, .v-toggle, .v-check, .v-radiocard, .v-pager, .v-accordion, .v-bulkbar, .v-toasts, #wtPanel, #wtCmd, .wt-panel')) return;
    if (el.closest('.v-field, label')) return;              // a form label is not an action
    if (el.tagName !== 'BUTTON' && el.tagName !== 'A' && !el.hasAttribute('role')) return;
    if (el.hasAttribute('data-go') || el.hasAttribute('data-rail') || el.hasAttribute('data-close')) return;
    if (el.tagName === 'A') {
      var h = el.getAttribute('href');
      if (h && h !== '#' && h.charAt(0) !== '#') return;
      e.preventDefault();
    }
    var label = (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 44);
    if (!label || QUIET.test(label)) return;
    toast(label, 'Prototype — nothing is changed.', 'info');
  });

  /* ----------------------------------------------------------- keyboard ---- */
  // Anything drawn as a div or span that acts as a control answers Enter, and
  // Space unless it is a link -- what a native button or link would do.
  var KEYED = '[role="button"], [role="link"], [role="checkbox"], [role="switch"], [role="radio"], ' +
              '[role="tab"], [role="menuitem"], th.is-sortable, tr[tabindex], [data-go][tabindex]';
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var el = e.target;
    if (!el.matches || !el.matches(KEYED)) return;
    if (/^(BUTTON|A|INPUT|TEXTAREA|SELECT|SUMMARY)$/.test(el.tagName)) return;
    if (e.key === ' ' && el.getAttribute('role') === 'link') return;
    e.preventDefault();
    el.click();
  });

  /* -------------------------------------------- standalone navigation ---- */
  // The module files are design sheets, not the app: a control that goes to
  // another screen opens that screen in the walkthrough instead of doing nothing.
  document.addEventListener('click', function (e) {
    if (window.wtGo || e.defaultPrevented) return;
    var g = e.target.closest('[data-go]');
    if (!g || g.closest('.wt-layer')) return;
    if (g.tagName === 'A' && g.getAttribute('href') && g.getAttribute('href').charAt(0) !== '#') return;
    e.preventDefault();
    location.href = 'walkthrough.html#' + g.getAttribute('data-go');
  });

  /* ------------------------------------------------------------ bootstrap -- */
  function wireAll() {
    var active = $('.wt-screen.is-on');
    if (active) { wire(active); return; }
    $$('.vs-frame').forEach(wire);
  }
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', wireAll);
  else wireAll();
  window.addEventListener('hashchange', function () { setTimeout(wireAll, 60); });
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-go],[data-rail]')) setTimeout(wireAll, 90);
  }, true);
})();
