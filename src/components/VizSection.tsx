import { useRef, useEffect, useMemo } from 'react';
import type { BetResult, Config } from '../types';
import { growthRet } from '../lib/math';

interface Props {
  result: BetResult | { err: string } | null;
  config: Config;
}

export function VizSection({ result, config }: Props) {
  const hasResult = result && !('err' in result) && result.ev > 0 && result.kadj > 0;

  if (!hasResult) return null;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-1.5 h-1.5 rounded-full bg-accent" />
        <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Análise gráfica</span>
      </div>
      <GrowthCurve result={result as BetResult} config={config} />
      <MonteCarlo result={result as BetResult} config={config} />
    </div>
  );
}

function GrowthCurve({ result, config }: { result: BetResult; config: Config }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const pad = { top: 30, right: 20, bottom: 35, left: 50 };
    const cw = w - pad.left - pad.right;
    const ch = h - pad.top - pad.bottom;

    // Background - glass effect
    ctx.fillStyle = 'rgba(11, 15, 23, 0.5)';
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = pad.top + (ch * i) / 5;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + cw, y);
      ctx.stroke();
    }

    const stakes = Array.from({ length: 101 }, (_, i) => i / 100);
    const growths = stakes.map(s => {
      const ret = result.returns.length > 0
        ? result.returns.map(r => ({ p: r.p, net: r.net * s }))
        : [{ p: result.p || 0.5, net: s * (result.yourEff - 1) }, { p: 1 - (result.p || 0.5), net: -s }];
      return growthRet(ret);
    });

    const maxG = Math.max(...growths, 0.001);
    const minG = Math.min(...growths, -0.001);

    const yScale = (g: number) => pad.top + ch - ((g - minG) / (maxG - minG || 1)) * ch;
    const xScale = (i: number) => pad.left + (i / 100) * cw;

    // Zero line
    const y0 = yScale(0);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(pad.left, y0);
    ctx.lineTo(pad.left + cw, y0);
    ctx.stroke();
    ctx.setLineDash([]);

    // Curve
    ctx.strokeStyle = '#6366F1';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    growths.forEach((g, i) => {
      const x = xScale(i);
      const y = yScale(g);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Fill under curve
    ctx.fillStyle = 'rgba(99,102,241,0.1)';
    ctx.beginPath();
    ctx.moveTo(pad.left, y0);
    growths.forEach((g, i) => ctx.lineTo(xScale(i), yScale(g)));
    ctx.lineTo(pad.left + cw, y0);
    ctx.closePath();
    ctx.fill();

    // Kelly marker
    const kx = xScale(Math.round(result.kadj * 100));
    const kg = growths[Math.round(result.kadj * 100)] || 0;
    ctx.fillStyle = '#10B981';
    ctx.beginPath();
    ctx.arc(kx, yScale(kg), 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(kx, pad.top);
    ctx.lineTo(kx, pad.top + ch);
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '11px JetBrains Mono';
    ctx.textAlign = 'center';
    ctx.fillText('0%', pad.left, pad.top + ch + 18);
    ctx.fillText('Kelly', kx, pad.top + ch + 18);
    ctx.fillText('100%', pad.left + cw, pad.top + ch + 18);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#6B7280';
    ctx.fillText(maxG.toFixed(3), pad.left - 8, pad.top + 10);
    ctx.fillText(minG.toFixed(3), pad.left - 8, pad.top + ch);

    ctx.fillStyle = '#10B981';
    ctx.font = 'bold 11px JetBrains Mono';
    ctx.fillText('Kelly', kx + 20, yScale(kg) - 10);
  }, [result]);

  return (
    <div className="panel">
      <div className="section-title">Crescimento logarítmico esperado</div>
      <canvas ref={canvasRef} className="w-full h-48 rounded-lg" />
    </div>
  );
}

function MonteCarlo({ result, config }: { result: BetResult; config: Config }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const sims = useMemo(() => {
    const n = 300;
    const bets = 250;
    const paths: number[][] = [];
    for (let s = 0; s < n; s++) {
      let bank = 1;
      const path = [bank];
      for (let b = 0; b < bets; b++) {
        const ret = result.returns.length > 0
          ? result.returns
          : [{ p: result.p || 0.5, net: result.yourEff - 1 }, { p: 1 - (result.p || 0.5), net: -1 }];
        const r = Math.random();
        let cum = 0;
        let net = -1;
        for (const state of ret) {
          cum += state.p;
          if (r <= cum) { net = state.net; break; }
        }
        bank *= (1 + result.kadj * net);
        path.push(bank);
      }
      paths.push(path);
    }
    return paths;
  }, [result, config]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const pad = { top: 20, right: 20, bottom: 30, left: 50 };
    const cw = w - pad.left - pad.right;
    const ch = h - pad.top - pad.bottom;

    // Background - glass effect
    ctx.fillStyle = 'rgba(11, 15, 23, 0.5)';
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (ch * i) / 4;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + cw, y);
      ctx.stroke();
    }

    const maxV = Math.max(...sims.map(p => Math.max(...p)), 1);
    const minV = Math.min(...sims.map(p => Math.min(...p)), 0.1);

    const yScale = (v: number) => pad.top + ch - ((Math.log10(Math.max(v, 0.01)) - Math.log10(Math.max(minV, 0.01))) / (Math.log10(maxV) - Math.log10(Math.max(minV, 0.01)) || 1)) * ch;
    const xScale = (i: number) => pad.left + (i / 250) * cw;

    // Zero line (bank = 1)
    const y1 = yScale(1);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(pad.left, y1);
    ctx.lineTo(pad.left + cw, y1);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw paths
    sims.forEach((path, si) => {
      ctx.strokeStyle = si < 5 ? `rgba(99,102,241,${0.3 + si * 0.1})` : 'rgba(99,102,241,0.04)';
      ctx.lineWidth = si < 5 ? 1.5 : 0.5;
      ctx.beginPath();
      path.forEach((v, i) => {
        const x = xScale(i);
        const y = yScale(v);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    });

    // Labels
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '11px JetBrains Mono';
    ctx.textAlign = 'center';
    ctx.fillText('0', pad.left, pad.top + ch + 18);
    ctx.fillText('250 apostas', pad.left + cw, pad.top + ch + 18);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#6B7280';
    ctx.fillText(maxV.toFixed(1) + 'x', pad.left - 8, pad.top + 10);
    ctx.fillText('1x', pad.left - 8, y1 + 4);
    ctx.fillText(minV.toFixed(2) + 'x', pad.left - 8, pad.top + ch);
  }, [sims]);

  const ruin = sims.filter(p => p[p.length - 1] < 0.5).length / sims.length;

  return (
    <div className="panel">
      <div className="flex items-center justify-between mb-3">
        <div className="section-title mb-0">Simulação Monte Carlo</div>
        <span className="tag tag-info">{sims.length} trajetórias</span>
      </div>
      <canvas ref={canvasRef} className="w-full h-48 rounded-lg" />
      <div className="flex items-center justify-between mt-3 text-xs text-text-muted">
        <span>Ruinaprox: <span className="font-mono text-text-secondary">{fpct(ruin)}</span></span>
        <span>Mediana final: <span className="font-mono text-text-secondary">
          {(() => {
            const finals = sims.map(p => p[p.length - 1]).sort((a, b) => a - b);
            return finals[Math.floor(finals.length / 2)].toFixed(2) + 'x';
          })()}
        </span></span>
      </div>
    </div>
  );
}

function fpct(n: number): string {
  return (n * 100).toFixed(2).replace('.', ',') + '%';
}
