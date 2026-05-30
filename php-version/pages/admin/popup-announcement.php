<?php
/**
 * PrepNext Admin Popup Announcement Panel
 * Supports editing system values, and an interactive JS live-testing preview
 */

$pageTitle = "Announcement Popup Manager";

// Handle form updates POST
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'save_popup') {
    $title = trim($_POST['title'] ?? '');
    $description = trim($_POST['description'] ?? '');
    $imageUrl = trim($_POST['imageUrl'] ?? '');
    $buttonText = trim($_POST['buttonText'] ?? '');
    $buttonUrl = trim($_POST['buttonUrl'] ?? '');
    $isActive = isset($_POST['isActive']) ? true : false;
    
    $settingsData = [
        'title' => $title,
        'description' => $description,
        'imageUrl' => $imageUrl,
        'buttonText' => $buttonText,
        'buttonUrl' => $buttonUrl,
        'isActive' => $isActive,
        'updatedAt' => date('Y-m-d\TH:i:s\Z')
    ];
    
    // Save to database
    $res = Database::execute(
        "INSERT INTO settings (`key`, value_json) VALUES ('popup_announcement', :v) 
         ON DUPLICATE KEY UPDATE value_json = :v",
        ['v' => json_encode($settingsData)]
    );
    
    if ($res) {
        logUserActivity('ADMIN_ANNOUNCEMENT_POPUP_UPDATE', "Modified system popup announcement parameters.");
        setFlash("Announcement Popup successfully updated!", "success");
        redirect('/admin/popup-announcement');
    } else {
        setFlash("Database failure updating settings.", "error");
    }
}

// Fetch active popup details
$popup = getSetting('popup_announcement');

$title = $popup['title'] ?? '';
$description = $popup['description'] ?? '';
$imageUrl = $popup['imageUrl'] ?? '';
$buttonText = $popup['buttonText'] ?? '';
$buttonUrl = $popup['buttonUrl'] ?? '';
$isActive = isset($popup['isActive']) && $popup['isActive'] ? true : false;

