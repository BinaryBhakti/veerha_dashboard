# -*- coding: utf-8 -*-
"""What every button does, as data. tools/wire.py writes it onto the frames;
screens/assets/flows.js makes it happen in the walkthrough.

A rule is (frame id or '*', how to find the control, action):

  find:   'Label text'            a <button>/<a> whose visible text starts with it
          {'aria': 'More actions'} by aria-label prefix
  action: 'go:screen'             navigate
          'go:screen?view=key'    navigate and select a view tab
          'open:layer'            open a modal / drawer / dialog
          'do:action'             state change, defined in flows.js or assets/journeys.js
          'menu'                  toggle the .v-menu beside it
          'inert:reason'          explained, not wired (opens something outside Veerha)

Frame-specific rules win over '*' rules. A button already carrying a hand-written
data-go / data-open / data-do / data-menu / data-inert is left alone, so a frame
can be wired in its own markup when that is clearer.
"""

# Frames that exist only to show a layer. Their overlay (marked data-layer) is
# lifted into the walkthrough's layer stack and the frame is not a screen.
LAYER_ONLY = {
    'lead-drawer', 'lead-convert', 'lead-dialogs', 'queue-dialogs',
    'opportunity-drawer', 'opp-dialogs', 'quote-dialogs', 'conv-dialogs', 'stay-dialogs',
}

# Frames that show a state for the design sheet only (the walkthrough reaches the
# same state live, through data-when / data-unless).
SHEET_ONLY = {
    'lead-converted',
}

RULES = [
    # --- Dashboard (01-home) -----------------------------------------------------
    ('dashboard', 'Start my day',      'do:start-day'),
    ('dashboard', 'Add lead',          'open:new-lead'),
    ('dashboard', 'WhatsApp',          'go:inbox'),
    ('dashboard', 'Email',             'open:compose'),
    ('dashboard', 'Schedule meeting',  'open:meeting'),
    ('dashboard', 'Generate quote',    'open:new-quote'),
    ('dashboard', 'Create opportunity', 'go:leads'),
    ('dashboard', 'Create task',       'open:new-task'),
    ('dashboard', {'exact': 'More'},   'inert:More quick actions — log a call, add a note, import a list'),
    # --- Leads (02-leads) ---------------------------------------------------------
    ('leads', 'New lead',    'open:new-lead'),
    ('leads', 'Import',      'go:import'),
    ('leads', 'Auto-assign', 'inert:Shares new leads across the team by round-robin, set in Team'),
    ('leads', 'Columns',     'inert:Chooses which columns the table shows'),
    # --- Stay workspace (03 proposal) ------------------------------------------------
    ('proposal', 'Create link',      'open:stay-link'),
    ('proposal', 'Save as draft',    'do:save-draft'),
    ('proposal', 'Preview as guest', 'inert:Opens the Stay page as the guest will see it (guest pages, frame 70)'),
    # --- Opportunity drawer (03-opportunities) ---------------------------------
    ('opportunity-drawer', 'WhatsApp',          'go:inbox'),
    ('opportunity-drawer', 'Call',              'open:logcall'),
    ('opportunity-drawer', 'Email',             'go:mail'),
    ('opportunity-drawer', 'Meeting',           'open:meeting'),
    ('opportunity-drawer', 'Note',              'open:note'),
    ('opportunity-drawer', 'Build a quotation', 'open:new-quote'),
    ('opportunity-drawer', 'Send another',      'go:proposal'),
    ('opportunity-drawer', 'Mark won',          'open:mark-won'),
    ('opportunity-drawer', 'Mark lost',         'open:mark-lost'),
    ('opportunity-drawer', 'Archive deal',      'open:confirm-archive-deal'),
    ('opportunity-drawer', 'Delete deal',       'open:confirm-delete-deal'),
    ('opportunity-drawer', 'Book a follow-up',  'open:followup'),
    ('opportunity-drawer', 'Book another',      'open:followup'),
    ('opportunity-drawer', 'Set a date',        'open:followup'),
    ('opportunity-drawer', 'Reschedule',        'open:reschedule'),
    ('opportunity-drawer', 'Call him now',      'open:logcall'),
    ('opportunity-drawer', 'Open follow-ups',   'go:tasks'),
    ('opportunity-drawer', 'Send message',      'go:inbox'),
    ('opportunity-drawer', {'exact': 'Cancel'}, 'do:followup-cancel'),
    ('opportunity-drawer', 'Edit',              'inert:Opens the deal’s details for editing — value, dates and owner'),
    ('opportunity-drawer', 'Show all',          'inert:Expands the full list of customer details'),
    # --- Workstream A and the journeys add their rules here, grouped by screen ---
]
