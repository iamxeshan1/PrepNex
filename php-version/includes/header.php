<?php
/**
 * PrepNext Clean Shell Header Template
 * Connects Tailwind, Google Fonts, Navigation context, and Alerts banners
 */

$currentUser = getCurrentUser();
$isAdmin = isAdmin();
$isPremium = isPremium();
$flash = getFlash();

$announcementDoc = getSetting('popup_announcement');
$showPublicAnnouncement = ($announcementDoc && !empty($announcementDoc['isActive']) && $announcementDoc['isActive']);
?>
<!DOCTYPE html>
<html lang="en" class="h-full bg-slate-50">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo isset($pageTitle) ? htmlspecialchars($pageTitle) . ' | PrepNext' : 'PrepNext | Elevate Your Competitive Exams Prep'; ?></title>
    
    <!-- Fonts & Icons Integration -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Space+Grotesk:wght@500;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    
    <!-- Tailwind CSS Play CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['Inter', 'sans-serif'],
                        display: ['Space Grotesk', 'sans-serif'],
                        mono: ['JetBrains Mono', 'monospace'],
                    },
                    colors: {
                        primary: {
                            DEFAULT: '#006e5d',
                            dark: '#005c4e',
                            light: '#008772',
                        }
                    }
                }
            }
        }
    </script>
    
    <!-- Lucide Icons via CDN -->
    <script src="https://unpkg.com/lucide@latest"></script>
    
    <style>
        .font-sans { font-family: 'Inter', sans-serif; }
        .font-display { font-family: 'Space Grotesk', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
            animation: fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
    </style>
</head>
<body class="flex flex-col min-h-full font-sans antialiased text-slate-800">

    <!-- Top Navigation Header -->
    <header class="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm leading-none">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between h-20">
                
                <!-- Logo -->
                <div class="flex items-center gap-8">
                    <a href="<?php echo BASE_URL; ?>/" class="flex items-center gap-2">
                        <div class="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-display font-bold text-lg shadow-md shadow-primary/10">
                            P
                        </div>
                        <span class="text-xl font-black tracking-tighter text-slate-900 font-display">
                            Prep<span class="text-primary">Next</span>
                        </span>
                    </a>
                    
                    <!-- Desktop Nav Menu -->
                    <nav class="hidden md:flex items-center gap-5">
                        <a href="<?php echo BASE_URL; ?>/exams" class="text-xs font-black uppercase tracking-wider text-slate-600 hover:text-primary transition-all">Exams</a>
                        <a href="<?php echo BASE_URL; ?>/study-material" class="text-xs font-black uppercase tracking-wider text-slate-600 hover:text-primary transition-all">E-Books</a>
                        <a href="<?php echo BASE_URL; ?>/live-tests" class="text-xs font-black uppercase tracking-wider text-slate-600 hover:text-primary transition-all">Live Tests</a>
                        <a href="<?php echo BASE_URL; ?>/job-alerts" class="text-xs font-black uppercase tracking-wider text-slate-600 hover:text-primary transition-all">Job Alerts</a>
                        <a href="<?php echo BASE_URL; ?>/forum" class="text-xs font-black uppercase tracking-wider text-slate-600 hover:text-primary transition-all">Aspirants Forum</a>
                    </nav>
                </div>
                
                <!-- Action Controls -->
                <div class="flex items-center gap-3">
                    <?php if ($isPremium): ?>
                        <span class="hidden lg:flex items-center gap-1 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest leading-none">
                            <i data-lucide="sparkles" class="w-3 h-3 animate-pulse"></i> Pass Active
                        </span>
                    <?php endif; ?>
                    
                    <?php if ($currentUser): ?>
                        <a href="<?php echo BASE_URL; ?>/dashboard" class="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-sm">
                            My Hub
                        </a>
                        
                        <?php if ($isAdmin): ?>
                            <a href="<?php echo BASE_URL; ?>/admin" class="px-4 py-2.5 bg-[#1e293b] hover:bg-slate-800 text-slate-100 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-sm">
                                Admin Suite
                            </a>
                        <?php endif; ?>
                        
                        <a href="<?php echo BASE_URL; ?>/logout" class="p-2.5 bg-rose-50 text-rose-500 hover:bg-rose-100 rounded-xl transition-all" title="Logout">
                            <i data-lucide="log-out" class="w-4 h-4"></i>
                        </a>
                    <?php else: ?>
                        <a href="<?php echo BASE_URL; ?>/login" class="px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-600 hover:text-primary transition-all">
                            Sign In
                        </a>
                        <a href="<?php echo BASE_URL; ?>/signup" class="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-primary/10">
                            Register Free
                        </a>
                    <?php endif; ?>
                </div>

            </div>
        </div>
    </header>

    <!-- Global Flash Notice Notifications -->
    <?php if ($flash): ?>
        <div id="flash-banner-wrapper" class="fixed top-24 right-4 sm:right-6 z-50 max-w-sm w-full animate-fade-in pointer-events-auto">
            <div class="p-4 rounded-2xl shadow-xl border flex items-start gap-3 <?php 
                echo $flash['type'] === 'error' 
                    ? 'bg-rose-50 border-rose-200/60 text-rose-800' 
                    : ($flash['type'] === 'info' ? 'bg-sky-50 border-sky-200/60 text-sky-800' : 'bg-emerald-50 border-emerald-200/60 text-emerald-800'); 
            ?>">
                <div class="p-1 rounded-lg <?php 
                    echo $flash['type'] === 'error' 
                        ? 'bg-rose-500/10' 
                        : ($flash['type'] === 'info' ? 'bg-sky-500/10' : 'bg-emerald-500/10'); 
                ?> shrink-0">
                    <i data-lucide="<?php echo $flash['type'] === 'error' ? 'alert-circle' : 'check-circle'; ?>" class="w-4 h-4"></i>
                </div>
                <div class="flex-grow space-y-0.5">
                    <p class="text-xs font-black uppercase tracking-wider leading-none">
                        <?php echo $flash['type'] === 'error' ? 'Operation Alert' : 'System Notice'; ?>
                    </p>
                    <p class="text-[11px] font-semibold opacity-90 leading-relaxed"><?php echo e($flash['message']); ?></p>
                </div>
                <button onclick="document.getElementById('flash-banner-wrapper').remove()" class="text-slate-400 hover:text-slate-600 transition-colors">
                    <i data-lucide="x" class="w-3.5 h-3.5"></i>
                </button>
            </div>
        </div>
    <?php endif; ?>

    <!-- Main Content Context Wrapper -->
    <main class="flex-grow">
