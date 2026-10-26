const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.MYSQLPORT || process.env.DB_PORT || '3306'),
    user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
    password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'brittasgg',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4',
});

(async () => {
    try {
        const conn = await pool.getConnection();
        console.log('✅ MySQL conectado correctamente');
        conn.release();
    } catch (err) {
        console.error('❌ Error conectando MySQL:', err.message);
        process.exit(1);
    }
})();

module.exports = pool;