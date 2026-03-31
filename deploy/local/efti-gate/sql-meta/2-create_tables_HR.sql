-- create user
create user root with encrypted password 'root';
grant all privileges on database efti to root;


-- create schema
CREATE SCHEMA eftiHR;

-- Give permission to schema and table created
grant all privileges on schema eftiHR to root;


GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA eftiHR to root;







