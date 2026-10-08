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
    if (!box) return { toast: 'Shorter draft', body: 'Rewritten in the same voice. Nothing has been sent.' };
    var old = box.value;
    box.value = old.split(' — ')[0].split('. ').slice(0, 2).join('. ').replace(/\.?$/, '.') + ' — The team at Rivergrove';
    return { toast: 'Shorter draft', body: 'Rewritten in the same voice. Nothing has been sent.', undo: function () { box.value = old; } };
  });

  /* --- Lead action dialogs (02-leads #2d) ----------------------------------- */
  function who() { return S['ctx.name'] || 'this lead'; }
  function simple(title, body, extra) {
    return function (el) {
      var before = VF.snapshot();
      if (extra) extra();
      return { closeAll: true, toast: title.replace('{who}', who()), body: body,
               undo: function () { VF.restore(before); } };
    };
  }
  VF.action('logcall',  simple('Call with {who} logged', 'Added to the activity. Next step booked for tomorrow at 11:00.'));
  VF.action('followup', simple('Follow-up booked with {who}', 'It is in Tasks and on the Calendar.', function () { VF.add('tasks', 1); }));
  VF.action('meeting',  simple('Meeting booked with {who}', 'Invite sent on WhatsApp. It is on the Calendar.'));
  VF.action('note',     simple('Note added to {who}', 'Pinned to the top of the lead.'));
  VF.action('assign',   simple('{who} assigned', 'The new owner has been told.'));
  VF.action('sequence', simple('{who} is on Lead nurture', 'First step tomorrow at 10:00. It stops when they reply.'));
  function removeLead(verb) {
    return function () {
      var before = VF.snapshot(), id = S['ctx.lead'], unhide = id ? hideRows(id) : function () {};
      VF.add('leads', -1);
      return { closeAll: true, toast: who() + ' ' + verb, body: verb === 'archived' ? 'Restore it from Leads › Archived.' : 'Their history has been removed.',
               undo: function () { unhide(); VF.restore(before); } };
    };
  }
  VF.action('archive-lead', removeLead('archived'));
  VF.action('delete-lead',  removeLead('deleted'));

  /* --- J5 Review Queue and J7 Tasks (07-queues) ----------------------------- */
  function card(id) { return id ? document.querySelector('.wt-screen [data-card="' + id + '"]') || document.querySelector('[data-card="' + id + '"]') : null; }
  function settle(keys, title, body) {
    return function (el) {
      var id = el.getAttribute('data-ctx-card') || S['ctx.card'];
      var c = card(id), before = VF.snapshot();
      if (c) { c.hidden = true; c.setAttribute('data-gone', ''); }
      keys.forEach(function (k) { VF.add(k, -1); });
      var what = el.getAttribute('data-ctx-what') || el.getAttribute('data-ctx-task') || S['ctx.what'] || S['ctx.task'] || '';
      return { closeAll: true, toast: title.replace('{what}', what), body: body,
               undo: function () { if (c) { c.hidden = false; c.removeAttribute('data-gone'); } VF.restore(before); } };
    };
  }
  VF.action('approve',        settle(['waiting', 'reviewOpen'], 'Approved: {what}', 'Sent exactly as shown, and logged in Deliveries and on the lead.'));
  VF.action('approve-edited', settle(['waiting', 'reviewOpen'], 'Sent with your edit: {what}', 'Your change is a suggestion in Learning.'));
  VF.action('counter',        settle(['waiting', 'reviewOpen'], 'Counter-offer sent', 'Veerha told him ₹26,400 is the best weekday rate.'));
  VF.action('refuse',         settle(['waiting', 'reviewOpen'], 'Refused: {what}', 'Nothing was sent. The thread is back with you.'));
  VF.action('task-done',      settle(['tasks'], 'Done: {what}', 'It has left your list.'));
  VF.action('task-reschedule', settle([], 'Rescheduled: {what}', 'Moved to tomorrow at 11:00. The customer has been told.'));
  VF.action('task-new', function () {
    var before = VF.snapshot(); VF.add('tasks', 1);
    return { closeAll: true, toast: 'Task added', body: 'Send Priya the group rate sheet · today 6:00 PM', undo: function () { VF.restore(before); } };
  });
  VF.action('approve-safe', function (el) {
    var scr = el.closest('.wt-screen, .vs-frame') || document, before = VF.snapshot(), done = [];
    Array.prototype.forEach.call(scr.querySelectorAll('[data-card] [data-do="approve"]'), function (b) {
      var c = b.closest('[data-card]');
      if (c && !c.hidden && !/v-record--(danger|warn)/.test(c.className)) { c.hidden = true; c.setAttribute('data-gone', ''); done.push(c); VF.add('waiting', -1); VF.add('reviewOpen', -1); }
    });
    return { toast: done.length ? 'Approved ' + done.length + ' safe item' + (done.length > 1 ? 's' : '') : 'Nothing safe to approve',
             body: done.length ? 'Items above a limit still wait for you.' : 'Every open item is above a limit or policy.',
             undo: function () { done.forEach(function (c) { c.hidden = false; c.removeAttribute('data-gone'); }); VF.restore(before); } };
  });

  /* --- J2 Opportunity drawer and its dialogs (03-opportunities #4b) --------- */
  function oppRows() { return Array.prototype.slice.call(document.querySelectorAll('[data-open="opportunity"][data-ctx-opp="' + S['ctx.opp'] + '"]')); }
  function closeDeal(verb, body, count) {
    return function () {
      var before = VF.snapshot(), rows = oppRows();
      rows.forEach(function (r) { r.hidden = true; r.setAttribute('data-gone', ''); });
      if (count) VF.add('opps', -1);
      if (S['ctx.opp'] === 'OPP-0061' && verb === 'won') S['arjun.won'] = true;
      return { closeAll: true, toast: (S['ctx.name'] || 'The deal') + ' — ' + verb, body: body,
               undo: function () { rows.forEach(function (r) { r.hidden = false; r.removeAttribute('data-gone'); }); VF.restore(before); } };
    };
  }
  VF.action('mark-won',     closeDeal('won', 'The booking is created and the stay page has gone to the guest.', true));
  VF.action('mark-lost',    closeDeal('lost', 'Reason recorded. They are on a gentle nurture sequence.', true));
  VF.action('archive-deal', closeDeal('archived', 'Restore it from Opportunities › Archived.', true));
  VF.action('delete-deal',  closeDeal('deleted', 'The customer and their conversations stay.', true));
  VF.action('followup-cancel', simple('Follow-up cancelled', 'Veerha will not chase on that date.'));

  /* --- J3 Quotation (04-quotes #6c) ------------------------------------------ */
  VF.action('quote-send', function () {
    var before = VF.snapshot();
    S['quote.sent'] = true; VF.add('quotesAwaiting', 1);
    return { closeAll: true, go: 'quotes', toast: 'QT-0105 sent to Priya Nair', body: 'You will see when she opens it.',
             undo: function () { VF.restore(before); } };
  });

  /* --- J4 Take over and hand back (06 inbox) --------------------------------- */
  VF.action('takeover', function () {
    var before = VF.snapshot(); S['arjun.taken'] = true;
    return { toast: 'You are handling Arjun’s conversation', body: 'Veerha’s automation is paused until you hand it back.', undo: function () { VF.restore(before); } };
  });
  VF.action('handback', function () {
    var before = VF.snapshot(); S['arjun.taken'] = false;
    return { toast: 'Handed back to Veerha', body: 'It picks up from your last message.', undo: function () { VF.restore(before); } };
  });
  VF.action('compose-send', simple('Sent to Ishaan Varma', 'From stay@rivergrove.example.com. The reply lands in Customer Mail.'));
  VF.action('stay-send', function () {
    var before = VF.snapshot(); VF.add('waiting', 1); VF.add('reviewOpen', 1);
    return { closeAll: true, toast: 'Stay page ready for Arjun', body: 'Over the auto-send limit, so it is in the Review Queue for your approval first.', undo: function () { VF.restore(before); } };
  });
  VF.action('save-draft', simple('Saved as a draft', 'Nothing has been sent.'));

  /* --- J9 Add a lead (02-leads #2d) ------------------------------------------ */
  VF.action('lead-new', function () {
    var before = VF.snapshot(); S['lead.added'] = true; VF.add('leads', 1); VF.add('leadsNew', 1);
    return { closeAll: true, go: 'leads', toast: 'Ishaan Varma added', body: 'LEAD-0134 · Veerha will reply within the minute.', undo: function () { VF.restore(before); } };
  });

  /* --- J1 Start my day: walk the Suggested order ------------------------------ */
  var WALK = [
    ['review',      'Approve the quote for Arjun', '2 min'],
    ['tasks',       'Clear 5 overdue call confirmations', '11 min'],
    ['inbox-taken', 'Take over Priya — she asked for a person', '6 min'],
    ['channels',    'Reconnect WhatsApp Business', '4 min']
  ];
  var bar = null;
  function showWalk(i) {
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'v-card';
      bar.setAttribute('role', 'status');
      bar.style.cssText = 'position:fixed;left:50%;top:64px;transform:translateX(-50%);z-index:55;display:flex;align-items:center;gap:var(--s-3);padding:var(--s-3) var(--s-4);box-shadow:var(--e3)';
      document.body.appendChild(bar);
    }
    if (i >= WALK.length) { bar.remove(); bar = null; VF.toast('Your day is clear', 'All four suggested items are done.', 'ok'); return; }
    var w = WALK[i];
    bar.innerHTML = '';
    var t = document.createElement('span'); t.className = 'label'; t.textContent = 'Start my day · ' + (i + 1) + ' of ' + WALK.length; bar.appendChild(t);
    var n = document.createElement('b'); n.className = 't-small'; n.textContent = w[1]; bar.appendChild(n);
    var m = document.createElement('span'); m.className = 't-meta muted'; m.textContent = w[2]; bar.appendChild(m);
    var nx = document.createElement('button'); nx.className = 'v-btn v-btn--primary v-btn--sm'; nx.textContent = i + 1 < WALK.length ? 'Next' : 'Finish';
    nx.addEventListener('click', function (e) { e.stopPropagation(); showWalk(i + 1); if (i + 1 < WALK.length) VF.go(WALK[i + 1][0]); });
    var st = document.createElement('button'); st.className = 'v-btn v-btn--ghost v-btn--sm'; st.textContent = 'Stop';
    st.addEventListener('click', function (e) { e.stopPropagation(); bar.remove(); bar = null; });
    bar.appendChild(nx); bar.appendChild(st);
  }
  VF.action('start-day', function () { showWalk(0); return { go: WALK[0][0] }; });

  /* --- Google Reviews (06 #81) ------------------------------------------------ */
  VF.action('review-post', function (el) {
    var scr = el.closest('.wt-screen, .vs-frame') || document;
    var item = scr.querySelector('button[aria-current="true"]'), badge = item && item.querySelector('.v-badge'), old = badge && badge.outerHTML;
    if (badge) { badge.className = 'v-badge v-badge--ok'; badge.textContent = 'Answered'; }
    return { toast: 'Reply posted on Google', body: 'It shows publicly under Meghna S.’s review.', undo: function () { if (badge) badge.outerHTML = old; } };
  });

})();
