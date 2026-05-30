<?php
/**
 * PrepNext Administrative Hub Index Dashboard
 * Integrates statistics counters representing users indices and logs
 */

$pageTitle = "Administrative Operations Hub";

// Grab totals from database tables
$totalUsers = Database::selectOne("SELECT COUNT(*) as score FROM users")['score'] ?? 0;
$totalExams = Database::selectOne("SELECT COUNT(*) as score FROM exams")['score'] ?? 0;
$totalBooks = Database::selectOne("SELECT COUNT(*) as score FROM study_materials")['score'] ?? 0;

$recentLogs = Database::selectAll(
    "SELECT l.*, u.name as user_name 
     FROM activity_logs l 
     LEFT JOIN users u ON l.user_id = u.id 
     ORDER BY l.timestamp DESC LIMIT 10"
);

include DIR_INCLUDES . '/header.php';
?>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    
    <!-- Header banner -->
    <div class="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <div class="flex items-center gap-2 text-slate-500 font-extrabold text-[10px] uppercase tracking-wider">
                <i data-lucide="shield" class="w-4 h-4 text-emerald-500 animate-pulse"></i> Operational Security Center
            </div>
            <h1 class="text-3xl font-display font-black tracking-tight text-slate-900 mt-1">Platform Admin Suite</h1>
            <p class="text-slate-500 font-semibold text-xs">Verify platform activity, edit dynamic announcements, audit syllabus questions, and review study materials.</p>
        </div>
    </div>

    <!-- Layout Columns -->
    <div class="flex flex-col lg:flex-row gap-8">
        
        <!-- Sidebar Navigation -->
        <?php include DIR_INCLUDES . '/admin_sidebar.php'; ?>

        <!-- Major Functional Area -->
        <div class="flex-grow space-y-8">
            
            <!-- Quick scoreboard statistics cards -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-black">
                
                <div class="p-6 bg-white border border-slate-200 rounded-3xl flex items-center gap-4 shadow-sm">
                    <div class="p-3 bg-primary/10 text-primary rounded-2xl">
                        <i data-lucide="users" class="w-6 h-6"></i>
                    </div>
                    <div>
                        <p class="text-slate-400 text-[9px] uppercase tracking-widest leading-none">Registered Users</p>
                        <h4 class="text-xl font-display tracking-tight text-slate-900 font-black mt-1"><?php echo $totalUsers; ?></h4>
                    </div>
                </div>

                <div class="p-6 bg-white border border-slate-200 rounded-3xl flex items-center gap-4 shadow-sm">
                    <div class="p-3 bg-amber-500/10 text-amber-600 rounded-2xl">
                        <i data-lucide="award" class="w-6 h-6"></i>
                    </div>
                    <div>
                        <p class="text-slate-400 text-[9px] uppercase tracking-widest leading-none">Exams Cataloged</p>
                        <h4 class="text-xl font-display tracking-tight text-slate-900 font-black mt-1"><?php echo $totalExams; ?></h4>
                    </div>
                </div>

                <div class="p-6 bg-white border border-slate-200 rounded-3xl flex items-center gap-4 shadow-sm">
                    <div class="p-3 bg-sky-500/10 text-sky-600 rounded-2xl">
                        <i data-lucide="file-text" class="w-6 h-6"></i>
                    </div>
                    <div>
                        <p class="text-slate-400 text-[9px] uppercase tracking-widest leading-none">Study Materials</p>
                        <h4 class="text-xl font-display tracking-tight text-slate-900 font-black mt-1"><?php echo $totalBooks; ?></h4>
                    </div>
                </div>

            </div>

            <!-- Recenty Activity Audit log panels -->
            <div class="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-lg shadow-slate-100">
                <h2 class="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-4 mb-5 flex items-center gap-2">
                    <i data-lucide="terminal" class="w-4.5 h-4.5 text-primary"></i> Real-time Operations Telemetry Logs
                </h2>

                <?php if (empty($recentLogs)): ?>
                    <p class="text-center font-bold text-slate-450 uppercase tracking-wider text-xs py-10">No recent action telemetry logs stored in memory.</p>
                <?php else: ?>
                    <div class="relative overflow-x-auto">
                        <table class="w-full text-left font-semibold text-xs text-slate-600 border-collapse">
                            <thead>
                                <tr class="text-[9px] font-black uppercase text-slate-400 border-b">
                                    <th class="pb-3 font-extrabold tracking-widest">Active User</th>
                                    <th class="pb-3 font-extrabold tracking-widest">Action Code</th>
                                    <th class="pb-3 font-extrabold tracking-widest">Log details description</th>
                                    <th class="pb-3 text-right font-extrabold tracking-widest">Receipt Index</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-50 font-semibold">
                                <?php foreach ($recentLogs as $log): ?>
                                    <tr>
                                        <td class="py-3.5 pr-2">
                                            <p class="text-slate-950 font-black leading-none"><?php echo e($log['user_name'] ?? 'System Guest'); ?></p>
                                        </td>
                                        <td class="py-3.5 font-mono">
                                            <span class="px-2 py-0.5 bg-slate-100 text-slate-700 text-[9px] font-bold rounded">
                                                <?php echo e($log['action']); ?>
                                            </span>
                                        </td>
                                        <td class="py-3.5 pr-4 text-slate-500 leading-normal max-w-xs truncate" title="<?php echo e($log['description']); ?>">
                                            <?php echo e($log['description']); ?>
                                        </td>
                                        <td class="py-3.5 text-right font-mono text-slate-400 text-[11px]">
                                            <?php echo formatDate($log['timestamp']); ?>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                <?php endif; ?>
            </div>

        </div>

    </div>
</div>

<?php include DIR_INCLUDES . '/footer.php'; ?>
