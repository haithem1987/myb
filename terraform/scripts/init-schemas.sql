-- ============================================================================
-- MYB Platform - Database Schema Initialization (Phase 1: Coproperty)
-- Run this after RDS instance is created
-- Phase 2 will add: timesheet, invoice, document schemas
-- ============================================================================

-- Create schemas for Phase 1 services
CREATE SCHEMA IF NOT EXISTS coproperty;
CREATE SCHEMA IF NOT EXISTS keycloak;
CREATE SCHEMA IF NOT EXISTS usermanager;

-- Create service-specific roles with least privilege
CREATE ROLE myb_coproperty_role;
CREATE ROLE myb_keycloak_role;
CREATE ROLE myb_usermanager_role;

-- Grant schema access to respective roles
GRANT USAGE, CREATE ON SCHEMA coproperty TO myb_coproperty_role;
GRANT USAGE, CREATE ON SCHEMA keycloak TO myb_keycloak_role;
GRANT USAGE, CREATE ON SCHEMA usermanager TO myb_usermanager_role;

-- Grant default privileges on future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA coproperty GRANT ALL ON TABLES TO myb_coproperty_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA keycloak GRANT ALL ON TABLES TO myb_keycloak_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA usermanager GRANT ALL ON TABLES TO myb_usermanager_role;

-- Grant default privileges on sequences
ALTER DEFAULT PRIVILEGES IN SCHEMA coproperty GRANT ALL ON SEQUENCES TO myb_coproperty_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA keycloak GRANT ALL ON SEQUENCES TO myb_keycloak_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA usermanager GRANT ALL ON SEQUENCES TO myb_usermanager_role;

-- Create service users and assign roles
-- Passwords should be changed via AWS Secrets Manager after creation
CREATE USER myb_coproperty WITH PASSWORD 'CHANGE_ME_coproperty';
CREATE USER myb_keycloak WITH PASSWORD 'CHANGE_ME_keycloak';
CREATE USER myb_usermanager WITH PASSWORD 'CHANGE_ME_usermanager';

GRANT myb_coproperty_role TO myb_coproperty;
GRANT myb_keycloak_role TO myb_keycloak;
GRANT myb_usermanager_role TO myb_usermanager;

-- Set default search_path for each user
ALTER USER myb_coproperty SET search_path TO coproperty, public;
ALTER USER myb_keycloak SET search_path TO keycloak, public;
ALTER USER myb_usermanager SET search_path TO usermanager, public;

-- ============================================================================
-- Phase 2 (run when deploying timesheet, invoice, document, payment):
-- CREATE SCHEMA IF NOT EXISTS timesheet;
-- CREATE SCHEMA IF NOT EXISTS invoice;
-- CREATE SCHEMA IF NOT EXISTS document;
-- (see git history for full Phase 2 script)
-- ============================================================================
