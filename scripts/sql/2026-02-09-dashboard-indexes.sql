-- Dashboard performance indexes (idempotent)
-- Apply in production with:
-- psql "$DATABASE_URL" -f scripts/sql/2026-02-09-dashboard-indexes.sql

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversaciones_contact_id_fecha_hora
  ON conversaciones (contact_id, fecha_hora);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_history_phone_created_at
  ON history (phone, created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_history_contact_id_created_at
  ON history (contact_id, created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contact_last_interaction
  ON contact (last_interaction);
