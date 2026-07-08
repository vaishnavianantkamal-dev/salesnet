'use strict';

const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  SALES_MANAGER: 'sales_manager',
  SALES_EXECUTIVE: 'sales_executive',
  INSTALLATION_EXECUTIVE: 'installation_executive',
  VIEWER: 'viewer',
};

const LEAD_SOURCES = {
  WHATSAPP: 'whatsapp',
  FACEBOOK: 'facebook',
  GOOGLE: 'google',
  INDIAMART: 'indiamart',
  TRADEINDIA: 'tradeindia',
  JUSTDIAL: 'justdial',
  MANUAL: 'manual',
  REFERRAL: 'referral',
  WEBSITE: 'website',
  OTHER: 'other',
  META_LEAD_ADS: 'meta_lead_ads',
};

const LEAD_STAGES = {
  NEW: 'new',
  CONTACTED: 'contacted',
  QUALIFIED: 'qualified',
  PROPOSAL: 'proposal',
  NEGOTIATION: 'negotiation',
  WON: 'won',
  LOST: 'lost',
  JUNK: 'junk',
};

const LEAD_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DELETED: 'deleted',
};

const TEMPERATURES = {
  HOT: 'hot',
  WARM: 'warm',
  COLD: 'cold',
};

const PERMISSIONS = {
  LEADS_CREATE: 'leads:create',
  LEADS_READ: 'leads:read',
  LEADS_UPDATE: 'leads:update',
  LEADS_DELETE: 'leads:delete',
  LEADS_ASSIGN: 'leads:assign',
  USERS_CREATE: 'users:create',
  USERS_READ: 'users:read',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',
  ROLES_CREATE: 'roles:create',
  ROLES_READ: 'roles:read',
  ROLES_UPDATE: 'roles:update',
  ROLES_DELETE: 'roles:delete',
  REPORTS_VIEW: 'reports:view',
  REPORTS_EXPORT: 'reports:export',
  SETTINGS_MANAGE: 'settings:manage',
  INTEGRATIONS_MANAGE: 'integrations:manage',
  CONVERSATIONS_READ: 'conversations:read',
  CONVERSATIONS_SEND: 'conversations:send',
  ACTIVITIES_CREATE: 'activities:create',
  ACTIVITIES_READ: 'activities:read',
};

const ALL_PERMISSIONS = Object.values(PERMISSIONS);

const CHANNELS = {
  WHATSAPP: 'whatsapp',
  FACEBOOK: 'facebook',
  INSTAGRAM: 'instagram',
  INDIAMART: 'indiamart',
  EMAIL: 'email',
  SMS: 'sms',
  CALL: 'call',
  IN_APP: 'in_app',
};

const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  DOCUMENT: 'document',
  AUDIO: 'audio',
  VIDEO: 'video',
  TEMPLATE: 'template',
};

const DELIVERY_STATUS = {
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed',
};

const ACTIVITY_TYPES = {
  CALL: 'call',
  EMAIL: 'email',
  MEETING: 'meeting',
  NOTE: 'note',
  STATUS_CHANGE: 'status_change',
  ASSIGNMENT: 'assignment',
  SCORE_UPDATE: 'score_update',
  MESSAGE_SENT: 'message_sent',
};

const SCORING_EVENTS = {
  LEAD_CREATED: 'lead_created',
  LEAD_CONTACTED: 'lead_contacted',
  MEETING_SCHEDULED: 'meeting_scheduled',
  PROPOSAL_SENT: 'proposal_sent',
  FOLLOW_UP: 'follow_up',
  WHATSAPP_REPLIED: 'whatsapp_replied',
  EMAIL_OPENED: 'email_opened',
  DEMO_DONE: 'demo_done',
};

module.exports = {
  ROLES,
  LEAD_SOURCES,
  LEAD_STAGES,
  LEAD_STATUS,
  TEMPERATURES,
  PERMISSIONS,
  ALL_PERMISSIONS,
  CHANNELS,
  MESSAGE_TYPES,
  DELIVERY_STATUS,
  ACTIVITY_TYPES,
  SCORING_EVENTS,
};