include DIR_INCLUDES . '/header.php';
?>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    
    <!-- Header banner -->
    <div class="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <div class="flex items-center gap-2 text-slate-500 font-extrabold text-[10px] uppercase tracking-wider">
                <i data-lucide="shield-check" class="w-4 h-4 text-emerald-500"></i> Admin Panel Control
            </div>
            <h1 class="text-3xl font-display font-black tracking-tight text-slate-900 mt-1">Popup Banner Settings</h1>
            <p class="text-slate-500 font-semibold text-xs">Drive instant promotions on the home page with custom titles, images, and action buttons.</p>
        </div>
    </div>

    <!-- Layout Columns -->
    <div class="flex flex-col lg:flex-row gap-8">
        
        <!-- Sidebar Navigation -->
        <?php include DIR_INCLUDES . '/admin_sidebar.php'; ?>

        <!-- Major Functional Area -->
        <div class="flex-grow grid grid-cols-1 xl:grid-cols-2 gap-8">
            
            <!-- Update configurations box Form -->
            <div class="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-lg shadow-slate-100 flex flex-col justify-between">
                <div>
                    <h2 class="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
                        <i data-lucide="edit-3" class="w-4.5 h-4.5 text-primary"></i> Edit Announcement Parameters
                    </h2>

                    <form id="popup-config-form" action="" method="POST" class="space-y-5 pt-5">
                        <input type="hidden" name="action" value="save_popup">

                        <div class="space-y-1.5">
                            <label for="form-title" class="text-[10px] font-black uppercase tracking-wider text-slate-500">Announcement Title</label>
                            <input 
                                type="text" 
                                name="title" 
                                id="form-title" 
                                value="<? e($title); ?>"
                                required 
                                placeholder="e.g. 50% discount on test packages!"
                                class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-primary focus:bg-white focus:outline-none text-xs font-semibold text-slate-800 transition-colors"
                            >
                        </div>

                        <div class="space-y-1.5">
                            <label for="form-desc" class="text-[10px] font-black uppercase tracking-wider text-slate-500">Bulleting Description</label>
                            <textarea 
                                name="description" 
                                id="form-desc" 
                                rows="4"
                                required 
                                placeholder="Describe details of the offering..."
                                class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-primary focus:bg-white focus:outline-none text-xs font-semibold text-slate-800 transition-all"
                            ><? e($description); ?></textarea>
                        </div>

                        <div class="space-y-1.5">
                            <label for="form-image" class="text-[10px] font-black uppercase tracking-wider text-slate-500">Banner Cover Image URL (Optional)</label>
                            <input 
                                type="url" 
                                name="imageUrl" 
                                id="form-image" 
                                value="<? e($imageUrl); ?>"
                                placeholder="https://images.unsplash.com/photo-..."
                                class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-primary focus:bg-white focus:outline-none text-xs font-semibold text-slate-800 transition-colors"
                            >
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-1.5">
                                <label for="form-btn-text" class="text-[10px] font-black uppercase tracking-wider text-slate-500">CTA Button Label</label>
                                <input 
                                    type="text" 
                                    name="buttonText" 
                                    id="form-btn-text" 
                                    value="<? e($buttonText); ?>"
                                    placeholder="e.g. GRAB OFFER"
                                    class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-primary focus:bg-white focus:outline-none text-xs font-semibold text-slate-800 transition-colors"
                                >
                            </div>
                            <div class="space-y-1.5">
                                <label for="form-btn-url" class="text-[10px] font-black uppercase tracking-wider text-slate-500">CTA Button Redirect URL</label>
                                <input 
                                    type="text" 
                                    name="buttonUrl" 
                                    id="form-btn-url" 
                                    value="<? e($buttonUrl); ?>"
                                    placeholder="e.g. /premium"
                                    class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-primary focus:bg-white focus:outline-none text-xs font-semibold text-slate-800 transition-colors"
                                >
                            </div>
                        </div>

                        <div class="p-4 bg-slate-50 border border-slate-200/50 rounded-2xl flex items-center justify-between">
                            <div class="space-y-0.5">
                                <p class="text-xs font-black text-slate-800 uppercase tracking-wide">Publish Status</p>
                                <p class="text-[10px] font-semibold text-slate-400">Instantly activate this alert on the front main page.</p>
                            </div>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    value="1" 
                                    name="isActive" 
                                    id="form-active"
                                    class="sr-only peer" 
                                    <?php echo $isActive ? 'checked' : ''; ?>
                                >
                                <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>
                    </form>
                </div>

                <div class="pt-6 border-t border-slate-100 mt-6 flex gap-4">
                    <button 
                        type="submit" 
                        form="popup-config-form"
                        class="px-6 py-3.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-black uppercase tracking-widest shadow shadow-primary/15 transition-all text-center flex-grow cursor-pointer"
                    >
                        Save Configurations
                    </button>
                </div>
            </div>

            <!-- Previews Block Space -->
            <div class="space-y-6">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <i data-lucide="eye" class="w-4 h-4 text-slate-500"></i>
                        <h2 class="text-xs font-black text-slate-400 uppercase tracking-widest">Interactive Mockup Preview</h2>
                    </div>
                    <!-- Launches dynamic fullscreen simulator modal -->
                    <button 
                        onclick="launchOverlaySimulator()"
                        class="px-4 py-2.5 bg-gradient-to-r from-teal-600 to-[#006e5d] hover:from-teal-700 hover:to-[#005c4e] text-white shadow-sm hover:shadow font-black text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer leading-none"
                    >
                        <i data-lucide="external-link" class="w-3.5 h-3.5 text-teal-200"></i> Launch Live Overlay
                    </button>
                </div>

                <!-- Live Container Mockup Box -->
                <div class="bg-slate-100 border border-slate-200 rounded-3xl p-6 relative min-h-[400px] flex items-center justify-center">
                    
                    <!-- Simulating the modal right inside container -->
                    <div class="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-md border relative flex flex-col">
                        
                        <!-- Header cover fallback or image -->
                        <div id="mock-banner-img-area" class="w-full aspect-[16/10] bg-slate-200 relative hidden">
                            <img id="mock-banner-img" src="" alt="Cover banner" class="w-full h-full object-cover">
                        </div>

                        <div id="mock-banner-fallback-area" class="py-6 px-6 bg-gradient-to-r from-[#006e5d] to-[#014e42] text-white relative flex items-center gap-3">
                            <div class="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 shrink-0">
                                <i data-lucide="megaphone" class="w-4.5 h-4.5 text-teal-300"></i>
                            </div>
                            <div>
                                <span class="px-1.5 py-0.5 bg-rose-500 text-white rounded text-[7px] font-black uppercase tracking-wider inline-flex items-center gap-0.5 shadow">
                                    Broadcast Banner
                                </span>
                            </div>
                        </div>

                        <!-- Card particulars -->
                        <div class="p-6">
                            <h3 id="mock-title" class="text-sm font-black text-slate-900 tracking-tight leading-snug mb-2">Announcement Banner Title</h3>
                            <p id="mock-desc" class="text-[10px] font-semibold text-slate-500 leading-normal mb-5 whitespace-pre-line max-h-24 overflow-y-auto">Announcement details described by you above show up instantly here with responsive formatting constraints.</p>
                            
                            <div class="space-y-2">
                                <button id="mock-cta" class="w-full py-2.5 bg-[#006e5d] text-white font-black text-[10px] uppercase tracking-widest rounded-lg text-center hidden pointer-events-none">
                                    CTA Button text
                                </button>
                                <button class="w-full py-2 hover:bg-slate-50 text-slate-400 font-extrabold text-[10px] uppercase tracking-widest rounded-lg text-center pointer-events-none">
                                    Dismiss / Maybe Later
                                </button>
                            </div>
                        </div>

                    </div>

                </div>
            </div>

        </div>

    </div>
