<?php
/**
 * PrepNext Clean Homepage Template
 * Dynamic Counts, Tabbed Agencies, Subjects list, and the requested study-materials grid
 */

$pageTitle = "Clear Exam Battles Effortlessly";

// Pull variables from database configuration
$appConfig = getSetting('general');

$heroHeading = $appConfig['heroHeading'] ?? 'Elevate Your Prep|Clear Exams Effortlessly';
$heroTagline = $appConfig['heroTagline'] ?? 'Get J&K exams mock tests, syllabus booklets and more.';
$aspirantCount = $appConfig['aspirantCount'] ?? '120k+';
$totalTests = $appConfig['totalTests'] ?? '2.4k+';
$successRate = $appConfig['successRate'] ?? '98.7%';

// Pull dynamic agencies & subjects lists
$agencies = Database::selectAll("SELECT * FROM agencies WHERE status = 'active' LIMIT 6");
$subjects = Database::selectAll("SELECT * FROM subjects LIMIT 6");

// Extract requested Study Materials booklets
$studyMaterials = Database::selectAll("SELECT * FROM study_materials ORDER BY id DESC LIMIT 4");

include DIR_INCLUDES . '/header.php';
?>

<!-- Dynamic Hero Segment -->
<section class="relative bg-gradient-to-b from-slate-900 to-slate-950 text-white py-24 md:py-32 overflow-hidden border-b border-slate-800">
    <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-900/20 via-transparent to-transparent pointer-events-none"></div>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
        
        <!-- Welcome badge -->
        <div class="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 border border-primary/30 rounded-full text-primary-light text-xs font-black uppercase tracking-widest animate-pulse">
            <i data-lucide="sparkles" class="w-3.5 h-3.5"></i> Clear J&K competitive exams
        </div>
        
        <!-- Big Display Header -->
        <h1 class="text-4xl md:text-6xl font-display font-black tracking-tight max-w-4xl mx-auto leading-tight">
            <?php 
            if (str_contains($heroHeading, '|')) {
                $parts = explode('|', $heroHeading, 2);
                echo e($parts[0]) . ' <span class="text-primary-light">' . e($parts[1]) . '</span>';
            } else {
                echo e($heroHeading);
            }
            ?>
        </h1>
        
        <p class="text-slate-400 font-semibold text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            <?php echo e($heroTagline); ?>
        </p>

        <!-- CTAs -->
        <div class="flex flex-wrap items-center justify-center gap-4 pt-4">
            <a href="<?php echo BASE_URL; ?>/exams" class="px-8 py-4 bg-primary hover:bg-primary-dark text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 transition-all hover:-translate-y-0.5">
                Explore Exam Catalog
            </a>
            <a href="<?php echo BASE_URL; ?>/study-material" class="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-black uppercase tracking-widest rounded-2xl border border-slate-700 transition-all hover:-translate-y-0.5">
                Download Study Guides
            </a>
        </div>

        <!-- Metric badges banner -->
        <div class="grid grid-cols-3 max-w-3xl mx-auto gap-4 pt-12 md:pt-16 border-t border-slate-800/60 text-center">
            <div class="space-y-1">
                <h3 class="text-2xl md:text-4xl font-display font-bold tracking-tight text-white"><?php echo e($aspirantCount); ?></h3>
                <p class="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-500">Active Aspirants</p>
            </div>
            <div class="space-y-1">
                <h3 class="text-2xl md:text-4xl font-display font-bold tracking-tight text-white"><?php echo e($totalTests); ?></h3>
                <p class="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-500">Practice Sets</p>
            </div>
            <div class="space-y-1">
                <h3 class="text-2xl md:text-4xl font-display font-bold tracking-tight text-white"><?php echo e($successRate); ?></h3>
                <p class="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-500">Success Index</p>
            </div>
        </div>

    </div>
</section>

<!-- Tabbed Board Agencies Listings -->
<section class="py-20 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center space-y-2 mb-12">
            <div class="text-[10px] font-black uppercase tracking-widest text-primary">J&K Recruitment Organs</div>
            <h2 class="text-3xl font-display font-black tracking-tight text-slate-900">Targeted Exam Portals</h2>
            <p class="text-slate-500 font-semibold text-xs max-w-sm mx-auto">Get full mock exams matching syllabus schemes for distinct government recruitment commissions.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <?php foreach ($agencies as $a): ?>
                <div class="p-6 bg-slate-50 border border-slate-200/50 rounded-3xl flex items-center gap-5 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all">
                    <?php if (!empty($a['logo_url'])): ?>
                        <img src="<?php echo e($a['logo_url']); ?>" alt="<?php echo e($a['name']); ?>" class="w-16 h-16 object-cover rounded-2xl bg-white p-1 border">
                    <?php else: ?>
                        <div class="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center font-display font-bold text-lg border border-primary/20">
                            <?php echo substr(e($a['name']), 0, 2); ?>
                        </div>
                    <?php endif; ?>
                    <div>
                        <h4 class="text-sm font-black text-slate-900 tracking-tight leading-none"><?php echo e($a['name']); ?></h4>
                        <p class="text-[11px] font-semibold text-slate-500 mt-1 line-clamp-2 leading-relaxed"><?php echo e($a['description']); ?></p>
                        <a href="<?php echo BASE_URL; ?>/exams?agency_id=<?php echo $a['id']; ?>" class="text-[9px] font-black uppercase tracking-wider text-primary flex items-center gap-1 mt-2.5">
                            Enter Portal <i data-lucide="chevron-right" class="w-3 h-3"></i>
                        </a>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    </div>
