"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const roadmapSteps = [
  {
    title: "Kuruluş ve İlk Adımlar",
    description: "Finans dünyasında dürüstlük ve şeffaflık vizyonuyla temellerimizi attık.",
    icon: "flag",
    color: "bg-primary",
    textColor: "text-on-primary",
    side: "left"
  },
  {
    title: "Dijital Dönüşüm",
    description: "Teknoloji ile finansı birleştirerek danışmanlık hizmetlerimizi her yerden erişilebilir kıldık.",
    icon: "trending_up",
    color: "bg-tertiary",
    textColor: "text-on-tertiary",
    side: "right"
  },
  {
    title: "Küresel Standartlar",
    description: "Uluslararası finansal stratejileri yerel uzmanlığımızla harmanladık.",
    icon: "public",
    color: "bg-primary",
    textColor: "text-on-primary",
    side: "left"
  },
  {
    title: "Gelecek Hedefleri",
    description: "Her bireyin finansal özgürlüğüne ulaştığı bir gelecek için çalışmaya devam ediyoruz.",
    icon: "diamond",
    color: "bg-tertiary",
    textColor: "text-on-tertiary",
    side: "right"
  }
];

const values = [
  {
    title: "Mutlak Şeffaflık",
    description: "Tüm işlemlerimizde ve raporlamalarımızda açık, dürüst ve net bir iletişim politikasını benimsiyoruz.",
    icon: "verified_user",
    color: "primary"
  },
  {
    title: "Sürekli Gelişim",
    description: "Finansal okuryazarlığı sadece bir hizmet değil, toplumsal bir gelişim aracı olarak görüyor ve öğretiyoruz.",
    icon: "school",
    color: "tertiary"
  },
  {
    title: "Stratejik Güç",
    description: "Piyasa dalgalanmalarına karşı dayanıklı ve uzun vadeli sürdürülebilir büyüme odaklı stratejiler üretiyoruz.",
    icon: "balance",
    color: "primary"
  }
];

const team = [
  {
    name: "Ahmet Koç",
    role: "Kurucu & CEO",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA-mT2x5FdrfxqfWxhEmKerWeTU6qIDo8AS-MHWCfirh4stbYNCghOCA_MoZcUDgMTa7qOTA3YGwoG8IuORS2sVlm_u-3ih8Vg8V3vznTiUbbDB3wEAv7wIbEUVuBFOaWHn_O56JbXq7JK2fe_PFR-6Yo-vi4Lshk3kjxh71e_R_Ngt5woB1ls8FMGya7NX5oe6pJhqXHwJO7xRU60_xlKI90fjukDq29Kp6H4Df5WaOyvK1XVqjaz-AA6nZr14vR7NDoDzwI4EDy9P"
  },
  {
    name: "Elif Demir",
    role: "Strateji Başkanı",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXu_gqKGpbO0zM6dqrqSQuISMv15COanen-wSu6o6ofbP21rVriLv_r2YDc2sKm9TKCTIrvzNLFVrpO81POogcRwUPUHLcd68TplkCTpsSSEdyk8ApsUrOHyZk7Qx7R7QJXVh5iB2sn510eUoIq31WCdZ3yxo5-I76poLAfTWV_PixP6eqNuO2VcPSYsBkiFRnpUbEOEoKsW_3eW-OVnLT_VwoZPiMbhlQAuJaGpL9LHAcri0KWC150kI2YuHdlO6BtyDDH0_DG-2z-B"
  },
  {
    name: "Can Özkan",
    role: "Operasyon Direktörü",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuACT8CM7EfuOK6oFfuDO60A_LqhkT23T6qkHxt2MeQxwKRRIVYzOUhcorz-UkMfcZTYV6uzaj95EMGfU3u1dqzBtzy4PkgaSEWkWFw6trx0beJMUbCcP6tDD0MnXtBIB-i7CqM713tScpFvrwNqwjwUIDpNP0CY0l1-emXq4D1Uf867E9jXL1D7I9UoM321hHKB8BwUzV5BimzLI-uL0zGO7MVEwKhkNwd82Y-_ue0Vh91XRDw0dg44t6pBfmtGyV7_eaE2771v-FPe"
  },
  {
    name: "Selin Ak",
    role: "Eğitim Koordinatörü",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuD6J9WOdkolp39EKYwaiXENqnfnivL2ny1jKptFwatHs6KuW6dX4VHJpDmmxTs1FQSIo6-HCG_TdUuwXediZy7xswPBAiI6cOGM8JPh-Vc6FtqUt_Wt0C7OnRT5Y0SIcVizjMmn3Rz_4fPfaoZ_5B808uD6nPXiOqXiGEkqQYS6y6Pf5d2J7-QneC4s64JqLO5vDm-ZsHkQxDRSt2M9Cxl-yY0CnYSfCQb8wZjFe-8gn-rGLeHJL7fkkf_CByhgZ4ZyVvNp6ZQvpfRj"
  }
];

