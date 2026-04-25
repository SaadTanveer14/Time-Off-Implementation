"use client";

import { useEffect, useState } from "react";

const HOLD_MS = 1500;
const FADE_MS = 500;

export function PageLoader() {
  const [hiding, setHiding] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setHiding(true), HOLD_MS);
    const t2 = setTimeout(() => setGone(true), HOLD_MS + FADE_MS);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (gone) return null;

  const ease = "cubic-bezier(0.22, 1, 0.36, 1)";

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "20px",
        background: "#FAFAF7",
        animation: hiding
          ? `loaderOut ${FADE_MS}ms ease forwards`
          : undefined,
        pointerEvents: hiding ? "none" : "auto",
      }}
    >
      {/* ── Logo mark ── */}
      <svg
        width="80"
        height="80"
        viewBox="0 0 40 40"
        xmlns="http://www.w3.org/2000/svg"
        overflow="visible"
        style={{
          animation: `loaderMarkIn 420ms ${ease} both`,
          animationDelay: "0ms",
        }}
      >
        <defs>
          <linearGradient id="plGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#4C1D95" />
          </linearGradient>
          {/* clip each bar to its own rect so scaleX origin stays left */}
          <clipPath id="pl-spine"><rect x="11" y="11" width="4" height="20" /></clipPath>
          <clipPath id="pl-top">  <rect x="11" y="11" width="17" height="4" /></clipPath>
          <clipPath id="pl-mid">  <rect x="11" y="19.25" width="13" height="4" /></clipPath>
          <clipPath id="pl-bot">  <rect x="11" y="27.5" width="19" height="4" /></clipPath>
        </defs>

        {/* Background rounded square */}
        <rect x="0" y="0" width="40" height="40" rx="11" fill="url(#plGrad)" />

        {/* Spine — scaleY from top */}
        <g
          style={{
            transformOrigin: "11px 11px",
            animation: `loaderSpineSlide 320ms ${ease} both`,
            animationDelay: "240ms",
          }}
          clipPath="url(#pl-spine)"
        >
          <rect x="11" y="11" width="4" height="20" rx="1.75" fill="white" />
        </g>

        {/* Top bar — scaleX from left */}
        <g
          style={{
            transformOrigin: "11px 13px",
            animation: `loaderBarSlide 280ms ${ease} both`,
            animationDelay: "380ms",
          }}
          clipPath="url(#pl-top)"
        >
          <rect x="11" y="11" width="17" height="4" rx="1.75" fill="white" />
        </g>

        {/* Middle bar */}
        <g
          style={{
            transformOrigin: "11px 21.25px",
            animation: `loaderBarSlide 260ms ${ease} both`,
            animationDelay: "480ms",
          }}
          clipPath="url(#pl-mid)"
        >
          <rect x="11" y="19.25" width="13" height="4" rx="1.75" fill="white" />
        </g>

        {/* Bottom bar */}
        <g
          style={{
            transformOrigin: "11px 29.5px",
            animation: `loaderBarSlide 280ms ${ease} both`,
            animationDelay: "560ms",
          }}
          clipPath="url(#pl-bot)"
        >
          <rect x="11" y="27.5" width="19" height="4" rx="1.75" fill="white" />
        </g>

        {/* Amber dot — pop */}
        <circle
          cx="32"
          cy="13"
          r="2"
          fill="#F59E0B"
          style={{
            transformOrigin: "32px 13px",
            animation: `loaderDotPop 380ms ${ease} both`,
            animationDelay: "680ms",
          }}
        />
      </svg>

      {/* ── Wordmark ── */}
      <div
        style={{
          animation: `loaderWordIn 400ms ${ease} both`,
          animationDelay: "780ms",
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: "22px",
          fontWeight: 800,
          letterSpacing: "-0.5px",
          lineHeight: 1,
        }}
      >
        <span style={{ color: "#0F0B1E" }}>Example</span>
        <span style={{ color: "#7C3AED" }}>HR</span>
      </div>
    </div>
  );
}
