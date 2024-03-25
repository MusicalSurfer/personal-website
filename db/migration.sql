DROP TABLE IF EXISTS entree;
DROP TABLE IF EXISTS user;

CREATE TABLE user (
    id SERIAL PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    password TEXT,
);

-- CREATE TABLE entree (
--     id SERIAL PRIMARY KEY,
--     name TEXT,
--     restaurant_id BIGINT ,
--     FOREIGN KEY (restaurant_id) REFERENCES restaurant(id) ON DELETE CASCADE
-- );