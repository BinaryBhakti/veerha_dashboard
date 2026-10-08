/* =============================================================================
   VEERHA — journeys
   The state-changing actions behind the main stories. Generic behaviour (layers,
   menus, binding, toasts) is in flows.js; this file only says what each story
   action changes. Every action is reversible from its toast.
   ============================================================================= */
(function () {
  'use strict';
  if (!window.VF) return;
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var S = window.VF.state;

  function hideRows(id) {
    var rows = $$('[data-lead="' + id + '"]');
    rows.forEach(function (r) { r.hidden = true; r.setAttribute('data-gone', ''); });
    return function () { rows.forEach(function (r) { r.hidden = false; r.removeAttribute('data-gone'); }); };
  }

  /* --- A2 · Convert a lead into an opportunity ------------------------------
     Live: conversion works with facts still missing, removes the lead from the
     Leads list, and logs "Converted to opportunity" on the deal. */
  VF.action('convert', function () {
    var before = VF.snapshot();
    var id = S['ctx.lead'] || 'LEAD-0129', name = S['ctx.name'] || 'Arjun Mehta';
    var unhide = hideRows(id);
    VF.add('leads', -1);
    if (id === 'LEAD-0129') { S['arjun.converted'] = true; VF.add('opps', 1); }
    return {
      closeAll: true, go: 'opportunities',
      toast: name + ' is now a deal',
      body: id === 'LEAD-0129' ? 'OPP-0061 · next, build his stay from the deal' : 'It has left the Leads list',
      undo: function () { unhide(); VF.restore(before); }
    };
  });

  /* Review Queue: "fully qualified — convert to a deal?" → Not yet */
  VF.action('not-yet', function (el) {
    var card = el.closest('[data-card]');
    if (card) card.hidden = true;
    return { toast: 'Kept as a lead', body: 'Veerha will ask again when something changes.',
             undo: function () { if (card) card.hidden = false; } };
  });
  /* --- A3 · Customer Mail --------------------------------------------------
     A thread's views live in data-views. Sending moves it from Needs reply to
     Awaiting customer; done and archive take it out of every view. */
  function activeThread(el) {
    var scr = el.closest('.wt-screen, .vs-frame') || document;
    return { scr: scr, th: scr.querySelector('[data-thread].is-active') };
  }
  function retag(th, from, to) {
    var v = ' ' + th.getAttribute('data-views') + ' ';
    if (from) v = v.replace(' ' + from + ' ', ' ');
    if (to && v.indexOf(' ' + to + ' ') === -1) v += to + ' ';
    th.setAttribute('data-views', v.trim());
  }
  function refreshView(scr) {
    var t = scr.querySelector('[data-view-tab].is-active');
    if (t) VF.applyView(t);
  }
  VF.action('mail-send', function (el) {
    var a = activeThread(el), th = a.th; if (!th) return {};
    var before = VF.snapshot(), views = th.getAttribute('data-views');
    var badge = th.querySelector('.v-badge'), oldBadge = badge && badge.outerHTML;
    var name = th.getAttribute('data-ctx-name');
    if (/\bneeds-reply\b/.test(views)) { VF.add('needsReply', -1); VF.add('awaiting', 1); }
    retag(th, 'needs-reply', 'awaiting'); retag(th, 'today', null);
    if (badge) { badge.className = 'v-badge v-badge--neutral'; badge.textContent = 'Sent · awaiting reply'; }
    refreshView(a.scr);
    return { toast: 'Sent to ' + name, body: 'Moved to Awaiting customer',
             undo: function () { th.setAttribute('data-views', views); if (badge) badge.outerHTML = oldBadge; VF.restore(before); refreshView(a.scr); } };
  });
  function clearThread(verb) {
    return function (el) {
      var a = activeThread(el), th = a.th; if (!th) return {};
      var before = VF.snapshot(), views = th.getAttribute('data-views');
      if (/\bneeds-reply\b/.test(views)) VF.add('needsReply', -1);
      if (/\bawaiting\b/.test(views)) VF.add('awaiting', -1);
      th.setAttribute('data-gone', ''); refreshView(a.scr);
      return { toast: verb + ': ' + th.getAttribute('data-ctx-subject'), body: 'Nothing is deleted.',
               undo: function () { th.removeAttribute('data-gone'); VF.restore(before); refreshView(a.scr); } };
    };
  }
  VF.action('mail-done', clearThread('Marked done'));
  VF.action('mail-archive', clearThread('Archived'));
  VF.action('redraft', function (el) {
    var box = (el.closest('.vs-pane') || document).querySelector('textarea[data-bind="ctx.draft"]');
    if (!box) return {};
    var old = box.value;
    box.value = old.split(' — ')[0].split('. ').slice(0, 2).join('. ').replace(/\.?$/, '.') + ' — The team at Rivergrove';
    return { toast: 'Shorter draft', body: 'Rewritten in the same voice. Nothing has been sent.', undo: function () { box.value = old; } };
  });

})();
