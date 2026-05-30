<?php
/**
 * PrepNext Clean Shell Footer Template
 * Standard Widgets, Lucide Script, and Homepage Popup Overlay Controller
 */

$appConfig = getSetting('general');
$supportEmail = $appConfig['contactEmail'] ?? 'support@prepnext.in';
$supportPhone = $appConfig['contactPhone'] ?? '+91 7006 123 456';
$supportAddress = $appConfig['contactAddress'] ?? 'Srinagar, J&K, India';
$established = $appConfig['establishedYear'] ?? '2026';
?>
    </main>

    <!-- Global Platform Footer -->
    <footer class="bg-slate-900 border-t border-slate-800 text-white py-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                
                <!-- Info block -->
                <div class="space-y-4">
                    <div class="flex items-center gap-2">
                        <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-display font-bold">P</div>
                        <span class="text-lg font-black tracking-tighter text-white font-display">Prep<span class="text-primary">Next</span></span>
                    </div>
                    <p class="text-slate-400 font-semibold text-[11px] leading-relaxed max-w-xs">
                        Elevate your J&K competitive exams preparations to a masterclass standard. Real performance indexes and updated booklets.
                    </p>
                    <p class="text-[10px] font-black uppercase tracking-wider text-slate-500">
                        &copy; <?php echo $established; ?> PrepNext J&K. All Rights Reserved.
                    </p>
                </div>
                
                <!-- Quick links -->
                <div class="space-y-4">
                    <h5 class="text-xs font-black tracking-widest text-slate-400 uppercase">Core Content</h5>
                    <ul class="space-y-2 text-xs font-bold text-slate-400">
                        <li><a href="<?php echo BASE_URL; ?>/exams" class="hover:text-primary transition-colors">Exams List</a></li>
                        <li><a href="<?php echo BASE_URL; ?>/study-material" class="hover:text-primary transition-colors">Digital Books</a></li>
                        <li><a href="<?php echo BASE_URL; ?>/live-tests" class="hover:text-primary transition-colors">Mock Live Tests</a></li>
                        <li><a href="<?php echo BASE_URL; ?>/forum" class="hover:text-primary transition-colors">Aspirant Community</a></li>
                    </ul>
                </div>
                
                <!-- Administrative Pages -->
                <div class="space-y-4">
                    <h5 class="text-xs font-black tracking-widest text-slate-400 uppercase">Information</h5>
                    <ul class="space-y-2 text-xs font-bold text-slate-400">
                        <li><a href="<?php echo BASE_URL; ?>/about" class="hover:text-primary transition-colors">About Team</a></li>
                        <li><a href="<?php echo BASE_URL; ?>/contact" class="hover:text-primary transition-colors">Help & Contact</a></li>
                        <li><a href="<?php echo BASE_URL; ?>/privacy" class="hover:text-primary transition-colors">Privacy Paradigm</a></li>
                    </ul>
                </div>
                
                <!-- Support Details -->
                <div class="space-y-4">
                    <h5 class="text-xs font-black tracking-widest text-slate-400 uppercase">Direct Helpline</h5>
                    <ul class="space-y-2 text-xs font-bold text-slate-400">
                        <li class="flex items-center gap-2"><i data-lucide="mail" class="w-4 h-4 text-primary"></i> <?php echo e($supportEmail); ?></li>
                        <li class="flex items-center gap-2"><i data-lucide="phone" class="w-4 h-4 text-primary"></i> <?php echo e($supportPhone); ?></li>
                        <li class="flex items-center gap-2 max-w-xs leading-normal"><i data-lucide="map-pin" class="w-4 h-4 text-primary shrink-0"></i> <?php echo e($supportAddress); ?></li>
                    </ul>
                </div>

            </div>
        </div>
    </footer>

    <!-- Homepage/Landing Popup Alert Modal implementation -->
    <?php if (isset($showPublicAnnouncement) && $showPublicAnnouncement && isset($primaryRoute) && $primaryRoute === 'home'): ?>
    <div id="homepage-announcement-overlay" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-sm hidden transition-all animate-fade-in">
        <div class="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-200/50 relative flex flex-col transform">
            
            <!-- Dismiss action icon -->
            <button onclick="dismissHomepageAnnouncement()" class="absolute top-4 right-4 z-20 w-8 h-8 bg-slate-900/10 hover:bg-slate-900/20 text-slate-700 rounded-full flex items-center justify-center cursor-pointer transition-colors">
                <i data-lucide="x" class="w-4 h-4"></i>
            </button>

            <!-- Media cover -->
            <?php if (!empty($announcementDoc['imageUrl'])): ?>
                <div class="w-full aspect-[16/10] bg-slate-100 overflow-hidden relative">
                    <img src="<?php echo e($announcementDoc['imageUrl']); ?>" alt="<?php echo e($announcementDoc['title']); ?>" class="w-full h-full object-cover">
                    <div class="absolute bottom-4 left-4">
                        <span class="px-2.5 py-1 bg-primary text-white rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
                            <i data-lucide="sparkles" class="w-3 h-3 text-emerald-200"></i> ALERT
                        </span>
                    </div>
                </div>
            <?php else: ?>
                <div class="py-6 px-6 bg-gradient-to-r from-primary to-primary-dark text-white relative flex items-center gap-3">
                    <div class="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 shrink-0">
                        <i data-lucide="megaphone" class="w-5 h-5 text-teal-300"></i>
                    </div>
                    <div>
                        <span class="px-2 py-0.5 bg-rose-500 text-white rounded text-[8px] font-black uppercase tracking-wider inline-flex items-center gap-0.5 shadow select-none">
                            Platform Bulletin
                        </span>
                        <h4 class="text-xs font-black tracking-widest text-[#a7f3d0] leading-none uppercase mt-1">IMPORTANT ANNOUNCEMENT</h4>
                    </div>
                </div>
            <?php endif; ?>

            <!-- Content details -->
            <div class="p-6 md:p-8">
                <h3 class="text-lg font-black text-slate-900 tracking-tight leading-snug mb-3">
                    <?php echo e($announcementDoc['title']); ?>
                </h3>
                <p class="text-xs font-semibold text-slate-500 leading-relaxed mb-6 whitespace-pre-line max-h-48 overflow-y-auto pr-1">
                    <?php echo e($announcementDoc['description']); ?>
                </p>

                <!-- CTA Button -->
                <div class="space-y-3">
                    <?php if (!empty($announcementDoc['buttonText']) && !empty($announcementDoc['buttonUrl'])): ?>
                        <a href="<?php echo e($announcementDoc['buttonUrl']); ?>" class="block w-full py-3.5 bg-primary hover:bg-primary-dark text-white font-black text-xs uppercase tracking-widest rounded-xl text-center shadow-lg shadow-primary/10 transition-all hover:-translate-y-0.5 active:translate-y-0">
                            <?php echo e($announcementDoc['buttonText']); ?>
                        </a>
                    <?php endif; ?>

                    <button onclick="dismissHomepageAnnouncement()" class="w-full py-3 hover:bg-slate-50 text-slate-500 hover:text-slate-800 font-extrabold text-xs uppercase tracking-widest rounded-xl text-center transition-all cursor-pointer">
                        Dismiss / Maybe Later
                    </button>
                </div>
            </div>

        </div>
    </div>
    
    <script>
        // Evaluate dynamic dismiss keys matching update times
        const popupUpdateToken = "<?php echo $announcementDoc['updatedAt'] ?? 'default'; ?>";
        const dismissalSessionToken = "prepnext_popup_dismissed_v2_" + popupUpdateToken;

        document.addEventListener("DOMContentLoaded", () => {
            const overlay = document.getElementById("homepage-announcement-overlay");
            if (overlay && !sessionStorage.getItem(dismissalSessionToken)) {
                overlay.classList.remove("hidden");
            }
        });

        function dismissHomepageAnnouncement() {
            sessionStorage.setItem(dismissalSessionToken, "true");
            const overlay = document.getElementById("homepage-announcement-overlay");
            if (overlay) {
                overlay.classList.add("hidden");
            }
        }
    </script>
    <?php endif; ?>

    <!-- Lucide Loader -->
    <script>
        lucide.createIcons();
    </script>
</body>
</html>
