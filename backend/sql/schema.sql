create table if not exists users (
  user_id       text primary key,
  email         text not null unique,
  password_hash text,
  name          text not null,
  role          text not null check (role in ('buyer','supplier','admin')),
  company       text,
  picture       text,
  auth_provider text not null default 'local',
  created_at    timestamptz not null default now()
);

create table if not exists files (
  file_id           text primary key,
  user_id           text not null references users(user_id) on delete cascade,
  storage_path      text not null,
  storage_provider  text not null check (storage_provider in ('s3','local')),
  original_filename text not null,
  content_type      text,
  size              bigint not null default 0,
  doc_type          text not null default 'general',
  is_deleted        boolean not null default false,
  created_at        timestamptz not null default now()
);
create index if not exists files_user_id_idx on files(user_id);

create table if not exists buyer_intakes (
  intake_id        text primary key,
  user_id          text references users(user_id) on delete cascade,
  company_name     text not null,
  contact_name     text not null,
  contact_email    text not null,
  contact_phone    text,
  country          text not null,
  product_category text not null,
  product_specs    text not null,
  annual_volume    text not null,
  target_price     text,
  timeline         text not null,
  pain_points      text,
  additional_notes text,
  status           text not null default 'new',
  created_at       timestamptz not null default now()
);
create index if not exists buyer_intakes_user_id_idx on buyer_intakes(user_id);
create index if not exists buyer_intakes_created_at_idx on buyer_intakes(created_at desc);

create table if not exists supplier_applications (
  application_id               text primary key,
  user_id                      text not null references users(user_id) on delete cascade,
  company_name                 text not null,
  headquarters_address         text,
  year_established             text,
  contact_name                 text not null,
  contact_position             text,
  contact_email                text not null,
  contact_phone                text not null,
  additional_contact_name      text,
  additional_contact_position  text,
  additional_contact_email     text,
  additional_contact_phone     text,
  country                      text not null,
  state                        text,
  iec_number                   text,
  gst_number                   text,
  company_overview             text,
  annual_revenue               text,
  key_markets                  text,
  notable_clients              text,
  case_studies                 text,
  languages_spoken             text,
  preferred_communication      text,
  special_capabilities         text,
  product_categories           text[] not null default '{}',
  product_description          text,
  annual_capacity              text not null,
  export_experience            text not null,
  certifications               text[] not null default '{}',
  factory_size                 text,
  factory_locations            text,
  employee_count                text,
  website                      text,
  documents                    jsonb not null default '[]',
  notes                        text,
  status                       text not null default 'pending_review',
  created_at                   timestamptz not null default now()
);
create index if not exists supplier_applications_user_id_idx on supplier_applications(user_id);
create index if not exists supplier_applications_created_at_idx on supplier_applications(created_at desc);

create table if not exists leads (
  lead_id    text primary key,
  name       text not null,
  email      text not null,
  phone      text,
  company    text,
  message    text not null,
  source     text not null default 'contact',
  created_at timestamptz not null default now()
);

create table if not exists newsletter_subscribers (
  subscriber_id text primary key,
  email         text not null unique,
  source_page   text,
  submitted_at  timestamptz not null default now()
);
create index if not exists newsletter_subscribers_submitted_at_idx on newsletter_subscribers(submitted_at desc);

create table if not exists password_reset_tokens (
  token      text primary key,
  user_id    text not null references users(user_id) on delete cascade,
  email      text not null,
  used       boolean not null default false,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists password_reset_tokens_user_id_idx on password_reset_tokens(user_id);

alter table users enable row level security;
alter table files enable row level security;
alter table buyer_intakes enable row level security;
alter table supplier_applications enable row level security;
alter table leads enable row level security;
alter table newsletter_subscribers enable row level security;
alter table password_reset_tokens enable row level security;
