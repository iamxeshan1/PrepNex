<?php
/**
 * PrepNext Sign Up Template
 */

$pageTitle = "Register Free Account";

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
                <h2 class="text-2xl font-display font-black tracking-tight text-slate-900 mt-3">Register Free Account</h2>
                <p class="text-slate-500 font-semibold text-xs">Unlock mock test batteries, answer banks, and premium ebooks access.</p>
            </div>

            <!-- Submission form -->
            <form action="" method="POST" class="space-y-5">
                <div class="space-y-1.5">
                    <label for="name" class="text-[10px] font-black uppercase tracking-wider text-slate-500">Your Full Name</label>
                    <div class="relative">
                        <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                            <i data-lucide="user" class="w-4 h-4"></i>
                        </span>
                        <input 
                            type="text" 
                            name="name" 
                            id="name" 
                            required 
                            placeholder="John Doe"
                            class="w-full pl-10 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:border-primary focus:bg-white focus:outline-none text-xs font-semibold text-slate-800 transition-all placeholder:text-slate-400"
                        >
                    </div>
                </div>

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
                    <label for="password" class="text-[10px] font-black uppercase tracking-wider text-slate-500">Secure Password</label>
                    <div class="relative">
                        <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                            <i data-lucide="lock" class="w-4 h-4"></i>
                        </span>
                        <input 
                            type="password" 
                            name="password" 
                            id="password" 
                            required 
                            placeholder="Choose a strong password"
                            class="w-full pl-10 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:border-primary focus:bg-white focus:outline-none text-xs font-semibold text-slate-800 transition-all placeholder:text-slate-400"
                        >
                    </div>
                </div>

                <div class="flex items-center gap-2 pt-1 font-semibold text-[10px] text-slate-500 leading-normal">
                    <input type="checkbox" required class="w-4.5 h-4.5 accent-primary shrink-0 rounded cursor-pointer">
                    <span>I explicitly agree to the Privacy Policy & Terms of Service covenants.</span>
                </div>

                <button 
                    type="submit" 
                    class="w-full py-4 bg-primary hover:bg-primary-dark text-white font-black text-xs uppercase tracking-widest rounded-xl text-center shadow-lg shadow-primary/10 transition-all cursor-pointer hover:-translate-y-0.5"
                >
                    Create Free Profile
                </button>
            </form>

            <div class="mt-8 pt-6 border-t border-slate-100 text-center text-xs">
                <span class="text-slate-500 font-semibold">Already have an account?</span>
                <a href="<?php echo BASE_URL; ?>/login" class="text-primary font-black uppercase tracking-widest ml-1 hover:underline">Sign In Instead</a>
            </div>
        </div>

    </div>
</section>

<?php include DIR_INCLUDES . '/footer.php'; ?>
