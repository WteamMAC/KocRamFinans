landing
<!DOCTYPE html>

<html lang="tr">

<head>
    <meta charset="utf-8" />
    <meta content="width=device-width, initial-scale=1.0" name="viewport" />
    <title>Koç Ai - Finansal Geleceğinizi Şekillendirin</title>
    <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
    <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap"
        rel="stylesheet" />
    <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&amp;family=Plus+Jakarta+Sans:wght@600;700&amp;display=swap"
        rel="stylesheet" />
    <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap"
        rel="stylesheet" />
    <script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "on-surface": "#1a1c1a",
                        "outline-variant": "#c4c6d2",
                        "secondary-container": "#fed65b",
                        "on-secondary-fixed": "#241a00",
                        "inverse-primary": "#aec6ff",
                        "on-background": "#1a1c1a",
                        "secondary": "#735c00",
                        "inverse-on-surface": "#f1f1ee",
                        "surface-bright": "#faf9f6",
                        "on-tertiary": "#ffffff",
                        "tertiary-fixed": "#e5e2e1",
                        "error": "#ba1a1a",
                        "on-secondary": "#ffffff",
                        "secondary-fixed-dim": "#e9c349",
                        "primary-container": "#002f6c",
                        "secondary-fixed": "#ffe088",
                        "on-primary-fixed": "#001a42",
                        "on-error": "#ffffff",
                        "surface-tint": "#3c5d9c",
                        "primary": "#001b44",
                        "on-tertiary-fixed": "#1c1b1b",
                        "tertiary-fixed-dim": "#c8c6c5",
                        "inverse-surface": "#2f312f",
                        "outline": "#747781",
                        "surface-container-low": "#f4f3f1",
                        "surface-container-high": "#e9e8e5",
                        "on-secondary-fixed-variant": "#574500",
                        "on-error-container": "#93000a",
                        "on-primary-fixed-variant": "#224583",
                        "on-secondary-container": "#745c00",
                        "surface-container-highest": "#e3e2e0",
                        "primary-fixed-dim": "#aec6ff",
                        "on-tertiary-container": "#9b9998",
                        "on-surface-variant": "#434750",
                        "surface-dim": "#dbdad7",
                        "surface-variant": "#e3e2e0",
                        "tertiary-container": "#313131",
                        "tertiary": "#1c1c1c",
                        "on-tertiary-fixed-variant": "#474746",
                        "primary-fixed": "#d8e2ff",
                        "surface-container": "#efeeeb",
                        "surface": "#faf9f6",
                        "on-primary": "#ffffff",
                        "on-primary-container": "#7999dc",
                        "surface-container-lowest": "#ffffff",
                        "error-container": "#ffdad6",
                        "background": "#faf9f6"
                    },
                    "borderRadius": {
                        "DEFAULT": "0.25rem",
                        "lg": "0.5rem",
                        "xl": "0.75rem",
                        "full": "9999px"
                    },
                    "spacing": {
                        "section-gap": "120px",
                        "margin-mobile": "16px",
                        "container-max": "1280px",
                        "base": "8px",
                        "gutter": "24px",
                        "margin-desktop": "64px"
                    },
                    "fontFamily": {
                        "display-lg": ["Plus Jakarta Sans"],
                        "display-lg-mobile": ["Plus Jakarta Sans"],
                        "body-md": ["Inter"],
                        "headline-md": ["Plus Jakarta Sans"],
                        "label-sm": ["Inter"],
                        "headline-xl": ["Plus Jakarta Sans"],
                        "body-lg": ["Inter"]
                    },
                    "fontSize": {
                        "display-lg": ["64px", { "lineHeight": "1.1", "letterSpacing": "-0.02em", "fontWeight": "700" }],
                        "display-lg-mobile": ["40px", { "lineHeight": "1.2", "fontWeight": "700" }],
                        "body-md": ["16px", { "lineHeight": "1.6", "fontWeight": "400" }],
                        "headline-md": ["24px", { "lineHeight": "1.3", "fontWeight": "600" }],
                        "label-sm": ["12px", { "lineHeight": "1", "letterSpacing": "0.05em", "fontWeight": "600" }],
                        "headline-xl": ["40px", { "lineHeight": "1.2", "fontWeight": "600" }],
                        "body-lg": ["18px", { "lineHeight": "1.6", "fontWeight": "400" }]
                    }
                }
            }
        }
    </script>
    <style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
    </style>
</head>

