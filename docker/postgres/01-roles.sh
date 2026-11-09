#!/bin/sh
# Roda uma única vez, na criação do volume.
# app_owner: dono do schema (Flyway). app_user: usado pela aplicação, sujeito ao RLS.
set -eu

psql -v ON_ERROR_STOP=1 \
  -v owner_pw="$APP_OWNER_PASSWORD" -v user_pw="$APP_USER_PASSWORD" \
  -U "$POSTGRES_USER" -d "$POSTGRES_DB" <<'SQL'
CREATE ROLE app_owner LOGIN PASSWORD :'owner_pw';
CREATE ROLE app_user  LOGIN PASSWORD :'user_pw' NOBYPASSRLS;
CREATE SCHEMA app AUTHORIZATION app_owner;
GRANT USAGE ON SCHEMA app TO app_user;
ALTER ROLE app_owner SET search_path = app;
ALTER ROLE app_user  SET search_path = app;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
-- extensões exigem superusuário; btree_gist é usada na restrição de contratos sem sobreposição
CREATE EXTENSION IF NOT EXISTS btree_gist SCHEMA public;
SQL
