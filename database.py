import os
import sys
import uuid
import random
from datetime import datetime, timedelta, date

try:
    import psycopg2
    from psycopg2.extras import Json
    _USING_PSYCOPG2 = True
except ImportError:  # Fallback to psycopg3
    import psycopg
    from psycopg.types.json import Jsonb as Json
    _USING_PSYCOPG2 = False


def get_connection():
    """Create a PostgreSQL connection using DATABASE_URL or individual PG* env vars."""
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        return psycopg2.connect(database_url) if _USING_PSYCOPG2 else psycopg.connect(database_url)

    host = os.getenv("PGHOST", "localhost")
    port = int(os.getenv("PGPORT", "5432"))
    user = os.getenv("PGUSER", "esrakaya")
    password = os.getenv("PGPASSWORD", "admin")
    dbname = os.getenv("PGDATABASE", "reachplus")
    return (
        psycopg2.connect(host=host, port=port, user=user, password=password, dbname=dbname)
        if _USING_PSYCOPG2
        else psycopg.connect(host=host, port=port, user=user, password=password, dbname=dbname)
    )


DDL_BASE = r"""
DO $$
BEGIN
  -- PostGIS intentionally omitted for lightweight setup
  CREATE EXTENSION IF NOT EXISTS pgcrypto;      -- gen_random_uuid()
  CREATE EXTENSION IF NOT EXISTS citext;        -- case-insensitive email
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Extension error (non-fatal): %', SQLERRM;
END$$;

DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS timescaledb;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'TimescaleDB not available, continuing without it';
END$$;

DO $$
BEGIN
  CREATE TYPE chat_role                AS ENUM ('user','assistant','system');
  CREATE TYPE session_location_source  AS ENUM ('gps','manual','network');
  CREATE TYPE operator_status          AS ENUM ('up','down','degraded');
EXCEPTION WHEN duplicate_object THEN
  NULL;
END$$;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END $$;

-- PostGIS precision sanitizer removed (no geometry type)

CREATE TABLE IF NOT EXISTS users (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email            citext UNIQUE,
  phone            text UNIQUE,
  age_years        integer NOT NULL CHECK (age_years BETWEEN 0 AND 120),
  gender           text,
  locale           text NOT NULL DEFAULT 'tr-TR',
  is_active        boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT NOW(),
  updated_at       timestamptz NOT NULL DEFAULT NOW(),
  deleted_at       timestamptz
);

CREATE TRIGGER trg_users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS user_consents (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  consent_type      text NOT NULL,
  purpose           text NOT NULL,
  document_version  text NOT NULL,
  granted           boolean NOT NULL,
  consent_at        timestamptz NOT NULL DEFAULT NOW(),
  revoked_at        timestamptz,
  UNIQUE (user_id, consent_type, document_version, consent_at)
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id                 uuid,
  user_id            uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id_hash     text NOT NULL,
  user_agent         text,
  ip_address         inet,
  login_lat          double precision NOT NULL,
  login_lon          double precision NOT NULL,
  location_source    session_location_source NOT NULL DEFAULT 'gps',
  login_at           timestamptz NOT NULL DEFAULT NOW(),
  logout_at          timestamptz,
  expires_at         timestamptz,
  revoked            boolean NOT NULL DEFAULT false,
  CONSTRAINT chk_device_hash_len CHECK (char_length(device_id_hash) BETWEEN 32 AND 128),
  PRIMARY KEY (id, login_at)
);

-- No geometry columns, no sanitize triggers

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id
  ON user_sessions (user_id);

CREATE INDEX IF NOT EXISTS idx_user_sessions_login_at
  ON user_sessions (login_at);

CREATE INDEX IF NOT EXISTS idx_user_sessions_lat_lon
  ON user_sessions (login_lat, login_lon);

DO $$
BEGIN
  PERFORM create_hypertable('user_sessions','login_at', if_not_exists => TRUE, migrate_data => TRUE);
EXCEPTION WHEN undefined_function THEN
  RAISE NOTICE 'Timescale create_hypertable not available, skipped';
END$$;

DO $$
BEGIN
  PERFORM add_retention_policy('user_sessions', INTERVAL '180 days', if_not_exists => TRUE);
EXCEPTION WHEN undefined_function THEN
  RAISE NOTICE 'Timescale retention not available, skipped';
END$$;

CREATE TABLE IF NOT EXISTS chat_messages (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id   uuid REFERENCES user_sessions(id) ON DELETE SET NULL,
  role         chat_role NOT NULL,
  content      text NOT NULL,
  metadata     jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user_created
  ON chat_messages (user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_created
  ON chat_messages (session_id, created_at);

CREATE INDEX IF NOT EXISTS idx_chat_messages_metadata_gin
  ON chat_messages USING GIN (metadata);

CREATE TABLE IF NOT EXISTS web_push_subscriptions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint    text NOT NULL UNIQUE,
  p256dh      text NOT NULL,
  auth        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT NOW(),
  revoked_at  timestamptz
);

CREATE TABLE IF NOT EXISTS operators (
  code  text PRIMARY KEY,
  name  text NOT NULL
);

CREATE TABLE IF NOT EXISTS operator_status_events (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_code  text NOT NULL REFERENCES operators(code) ON DELETE CASCADE,
  status         operator_status NOT NULL,
  region_code    text,
  area_wkt       text,
  observed_at    timestamptz NOT NULL,
  details        jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_operator_events_operator_time
  ON operator_status_events (operator_code, observed_at);

-- Geometry index removed

CREATE TABLE IF NOT EXISTS safe_locations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  type        text NOT NULL,
  latitude    double precision NOT NULL,
  longitude   double precision NOT NULL,
  address     text,
  city        text,
  district    text,
  updated_at  timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_safe_locations_lat_lon
  ON safe_locations (latitude, longitude);
"""


