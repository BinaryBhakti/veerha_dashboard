# -*- coding: utf-8 -*-
"""The product's information architecture, as data. tools/shell.py reads it.

Mirrors the live app as crawled on 7 Oct 2026 (Hotels edition, owner role) and
the client's sitemap of 2 Oct. There are three navigation shapes:

  NAV    the sidebar — where work arrives
  TABS   top tabs, where a sidebar row has 2-4 peers
  RAILS  a grouped section rail, where a row has too many destinations for tabs

FRAME_IA places every frame that has an app shell. A shell frame missing from it
fails `shell.py --check`: guessing a frame's place from its breadcrumb is how
the old shell ended up with Analytics, Billing and Workflows as sidebar rows.
"""

# ---- sidebar ----------------------------------------------------------------
# (label, icon, badge key, editions, hidden_for)
#   badge key  -> navBadges in screens/assets/data.js
#   editions   -> None = every edition; otherwise the editions that have the row
#   hidden_for -> roles that do not see the row (the live app hides Front Desk
#                 from owner and admin, who see the same arrivals on Bookings)
NAV = [
    ('Workspace',  [('Dashboard',     'i-grid',   None,     None, ())]),
    ('Customer',   [('Leads',         'i-target', None,     None, ()),
                    ('Opportunities', 'i-trend',  None,     None, ()),
                    ('Quotations',    'i-file',   None,     None, ()),
                    ('Customers',     'i-users',  None,     None, ()),
                    ('Conversations', 'i-msg',    None,     None, ())]),
    ('Operations', [('Bookings',      'i-bed',    None,     ('hotels',), ()),
                    ('Front Desk',    'i-bed',    None,     ('hotels',), ('Owner', 'Admin')),
                    ('Counter',       'i-file',   None,     ('ecommerce',), ()),
                    ('Orders',        'i-file',   None,     ('ecommerce',), ()),
                    ('Tasks',         'i-check',  'tasks',  None, ()),
                    ('Review Queue',  'i-alert',  'review', None, ()),
                    ('Calendar',      'i-cal',    None,     None, ())]),
    ('Growth',     [('Marketing',     'i-wand',   None,     None, ())]),
    ('System',     [('Settings',      'i-gear',   None,     None, ())]),
]
BADGES = {'tasks': '10', 'review': '20'}          # = navBadges in data.js

# ---- personas -----------------------------------------------------------------
PERSONAS = {
    'owner':   {'name': 'Anita', 'role': 'Owner',   'initial': 'A', 'edition': 'hotels',
                'org': 'Rivergrove'},
    'desk':    {'name': 'Rohan', 'role': 'Manager', 'initial': 'R', 'edition': 'hotels',
                'org': 'Rivergrove'},
    'shop':    {'name': 'Neha',  'role': 'Owner',   'initial': 'N', 'edition': 'ecommerce',
                'org': 'Riverbank Organics'},
}

# ---- top tabs -------------------------------------------------------------------
TABS = {
    'dashboard':     ['Today', 'Analytics'],
    'conversations': ['Chat', 'Customer Mail', 'Callbacks', 'Google Reviews'],
    'customers':     ['Customers', 'Touchpoints'],
}

