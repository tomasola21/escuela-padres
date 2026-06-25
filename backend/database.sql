CREATE DATABASE IF NOT EXISTS escuela_padres;
USE escuela_padres;

CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  rol ENUM('administrador', 'supervisor') NOT NULL DEFAULT 'supervisor',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE formularios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  evento VARCHAR(255) DEFAULT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_cierre DATE NOT NULL,
  estado ENUM('activo', 'inactivo') DEFAULT 'activo',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE qrs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  formulario_id INT NOT NULL,
  codigo VARCHAR(255) NOT NULL UNIQUE,
  activo TINYINT(1) DEFAULT 1,
  fecha_inicio DATE NULL,
  fecha_cierre DATE NULL,
  config TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (formulario_id) REFERENCES formularios(id) ON DELETE CASCADE
);

CREATE TABLE grados (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE secciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE estudiantes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(50) NOT NULL UNIQUE,
  nombre_completo VARCHAR(255) NOT NULL,
  grado_id INT NOT NULL,
  seccion_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (grado_id) REFERENCES grados(id) ON DELETE CASCADE,
  FOREIGN KEY (seccion_id) REFERENCES secciones(id) ON DELETE CASCADE
);

CREATE TABLE asistencias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  formulario_id INT NOT NULL,
  qr_id INT NULL,
  grado_id INT NOT NULL,
  seccion_id INT NOT NULL,
  estudiante_id INT NOT NULL,
  device_id VARCHAR(255) DEFAULT NULL,
  latitud DECIMAL(10,8) DEFAULT NULL,
  longitud DECIMAL(11,8) DEFAULT NULL,
  navegador VARCHAR(255) DEFAULT NULL,
  registrado_por VARCHAR(50) DEFAULT NULL,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (formulario_id) REFERENCES formularios(id) ON DELETE CASCADE,
  FOREIGN KEY (qr_id) REFERENCES qrs(id) ON DELETE SET NULL,
  FOREIGN KEY (grado_id) REFERENCES grados(id) ON DELETE CASCADE,
  FOREIGN KEY (seccion_id) REFERENCES secciones(id) ON DELETE CASCADE,
  FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON DELETE CASCADE
);

CREATE TABLE configuracion (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clave VARCHAR(255) NOT NULL UNIQUE,
  valor VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO configuracion (clave, valor) VALUES
('permitir_un_solo_envio', 'true'),
('permitir_multiple_envio', 'false');

-- Usuario administrador por defecto
-- La contraseña por defecto es 'admin123'
-- DESPUÉS DE EJECUTAR ESTE SCRIPT, DEBES GENERAR UN HASH REAL:
-- 1. Ejecuta: node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('admin123', 10));"
-- 2. Copia el hash y ejecuta: UPDATE usuarios SET password = 'hash_generado' WHERE email = 'admin@escueladepadres.com';
INSERT INTO usuarios (nombre, email, password, rol) VALUES
('Administrador', 'admin@escueladepadres.com', '$2a$10$placeholder_hash_para_crear_usuario_inicial', 'administrador');