<body
    class="bg-background text-on-background font-body-md antialiased selection:bg-primary-container selection:text-on-primary-container">
    <!-- TopAppBar -->
    <header
        class="bg-surface/80 dark:bg-primary/80 backdrop-blur-md docked full-width top-0 sticky z-50 border-b border-outline-variant/30 dark:border-outline/20 flat no shadows">
        <div
            class="flex justify-between items-center max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-4">
            <a class="font-display-lg-mobile text-headline-md font-bold text-primary dark:text-primary-fixed flex items-center gap-2"
                href="#">
                <span class="material-symbols-outlined text-[32px] text-secondary-container" data-weight="fill"
                    style="font-variation-settings: 'FILL' 1;">analytics</span>
                Koç Ai
            </a>
            <nav class="hidden md:flex items-center gap-8">
                <a class="text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-primary-fixed transition-colors text-body-md font-body-md"
                    href="#">Features</a>
                <a class="text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-primary-fixed transition-colors text-body-md font-body-md"
                    href="#">Solutions</a>
                <a class="text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-primary-fixed transition-colors text-body-md font-body-md"
                    href="#">About</a>
            </nav>
            <div class="flex items-center gap-4">
                <button
                    class="hidden md:block text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-primary-fixed transition-colors text-body-md font-body-md font-semibold">
                    Log in
                </button>
                <button
                    class="bg-primary text-on-primary hover:bg-surface-container-high dark:hover:bg-primary-container rounded-full transition-all scale-95 duration-200 ease-in-out px-6 py-2.5 text-body-md font-body-md font-semibold">
                    Get Started
                </button>
            </div>
        </div>
    </header>
    <main>
        <!-- Hero Section -->
        <section
            class="pt-24 pb-section-gap px-margin-mobile md:px-margin-desktop text-center max-w-container-max mx-auto flex flex-col items-center">
            <!-- Social Proof Badge -->
            <div
                class="flex items-center justify-center gap-3 bg-surface-container-low border border-outline-variant/30 rounded-full py-1.5 px-4 mb-8">
                <div class="flex -space-x-2">
                    <img alt="User avatar" class="w-8 h-8 rounded-full border-2 border-surface-container-low"
                        data-alt="A small circular portrait of a professional individual used as an avatar, smiling slightly, set against a neutral background."
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDNriZbw5QSON08Kk7qenvByZRHo8u2djARhXHaMDuQMlqxygKrRmwIAqWktFMVYV6mwmhfCfwka41ZRreoQ5dIWyOOiLq2e8ObvbyTqMzn-FJzAotlnOl9B-zJgZz4GiRu6XoO4_Z2Sev_YJj2t5h4uqhhmlAkhhvmiIoqVnxLBveLwEA3EKFBfOJ2j3YpkDXJthRcAy_7UBJlkfwSWohfm7y3hFTotfOM1SyboiceW2wtZ-sHgyxRXLuYkkjX83v7TnY9vqEY1bw" />
                    <img alt="User avatar" class="w-8 h-8 rounded-full border-2 border-surface-container-low"
                        data-alt="A small circular portrait of a smiling woman used as an avatar, set against a bright, modern background."
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuAatVYLWvDrJUN1kk7noW_748582j7jP_FvL9-MYew0ioys2FHBcf7aShD7jLn-AWfXCnCUAxO9pS1UsqjLNdTZCw0JNLXGsr2AXGIRfgNqQzRyaDmTj3GoDyo3RkKTtFM7rQixF1gmQP1BeK7aQSefZ1WZ0HF9botbapGyh_DJUqhr2J7PYD6GRsc3bT-_-BiVoTx5J76-krtMyRdqdNsKhxhd2KuWRicPpQc-v4Z5JJb58ER4IajiRpuQkgaTXg1vyA1cYp4uGdo" />
                    <img alt="User avatar" class="w-8 h-8 rounded-full border-2 border-surface-container-low"
                        data-alt="A small circular portrait of a person wearing glasses used as an avatar, conveying a professional demeanor."
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuATfT09vmXp3ZJH_zKXnTs1u-TYgJmu3sV1I4ih77iXyk1WIIWeWX_49Y5-I1CBC74oZDIS0pYLUqgqOzM6Vpnooz_b1R4rnp60BVmhUS_pBB5yIvSipTlPxAy-uHsCQ2To5JZIPaLZVFr-p_Q-2sk_b0UtK_Wy4G6v5_rHnlytjkEkxzSAfUiZLWqJkZEB8WU19Lu3U1_6AxwyDuyIRN3pGh0Os8FqoCK57yRiZkbLj7_PVPCcyX9KauROXTrolbwDM3dPrlPj9EM" />
                </div>
                <div class="flex items-center gap-1 text-secondary-container">
                    <span class="material-symbols-outlined text-[16px]"
                        style="font-variation-settings: 'FILL' 1;">star</span>
                    <span class="material-symbols-outlined text-[16px]"
                        style="font-variation-settings: 'FILL' 1;">star</span>
                    <span class="material-symbols-outlined text-[16px]"
                        style="font-variation-settings: 'FILL' 1;">star</span>
                    <span class="material-symbols-outlined text-[16px]"
                        style="font-variation-settings: 'FILL' 1;">star</span>
                    <span class="material-symbols-outlined text-[16px]"
                        style="font-variation-settings: 'FILL' 1;">star_half</span>
                </div>
                <span
                    class="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">4.5+
                    Puan / 10.000+ Kullanıcı</span>
            </div>
            <!-- Headline & Sub -->
            <h1 class="font-display-lg text-display-lg-mobile md:text-display-lg text-primary max-w-4xl mx-auto mb-6">
                Finansal Geleceğinizi Yapay Zeka ile Şekillendirin
            </h1>
            <p class="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto mb-10">
                Koç Ai ile veriye dayalı, güvenli ve akıllı yatırım kararları alın. Geleceğinizi bugünden planlayın.
            </p>
            <!-- CTA -->
            <button
                class="bg-primary text-on-primary rounded-full px-8 py-4 flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-md mb-20 text-body-lg font-semibold">
                Hemen Başlayın
                <span class="material-symbols-outlined">arrow_forward</span>
            </button>
            <!-- Device Mockup Image -->
            <div class="relative w-full max-w-3xl mx-auto flex justify-center">
                <!-- Soft background glow behind phone -->
                <div
                    class="absolute inset-0 bg-secondary-container/10 blur-[100px] rounded-full w-3/4 h-3/4 left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-0">
                </div>
                <img alt="Koç Ai Mobile App Mockup"
                    class="relative z-10 w-full h-auto object-cover rounded-[40px] shadow-2xl border-4 border-surface"
                    data-alt="A high-quality, close-up photograph of a human hand holding a modern smartphone. The smartphone screen displays a sleek, dark-mode financial dashboard application with vibrant yellow accents, charts, and financial data. The background is a very clean, warm off-white minimalist studio setting, highlighting the device and its digital interface."
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAjUaAoqnh9CvvwdTsfA98bG6uDxoAiknseqrrOsuJtofcMeX6m6om_Z3GPyn2zGRiw1u75CE7UVN75td5CxqfSl5NfN6wkmiiicKWP3OG-PjIhY3J6NjPKYZQPL5hvA1MVArSuaaUYKoDwNQM2fGIK2zA-RycA3jGxRdnEfjRtd40BDRqzTiF0nWegFb72Ufjb_dZSl2r1IZgbtPsRrUEEQOoJfj05tCwc16TQWXhZjUxLfcS8WVSu8qrs6LhUpHFZBPf3hxklq3Q" />
            </div>
        </section>
        <!-- Feature Grid (Bento Style) -->
        <section
            class="py-section-gap px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto bg-surface-container-low rounded-[40px]">
            <div class="text-center mb-16">
                <h2 class="font-headline-xl text-headline-xl text-primary mb-4">Neden Koç Ai?</h2>
                <p class="text-on-surface-variant text-body-lg max-w-2xl mx-auto">Güçlü algoritmalar ve Koç Topluluğu
                    güvencesiyle finansal kararlarınızı optimize edin.</p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-gutter">
                <!-- Feature 1 -->
                <div
                    class="bg-surface rounded-[24px] p-8 shadow-sm border border-outline-variant/20 hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div
                        class="absolute -right-6 -top-6 w-32 h-32 bg-primary-container/5 rounded-full group-hover:scale-110 transition-transform duration-500">
                    </div>
                    <div
                        class="w-14 h-14 bg-primary-container text-on-primary-container rounded-xl flex items-center justify-center mb-6 relative z-10">
                        <span class="material-symbols-outlined text-[28px]">query_stats</span>
                    </div>
                    <h3 class="font-headline-md text-headline-md text-primary mb-3 relative z-10">Akıllı Analiz</h3>
                    <p class="text-on-surface-variant text-body-md relative z-10">
                        Makine öğrenimi modellerimiz, piyasa trendlerini gerçek zamanlı olarak analiz eder ve size en
                        uygun yatırım stratejilerini sunar. Karmaşık verileri anlaşılır içgörülere dönüştürürüz.
                    </p>
                </div>
                <!-- Feature 2 -->
                <div
                    class="bg-surface rounded-[24px] p-8 shadow-sm border border-outline-variant/20 hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div
                        class="absolute -right-6 -top-6 w-32 h-32 bg-secondary-container/10 rounded-full group-hover:scale-110 transition-transform duration-500">
                    </div>
                    <div
                        class="w-14 h-14 bg-secondary-container text-on-secondary-container rounded-xl flex items-center justify-center mb-6 relative z-10">
                        <span class="material-symbols-outlined text-[28px]">security</span>
                    </div>
                    <h3 class="font-headline-md text-headline-md text-primary mb-3 relative z-10">Güvenli Altyapı</h3>
                    <p class="text-on-surface-variant text-body-md relative z-10">
                        Verileriniz ve varlıklarınız, bankacılık standartlarında şifreleme ve gelişmiş güvenlik
                        protokolleri ile korunur. Koç Topluluğu güvencesiyle işlemlerinizi huzurla gerçekleştirin.
                    </p>
                </div>
                <!-- Feature 3 -->
                <div
                    class="bg-surface rounded-[24px] p-8 shadow-sm border border-outline-variant/20 hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div
                        class="absolute -right-6 -top-6 w-32 h-32 bg-tertiary-container/5 rounded-full group-hover:scale-110 transition-transform duration-500">
                    </div>
                    <div
                        class="w-14 h-14 bg-surface-container-highest text-on-surface rounded-xl flex items-center justify-center mb-6 relative z-10">
                        <span class="material-symbols-outlined text-[28px]">support_agent</span>
                    </div>
                    <h3 class="font-headline-md text-headline-md text-primary mb-3 relative z-10">7/24 Destek</h3>
                    <p class="text-on-surface-variant text-body-md relative z-10">
                        Uzman finansal danışmanlarımız ve yapay zeka asistanımız, ihtiyaç duyduğunuz her an, günün her
                        saati size destek olmak için yanınızda.
                    </p>
                </div>
            </div>
        </section>
        <!-- Trust Section -->
        <section
            class="py-24 px-margin-mobile md:px-margin-desktop flex flex-col items-center justify-center text-center">
            <p class="text-label-sm font-label-sm text-outline uppercase tracking-[0.1em] mb-6">Güvenin Adresi</p>
            <h2 class="font-headline-xl text-headline-xl text-primary mb-10">Bir Koç Topluluğu Kuruluşudur</h2>
            <div
                class="flex items-center justify-center gap-12 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                <span class="material-symbols-outlined text-[64px] text-primary" data-weight="fill"
                    style="font-variation-settings: 'FILL' 1;">assured_workload</span>
                <!-- Using a generic icon to represent the corporate mark since specific logos aren't available -->
            </div>
        </section>
    </main>
    <!-- Footer -->
    <footer
        class="bg-surface-container-lowest dark:bg-tertiary full-width border-t border-outline-variant/50 dark:border-outline/30 flat">
        <div
            class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-section-gap flex flex-col md:flex-row justify-between items-center gap-base">
            <div
                class="flex items-center gap-2 font-display-lg-mobile text-headline-md font-bold text-primary dark:text-primary-fixed mb-8 md:mb-0">
                <span class="material-symbols-outlined text-[24px] text-secondary-container" data-weight="fill"
                    style="font-variation-settings: 'FILL' 1;">analytics</span>
                <span>Koç Ai</span>
            </div>
            <nav class="flex flex-wrap justify-center gap-x-8 gap-y-4 mb-8 md:mb-0">
                <a class="text-on-surface-variant dark:text-on-tertiary-fixed-variant hover:text-primary dark:hover:text-primary-fixed underline decoration-1 underline-offset-4 opacity-80 hover:opacity-100 transition-opacity text-body-md font-body-md"
                    href="#">Gizlilik Politikası</a>
                <a class="text-on-surface-variant dark:text-on-tertiary-fixed-variant hover:text-primary dark:hover:text-primary-fixed underline decoration-1 underline-offset-4 opacity-80 hover:opacity-100 transition-opacity text-body-md font-body-md"
                    href="#">Kullanım Koşulları</a>
                <a class="text-on-surface-variant dark:text-on-tertiary-fixed-variant hover:text-primary dark:hover:text-primary-fixed underline decoration-1 underline-offset-4 opacity-80 hover:opacity-100 transition-opacity text-body-md font-body-md"
                    href="#">KVKK Aydınlatma Metni</a>
                <a class="text-on-surface-variant dark:text-on-tertiary-fixed-variant hover:text-primary dark:hover:text-primary-fixed underline decoration-1 underline-offset-4 opacity-80 hover:opacity-100 transition-opacity text-body-md font-body-md"
                    href="#">Çerez Tercihleri</a>
            </nav>
            <p class="text-on-surface dark:text-on-tertiary-fixed text-body-md font-body-md text-center md:text-right">
                © 2024 Koç Ai. Tüm Hakları Saklıdır. Koç Topluluğu Kuruluşudur.
            </p>
        </div>
    </footer>
