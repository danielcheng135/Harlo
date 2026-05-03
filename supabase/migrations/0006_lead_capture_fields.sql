alter table bots
  add column if not exists lead_capture_fields jsonb not null default '[
    {"key":"name","label":"Name","type":"text","required":true,"enabled":true,"prompt":"What is your name?"},
    {"key":"email","label":"Email","type":"email","required":true,"enabled":true,"prompt":"What email should the team use to follow up?"},
    {"key":"phone","label":"Phone","type":"phone","required":false,"enabled":false,"prompt":"What phone number should the team use?"},
    {"key":"company","label":"Company","type":"text","required":false,"enabled":false,"prompt":"What company are you with?"},
    {"key":"service_needed","label":"Service needed","type":"text","required":false,"enabled":false,"prompt":"What service are you interested in?"},
    {"key":"property_size","label":"Property size","type":"text","required":true,"enabled":true,"prompt":"What is the property size?"},
    {"key":"preferred_date","label":"Preferred date","type":"date","required":true,"enabled":true,"prompt":"What date works best?"},
    {"key":"budget","label":"Budget","type":"text","required":false,"enabled":false,"prompt":"Do you have a budget range in mind?"}
  ]'::jsonb;