DDL_EXTRA = r"""
DO $$
BEGIN
  CREATE TYPE data_source_type AS ENUM ('social','news','public');
  CREATE TYPE recommendation_type AS ENUM ('capacity_planning','maintenance','outage_alert','tariff_offer');
EXCEPTION WHEN duplicate_object THEN NULL;
END$$;

CREATE TABLE IF NOT EXISTS data_sources (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type                data_source_type NOT NULL,
  name                text NOT NULL,
  platform            text,
  reliability_score   numeric(3,2) NOT NULL DEFAULT 0.80,
  created_at          timestamptz NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_data_sources_name_platform
  ON data_sources (name, platform);

CREATE TABLE IF NOT EXISTS social_posts (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id      uuid NOT NULL REFERENCES data_sources(id) ON DELETE CASCADE,
  external_id    text NOT NULL,
  author_handle  text,
  content        text NOT NULL,
  lang           text,
  latitude       double precision,
  longitude      double precision,
  region_code    text,
  sentiment      numeric(4,3),
  topics         jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at     timestamptz,
  collected_at   timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (source_id, external_id)
);

CREATE INDEX IF NOT EXISTS idx_social_posts_times
  ON social_posts (created_at, collected_at);

CREATE INDEX IF NOT EXISTS idx_social_posts_region_time
  ON social_posts (region_code, created_at);

CREATE INDEX IF NOT EXISTS idx_social_posts_topics_gin
  ON social_posts USING GIN (topics);

CREATE INDEX IF NOT EXISTS idx_social_posts_lat_lon
  ON social_posts (latitude, longitude);

CREATE TABLE IF NOT EXISTS news_items (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id      uuid NOT NULL REFERENCES data_sources(id) ON DELETE CASCADE,
  external_id    text NOT NULL,
  title          text NOT NULL,
  content        text,
  latitude       double precision,
  longitude      double precision,
  region_code    text,
  topics         jsonb NOT NULL DEFAULT '{}'::jsonb,
  published_at   timestamptz,
  collected_at   timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (source_id, external_id)
);

CREATE INDEX IF NOT EXISTS idx_news_items_times
  ON news_items (published_at, collected_at);

CREATE INDEX IF NOT EXISTS idx_news_items_topics_gin
  ON news_items USING GIN (topics);

CREATE INDEX IF NOT EXISTS idx_news_items_lat_lon
  ON news_items (latitude, longitude);

CREATE TABLE IF NOT EXISTS public_announcements (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id      uuid NOT NULL REFERENCES data_sources(id) ON DELETE CASCADE,
  external_id    text NOT NULL,
  title          text NOT NULL,
  content        text,
  area_wkt       text,
  region_code    text,
  official       boolean NOT NULL DEFAULT true,
  published_at   timestamptz,
  collected_at   timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (source_id, external_id)
);

CREATE INDEX IF NOT EXISTS idx_public_ann_times
  ON public_announcements (published_at, collected_at);

-- Geometry index removed

CREATE TABLE IF NOT EXISTS user_behavior_events (
  id            uuid,
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id    uuid REFERENCES user_sessions(id) ON DELETE SET NULL,
  event_type    text NOT NULL,
  properties    jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at   timestamptz NOT NULL,
  PRIMARY KEY (id, occurred_at)
);

CREATE INDEX IF NOT EXISTS idx_user_behavior_user_time
  ON user_behavior_events (user_id, occurred_at);

CREATE INDEX IF NOT EXISTS idx_user_behavior_session_time
  ON user_behavior_events (session_id, occurred_at);

CREATE INDEX IF NOT EXISTS idx_user_behavior_properties_gin
  ON user_behavior_events USING GIN (properties);

DO $$
BEGIN
  PERFORM create_hypertable('user_behavior_events','occurred_at', if_not_exists => TRUE, migrate_data => TRUE);
EXCEPTION WHEN undefined_function THEN
  RAISE NOTICE 'Timescale not available for user_behavior_events';
END$$;

CREATE TABLE IF NOT EXISTS region_hourly_metrics (
  id                            uuid,
  region_code                   text NOT NULL,
  operator_code                 text REFERENCES operators(code) ON DELETE SET NULL,
  population_movement_index     numeric(6,3),
  network_congestion_index      numeric(6,3),
  avg_data_consumption_mb       numeric(12,3),
  samples_count                 integer NOT NULL DEFAULT 0,
  area_wkt                      text,
  bucket_start                  timestamptz NOT NULL,
  UNIQUE (region_code, operator_code, bucket_start),
  PRIMARY KEY (id, bucket_start)
);

CREATE INDEX IF NOT EXISTS idx_region_metrics_time
  ON region_hourly_metrics (bucket_start);

-- Geometry index removed

DO $$
BEGIN
  PERFORM create_hypertable('region_hourly_metrics','bucket_start', if_not_exists => TRUE, migrate_data => TRUE);
EXCEPTION WHEN undefined_function THEN
  RAISE NOTICE 'Timescale not available for region_hourly_metrics';
END$$;

CREATE TABLE IF NOT EXISTS model_versions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  version      text NOT NULL,
  training_cutoff_date date,
  created_at   timestamptz NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_model_versions_name_version
  ON model_versions (name, version);

CREATE TABLE IF NOT EXISTS operator_planning_recommendations (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_code         text NOT NULL REFERENCES operators(code) ON DELETE CASCADE,
  region_code           text NOT NULL,
  model_version_id      uuid NOT NULL REFERENCES model_versions(id) ON DELETE RESTRICT,
  recommendation_type   recommendation_type NOT NULL DEFAULT 'capacity_planning',
  description           text NOT NULL,
  priority              numeric(4,2) NOT NULL DEFAULT 0.50,
  details               jsonb NOT NULL DEFAULT '{}'::jsonb,
  generated_at          timestamptz NOT NULL DEFAULT NOW(),
  valid_until           timestamptz
);

CREATE INDEX IF NOT EXISTS idx_op_planning_operator_time
  ON operator_planning_recommendations (operator_code, generated_at);

CREATE INDEX IF NOT EXISTS idx_op_planning_region_time
  ON operator_planning_recommendations (region_code, generated_at);

CREATE TABLE IF NOT EXISTS user_tariff_recommendations (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  operator_code     text REFERENCES operators(code) ON DELETE SET NULL,
  model_version_id  uuid NOT NULL REFERENCES model_versions(id) ON DELETE RESTRICT,
  plan_name         text NOT NULL,
  details           jsonb NOT NULL DEFAULT '{}'::jsonb,
  score             numeric(6,3) NOT NULL,
  rank              integer NOT NULL,
  generated_at      timestamptz NOT NULL DEFAULT NOW(),
  expires_at        timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_user_tariff_unique
  ON user_tariff_recommendations (user_id, plan_name, generated_at);

CREATE INDEX IF NOT EXISTS idx_user_tariff_score
  ON user_tariff_recommendations (user_id, score DESC, generated_at DESC);
"""


