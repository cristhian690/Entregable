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