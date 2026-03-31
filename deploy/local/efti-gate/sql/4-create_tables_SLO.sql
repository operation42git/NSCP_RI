-- create schema
CREATE SCHEMA eftiSLO;

-- Give permission to schema and table created
grant all privileges on schema eftiSLO to efti;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA eftiSLO TO efti;







