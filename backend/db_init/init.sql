-- =======================================================
-- SCRIPT DE INICIALIZACIÓN DE BASE DE DATOS
-- Sistema de Apoyo para Mascotas Saludables
-- Ejecutado automáticamente por PostgreSQL al primer arranque
-- Versión: 1.0 | Track A — Backend
-- =======================================================

-- ───────────────────────────────────────────────────────
-- SECCIÓN 1: ESQUEMAS LÓGICOS
-- Separación de BD_Catalogos y BD_Transaccional (SRS §3)
-- ───────────────────────────────────────────────────────
CREATE SCHEMA IF NOT EXISTS bd_catalogos;
CREATE SCHEMA IF NOT EXISTS bd_transaccional;


-- ═══════════════════════════════════════════════════════
-- BD_CATALOGOS: Tablas de referencia (sin mutación frecuente)
-- ═══════════════════════════════════════════════════════

-- Tabla: TipoMascota
-- Catálogo de tipos de animal (Perro, Gato, etc.)
CREATE TABLE bd_catalogos.TipoMascota (
    id          SERIAL PRIMARY KEY,
    nombre      VARCHAR(50)  NOT NULL UNIQUE,
    emoji       VARCHAR(10)  NOT NULL DEFAULT '🐾',
    activo      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Tabla: RazaMascota
-- FK → TipoMascota (una raza pertenece a un tipo)
CREATE TABLE bd_catalogos.RazaMascota (
    id          SERIAL PRIMARY KEY,
    tipo_id     INT          NOT NULL REFERENCES bd_catalogos.TipoMascota(id),
    nombre      VARCHAR(100) NOT NULL,
    activo      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE(tipo_id, nombre)
);

-- Tabla: Tamano
-- Mini/Toy, Pequeño, Mediano, Grande, Gigante
CREATE TABLE bd_catalogos.Tamano (
    id           SERIAL PRIMARY KEY,
    nombre       VARCHAR(50)  NOT NULL UNIQUE,
    descripcion  VARCHAR(150),
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Tabla: PesoIdeal
-- TABLA A del SRS: Peso ideal de referencia por raza y tamaño
-- Usada para calcular el IMA (Índice de Masa Animal)
--   IMA = peso_actual_kg / peso_ideal_kg
CREATE TABLE bd_catalogos.PesoIdeal (
    id               SERIAL PRIMARY KEY,
    raza_id          INT            NOT NULL REFERENCES bd_catalogos.RazaMascota(id),
    tamano_id        INT            NOT NULL REFERENCES bd_catalogos.Tamano(id),
    peso_min_kg      NUMERIC(6,2)   NOT NULL,
    peso_max_kg      NUMERIC(6,2)   NOT NULL,
    peso_ideal_kg    NUMERIC(6,2)   NOT NULL,  -- Punto de referencia central
    created_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    UNIQUE(raza_id, tamano_id),
    CONSTRAINT chk_pesos CHECK (peso_min_kg > 0 AND peso_max_kg >= peso_min_kg AND peso_ideal_kg BETWEEN peso_min_kg AND peso_max_kg)
);

-- Tabla: PoliticaApoyo
-- TABLA B del SRS: Define montos de apoyo por rango de IMA
CREATE TABLE bd_catalogos.PoliticaApoyo (
    id                 SERIAL PRIMARY KEY,
    clasificacion_ima  VARCHAR(50)    NOT NULL UNIQUE,  -- 'Bajo Peso Severo', 'Bajo Peso', etc.
    ima_min            NUMERIC(5,2)   NOT NULL,
    ima_max            NUMERIC(5,2)   NOT NULL,
    monto_apoyo_mxn    NUMERIC(10,2)  NOT NULL DEFAULT 0,
    descripcion        TEXT,
    activo             BOOLEAN        NOT NULL DEFAULT TRUE,
    updated_at         TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_ima_rango CHECK (ima_min >= 0 AND ima_max > ima_min)
);

-- Tabla: CostoAlimento
-- Costo mensual estimado de alimento por tipo y tamaño
CREATE TABLE bd_catalogos.CostoAlimento (
    id              SERIAL PRIMARY KEY,
    tipo_id         INT            NOT NULL REFERENCES bd_catalogos.TipoMascota(id),
    tamano_id       INT            NOT NULL REFERENCES bd_catalogos.Tamano(id),
    costo_mensual   NUMERIC(10,2)  NOT NULL,
    moneda          CHAR(3)        NOT NULL DEFAULT 'MXN',
    updated_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    UNIQUE(tipo_id, tamano_id)
);


-- ═══════════════════════════════════════════════════════
-- BD_TRANSACCIONAL: Tablas operativas del sistema
-- ═══════════════════════════════════════════════════════

-- Tabla: Usuario (Dueño_Usuario en el SRS)
-- CURP como identificador único (CA-03: valida duplicidad de beneficios)
-- La validación real del CURP es responsabilidad de la Autoridad humana
CREATE TABLE bd_transaccional.Usuario (
    id              SERIAL PRIMARY KEY,
    curp            VARCHAR(18)  NOT NULL UNIQUE,    -- CA-03: CURP único
    nombre          VARCHAR(100) NOT NULL,
    telefono        VARCHAR(15),
    email           VARCHAR(150),
    password_hash   VARCHAR(255) NOT NULL,
    rol             VARCHAR(20)  NOT NULL DEFAULT 'ciudadano'  -- 'ciudadano'|'autoridad'|'admin'
                    CHECK (rol IN ('ciudadano', 'autoridad', 'admin')),
    activo          BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Tabla: Direccion
-- Dirección del ciudadano (separada para normalización)
CREATE TABLE bd_transaccional.Direccion (
    id           SERIAL PRIMARY KEY,
    usuario_id   INT          NOT NULL UNIQUE REFERENCES bd_transaccional.Usuario(id) ON DELETE CASCADE,
    calle        VARCHAR(200),
    colonia      VARCHAR(100),
    municipio    VARCHAR(100),
    estado       VARCHAR(100),
    cp           CHAR(5),
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Tabla: Mascota
-- FK → Usuario (dueño), TipoMascota, RazaMascota
-- CA-03: Máximo 3 mascotas por ciudadano (validado en la capa de aplicación)
CREATE TABLE bd_transaccional.Mascota (
    id              SERIAL PRIMARY KEY,
    usuario_id      INT            NOT NULL REFERENCES bd_transaccional.Usuario(id) ON DELETE CASCADE,
    tipo_id         INT            NOT NULL REFERENCES bd_catalogos.TipoMascota(id),
    raza_id         INT            NOT NULL REFERENCES bd_catalogos.RazaMascota(id),
    tamano_id       INT            NOT NULL REFERENCES bd_catalogos.Tamano(id),
    nombre          VARCHAR(100)   NOT NULL,
    peso_actual_kg  NUMERIC(6,2)   NOT NULL CHECK (peso_actual_kg > 0),
    activo          BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- Tabla: SolicitudApoyo
-- Registro principal de solicitudes de bono económico
-- Los campos ima_calculado y clasificacion_ima son calculados por ms_evaluacion
CREATE TABLE bd_transaccional.SolicitudApoyo (
    id                      SERIAL PRIMARY KEY,
    mascota_id              INT            NOT NULL REFERENCES bd_transaccional.Mascota(id),
    usuario_id              INT            NOT NULL REFERENCES bd_transaccional.Usuario(id),
    peso_actual_kg          NUMERIC(6,2)   NOT NULL,
    peso_ideal_kg           NUMERIC(6,2),
    ima_calculado           NUMERIC(5,2),            -- IMA = peso_actual / peso_ideal
    clasificacion_ima       VARCHAR(50),             -- 'Bajo Peso', 'Peso Ideal', 'Sobrepeso', etc.
    monto_sugerido_mxn      NUMERIC(10,2)  DEFAULT 0,
    certificado_vet_path    VARCHAR(500),            -- Ruta del archivo adjunto (opcional)
    estado                  VARCHAR(20)    NOT NULL DEFAULT 'PENDIENTE'
                            CHECK (estado IN ('PENDIENTE', 'EN_REVISION', 'APROBADO', 'RECHAZADO')),
    comentario_autoridad    TEXT,
    revisado_por            INT            REFERENCES bd_transaccional.Usuario(id),  -- FK → autoridad
    fecha_revision          TIMESTAMPTZ,
    created_at              TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);


-- ═══════════════════════════════════════════════════════
-- DATOS SEMILLA — Catálogos base para Fase 2
-- ═══════════════════════════════════════════════════════

-- TipoMascota
INSERT INTO bd_catalogos.TipoMascota (nombre, emoji) VALUES
    ('Perro', '🐕'),
    ('Gato',  '🐈');

-- Tamaños
INSERT INTO bd_catalogos.Tamano (nombre, descripcion) VALUES
    ('Mini / Toy', 'Menos de 5 kg en adulto'),
    ('Pequeño',    '5 – 10 kg en adulto'),
    ('Mediano',    '10 – 25 kg en adulto'),
    ('Grande',     '25 – 45 kg en adulto'),
    ('Gigante',    'Más de 45 kg en adulto');

-- Razas de Perro (tipo_id = 1)
INSERT INTO bd_catalogos.RazaMascota (tipo_id, nombre) VALUES
    (1, 'Labrador Retriever'),
    (1, 'Pastor Alemán'),
    (1, 'Bulldog Francés'),
    (1, 'Chihuahua'),
    (1, 'Golden Retriever'),
    (1, 'Poodle'),
    (1, 'Beagle'),
    (1, 'Yorkshire Terrier'),
    (1, 'Dóberman'),
    (1, 'Mestizo / Criollo');

-- Razas de Gato (tipo_id = 2)
INSERT INTO bd_catalogos.RazaMascota (tipo_id, nombre) VALUES
    (2, 'Siamés'),
    (2, 'Persa'),
    (2, 'Maine Coon'),
    (2, 'Bengalí'),
    (2, 'Ragdoll'),
    (2, 'Sphynx'),
    (2, 'Doméstico / Mestizo');

-- PesoIdeal (Tabla A del SRS) — muestra representativa
-- raza_id referencia el orden de inserción anterior
INSERT INTO bd_catalogos.PesoIdeal (raza_id, tamano_id, peso_min_kg, peso_max_kg, peso_ideal_kg) VALUES
    (1, 4, 27, 36, 32),   -- Labrador / Grande
    (1, 3, 18, 27, 22),   -- Labrador / Mediano
    (2, 4, 30, 40, 35),   -- Pastor Alemán / Grande
    (3, 2, 7,  13, 9),    -- Bulldog Francés / Pequeño
    (4, 1, 1.5, 3.5, 2.5),-- Chihuahua / Mini
    (5, 4, 29, 38, 34),   -- Golden Retriever / Grande
    (6, 1, 2,  4,  3),    -- Poodle / Mini
    (7, 2, 7,  11, 9),    -- Beagle / Pequeño
    (8, 1, 2,  3.5, 2.5), -- Yorkshire / Mini
    (9, 4, 30, 40, 35),   -- Dóberman / Grande
    (10, 3, 12, 22, 16),  -- Mestizo / Mediano
    (11, 2, 3.5, 5.5, 4.5),-- Siamés / Pequeño
    (12, 2, 3,  6,  4),   -- Persa / Pequeño
    (13, 3, 5,  9,  7),   -- Maine Coon / Mediano
    (17, 2, 3.5, 5.5, 4.5);-- Doméstico / Pequeño

-- PoliticaApoyo (Tabla B del SRS)
INSERT INTO bd_catalogos.PoliticaApoyo (clasificacion_ima, ima_min, ima_max, monto_apoyo_mxn, descripcion) VALUES
    ('Bajo Peso Severo', 0.00, 0.74, 1500, 'Apoyo máximo: riesgo crítico de salud'),
    ('Bajo Peso',        0.75, 0.84, 1000, 'Apoyo alto: por debajo del rango saludable'),
    ('Peso Ideal',       0.85, 1.15,    0, 'Sin apoyo: mascota en rango saludable'),
    ('Sobrepeso',        1.16, 1.30,  850, 'Apoyo moderado: plan nutricional requerido'),
    ('Obesidad',         1.31, 9.99, 1200, 'Apoyo alto: riesgo de salud elevado');

-- CostoAlimento
INSERT INTO bd_catalogos.CostoAlimento (tipo_id, tamano_id, costo_mensual) VALUES
    (1, 1, 280),  -- Perro Mini
    (1, 2, 380),  -- Perro Pequeño
    (1, 3, 520),  -- Perro Mediano
    (1, 4, 720),  -- Perro Grande
    (1, 5, 980),  -- Perro Gigante
    (2, 1, 220),  -- Gato Mini
    (2, 2, 310),  -- Gato Pequeño
    (2, 3, 450),  -- Gato Mediano
    (2, 4, 600);  -- Gato Grande

-- Usuarios de demo (passwords = hash de "1234")
-- NOTA: En producción usar bcrypt real; este hash es solo para demo/desarrollo
INSERT INTO bd_transaccional.Usuario (curp, nombre, telefono, email, password_hash, rol) VALUES
    ('GOMA850312MDFNRR09', 'María González',  '7411234567', 'maria@gmail.com',    '$2b$10$demo_hash_ciudadano', 'ciudadano'),
    ('RAOF900615HDFMRR05', 'Oficial Ramírez', '7419876543', 'oficial@gob.mx',     '$2b$10$demo_hash_autoridad', 'autoridad'),
    ('ADSI800101HDFMIN01', 'Admin Sistema',   '7410000001', 'admin@sistema.gob.mx','$2b$10$demo_hash_admin',    'admin');
