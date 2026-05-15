'use client';

import { motion } from "framer-motion";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Home } from "lucide-react";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden"
      style={{ background: "#F8F2E3" }}
    >
      {/* Subtle background dots */}
      <div className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: "radial-gradient(circle, #D4851A 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Main layout */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 py-12">

        {/* Left: SVG Illustration */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="w-full md:w-[55%] flex-shrink-0"
        >
          <svg viewBox="0 0 580 420" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">

            {/* Sky Background */}
            <rect width="580" height="420" fill="#F8F2E3" rx="20"/>

            {/* Cloud 1 - big center-left */}
            <g opacity="0.85">
              <ellipse cx="185" cy="90" rx="95" ry="52" fill="white"/>
              <ellipse cx="240" cy="75" rx="75" ry="48" fill="white"/>
              <ellipse cx="130" cy="98" rx="65" ry="42" fill="white"/>
              <ellipse cx="195" cy="108" rx="85" ry="36" fill="white"/>
            </g>

            {/* Cloud dash lines (like reference) */}
            <rect x="80" y="58" width="32" height="6" rx="3" fill="#DBC2B0" opacity="0.6"/>
            <rect x="68" y="70" width="22" height="6" rx="3" fill="#DBC2B0" opacity="0.5"/>
            <rect x="295" y="48" width="28" height="6" rx="3" fill="#DBC2B0" opacity="0.5"/>
            <rect x="310" y="62" width="18" height="6" rx="3" fill="#DBC2B0" opacity="0.4"/>
            <rect x="290" y="76" width="36" height="6" rx="3" fill="#DBC2B0" opacity="0.4"/>

            {/* Cloud 2 - top right */}
            <g opacity="0.65">
              <ellipse cx="490" cy="65" rx="60" ry="30" fill="white"/>
              <ellipse cx="520" cy="55" rx="42" ry="25" fill="white"/>
              <ellipse cx="465" cy="72" rx="38" ry="22" fill="white"/>
            </g>

            {/* Water surface */}
            <path d="M0,295 Q80,278 160,290 Q240,302 320,285 Q400,268 480,282 Q540,292 580,278 L580,420 L0,420 Z"
              fill="#C49030"/>
            <path d="M0,308 Q90,290 180,305 Q270,320 350,302 Q430,284 510,298 Q550,306 580,296 L580,420 L0,420 Z"
              fill="#D4A843" opacity="0.8"/>
            <path d="M0,325 Q100,308 200,322 Q300,336 400,315 Q480,298 580,318 L580,420 L0,420 Z"
              fill="#E8BF55" opacity="0.5"/>

            {/* Underwater area (darker water bottom) */}
            <rect x="0" y="340" width="580" height="80" fill="#B88A30" opacity="0.4"/>

            {/* Seaweed left */}
            <path d="M50,420 Q45,395 52,375 Q59,355 50,335 Q43,318 52,302"
              stroke="#36684d" strokeWidth="7" fill="none" strokeLinecap="round" opacity="0.7"/>
            <path d="M72,420 Q80,398 72,378 Q64,358 74,340"
              stroke="#4a8b61" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.6"/>

            {/* Seaweed right */}
            <path d="M520,420 Q514,395 522,372 Q530,349 520,328 Q512,310 522,295"
              stroke="#36684d" strokeWidth="7" fill="none" strokeLinecap="round" opacity="0.7"/>
            <path d="M545,420 Q552,396 544,376 Q536,356 546,338"
              stroke="#4a8b61" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.6"/>

            {/* Underwater fish */}
            <ellipse cx="420" cy="355" rx="20" ry="10" fill="#8C5000" opacity="0.3"/>
            <polygon points="440,355 455,348 455,362" fill="#8C5000" opacity="0.3"/>
            <ellipse cx="100" cy="370" rx="16" ry="8" fill="#A06010" opacity="0.3"/>
            <polygon points="116,370 128,364 128,376" fill="#A06010" opacity="0.3"/>
            <ellipse cx="480" cy="380" rx="13" ry="6" fill="#EFE440" opacity="0.2"/>
            <polygon points="493,380 502,375 502,385" fill="#EFE440" opacity="0.2"/>
            <ellipse cx="160" cy="360" rx="11" ry="5" fill="#D4851A" opacity="0.25"/>
            <polygon points="171,360 179,356 179,364" fill="#D4851A" opacity="0.25"/>

            {/* Bubbles from hook */}
            <circle cx="338" cy="330" r="4" fill="none" stroke="white" strokeWidth="1.5" opacity="0.7"/>
            <circle cx="344" cy="318" r="3" fill="none" stroke="white" strokeWidth="1.5" opacity="0.6"/>
            <circle cx="335" cy="308" r="2" fill="none" stroke="white" strokeWidth="1" opacity="0.5"/>

            {/* Underwater rock/boulder */}
            <ellipse cx="130" cy="415" rx="45" ry="25" fill="#8C5000" opacity="0.25"/>
            <ellipse cx="460" cy="418" rx="35" ry="20" fill="#6A4010" opacity="0.2"/>

            {/* Island - green hills */}
            <ellipse cx="370" cy="289" rx="90" ry="38" fill="#36684d"/>
            <ellipse cx="385" cy="274" rx="65" ry="32" fill="#4a8b61"/>
            <ellipse cx="352" cy="280" rx="50" ry="28" fill="#36684d"/>
            <ellipse cx="405" cy="278" rx="42" ry="24" fill="#3d7a56"/>

            {/* Plants on island */}
            <rect x="358" y="252" width="6" height="30" fill="#2d5a3d" rx="3"/>
            <ellipse cx="361" cy="246" rx="14" ry="20" fill="#2d5a3d"/>
            <ellipse cx="354" cy="252" rx="9" ry="14" fill="#36684d"/>

            <rect x="385" y="258" width="5" height="22" fill="#2d5a3d" rx="2.5"/>
            <ellipse cx="388" cy="253" rx="11" ry="16" fill="#36684d"/>

            {/* Boat */}
            <path d="M148,280 L162,300 L290,300 L304,280 Z" fill="#8C5000"/>
            <rect x="158" y="273" width="138" height="10" rx="4" fill="#A86020"/>
            <rect x="153" y="268" width="148" height="8" rx="4" fill="#C07828"/>
            {/* Boat interior shadow */}
            <ellipse cx="228" cy="292" rx="55" ry="6" fill="#6A3000" opacity="0.3"/>

            {/* Fisherman legs */}
            <rect x="218" y="270" width="12" height="16" rx="3" fill="#2d2d2d"/>
            <rect x="230" y="270" width="12" height="16" rx="3" fill="#3d3d3d"/>
            {/* Feet */}
            <rect x="216" y="283" width="16" height="6" rx="3" fill="#1a1a1a"/>
            <rect x="228" y="283" width="16" height="6" rx="3" fill="#222"/>

            {/* Fisherman body */}
            <rect x="213" y="245" width="30" height="30" rx="6" fill="#444"/>
            {/* Jacket highlight */}
            <rect x="213" y="245" width="14" height="30" rx="6" fill="#3d3d3d"/>

            {/* Fisherman head */}
            <circle cx="228" cy="237" r="15" fill="#f0c898"/>
            {/* Face detail */}
            <circle cx="224" cy="238" r="1.5" fill="#8C5000" opacity="0.5"/>
            <circle cx="232" cy="238" r="1.5" fill="#8C5000" opacity="0.5"/>

            {/* Hat brim */}
            <rect x="213" y="224" width="32" height="7" rx="3.5" fill="#2d1600"/>
            {/* Hat top */}
            <rect x="218" y="210" width="22" height="16" rx="4" fill="#3d2000"/>

            {/* Right arm + fishing rod */}
            <path d="M241,253 Q258,242 272,235" stroke="#3d3d3d" strokeWidth="6" strokeLinecap="round" fill="none"/>
            {/* Fishing rod */}
            <line x1="272" y1="235" x2="330" y2="195" stroke="#8C5000" strokeWidth="3.5" strokeLinecap="round"/>
            {/* Rod tip */}
            <circle cx="330" cy="195" r="3" fill="#C07828"/>
            {/* Fishing line */}
            <line x1="330" y1="195" x2="338" y2="320" stroke="#888" strokeWidth="1.2" strokeDasharray="4,4" opacity="0.8"/>
            {/* Hook */}
            <circle cx="338" cy="323" r="4" fill="none" stroke="#C07828" strokeWidth="1.5"/>

            {/* "Oops" text bubble */}
            <rect x="305" y="220" width="48" height="24" rx="12" fill="white" opacity="0.9"/>
            <text x="329" y="236" textAnchor="middle" fontSize="11" fontWeight="700" fill="#8C5000">Oops!</text>
            {/* Bubble tail */}
            <polygon points="318,243 312,252 325,243" fill="white" opacity="0.9"/>

          </svg>
        </motion.div>

        {/* Right: Text Content */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
          className="flex flex-col items-start text-left"
        >
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="font-black leading-none mb-3"
            style={{
              fontSize: "clamp(80px, 12vw, 130px)",
              color: "#5a3100",
              textShadow: "0 4px 0 #C07828, 0 8px 20px rgba(140,80,0,0.2)",
            }}
          >
            404
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="text-2xl md:text-3xl font-bold mb-3"
            style={{ color: "#5a3100" }}
          >
            Sayfayı Balıkladık!
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="text-base md:text-lg mb-8 max-w-xs leading-relaxed"
            style={{ color: "#887364" }}
          >
            Aradığınız sayfa finansal derinliklerde kaybolmuş olabilir. Sizi güvenli sulara geri alalım.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
          >
            <Link
              href="/"
              className={cn(
                buttonVariants({ variant: "default" }),
                "h-12 px-8 font-bold rounded-full text-white flex items-center gap-2.5 text-base shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl active:scale-95"
              )}
              style={{
                background: "linear-gradient(135deg, #f18d02 0%, #8c5000 100%)",
                border: "none",
                boxShadow: "0 6px 20px rgba(140,80,0,0.35)",
              }}
            >
              <Home className="w-5 h-5" />
              Ana Menüye Dön
            </Link>
          </motion.div>

          {/* Decorative dots */}
          <div className="flex gap-2 mt-8 opacity-30">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="rounded-full"
                style={{
                  width: i === 2 ? 10 : 6,
                  height: i === 2 ? 10 : 6,
                  background: "#8C5000",
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
