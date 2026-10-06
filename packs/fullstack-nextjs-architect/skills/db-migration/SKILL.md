# Supabase & PostgreSQL Migration Skill

## Purpose
Author idempotent, secure PostgreSQL migrations with complete Row Level Security (RLS) policies.

## Guidelines
1. Always enable RLS: `ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;`
2. Provide explicit policies for SELECT, INSERT, UPDATE, DELETE based on `auth.uid()`.
3. Add indexed foreign keys to prevent full table scans.
4. Include down migrations / rollback comments where appropriate.