</body>

</html>

dashboard

<!DOCTYPE html>

<html lang="tr">

<head>
    <meta charset="utf-8" />
    <meta content="width=device-width, initial-scale=1.0" name="viewport" />
    <title>Koç Ai - Finansal Geleceğinizi Şekillendirin</title>
    <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
    <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap"
        rel="stylesheet" />
    <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&amp;family=Plus+Jakarta+Sans:wght@600;700&amp;display=swap"
        rel="stylesheet" />
    <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap"
        rel="stylesheet" />
    <script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "on-surface": "#1a1c1a",
                        "outline-variant": "#c4c6d2",
                        "secondary-container": "#fed65b",
                        "on-secondary-fixed": "#241a00",
                        "inverse-primary": "#aec6ff",
                        "on-background": "#1a1c1a",
                        "secondary": "#735c00",
                        "inverse-on-surface": "#f1f1ee",
                        "surface-bright": "#faf9f6",
                        "on-tertiary": "#ffffff",
                        "tertiary-fixed": "#e5e2e1",
                        "error": "#ba1a1a",
                        "on-secondary": "#ffffff",
                        "secondary-fixed-dim": "#e9c349",
                        "primary-container": "#002f6c",
                        "secondary-fixed": "#ffe088",
                        "on-primary-fixed": "#001a42",
                        "on-error": "#ffffff",
                        "surface-tint": "#3c5d9c",
                        "primary": "#001b44",
                        "on-tertiary-fixed": "#1c1b1b",
                        "tertiary-fixed-dim": "#c8c6c5",
                        "inverse-surface": "#2f312f",
                        "outline": "#747781",
                        "surface-container-low": "#f4f3f1",
                        "surface-container-high": "#e9e8e5",
                        "on-secondary-fixed-variant": "#574500",
                        "on-error-container": "#93000a",
                        "on-primary-fixed-variant": "#224583",
                        "on-secondary-container": "#745c00",
                        "surface-container-highest": "#e3e2e0",
                        "primary-fixed-dim": "#aec6ff",
                        "on-tertiary-container": "#9b9998",
                        "on-surface-variant": "#434750",
                        "surface-dim": "#dbdad7",
                        "surface-variant": "#e3e2e0",
                        "tertiary-container": "#313131",
                        "tertiary": "#1c1c1c",
                        "on-tertiary-fixed-variant": "#474746",
                        "primary-fixed": "#d8e2ff",
                        "surface-container": "#efeeeb",
                        "surface": "#faf9f6",
                        "on-primary": "#ffffff",
                        "on-primary-container": "#7999dc",
                        "surface-container-lowest": "#ffffff",
                        "error-container": "#ffdad6",
                        "background": "#faf9f6"
                    },
                    "borderRadius": {
                        "DEFAULT": "0.25rem",
                        "lg": "0.5rem",
                        "xl": "0.75rem",
                        "full": "9999px"
                    },
                    "spacing": {
                        "section-gap": "120px",
                        "margin-mobile": "16px",
                        "container-max": "1280px",
                        "base": "8px",
                        "gutter": "24px",
                        "margin-desktop": "64px"
                    },
                    "fontFamily": {
                        "display-lg": ["Plus Jakarta Sans"],
                        "display-lg-mobile": ["Plus Jakarta Sans"],
                        "body-md": ["Inter"],
                        "headline-md": ["Plus Jakarta Sans"],
                        "label-sm": ["Inter"],
                        "headline-xl": ["Plus Jakarta Sans"],
                        "body-lg": ["Inter"]
                    },
                    "fontSize": {
                        "display-lg": ["64px", { "lineHeight": "1.1", "letterSpacing": "-0.02em", "fontWeight": "700" }],
                        "display-lg-mobile": ["40px", { "lineHeight": "1.2", "fontWeight": "700" }],
                        "body-md": ["16px", { "lineHeight": "1.6", "fontWeight": "400" }],
                        "headline-md": ["24px", { "lineHeight": "1.3", "fontWeight": "600" }],
                        "label-sm": ["12px", { "lineHeight": "1", "letterSpacing": "0.05em", "fontWeight": "600" }],
                        "headline-xl": ["40px", { "lineHeight": "1.2", "fontWeight": "600" }],
                        "body-lg": ["18px", { "lineHeight": "1.6", "fontWeight": "400" }]
                    }
                }
            }
        }
    </script>
    <style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
    </style>
