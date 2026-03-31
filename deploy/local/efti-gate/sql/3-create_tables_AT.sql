-- create schema
CREATE SCHEMA eftiAT;

-- Give permission to schema and table created
grant all privileges on schema eftiAT to efti;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA eftiAT TO efti;







