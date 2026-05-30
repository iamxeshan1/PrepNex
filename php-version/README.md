# PrepNext Core Portability Framework — PHP + MySQL Edition

This subfolder houses the complete, production-ready, high-fidelity conversion of the PrepNext competitive exams portal from a serverless **React + Firebase** stack to a native **PHP 8.0+ & MySQL** architecture.

All layouts, UI/UX states, grid elements, typography hierarchies, routing states, and responsive styling sheets are preserved with pixel-perfect accuracy.

---

## 📂 Architecture & Directory Topology

```bash
/php-version/
├── .htaccess                 # Clean URLs rewrite engine mapping request paths onto index.php
├── index.php                 # Master controller resolving page maps & handles authentication guards
├── database.sql              # Clean Schema DDL incorporating Seed records, Foreign keys, and Indexes
│
├── config/
│   ├── config.php            # Primary global configuration constants and dynamic base path resolvers
│   └── database.php          # Secure PDO Database connector featuring parameterized statements
│
├── includes/
│   ├── header.php            # Shell header, Tailwind utility compiler, Lucide icons, & alerts banners
│   ├── footer.php            # Shell footer, Lucide script engines, & dynamic homepage modals logic
│   ├── admin_sidebar.php     # Side Navigation component for administrative dashboards panels
│   └── helpers.php           # Global utility scripts: XSS sanitizers, formatters, and session logs
│
└── pages/
    ├── home.php              # Dynamic homepage highlighting subjects & newly requested eBook lists
    ├── login.php             # Unified secure authentication card form
    ├── signup.php            # Free aspirant registration forms
    ├── dashboard.php         # Student personalized Hub with mock metrics scoreboard
    ├── study-material.php     # Categories-tabbed, query-filtered eBooks catalogue
    └── admin/
        ├── dashboard.php     # Admin dashboard displaying telemetry activity logs Table boards
        └── popup-announcement.php # Dynamic Announcement Popup manager with dual Visual Simulators
```

---

## ⚙️ Direct Local Installation & Deployment Guide

Follow these steps to run the converted PHP application locally on your computer / server (e.g. using Apache/Nginx, MySQL, and PHP):

### 1. Database Creation
Create a new MySQL database named `prepnext_db` with UTF-8 character guidelines:
```sql
CREATE DATABASE prepnext_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Import Schema and Seeds
Execute the SQL statements contained in `database.sql` to structuralize the database and seed metadata metrics:
```bash
mysql -u root -p prepnext_db < database.sql
```

### 3. Connection Configuration
Open `config/config.php` and configure database credentials parameters based on your environment:
```php
define('DB_HOST', '127.0.0.1');
define('DB_PORT', 3306);
define('DB_NAME', 'prepnext_db');
define('DB_USER', 'root');
define('DB_PASS', '');
```

### 4. Enable URL Rewriting on Remote Servers
Ensure that your Apache server configuration file (`httpd.conf` or VirtualHost block) has rewriting enabled:
```apache
<Directory "/path/to/php-version">
    AllowOverride All
    Require all granted
</Directory>
```

---

## 🔒 Implemented Security Protocols

* **Form Sanitization Filters (XSS Shield)**: Comprehensive use of `htmlspecialchars()` through global `e()` utility functions prevents hostile scripts injections on lists and detail hubs.
* **SQL Injection Shields**: Database operations exclusively leverage **PDO prepared statements** with strict parameters assignments.
* **Cookie Protection Options**: Session elements are loaded with `cookie_httponly`, `cookie_secure` (automatic HTTPS alignment), and `cookie_samesite` settings.
* **Secure Monitored Sessions**: Active guards prevent access to `/dashboard` or `/admin` routes unless authorized profile tokens exist in memory.