</section>

<!-- Subjects Segment -->
<section class="py-20 bg-slate-50 border-t border-slate-100">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center space-y-2 mb-12">
            <div class="text-[10px] font-black uppercase tracking-widest text-primary">Syllabus Breakdown</div>
            <h2 class="text-3xl font-display font-black tracking-tight text-slate-900 font-display">Practice By Sub-Subjects</h2>
            <p class="text-slate-500 font-semibold text-xs max-w-sm mx-auto">Strengthen individual domains first before testing entire mock exams sheets.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <?php foreach ($subjects as $sub): ?>
                <div class="p-6 bg-white rounded-3xl border border-slate-200/60 flex items-start gap-4 hover:border-primary/20 hover:shadow-lg transition-all group duration-300">
                    <div class="p-3 bg-primary/5 text-primary rounded-2xl border border-primary/10 shrink-0 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                        <i data-lucide="<?php echo !empty($sub['icon']) ? e($sub['icon']) : 'book-open'; ?>" class="w-5 h-5"></i>
                    </div>
                    <div>
                        <span class="text-[9px] font-black tracking-widest text-slate-400 uppercase leading-none"><?php echo e($sub['category'] ?? 'General Section'); ?></span>
                        <h4 class="text-xs font-bold text-slate-900 tracking-tight leading-none mt-1 group-hover:text-primary transition-colors"><?php echo e($sub['name']); ?></h4>
                        <p class="text-[10px] font-semibold text-slate-500 leading-normal mt-1.5 line-clamp-2"><?php echo e($sub['description']); ?></p>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    </div>
</section>

<!-- Dynamic Study Material & E-Books Section (DIRECTLY BELOW SUBJECTS SECTION AS REQUESTED) -->
<section class="py-20 bg-white border-t border-slate-100">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
            <div>
                <div class="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/5 border border-primary/10 rounded-full text-primary text-[10px] font-black uppercase tracking-widest mb-3">
                    <i data-lucide="book-marked" class="w-3.5 h-3.5"></i> DIGITAL READS LIBRARY
                </div>
                <h2 class="text-3xl font-display font-black tracking-tight text-slate-900">Premium E-Books & Reference Material</h2>
                <p class="text-slate-500 font-semibold text-xs mt-1">Acquire core summaries booklets, resolved question banks & manual syllabus guides.</p>
            </div>
            
            <a href="<?php echo BASE_URL; ?>/study-material" class="inline-flex items-center gap-2 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black tracking-widest uppercase shadow transition-all shrink-0">
                View All Study Material <i data-lucide="arrow-right" class="w-3.5 h-3.5 text-primary-light"></i>
            </a>
        </div>

        <?php if (empty($studyMaterials)): ?>
            <div class="p-12 text-center bg-slate-50 border border-slate-200 rounded-3xl">
                <i data-lucide="file-text" class="w-8 h-8 text-slate-300 mx-auto mb-2"></i>
                <p class="text-slate-500 font-bold text-xs uppercase tracking-wider">No study manuals listed right now.</p>
            </div>
        <?php else: ?>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <?php foreach ($studyMaterials as $bk): 
                    $isFree = (int)$bk['is_free'] === 1;
                    $price = $bk['price'];
                ?>
                    <a href="<?php echo BASE_URL; ?>/study-material" class="group bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden flex flex-col p-4 hover:border-primary/30 hover:shadow-lg transition-all duration-300">
                        
                        <!-- Wrapper Frame cover representation -->
                        <div class="relative aspect-[16/11] bg-slate-100 rounded-xl overflow-hidden mb-4 shrink-0 flex items-center justify-center border border-slate-200/50">
                            <?php if (!empty($bk['cover_url'])): ?>
                                <img src="<?php echo e($bk['cover_url']); ?>" alt="<?php echo e($bk['title']); ?>" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105">
                            <?php else: ?>
                                <div class="w-full h-full bg-gradient-to-br from-[#0c5c4e] to-slate-900 flex flex-col justify-between p-4 text-white">
                                    <p class="text-[8px] font-black uppercase tracking-widest text-emerald-300 opacity-80"><?php echo e($bk['category']); ?></p>
                                    <div class="space-y-1 my-auto">
                                        <h4 class="text-[10px] font-black tracking-tight leading-normal line-clamp-3 text-emerald-100"><?php echo e($bk['title']); ?></h4>
                                        <div class="w-6 h-0.5 bg-amber-400 rounded" />
                                    </div>
                                    <div class="text-[8px] font-bold text-slate-400 text-right uppercase tracking-widest mt-auto">Exams Guide Blueprint</div>
                                </div>
                            <?php endif; ?>

                            <!-- Buy or free price sticker -->
                            <div class="absolute top-2.5 right-2.5 z-10">
                                <?php if ($isFree): ?>
                                    <span class="px-2 py-0.5 bg-emerald-500 text-white rounded text-[8px] font-black uppercase tracking-wider flex items-center gap-0.5 shadow">
                                        <i data-lucide="unlock" class="w-2 h-2"></i> Free
                                    </span>
                                <?php else: ?>
                                    <span class="px-2 py-0.5 bg-amber-500 text-white rounded text-[8px] font-black uppercase tracking-wider flex items-center gap-0.5 shadow">
                                        <i data-lucide="lock" class="w-2 h-2"></i> <?php echo formatRupee($price); ?>
                                    </span>
                                <?php endif; ?>
                            </div>
                        </div>

                        <!-- Info details -->
                        <div class="flex-grow flex flex-col justify-between">
                            <div>
                                <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block"><?php echo e($bk['category']); ?></span>
                                <h3 class="text-xs font-bold text-slate-900 tracking-tight leading-snug line-clamp-2 mb-1 group-hover:text-primary transition-colors"><?php echo e($bk['title']); ?></h3>
                                <?php if (!empty($bk['description'])): ?>
                                    <p class="text-[10px] font-semibold text-slate-400 line-clamp-2 leading-relaxed"><?php echo e($bk['description']); ?></p>
                                <?php endif; ?>
                            </div>

                            <div class="mt-4 pt-2.5 border-t border-slate-200/50 flex items-center justify-between text-[10px] font-black text-primary uppercase tracking-wider">
                                <span>Inspect Booklet</span>
                                <i data-lucide="arrow-right" class="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform"></i>
                            </div>
                        </div>

                    </a>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
    </div>