# ---- section rails ------------------------------------------------------------------
# Item tuples are (label, editions). Verbatim from the live rails.
H, E = ('hotels',), ('ecommerce',)
RAILS = {
    'marketing': ('Marketing', [
        ('Outbound', [('Campaigns', None), ('Segments', None), ('Contact Lists', None),
                      ('Contacts', None), ('Import', None), ('Recommendations', None)]),
        ('Content',  [('Email', None), ('Creative', None), ('Photo Studio', E),
                      ('Landing Pages', None)]),
        ('Capture',  [('Widget', None)]),
        ('Measure',  [('Attribution', None)]),
    ]),
    'settings': ('Settings', [
        ('Workspace', [('Branding & Localization', None), ('Team', None), ('Setup Guide', None),
                       ('Org', None), ('Departments', None), ('Fields', None), ('Forms', None),
                       ('Booking Links', None)]),
        ('Accounts',  [('Billing', None), ('Wallet', None), ('Grow', None)]),
        ('AI',        [('Teach Veerha', None), ('Behaviour', None), ('Calling', None),
                       ('Knowledge', None), ('Memory', None), ('Learning', None),
                       ('AI Employees', None), ('Hire', None)]),
        ('Products & Services', [('Products & Services', None), ('AI synonyms', None),
                       ('Pricing', None), ('Shared Resources', H), ('Properties', H)]),
        ('Sales',     [('Lead Stages', None), ('Working hours', None)]),
        ('Automation', [('Rules', None), ('Occasions', None), ('Sequences', None),
                        ('Entry points', None), ('Workflows', None), ('Deliveries', None)]),
        ('Integrations', [('Connections', None), ('Status & test', None),
                          ('WhatsApp Templates', None), ('WhatsApp Forms', None)]),
        ('Developers', [('API & webhooks', None)]),
    ]),
}

# ---- where each frame sits ----------------------------------------------------------
# id: dict(row=sidebar row, crumb=(root, leaf), tabs=(key, active),
#          rail=(key, active), persona=key)
# Frames with an in-page step or form nav (wizards) and full-bleed panes frames
# (inbox, builders) carry no section rail: the work fills the screen.
def F(row, root, leaf=None, tabs=None, rail=None, persona='owner'):
    return {'row': row, 'crumb': (root, leaf or row), 'tabs': tabs, 'rail': rail,
            'persona': persona}

def S(item, row='Settings'):            # a Settings-rail page
    return F(row, 'Settings', item, rail=('settings', item))

def M(item):                            # a Marketing-rail page
    return F('Marketing', 'Marketing', item, rail=('marketing', item))

def Snorail(item):                      # a Settings page that fills the screen
    return F('Settings', 'Settings', item)

