# Sistema de Control de Asistencia - Escuela de Padres

Plataforma web para el registro de asistencia de padres de familia mediante códigos QR, con panel administrativo completo para la gestión de formularios, grados, secciones, estudiantes y reportes.

## Tecnologías

| Capa       | Tecnología              |
|------------|------------------------|
| Frontend   | React 18 + Vite        |
| Backend    | Node.js + Express      |
| Base de Datos | MySQL               |
| Mapas      | Leaflet + react-leaflet|
| Gráficos   | Chart.js               |
| QR         | qrcode                 |
| Autenticación | JWT                |
| Seguridad  | Helmet, CORS, bcryptjs |

## Características

### Para el Padre de Familia
- Escanea un código QR y accede al formulario de asistencia
- Selecciona grado, sección y nombre del estudiante (carga dinámica)
- Geolocalización automática
- Registro único por dispositivo (control con `crypto.randomUUID()`)
- Diseño responsive para móviles

### Para el Administrador
- Dashboard con estadísticas y gráficos
- CRUD de formularios con campo "evento" (reutilizable para: Escuela de Padres, APAFA, Charlas, Talleres, etc.)
- Generación automática de códigos QR por formulario
- Gestión de grados, secciones y estudiantes
- Importación masiva de estudiantes desde Excel
- Reportes exportables (Excel, PDF)
- Mapa interactivo con ubicación exacta de cada registro
- Control de registro único por dispositivo (configurable)

## Estructura del Proyecto

```
escuela-de-padres/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuración de base de datos
│   │   ├── controllers/     # Lógica de negocio
│   │   ├── middleware/      # Autenticación y validación
│   │   ├── routes/          # Rutas de la API
│   │   ├── utils/           # Utilidades
│   │   └── app.js           # Punto de entrada
│   ├── database.sql         # Esquema de base de datos
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/      # Componentes reutilizables
│   │   ├── pages/           # Páginas de la aplicación
│   │   │   ├── admin/       # Panel administrativo
│   │   │   └── public/      # Formulario público QR
│   │   ├── services/        # Servicios API
│   │   ├── hooks/           # Hooks personalizados
│   │   ├── context/         # Contexto de autenticación
│   │   └── styles/          # Estilos globales
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Instalación

### Requisitos Previos

- Node.js 18 o superior
- MySQL 8.0 o superior
- npm o yarn

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/escuela-padres.git
cd escuela-padres
```

### 2. Configurar Base de Datos MySQL

```bash
# Acceder a MySQL
mysql -u root -p

# Ejecutar el script de base de datos
source backend/database.sql;
```

Esto creará la base de datos `escuela_padres` con todas las tablas necesarias y un usuario administrador por defecto.

### 3. Configurar Variables de Entorno

```bash
# Backend
cp backend/.env.example backend/.env
```

Editar `backend/.env`:

```env
PORT=4000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=escuela_padres
JWT_SECRET=tu_clave_secreta_jwt
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

```bash
# Frontend
cp frontend/.env.example frontend/.env
```

Editar `frontend/.env`:

```env
VITE_API_URL=http://localhost:4000/api
```

### 4. Instalar Dependencias

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 5. Generar Contraseña para el Administrador

La base de datos inserta un usuario administrador por defecto con una contraseña hash. Debes generar el hash real:

```bash
cd backend
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('admin123', 10));"
```

Copia el hash generado y actualiza la contraseña en MySQL:

```sql
UPDATE usuarios SET password = 'tu_hash_generado' WHERE email = 'admin@escueladepadres.com';
```

### 6. Ejecutar Localmente

```bash
# Backend (puerto 4000)
cd backend
npm run dev

# Frontend (puerto 5173)
cd frontend
npm run dev
```

Abrir `http://localhost:5173` en el navegador.

### Credenciales por Defecto

- **Email:** admin@escueladepadres.com
- **Contraseña:** admin123

## Despliegue

### Frontend en Vercel

1. Conectar repositorio a Vercel
2. Configurar:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Variables de entorno:
   - `VITE_API_URL`: URL del backend en Railway (ej: `https://tu-backend.railway.app/api`)

### Backend en Railway

