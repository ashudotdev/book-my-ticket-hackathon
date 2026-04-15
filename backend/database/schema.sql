-- ============================================================
-- Schema: 12 seat tables (4 movies × 3 time slots)
-- Time slots:  9am → 90 seats,  2pm → 110 seats,  7pm → 130 seats
-- Movies: dhurandhar, boothbangla, dacoit, hailmary
-- ============================================================

-- ===================== Dhurandhar the Revenge =====================
CREATE TABLE IF NOT EXISTS seats_dhurandhar_9am (
    id SERIAL PRIMARY KEY,
    seat_number INT NOT NULL,
    name VARCHAR(255),
    isbooked INT DEFAULT 0
);
CREATE TABLE IF NOT EXISTS seats_dhurandhar_2pm (
    id SERIAL PRIMARY KEY,
    seat_number INT NOT NULL,
    name VARCHAR(255),
    isbooked INT DEFAULT 0
);
CREATE TABLE IF NOT EXISTS seats_dhurandhar_7pm (
    id SERIAL PRIMARY KEY,
    seat_number INT NOT NULL,
    name VARCHAR(255),
    isbooked INT DEFAULT 0
);

-- ===================== Booth Bangla =====================
CREATE TABLE IF NOT EXISTS seats_boothbangla_9am (
    id SERIAL PRIMARY KEY,
    seat_number INT NOT NULL,
    name VARCHAR(255),
    isbooked INT DEFAULT 0
);
CREATE TABLE IF NOT EXISTS seats_boothbangla_2pm (
    id SERIAL PRIMARY KEY,
    seat_number INT NOT NULL,
    name VARCHAR(255),
    isbooked INT DEFAULT 0
);
CREATE TABLE IF NOT EXISTS seats_boothbangla_7pm (
    id SERIAL PRIMARY KEY,
    seat_number INT NOT NULL,
    name VARCHAR(255),
    isbooked INT DEFAULT 0
);

-- ===================== Dacoit =====================
CREATE TABLE IF NOT EXISTS seats_dacoit_9am (
    id SERIAL PRIMARY KEY,
    seat_number INT NOT NULL,
    name VARCHAR(255),
    isbooked INT DEFAULT 0
);
CREATE TABLE IF NOT EXISTS seats_dacoit_2pm (
    id SERIAL PRIMARY KEY,
    seat_number INT NOT NULL,
    name VARCHAR(255),
    isbooked INT DEFAULT 0
);
CREATE TABLE IF NOT EXISTS seats_dacoit_7pm (
    id SERIAL PRIMARY KEY,
    seat_number INT NOT NULL,
    name VARCHAR(255),
    isbooked INT DEFAULT 0
);

-- ===================== Project Hail Mary =====================
CREATE TABLE IF NOT EXISTS seats_hailmary_9am (
    id SERIAL PRIMARY KEY,
    seat_number INT NOT NULL,
    name VARCHAR(255),
    isbooked INT DEFAULT 0
);
CREATE TABLE IF NOT EXISTS seats_hailmary_2pm (
    id SERIAL PRIMARY KEY,
    seat_number INT NOT NULL,
    name VARCHAR(255),
    isbooked INT DEFAULT 0
);
CREATE TABLE IF NOT EXISTS seats_hailmary_7pm (
    id SERIAL PRIMARY KEY,
    seat_number INT NOT NULL,
    name VARCHAR(255),
    isbooked INT DEFAULT 0
);

-- ===================== Seat Table Compatibility Migration =====================
-- Older deployments may already have seat tables without seat_number/name/isbooked.
-- Upgrade those tables in place so fresh code works against existing databases.
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY ARRAY[
        'seats_dhurandhar_9am', 'seats_dhurandhar_2pm', 'seats_dhurandhar_7pm',
        'seats_boothbangla_9am', 'seats_boothbangla_2pm', 'seats_boothbangla_7pm',
        'seats_dacoit_9am', 'seats_dacoit_2pm', 'seats_dacoit_7pm',
        'seats_hailmary_9am', 'seats_hailmary_2pm', 'seats_hailmary_7pm'
    ]
    LOOP
        EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS seat_number INT', tbl);
        EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS name VARCHAR(255)', tbl);
        EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS isbooked INT DEFAULT 0', tbl);
        EXECUTE format('UPDATE %I SET seat_number = id WHERE seat_number IS NULL', tbl);
        EXECUTE format('UPDATE %I SET isbooked = 0 WHERE isbooked IS NULL', tbl);
    END LOOP;
END $$;

-- ===================== Seed Seats =====================
-- Only seed if the table is empty (idempotent)

-- Dhurandhar: 9am=90, 2pm=110, 7pm=130
DO $$ BEGIN IF (SELECT COUNT(*) FROM seats_dhurandhar_9am) = 0 THEN INSERT INTO seats_dhurandhar_9am (seat_number) SELECT g FROM generate_series(1, 90) g; END IF; END $$;
DO $$ BEGIN IF (SELECT COUNT(*) FROM seats_dhurandhar_2pm) = 0 THEN INSERT INTO seats_dhurandhar_2pm (seat_number) SELECT g FROM generate_series(1, 110) g; END IF; END $$;
DO $$ BEGIN IF (SELECT COUNT(*) FROM seats_dhurandhar_7pm) = 0 THEN INSERT INTO seats_dhurandhar_7pm (seat_number) SELECT g FROM generate_series(1, 130) g; END IF; END $$;