FRAME_IA = {
    # 01 home
    'dashboard':          F('Dashboard', 'Workspace', 'Dashboard', tabs=('dashboard', 'Today')),
    'dashboard-loading':  F('Dashboard', 'Workspace', 'Dashboard', tabs=('dashboard', 'Today')),
    'analytics':          F('Dashboard', 'Workspace', 'Analytics', tabs=('dashboard', 'Analytics')),
    # 02 leads
    'leads':        F('Leads', 'Customer'),
    'lead-drawer':  F('Leads', 'Customer'),
    'leads-queue':  F('Leads', 'Customer'),
    'leads-empty':  F('Leads', 'Customer'),
    'leads-error':  F('Leads', 'Customer'),
    'contacts':     M('Contacts'),
    'segments':     M('Segments'),
    'import':       M('Import'),
    'capture':      M('Widget'),
    # 03 opportunities
    'opportunities':      F('Opportunities', 'Customer'),
    'pipeline':           F('Opportunities', 'Customer'),
    'opportunity-drawer': F('Opportunities', 'Customer'),
    'proposal':           F('Opportunities', 'Customer', 'Stay workspace'),
    # 04 quotes
    'quotes':       F('Quotations', 'Customer'),
    'quotes-empty': F('Quotations', 'Customer'),
    # 05 bookings
    'bookings':       F('Bookings', 'Operations'),
    'booking-detail': F('Bookings', 'Operations', 'Booking'),
    'front-desk':     F('Front Desk', 'Operations', persona='desk'),
    # 06 conversations
    'inbox':        F('Conversations', 'Customer', 'Chat', tabs=('conversations', 'Chat')),
    'inbox-taken':  F('Conversations', 'Customer', 'Chat', tabs=('conversations', 'Chat')),
    'mail':         F('Conversations', 'Customer', 'Customer Mail',
                      tabs=('conversations', 'Customer Mail')),
    'channels':     S('Status & test'),
    'templates':    Snorail('WhatsApp Templates'),
    'email-studio': F('Marketing', 'Marketing', 'Email'),
    # 07 queues
    'tasks':             F('Tasks', 'Operations'),
    'review':            F('Review Queue', 'Operations'),
    'callbacks':         F('Conversations', 'Customer', 'Callbacks',
                           tabs=('conversations', 'Callbacks')),
    'callbacks-full':    F('Conversations', 'Customer', 'Callbacks',
                           tabs=('conversations', 'Callbacks')),
    'mail-empty':        F('Conversations', 'Customer', 'Customer Mail',
                           tabs=('conversations', 'Customer Mail')),
    'touchpoints':       F('Customers', 'Customer', 'Touchpoints', tabs=('customers', 'Touchpoints')),
    'touchpoint-drawer': F('Customers', 'Customer', 'Touchpoints', tabs=('customers', 'Touchpoints')),
    # 08 calendar
    'calendar':            F('Calendar', 'Operations'),
    'hours':               S('Working hours'),
    'booking-links':       S('Booking Links'),
    'booking-links-empty': S('Booking Links'),
    # 09 customers
    'customers':       F('Customers', 'Customer', 'Customers', tabs=('customers', 'Customers')),
    'customer-record': F('Customers', 'Customer', 'Customer profile', tabs=('customers', 'Customers')),
    # 10 campaigns
    'recommendations':  M('Recommendations'),
    'campaign-builder': M('Campaigns'),
    'sequences':        S('Sequences'),
    'landing-pages':    M('Landing Pages'),
    'creative-studio':  M('Creative'),
    'attribution':      M('Attribution'),
    # 11 ai
    'employees':         S('AI Employees'),
    'workflow':          Snorail('Workflows'),
    'workflows':         S('Workflows'),
    'employee-new':      Snorail('AI Employees'),
    'hire':              S('Hire'),
    'knowledge':         S('Knowledge'),
    'memory':            S('Memory'),
    'calling':           S('Calling'),
    'deliveries':        S('Deliveries'),
    'deliveries-failed': S('Deliveries'),
    # 12 catalog
    'catalogs':         S('Products & Services'),
    'property-wizard':  Snorail('Properties'),
    'properties':       S('Properties'),
    'shared-resources': S('Shared Resources'),
    'resource-drawer':  S('Shared Resources'),
    'pricing':          S('Pricing'),
    'pricing-empty':    S('Pricing'),
    # 13 org
    'org-chart':   S('Org'),
    'org-empty':   S('Org'),
    'team':        S('Team'),
    'onboarding':  S('Setup Guide'),
    'setup-golive': S('Setup Guide'),
    'departments': S('Departments'),
    # 14 settings
    'brand':            S('Branding & Localization'),
    'brand-localization': S('Branding & Localization'),
    'brand-tax':        S('Branding & Localization'),
    'brand-storage':    S('Branding & Localization'),
    'brand-access':     S('Branding & Localization'),
    'ai-behaviour':     S('Behaviour'),
    'states':           F('Settings', 'Settings', 'No permission'),
    'fields':           S('Fields'),
    'fields-profiles':  S('Fields'),
    'fields-changelog': S('Fields'),
    'forms':            S('Forms'),
    'automation':       S('Lead Stages'),
    'rules':            S('Rules'),
    'connections':      S('Connections'),
    'developers':       S('API & webhooks'),
    'developers-empty': S('API & webhooks'),
    # 15 billing
    'billing':       S('Billing'),
    'billing-empty': S('Billing'),
    'wallet':        S('Wallet'),
    'wallet-low':    S('Wallet'),
}


def go_targets():
    """Where each nav item leads in the walkthrough: the first frame placed there.
    Shared by shell.py (which writes data-go / data-rail) and wtgen.py (whose
    META must name the same keys, or the active sidebar row never lights)."""
    row, rail, tab = {}, {}, {}
    for fid, ia in FRAME_IA.items():
        row.setdefault(ia['row'], fid)
        if ia['rail']: rail.setdefault(ia['rail'], fid)
        if ia['tabs']: tab.setdefault(ia['tabs'], fid)
    row.update({'Dashboard': 'dashboard', 'Conversations': 'inbox', 'Customers': 'customers',
                'Marketing': 'campaign-builder', 'Settings': 'brand'})
    return row, rail, tab
