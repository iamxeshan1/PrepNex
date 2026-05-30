<?php
/**
 * PrepNext Client Study Hub / Dashboard
 * Generates active statistics based on past test attempts and PDF booklets
 */

$pageTitle = "My Personal Learning Hub";

$currentUser = getCurrentUser();
$isPremium = isPremium();

// Fetch metrics
$attemptsCount = Database::selectOne(
    "SELECT COUNT(*) as score FROM results WHERE user_id = :id", 
    ['id' => $currentUser['id']]
)['score'] ?? 0;

$purchasedExams = json_decode($currentUser['purchased_exams'] ?? '[]', true);
$purchasedCount = count($purchasedExams);

$booksCount = Database::selectOne(
    "SELECT COUNT(*) as total FROM study_materials WHERE price = 0"
)['total'] ?? 0;
if ($isPremium) {
    $booksCount = Database::selectOne("SELECT COUNT(*) as total FROM study_materials")['total'] ?? 0;
}

// Fetch past results to render performance trackers
$recentResults = Database::selectAll(
    "SELECT r.*, t.title as test_title, e.name as exam_name 
     FROM results r 
     JOIN tests t ON r.test_id = t.id 
     JOIN exams e ON t.exam_id = e.id
     WHERE r.user_id = :userId 
     ORDER BY r.date DESC LIMIT 5",
    ['userId' => $currentUser['id']]
);

include DIR_INCLUDES . '/header.php';
?>

