<?php
/**
 * PrepNext Router & Front Controller
 * Coordinates page mappings, session guards, and endpoint submissions
 */

require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/includes/helpers.php';

// Retrieve route from query parameter (provided by htaccess rewrite)
$routeString = $_GET['route'] ?? '';
$routeString = trim($routeString, '/');

if ($routeString === '') {
    $routeString = 'home';
}

// Split route parameters
$routeParts = explode('/', $routeString);
$primaryRoute = $routeParts[0] ?? 'home';
$subRoute = $routeParts[1] ?? '';

// Global Session Post action handlers
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    handlePostRequests($primaryRoute, $subRoute);
}

// Route Auth Guards and Pages Loader Map
$pagesMap = [
    'home' => 'home.php',
    'login' => 'login.php',
    'signup' => 'signup.php',
    'dashboard' => 'dashboard.php',
    'study-material' => 'study-material.php',
    'my-ebooks' => 'my-ebooks.php',
    'premium' => 'premium.php',
    'subjects' => 'subjects.php',
    'exams' => 'exams.php',
    'live-tests' => 'live-tests.php',
    'test' => 'test.php',
    'forum' => 'forum.php',
    'job-alerts' => 'job-alerts.php',
    'about' => 'about.php',
    'contact' => 'contact.php'
];

$adminPagesMap = [
    'dashboard' => 'admin/dashboard.php',
    'popup-announcement' => 'admin/popup-announcement.php',
    'study-material' => 'admin/study-material.php',
    'exams' => 'admin/exams.php',
    'notices' => 'admin/notices.php',
    'settings' => 'admin/settings.php'
];

if ($primaryRoute === 'logout') {
    session_destroy();
    session_start();
    setFlash("Successfully logged out.", "success");
    redirect('/');
}

// Check admin routes
if ($primaryRoute === 'admin') {
    if (!isAdmin()) {
        setFlash("Admin privileges are required.", "error");
        redirect('/login');
    }
    
    $adminPage = ($subRoute === '') ? 'dashboard' : $subRoute;
    if (array_key_exists($adminPage, $adminPagesMap)) {
        require_once DIR_PAGES . '/' . $adminPagesMap[$adminPage];
    } else {
        http_response_code(404);
        include DIR_ROOT . '/pages/404.php';
    }
} else if (array_key_exists($primaryRoute, $pagesMap)) {
    // Authentiation checks for protected client pages
    $protectedPages = ['dashboard', 'my-ebooks', 'test', 'forum'];
    if (in_array($primaryRoute, $protectedPages) && !getCurrentUser()) {
        setFlash("Authentication is required to view that area.", "info");
        redirect('/login');
    }
    
    require_once DIR_PAGES . '/' . $pagesMap[$primaryRoute];
} else {
    http_response_code(404);
    include DIR_ROOT . '/pages/404.php';
}

/**
 * Handle form POST requests centrally inside router
 */
function handlePostRequests($primary, $sub) {
    if ($primary === 'login') {
        $email = trim($_POST['email'] ?? '');
        $password = $_POST['password'] ?? '';
        
        if (empty($email) || empty($password)) {
            setFlash("All fields are required.", "error");
            return;
        }
        
        $user = Database::selectOne("SELECT * FROM users WHERE email = :email", ['email' => $email]);
        if ($user && password_verify($password, $user['password_hash'])) {
            $_SESSION['user_id'] = $user['id'];
            logUserActivity('AUTH_LOGIN', "Successful login to platform profile.");
            setFlash("Welcome back, " . $user['name'] . "!", "success");
            
            if ($user['is_admin']) {
                redirect('/admin');
            } else {
                redirect('/dashboard');
            }
        } else {
            setFlash("Invalid email or password combination.", "error");
        }
    }
    
    if ($primary === 'signup') {
        $name = trim($_POST['name'] ?? '');
        $email = trim($_POST['email'] ?? '');
        $password = $_POST['password'] ?? '';
        
        if (empty($name) || empty($email) || empty($password)) {
            setFlash("All fields are required.", "error");
            return;
        }
        
        $exists = Database::selectOne("SELECT id FROM users WHERE email = :email", ['email' => $email]);
        if ($exists) {
            setFlash("Email address is already registered.", "error");
            return;
        }
        
        $hash = password_hash($password, PASSWORD_BCRYPT);
        $res = Database::execute(
            "INSERT INTO users (name, email, password_hash, purchased_exams) VALUES (:name, :email, :hash, '[]')",
            ['name' => $name, 'email' => $email, 'hash' => $hash]
        );
        
        if ($res) {
            $userId = Database::lastInsertId();
            $_SESSION['user_id'] = $userId;
            logUserActivity('AUTH_SIGNUP', "Created profile and logged in.", $userId);
            setFlash("Account successfully created!", "success");
            redirect('/dashboard');
        } else {
            setFlash("Critical creation error. Try again later.", "error");
        }
    }
}
?>
