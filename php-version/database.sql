-- MySQL Database Schema for PrepNext PHP + MySQL Conversion
-- Target Server version: 8.0+

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------
-- Table structure for `users`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `is_admin` TINYINT(1) DEFAULT 0,
  `is_premium` TINYINT(1) DEFAULT 0,
  `premium_expiry` DATETIME DEFAULT NULL,
  `purchased_exams` JSON DEFAULT NULL, -- Stored as dynamic JSON list: ["exam_1", "exam_3"]
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `settings`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `settings` (
  `key` VARCHAR(100) PRIMARY KEY,
  `value_json` JSON NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `agencies`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `agencies` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `logo_url` VARCHAR(255) DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `status` VARCHAR(20) DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `subjects`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `subjects` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `category` VARCHAR(100) DEFAULT NULL,
  `icon` VARCHAR(50) DEFAULT 'BookOpen',
  `description` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `exams`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `exams` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `agency_id` INT DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `tag` VARCHAR(100) DEFAULT NULL,
  `price` DECIMAL(10,2) DEFAULT 0.00,
  `original_price` DECIMAL(10,2) DEFAULT 0.00,
  `questions_count` INT DEFAULT 0,
  `total_marks` INT DEFAULT 0,
  `duration` INT DEFAULT 0, -- In minutes
  `attempts_count` INT DEFAULT 0,
  `is_free` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`agency_id`) REFERENCES `agencies`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `tests`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tests` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `exam_id` INT NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `questions_count` INT DEFAULT 0,
  `duration_mins` INT DEFAULT 60,
  `difficulty` VARCHAR(20) DEFAULT 'medium',
  `is_free` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `questions`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `questions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `test_id` INT NOT NULL,
  `question_text` TEXT NOT NULL,
  `option_a` VARCHAR(255) NOT NULL,
  `option_b` VARCHAR(255) NOT NULL,
  `option_c` VARCHAR(255) NOT NULL,
  `option_d` VARCHAR(255) NOT NULL,
  `correct_option` CHAR(1) NOT NULL, -- 'A', 'B', 'C', 'D'
  `explanation` TEXT DEFAULT NULL,
  `marks` INT DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`test_id`) REFERENCES `tests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `study_materials`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `study_materials` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `category` VARCHAR(100) DEFAULT NULL,
  `cover_url` VARCHAR(255) DEFAULT NULL,
  `pdf_url` VARCHAR(255) DEFAULT NULL,
  `price` DECIMAL(10,2) DEFAULT 0.00,
  `original_price` DECIMAL(10,2) DEFAULT 0.00,
  `is_free` TINYINT(1) DEFAULT 0,
  `total_pages` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `live_tests`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `live_tests` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `start_time` DATETIME NOT NULL,
  `end_time` DATETIME NOT NULL,
  `duration_mins` INT DEFAULT 60,
  `price` DECIMAL(10,2) DEFAULT 0.00,
  `total_marks` INT DEFAULT 100,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `results`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `results` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `test_id` INT NOT NULL,
  `score` FLOAT DEFAULT 0,
  `max_marks` INT DEFAULT 100,
  `correct_answers` INT DEFAULT 0,
  `wrong_answers` INT DEFAULT 0,
  `skipped_answers` INT DEFAULT 0,
  `answers_json` JSON DEFAULT NULL, -- key-value store of user responses
  `date` DATETIME NOT NULL,
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`test_id`) REFERENCES `tests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `subscriptions`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `subscriptions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `exam_id` INT NOT NULL,
  `amount` DECIMAL(10,2) DEFAULT 0.00,
  `purchase_date` DATETIME NOT NULL,
  `expiry_date` DATETIME NOT NULL,
  `status` VARCHAR(20) DEFAULT 'active',
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `job_alerts`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `job_alerts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `agency_name` VARCHAR(150) NOT NULL,
  `link` VARCHAR(255) DEFAULT NULL,
  `posts_count` INT DEFAULT 1,
  `last_date` DATETIME DEFAULT NULL,
  `post_date` DATETIME DEFAULT NULL,
  `eligibility` TEXT DEFAULT NULL,
  `status` VARCHAR(20) DEFAULT 'open',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `forum_threads`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `forum_threads` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) DEFAULT 'General',
  `author_id` INT NOT NULL,
  `content` TEXT NOT NULL,
  `views` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `forum_posts`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `forum_posts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `thread_id` INT NOT NULL,
  `author_id` INT NOT NULL,
  `content` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`thread_id`) REFERENCES `forum_threads`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `thoughts`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `thoughts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `text` TEXT NOT NULL,
  `author` VARCHAR(100) DEFAULT 'Team PrepNext',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `reviews`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `reviews` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_name` VARCHAR(100) NOT NULL,
  `rating` INT DEFAULT 5,
  `comment` TEXT NOT NULL,
  `avatar_url` VARCHAR(255) DEFAULT NULL,
  `approved` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `activity_logs`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT DEFAULT NULL,
  `action` VARCHAR(100) NOT NULL,
  `description` TEXT NOT NULL,
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Seed Initial Settings Database Configurations
-- --------------------------------------------------------
INSERT INTO `settings` (`key`, `value_json`) VALUES
('general', '{
  "heroHeading": "Elevate Your Prep|Clear Exams Effortlessly",
  "heroTagline": "Get the most comprehensive J&K competitive exams mock tests, study materials, live performance indexes and more.",
  "contactEmail": "support@prepnext.in",
  "contactPhone": "+91 7006 123 456",
  "contactAddress": "PrepNext Digital Inc., Residency Road, Srinagar, J&K, India",
  "establishedYear": "2026",
  "aspirantCount": "120k+",
  "totalTests": "2.4k+",
  "successRate": "98.7%",
  "premiumPlans": [
    {"id": "p_1y", "months": 12, "price": 499, "originalPrice": 2499, "benefits": ["All Books Unlocked", "Full Live Tests", "Custom Dashboard", "Aspirant Forum Sync"]}
  ]
}'),
('popup_announcement', '{
  "title": "🎉 HOLI SPLASH OFFERS! 65% DISCOUNT ON ALL-ACCESS PASS",
  "description": "Unlock premium e-books, multi-agency test-series bundles, real-time live classes, and custom performance sheets with this strictly limited offer! Get your pass before prices surge.",
  "imageUrl": "https://images.unsplash.com/photo-1540317580114-ed6853f90ca1?auto=format&fit=crop&q=80&w=600",
  "buttonText": "GRAB ALL-ACCESS PASS",
  "buttonUrl": "/premium",
  "isActive": true,
  "updatedAt": "2026-05-30T16:00:00Z"
}');

-- --------------------------------------------------------
-- Seed Sample Data for Testing
-- --------------------------------------------------------
-- Users (Admin, Demo)
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `is_admin`, `is_premium`, `premium_expiry`, `purchased_exams`) VALUES
(1, 'Administrator', 'admin@prepnext.in', '$2y$10$wE99QjFqT4aC2E7T7p/zE.ySId/5M.A326H.W8m6W4CqM7.qGfS6q', 1, 1, '2030-01-01 00:00:00', '[]'),
(2, 'Demo Aspirant', 'aspirant@prepnext.in', '$2y$10$wE99QjFqT4aC2E7T7p/zE.ySId/5M.A326H.W8m6W4CqM7.qGfS6q', 0, 0, NULL, '[]');

-- Agencies
INSERT INTO `agencies` (`id`, `name`, `logo_url`, `description`, `status`) VALUES
(1, 'JKSSB', 'https://images.unsplash.com/photo-1590086782957-93c06ef21604?auto=format&fit=crop&q=80&w=120', 'Jammu & Kashmir Services Selection Board', 'active'),
(2, 'JKPSC', 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=120', 'Jammu & Kashmir Public Service Commission', 'active');

-- Subjects
INSERT INTO `subjects` (`id`, `name`, `category`, `icon`, `description`) VALUES
(1, 'General English', 'Language Arts', 'BookOpen', 'Sentence structure, grammar paradigms, vocabulary, and comprehensions.'),
(2, 'Quantitative Aptitude', 'Mathematics', 'Calculator', 'Aptitude tests, ratios, statistics, percentages, and numerical ability.');

-- Exams
INSERT INTO `exams` (`id`, `name`, `agency_id`, `description`, `tag`, `price`, `original_price`, `questions_count`, `total_marks`, `duration`, `is_free`) VALUES
(1, 'JKSSB Sub-Inspector (JKP)', 1, 'Complete Sub-Inspector mock testing catalog, fully aligned to the latest syllabus schema.', 'Police Sub-Inspector', 399.00, 1499.00, 120, 120, 120, 0),
(2, 'JKPSC KAS Prelims General Studies', 2, 'High level General Studies practice sheets and previous years solved syllabus.', 'Kashmir Administrative Service', 599.00, 2499.00, 100, 200, 120, 0);

-- Tests
INSERT INTO `tests` (`id`, `exam_id`, `title`, `description`, `questions_count`, `duration_mins`, `difficulty`, `is_free`) VALUES
(1, 1, 'Full Mock Test 1 - General Syllabus', 'Comprehensive assessment matching mock test board standards.', 4, 30, 'medium', 1);

-- Questions for Test 1
INSERT INTO `questions` (`id`, `test_id`, `question_text`, `option_a`, `option_b`, `option_c`, `option_d`, `correct_option`, `explanation`, `marks`) VALUES
(1, 1, 'Which is the longest river in Jammu and Kashmir?', 'Tawi River', 'Jhelum River', 'Chenab River', 'Indus River', 'C', 'Chenab River flows through J&K and is known for its high discharge index and length in the sector.', 1),
(2, 1, 'The beautiful Shalimar Garden in Srinagar was constructed by which Mughal Emperor?', 'Akbar', 'Jahangir', 'Shah Jahan', 'Aurangzeb', 'B', 'Jahangir built the famous Shalimar Bagh for his beautiful wife Nur Jahan in the year 1619.', 1),
(3, 1, 'Select the correct synonym for the word: "ELEGANT"', 'Polished', 'Rough', 'Gaudy', 'Clumsy', 'A', '"Polished" represents structural taste, and is the correct synonym representing elegancy.', 1),
(4, 1, 'Solve for x: 3x - 7 = 14', '5', '6', '7', '8', 'C', '3x = 14 + 7 => 3x = 21 => x = 7. Thus, C is correct.', 1);

-- Study Materials
INSERT INTO `study_materials` (`id`, `title`, `description`, `category`, `cover_url`, `pdf_url`, `price`, `original_price`, `is_free`, `total_pages`) VALUES
(1, 'General Knowledge of J&K Study Booklet', 'Super detailed breakdown of historic context, governance, climate patterns, and rivers topology.', 'General Knowledge', NULL, '#', 0.00, 199.00, 1, 120),
(2, 'Advanced Aptitude & Analytical Reasoning Blueprint', 'Formulas card, short-cuts for calculations, graphs patterns, and visual logic examples.', 'Aptitude', NULL, '#', 149.00, 499.00, 0, 185);

-- Job alerts
INSERT INTO `job_alerts` (`id`, `title`, `agency_name`, `link`, `posts_count`, `last_date`, `post_date`, `eligibility`, `status`) VALUES
(1, 'Recruitment for Sub Inspector (Home Dept)', 'JKSSB', 'https://jkssb.nic.in', 120, '2026-06-15 23:59:00', '2026-05-20 08:00:00', 'Graduation in any discipline from a recognized University.', 'open');

-- Thoughts
INSERT INTO `thoughts` (`id`, `text`, `author`) VALUES
(1, 'Consistancy is key. Every mock test is a lessons sheet for real exam battles. Put your heart into it!', 'Founder, PrepNext');

SET FOREIGN_KEY_CHECKS = 1;
