-- 0. Create seats table (if starting fresh)
CREATE TABLE IF NOT EXISTS seats (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    isbooked INT DEFAULT 0
);

-- Seed initial seats if we have less than 24 seats
DO $$
DECLARE
    current_count INT;
BEGIN
    SELECT COUNT(*) INTO current_count FROM seats;
    IF current_count < 24 THEN
        INSERT INTO seats (isbooked)
        SELECT 0 FROM generate_series(1, 24 - current_count);
    END IF;
END $$;

-- 1. Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

-- 2. Create bookings table
-- This stores the individual bookings. We still lock the `seats` table to prevent concurrency issues.
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    seat_id INT REFERENCES seats(id) ON DELETE CASCADE,
    UNIQUE(seat_id) -- A seat can only be booked once
);