</div>

<!-- Complete Full-Page Testing Overlay Simulator Modal -->
<div id="testing-announcement-overlay" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-sm hidden transition-all animate-fade-in">
    <div class="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.4)] border border-slate-200/50 relative flex flex-col transform">
        
        <!-- Simulation Status Badge tags -->
        <div class="absolute top-4 left-4 z-20">
            <span class="px-2.5 py-1 bg-amber-600 text-white rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
                <i data-lucide="sparkles" class="w-2.5 h-2.5 text-amber-200"></i> SIMULATOR ACTIVE
            </span>
        </div>

        <button onclick="closeOverlaySimulator()" class="absolute top-4 right-4 z-20 w-8 h-8 bg-slate-900/10 hover:bg-slate-900/20 text-slate-700 rounded-full flex items-center justify-center cursor-pointer transition-colors border border-black/5">
            <i data-lucide="x" class="w-4 h-4"></i>
        </button>

        <!-- Media frame -->
        <div id="sim-banner-img-area" class="w-full aspect-[16/10] bg-slate-100 overflow-hidden relative hidden">
            <img id="sim-banner-img" src="" alt="Simulator picture banner" class="w-full h-full object-cover">
        </div>
        <div id="sim-banner-fallback-area" class="py-10 px-6 bg-gradient-to-r from-[#006e5d] to-[#014e42] text-white relative flex items-center gap-3 pt-14">
            <div class="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 shrink-0">
                <i data-lucide="megaphone" class="w-5 h-5 text-teal-300"></i>
            </div>
            <div>
                <h4 class="text-xs font-black tracking-widest text-[#a7f3d0] leading-none uppercase">SYSTEM CONVERSIONS PREVIEW</h4>
            </div>
        </div>

        <!-- Details -->
        <div class="p-6 md:p-8">
            <h3 id="sim-title" class="text-lg font-black text-slate-900 tracking-tight leading-snug mb-3">Announcement Title</h3>
            <p id="sim-desc" class="text-xs font-semibold text-slate-500 leading-relaxed mb-6 whitespace-pre-line max-h-48 overflow-y-auto pr-1">Descriptions panel summary metadata showing up dynamically.</p>

            <div class="space-y-3">
                <button id="sim-cta" onclick="triggerSimulatedAction()" class="w-full py-3.5 bg-[#006e5d] hover:bg-[#005c4e] text-white font-black text-xs uppercase tracking-widest rounded-xl text-center shadow-lg shadow-[#006e5d]/10 hover:shadow-[#006e5d]/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer hidden">
                    Button CTA
                </button>
                <button onclick="closeOverlaySimulator()" class="w-full py-3 hover:bg-slate-50 text-slate-500 hover:text-slate-800 font-extrabold text-xs uppercase tracking-widest rounded-xl text-center transition-all cursor-pointer">
                    Dismiss / Maybe Later
                </button>
            </div>
        </div>

    </div>