<section class="py-12 bg-slate-50 border-b border-slate-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <!-- Welcome Jumbotron -->
        <div class="bg-white p-8 md:p-10 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div class="space-y-2">
                <span class="px-2.5 py-1 bg-primary/10 border border-primary/25 text-primary rounded-lg text-[9px] font-black uppercase tracking-wider">
                    Official Aspirant Dashboard
                </span>
                <h1 class="text-3xl font-display font-black tracking-tight text-slate-900 mt-2">
                    Welcome back, <?php echo e($currentUser['name']); ?>!
                </h1>
                <p class="text-slate-500 font-semibold text-xs">
                    Account: <span class="text-slate-700 font-bold"><?php echo e($currentUser['email']); ?></span> 
                    <?php if ($isPremium): ?>
                        | Status: <span class="text-amber-500 font-black"><i data-lucide="sparkles" class="w-3.5 h-3.5 inline"></i> PrepPass Premium</span>
                    <?php else: ?>
                        | Status: <span class="text-slate-400 font-black">Free Standard Portal tier</span>
                    <?php endif; ?>
                </p>
            </div>

            <!-- Header actions -->
            <div class="flex items-center gap-3">
                <a href="<?php echo BASE_URL; ?>/exams" class="px-5 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-primary/10">
                     Active Test Catalog
                </a>
                <?php if (!$isPremium): ?>
                    <a href="<?php echo BASE_URL; ?>/premium" class="px-5 py-3 bg-amber-500 hover:bg-amber-655 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-amber-500/10">
                         Upgrade to Premium
                    </a>
                <?php endif; ?>
            </div>
        </div>

        <!-- Metric Scoreboard grids -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-xs font-black">
            
            <div class="p-6 bg-white border rounded-3xl border-slate-200 shadow-sm flex items-center gap-4">
                <div class="p-4 bg-emerald-500/10 text-emerald-600 rounded-2xl">
                    <i data-lucide="award" class="w-6 h-6"></i>
                </div>
                <div>
                    <p class="text-slate-400 text-[10px] uppercase tracking-widest leading-none">Exams Unlocked</p>
                    <h3 class="text-2xl font-display tracking-tight text-slate-800 font-black mt-1">
                        <?php echo $isPremium ? 'All-Access' : $purchasedCount; ?>
                    </h3>
                </div>
            </div>

            <div class="p-6 bg-white border rounded-3xl border-slate-200 shadow-sm flex items-center gap-4">
                <div class="p-4 bg-primary/10 text-primary rounded-2xl">
                    <i data-lucide="file-text" class="w-6 h-6"></i>
                </div>
                <div>
                    <p class="text-slate-400 text-[10px] uppercase tracking-widest leading-none">PDF reference booklets</p>
                    <h3 class="text-2xl font-display tracking-tight text-slate-800 font-black mt-1">
                        <?php echo $booksCount; ?> Available
                    </h3>
                </div>
            </div>

            <div class="p-6 bg-white border rounded-3xl border-slate-200 shadow-sm flex items-center gap-4">
                <div class="p-4 bg-blue-500/10 text-blue-600 rounded-2xl">
                    <i data-lucide="line-chart" class="w-6 h-6"></i>
                </div>
                <div>
                    <p class="text-slate-400 text-[10px] uppercase tracking-widest leading-none">Attempted tests sheets</p>
                    <h3 class="text-2xl font-display tracking-tight text-slate-800 font-black mt-1">
                        <?php echo $attemptsCount; ?> Tests
                    </h3>
                </div>
            </div>

        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <!-- List of attempts -->
            <div class="lg:col-span-2 space-y-6">
                <div class="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <h2 class="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-4 mb-4 flex items-center gap-2">
                        <i data-lucide="activity" class="w-4.5 h-4.5 text-primary"></i> Recent Test Assessments History
                    </h2>

                    <?php if (empty($recentResults)): ?>
                        <div class="py-12 text-center text-slate-400 font-semibold text-xs leading-relaxed space-y-2">
                            <i data-lucide="history" class="w-8 h-8 text-slate-300 mx-auto"></i>
                            <p class="text-slate-500 uppercase tracking-wider font-extrabold text-[10px]">No tests completed yet</p>
                            <p class="text-[10px]">Choose an active mock syllabus pack and run our custom terminal questions simulator.</p>
                            <a href="<?php echo BASE_URL; ?>/exams" class="inline-block px-4 py-2.5 bg-slate-900 text-white rounded-xl text-[9px] font-black tracking-widest uppercase mt-3">Start First Mock</a>
                        </div>
                    <?php else: ?>
                        <div class="overflow-x-auto">
                            <table class="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr class="text-[9px] font-black uppercase text-slate-400 border-b">
                                        <th class="pb-3 font-extrabold tracking-wider">Mock Assessment Title</th>
                                        <th class="pb-3 font-extrabold tracking-wider">Completed date</th>
                                        <th class="pb-3 text-right font-extrabold tracking-wider">Score Tracker</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-100 font-semibold text-slate-600">
                                    <?php foreach ($recentResults as $res): ?>
                                        <tr>
                                            <td class="py-3.5 pr-3">
                                                <p class="text-slate-950 font-black leading-tight"><?php echo e($res['test_title']); ?></p>
                                                <p class="text-[9px] text-slate-400 uppercase tracking-wider font-black mt-0.5"><?php echo e($res['exam_name']); ?></p>
                                            </td>
                                            <td class="py-3.5 text-slate-400 font-mono"><?php echo formatDate($res['date']); ?></td>
                                            <td class="py-3.5 text-right font-mono text-slate-950 font-black">
                                                <span class="px-2 py-1 rounded bg-slate-50 border text-slate-700">
                                                    <?php echo $res['score']; ?> / <?php echo $res['max_marks']; ?>
                                                </span>
                                            </td>
                                        </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                        </div>
                    <?php endif; ?>
                </div>
            </div>

            <!-- Secondary reference widget panel -->
            <div class="space-y-6">
                <!-- Platform Notice Widget Box -->
                <div class="bg-gradient-to-br from-primary to-primary-dark text-white rounded-3xl p-6 shadow-md border border-primary/20 relative overflow-hidden">
                    <div class="absolute -right-8 -bottom-8 w-24 h-24 bg-white/10 blur-xl rounded-full" />
                    <h3 class="text-xs font-black tracking-widest text-[#a7f3d0] uppercase">Aspirants Hotline</h3>
                    <h4 class="text-base font-black tracking-tight leading-snug mt-3">Need guidance choosing exams syllabus?</h4>
                    <p class="text-[#cbd5e1] font-semibold text-[10px] leading-relaxed mt-2">
                        Get in touch with our curriculum coordinator team. We offer advice clarifying eligibility patterns, subjects weightages, and negative scoring calculations.
                    </p>
                    <div class="pt-5 flex">
                        <a href="<?php echo BASE_URL; ?>/contact" class="px-4.5 py-2.5 bg-white text-primary rounded-xl text-[10px] font-black uppercase tracking-wider shadow">
                            Helpline form
                        </a>
                    </div>
                </div>
            </div>

        </div>

    </div>
</section>

<?php include DIR_INCLUDES . '/footer.php'; ?>
