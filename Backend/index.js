const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('./db');
const { OAuth2Client } = require('google-auth-library');

// Inicializar la aplicación
const app = express();
const PORT = 3001;
const client = new OAuth2Client('302628722954-stoilnvt45o0dj6l3beje83phftob2m8.apps.googleusercontent.com');

// Middlewares
app.use(cors());
app.use(express.json());

// Endpoint de prueba
app.get('/', (req, res) => {
  res.send('¡El backend de la Plataforma Municipal está vivo!');
});

// ==========================================
// ENDPOINTS PARA CARPETAS (EP 2.3)
// ==========================================

// 1. GET: Obtener todas las carpetas
app.get('/api/carpetas', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM carpetas ORDER BY id_carpeta ASC');
    // 200 OK
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error.message);
    // 500 Internal Server Error
    res.status(500).json({ error: 'Error en el servidor al obtener las carpetas' });
  }
});

// 2. GET: Obtener una carpeta por ID
app.get('/api/carpetas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM carpetas WHERE id_carpeta = $1', [id]);

    if (result.rows.length === 0) {
      // 404 Not Found
      return res.status(404).json({ error: 'Carpeta no encontrada' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// 3. POST: Crear una nueva carpeta
app.post('/api/carpetas', async (req, res) => {
  try {
    const { nombre_carpeta } = req.body;

    // Validación básica
    if (!nombre_carpeta) {
      // 400 Bad Request
      return res.status(400).json({ error: 'El nombre de la carpeta es obligatorio' });
    }

    const result = await pool.query(
      'INSERT INTO carpetas (nombre_carpeta) VALUES ($1) RETURNING *',
      [nombre_carpeta]
    );

    // 201 Created
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Error al crear la carpeta' });
  }
});

// 4. PUT: Actualizar el nombre de una carpeta existente
app.put('/api/carpetas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_carpeta } = req.body;

    if (!nombre_carpeta) {
      return res.status(400).json({ error: 'El nuevo nombre es obligatorio' });
    }

    const result = await pool.query(
      'UPDATE carpetas SET nombre_carpeta = $1 WHERE id_carpeta = $2 RETURNING *',
      [nombre_carpeta, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Carpeta no encontrada para actualizar' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Error al actualizar la carpeta' });
  }
});

// 5. DELETE: Eliminar una carpeta
app.delete('/api/carpetas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM carpetas WHERE id_carpeta = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Carpeta no encontrada para eliminar' });
    }

    res.status(200).json({ mensaje: 'Carpeta eliminada exitosamente', carpeta: result.rows[0] });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Error al eliminar la carpeta (puede contener documentos)' });
  }
});

// ==========================================
// ENDPOINTS PARA DOCUMENTOS
// ==========================================

// 1. GET: Obtener documentos (opcionalmente filtrados por carpeta)
app.get('/api/documentos', async (req, res) => {
  try {
    const { id_carpeta } = req.query;
    let query = 'SELECT * FROM documentos';
    let params = [];

    if (id_carpeta) {
      query += ' WHERE id_carpeta = $1';
      params.push(id_carpeta);
    }
    
    query += ' ORDER BY fecha_subida DESC';
    const result = await pool.query(query, params);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Error al obtener documentos' });
  }
});

// 2. POST: Crear un nuevo documento
app.post('/api/documentos', async (req, res) => {
  try {
    const { id_carpeta, nombre_archivo, ruta_almacenamiento, subido_por } = req.body;

    if (!id_carpeta || !nombre_archivo) {
      return res.status(400).json({ error: 'Carpeta y nombre de archivo son obligatorios' });
    }

    const result = await pool.query(
      `INSERT INTO documentos (id_carpeta, nombre_archivo, ruta_almacenamiento, subido_por, fecha_subida) 
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) RETURNING *`,
      [id_carpeta, nombre_archivo, ruta_almacenamiento || '', subido_por || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Error al crear el documento' });
  }
});

// 3. PUT: Actualizar un documento
app.put('/api/documentos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_archivo, id_carpeta } = req.body;

    const result = await pool.query(
      'UPDATE documentos SET nombre_archivo = COALESCE($1, nombre_archivo), id_carpeta = COALESCE($2, id_carpeta) WHERE id_documento = $3 RETURNING *',
      [nombre_archivo, id_carpeta, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Error al actualizar documento' });
  }
});

// 4. DELETE: Eliminar un documento
app.delete('/api/documentos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM documentos WHERE id_documento = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }

    res.status(200).json({ mensaje: 'Documento eliminado', documento: result.rows[0] });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Error al eliminar documento' });
  }
});

