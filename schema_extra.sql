-- ============================================================
--  BRITASGG Avatar Project — Tablas adicionales
--  Ejecutar en MySQL Workbench sobre la BD brittasgg existente
-- ============================================================

USE brittasgg;

-- Tabla citas
CREATE TABLE IF NOT EXISTS citas (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  nombre          VARCHAR(120) NOT NULL,
  telefono        VARCHAR(30)  NOT NULL,
  email           VARCHAR(180),
  fecha_preferida DATE         NOT NULL,
  servicio        ENUM('color','diseno','accesorios','avatar') NOT NULL,
  estado          ENUM('pendiente','confirmada','cancelada') DEFAULT 'pendiente',
  notas           TEXT,
  creado_en       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla contacto_mensajes
CREATE TABLE IF NOT EXISTS contacto_mensajes (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  nombre    VARCHAR(120) NOT NULL,
  email     VARCHAR(180) NOT NULL,
  mensaje   TEXT         NOT NULL,
  leido     TINYINT(1)   DEFAULT 0,
  creado_en DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla modelos_glb (catálogo de prendas 3D)
CREATE TABLE IF NOT EXISTS modelos_glb (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  nombre       VARCHAR(150) NOT NULL,
  archivo_glb  VARCHAR(300) NOT NULL,   -- ruta relativa: models/prendas/vestido-1.glb
  tipo         ENUM('vestido','camiseta','pantalon','chaqueta','blusa','falda') NOT NULL,
  colores_hex  JSON,                    -- ["#d41152","#dc2626","#000000"]
  descripcion  TEXT,
  activo       TINYINT(1) DEFAULT 1,
  creado_en    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tipo (tipo)
);

-- Datos semilla: modelos GLB del proyecto
INSERT INTO modelos_glb (nombre, archivo_glb, tipo, colores_hex, descripcion) VALUES
('Vestido Elegante 1',     'models/prendas/vestido-1.glb',                    'vestido',   '["#d41152","#000000","#8b5cf6"]', 'Vestido elegante de noche'),
('Vestido Clásico 3',      'models/prendas/vestido-3.glb',                    'vestido',   '["#dc2626","#1e3a8a","#ffffff"]', 'Vestido clásico de día'),
('Vestido Floral 4',       'models/prendas/vestido-4.glb',                    'vestido',   '["#f472b6","#34d399","#fbbf24"]', 'Vestido floral primavera'),
('Vestido Midi 5',         'models/prendas/vestido-5.glb',                    'vestido',   '["#7c3aed","#0891b2","#059669"]', 'Vestido midi elegante'),
('Vestido Noche 6',        'models/prendas/vestido-6.glb',                    'vestido',   '["#000000","#1e1b4b","#7f1d1d"]', 'Vestido de noche sofisticado'),
('Vestido Floral Blanco',  'models/prendas/white_floral_dress_blooming_ele...','vestido',   '["#ffffff","#f9a8d4","#bbf7d0"]', 'Vestido floral blanco'),
('Blusa Casual',           'models/prendas/blusa.glb',                        'blusa',     '["#3b82f6","#ef4444","#ffffff"]', 'Blusa casual cómoda'),
('Pantalón Clásico',       'models/prendas/pantalon.glb',                     'pantalon',  '["#1e3a8a","#000000","#78716c"]', 'Pantalón clásico'),
('Chaqueta Elegante',      'models/prendas/chaqueta.glb',                     'chaqueta',  '["#374151","#000000","#78350f"]', 'Chaqueta elegante'),
('Conjunto Fiesta',        'models/prendas/party_dress.glb',                  'vestido',   '["#d41152","#7c3aed","#000000"]', 'Conjunto de fiesta'),
('Vestido Saree',          'models/prendas/mom_dress_saree_and_blouse.glb',   'vestido',   '["#dc2626","#f59e0b","#10b981"]', 'Vestido estilo saree'),
('Vestido Crop',           'models/prendas/basic_crop_top_and_pants.glb',     'vestido',   '["#000000","#ffffff","#6b7280"]', 'Conjunto crop top'),
('Vestido Vintage',        'models/prendas/free_evening_dress.glb',           'vestido',   '["#7f1d1d","#1e1b4b","#064e3b"]', 'Vestido vintage noche');