</head>

<body
    class="bg-background text-on-background font-body-md antialiased selection:bg-primary-container selection:text-on-primary-container">
    <!-- TopAppBar -->
    <header
        class="bg-surface/80 dark:bg-primary/80 backdrop-blur-md docked full-width top-0 sticky z-50 border-b border-outline-variant/30 dark:border-outline/20 flat no shadows">
        <div
            class="flex justify-between items-center max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-4">
            <a class="font-display-lg-mobile text-headline-md font-bold text-primary dark:text-primary-fixed flex items-center gap-2"
                href="#">
                <span class="material-symbols-outlined text-[32px] text-secondary-container" data-weight="fill"
                    style="font-variation-settings: 'FILL' 1;">analytics</span>
                Koç Ai
            </a>
            <nav class="hidden md:flex items-center gap-8">
                <a class="text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-primary-fixed transition-colors text-body-md font-body-md"
                    href="#">Features</a>
                <a class="text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-primary-fixed transition-colors text-body-md font-body-md"
                    href="#">Solutions</a>
                <a class="text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-primary-fixed transition-colors text-body-md font-body-md"
                    href="#">About</a>
            </nav>
            <div class="flex items-center gap-4">
                <button
                    class="hidden md:block text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-primary-fixed transition-colors text-body-md font-body-md font-semibold">
                    Log in
                </button>
                <button
                    class="bg-primary text-on-primary hover:bg-surface-container-high dark:hover:bg-primary-container rounded-full transition-all scale-95 duration-200 ease-in-out px-6 py-2.5 text-body-md font-body-md font-semibold">
                    Get Started
                </button>
            </div>
        </div>
    </header>
    <main>
        <!-- Hero Section -->
        <section
            class="pt-24 pb-section-gap px-margin-mobile md:px-margin-desktop text-center max-w-container-max mx-auto flex flex-col items-center">
            <!-- Social Proof Badge -->
            <div
                class="flex items-center justify-center gap-3 bg-surface-container-low border border-outline-variant/30 rounded-full py-1.5 px-4 mb-8">
                <div class="flex -space-x-2">
                    <img alt="User avatar" class="w-8 h-8 rounded-full border-2 border-surface-container-low"
                        data-alt="A small circular portrait of a professional individual used as an avatar, smiling slightly, set against a neutral background."
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDNriZbw5QSON08Kk7qenvByZRHo8u2djARhXHaMDuQMlqxygKrRmwIAqWktFMVYV6mwmhfCfwka41ZRreoQ5dIWyOOiLq2e8ObvbyTqMzn-FJzAotlnOl9B-zJgZz4GiRu6XoO4_Z2Sev_YJj2t5h4uqhhmlAkhhvmiIoqVnxLBveLwEA3EKFBfOJ2j3YpkDXJthRcAy_7UBJlkfwSWohfm7y3hFTotfOM1SyboiceW2wtZ-sHgyxRXLuYkkjX83v7TnY9vqEY1bw" />
                    <img alt="User avatar" class="w-8 h-8 rounded-full border-2 border-surface-container-low"
                        data-alt="A small circular portrait of a smiling woman used as an avatar, set against a bright, modern background."
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuAatVYLWvDrJUN1kk7noW_748582j7jP_FvL9-MYew0ioys2FHBcf7aShD7jLn-AWfXCnCUAxO9pS1UsqjLNdTZCw0JNLXGsr2AXGIRfgNqQzRyaDmTj3GoDyo3RkKTtFM7rQixF1gmQP1BeK7aQSefZ1WZ0HF9botbapGyh_DJUqhr2J7PYD6GRsc3bT-_-BiVoTx5J76-krtMyRdqdNsKhxhd2KuWRicPpQc-v4Z5JJb58ER4IajiRpuQkgaTXg1vyA1cYp4uGdo" />
                    <img alt="User avatar" class="w-8 h-8 rounded-full border-2 border-surface-container-low"
                        data-alt="A small circular portrait of a person wearing glasses used as an avatar, conveying a professional demeanor."
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuATfT09vmXp3ZJH_zKXnTs1u-TYgJmu3sV1I4ih77iXyk1WIIWeWX_49Y5-I1CBC74oZDIS0pYLUqgqOzM6Vpnooz_b1R4rnp60BVmhUS_pBB5yIvSipTlPxAy-uHsCQ2To5JZIPaLZVFr-p_Q-2sk_b0UtK_Wy4G6v5_rHnlytjkEkxzSAfUiZLWqJkZEB8WU19Lu3U1_6AxwyDuyIRN3pGh0Os8FqoCK57yRiZkbLj7_PVPCcyX9KauROXTrolbwDM3dPrlPj9EM" />
                </div>
                <div class="flex items-center gap-1 text-secondary-container">
                    <span class="material-symbols-outlined text-[16px]"
                        style="font-variation-settings: 'FILL' 1;">star</span>
                    <span class="material-symbols-outlined text-[16px]"
                        style="font-variation-settings: 'FILL' 1;">star</span>
                    <span class="material-symbols-outlined text-[16px]"
                        style="font-variation-settings: 'FILL' 1;">star</span>
                    <span class="material-symbols-outlined text-[16px]"
                        style="font-variation-settings: 'FILL' 1;">star</span>
                    <span class="material-symbols-outlined text-[16px]"
                        style="font-variation-settings: 'FILL' 1;">star_half</span>
                </div>
                <span
                    class="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">4.5+
                    Puan / 10.000+ Kullanıcı</span>
            </div>
            <!-- Headline & Sub -->
            <h1 class="font-display-lg text-display-lg-mobile md:text-display-lg text-primary max-w-4xl mx-auto mb-6">
                Finansal Geleceğinizi Yapay Zeka ile Şekillendirin
            </h1>
            <p class="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto mb-10">
                Koç Ai ile veriye dayalı, güvenli ve akıllı yatırım kararları alın. Geleceğinizi bugünden planlayın.
            </p>
            <!-- CTA -->
            <button
                class="bg-primary text-on-primary rounded-full px-8 py-4 flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-md mb-20 text-body-lg font-semibold">
                Hemen Başlayın
                <span class="material-symbols-outlined">arrow_forward</span>
            </button>
            <!-- Device Mockup Image -->
            <div class="relative w-full max-w-3xl mx-auto flex justify-center">
                <!-- Soft background glow behind phone -->
                <div
                    class="absolute inset-0 bg-secondary-container/10 blur-[100px] rounded-full w-3/4 h-3/4 left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-0">
                </div>
                <img alt="Koç Ai Mobile App Mockup"
                    class="relative z-10 w-full h-auto object-cover rounded-[40px] shadow-2xl border-4 border-surface"
                    data-alt="A high-quality, close-up photograph of a human hand holding a modern smartphone. The smartphone screen displays a sleek, dark-mode financial dashboard application with vibrant yellow accents, charts, and financial data. The background is a very clean, warm off-white minimalist studio setting, highlighting the device and its digital interface."
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAjUaAoqnh9CvvwdTsfA98bG6uDxoAiknseqrrOsuJtofcMeX6m6om_Z3GPyn2zGRiw1u75CE7UVN75td5CxqfSl5NfN6wkmiiicKWP3OG-PjIhY3J6NjPKYZQPL5hvA1MVArSuaaUYKoDwNQM2fGIK2zA-RycA3jGxRdnEfjRtd40BDRqzTiF0nWegFb72Ufjb_dZSl2r1IZgbtPsRrUEEQOoJfj05tCwc16TQWXhZjUxLfcS8WVSu8qrs6LhUpHFZBPf3hxklq3Q" />
            </div>
        </section>
        <!-- Feature Grid (Bento Style) -->
        <section
            class="py-section-gap px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto bg-surface-container-low rounded-[40px]">
            <div class="text-center mb-16">
                <h2 class="font-headline-xl text-headline-xl text-primary mb-4">Neden Koç Ai?</h2>
                <p class="text-on-surface-variant text-body-lg max-w-2xl mx-auto">Güçlü algoritmalar ve Koç Topluluğu
                    güvencesiyle finansal kararlarınızı optimize edin.</p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-gutter">
                <!-- Feature 1 -->
                <div
                    class="bg-surface rounded-[24px] p-8 shadow-sm border border-outline-variant/20 hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div
                        class="absolute -right-6 -top-6 w-32 h-32 bg-primary-container/5 rounded-full group-hover:scale-110 transition-transform duration-500">
                    </div>
                    <div
                        class="w-14 h-14 bg-primary-container text-on-primary-container rounded-xl flex items-center justify-center mb-6 relative z-10">
                        <span class="material-symbols-outlined text-[28px]">query_stats</span>
                    </div>
                    <h3 class="font-headline-md text-headline-md text-primary mb-3 relative z-10">Akıllı Analiz</h3>
                    <p class="text-on-surface-variant text-body-md relative z-10">
                        Makine öğrenimi modellerimiz, piyasa trendlerini gerçek zamanlı olarak analiz eder ve size en
                        uygun yatırım stratejilerini sunar. Karmaşık verileri anlaşılır içgörülere dönüştürürüz.
                    </p>
                </div>
                <!-- Feature 2 -->
                <div
                    class="bg-surface rounded-[24px] p-8 shadow-sm border border-outline-variant/20 hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div
                        class="absolute -right-6 -top-6 w-32 h-32 bg-secondary-container/10 rounded-full group-hover:scale-110 transition-transform duration-500">
                    </div>
                    <div
                        class="w-14 h-14 bg-secondary-container text-on-secondary-container rounded-xl flex items-center justify-center mb-6 relative z-10">
                        <span class="material-symbols-outlined text-[28px]">security</span>
                    </div>
                    <h3 class="font-headline-md text-headline-md text-primary mb-3 relative z-10">Güvenli Altyapı</h3>
                    <p class="text-on-surface-variant text-body-md relative z-10">
                        Verileriniz ve varlıklarınız, bankacılık standartlarında şifreleme ve gelişmiş güvenlik
                        protokolleri ile korunur. Koç Topluluğu güvencesiyle işlemlerinizi huzurla gerçekleştirin.
                    </p>
                </div>
                <!-- Feature 3 -->
                <div
                    class="bg-surface rounded-[24px] p-8 shadow-sm border border-outline-variant/20 hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div
                        class="absolute -right-6 -top-6 w-32 h-32 bg-tertiary-container/5 rounded-full group-hover:scale-110 transition-transform duration-500">
                    </div>
                    <div
                        class="w-14 h-14 bg-surface-container-highest text-on-surface rounded-xl flex items-center justify-center mb-6 relative z-10">
                        <span class="material-symbols-outlined text-[28px]">support_agent</span>
                    </div>
                    <h3 class="font-headline-md text-headline-md text-primary mb-3 relative z-10">7/24 Destek</h3>
                    <p class="text-on-surface-variant text-body-md relative z-10">
                        Uzman finansal danışmanlarımız ve yapay zeka asistanımız, ihtiyaç duyduğunuz her an, günün her
                        saati size destek olmak için yanınızda.
                    </p>
                </div>
            </div>
        </section>
        <!-- Trust Section -->
        <section
            class="py-24 px-margin-mobile md:px-margin-desktop flex flex-col items-center justify-center text-center">
            <p class="text-label-sm font-label-sm text-outline uppercase tracking-[0.1em] mb-6">Güvenin Adresi</p>
            <h2 class="font-headline-xl text-headline-xl text-primary mb-10">Bir Koç Topluluğu Kuruluşudur</h2>
            <div
                class="flex items-center justify-center gap-12 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                <span class="material-symbols-outlined text-[64px] text-primary" data-weight="fill"
                    style="font-variation-settings: 'FILL' 1;">assured_workload</span>
                <!-- Using a generic icon to represent the corporate mark since specific logos aren't available -->
            </div>
        </section>
    </main>
    <!-- Footer -->
    <footer
        class="bg-surface-container-lowest dark:bg-tertiary full-width border-t border-outline-variant/50 dark:border-outline/30 flat">
        <div
            class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-section-gap flex flex-col md:flex-row justify-between items-center gap-base">
            <div
                class="flex items-center gap-2 font-display-lg-mobile text-headline-md font-bold text-primary dark:text-primary-fixed mb-8 md:mb-0">
                <span class="material-symbols-outlined text-[24px] text-secondary-container" data-weight="fill"
                    style="font-variation-settings: 'FILL' 1;">analytics</span>
                <span>Koç Ai</span>
            </div>
            <nav class="flex flex-wrap justify-center gap-x-8 gap-y-4 mb-8 md:mb-0">
                <a class="text-on-surface-variant dark:text-on-tertiary-fixed-variant hover:text-primary dark:hover:text-primary-fixed underline decoration-1 underline-offset-4 opacity-80 hover:opacity-100 transition-opacity text-body-md font-body-md"
                    href="#">Gizlilik Politikası</a>
                <a class="text-on-surface-variant dark:text-on-tertiary-fixed-variant hover:text-primary dark:hover:text-primary-fixed underline decoration-1 underline-offset-4 opacity-80 hover:opacity-100 transition-opacity text-body-md font-body-md"
                    href="#">Kullanım Koşulları</a>
                <a class="text-on-surface-variant dark:text-on-tertiary-fixed-variant hover:text-primary dark:hover:text-primary-fixed underline decoration-1 underline-offset-4 opacity-80 hover:opacity-100 transition-opacity text-body-md font-body-md"
                    href="#">KVKK Aydınlatma Metni</a>
                <a class="text-on-surface-variant dark:text-on-tertiary-fixed-variant hover:text-primary dark:hover:text-primary-fixed underline decoration-1 underline-offset-4 opacity-80 hover:opacity-100 transition-opacity text-body-md font-body-md"
                    href="#">Çerez Tercihleri</a>
            </nav>
            <p class="text-on-surface dark:text-on-tertiary-fixed text-body-md font-body-md text-center md:text-right">
                © 2024 Koç Ai. Tüm Hakları Saklıdır. Koç Topluluğu Kuruluşudur.
            </p>
        </div>
    </footer>