// ==========================================
// ENDPOINTS PARA NOTIFICACIONES
// ==========================================

// 1. GET: Obtener notificaciones por usuario
app.get('/api/notificaciones/:id_usuario', async (req, res) => {
  try {
    const { id_usuario } = req.params;
    const result = await pool.query(
      'SELECT * FROM notificaciones WHERE id_usuario = $1 ORDER BY fecha_notificacion DESC',
      [id_usuario]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
});

// 2. POST: Crear una notificación (ej: para el sistema)
app.post('/api/notificaciones', async (req, res) => {
  try {
    const { id_usuario, mensaje } = req.body;
    if (!id_usuario || !mensaje) {
      return res.status(400).json({ error: 'Usuario y mensaje son obligatorios' });
    }
    const result = await pool.query(
      'INSERT INTO notificaciones (id_usuario, mensaje, leida, fecha_notificacion) VALUES ($1, $2, false, CURRENT_TIMESTAMP) RETURNING *',
      [id_usuario, mensaje]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Error al crear notificación' });
  }
});

// 3. PUT: Marcar como leída
app.put('/api/notificaciones/:id/leer', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'UPDATE notificaciones SET leida = true WHERE id_notificacion = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Error al actualizar notificación' });
  }
});

// 4. DELETE: Eliminar notificación
app.delete('/api/notificaciones/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM notificaciones WHERE id_notificacion = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }
    res.status(200).json({ mensaje: 'Notificación eliminada' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Error al eliminar notificación' });
  }
});

// ==========================================
// ENDPOINTS PARA TRÁMITES
// ==========================================

// 1. GET: Obtener trámites con filtros
app.get('/api/tramites', async (req, res) => {
  try {
    const { estado, tipo, id_usuario } = req.query;
    let query = `
      SELECT t.*, e.nombre_estado, tt.nombre_tipo 
      FROM tramites t
      JOIN estados_tramite e ON t.id_estado = e.id_estado
      JOIN tipos_tramite tt ON t.id_tipo = tt.id_tipo
      WHERE 1=1
    `;
    let params = [];

    if (estado && estado !== 'Todos') {
      params.push(estado);
      query += ` AND e.nombre_estado = $${params.length}`;
    }
    if (tipo && tipo !== 'Todos') {
      params.push(tipo);
      query += ` AND tt.nombre_tipo = $${params.length}`;
    }
    if (id_usuario) {
      params.push(id_usuario);
      query += ` AND t.id_usuario = $${params.length}`;
    }

    query += ' ORDER BY t.fecha_actualizacion DESC';
    const result = await pool.query(query, params);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Error al obtener trámites' });
  }
});

// 2. GET: Obtener fases de un trámite (Hoja de Ruta)
app.get('/api/tramites/:id/fases', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM fases_ruta WHERE id_tramite = $1 ORDER BY id_fase ASC',
      [id]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Error al obtener fases del trámite' });
  }
});

// 3. PUT: Actualizar estado de una fase
app.put('/api/fases/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado_fase } = req.body;

    if (!estado_fase) {
      return res.status(400).json({ error: 'El estado de la fase es obligatorio' });
    }

    const result = await pool.query(
      'UPDATE fases_ruta SET estado_fase = $1 WHERE id_fase = $2 RETURNING *',
      [estado_fase, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fase no encontrada' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Error al actualizar fase' });
  }
});

// ==========================================
// ENDPOINTS PARA AUTENTICACIÓN (EP 2.2 / 2.3 / 5.0)
// ==========================================

// 0. POST: Google Login (Integración EF 5)
const axios = require('axios');

// ... (dentro de app.post('/api/auth/google', ...))

