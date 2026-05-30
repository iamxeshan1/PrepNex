<?php
/**
 * PrepNext PHP Application Configuration Root
 * Core Constants, Settings, and Error Handlers Hook
 */

// Basic Security Precaution
if (session_status() === PHP_SESSION_NONE) {
    // Enable secure cookies if HTTPS is active
    $isSecure = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on';
    session_start([
        'cookie_httponly' => true,
        'cookie_secure' => $isSecure,
        'cookie_samesite' => 'Lax'
    ]);
}

// Timezone alignment
date_default_timezone_set('Asia/Kolkata');

// App Environmental Configuration
define('APP_NAME', 'PrepNext');
define('APP_SYSTEM_EMAIL', 'support@prepnext.in');

// Database Connection Constants
define('DB_HOST', '127.0.0.1');
define('DB_PORT', 3306);
define('DB_NAME', 'prepnext_db');
define('DB_USER', 'root');
define('DB_PASS', '');

// Environment Modes (development / production)
define('APP_ENV', 'development');

if (APP_ENV === 'development') {
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);
} else {
    ini_set('display_errors', 0);
    error_reporting(0);
}

// Global Path Helpers
define('DIR_ROOT', dirname(__DIR__));
define('DIR_INCLUDES', DIR_ROOT . '/includes');
define('DIR_PAGES', DIR_ROOT . '/pages');

// Dynamically resolve Base URL
function getBaseUrl() {
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    
    // Check if subdirectories are used (e.g. localhost/php-version/)
    $scriptName = $_SERVER['SCRIPT_NAME'] ?? '';
    $dir = dirname($scriptName);
    
    // Sanitize trailing slashes
    $basePath = rtrim($dir, '/\\');
    
    // If we're inside index.php or pages subfolder, prune that
    if (str_ends_with($basePath, 'pages') || str_ends_with($basePath, 'config') || str_ends_with($basePath, 'includes')) {
        $basePath = dirname($basePath);
    }
    
    return $protocol . '://' . $host . rtrim($basePath, '/\\');
}

define('BASE_URL', getBaseUrl());
?>