</body>

</html>

design sistemi
---
name: Sovereign Intelligence
colors:
surface: '#faf9f6'
surface-dim: '#dbdad7'
surface-bright: '#faf9f6'
surface-container-lowest: '#ffffff'
surface-container-low: '#f4f3f1'
surface-container: '#efeeeb'
surface-container-high: '#e9e8e5'
surface-container-highest: '#e3e2e0'
on-surface: '#1a1c1a'
on-surface-variant: '#434750'
inverse-surface: '#2f312f'
inverse-on-surface: '#f1f1ee'
outline: '#747781'
outline-variant: '#c4c6d2'
surface-tint: '#3c5d9c'
primary: '#001b44'
on-primary: '#ffffff'
primary-container: '#002f6c'
on-primary-container: '#7999dc'
inverse-primary: '#aec6ff'
secondary: '#735c00'
on-secondary: '#ffffff'
secondary-container: '#fed65b'
on-secondary-container: '#745c00'
tertiary: '#1c1c1c'
on-tertiary: '#ffffff'
tertiary-container: '#313131'
on-tertiary-container: '#9b9998'
error: '#ba1a1a'
on-error: '#ffffff'
error-container: '#ffdad6'
on-error-container: '#93000a'
primary-fixed: '#d8e2ff'
primary-fixed-dim: '#aec6ff'
on-primary-fixed: '#001a42'
on-primary-fixed-variant: '#224583'
secondary-fixed: '#ffe088'
secondary-fixed-dim: '#e9c349'
on-secondary-fixed: '#241a00'
on-secondary-fixed-variant: '#574500'
tertiary-fixed: '#e5e2e1'
tertiary-fixed-dim: '#c8c6c5'
on-tertiary-fixed: '#1c1b1b'
on-tertiary-fixed-variant: '#474746'
background: '#faf9f6'
on-background: '#1a1c1a'
surface-variant: '#e3e2e0'
typography:
display-lg:
fontFamily: Plus Jakarta Sans
fontSize: 64px
fontWeight: '700'
lineHeight: '1.1'
letterSpacing: -0.02em
display-lg-mobile:
fontFamily: Plus Jakarta Sans
fontSize: 40px
fontWeight: '700'
lineHeight: '1.2'
headline-xl:
fontFamily: Plus Jakarta Sans
fontSize: 40px
fontWeight: '600'
lineHeight: '1.2'
headline-md:
fontFamily: Plus Jakarta Sans
fontSize: 24px
fontWeight: '600'
lineHeight: '1.3'
body-lg:
fontFamily: Inter
fontSize: 18px
fontWeight: '400'
lineHeight: '1.6'
body-md:
fontFamily: Inter
fontSize: 16px
fontWeight: '400'
lineHeight: '1.6'
label-sm:
fontFamily: Inter
fontSize: 12px
fontWeight: '600'
lineHeight: '1'
letterSpacing: 0.05em
rounded:
sm: 0.25rem
DEFAULT: 0.5rem
md: 0.75rem
lg: 1rem
xl: 1.5rem
full: 9999px
spacing:
base: 8px
container-max: 1280px
gutter: 24px
margin-mobile: 16px
margin-desktop: 64px
section-gap: 120px
---