app.post('/api/auth/google', async (req, res) => {
  try {
    const { token } = req.body;
    
    // Obtenemos la info del usuario usando el access_token que viene del frontend
    const googleRes = await axios.get(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${token}`);
    const payload = googleRes.data;
    const { email, given_name, family_name, sub } = payload;

    // 2. Buscar si el usuario ya existe en nuestra base de datos
    let userResult = await pool.query('SELECT * FROM usuarios WHERE correo = $1', [email]);
    let user;

    if (userResult.rows.length === 0) {
      // 3. Si no existe, lo creamos (Registro automático)
      const rutFicticio = `G-${sub.substring(0, 8)}`; 
      const newUserResult = await pool.query(
        `INSERT INTO usuarios (id_rol, nombre, apellido, correo, contrasena_hash, rut, region, comuna) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [1, given_name, family_name || '', email, 'GOOGLE_AUTH_USER', rutFicticio, 'Región Metropolitana', 'Santo Domingo']
      );
      user = newUserResult.rows[0];
    } else {
      user = userResult.rows[0];
    }

    // 4. Determinar rol
    const roleResult = await pool.query('SELECT nombre_rol FROM roles WHERE id_rol = $1', [user.id_rol]);
    const roleName = roleResult.rows.length > 0 && roleResult.rows[0].nombre_rol === 'administrador' ? 'admin' : 'user';

    // 5. Generar nuestro propio token JWT
    const jwtToken = jwt.sign(
      { id: user.id_usuario, email: user.correo, role: roleName },
      process.env.JWT_SECRET || 'una_clave_secreta_muy_segura_para_los_tokens',
      { expiresIn: '24h' }
    );

    res.status(200).json({
      user: {
        id: user.id_usuario.toString(),
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.correo,
        rut: user.rut,
        role: roleName,
        region: user.region,
        comuna: user.comuna
      },
      token: jwtToken
    });
  } catch (error) {
    console.error('Error Google Login Backend:', error.message);
    res.status(500).json({ error: 'Error en la autenticación con Google' });
  }
});