def exec_sql(cursor, sql: str):
    cursor.execute(sql)


def setup_schema(conn):
    with conn.cursor() as cur:
        exec_sql(cur, DDL_BASE)
        exec_sql(cur, DDL_EXTRA)
    conn.commit()


def seed_data(conn):
    random.seed(42)
    now = datetime.utcnow()

    def rand_point_near(lat_base: float, lon_base: float, delta: float = 0.2):
        lat = lat_base + random.uniform(-delta, delta)
        lon = lon_base + random.uniform(-delta, delta)
        return lat, lon

    with conn.cursor() as cur:
        # Operators (10)
        operators = [
            ("TTKOM", "Türk Telekom"),
            ("VF", "Vodafone"),
            ("TCELL", "Turkcell"),
            ("BIMCELL", "BIMCell"),
            ("POCELL", "Pttcell"),
            ("PTTCELL", "PTTCell"),
            ("RED", "Vodafone Red"),
            ("BIZ", "Turkcell Biz"),
            ("TTMOB", "TT Mobile"),
            ("MVNOX", "MVNO X"),
        ]
        for code, name in operators:
            cur.execute(
                "INSERT INTO operators(code, name) VALUES (%s, %s) ON CONFLICT (code) DO NOTHING",
                (code, name),
            )

        # Users (10)
        user_ids = []
        genders = [None, "female", "male", "other"]
        for i in range(10):
            email = f"user{i+1}@example.com"
            phone = f"+90555{random.randint(1000000, 9999999)}"
            age = random.randint(18, 70)
            gender = random.choice(genders)
            locale = random.choice(["tr-TR", "en-US"])
            cur.execute(
                """
                INSERT INTO users(email, phone, age_years, gender, locale)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
                """,
                (email, phone, age, gender, locale),
            )
            user_id = cur.fetchone()[0]
            user_ids.append(user_id)

        # User consents (10)
        for i, user_id in enumerate(user_ids):
            cur.execute(
                """
                INSERT INTO user_consents(user_id, consent_type, purpose, document_version, granted)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (user_id, "location_collection", "konum toplama", "v1.0", True),
            )

        # User sessions (10) with location (Istanbul region)
        session_ids = []
        for i, user_id in enumerate(user_ids):
            device_hash = uuid.uuid4().hex * 2  # 64 hex chars
            ua = random.choice([
                "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X)",
                "Mozilla/5.0 (Linux; Android 14; Pixel 6)",
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
            ])
            ip = f"192.168.1.{random.randint(2, 254)}"
            lat, lon = rand_point_near(41.01, 28.97, 0.15)
            login_at = now - timedelta(hours=random.randint(0, 72))
            expires_at = login_at + timedelta(hours=6)
            cur.execute(
                """
                INSERT INTO user_sessions(
                  user_id, device_id_hash, user_agent, ip_address,
                  login_lat, login_lon, location_source, login_at, expires_at
                )
                VALUES (
                  %s, %s, %s, %s,
                  %s, %s, %s, %s, %s
                )
                RETURNING id
                """,
                (user_id, device_hash, ua, ip, lat, lon, "gps", login_at, expires_at),
            )
            session_ids.append(cur.fetchone()[0])

        # Chat messages (10)
        roles = ["user", "assistant", "system"]
        for i in range(10):
            user_id = random.choice(user_ids)
            session_id = random.choice(session_ids)
            role = roles[i % 2] if i % 5 else "system"
            content = f"Sample message {i+1} about network status and safety."
            metadata = {"topic": "network", "seq": i + 1}
            created_at = now - timedelta(minutes=10 * (10 - i))
            cur.execute(
                """
                INSERT INTO chat_messages(user_id, session_id, role, content, metadata, created_at)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (user_id, session_id, role, content, Json(metadata), created_at),
            )

        # Web push subscriptions (10)
        for i in range(10):
            user_id = user_ids[i]
            endpoint = f"https://push.example.com/endpoint/{uuid.uuid4()}"
            p256dh = uuid.uuid4().hex
            auth = uuid.uuid4().hex
            cur.execute(
                """
                INSERT INTO web_push_subscriptions(user_id, endpoint, p256dh, auth)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (endpoint) DO NOTHING
                """,
                (user_id, endpoint, p256dh, auth),
            )

        # Operator status events (10)
        statuses = ["up", "down", "degraded"]
        for i in range(10):
            operator_code = operators[i % len(operators)][0]
            status = statuses[i % len(statuses)]
            region = random.choice(["IST-01", "ANK-01", "IZM-01"])
            observed_at = now - timedelta(minutes=30 * i)
            # simple rectangular polygon around a random center
            lat, lon = rand_point_near(40.9, 29.0, 0.2)
            d = 0.05
            wkt = f"POLYGON(({lon-d} {lat-d},{lon+d} {lat-d},{lon+d} {lat+d},{lon-d} {lat+d},{lon-d} {lat-d}))"
            details = {"note": "auto-seeded"}
            cur.execute(
                """
                INSERT INTO operator_status_events(operator_code, status, region_code, area_wkt, observed_at, details)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (operator_code, status, region, wkt, observed_at, Json(details)),
            )

        # Safe locations (10)
        safe_types = ["assembly", "hospital", "fire"]
        for i in range(10):
            name = f"Safe Location {i+1}"
            typ = safe_types[i % len(safe_types)]
            lat, lon = rand_point_near(41.02, 28.95, 0.2)
            addr = f"Adres {i+1}"
            city = random.choice(["İstanbul", "Ankara", "İzmir"])
            district = random.choice(["Kadıköy", "Çankaya", "Konak"]) 
            cur.execute(
                """
                INSERT INTO safe_locations(name, type, latitude, longitude, address, city, district)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                (name, typ, lat, lon, addr, city, district),
            )

        # Data sources (10)
        ds_types = ["social", "news", "public"]
        platforms = ["twitter", "mastodon", "rss", "gov"]
        data_source_ids = []
        for i in range(10):
            ds_type = ds_types[i % len(ds_types)]
            name = f"Source-{ds_type}-{i+1}"
            platform = random.choice(platforms)
            reliability = round(random.uniform(0.6, 0.99), 2)
            cur.execute(
                """
                INSERT INTO data_sources(type, name, platform, reliability_score)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (name, platform) DO NOTHING
                RETURNING id
                """,
                (ds_type, name, platform, reliability),
            )
            row = cur.fetchone()
            if row is None:
                # Fetch existing id if conflict
                cur.execute("SELECT id FROM data_sources WHERE name=%s AND platform=%s", (name, platform))
                row = cur.fetchone()
            data_source_ids.append(row[0])

        # Social posts (10)
        for i in range(10):
            src = data_source_ids[i % len(data_source_ids)]
            external_id = f"tw-{1000 + i}"
            author = f"user{i%5}"
            content = f"Şebeke durumu güncellemesi {i+1}."
            lang = "tr"
            lat, lon = rand_point_near(41.0, 29.0, 0.25)
            region = random.choice(["IST-01", "IST-02", "ANK-01"]) 
            sentiment = round(random.uniform(-0.5, 0.9), 3)
            topics = {"tags": ["network", "safety"]}
            created_at = now - timedelta(minutes=5 * i)
            cur.execute(
                """
                INSERT INTO social_posts(
                  source_id, external_id, author_handle, content, lang,
                  latitude, longitude, region_code, sentiment, topics, created_at
                )
                VALUES (
                  %s, %s, %s, %s, %s,
                  %s, %s, %s, %s, %s, %s
                )
                ON CONFLICT (source_id, external_id) DO NOTHING
                """,
                (src, external_id, author, content, lang, lat, lon, region, sentiment, Json(topics), created_at),
            )

        # News items (10)
        for i in range(10):
            src = data_source_ids[i % len(data_source_ids)]
            external_id = f"rss-{2000 + i}"
            title = f"Haber {i+1}: Bölgesel altyapı"
            content = "Operatör altyapı güncellemesi duyuruldu."
            lat, lon = rand_point_near(39.9, 32.85, 0.25)  # Ankara
            region = random.choice(["ANK-01", "ANK-02"]) 
            topics = {"category": ["operator", "planning"]}
            published_at = now - timedelta(hours=i)
            cur.execute(
                """
                INSERT INTO news_items(
                  source_id, external_id, title, content,
                  latitude, longitude, region_code, topics, published_at
                )
                VALUES (
                  %s, %s, %s, %s,
                  %s, %s, %s, %s, %s
                )
                ON CONFLICT (source_id, external_id) DO NOTHING
                """,
                (src, external_id, title, content, lat, lon, region, Json(topics), published_at),
            )

        # Public announcements (10)
        for i in range(10):
            src = data_source_ids[i % len(data_source_ids)]
            external_id = f"gov-{3000 + i}"
            title = f"Duyuru {i+1}: Güvenli alan"
            content = "Bölgenizde toplanma alanları güncellendi."
            lat, lon = rand_point_near(38.4, 27.1, 0.25)  # İzmir
            d = 0.06
            wkt = f"POLYGON(({lon-d} {lat-d},{lon+d} {lat-d},{lon+d} {lat+d},{lon-d} {lat+d},{lon-d} {lat-d}))"
            region = random.choice(["IZM-01", "IZM-02"]) 
            published_at = now - timedelta(hours=2 + i)
            cur.execute(
                """
                INSERT INTO public_announcements(
                  source_id, external_id, title, content, area_wkt, region_code, official, published_at
                )
                VALUES (
                  %s, %s, %s, %s,
                  %s,
                  %s, %s, %s
                )
                ON CONFLICT (source_id, external_id) DO NOTHING
                """,
                (src, external_id, title, content, wkt, region, True, published_at),
            )

        # User behavior events (10)
        event_types = ["view", "click", "search", "open_chat", "send_message"]
        for i in range(10):
            user_id = user_ids[i % len(user_ids)]
            session_id = session_ids[i % len(session_ids)]
            et = event_types[i % len(event_types)]
            props = {"page": "/home", "i": i}
            occurred_at = now - timedelta(minutes=i * 3)
            cur.execute(
                """
                INSERT INTO user_behavior_events(user_id, session_id, event_type, properties, occurred_at)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (user_id, session_id, et, Json(props), occurred_at),
            )

        # Region hourly metrics (10)
        for i in range(10):
            region = random.choice(["IST-01", "IST-02", "ANK-01", "IZM-01"]) 
            operator_code = operators[i % len(operators)][0]
            pmi = round(random.uniform(0.0, 5.0), 3)
            nci = round(random.uniform(0.0, 5.0), 3)
            avg_mb = round(random.uniform(50.0, 5000.0), 3)
            samples = random.randint(50, 5000)
            lat, lon = rand_point_near(40.5, 30.0, 0.5)
            d = 0.1
            wkt = f"POLYGON(({lon-d} {lat-d},{lon+d} {lat-d},{lon+d} {lat+d},{lon-d} {lat+d},{lon-d} {lat-d}))"
            bucket = now.replace(minute=0, second=0, microsecond=0) - timedelta(hours=i)
            cur.execute(
                """
                INSERT INTO region_hourly_metrics(
                  region_code, operator_code, population_movement_index, network_congestion_index,
                  avg_data_consumption_mb, samples_count, area_wkt, bucket_start
                )
                VALUES (
                  %s, %s, %s, %s, %s, %s,
                  %s, %s
                )
                ON CONFLICT (region_code, operator_code, bucket_start) DO NOTHING
                """,
                (region, operator_code, pmi, nci, avg_mb, samples, wkt, bucket),
            )

        # Model versions (10)
        model_ids = []
        for i in range(10):
            name = random.choice([
                "reach-operator-planning",
                "reach-tariff-recommender",
                "reach-sentiment-topic"
            ])
            version = f"1.{i}.{random.randint(0,9)}"
            cutoff = date(2024, random.randint(1, 12), random.randint(1, 28))
            cur.execute(
                """
                INSERT INTO model_versions(name, version, training_cutoff_date)
                VALUES (%s, %s, %s)
                ON CONFLICT (name, version) DO NOTHING
                RETURNING id
                """,
                (name, version, cutoff),
            )
            row = cur.fetchone()
            if row is None:
                cur.execute("SELECT id FROM model_versions WHERE name=%s AND version=%s", (name, version))
                row = cur.fetchone()
            model_ids.append(row[0])

        # Operator planning recommendations (10)
        rec_types = ["capacity_planning", "maintenance", "outage_alert"]
        for i in range(10):
            operator_code = operators[i % len(operators)][0]
            region = random.choice(["IST-01", "ANK-01", "IZM-01"]) 
            model_id = random.choice(model_ids)
            rec_type = rec_types[i % len(rec_types)]
            description = f"{region} için {operator_code} {rec_type} önerisi"
            priority = round(random.uniform(0.2, 0.95), 2)
            details = {"features": {"pmi": random.random(), "nci": random.random()}}
            valid_until = now + timedelta(days=random.randint(7, 30))
            cur.execute(
                """
                INSERT INTO operator_planning_recommendations(
                  operator_code, region_code, model_version_id, recommendation_type,
                  description, priority, details, valid_until
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (operator_code, region, model_id, rec_type, description, priority, Json(details), valid_until),
            )

        # User tariff recommendations (10)
        plans = ["GB-20", "GB-50", "Unlimited-Day", "Unlimited-Night", "Student-15", "Family-100"]
        for i in range(10):
            user_id = user_ids[i % len(user_ids)]
            operator_code = operators[i % len(operators)][0]
            model_id = random.choice(model_ids)
            plan_name = random.choice(plans)
            score = round(random.uniform(0.5, 0.99), 3)
            rank = (i % 5) + 1
            details = {"usage_profile": {"avg_gb": round(random.uniform(5.0, 80.0), 1)}, "price": random.randint(100, 600)}
            expires_at = now + timedelta(days=30)
            cur.execute(
                """
                INSERT INTO user_tariff_recommendations(
                  user_id, operator_code, model_version_id, plan_name, details, score, rank, expires_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (user_id, operator_code, model_id, plan_name, Json(details), score, rank, expires_at),
            )

    conn.commit()


def main():
    try:
        conn = get_connection()
        conn.autocommit = False
    except Exception as e:
        print(f"DB connection error: {e}")
        sys.exit(1)

    try:
        setup_schema(conn)
        seed_data(conn)
    except Exception as e:
        conn.rollback()
        print(f"Error during schema setup/seed: {e}")
        raise
    finally:
        conn.close()

    print("Database schema created and seeded with dummy data (10 rows per table).")


if __name__ == "__main__":
    main()


