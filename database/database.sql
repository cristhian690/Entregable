CREATE DATABASE pres_herramientas
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE pres_herramientas;

CREATE TABLE marcas (
    id_marca   INT AUTO_INCREMENT PRIMARY KEY,
    nombre     VARCHAR(50) NOT NULL,
    create_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE TABLE empleados (
    id_emp     INT AUTO_INCREMENT PRIMARY KEY,
    nombre     VARCHAR(100) NOT NULL,
    cargo      VARCHAR(50),
    area       VARCHAR(50),
    turno      ENUM('mañana','tarde','noche','rotativo'),
    activo     TINYINT(1) DEFAULT 1,
    create_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE TABLE encargados (
    id_encargado INT AUTO_INCREMENT PRIMARY KEY,
    nombre       VARCHAR(100) NOT NULL,
    cargo        VARCHAR(50),
    area         VARCHAR(50),
    turno        ENUM('mañana','tarde','noche','rotativo'),
    activo       TINYINT(1) DEFAULT 1,
    create_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at   TIMESTAMP NULL
);

CREATE TABLE proveedores (
    id_proveedor INT AUTO_INCREMENT PRIMARY KEY,
    nombre       VARCHAR(100) NOT NULL,
    ruc          VARCHAR(20),
    telefono     VARCHAR(20),
    email        VARCHAR(100),
    direccion    VARCHAR(150),
    contacto     VARCHAR(100),
    activo       TINYINT(1) DEFAULT 1,
    create_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE herramientas (
    codigo_herra VARCHAR(20) PRIMARY KEY,
    id_marca     INT NOT NULL,
    nombre       VARCHAR(100) NOT NULL,
    tipo         VARCHAR(50),
    num_serie    VARCHAR(50),
    estado       ENUM('bueno','regular','malo') DEFAULT 'bueno',
    ubicacion    VARCHAR(100),
    cantidad     INT DEFAULT 0,
    stock_minimo INT DEFAULT 1,
    descripcion  VARCHAR(200),
    create_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at   TIMESTAMP NULL,

    FOREIGN KEY (id_marca) REFERENCES marcas(id_marca)
);

CREATE TABLE compras (
    id_compra     INT AUTO_INCREMENT PRIMARY KEY,
    id_proveedor  INT NOT NULL,
    id_encargado  INT NOT NULL,
    fecha         DATETIME DEFAULT CURRENT_TIMESTAMP,
    total         DECIMAL(10,2) DEFAULT 0,
    estado        ENUM('pendiente','recibido','cancelado') DEFAULT 'pendiente',

    FOREIGN KEY (id_proveedor) REFERENCES proveedores(id_proveedor),
    FOREIGN KEY (id_encargado) REFERENCES encargados(id_encargado)
);

CREATE TABLE detalle_compra (
    id_detalle     INT AUTO_INCREMENT PRIMARY KEY,
    id_compra      INT NOT NULL,
    codigo_herra   VARCHAR(20) NOT NULL,
    cantidad       INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,

    FOREIGN KEY (id_compra) REFERENCES compras(id_compra),
    FOREIGN KEY (codigo_herra) REFERENCES herramientas(codigo_herra)
);

CREATE TABLE prestamos (
    id_pres      INT AUTO_INCREMENT PRIMARY KEY,
    id_emp       INT NOT NULL,
    id_encargado INT NOT NULL,
    fecha        DATETIME DEFAULT CURRENT_TIMESTAMP,
    motivo_uso   TEXT,
    area_uso     VARCHAR(50),
    estado       ENUM('activo','devuelto','parcial','cancelado') DEFAULT 'activo',

    FOREIGN KEY (id_emp) REFERENCES empleados(id_emp),
    FOREIGN KEY (id_encargado) REFERENCES encargados(id_encargado)
);

CREATE TABLE detalle_prestamo (
    id_detalle   INT AUTO_INCREMENT PRIMARY KEY,
    id_pres      INT NOT NULL,
    codigo_herra VARCHAR(20) NOT NULL,
    cantidad     INT DEFAULT 1,

    FOREIGN KEY (id_pres) REFERENCES prestamos(id_pres),
    FOREIGN KEY (codigo_herra) REFERENCES herramientas(codigo_herra)
);

CREATE TABLE devoluciones (
    id_devol     INT AUTO_INCREMENT PRIMARY KEY,
    id_pres      INT NOT NULL,
    id_emp       INT NOT NULL,
    id_encargado INT NOT NULL,
    fecha        DATETIME DEFAULT CURRENT_TIMESTAMP,
    observaciones TEXT,
    estado       ENUM('bueno','regular','dañado','incompleto'),

    FOREIGN KEY (id_pres) REFERENCES prestamos(id_pres),
    FOREIGN KEY (id_emp) REFERENCES empleados(id_emp),
    FOREIGN KEY (id_encargado) REFERENCES encargados(id_encargado)
);

CREATE TABLE detalle_devolucion (
    id_detalle   INT AUTO_INCREMENT PRIMARY KEY,
    id_devol     INT,
    codigo_herra VARCHAR(20),
    cantidad     INT,
    estado       ENUM('bueno','regular','dañado'),

    FOREIGN KEY (id_devol) REFERENCES devoluciones(id_devol),
    FOREIGN KEY (codigo_herra) REFERENCES herramientas(codigo_herra)
);

CREATE TABLE movimientos_stock (
    id_mov         INT AUTO_INCREMENT PRIMARY KEY,
    codigo_herra   VARCHAR(20),
    tipo           ENUM('entrada','salida'),
    cantidad       INT,
    motivo         VARCHAR(100),
    fecha          DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (codigo_herra) REFERENCES herramientas(codigo_herra)
);

CREATE TABLE alertas (
    id_alerta INT AUTO_INCREMENT PRIMARY KEY,
    tipo      ENUM('prestamo_vencido','stock_bajo','herramienta_danada','otro'),
    mensaje   TEXT,
    id_pres   INT,
    leida     TINYINT(1) DEFAULT 0,
    fecha     DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (id_pres) REFERENCES prestamos(id_pres)
);

CREATE TABLE historial (
    id_historial INT AUTO_INCREMENT PRIMARY KEY,
    accion       VARCHAR(50),
    tabla_ref    VARCHAR(50),
    registro_ref INT,
    descripcion  TEXT,
    usuario      VARCHAR(100),
    ip_origen    VARCHAR(45),
    fecha        DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE usuarios (
    id_usuario  INT AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL,
    email       VARCHAR(100) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    rol         ENUM('admin','encargado','empleado') DEFAULT 'encargado',
    activo      TINYINT(1) DEFAULT 1,
    ultimo_login DATETIME NULL,
    create_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at  TIMESTAMP NULL
);


DELIMITER $$

CREATE TRIGGER trg_salida_prestamo
AFTER INSERT ON detalle_prestamo
FOR EACH ROW
BEGIN
    UPDATE herramientas
    SET cantidad = cantidad - NEW.cantidad
    WHERE codigo_herra = NEW.codigo_herra;

    INSERT INTO movimientos_stock (codigo_herra, tipo, cantidad, motivo)
    VALUES (NEW.codigo_herra, 'salida', NEW.cantidad, 'prestamo');
END$$

DELIMITER ;

DELIMITER $$

CREATE TRIGGER trg_entrada_devolucion
AFTER INSERT ON detalle_devolucion
FOR EACH ROW
BEGIN
    UPDATE herramientas
    SET cantidad = cantidad + NEW.cantidad
    WHERE codigo_herra = NEW.codigo_herra;

    INSERT INTO movimientos_stock (codigo_herra, tipo, cantidad, motivo)
    VALUES (NEW.codigo_herra, 'entrada', NEW.cantidad, 'devolucion');
END$$

DELIMITER ;

DELIMITER $$

CREATE TRIGGER trg_entrada_compra
AFTER INSERT ON detalle_compra
FOR EACH ROW
BEGIN
    UPDATE herramientas
    SET cantidad = cantidad + NEW.cantidad
    WHERE codigo_herra = NEW.codigo_herra;

    INSERT INTO movimientos_stock (codigo_herra, tipo, cantidad, motivo)
    VALUES (NEW.codigo_herra, 'entrada', NEW.cantidad, 'compra');
END$$

DELIMITER ;

-- ⚠️ IMPORTANTE: Las contraseñas aquí están en texto plano.
-- Después de importar este SQL, ejecutar UNA SOLA VEZ:
--   node scripts/seed_usuarios.js
-- Esto hashea las contraseñas con bcrypt para que el login funcione.
INSERT INTO usuarios (nombre, email, password, rol) VALUES
  ('Administrador', 'admin@taller.com',  'admin123', 'admin'),
  ('Carlos Quispe', 'carlos@taller.com', '1234',     'encargado'),
  ('Juan Pérez',    'juan@taller.com',   '1234',     'empleado');


INSERT INTO marcas (nombre) VALUES
  ('Bosch'), ('Stanley'), ('Truper'), ('Makita'),
  ('Dewalt'), ('Black & Decker'), ('Urrea'), ('Pretul'),
  ('Hilti'), ('Milwaukee')
ON DUPLICATE KEY UPDATE nombre = nombre;


INSERT INTO empleados (nombre, cargo, area, turno) VALUES
  ('Juan Pérez',     'Operario',     'Soldadura',     'mañana'),
  ('María López',    'Técnico',      'Mantenimiento', 'tarde'),
  ('Carlos Ramos',   'Supervisor',   'Producción',    'mañana'),
  ('Ana Torres',     'Operaria',     'Soldadura',     'noche'),
  ('Luis Mendoza',   'Técnico',      'Eléctrica',     'mañana'),
  ('Rosa Huanca',    'Operaria',     'Producción',    'tarde'),
  ('Pedro Castillo', 'Mecánico',     'Mantenimiento', 'mañana'),
  ('Sofia Vargas',   'Electricista', 'Eléctrica',     'tarde'),
  ('Jorge Díaz',     'Operario',     'Soldadura',     'mañana'),
  ('Lucia Mamani',   'Técnico',      'Producción',    'noche')
ON DUPLICATE KEY UPDATE nombre = nombre;


INSERT INTO encargados (nombre, cargo, area, turno) VALUES
  ('Carlos Quispe',  'Almacenero',  'Almacén', 'mañana'),
  ('Lucia Flores',   'Supervisora', 'Almacén', 'tarde'),
  ('Marco Paredes',  'Almacenero',  'Almacén', 'noche')
ON DUPLICATE KEY UPDATE nombre = nombre;


INSERT INTO proveedores (nombre, ruc, telefono, email, direccion, contacto) VALUES
  ('Ferretek S.A.',        '20112233445', '987001001', 'ventas@ferretek.com',   'Av. Industrial 123', 'Roberto Lima'),
  ('Herramax Peru',        '20223344556', '987002002', 'info@herramax.pe',      'Jr. Comercio 456',   'Carla Ruiz'),
  ('Distribuidora Norte',  '20334455667', '987003003', 'norte@distrib.com',     'Av. Norte 789',      'Diego Paz'),
  ('TecnoTools',           '20445566778', '987004004', 'ventas@tecnotools.pe',  'Calle Tecno 321',    'Ana Vega')
ON DUPLICATE KEY UPDATE nombre = nombre;


INSERT INTO herramientas (codigo_herra, id_marca, nombre, tipo, num_serie, estado, ubicacion, cantidad, stock_minimo, descripcion) VALUES
  ('H-001', 1, 'Esmeril Angular',        'eléctrica', 'SN-001', 'bueno',   'Estante A1', 4, 2, 'Esmeril 4.5 pulgadas'),
  ('H-002', 2, 'Martillo',               'manual',    'SN-002', 'bueno',   'Gabinete B2',10, 3, 'Martillo de carpintero'),
  ('H-003', 3, 'Taladro',                'eléctrica', 'SN-003', 'bueno',   'Estante A2', 2, 2, 'Taladro percutor'),
  ('H-004', 4, 'Sierra Circular',        'eléctrica', 'SN-004', 'bueno',   'Estante A3', 1, 2, 'Sierra 7.25 pulgadas'),
  ('H-005', 1, 'Llave Inglesa',          'manual',    'SN-005', 'bueno',   'Gabinete B1', 8, 2, 'Llave ajustable 12"'),
  ('H-006', 2, 'Destornillador Estrella','manual',    'SN-006', 'bueno',   'Gabinete C1',15, 3, 'Juego de destornilladores'),
  ('H-007', 3, 'Nivel de Burbuja',       'manual',    'SN-007', 'bueno',   'Estante B1', 6, 2, 'Nivel 60cm'),
  ('H-008', 4, 'Soldadora MIG',          'eléctrica', 'SN-008', 'bueno',   'Zona Sold.',  2, 1, 'Soldadora 180A'),
  ('H-009', 5, 'Lijadora Orbital',       'eléctrica', 'SN-009', 'bueno',   'Estante A4', 3, 1, 'Lijadora de disco'),
  ('H-010', 6, 'Pistola de Calor',       'eléctrica', 'SN-010', 'regular', 'Estante B2', 2, 2, 'Pistola 2000W'),
  ('H-011', 7, 'Llave Torque',           'manual',    'SN-011', 'bueno',   'Gabinete B3', 4, 2, 'Llave de torque 1/2"'),
  ('H-012', 8, 'Alicate Universal',      'manual',    'SN-012', 'bueno',   'Gabinete C2', 9, 3, 'Alicate 8 pulgadas'),
  ('H-013', 1, 'Rotomartillo',           'eléctrica', 'SN-013', 'bueno',   'Estante A5', 2, 1, 'Rotomartillo SDS'),
  ('H-014', 2, 'Cinta Métrica',          'manual',    'SN-014', 'bueno',   'Gabinete C3',12, 4, 'Cinta 5 metros'),
  ('H-015', 3, 'Flexómetro',             'manual',    'SN-015', 'bueno',   'Gabinete C4', 8, 2, 'Flexómetro 8 metros'),
  ('H-016', 4, 'Multímetro',             'eléctrica', 'SN-016', 'bueno',   'Gabinete D1', 3, 1, 'Multímetro digital'),
  ('H-017', 5, 'Cortadora de Disco',     'eléctrica', 'SN-017', 'bueno',   'Estante A6', 1, 1, 'Cortadora 14"'),
  ('H-018', 6, 'Compresor de Aire',      'eléctrica', 'SN-018', 'bueno',   'Zona Comp.',  1, 1, 'Compresor 50L'),
  ('H-019', 7, 'Llave de Cadena',        'manual',    'SN-019', 'regular', 'Gabinete B4', 2, 2, 'Llave de cadena 24"'),
  ('H-020', 8, 'Serrucho',               'manual',    'SN-020', 'bueno',   'Gabinete D2', 5, 2, 'Serrucho 22"')
ON DUPLICATE KEY UPDATE nombre = nombre;


INSERT INTO prestamos (id_emp, id_encargado, fecha, motivo_uso, area_uso, estado) VALUES
  (1, 1, DATE_SUB(NOW(), INTERVAL 165 DAY), 'Corte de tubería',         'Soldadura',     'devuelto'),
  (2, 1, DATE_SUB(NOW(), INTERVAL 155 DAY), 'Instalación eléctrica',    'Eléctrica',     'devuelto'),
  (3, 2, DATE_SUB(NOW(), INTERVAL 145 DAY), 'Mantenimiento de maquina', 'Mantenimiento', 'devuelto'),
  (4, 1, DATE_SUB(NOW(), INTERVAL 135 DAY), 'Reparación de estructura', 'Soldadura',     'devuelto'),
  (5, 2, DATE_SUB(NOW(), INTERVAL 125 DAY), 'Instalación de ductos',    'Eléctrica',     'devuelto'),
  (1, 1, DATE_SUB(NOW(), INTERVAL 115 DAY), 'Corte de metal',           'Producción',    'devuelto'),
  (2, 2, DATE_SUB(NOW(), INTERVAL 105 DAY), 'Revisión de equipos',      'Mantenimiento', 'devuelto'),
  (3, 1, DATE_SUB(NOW(), INTERVAL  95 DAY), 'Soldadura de piezas',      'Soldadura',     'devuelto'),
  (6, 2, DATE_SUB(NOW(), INTERVAL  85 DAY), 'Perforación de paredes',   'Producción',    'devuelto'),
  (7, 1, DATE_SUB(NOW(), INTERVAL  75 DAY), 'Ajuste de maquinaria',     'Mantenimiento', 'devuelto'),
  (8, 2, DATE_SUB(NOW(), INTERVAL  65 DAY), 'Instalación eléctrica',    'Eléctrica',     'devuelto'),
  (1, 1, DATE_SUB(NOW(), INTERVAL  55 DAY), 'Corte de tubería',         'Soldadura',     'devuelto'),
  (2, 2, DATE_SUB(NOW(), INTERVAL  45 DAY), 'Mantenimiento preventivo', 'Mantenimiento', 'devuelto'),
  (3, 1, DATE_SUB(NOW(), INTERVAL  35 DAY), 'Instalación de ductos',    'Eléctrica',     'devuelto'),
  (4, 2, DATE_SUB(NOW(), INTERVAL  25 DAY), 'Reparación de equipos',    'Producción',    'devuelto'),
  (5, 1, DATE_SUB(NOW(), INTERVAL  20 DAY), 'Soldadura de estructura',  'Soldadura',     'devuelto'),
  (6, 2, DATE_SUB(NOW(), INTERVAL  15 DAY), 'Perforación de losa',      'Producción',    'devuelto'),
  (7, 1, DATE_SUB(NOW(), INTERVAL  10 DAY), 'Ajuste de tornillos',      'Mantenimiento', 'devuelto'),
  (1, 2, DATE_SUB(NOW(), INTERVAL   5 DAY), 'Corte de perfil metálico', 'Soldadura',     'activo'),
  (2, 1, DATE_SUB(NOW(), INTERVAL   2 DAY), 'Instalación de cableado',  'Eléctrica',     'activo');


INSERT INTO detalle_prestamo (id_pres, codigo_herra, cantidad) VALUES
  (1,  'H-001', 1), (1,  'H-002', 2),
  (2,  'H-016', 1), (2,  'H-007', 1),
  (3,  'H-011', 1), (3,  'H-012', 2),
  (4,  'H-008', 1), (4,  'H-001', 1),
  (5,  'H-010', 1), (5,  'H-016', 1),
  (6,  'H-004', 1), (6,  'H-002', 1),
  (7,  'H-007', 1), (7,  'H-014', 2),
  (8,  'H-008', 1), (8,  'H-001', 1),
  (9,  'H-013', 1), (9,  'H-003', 1),
  (10, 'H-011', 1), (10, 'H-005', 2),
  (11, 'H-016', 1), (11, 'H-010', 1),
  (12, 'H-001', 1), (12, 'H-017', 1),
  (13, 'H-007', 1), (13, 'H-015', 2),
  (14, 'H-016', 1), (14, 'H-006', 3),
  (15, 'H-009', 1), (15, 'H-004', 1),
  (16, 'H-008', 1), (16, 'H-002', 2),
  (17, 'H-013', 1), (17, 'H-003', 1),
  (18, 'H-011', 1), (18, 'H-012', 2),
  (19, 'H-001', 1),
  (20, 'H-016', 1);

-- ── DEVOLUCIONES (préstamos devueltos) ────────────────────────
INSERT INTO devoluciones (id_pres, id_emp, id_encargado, observaciones, estado) VALUES
  (1,  1, 1, 'Devuelto en buen estado', 'bueno'),
  (2,  2, 1, 'Devuelto en buen estado', 'bueno'),
  (3,  3, 2, 'Devuelto en buen estado', 'bueno'),
  (4,  4, 1, 'Pequeño desgaste',        'regular'),
  (5,  5, 2, 'Devuelto en buen estado', 'bueno'),
  (6,  1, 1, 'Devuelto en buen estado', 'bueno'),
  (7,  2, 2, 'Devuelto en buen estado', 'bueno'),
  (8,  3, 1, 'Devuelto en buen estado', 'bueno'),
  (9,  6, 2, 'Devuelto en buen estado', 'bueno'),
  (10, 7, 1, 'Pequeño golpe en mango',  'regular'),
  (11, 8, 2, 'Devuelto en buen estado', 'bueno'),
  (12, 1, 1, 'Devuelto en buen estado', 'bueno'),
  (13, 2, 2, 'Devuelto en buen estado', 'bueno'),
  (14, 3, 1, 'Devuelto en buen estado', 'bueno'),
  (15, 4, 2, 'Devuelto en buen estado', 'bueno'),
  (16, 5, 1, 'Devuelto en buen estado', 'bueno'),
  (17, 6, 2, 'Devuelto en buen estado', 'bueno'),
  (18, 7, 1, 'Devuelto en buen estado', 'bueno');