export default function AboutPage() {
  return (
    <div className="bg-background text-on-surface font-sans overflow-x-hidden min-h-screen">
      {/* TopAppBar */}
      <header className="bg-surface/90 backdrop-blur-md sticky top-0 z-50 border-b border-outline-variant/30 shadow-sm">
        <div className="flex justify-between items-center w-full px-4 md:px-16 py-4 max-w-[1200px] mx-auto">
          <Link href="/" className="text-2xl font-heading font-bold text-primary">Koç Ram Finans</Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link className="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors duration-200" href="#">Hizmetler</Link>
            <Link className="text-sm font-semibold text-primary border-b-2 border-primary pb-1" href="/hakkimizda">Hakkımızda</Link>
            <Link className="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors duration-200" href="#">Başarı Hikayeleri</Link>
            <Link className="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors duration-200" href="#">Blog</Link>
          </nav>
          <div className="flex items-center gap-4">
            <button className="hidden lg:block text-sm font-semibold text-primary hover:opacity-80 transition-opacity">Giriş Yap</button>
            <button className="bg-primary-container text-on-primary px-6 py-2 rounded-lg text-sm font-semibold scale-95 transition-transform duration-150 hover:scale-100">Koçluğa Başla</button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative pt-24 pb-32 bg-surface-container-lowest overflow-hidden">
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <svg className="w-full h-full" fill="none" viewBox="0 0 1440 600" xmlns="http://www.w3.org/2000/svg">
              <motion.path
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 2, ease: "easeInOut" }}
                d="M-50 450C150 450 300 150 600 150C900 150 1100 450 1490 450"
                stroke="url(#paint0_linear)"
                strokeDasharray="12 12"
                strokeLinecap="round"
                strokeWidth="4"
              />
              <defs>
                <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear" x1="-50" x2="1490" y1="300" y2="300">
                  <stop stopColor="#8c5000" />
                  <stop offset="1" stopColor="#36684d" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="max-w-[1200px] mx-auto px-4 md:px-16 relative z-10 flex flex-col lg:flex-row items-center gap-12">
            <motion.div 
              className="max-w-3xl"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <span className="inline-block px-4 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant text-sm font-semibold mb-6 uppercase tracking-wider">Vizyonumuz & Değerlerimiz</span>
              <h1 className="text-5xl md:text-6xl font-heading font-bold text-on-surface mb-8 leading-tight">
                Finansal Başarıya Giden <br/>
                <span className="text-primary italic">Stratejik Yol Haritanız</span>
              </h1>
              <p className="text-lg md:text-xl text-on-surface-variant mb-10 max-w-2xl leading-relaxed">
                Koç Ram Finans olarak, karmaşık piyasa dinamiklerini şeffaf, güvenilir ve sürdürülebilir bir yolculuğa dönüştürüyoruz. Geleceğinizi bugünden birlikte tasarlıyoruz.
              </p>
            </motion.div>
            <motion.div 
              className="relative w-64 h-64 lg:w-96 lg:h-96"
              initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 1, type: "spring", bounce: 0.4 }}
            >
              <img 
                alt="Ram Mascot Guide" 
                className="w-full h-full object-contain drop-shadow-2xl" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCMRn-Qy7UIzg9opMIK3wPgVJnJhJzg-czsrp8cyk4Kf9gYH-Yf4RVjNLFWoUkiOSmUJf92uo-aG2AOgY4bhCE2XQ7WxwU6APXCv5Uuh8vPKPtmHM8XcfTJs1SELo9AX8TbOQanPoJcq8McJFvz-Rf7H-gbRtlkPz-srKw6nmBIKpXJ0rHnY1jnwHm4jbb8fpQRuag8i9OJNcGsCc4--quvPJqsBY19ktdzL26E68JDMABtswZrIgxnhK_TH42uOtwuV9c-YVn3Kz5i" 
              />
            </motion.div>
          </div>
        </section>

        {/* Roadmap Section */}
        <section className="py-24 bg-surface overflow-hidden">
          <div className="max-w-[1200px] mx-auto px-4 md:px-16">
            <motion.div 
              className="text-center mb-20"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4 text-on-surface">Yolculuğumuzun Kilometre Taşları</h2>
              <div className="w-24 h-1.5 bg-primary-container mx-auto rounded-full"></div>
            </motion.div>
            
            <div className="relative">
              {/* Vertical Line */}
              <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-1 bg-outline-variant/30 hidden md:block"></div>
              
              <div className="space-y-24">
                {roadmapSteps.map((step, index) => (
                  <motion.div 
                    key={index}
                    className={`relative flex flex-col md:flex-row items-center md:justify-between group`}
                    initial={{ opacity: 0, x: step.side === "left" ? -50 : 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <div className={`md:w-[45%] text-center ${step.side === "left" ? "md:text-right" : "md:text-left md:order-2"}`}>
                      <h3 className={`text-2xl font-heading font-bold mb-2 ${step.color === 'bg-primary' ? 'text-primary' : 'text-tertiary'}`}>{step.title}</h3>
                      <p className="text-on-surface-variant">{step.description}</p>
                    </div>
                    
                    <div className={`w-12 h-12 ${step.color} rounded-full flex items-center justify-center ${step.textColor} z-10 my-6 md:my-0 shadow-lg ring-8 ring-background group-hover:scale-110 transition-transform duration-300`}>
                      <span className="material-symbols-outlined">{step.icon}</span>
                    </div>
                    
                    <div className="md:w-[45%] hidden md:block"></div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Core Values Section */}
        <section className="py-24 bg-surface-container-low">
          <div className="max-w-[1200px] mx-auto px-4 md:px-16">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
              <motion.div 
                className="max-w-xl"
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                variants={fadeInUp}
              >
                <h2 className="text-3xl md:text-4xl font-heading font-bold text-on-surface mb-4">Temel Değerlerimiz</h2>
                <p className="text-on-surface-variant">Kurumsal kültürümüzü şekillendiren ve her kararımızda bize rehberlik eden vazgeçilmez prensiplerimiz.</p>
              </motion.div>
              <div className="flex items-center gap-2 text-primary font-semibold text-sm cursor-pointer group">
                <span>Güvenle İlerleyin</span>
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">east</span>
              </div>
            </div>
            
            <motion.div 
              className="grid md:grid-cols-3 gap-8"
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              {values.map((value, index) => (
                <motion.div 
                  key={index}
                  variants={fadeInUp}
                  className={`bg-white p-10 rounded-2xl border border-outline-variant/50 shadow-md hover:border-${value.color} hover:-translate-y-2 transition-all duration-300`}
                >
                  <div className={`w-16 h-16 ${value.color === 'primary' ? 'bg-primary-container/10 text-primary' : 'bg-tertiary-container/10 text-tertiary'} rounded-xl flex items-center justify-center mb-8`}>
                    <span className="material-symbols-outlined text-4xl">{value.icon}</span>
                  </div>
                  <h3 className="text-xl font-heading font-bold mb-4">{value.title}</h3>
                  <p className="text-on-surface-variant leading-relaxed">{value.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-24 bg-surface-container-lowest">
          <div className="max-w-[1200px] mx-auto px-4 md:px-16">
            <motion.div 
              className="text-center mb-20"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">Uzman Kadromuz</h2>
              <p className="text-on-surface-variant max-w-2xl mx-auto">Yolculuğunuzda size eşlik edecek, alanında uzman liderlerimizle tanışın.</p>
            </motion.div>
            
            <motion.div 
              className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10"
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              {team.map((member, index) => (
                <motion.div 
                  key={index}
                  variants={fadeInUp}
                  className="group text-center"
                >
                  <div className="relative mb-6 mx-auto overflow-hidden rounded-2xl aspect-[4/5] max-w-[280px]">
                    <img 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                      alt={member.name} 
                      src={member.image} 
                    />
                    <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-primary cursor-pointer hover:bg-primary-container transition-colors shadow-lg">
                        <span className="material-symbols-outlined text-xl">share</span>
                      </div>
                    </div>
                  </div>
                  <h4 className="text-xl font-heading font-bold text-on-surface">{member.name}</h4>
                  <p className="text-sm font-semibold text-primary mt-1">{member.role}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-primary overflow-hidden relative">
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
              <motion.path 
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                transition={{ duration: 3 }}
                d="M0 50 Q 25 25, 50 50 T 100 50" 
                fill="none" 
                stroke="white" 
                strokeWidth="0.5" 
              />
            </svg>
          </div>
          <div className="max-w-[1200px] mx-auto px-4 md:px-16 text-center relative z-10">
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-on-primary mb-12">Finansal Geleceğinizi Uzmanlarla Şekillendirin</h2>
              <div className="flex flex-col sm:flex-row justify-center gap-6">
                <button className="bg-secondary-container text-on-secondary-container px-10 py-4 rounded-xl text-sm font-bold hover:brightness-110 transition-all shadow-xl hover:scale-105">Bize Ulaşın</button>
                <button className="border-2 border-on-primary text-on-primary px-10 py-4 rounded-xl text-sm font-bold hover:bg-on-primary hover:text-primary transition-all hover:scale-105">Sizi Arayalım</button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-secondary text-on-secondary">
        <div className="w-full px-4 md:px-16 py-16 flex flex-col md:flex-row justify-between items-center gap-12 max-w-[1200px] mx-auto border-t border-on-secondary/10">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="text-2xl font-heading font-bold">Koç Ram Finans</div>
            <p className="text-sm opacity-80 text-center md:text-left leading-relaxed">
              © 2024 Koç Ram Finansal Danışmanlık. <br/>
              Güvenilir finansal koçluk ve stratejik yönetim.
            </p>
          </div>
          <nav className="flex flex-wrap justify-center gap-8 md:gap-12">
            <Link className="text-sm font-medium opacity-80 hover:opacity-100 hover:text-secondary-container transition-all" href="#">Gizlilik</Link>
            <Link className="text-sm font-medium opacity-80 hover:opacity-100 hover:text-secondary-container transition-all" href="#">Şartlar</Link>
            <Link className="text-sm font-medium opacity-80 hover:opacity-100 hover:text-secondary-container transition-all" href="#">İletişim</Link>
          </nav>
          <div className="flex gap-4">
            {['facebook', 'twitter', 'linkedin'].map((social) => (
              <div key={social} className="w-10 h-10 rounded-full border border-on-secondary/30 flex items-center justify-center hover:bg-on-secondary hover:text-secondary transition-all cursor-pointer">
                <span className="material-symbols-outlined text-sm">share</span>
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
