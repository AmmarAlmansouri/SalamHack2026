require('dotenv').config();
const db = require('./config/database');

async function migrate() {
    try {
        console.log("Starting migration...");
        
        await db.query(`
            CREATE TABLE IF NOT EXISTS crypto_addresses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                currency VARCHAR(10) NOT NULL,
                network VARCHAR(50) NOT NULL,
                address VARCHAR(255) NOT NULL,
                label VARCHAR(50) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_user_currency_network (user_id, currency, network),
                INDEX idx_user_id (user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log("Created crypto_addresses table.");
        
        await db.query(`
            INSERT IGNORE INTO crypto_addresses (user_id, currency, network, address)
            SELECT id, 'BTC', 'Bitcoin', wallet_address FROM users WHERE wallet_address IS NOT NULL AND wallet_address != '';
        `);
        console.log("Migrated addresses.");
        
        // Ensure wallet_address exists before dropping
        const [columns] = await db.query(`SHOW COLUMNS FROM users LIKE 'wallet_address'`);
        if (columns.length > 0) {
            await db.query(`ALTER TABLE users DROP COLUMN wallet_address;`);
            console.log("Dropped wallet_address from users.");
        }
        
        console.log("Migration finished.");
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
migrate();
