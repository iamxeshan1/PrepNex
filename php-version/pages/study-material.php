<?php
/**
 * PrepNext E-Books & Reference Study Material Catalog
 * Supports URL search and category filtering directly over PDO
 */

$pageTitle = "Premium E-books & Study Material Guides";

$selectedCategory = $_GET['category'] ?? '';
$searchText = trim($_GET['search'] ?? '');

// Build dynamic WHERE query
$where = [];
$params = [];

if ($selectedCategory !== '') {
    $where[] = "category = :category";
    $params['category'] = $selectedCategory;
}

if ($searchText !== '') {
    $where[] = "title LIKE :search OR description LIKE :search";
    $params['search'] = '%' . $searchText . '%';
}

$whereSql = '';
if (!empty($where)) {
    $whereSql = 'WHERE ' . implode(' AND ', $where);
}

// Fetch elements
$materials = Database::selectAll("SELECT * FROM study_materials $whereSql ORDER BY id DESC", $params);

// Fetch all available category lists to fill tabs
$categories = Database::selectAll("SELECT DISTINCT category FROM study_materials WHERE category IS NOT NULL AND category != ''");

include DIR_INCLUDES . '/header.php';
?>

<section class="py-12 bg-slate-50 border-b border-slate-150">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <!-- Headers -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
                <span class="px-3 py-1 bg-primary/10 border border-primary/20 text-primary rounded-full text-[10px] font-black uppercase tracking-widest select-none">DIGITAL LIBRARY SHELTER</span>
                <h1 class="text-3xl font-display font-black tracking-tight text-slate-900 mt-2">Study Materials & Handbooks</h1>
                <p class="text-slate-500 font-semibold text-xs mt-1">Acquire detailed chapters trackers, formulas charts, and previous-years resolved questions.</p>
            </div>

            <!-- Search box -->
            <form action="" method="GET" class="flex items-center gap-2 max-w-sm w-full">
                <?php if ($selectedCategory): ?>
                    <input type="hidden" name="category" value="<?php echo e($selectedCategory); ?>">
                <?php endif; ?>
                <div class="relative w-full">
                    <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                        <i data-lucide="search" class="w-4 h-4"></i>
                    </span>
                    <input 
                        type="text" 
                        name="search" 
                        value="<?php echo e($searchText); ?>" 
                        placeholder="Search books..." 
                        class="w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary transition-colors placeholder:text-slate-400"
                    >
                </div>
                <button type="submit" class="px-5 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-black uppercase tracking-wider shadow">
                     Search
                </button>
            </form>
        </div>

        <!-- Filter Category Tabs -->
        <div class="flex flex-wrap items-center gap-2 mb-10 border-b border-slate-200/60 pb-5 text-xs font-black">
            <a href="<?php echo BASE_URL; ?>/study-material<?php echo !empty($searchText) ? '?search=' . urlencode($searchText) : ''; ?>" class="px-4.5 py-2.5 rounded-xl transition-all <?php echo $selectedCategory === '' ? 'bg-primary text-white shadow shadow-primary/20' : 'bg-white hover:bg-slate-100 border text-slate-600 border-slate-200/80'; ?>">
                All Categories
            </a>
            <?php foreach ($categories as $cat): ?>
                <a href="<?php echo BASE_URL; ?>/study-material?category=<?php echo urlencode($cat['category']); ?><?php echo !empty($searchText) ? '&search=' . urlencode($searchText) : ''; ?>" class="px-4.5 py-2.5 rounded-xl transition-all <?php echo $selectedCategory === $cat['category'] ? 'bg-primary text-white shadow shadow-primary/20' : 'bg-white hover:bg-slate-100 border text-slate-600 border-slate-200/80'; ?>">
                    <?php echo e($cat['category']); ?>
                </a>
            <?php endforeach; ?>
        </div>

        <!-- Book Catalogues Grid -->
        <?php if (empty($materials)): ?>
            <div class="p-16 text-center bg-white border border-slate-200 rounded-3xl">
                <div class="w-12 h-12 bg-slate-100 border rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-3">
                    <i data-lucide="file-question" class="w-6 h-6"></i>
                </div>
                <h3 class="text-sm font-black text-slate-850 uppercase tracking-wider">No study manuals matched filter</h3>
                <p class="text-slate-400 text-xs mt-1">Try to broaden your keywords search or selection inputs.</p>
                <?php if ($selectedCategory || $searchText): ?>
                    <a href="<?php echo BASE_URL; ?>/study-material" class="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider mt-4 inline-block">Clear Filters</a>
                <?php endif; ?>
            </div>
        <?php else: ?>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <?php foreach ($materials as $bk): 
                    $isFree = (int)$bk['is_free'] === 1;
                    $price = $bk['price'];
                ?>
                    <div class="group bg-white rounded-3xl border border-slate-200 overflow-hidden flex flex-col p-4 shadow-sm hover:border-primary/30 hover:shadow-lg transition-all duration-300">
                        
                        <!-- Book Cover visual framework representation -->
                        <div class="relative aspect-[16/11] bg-slate-100 rounded-2xl overflow-hidden mb-4 shrink-0 flex items-center justify-center border border-slate-150">
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
                                    <span class="px-2.5 py-1 bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
                                        <i data-lucide="unlock" class="w-2.5 h-2.5 text-emerald-100"></i> Free Read
                                    </span>
                                <?php else: ?>
                                    <span class="px-2.5 py-1 bg-amber-500 text-white rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
                                        <i data-lucide="lock" class="w-2.5 h-2.5 text-amber-100"></i> <?php echo formatRupee($price); ?>
                                    </span>
                                <?php endif; ?>
                            </div>
                        </div>

                        <!-- Details card panel -->
                        <div class="flex-grow flex flex-col justify-between">
                            <div>
                                <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block"><?php echo e($bk['category']); ?></span>
                                <h3 class="text-xs font-black text-slate-900 tracking-tight leading-snug line-clamp-2 mb-1.5 group-hover:text-primary transition-colors"><?php echo e($bk['title']); ?></h3>
                                <p class="text-[10px] font-semibold text-slate-400 leading-normal line-clamp-3"><?php echo e($bk['description']); ?></p>
                            </div>

                            <div class="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                                <div class="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                    <i data-lucide="file-text" class="w-3.5 h-3.5"></i> <?php echo (int)($bk['total_pages'] ?? 100); ?> pages
                                </div>

                                <?php if ($isFree || isPremium()): ?>
                                    <a href="<?php echo e($bk['pdf_url'] ?? '#'); ?>" class="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-md shadow-primary/5 cursor-pointer">
                                        <i data-lucide="download" class="w-3 h-3"></i> Get PDF
                                    </a>
                                <?php else: ?>
                                    <a href="<?php echo BASE_URL; ?>/premium" class="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 cursor-pointer">
                                        <i data-lucide="credit-card" class="w-3 h-3 text-amber-400"></i> Unlock Free
                                    </a>
                                <?php endif; ?>
                            </div>
                        </div>

                    </div>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>

    </div>
</section>

<?php include DIR_INCLUDES . '/footer.php'; ?>