</section>

<!-- Additional benefits promo -->
<section class="py-20 bg-slate-50 border-t border-slate-100">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div class="space-y-6">
                <span class="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest select-none">ALL-ACCESS PREPASS SYSTEM</span>
                <h2 class="text-4xl font-display font-black tracking-tight text-slate-900 leading-tight">One Subscription. Complete Study Arsenal Unlocked.</h2>
                <p class="text-slate-500 font-semibold text-xs md:text-sm leading-relaxed">
                    Stop paying individually for dynamic booklets, chapter solvers, and test series. Unlock our multi-agency PrepPass today and gain universal access to GK, English, reasoning, and standard mock sheets immediately.
                </p>
                <div class="space-y-3 font-semibold text-xs text-slate-600">
                    <div class="flex items-center gap-2"><i data-lucide="check-circle" class="w-4 h-4 text-emerald-500"></i> Lifetime / 1-Year coverage options with regular updates</div>
                    <div class="flex items-center gap-2"><i data-lucide="check-circle" class="w-4 h-4 text-emerald-500"></i> Interactive dynamic timer-based testing screens</div>
                    <div class="flex items-center gap-2"><i data-lucide="check-circle" class="w-4 h-4 text-emerald-500"></i> Mobile compatibility sheets with downloadable PDFs</div>
                </div>
                <div class="pt-4">
                    <a href="<?php echo BASE_URL; ?>/premium" class="px-8 py-4 bg-primary hover:bg-primary-dark text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/10 transition-all inline-block">
                        Activate Premium Pass Now
                    </a>
                </div>
            </div>
            <div class="relative bg-slate-900 text-white rounded-3xl p-8 overflow-hidden border border-slate-850">
                <div class="absolute -right-16 -top-16 w-44 h-44 bg-primary/20 blur-[60px]" />
                <h4 class="text-sm font-black uppercase tracking-widest text-primary-light">Featured Thought of the Day</h4>
                <p class="text-white hover:text-white/90 text-sm italic font-medium leading-relaxed mt-4">
                    "Consistency is key. Every mock test is a lessons sheet for real exam battles. Put your heart into it!"
                </p>
                <div class="mt-6 pt-4 border-t border-slate-800 flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-display font-black text-xs text-primary-light">P</div>
                    <div>
                        <p class="text-xs font-black tracking-tight">Founder Team</p>
                        <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Team PrepNext J&K</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<?php include DIR_INCLUDES . '/footer.php'; ?>