-- Booth Bangla: 9am=90, 2pm=110, 7pm=130
DO $$ BEGIN IF (SELECT COUNT(*) FROM seats_boothbangla_9am) = 0 THEN INSERT INTO seats_boothbangla_9am (seat_number) SELECT g FROM generate_series(1, 90) g; END IF; END $$;
DO $$ BEGIN IF (SELECT COUNT(*) FROM seats_boothbangla_2pm) = 0 THEN INSERT INTO seats_boothbangla_2pm (seat_number) SELECT g FROM generate_series(1, 110) g; END IF; END $$;
DO $$ BEGIN IF (SELECT COUNT(*) FROM seats_boothbangla_7pm) = 0 THEN INSERT INTO seats_boothbangla_7pm (seat_number) SELECT g FROM generate_series(1, 130) g; END IF; END $$;

-- Dacoit: 9am=90, 2pm=110, 7pm=130
DO $$ BEGIN IF (SELECT COUNT(*) FROM seats_dacoit_9am) = 0 THEN INSERT INTO seats_dacoit_9am (seat_number) SELECT g FROM generate_series(1, 90) g; END IF; END $$;
DO $$ BEGIN IF (SELECT COUNT(*) FROM seats_dacoit_2pm) = 0 THEN INSERT INTO seats_dacoit_2pm (seat_number) SELECT g FROM generate_series(1, 110) g; END IF; END $$;
DO $$ BEGIN IF (SELECT COUNT(*) FROM seats_dacoit_7pm) = 0 THEN INSERT INTO seats_dacoit_7pm (seat_number) SELECT g FROM generate_series(1, 130) g; END IF; END $$;

-- Hail Mary: 9am=90, 2pm=110, 7pm=130
DO $$ BEGIN IF (SELECT COUNT(*) FROM seats_hailmary_9am) = 0 THEN INSERT INTO seats_hailmary_9am (seat_number) SELECT g FROM generate_series(1, 90) g; END IF; END $$;
DO $$ BEGIN IF (SELECT COUNT(*) FROM seats_hailmary_2pm) = 0 THEN INSERT INTO seats_hailmary_2pm (seat_number) SELECT g FROM generate_series(1, 110) g; END IF; END $$;
DO $$ BEGIN IF (SELECT COUNT(*) FROM seats_hailmary_7pm) = 0 THEN INSERT INTO seats_hailmary_7pm (seat_number) SELECT g FROM generate_series(1, 130) g; END IF; END $$;

-- ===================== Users Table =====================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

-- ===================== Bookings Table =====================
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    movie VARCHAR(50) NOT NULL,
    show_time VARCHAR(10) NOT NULL,
    seat_id INT NOT NULL,
    seat_number INT,
    status VARCHAR(20) DEFAULT 'confirmed',
    held_until TIMESTAMPTZ,
    booked_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(movie, show_time, seat_id)
);

-- Fresh booking table used by the live app so legacy `bookings` schema quirks
-- do not break hold/confirm flows on older deployments.
CREATE TABLE IF NOT EXISTS seat_bookings (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    movie VARCHAR(50) NOT NULL,
    show_time VARCHAR(10) NOT NULL,
    seat_id INT NOT NULL,
    seat_number INT,
    status VARCHAR(20) DEFAULT 'confirmed',
    held_until TIMESTAMPTZ,
    booked_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(movie, show_time, seat_id)
);

-- Migration-safe: add columns if they don't exist (for existing DBs)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='moviename')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='movie') THEN
        ALTER TABLE bookings RENAME COLUMN moviename TO movie;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='movie_name')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='movie') THEN
        ALTER TABLE bookings RENAME COLUMN movie_name TO movie;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='time')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='show_time') THEN
        ALTER TABLE bookings RENAME COLUMN time TO show_time;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='seatno')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='seat_id') THEN
        ALTER TABLE bookings RENAME COLUMN seatno TO seat_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='seat_no')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='seat_id') THEN
        ALTER TABLE bookings RENAME COLUMN seat_no TO seat_id;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='user_id') THEN
        ALTER TABLE bookings ADD COLUMN user_id INT REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='movie') THEN
        ALTER TABLE bookings ADD COLUMN movie VARCHAR(50);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='show_time') THEN
        ALTER TABLE bookings ADD COLUMN show_time VARCHAR(10);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='seat_id') THEN
        ALTER TABLE bookings ADD COLUMN seat_id INT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='status') THEN
        ALTER TABLE bookings ADD COLUMN status VARCHAR(20) DEFAULT 'confirmed';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='held_until') THEN
        ALTER TABLE bookings ADD COLUMN held_until TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='booked_at') THEN
        ALTER TABLE bookings ADD COLUMN booked_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='seat_number') THEN
        ALTER TABLE bookings ADD COLUMN seat_number INT;
    END IF;
    UPDATE bookings SET status = 'confirmed' WHERE status IS NULL;
    UPDATE bookings SET booked_at = NOW() WHERE booked_at IS NULL;
    UPDATE bookings SET seat_number = seat_id WHERE seat_number IS NULL AND seat_id IS NOT NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='seat_bookings' AND column_name='seat_number') THEN
        ALTER TABLE seat_bookings ADD COLUMN seat_number INT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='seat_bookings' AND column_name='status') THEN
        ALTER TABLE seat_bookings ADD COLUMN status VARCHAR(20) DEFAULT 'confirmed';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='seat_bookings' AND column_name='held_until') THEN
        ALTER TABLE seat_bookings ADD COLUMN held_until TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='seat_bookings' AND column_name='booked_at') THEN
        ALTER TABLE seat_bookings ADD COLUMN booked_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    UPDATE seat_bookings SET status = 'confirmed' WHERE status IS NULL;
    UPDATE seat_bookings SET booked_at = NOW() WHERE booked_at IS NULL;
    UPDATE seat_bookings SET seat_number = seat_id WHERE seat_number IS NULL AND seat_id IS NOT NULL;
END $$;
