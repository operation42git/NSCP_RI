-- create schema
CREATE SCHEMA eftiHR;

-- Give permission to schema and table created
grant all privileges on schema eftiHR to efti;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA eftiHR TO efti;







