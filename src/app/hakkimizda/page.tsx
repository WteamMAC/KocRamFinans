"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg 
    className={className} 
    fill="currentColor" 
    viewBox="0 0 24 24" 
    aria-hidden="true"
  >
    <path 
      fillRule="evenodd" 
      d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" 
      clipRule="evenodd" 
    />
  </svg>
);

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

export default function AboutPage() {
  return (
    <div className="bg-background text-on-surface font-sans overflow-x-hidden min-h-screen">
      <Navbar />

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
                    className="relative grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-8 group"
                    initial={{ opacity: 0, x: step.side === "left" ? -50 : 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <div className={`text-center ${step.side === "left" ? "md:text-right" : "md:text-left md:order-3"}`}>
                      <h3 className={`text-2xl font-heading font-bold mb-2 ${step.color === 'bg-primary' ? 'text-primary' : 'text-tertiary'}`}>{step.title}</h3>
                      <p className="text-on-surface-variant max-w-md mx-auto md:mx-0 ${step.side === 'left' ? 'md:ml-auto' : ''}">{step.description}</p>
                    </div>
                    
                    <div className={`md:order-2 w-12 h-12 ${step.color} rounded-full flex items-center justify-center ${step.textColor} z-10 mx-auto shadow-lg ring-8 ring-background group-hover:scale-110 transition-transform duration-300`}>
                      <span className="material-symbols-outlined">{step.icon}</span>
                    </div>
                    
                    <div className={`hidden md:block ${step.side === "left" ? "md:order-3" : "md:order-1"}`}></div>
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
                  className={`bg-card p-10 rounded-2xl border border-border/50 shadow-md hover:border-${value.color} hover:-translate-y-2 transition-all duration-300`}
                >
                  <div className={`w-16 h-16 ${value.color === 'primary' ? 'bg-primary/10 text-primary' : 'bg-tertiary/10 text-tertiary'} rounded-xl flex items-center justify-center mb-8`}>
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
          <div className="max-w-[1200px] mx-auto px-6 md:px-16">
            <motion.div 
              className="text-center mb-20"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <span className="inline-block px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4 uppercase tracking-wider">Ekibimiz</span>
              <h2 className="text-3xl md:text-5xl font-heading font-bold mb-4 text-on-surface">Projeyi Hazırlayanlar</h2>
              <p className="text-on-surface-variant max-w-2xl mx-auto font-medium">Koç Ram Finans platformunu tasarlayan, geliştiren ve hayata geçiren kurucu ekibimizle tanışın.</p>
            </motion.div>
            
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              {/* Murat Efe Şahin */}
              <motion.div 
                variants={fadeInUp}
                className="bg-card border border-border/20 rounded-[32px] p-8 shadow-ambient-low hover:shadow-ambient-medium hover:border-primary/20 transition-all duration-500 flex flex-col items-center text-center group relative overflow-hidden"
              >
                <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-primary to-accent"></div>
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <img 
                    src="https://media.licdn.com/dms/image/v2/D4D03AQHE67rgZWW2AA/profile-displayphoto-shrink_400_400/B4DZZzCb1THIAg-/0/1745686740792?e=1780531200&v=beta&t=8YpUh_xd7iSimwrkuK0Ew20eVRMoa0tasoRIzrOF6_0" 
                    alt="Murat Efe Şahin" 
                    className="w-32 h-32 rounded-full object-cover border-4 border-card shadow-ambient-medium group-hover:scale-105 transition-transform duration-500 relative z-10 bg-muted"
                  />
                </div>
                <h3 className="text-2xl font-heading font-bold text-on-surface mb-2 group-hover:text-primary transition-colors">
                  Murat Efe Şahin
                </h3>
                <p className="text-xs font-black text-on-surface-variant uppercase tracking-widest mb-4">
                  Kurucu & Kıdemli Finansal Yazılım Mühendisi
                </p>
                <p className="text-sm text-on-surface-variant font-medium mb-8 leading-relaxed max-w-[240px]">
                  Bütçe analizi, algoritma geliştirme ve sistem mimarisi üzerinde uzmanlaşmış yazılım mühendisi.
                </p>
                <a 
                  href="https://www.linkedin.com/in/muratefesahin/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-auto inline-flex items-center justify-center gap-2 h-11 px-6 rounded-2xl bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold text-xs uppercase tracking-widest transition-all duration-300 shadow-md group-hover:scale-[1.02] active:scale-95 cursor-pointer"
                >
                  <LinkedinIcon className="h-4 w-4" />
                  <span>LinkedIn'de Gör</span>
                </a>
              </motion.div>

              {/* Cemal Kılıç */}
              <motion.div 
                variants={fadeInUp}
                className="bg-card border border-border/20 rounded-[32px] p-8 shadow-ambient-low hover:shadow-ambient-medium hover:border-primary/20 transition-all duration-500 flex flex-col items-center text-center group relative overflow-hidden"
              >
                <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-accent to-tertiary"></div>
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-accent/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <img 
                    src="https://media.licdn.com/dms/image/v2/D4D03AQHMTwrlUGIpyw/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1732267621110?e=1780531200&v=beta&t=ukMiK1QkRKW1zeA49IWqCoejzNhqZGRokTIjfuRteeM" 
                    alt="Cemal Kılıç" 
                    className="w-32 h-32 rounded-full object-cover border-4 border-card shadow-ambient-medium group-hover:scale-105 transition-transform duration-500 relative z-10 bg-muted"
                  />
                </div>
                <h3 className="text-2xl font-heading font-bold text-on-surface mb-2 group-hover:text-primary transition-colors">
                  Cemal Kılıç
                </h3>
                <p className="text-xs font-black text-on-surface-variant uppercase tracking-widest mb-4">
                  Kurucu & Yapay Zeka & Veri Mühendisi
                </p>
                <p className="text-sm text-on-surface-variant font-medium mb-8 leading-relaxed max-w-[240px]">
                  Büyük veri analizleri, makine öğrenimi modelleri ve yapay zeka entegrasyonu üzerine odaklanmış veri mühendisi.
                </p>
                <a 
                  href="https://www.linkedin.com/in/cemalklc/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-auto inline-flex items-center justify-center gap-2 h-11 px-6 rounded-2xl bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold text-xs uppercase tracking-widest transition-all duration-300 shadow-md group-hover:scale-[1.02] active:scale-95 cursor-pointer"
                >
                  <LinkedinIcon className="h-4 w-4" />
                  <span>LinkedIn'de Gör</span>
                </a>
              </motion.div>

              {/* Atakan Demirezen */}
              <motion.div 
                variants={fadeInUp}
                className="bg-card border border-border/20 rounded-[32px] p-8 shadow-ambient-low hover:shadow-ambient-medium hover:border-primary/20 transition-all duration-500 flex flex-col items-center text-center group relative overflow-hidden"
              >
                <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-tertiary to-primary"></div>
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-tertiary/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <img 
                    src="https://media.licdn.com/dms/image/v2/D4D35AQEOeBdTSJTo9g/profile-framedphoto-shrink_400_400/B4DZZzlOqQH4Ac-/0/1745695861681?e=1779642000&v=beta&t=CcrmqqGJhscZf4M_NoWxDHrtt6zXVBOOafECaOyOIlA" 
                    alt="Atakan Demirezen" 
                    className="w-32 h-32 rounded-full object-cover border-4 border-card shadow-ambient-medium group-hover:scale-105 transition-transform duration-500 relative z-10 bg-muted"
                  />
                </div>
                <h3 className="text-2xl font-heading font-bold text-on-surface mb-2 group-hover:text-primary transition-colors">
                  Atakan Demirezen
                </h3>
                <p className="text-xs font-black text-on-surface-variant uppercase tracking-widest mb-4">
                  Kurucu & Kıdemli Arayüz (UI/UX) Geliştirici
                </p>
                <p className="text-sm text-on-surface-variant font-medium mb-8 leading-relaxed max-w-[240px]">
                  Kullanıcı deneyimi, etkileşimli arayüz tasarımları ve modern web teknolojileri üzerinde uzmanlaşmış tasarımcı ve geliştirici.
                </p>
                <a 
                  href="https://www.linkedin.com/in/atakan-demirezence/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-auto inline-flex items-center justify-center gap-2 h-11 px-6 rounded-2xl bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold text-xs uppercase tracking-widest transition-all duration-300 shadow-md group-hover:scale-[1.02] active:scale-95 cursor-pointer"
                >
                  <LinkedinIcon className="h-4 w-4" />
                  <span>LinkedIn'de Gör</span>
                </a>
              </motion.div>
            </motion.div>
          </div>
        </section>


      </main>

      <Footer />
    </div>
  );
}
