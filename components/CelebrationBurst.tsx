"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

const COLORS = ["#F8B4C0", "#FFD3A8", "#FFF0A8", "#B9F0D3", "#AEE3F5", "#D8C7F5"];
const PARTICLE_COUNT = 26;
const DURATION_MS = 1300;

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

type Particle = {
  id: number;
  side: "left" | "right";
  top: string;
  color: string;
  size: number;
  delay: number;
  duration: number;
  travel: number;
  rotate: number;
};

function makeParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const side: "left" | "right" = i % 2 === 0 ? "left" : "right";
    return {
      id: i,
      side,
      top: `${randomBetween(5, 90)}%`,
      color: COLORS[i % COLORS.length],
      size: randomBetween(6, 14),
      delay: randomBetween(0, 0.15),
      duration: randomBetween(0.9, 1.2),
      travel: randomBetween(140, 280),
      rotate: randomBetween(180, 720) * (Math.random() > 0.5 ? 1 : -1),
    };
  });
}

export function CelebrationBurst({ onComplete }: { onComplete?: () => void }) {
  const [particles] = useState(makeParticles);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const timer = setTimeout(() => onCompleteRef.current?.(), DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      {particles.map((p) => {
        const style: CSSProperties & Record<string, string> = {
          top: p.top,
          [p.side]: "0px",
          width: `${p.size}px`,
          height: `${p.size}px`,
          backgroundColor: p.color,
          animationDuration: `${p.duration}s`,
          animationDelay: `${p.delay}s`,
          "--celebration-travel": `${p.side === "left" ? p.travel : -p.travel}px`,
          "--celebration-rotate": `${p.rotate}deg`,
        };
        return (
          <span key={p.id} className="celebration-particle absolute rounded-sm" style={style} />
        );
      })}
    </div>
  );
}
