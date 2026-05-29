create table if not exists uploaded_files (
  id text primary key,
  original_name text not null,
  storage_key text not null,
  mime_type text not null,
  size bigint not null,
  created_at text not null
);

create table if not exists candidates (
  id text primary key,
  token text not null unique,
  name text not null,
  email text not null,
  status text not null,
  deadline_at text,
  created_at text not null,
  opened_at text,
  submitted_at text,
  reviewed_at text,
  part_a_audio_file_id text references uploaded_files(id),
  part_b_audio_file_id text references uploaded_files(id),
  part_a_key text not null,
  part_b_key text not null,
  part_a_draft text,
  part_b_draft text,
  part_a_submission text,
  part_b_submission text,
  scores jsonb not null default '{}'::jsonb,
  formatting_score integer,
  decision text not null default '',
  tier text not null default '',
  notes text,
  red_flags text
);

create index if not exists idx_candidates_status on candidates(status);
create index if not exists idx_candidates_created_at on candidates(created_at);