## Brand & Style

This design system is built upon the pillars of institutional trust and forward-thinking financial intelligence. It
strikes a balance between the heritage of an established financial powerhouse and the precision of cutting-edge AI. The
aesthetic is **Corporate Modern** with a lean toward **Minimalism**, emphasizing clarity and prestige.

The UI avoids decorative clutter, opting instead for intentional whitespace that allows complex financial data to
breathe. The emotional response is one of calm confidence; it is designed to feel like a private wealth management
office—exclusive, quiet, and highly capable. Visual storytelling utilizes high-resolution editorial photography
contrasted with ethereal, abstract glass-like AI artifacts to represent the "brain" behind the data.

## Colors

The palette is rooted in the "Deep Navy" of the Koç heritage, serving as the primary anchor for navigation, headers, and
primary actions. This is paired with a "Professional Gold" used sparingly as a high-value accent for highlighting
insights, premium features, and key CTAs.

The background departs from clinical white, utilizing a "Warm Cream" (Off-white) to reduce eye strain and evoke a
sophisticated, paper-like quality found in premium financial reports. Text contrast is strictly maintained using a
"Near-Black" for body copy to ensure maximum legibility against the cream backdrop.

## Typography

This design system utilizes a dual-font strategy to differentiate between brand presence and data utility. **Plus
Jakarta Sans** is the primary display face, chosen for its elegant curves and modern geometric construction, perfect for
impactful headings that feel welcoming yet authoritative.

