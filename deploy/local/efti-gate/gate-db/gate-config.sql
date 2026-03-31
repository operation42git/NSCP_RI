DELETE
FROM gate
where 1 = 1; -- to explicitly state all rows are to be deleted

INSERT INTO gate (country, gateid, createddate, lastmodifieddate)
VALUES ('AT', 'listenbourg', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       ('HR', 'croatia', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       ('SI', 'slovenia', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);