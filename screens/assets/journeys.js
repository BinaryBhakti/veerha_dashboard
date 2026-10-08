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
})();
