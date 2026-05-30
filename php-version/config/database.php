<?php
/**
 * PrepNext Database Client Adapter
 * Utilizes PDO with strict prepared statement configurations
 */

require_once __DIR__ . '/config.php';

class Database {
    private static ?PDO $instance = null;

    /**
     * Retrieve the database instance (Singleton wrapper)
     */
    public static function getConnection(): PDO {
        if (self::$instance === null) {
            try {
                $dsn = sprintf(
                    "mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4",
                    DB_HOST,
                    DB_PORT,
                    DB_NAME
                );
                
                $options = [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false,
                ];

                self::$instance = new PDO($dsn, DB_USER, DB_PASS, $options);
            } catch (PDOException $e) {
                // Return a detailed log or warning page on configuration issue
                error_log("Database Connection Failed: " . $e->getMessage());
                if (APP_ENV === 'development') {
                    die("Database connection failed: " . htmlspecialchars($e->getMessage()));
                } else {
                    die("Could not establish server database link. Please try again soon.");
                }
            }
        }
        return self::$instance;
    }

    /**
     * Executes queries securely with parameters binder
     */
    public static function query(string $sql, array $params = []): PDOStatement {
        try {
            $db = self::getConnection();
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            return $stmt;
        } catch (PDOException $e) {
            error_log("Query execution error: " . $e->getMessage() . " | SQL: " . $sql);
            throw $e;
        }
    }

    /**
     * Fetch all records matching conditions
     */
    public static function selectAll(string $sql, array $params = []): array {
        return self::query($sql, $params)->fetchAll();
    }

    /**
     * Fetch a single row
     */
    public static function selectOne(string $sql, array $params = []): ?array {
        $result = self::query($sql, $params)->fetch();
        return $result ? $result : null;
    }

    /**
     * Quick helper to execute non-reads (insert/update/delete)
     */
    public static function execute(string $sql, array $params = []): bool {
        return self::query($sql, $params) !== null;
    }

    /**
     * Get the last inserted ID
     */
    public static function lastInsertId(): string {
        return self::getConnection()->lastInsertId();
    }
}
?>
