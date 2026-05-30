<?php
/**
 * PrepNext Sign In Template
 */

$pageTitle = "Sign In To Your Account";

// Redirect if already signed in
if (getCurrentUser()) {
    redirect('/dashboard');
}

include DIR_INCLUDES . '/header.php';
?>

<section class="py-24 bg-slate-50 flex items-center justify-center min-h-[70vh]">
    <div class="max-w-md w-full px-4">
        
        <!-- Registration shell container -->
        <div class="bg-white rounded-3xl border border-slate-200 p-8 md:p-10 shadow-lg shadow-slate-200/50">
            <div class="text-center space-y-2 mb-8">
                <div class="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center font-display font-black text-xl mx-auto border border-primary/15">
                    P
                </div>
                <h2 class="text-2xl font-display font-black tracking-tight text-slate-900 mt-3">Welcome Back</h2>
                <p class="text-slate-500 font-semibold text-xs">Unlock your masterclass competitive exams prep dashboards.</p>
            </div>

            <!-- Submission form -->
            <form action="" method="POST" class="space-y-5">
                <div class="space-y-1.5">
                    <label for="email" class="text-[10px] font-black uppercase tracking-wider text-slate-500">Email Address</label>
                    <div class="relative">
                        <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                            <i data-lucide="mail" class="w-4 h-4"></i>
                        </span>
                        <input 
                            type="email" 
                            name="email" 
                            id="email" 
                            required 
                            placeholder="aspirant@prepnext.in"
                            class="w-full pl-10 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:border-primary focus:bg-white focus:outline-none text-xs font-semibold text-slate-800 transition-all placeholder:text-slate-400"
                        >
                    </div>
                </div>

                <div class="space-y-1.5">
                    <div class="flex items-center justify-between">
                        <label for="password" class="text-[10px] font-black uppercase tracking-wider text-slate-500">Secure Password</label>
                        <a href="<?php echo BASE_URL; ?>/contact" class="text-[10px] font-black text-primary uppercase tracking-wider hover:underline">Forgot?</a>
                    </div>
                    <div class="relative">
                        <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                            <i data-lucide="lock" class="w-4 h-4"></i>
                        </span>
                        <input 
                            type="password" 
                            name="password" 
                            id="password" 
                            required 
                            placeholder="••••••••••••"
                            class="w-full pl-10 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:border-primary focus:bg-white focus:outline-none text-xs font-semibold text-slate-800 transition-all placeholder:text-slate-400"
                        >
                    </div>
                </div>

                <button 
                    type="submit" 
                    class="w-full py-4 bg-primary hover:bg-primary-dark text-white font-black text-xs uppercase tracking-widest rounded-xl text-center shadow-lg shadow-primary/10 transition-all cursor-pointer hover:-translate-y-0.5"
                >
                    Authenticate Account
                </button>
            </form>

            <div class="mt-8 pt-6 border-t border-slate-100 text-center text-xs">
                <span class="text-slate-500 font-semibold">New to PrepNext?</span>
                <a href="<?php echo BASE_URL; ?>/signup" class="text-primary font-black uppercase tracking-widest ml-1 hover:underline">Register Free</a>
            </div>
        </div>

        <!-- Meta tips link -->
        <div class="mt-6 text-center text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
            <span class="flex items-center justify-center gap-1"><i data-lucide="shield-check" class="w-3.5 h-3.5 text-emerald-500"></i> Secure Session SSL Token Encryption</span>
        </div>

    </div>
</section>

<?php include DIR_INCLUDES . '/footer.php'; ?>
