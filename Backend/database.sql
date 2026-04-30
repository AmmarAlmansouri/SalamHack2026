-- schema.sql

-- Users table with all necessary fields
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    wallet_address VARCHAR(255) NULL,
    password VARCHAR(255) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    email_verified_at DATETIME NULL,
    
    -- Email change fields
    new_email VARCHAR(255) NULL,
    email_verification_token VARCHAR(64) NULL,
    email_verification_token_expiry DATETIME NULL,
    
    -- Password reset fields
    confirmation_token VARCHAR(64) NULL,
    confirmation_token_expiry DATETIME NULL,
    reset_password_token VARCHAR(64) NULL,
    reset_password_expiry DATETIME NULL,
    
    -- Security fields
    failed_login_attempts INT DEFAULT 0,
    locked_until DATETIME NULL,
    last_failed_login DATETIME NULL,
    last_login DATETIME NULL,
    password_changed_at DATETIME NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_email (email),
    INDEX idx_new_email (new_email),
    INDEX idx_confirmation_token (confirmation_token),
    INDEX idx_reset_token (reset_password_token),
    INDEX idx_email_verification_token (email_verification_token),
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User sessions table (optional, for session management)
CREATE TABLE user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(500) NOT NULL,
    refresh_token VARCHAR(500) NULL,
    ip_address VARCHAR(45) NULL,
    metadata JSON NULL,
    is_active BOOLEAN DEFAULT TRUE,
    invalidated_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    last_used_at DATETIME NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_token (token(255)),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Additional tables for links and transactions

-- Payment links table
CREATE TABLE payment_links (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    amount DECIMAL(20, 8) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    description TEXT NULL,
    status ENUM('active', 'used', 'expired', 'cancelled') DEFAULT 'active',
    unique_code VARCHAR(64) NOT NULL UNIQUE,
    payment_url VARCHAR(500) NULL,
    expires_at DATETIME NULL,
    used_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_unique_code (unique_code),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Transactions table for tracking all payments and payouts
CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    link_id INT NULL,
    type ENUM('payment_received', 'payout_sent', 'fee_deducted', 'refund') NOT NULL,
    status ENUM('pending', 'processing', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    
    -- Payment details
    payment_id VARCHAR(100) NULL COMMENT 'Triple-A payment ID',
    payment_amount DECIMAL(20, 8) NULL,
    payment_currency VARCHAR(10) NULL,
    payment_network VARCHAR(50) NULL,
    payment_address VARCHAR(255) NULL,
    payment_status VARCHAR(50) NULL,
    
    -- Payout details
    payout_id VARCHAR(100) NULL COMMENT 'Triple-A payout ID',
    payout_amount DECIMAL(20, 8) NULL,
    payout_currency VARCHAR(10) NULL,
    payout_network VARCHAR(50) NULL,
    payout_address VARCHAR(255) NULL,
    payout_tx_hash VARCHAR(255) NULL,
    payout_status VARCHAR(50) NULL,
    
    -- Fees
    platform_fee DECIMAL(20, 8) DEFAULT 0,
    platform_fee_percentage DECIMAL(5, 2) DEFAULT 0,
    network_fee DECIMAL(20, 8) DEFAULT 0,
    
    -- Customer information
    customer_email VARCHAR(255) NULL,
    customer_name VARCHAR(255) NULL,
    
    -- Triple-A raw data
    triplea_payment_data JSON NULL,
    triplea_payout_data JSON NULL,
    triplea_webhook_data JSON NULL,
    
    -- Timestamps
    payment_received_at DATETIME NULL,
    payout_sent_at DATETIME NULL,
    completed_at DATETIME NULL,
    failed_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (link_id) REFERENCES payment_links(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_link_id (link_id),
    INDEX idx_status (status),
    INDEX idx_type (type),
    INDEX idx_payment_id (payment_id),
    INDEX idx_payout_id (payout_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Platform fees configuration
CREATE TABLE platform_fees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fee_percentage DECIMAL(5, 2) NOT NULL DEFAULT 2.50,
    min_fee_amount DECIMAL(10, 2) DEFAULT 1.00,
    max_fee_amount DECIMAL(10, 2) DEFAULT 100.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default platform fee
INSERT INTO platform_fees (fee_percentage, min_fee_amount, max_fee_amount) 
VALUES (2.50, 1.00, 100.00);

-- User wallet balances (optional, for tracking)
CREATE TABLE user_wallets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    currency VARCHAR(10) NOT NULL,
    balance DECIMAL(20, 8) DEFAULT 0.00000000,
    pending_balance DECIMAL(20, 8) DEFAULT 0.00000000,
    total_received DECIMAL(20, 8) DEFAULT 0.00000000,
    total_withdrawn DECIMAL(20, 8) DEFAULT 0.00000000,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_currency (user_id, currency),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;