// 1. POST: Registro de usuario
app.post('/api/auth/register', async (req, res) => {
  try {
    const { nombre, apellido, rut, email, region, comuna, password } = req.body;

    // Validación básica de campos
    if (!nombre || !apellido || !rut || !email || !region || !comuna || !password) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    // Verificar si el correo ya está registrado
    const userExist = await pool.query('SELECT * FROM usuarios WHERE correo = $1', [email]);
    if (userExist.rows.length > 0) {
      return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
    }

    // Verificar si el RUT ya está registrado
    const rutExist = await pool.query('SELECT * FROM usuarios WHERE rut = $1', [rut]);
    if (rutExist.rows.length > 0) {
      return res.status(400).json({ error: 'El RUT ya está registrado' });
    }

    // Encriptar la contraseña con bcrypt
    const saltRounds = 10;
    const contrasenaHash = await bcrypt.hash(password, saltRounds);

    // Rol por defecto: 1 (usuario)
    const idRolUsuario = 1;

    // Insertar el nuevo usuario en la base de datos
    const result = await pool.query(
      `INSERT INTO usuarios (id_rol, nombre, apellido, correo, contrasena_hash, region, comuna, rut) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [idRolUsuario, nombre, apellido, email, contrasenaHash, region, comuna, rut]
    );

    const newUser = result.rows[0];

    // Generar el token JWT
    const token = jwt.sign(
      { id: newUser.id_usuario, email: newUser.correo, role: 'user' },
      process.env.JWT_SECRET || 'una_clave_secreta_muy_segura_para_los_tokens',
      { expiresIn: '24h' }
    );

    // Retornar en el formato que espera el Frontend
    res.status(201).json({
      user: {
        id: newUser.id_usuario.toString(),
        nombre: newUser.nombre,
        apellido: newUser.apellido,
        email: newUser.correo,
        rut: newUser.rut,
        region: newUser.region,
        comuna: newUser.comuna,
        role: 'user'
      },
      token
    });
  } catch (error) {
    console.error('Error en registro:', error.message);
    res.status(500).json({ error: 'Error interno del servidor en el registro' });
  }
});

// 2. POST: Inicio de sesión
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Correo y contraseña son obligatorios' });
    }

    // Buscar al usuario en la base de datos
    const userResult = await pool.query('SELECT * FROM usuarios WHERE correo = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas (correo no encontrado)' });
    }

    const user = userResult.rows[0];

    // Comparar la contraseña (soporte flexible para texto plano y bcrypt hashes)
    let isMatch = false;
    if (user.contrasena_hash.startsWith('$2b$') || user.contrasena_hash.startsWith('$2a$')) {
      isMatch = await bcrypt.compare(password, user.contrasena_hash);
    } else {
      isMatch = (password === user.contrasena_hash); // Para usuarios creados a mano en pgAdmin
    }

    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas (contraseña incorrecta)' });
    }

    // Obtener el nombre del rol del usuario
    const roleResult = await pool.query('SELECT nombre_rol FROM roles WHERE id_rol = $1', [user.id_rol]);
    const roleName = roleResult.rows.length > 0 && roleResult.rows[0].nombre_rol === 'administrador' ? 'admin' : 'user';

    // Generar el token JWT
    const token = jwt.sign(
      { id: user.id_usuario, email: user.correo, role: roleName },
      process.env.JWT_SECRET || 'una_clave_secreta_muy_segura_para_los_tokens',
      { expiresIn: '24h' }
    );

    // Retornar en el formato que espera el Frontend
    res.status(200).json({
      user: {
        id: user.id_usuario.toString(),
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.correo,
        rut: user.rut,
        region: user.region,
        comuna: user.comuna,
        role: roleName
      },
      token
    });
  } catch (error) {
    console.error('Error en login:', error.message);
    res.status(500).json({ error: 'Error interno del servidor en el inicio de sesión' });
  }
});

// Middleware para verificar el token JWT (Error 403 si falta, 401 si es inválido/expirado)
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(403).json({ error: 'Acceso denegado: token no proporcionado' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'una_clave_secreta_muy_segura_para_los_tokens');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

// 3. PUT: Actualizar perfil del usuario
app.put('/api/auth/profile/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, email } = req.body;

    if (!nombre || !apellido || !email) {
      return res.status(400).json({ error: 'Nombre, apellido y correo son obligatorios' });
    }

    // Verificar si el correo está siendo utilizado por otro usuario
    const emailCheck = await pool.query(
      'SELECT * FROM usuarios WHERE correo = $1 AND id_usuario <> $2',
      [email, id]
    );
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: 'El correo electrónico ya está en uso por otro usuario' });
    }

    // Actualizar el usuario en la base de datos
    const result = await pool.query(
      `UPDATE usuarios 
       SET nombre = $1, apellido = $2, correo = $3 
       WHERE id_usuario = $4 RETURNING *`,
      [nombre, apellido, email, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const updatedUser = result.rows[0];

    // Obtener el rol del usuario
    const roleResult = await pool.query('SELECT nombre_rol FROM roles WHERE id_rol = $1', [updatedUser.id_rol]);
    const roleName = roleResult.rows.length > 0 && roleResult.rows[0].nombre_rol === 'administrador' ? 'admin' : 'user';

    // Retornar el usuario actualizado en el formato que espera el Frontend
    res.status(200).json({
      id: updatedUser.id_usuario.toString(),
      nombre: updatedUser.nombre,
      apellido: updatedUser.apellido,
      email: updatedUser.correo,
      rut: updatedUser.rut,
      region: updatedUser.region,
      comuna: updatedUser.comuna,
      role: roleName
    });
  } catch (error) {
    console.error('Error al actualizar perfil:', error.message);
    res.status(500).json({ error: 'Error interno del servidor al actualizar perfil' });
  }
});

// 4. DELETE: Eliminar un usuario
app.delete('/api/auth/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM usuarios WHERE id_usuario = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.status(200).json({
      mensaje: 'Usuario eliminado exitosamente',
      usuario: {
        id: result.rows[0].id_usuario.toString(),
        nombre: result.rows[0].nombre,
        apellido: result.rows[0].apellido,
        email: result.rows[0].correo,
        rut: result.rows[0].rut
      }
    });
  } catch (error) {
    console.error('Error al eliminar usuario:', error.message);
    res.status(500).json({ error: 'Error interno del servidor al eliminar usuario' });
  }
});

// 5. GET: Obtener todos los usuarios (útil para pruebas y desarrollo)
app.get('/api/auth/users', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id_usuario, nombre, apellido, correo, rut, id_rol FROM usuarios ORDER BY id_usuario ASC'
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error al obtener usuarios:', error.message);
    res.status(500).json({ error: 'Error interno del servidor al obtener usuarios' });
  }
});

// Encender el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});