/* =============================================================================
   VEERHA — flows
   The runtime that makes the walkthrough behave like the product.

   Buttons carry what they do as attributes, written by tools/wire.py from the
   flow map in tools/flows.py (or by hand in a frame):

     data-go="screen" [data-view="needs-reply"]   go to a screen, optionally a view
     data-open="layer"                              open a modal / drawer / dialog
     data-do="action"                               change state (convert, approve…)
     data-menu                                      toggle the .v-menu beside it
     data-inert="reason"                            explained, not wired (external…)

   State is a small in-memory store. Anything with data-bind="key" shows its
   value; data-when="key" / data-unless="key" show or hide on it. Everything
   resets on reload — this is a prototype, and a reviewer should always be able
   to start again from the same morning.

   Loaded after behaviour.js. The walkthrough's own script exposes go() as
   window.wtGo and routes its drawer calls through VF.open / VF.closeAll.
   ============================================================================= */
(function () {
  'use strict';
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* -------------------------------------------------------------- state -- */
  // Seed values agree with screens/assets/data.js and the drawn frames.
  var SEED = {
    leads: 27, leadsNew: 17, leadsHot: 14, leadsOverdue: 5,
    // opps: Arjun becomes the 61st when he is converted
    opps: 60, waiting: 20, review: 20, tasks: 10,
    needsReply: 4, highIntent: 2, awaiting: 3, mailNew: 1,
    chatNeedsReply: 2, chatHighIntent: 2,
    quotesAwaiting: 0, reviewOpen: 6,
    'arjun.converted': false, 'arjun.won': false, 'quote.sent': false, 'lead.added': false, 'arjun.taken': false
  };
  var STATE = JSON.parse(JSON.stringify(SEED));

  function truthy(expr) {
    var neg = expr.charAt(0) === '!';
    var v = STATE[neg ? expr.slice(1) : expr];
    return neg ? !v : !!v;
  }
  function fmt(v) { return typeof v === 'number' ? v.toLocaleString('en-IN') : String(v); }
  function render() {
    $$('[data-bind]').forEach(function (el) {
      var v = STATE[el.getAttribute('data-bind')];
      if (v === undefined) return;
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.value = fmt(v); else el.textContent = fmt(v);
    });
    $$('[data-when]').forEach(function (el) { el.hidden = !truthy(el.getAttribute('data-when')); });
    $$('[data-unless]').forEach(function (el) { el.hidden = truthy(el.getAttribute('data-unless')); });
  }
  function set(k, v) { STATE[k] = v; render(); }
  function add(k, n) { STATE[k] = (STATE[k] || 0) + n; render(); }
  function snapshot() { return JSON.parse(JSON.stringify(STATE)); }
  function restore(s) { Object.keys(STATE).forEach(function (k) { delete STATE[k]; }); Object.assign(STATE, s); render(); }

  /* -------------------------------------------------------------- toast -- */
  function toast(title, body, tone, undo) {
    var box = $('.v-toasts');
    if (!box) {
      box = document.createElement('div');
      box.className = 'v-toasts'; box.setAttribute('aria-live', 'polite');
      document.body.appendChild(box);
    }
    var el = document.createElement('div');
    el.className = 'v-toast v-toast--' + (tone || 'ok');
    var wrap = document.createElement('div');
    var t = document.createElement('b'); t.textContent = title; wrap.appendChild(t);
    if (body) { var s = document.createElement('span'); s.textContent = body; wrap.appendChild(s); }
    el.appendChild(wrap);
    if (undo) {
      var u = document.createElement('button');
      u.className = 'v-btn v-btn--ghost v-btn--sm'; u.textContent = 'Undo';
      u.style.marginLeft = 'auto'; u.style.color = 'inherit'; u.style.textDecoration = 'underline'; u.style.fontWeight = '600';
      u.setAttribute('data-vf-undo', '');
      u.addEventListener('click', function (e) {
        e.stopPropagation();                       // not a prototype action to announce
        undo(); toast('Undone', title, 'info'); setTimeout(function () { el.remove(); }, 0);
      });
      el.appendChild(u);
    }
    box.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('is-in'); });
    setTimeout(function () { el.classList.add('is-leaving'); setTimeout(function () { el.remove(); }, 250); }, undo ? 6000 : 3000);
  }

  /* ------------------------------------------------------------- layers -- */
  var stack = [];
  // A trigger can hand the layer its subject: data-ctx-name="Priya Nair" sets
  // STATE['ctx.name'], which the layer shows through data-bind="ctx.name".
  // One Convert modal then serves every lead row.
  function takeCtx(el) {
    if (!el || !el.attributes) return;
    Array.prototype.forEach.call(el.attributes, function (a) {
      if (a.name.indexOf('data-ctx-') === 0) STATE['ctx.' + a.name.slice(9)] = a.value;
    });
    if (STATE['ctx.name']) STATE['ctx.first'] = STATE['ctx.name'].split(' ')[0];
    if (STATE['ctx.name'] && STATE['ctx.req'])
      STATE['ctx.deal'] = STATE['ctx.name'] + ' — ' + STATE['ctx.req'].split(' · ').slice(1).join(' · ');
  }
  function open(id, opener) {
    takeCtx(opener);
    // A step button (Next / Back in a multi-step dialog) replaces its dialog
    // instead of stacking a second one on top.
    var from = opener && opener.closest && opener.closest('.wt-layer');
    if (from && opener.hasAttribute('data-step')) close(from.getAttribute('data-layer'));
    var L = $('.wt-layer[data-layer="' + id + '"]');
    if (!L) { toast('Not drawn yet', 'The “' + id + '” layer has no frame.', 'warn'); return; }
    closeMenus();
    L.hidden = false;
    stack.push({ id: id, opener: opener || document.activeElement });
    // A modal is a form: put the caret in its first field. A drawer is reading,
    // so it takes no focus ring on open.
    var f = $('.v-modal input, .v-modal textarea, .v-modal select', L);
    if (f) setTimeout(function () { f.focus({ preventScroll: true }); }, 30);
    render();
  }
  function close(id) {
    var i = id ? stack.map(function (s) { return s.id; }).lastIndexOf(id) : stack.length - 1;
    if (i < 0) return;
    var top = stack.splice(i, 1)[0];
    var L = $('.wt-layer[data-layer="' + top.id + '"]'); if (L) L.hidden = true;
    if (top.opener && top.opener.focus) top.opener.focus({ preventScroll: true });
  }
  function closeAll() { while (stack.length) close(); }

  /* -------------------------------------------------------------- menus -- */
  // An open menu is moved to <body> so no sticky cell or scrolling card can
  // trap it underneath the next row; it goes back to its host when it closes.
  function portal(menu) {
    if (menu.__home) return;
    menu.__home = menu.parentNode; menu.__next = menu.nextSibling;
    document.body.appendChild(menu);
  }
  function unportal(menu) {
    if (!menu.__home) return;
    menu.__home.insertBefore(menu, menu.__next); menu.__home = null;
  }
  function closeMenus(except) {
    $$('.v-menu').forEach(function (m) { if (m !== except) { m.hidden = true; unportal(m); } });
    $$('[data-menu][aria-expanded="true"]').forEach(function (b) {
      if (!except || b.parentNode !== except.parentNode) b.setAttribute('aria-expanded', 'false');
    });
  }

  /* ------------------------------------------------------------ actions -- */
  // Each returns what should happen next: { toast, body, tone, undo, go, open, close }.
  var ACTIONS = {
    // An item in a chip's menu becomes the chip's value: stage, owner, temperature.
    pick: function (el) {
      var host = el.closest('.v-menu-host') || (el.closest('.v-menu') || {}).__host;
      var chip = host && $('[data-menu]', host);
      var val = (el.getAttribute('data-value') || el.textContent).replace(/\s+/g, ' ').trim();
      if (chip) {
        var svg = $('svg', chip);
        chip.textContent = val + ' '; if (svg) chip.appendChild(svg);
      }
      $$('.v-menu__item', host).forEach(function (x) { x.classList.toggle('is-active', x === el); });
      return { toast: (el.getAttribute('data-what') || 'Changed') + ' to ' + val, body: STATE['ctx.name'] || '' };
    },
    save: function (el) {
      var bar = el.closest('.v-savebar, .v-card');
      var st = bar && $('.v-savebar__state', bar);
      if (st) st.lastChild.textContent = ' All changes saved';
      if (bar) bar.classList.remove('is-dirty');
      return { toast: 'Saved', body: 'Your changes are live.' };
    }
  };

  /* ------------------------------------------------- generic long tail -- */
  // Behaviour for the buttons every screen shares, so none of them is dead.
  function scopeCard(el) { return el.closest('.v-card, section, .v-record, tr, .v-callout') || el.parentNode; }
  function rowOf(el) { return el.closest('tr, .v-record, .v-convitem, [data-card]'); }
  function ico(n) { return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><use href="#' + n + '"/></svg>'; }
  // a menu built on the spot next to its trigger (row ··· and filter chips)
  function popMenu(trigger, html) {
    closeMenus();
    var host = trigger.parentNode, menu = document.createElement('div');
    menu.className = 'v-menu'; menu.setAttribute('role', 'menu'); menu.setAttribute('data-generated', '');
    menu.innerHTML = html; host.appendChild(menu);
    var r = trigger.getBoundingClientRect();
    menu.__host = host; portal(menu); menuOpenedAt = Date.now();
    menu.style.position = 'fixed'; menu.style.zIndex = '60'; menu.style.top = (r.bottom + 4) + 'px';
    menu.style.right = (window.innerWidth - r.right) + 'px'; menu.style.left = 'auto';
    var mh = menu.getBoundingClientRect().height;
    if (r.bottom + 4 + mh > window.innerHeight - 8) menu.style.top = Math.max(8, r.top - 4 - mh) + 'px';
    menu.__trigger = trigger;
    return menu;
  }
  var OPTIONS = {
    status: ['Open', 'Won', 'Lost', 'Archived'], stage: ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation'],
    source: ['WhatsApp', 'Website', 'Phone', 'Email', 'Instagram', 'Walk-in'], owner: ['Anita', 'Rohan', 'Tara', 'Unassigned'],
    channel: ['WhatsApp', 'Email', 'Instagram', 'Messenger', 'Voice'], 'follow-up': ['Overdue', 'Today', 'This week', 'None set'],
    value: ['Under ₹25,000', '₹25,000–₹1,00,000', 'Over ₹1,00,000'], kind: ['Room', 'Package', 'Extra', 'Venue'],
    marketing: ['Subscribed', 'Unsubscribed', 'No consent'], 'last seen': ['Today', 'This week', 'This month', 'Over 3 months']
  };
  Object.assign(ACTIONS, {
    rowmenu: function (el) {
      var row = rowOf(el), who = (el.getAttribute('aria-label') || '').replace(/^More actions( for)?\s*/i, '') || 'this item';
      var html = '<div class="v-menu__label">' + who.replace(/</g, '&lt;') + '</div>' +
        '<button class="v-menu__item" data-do="row-open">' + ico('i-arrow-r') + 'Open</button>' +
        '<button class="v-menu__item" data-do="row-note" data-msg="Editing ' + who.replace(/"/g, '') + '">' + ico('i-note') + 'Edit</button>' +
        '<button class="v-menu__item" data-do="row-note" data-msg="Duplicated ' + who.replace(/"/g, '') + '">' + ico('i-copy') + 'Duplicate</button>' +
        '<div class="v-menu__sep"></div>' +
        '<button class="v-menu__item" data-do="row-remove" data-verb="archived">' + ico('i-archive') + 'Archive</button>' +
        '<button class="v-menu__item v-menu__item--danger" data-do="row-remove" data-verb="deleted">' + ico('i-trash') + 'Delete</button>';
      var m = popMenu(el, html); m.__row = row; m.__who = who;
      return {};
    },
    'row-open': function (el) {
      var m = el.closest('.v-menu'), row = m && m.__row;
      closeMenus();
      if (row) { var t = row.querySelector('[data-open], [data-go]') || (row.hasAttribute('data-open') || row.hasAttribute('data-go') ? row : null);
        if (t) { t.click(); return {}; } }
      return { toast: 'Opened ' + ((m && m.__who) || 'the record'), body: 'Its full record is shown in this module.' };
    },
    'row-note': function (el) { closeMenus(); return { toast: el.getAttribute('data-msg') || 'Done' }; },
    'row-remove': function (el) {
      var m = el.closest('.v-menu'), row = m && m.__row, verb = el.getAttribute('data-verb'), who = (m && m.__who) || 'Item';
      closeMenus();
      if (row) { row.hidden = true; row.setAttribute('data-gone', ''); }
      return { toast: who + ' ' + verb, body: verb === 'archived' ? 'Nothing is deleted; restore it from Archived.' : 'It has been removed.',
               undo: function () { if (row) { row.hidden = false; row.removeAttribute('data-gone'); } } };
    },
    filterchip: function (el) {
      var k = ((el.querySelector('.v-filterchip__k') || el).textContent || '').trim().toLowerCase();
      var opts = OPTIONS[k] || ['Yes', 'No'];
      var html = '<div class="v-menu__label">' + k + '</div><button class="v-menu__item" data-do="chip-pick" data-value="Any">Any</button>' +
        opts.map(function (o) { return '<button class="v-menu__item" data-do="chip-pick" data-value="' + o + '">' + o + '</button>'; }).join('');
      popMenu(el, html); return {};
    },
    'chip-pick': function (el) {
      var m = el.closest('.v-menu'), chip = m && m.__trigger, v = el.getAttribute('data-value');
      closeMenus();
      if (chip) { var vv = chip.querySelector('.v-filterchip__v'); if (vv) vv.textContent = v; chip.classList.toggle('is-set', v !== 'Any'); }
      return { toast: 'Filter: ' + ((chip && (chip.querySelector('.v-filterchip__k') || {}).textContent) || '') + ' ' + v, body: 'The list shows matching records.' };
    },
    edit: function (el) {
      var c = scopeCard(el), f = c && c.querySelector('input, textarea, select');
      if (f) f.focus();
      return { toast: 'Editing', body: 'Change the fields, then save.' };
    },
    dismiss: function (el) {
      // inside a dialog, Cancel / Keep it simply closes the dialog
      var layer = el.closest('.wt-layer');
      if (layer) return { close: layer.getAttribute('data-layer') };
      var c = el.closest('.v-callout, [data-card], .v-record');
      if (c && !el.closest('.v-modal')) { c.hidden = true; return { toast: 'Dismissed', undo: function () { c.hidden = false; } }; }
      return { toast: 'Changes discarded', body: 'Everything is as it was.' };
    },
    copy: function (el) {
      var c = scopeCard(el), v = c && c.querySelector('input, code, .num');
      var t = v ? (v.value || v.textContent) : '';
      try { navigator.clipboard && navigator.clipboard.writeText(t); } catch (e) {}
      return { toast: 'Copied', body: t ? t.slice(0, 60) : 'On your clipboard.' };
    },
    export: function () { return { toast: 'Export started', body: 'A CSV of what is shown downloads in a moment.' }; },
    'test-send': function () { return { toast: 'Test sent to your phone', body: 'It goes to +91 90000 10000 only. No customer receives it.' }; },
    page: function (el) { return { toast: (label(el) || 'Page') + ' page', body: 'This prototype holds one page of data.' }; },
    columns: function () { return { toast: 'Columns', body: 'Choose which columns the table shows; every field stays available.' }; },
    rename: function (el) { var c = scopeCard(el), f = c && c.querySelector('input'); if (f) f.focus(); return { toast: 'Rename', body: 'Type the new name and press Enter.' }; },
    play: function () { return { toast: 'Playing a sample', body: 'Twelve seconds of the selected voice.' }; },
    notify: function () { return { toast: 'We will tell you', body: 'You will get a notification when it is ready.' }; },
    generate: function () { return { toast: 'Generating', body: 'Veerha is drafting it now — usually under a minute. Nothing is published until you approve it.' }; },
    reveal: function (el) {
      var c = scopeCard(el), f = c && c.querySelector('input'); if (f) f.type = f.type === 'password' ? 'text' : 'password';
      return { toast: 'Shown for 30 seconds', body: 'Revealing a secret is logged.' };
    },
    remove: function (el) {
      var r = rowOf(el) || el.closest('.v-card');
      if (r) { r.hidden = true; return { toast: 'Removed', undo: function () { r.hidden = false; } }; }
      return { toast: 'Removed' };
    },
    step: function (el) { return { toast: label(el) === 'Previous' || label(el) === 'Back' ? 'Back a step' : 'Saved — next step', body: 'Each step saves as you go.' }; },
    ack: function (el) { return { toast: el.getAttribute('data-msg') || label(el), body: el.getAttribute('data-body') || '' }; },
    create: function (el) {
      var thing = el.getAttribute('data-ctx-thing') || (label(el) || '').replace(/^(\+\s*)?(New|Add( an?)?|Create)\s*/i, '') || 'item';
      STATE['ctx.thing'] = thing;
      return { open: 'create' };
    },
    openrow: function (el) {
      var row = rowOf(el), t = row && (row.querySelector('[data-open]:not([data-do]), [data-go]') || (row.hasAttribute('data-open') || row.hasAttribute('data-go') ? row : null));
      if (t && t !== el) { t.click(); return {}; }
      return { toast: 'Opened', body: 'The full record for ' + ((row && (row.querySelector('.v-identity__name, .v-record__title, b') || {}).textContent) || 'this item').trim() + '.' };
    },
    'approve-row': function (el) { var r = rowOf(el); if (r) r.hidden = true; return { toast: 'Approved', body: 'It takes effect now.', undo: function () { if (r) r.hidden = false; } }; },
    'reject-row':  function (el) { var r = rowOf(el); if (r) r.hidden = true; return { toast: 'Rejected', body: 'Nothing changes; Veerha keeps today’s behaviour.', undo: function () { if (r) r.hidden = false; } }; },
    checkin: function (el) { return { toast: 'Checked in', body: 'Room keys noted on the booking; the guest gets a welcome message.' }; },
    star: function (el) { var on = el.classList.toggle('is-active'); el.setAttribute('aria-pressed', on); return { toast: on ? 'Starred' : 'Star removed', body: on ? 'It shows first in Starred.' : '' }; },
    reorder: function (el) {
      // the row is the nearest ancestor whose siblings also carry reorder buttons
      var row = el.closest('tr, li, .v-record, .row, [data-card]');
      for (var a = el; !row && a.parentElement; a = a.parentElement) {
        var kids = [].filter.call(a.parentElement.children, function (k) { return k.querySelector('[data-do="reorder"]'); });
        if (kids.length > 1) row = a;
      }
      if (!row) return {};
      var up = /earlier|up$/i.test(el.getAttribute('aria-label') || el.textContent);
      var sib = up ? row.previousElementSibling : row.nextElementSibling;
      if (sib) { if (up) row.parentNode.insertBefore(row, sib); else row.parentNode.insertBefore(sib, row); }
      return { toast: up ? 'Moved earlier' : 'Moved later', body: 'Veerha asks in this order from the next conversation.' };
    },
    'chat-send': function (el) {
      var box = (el.closest('.v-composer, .vs-pane, .v-card') || document).querySelector('input.v-input, textarea.v-input');
      var t = box && (box.value || box.placeholder || ''); if (box && box.value) box.value = '';
      var lab = label(el);
      return { toast: /public/i.test(lab) ? 'Posted publicly' : (/template/i.test(lab) ? 'Template sent' : 'Sent'), body: /DM|privately/i.test(lab) ? 'Sent as a private message.' : 'It is in the thread; Veerha stays paused while you are handling it.' };
    },
    topup: function () { return { toast: 'Payment window', body: 'Razorpay opens over this page — card or UPI. Credits arrive the moment it is paid.' }; },
    'add-item': function (el) { return { toast: 'Added to the sale', body: ((el.querySelector('.t-small') || el).textContent || '').trim().slice(0, 50) }; },
    golive: function () { return { go: 'dashboard', toast: 'Veerha is live', body: 'Mira is answering on WhatsApp. Everything you set can be changed in Settings.' }; },
    'create-done': function () { return { closeAll: true, toast: 'Created: ' + (STATE['ctx.thing'] || 'item'), body: 'It is at the top of the list.' }; }
  });

  function run(name, el) {
    var fn = ACTIONS[name];
    if (!fn) { toast(label(el) || name, 'This action is not wired yet.', 'warn'); return; }
    var before = snapshot();
    var r = fn(el, STATE) || {};
    if (r.close) close(r.close === true ? undefined : r.close);
    if (r.closeAll) closeAll();
    if (r.go) go(r.go, r.view);
    if (r.open) setTimeout(function () { open(r.open, el); }, r.go ? 80 : 0);
    if (r.toast) toast(r.toast, r.body, r.tone, r.undo === false ? null : (r.undo || (r.reversible ? function () { restore(before); } : null)));
    render();
  }

  /* ---------------------------------------------------------- navigation -- */
  function go(id, view) {
    closeAll();
    if (window.wtGo) window.wtGo(id); else location.hash = id;
    if (view) setTimeout(function () { selectView(view); }, 60);
  }
  // A view is a tab in the active screen carrying data-view-tab="key". Items
  // tagged data-views="key other" show when their key is selected; "all" shows
  // everything; [data-view-empty="key"] is that view's empty state.
  function selectView(view, scope) {
    var scr = scope || $('.wt-screen.is-on') || document;
    var t = $('[data-view-tab="' + view + '"]', scr);
    if (t) applyView(t);
  }
  function scopeOf(el) { return el.closest('.wt-screen, .vs-frame') || document; }
  function applyView(tab) {
    var scr = scopeOf(tab), key = tab.getAttribute('data-view-tab');
    $$('[data-view-tab]', scr).forEach(function (x) {
      var on = x.getAttribute('data-view-tab') === key && !x.closest('.v-menu');
      x.classList.toggle('is-active', on);
      if (x.hasAttribute('aria-selected')) x.setAttribute('aria-selected', on);
    });
    var shown = 0;
    $$('[data-views]', scr).forEach(function (it) {
      var ok = key === 'all' || (' ' + it.getAttribute('data-views') + ' ').indexOf(' ' + key + ' ') !== -1;
      it.hidden = !ok || it.hasAttribute('data-gone'); if (!it.hidden) shown++;
    });
    $$('[data-view-empty]', scr).forEach(function (e) { e.hidden = !(e.getAttribute('data-view-empty') === key && !shown); });
    var lbl = $('[data-view-label]', scr);
    if (lbl) lbl.textContent = (tab.getAttribute('data-view-name') || tab.textContent).replace(/\s*\d[\d,]*\s*$/, '').trim();
    STATE['view'] = key;
    // keep the reading pane on something in this view
    var cur = $('[data-thread].is-active', scr);
    if (!cur || cur.hidden) { var first = $('[data-thread]:not([hidden])', scr); if (first) selectThread(first, true); }
  }
  // A thread item carries its content as data-ctx-*; selecting it fills the
  // reading pane and the context panel through data-bind="ctx.…".
  function selectThread(item, quiet) {
    var scr = scopeOf(item);
    $$('[data-thread]', scr).forEach(function (x) { x.classList.toggle('is-active', x === item); });
    takeCtx(item); render();
  }
  function label(el) {
    return (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 48);
  }

  /* ------------------------------------------------------------- wiring -- */
  // Capture phase, so a flow click is handled before behaviour.js's toast and
  // before the walkthrough's own handler; navigation (data-go without a view)
  // is left to the walkthrough, which owns go().
  document.addEventListener('click', function (e) {
    var m = e.target.closest('[data-menu]');
    if (m) {
      e.preventDefault(); e.stopPropagation();
      var menu = m.parentNode && $(':scope > .v-menu', m.parentNode);
      if (menu) {
        var willOpen = menu.hidden;
        closeMenus(willOpen ? menu : null);
        menu.hidden = !willOpen;
        // Escape any scrolling table or card: pin the menu to the trigger on screen.
        if (willOpen) {
          menu.__host = m.parentNode;
          portal(menu);
          menuOpenedAt = Date.now();
          var r = m.getBoundingClientRect(), left = menu.classList.contains('v-menu--left');
          menu.style.position = 'fixed'; menu.style.zIndex = '60';
          menu.style.top = (r.bottom + 4) + 'px';
          if (left) { menu.style.left = r.left + 'px'; menu.style.right = 'auto'; }
          else { menu.style.right = (window.innerWidth - r.right) + 'px'; menu.style.left = 'auto'; }
          var mh = menu.getBoundingClientRect().height;
          if (r.bottom + 4 + mh > window.innerHeight - 8) menu.style.top = Math.max(8, r.top - 4 - mh) + 'px';
        }
        m.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      }
      return;
    }
    if (!e.target.closest('.v-menu')) closeMenus();

    var vt = e.target.closest('[data-view-tab]');
    if (vt) { e.preventDefault(); e.stopPropagation(); closeMenus(); applyView(vt); return; }

    var th = e.target.closest('[data-thread]');
    if (th && !e.target.closest('button:not([data-thread]), a, input')) { e.preventDefault(); selectThread(th); return; }

    var o = e.target.closest('[data-open]');
    if (o) { e.preventDefault(); e.stopPropagation(); closeMenus(); open(o.getAttribute('data-open'), o); return; }

    var d = e.target.closest('[data-do]');
    if (d) { e.preventDefault(); e.stopPropagation(); closeMenus(); run(d.getAttribute('data-do'), d); return; }

    var gv = e.target.closest('[data-go][data-view]');
    if (gv) { e.preventDefault(); e.stopPropagation(); go(gv.getAttribute('data-go'), gv.getAttribute('data-view')); return; }

    var inert = e.target.closest('[data-inert]');
    if (inert) { e.preventDefault(); e.stopPropagation(); toast(label(inert), inert.getAttribute('data-inert'), 'info'); return; }

    // closing a layer: its scrim, its Close button, or a Cancel inside it
    var layer = e.target.closest('.wt-layer');
    if (layer && (e.target.closest('.v-scrim') || e.target.closest('[aria-label="Close"], [data-close]') ||
        /^cancel$/i.test(label(e.target.closest('button') || e.target)))) {
      e.preventDefault(); e.stopPropagation(); close(layer.getAttribute('data-layer')); return;
    }
  }, true);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { if ($('.v-menu:not([hidden])')) closeMenus(); else if (stack.length) { close(); e.stopPropagation(); } }
  }, true);

  // A navigation elsewhere closes any open layer and menu.
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-go]') && !e.target.closest('.wt-layer')) { closeMenus(); }
  });

  // a pinned menu would drift from its trigger on scroll; close it instead
  // (a scroll that is still settling from the click that opened it does not count)
  var menuOpenedAt = 0;
  document.addEventListener('scroll', function () { if (Date.now() - menuOpenedAt > 400) closeMenus(); }, true);

  function boot() {
    render();
    // each screen opens on its default view (the tab drawn as is-active)
    $$('.wt-screen, .vs-frame').forEach(function (scr) {
      var t = $('[data-view-tab].is-active', scr); if (t && !t.closest('.v-menu')) applyView(t);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();

  window.VF = {
    state: STATE, seed: SEED, get: function (k) { return STATE[k]; }, set: set, add: add,
    open: open, close: close, closeAll: closeAll, go: go, toast: toast, render: render,
    applyView: applyView, selectView: selectView, selectThread: selectThread,
    snapshot: snapshot, restore: restore,
    action: function (name, fn) { ACTIONS[name] = fn; }
  };
})();
