<?php
/**
 * PrepNext Admin Panel Sidebar Layout include
 * Distinguishes current route indicators cleanly
 */

$currentAdminPage = $subRoute === '' ? 'dashboard' : $subRoute;

$navItems = [
    'dashboard' => ['label' => 'Performance Index', 'icon' => 'bar-chart-2', 'url' => '/admin'],
    'popup-announcement' => ['label' => 'Announcement Popup', 'icon' => 'megaphone', 'url' => '/admin/popup-announcement', 'badge' => 'Active'],
    'exams' => ['label' => 'Exams Catalog', 'icon' => 'award', 'url' => '/admin/exams'],
    'notices' => ['label' => 'Notice Board', 'icon' => 'bell', 'url' => '/admin/notices'],
    'settings' => ['label' => 'Platform Settings', 'icon' => 'settings', 'url' => '/admin/settings']
];
?>

<div class="w-full md:w-64 bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 space-y-8 flex-shrink-0 self-start">
    
    <!-- Branding -->
    <div class="pb-6 border-b border-slate-800 flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-display font-black text-sm text-white">A</div>
        <div>
            <h3 class="text-xs font-black tracking-widest leading-none text-slate-300">ADMINISTRATIVE</h3>
            <p class="text-[10px] font-black uppercase tracking-wider text-slate-500 mt-1">Control Suite</p>
        </div>
    </div>

    <!-- Links segment -->
    <nav class="space-y-1.5 flex flex-col font-bold text-xs">
        <?php foreach ($navItems as $key => $item): 
            $isActive = ($currentAdminPage === $key);
        ?>
            <a 
                href="<?php echo BASE_URL . $item['url']; ?>" 
                class="flex items-center justify-between px-4 py-3.5 rounded-xl transition-all leading-none <?php 
                    echo $isActive 
                        ? 'bg-primary text-white shadow-lg shadow-primary/10' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'; 
                ?>"
            >
                <div class="flex items-center gap-3">
                    <i data-lucide="<?php echo $item['icon']; ?>" class="w-4 h-4 shrink-0 transition-transform"></i>
                    <span><?php echo $item['label']; ?></span>
                </div>

                <?php if (isset($item['badge'])): ?>
                    <span class="px-1.5 py-0.5 bg-emerald-500 text-white rounded text-[8px] font-black uppercase tracking-wide">
                        <?php echo $item['badge']; ?>
                    </span>
                <?php endif; ?>
            </a>
        <?php endforeach; ?>
    </nav>
    
    <!-- Exit control -->
    <div class="pt-6 border-t border-slate-800">
        <a href="<?php echo BASE_URL; ?>/dashboard" class="flex items-center gap-3 px-4 py-3 bg-slate-850 hover:bg-slate-800 border border-slate-800 text-xs font-black uppercase tracking-wider rounded-xl transition-all text-slate-200">
            <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i> Exit To Portal
        </a>
    </div>

</div>