1. Crear nuevo proyecto en Railway desde GitHub
2. Configurar:
   - **Root Directory:** `backend`
   - **Start Command:** `npm start`
3. Variables de entorno en Railway:
   - `PORT`: 4000
   - `DB_HOST`: Host de MySQL (Railway o externo)
   - `DB_USER`: Usuario MySQL
   - `DB_PASSWORD`: Contraseña MySQL
   - `DB_NAME`: escuela_padres
   - `JWT_SECRET`: Clave secreta JWT
   - `JWT_EXPIRES_IN`: 7d
   - `FRONTEND_URL`: URL del frontend en Vercel

### Base de Datos MySQL

Puedes usar:
- **Railway MySQL Plugin** (recomendado)
- **Aiven MySQL**
- **PlanetScale**
- **Clever Cloud MySQL**
- Cualquier hosting MySQL con conexión remota

## Uso del Sistema

### Flujo del Padre de Familia

1. El padre escanea el código QR con su teléfono
2. Se abre el formulario de asistencia
3. Selecciona: Grado → Sección → Nombre del Estudiante
4. El sistema solicita permiso de ubicación
5. Confirma y envía el formulario
6. Ve el mensaje "Registro realizado correctamente"

### Flujo del Administrador

1. Inicia sesión en `/admin/login`
2. Dashboard: visualiza estadísticas generales
3. Crea formularios (Ej: "Escuela de Padres Marzo", "Charla de Convivencia")
4. Cada formulario genera automáticamente un QR único
5. Gestiona grados, secciones y estudiantes
6. Visualiza asistencias con mapa de ubicación
7. Exporta reportes en Excel, PDF o CSV

### Campo "Evento"

Cada formulario incluye un campo **evento** que permite categorizar la actividad:

- Escuela de Padres
- Reunión de APAFA
- Entrega de Libretas
- Talleres
- Charlas
- Cualquier otro evento

Esto permite reutilizar el sistema para diferentes tipos de eventos sin crear nuevos sistemas.

## API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/verificar` - Verificar token

### Formularios (requiere autenticación)
- `GET /api/formularios` - Listar todos
- `GET /api/formularios/:id` - Obtener uno
- `POST /api/formularios` - Crear (admin)
- `PUT /api/formularios/:id` - Actualizar (admin)
- `DELETE /api/formularios/:id` - Eliminar (admin)
- `PATCH /api/formularios/:id/toggle-estado` - Activar/Desactivar (admin)

### QR
- `GET /api/qr/verificar/:codigo` - Verificar QR (público)
- `GET /api/qr/imagen/:codigo` - Obtener imagen QR (público)
- `GET /api/qr` - Listar QRs (auth)
- `GET /api/qr/formulario/:formulario_id` - QR por formulario (auth)
- `POST /api/qr/:formulario_id/regenerar` - Regenerar QR (admin)
- `PATCH /api/qr/:id/toggle-activo` - Activar/Desactivar QR (admin)

### Grados, Secciones, Estudiantes (requiere autenticación)
- CRUD completo para cada entidad
- `POST /api/estudiantes/importar-excel` - Importación masiva (admin)

### Asistencias
- `POST /api/asistencias` - Registrar asistencia (público)
- `GET /api/asistencias/verificar-dispositivo/:formulario_id/:device_id` - Verificar dispositivo (público)
- `GET /api/asistencias` - Listar (auth)
- `GET /api/asistencias/estadisticas` - Estadísticas (auth)

### Reportes (requiere autenticación)
- `GET /api/reportes/dashboard` - Datos del dashboard (público)
- `GET /api/reportes?formato=pdf|xlsx` - Exportar reportes

### Configuración
- `GET /api/configuracion` - Obtener configuración
- `PUT /api/configuracion` - Actualizar (admin)

## Seguridad

- **JWT**: Autenticación basada en tokens con expiración
- **Helmet**: Cabeceras HTTP seguras
- **CORS**: Control de acceso cruzado
- **bcryptjs**: Contraseñas hasheadas
- **express-validator**: Validación de datos de entrada
- **SQL Injection**: Prevención mediante consultas parametrizadas
- **Variables de entorno**: Configuración sensible protegida

## Licencia

MIT