**Inter** handles all functional roles, including body text, data tables, and interface labels. Its high x-height and
neutral character ensure that financial figures and AI-generated insights remain legible even at smaller sizes. Tracking
is tightened slightly for large headlines to maintain a "tight" professional look and opened for small labels to improve
scannability.

## Layout & Spacing

The layout follows a **Fixed Grid** philosophy for desktop screens to maintain a sense of structured stability,
centering content within a 1280px maximum container. A 12-column system is used with generous 24px gutters, allowing for
diverse content modules ranging from full-width hero sections to three-column data dashboards.

A generous "Section Gap" of 120px is used on marketing and landing pages to enforce the minimalist aesthetic and prevent
information density from overwhelming the user. On mobile, margins shrink to 16px, and the grid collapses to a single
column, with vertical spacing prioritized to maintain the "airy" feel of the desktop experience.

## Elevation & Depth

Hierarchy is established through **Ambient Shadows** and **Tonal Layering**. Surfaces are never "flat" but rather exist
in a tiered space. The base layer is the Warm Cream background. Secondary containers (like cards or modules) sit on a
pure white surface with a very soft, diffused shadow (15% opacity Navy tint) to suggest they are lifted slightly.

This design system avoids heavy borders, instead using subtle 1px "Ghost Outlines" in a light grey-gold tint to define
boundaries without adding visual weight. AI-driven elements may use a subtle **Glassmorphism** effect—a frosted blur—to
indicate they are "dynamic" or "floating" over the static financial data.

## Shapes

The shape language is consistently **Rounded**, using a 0.5rem (8px) base radius for standard components like buttons
and inputs. Larger containers, such as feature cards or hero images, utilize a `rounded-xl` (24px) radius to soften the
professional tone and make the platform feel more accessible and modern.

Icons should follow a medium-stroke weight (2px) with rounded caps and joins, mirroring the curvature of the UI
components. Interactive elements like "Get Started" buttons may occasionally use a pill-shape to draw maximum attention
through shape contrast.