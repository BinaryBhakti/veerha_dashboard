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
    'global-dialogs',
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

    # --- Everywhere ('*'): the buttons every screen shares ---------------------------
    ('*', {'exact': 'Documentation'},  'inert:Opens the Veerha help centre in a new tab'),
    ('*', {'exact': 'Support'},        'inert:Opens a chat with Veerha support'),
    ('*', {'cls': 'v-filterchip'},     'do:filterchip'),
    ('*', {'aria': 'More actions'},    'do:rowmenu'),
    ('*', {'aria': 'More'},            'do:rowmenu'),
    ('*', {'exact': 'Edit'},           'do:edit'),
    ('*', 'Edit message',              'do:edit'),
    ('*', 'Edit details',              'do:edit'),
    ('*', {'re': r'^(Cancel|Discard|Keep it|Not now|Dismiss)$'}, 'do:dismiss'),
    ('*', {'re': r'^Save\b'},          'do:save'),
    ('*', {'re': r'^Apply'},           'do:save'),
    ('*', {'re': r'^Send (a )?test'},  'do:test-send'),
    ('*', 'Test run',                  'do:test-send'),
    ('*', {'re': r'^(Next|Previous)$'}, 'do:page'),
    ('*', {'exact': 'Columns'},        'do:columns'),
    ('*', {'re': r'^Copy'},            'do:copy'),
    ('*', {'re': r'^Export'},          'do:export'),
    ('*', {'re': r'^Download'},        'do:export'),
    ('*', {'exact': 'Open'},           'do:openrow'),
    ('*', {'re': r'^Open (the )?calendar'}, 'go:calendar'),
    ('*', {'re': r'^Open (his|her|their) record'}, 'go:customer-record'),
    ('*', {'re': r'^Open (lead|the lead)'}, 'go:leads'),
    ('*', {'re': r'^Open (thread|inbox|the thread)'}, 'go:inbox'),
    ('*', {'re': r'^Open (queue|the queue)'}, 'go:review'),
    ('*', {'exact': 'Ask'},            'inert:Asks Veerha about this guest; the answer appears beside the card'),
    ('*', 'Hear it',                   'do:play'),
    ('*', {'re': r'^Call( now| him now| her now)?$'}, 'open:logcall'),
    ('*', {'re': r'^(WhatsApp|Message|Send message)$'}, 'go:inbox'),
    ('*', {'exact': 'Email'},          'open:compose'),
    ('*', {'exact': 'Meeting'},        'open:meeting'),
    ('*', {'exact': 'Note'},           'open:note'),
    ('*', 'Tell me when',              'do:notify'),
    ('*', {'re': r'^(Re)?[Cc]onnect\b'}, 'inert:Opens the provider’s sign-in to connect this account'),
    ('*', {'exact': 'Set up'},         'inert:Starts the set-up for this extra, step by step'),
    ('*', {'exact': 'Manage'},         'inert:Opens this account’s settings on Connections'),
    ('*', {'exact': 'Rotate'},         'inert:Issues a new key; the old one keeps working for 24 hours'),
    ('*', {'exact': 'Rename'},         'do:rename'),
    ('*', {'re': r'^(Remove|Forget)'}, 'do:remove'),
    ('*', {'re': r'^Delete'},          'do:remove'),
    ('*', {'exact': 'Reveal'},         'do:reveal'),
    ('*', {'re': r'^(Generate|Regenerate)'}, 'do:generate'),
    ('*', {'exact': 'Preview'},        'inert:Shows it as the customer will see it'),
    ('*', {'re': r'^(Schedule|Book a call)$'}, 'open:meeting'),
    ('*', {'re': r'^Book (a |another )?follow-up'}, 'open:followup'),
    ('*', {'exact': 'Reschedule'},     'open:reschedule'),
    ('*', {'re': r'^Assign'},          'open:assign'),
    ('*', {'re': r'^(Approve|Add to learning set|Accept)'}, 'do:approve-row'),
    ('*', {'re': r'^(Reject|Decline)'}, 'do:reject-row'),
    ('*', {'exact': 'Check in'},       'do:checkin'),
    ('*', {'re': r'^(\+\s*)?(New|Add|Create)\b'}, 'do:create'),

    # --- Frame-specific long tail -----------------------------------------------------
    ('inbox-taken', 'Hand back to Veerha', 'do:handback'),
    ('inbox',       'Rewrite',             'do:redraft'),
    ('inbox',       {'re': r'^(Use this|Send)$'}, 'do:chat-send'),
    ('inbox-taken', {'exact': 'Send'},     'do:chat-send'),
    ('inbox-modes', {'re': r'^(Send|Send template|Reply privately by DM|Post public reply)$'}, 'do:chat-send'),
    ('counter',     {'re': r'^Take payment'}, 'go:counter-paid'),
    ('counter',     {'cls': 'v-card'},     'do:add-item'),
    ('counter-paid', {'cls': 'v-card'},    'do:add-item'),
    ('counter',     {'exact': 'Applied'},  'inert:DIWALI10 is applied — 10% off over ₹1,000'),
    ('counter-paid', 'Print receipt',      'inert:Prints the receipt on the counter printer'),
    ('orders-index', 'Open the counter',   'go:counter'),
    ('order-drawer', 'Send a new payment link', 'do:test-send'),
    ('order-drawer', 'Switch to cash on delivery', 'do:save'),
    ('order-drawer', 'Cancel order',       'do:remove'),
    ('setup-golive', {'exact': 'Go live'}, 'do:golive'),
    ('setup-golive', 'Back to review',     'go:onboarding'),
    ('setup-golive', {'exact': 'Continue'}, 'do:step'),
    ('onboarding',  {'exact': 'Send'},     'do:chat-send'),
    ('onboarding',  'Skip',                'go:setup-golive'),
    ('wallet',      'Plan & invoices',     'go:billing'),
    ('billing',     'Open the wallet',     'go:wallet'),
    ('employees',   {'exact': 'Hire'},     'go:hire'),
    ('employees',   'Activity log',        'go:deliveries'),
    ('employee-detail', 'Full log',        'go:deliveries'),
    ('departments', 'Hire an AI employee', 'go:hire'),
    ('departments', 'Org chart',           'go:org-chart'),
    ('rules',       'Entry points',        'go:entry-points'),
    ('automation',  'Entry points',        'go:entry-points'),
    ('developers',  'Open Integrations',   'go:connections'),
    ('states',      'Back to the dashboard', 'go:dashboard'),
    ('channels',    'See the 17 leads',    'go:leads'),
    ('leads-error', 'See affected leads',  'go:leads'),
    ('reviews-done', 'See all',            'go:reviews'),
    ('contacts',    {'exact': 'Import'},   'go:import'),
    ('contact-lists-empty', 'Import a spreadsheet', 'go:import'),
    ('properties',  'List a property',     'go:property-wizard'),
    ('quotes-empty', 'Pick a customer',    'open:new-quote'),
    ('customers',   'Send a campaign',     'go:campaign-builder'),
    ('callbacks-full', 'Call back',        'open:logcall'),
    ('touchpoint-drawer', 'Reply on WhatsApp', 'go:inbox'),
    ('leads-queue', {'re': r'^(Send now|Counter|Review discount)$'}, 'go:review'),
    ('leads-queue', 'Take over',           'go:inbox-taken'),
    ('leads-queue', 'Open menus',          'go:mail'),
    ('employee-detail', {'exact': 'Pause'}, 'inert:Pauses this employee; its open conversations come to you'),
    # --- Everywhere, second pass -------------------------------------------------------
    ('*', {'aria_re': r'^Star this'},      'do:star'),
    ('*', {'re': r'(earlier|later)$'},     'do:reorder'),
    ('*', {'aria_re': r'(earlier|later)$'}, 'do:reorder'),
    ('*', {'re': r'^(Back|Next\b.*|Continue)$'}, 'do:step'),
    ('*', {'re': r'^(Previous|Next) (month|day|week)$'}, 'do:page'),
    ('*', {'re': r'^(Today|‹|›|Prev)$'},   'do:page'),
    ('*', {'re': r'^Top up|^Pay ₹'},       'do:topup'),
    ('*', {'re': r'^(Choose (a )?file|Upload)'}, 'inert:Opens your computer’s file picker'),
    ('*', {'re': r'^(Resend|Send it again|Retry)'}, 'do:test-send'),
    ('*', {'re': r'^(Switch|Resume|Run due steps|Publish|Submit|Finish|Read again|Read it now|Read my listing|Merge)'}, 'do:save'),
    ('*', {'re': r'^(Show|See|Hear) '},    'inert:Expands the full list in place'),
    ('*', {'re': r'→$'},                   'inert:Opens the linked page in Settings'),
    ('*', {'re': r'^(Clear|Undo)'},        'do:dismiss'),
    ('*', {'re': r'^(Duplicate|Replace|Change|Customise|Details|History|Change log|Roles|Talk to sales|Your plan|Reply settings|Filter by|Group by|Heading|Text|Image|Button|Rooms|Divider|Tidy up|Write|Remember|It is safe|Keep only|Let |Choose who|Ask Anita|I already have|Paste|Start from|Build one|Hire one|Open the|Enter spend|Hold my room|Use on|Make another|Search rooms|Retrieve|Test it|Give it|Move to|See what|Update card|Change plan|Manage |Revoke|Invite)'}, 'do:ack'),
    # --- last stragglers ---------------------------------------------------------------
    ('deliveries-failed', {'re': r'^(Fix the number and retry|Fix his number)'}, 'do:edit'),
    ('deliveries-failed', 'Call him instead', 'open:logcall'),
    ('sequences',   'What is the 24-hour rule', 'inert:WhatsApp lets a business send free text only within 24 hours of the customer’s last message; after that, only an approved template'),
    ('knowledge',   'Rewrite in your words', 'do:edit'),
    ('property-detail', 'Edit listing',    'go:property-wizard'),
    ('resource-drawer', {'aria_re': r'^Remove the'}, 'do:remove'),
    ('team',        {'aria_re': r'^Manage '}, 'do:rowmenu'),
    ('fields',      {'exact': 'Archive'},  'do:remove'),
    ('forms',       {'re': r'^(Turn off|Mapping|What this source is for|Notes for the AI)'}, 'do:ack'),
    ('whatsapp-form-builder', 'Preview on a phone', 'inert:Shows the form as it appears inside WhatsApp on a phone'),
    ('wallet',      {'exact': 'Set'},      'do:save'),
    ('contact-lists', {'exact': 'Segments'}, 'go:segments'),
    ('opportunity-drawer', 'Dismiss this proposal', 'do:dismiss'),
    ('reviews',     {'re': r'(Draft ready|Needs you|Answered)'}, 'do:ack'),
    ('resource-drawer', {'exact': 'Close'}, 'go:shared-resources'),
    ('reviews',     'Open on Google',      'inert:Opens this review on your Google Business Profile'),
    ('reviews',     'Post reply publicly', 'do:review-post'),
    ('reviews',     {'exact': 'Rewrite'},  'do:redraft'),
]
