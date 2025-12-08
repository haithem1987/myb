CREATE DATABASE keycloak;
CREATE USER kc_user WITH PASSWORD 'kc_pwd';
GRANT ALL ON DATABASE keycloak TO kc_user;