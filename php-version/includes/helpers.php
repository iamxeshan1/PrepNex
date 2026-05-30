<?php
/**
 * PrepNext Global System Helpers
 * Formatting, Sanitization, Sessions, and Activity Logging
 */

require_once __DIR__ . '/../config/database.php';

/**
 * Escapes strings cleanly for safe HTML injection output (XSS Shield)
 */
function e(?string $string): string {
    return htmlspecialchars($string ?? '', ENT_QUOTES, 'UTF-8');
}

/**
 * Perform safe redirections inside the application scope
 */
function redirect(string $path) {
    // Resolve relative path to root Base URL if necessary
    if (str_starts_with($path, '/')) {
        $url = rtrim(BASE_URL, '/') . $path;
    } else {
        $url = $path;
    }
    header("Location: $url");
    exit();
}

/**
 * Indian Rupee numeric formatter
 */
function formatRupee($amount): string {
    return '₹' . number_format((float)$amount, 0, '.', ',');
}

/**
 * Clean human formatting for standard datetime indices
 */
function formatDate($dateStr): string {
    if (empty($dateStr)) return 'N/A';
    try {
        $date = new DateTime($dateStr);
        return $date->format('d M Y, h:i A');
    } catch (Exception $e) {
        return e($dateStr);
    }
}

/**
 * Retrieve current logged-in user profile if exists
 */
function getCurrentUser(): ?array {
    if (!isset($_SESSION['user_id'])) {
        return null;
    }
    
    // Lazy query to retrieve fresh states
    static $userCache = null;
    if ($userCache === null) {
        $userCache = Database::selectOne("SELECT * FROM users WHERE id = :id", ['id' => $_SESSION['user_id']]);
    }
    return $userCache;
}

/**
 * Check if the active session is associated with an Admin profile
 */
function isAdmin(): bool {
    $user = getCurrentUser();
    return $user !== null && (int)$user['is_admin'] === 1;
}

/**
 * Check if the active user profile has premium status active (unexpired subscription)
 */
function isPremium(): bool {
    $user = getCurrentUser();
    if ($user === null) return false;
    if ((int)$user['is_premium'] === 1) {
        if (!empty($user['premium_expiry'])) {
            $expiry = new DateTime($user['premium_expiry']);
            $now = new DateTime();
            if ($expiry > $now) {
                return true;
            }
        } else {
            return true; // No expiration implies lifetime premium setup
        }
    }
    return false;
}

/**
 * Check if a specific user has purchased a specific mock test exam
 */
function hasAccessToExam(int $examId): bool {
    if (isAdmin()) return true;
    if (isPremium()) return true;
    
    $user = getCurrentUser();
    if ($user === null) return false;
    
    // Parse JSON array of purchased exams
    $purchased = json_decode($user['purchased_exams'] ?? '[]', true);
    if (is_array($purchased) && in_array((string)$examId, $purchased)) {
        return true;
    }
    
    return false;
}

/**
 * System Logger to audit interactions
 */
function logUserActivity(string $action, string $description, ?int $userId = null) {
    if ($userId === null) {
        $userId = $_SESSION['user_id'] ?? null;
    }
    
    try {
        Database::execute(
            "INSERT INTO activity_logs (user_id, action, description) VALUES (:user_id, :action, :description)",
            [
                'user_id' => $userId,
                'action' => $action,
                'description' => $description
            ]
        );
    } catch (Exception $e) {
        error_log("Activity writing failed: " . $e->getMessage());
    }
}

/**
 * Set flash banners for sequential requests feedback
 */
function setFlash(string $message, string $type = 'success') {
    $_SESSION['flash_message'] = $message;
    $_SESSION['flash_type'] = $type;
}

/**
 * Pull and purge flash message if exists
 */
function getFlash(): ?array {
    if (isset($_SESSION['flash_message'])) {
        $flash = [
            'message' => $_SESSION['flash_message'],
            'type' => $_SESSION['flash_type'] ?? 'success'
        ];
        unset($_SESSION['flash_message'], $_SESSION['flash_type']);
        return $flash;
    }
    return null;
}

/**
 * Retrieve settings object by key from db
 */
function getSetting(string $key): array {
    $row = Database::selectOne("SELECT value_json FROM settings WHERE `key` = :key", ['key' => $key]);
    if ($row && !empty($row['value_json'])) {
        return json_decode($row['value_json'], true) ?? [];
    }
    return [];
}
?>
