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

-- Migration-safe: add columns if they don't exist (for existing DBs)
DO $$
BEGIN
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
END $$;
