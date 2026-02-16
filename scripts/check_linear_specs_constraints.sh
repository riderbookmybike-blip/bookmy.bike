#!/usr/bin/env bash
# Run spec/gallery constraint checks against the connected Postgres
psql "$SUPABASE_DB_URL" -f scripts/check_linear_specs_constraints.sql
