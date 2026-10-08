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
    'lead-drawer',
}

RULES = [
    # --- Workstream A and the journeys add their rules here, grouped by screen ---
]