</div>

<script>
    // Bind dynamic text change synchronization
    const inputTitle = document.getElementById("form-title");
    const inputDesc = document.getElementById("form-desc");
    const inputImage = document.getElementById("form-image");
    const inputBtnText = document.getElementById("form-btn-text");
    const inputBtnUrl = document.getElementById("form-btn-url");

    // Elements Mockup
    const mockTitle = document.getElementById("mock-title");
    const mockDesc = document.getElementById("mock-desc");
    const mockImgArea = document.getElementById("mock-banner-img-area");
    const mockImg = document.getElementById("mock-banner-img");
    const mockFallback = document.getElementById("mock-banner-fallback-area");
    const mockCta = document.getElementById("mock-cta");

    // Elements Simulator
    const simTitle = document.getElementById("sim-title");
    const simDesc = document.getElementById("sim-desc");
    const simImgArea = document.getElementById("sim-banner-img-area");
    const simImg = document.getElementById("sim-banner-img");
    const simFallback = document.getElementById("sim-banner-fallback-area");
    const simCta = document.getElementById("sim-cta");

    function syncPreviewElements() {
        // Read form inputs
        const currentTitle = inputTitle.value.trim() || 'Announcement Title Cover';
        const currentDesc = inputDesc.value.trim() || 'No description provided yet.';
        const currentImage = inputImage.value.trim();
        const currentBtnText = inputBtnText.value.trim();
        const currentBtnUrl = inputBtnUrl.value.trim();

        // 1. Mockup update
        mockTitle.textContent = currentTitle;
        mockDesc.textContent = currentDesc;
        if (currentImage !== '') {
            mockImg.src = currentImage;
            mockImgArea.classList.remove("hidden");
            mockFallback.classList.add("hidden");
        } else {
            mockImgArea.classList.add("hidden");
            mockFallback.classList.remove("hidden");
        }

        if (currentBtnText !== '' && currentBtnUrl !== '') {
            mockCta.textContent = currentBtnText;
            mockCta.classList.remove("hidden");
        } else {
            mockCta.classList.add("hidden");
        }

        // 2. Simulator update
        simTitle.textContent = currentTitle;
        simDesc.textContent = currentDesc;
        if (currentImage !== '') {
            simImg.src = currentImage;
            simImgArea.classList.remove("hidden");
            simFallback.classList.add("hidden");
        } else {
            simImgArea.classList.add("hidden");
            simFallback.classList.remove("hidden");
        }

        if (currentBtnText !== '' && currentBtnUrl !== '') {
            simCta.textContent = currentBtnText;
            simCta.classList.remove("hidden");
        } else {
            simCta.classList.add("hidden");
        }
    }

    // Attach listeners for immediate preview rendering
    [inputTitle, inputDesc, inputImage, inputBtnText, inputBtnUrl].forEach(el => {
        el.addEventListener("input", syncPreviewElements);
    });

    // Run first sync initial load
    document.addEventListener("DOMContentLoaded", syncPreviewElements);

    // Overlay simulator controls
    function launchOverlaySimulator() {
        syncPreviewElements();
        document.getElementById("testing-announcement-overlay").classList.remove("hidden");
    }

    function closeOverlaySimulator() {
        document.getElementById("testing-announcement-overlay").classList.add("hidden");
    }

    function triggerSimulatedAction() {
        const targetUrl = inputBtnUrl.value.trim();
        alert("Action Simulation: Dynamic trigger directing visitor to URL: " + targetUrl);
        closeOverlaySimulator();
    }
</script>

<?php include DIR_INCLUDES . '/footer.php'; ?>
