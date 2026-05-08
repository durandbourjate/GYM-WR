import type { DrawCommand, CanvasState, Point } from './ZeichnenTypes';
import { berechneBoundingBox } from './drawingGeometrie';

// ============================================================
// Pfeil-Hilfsfunktion
// ============================================================

function zeichnePfeilspitze(
  ctx: CanvasRenderingContext2D,
  von: Point,
  bis: Point,
  breite: number
): void {
  const winkel = Math.atan2(bis.y - von.y, bis.x - von.x);
  const pfeilLaenge = Math.max(10, breite * 4);
  const pfeilBreite = Math.max(6, breite * 2.5);

  ctx.beginPath();
  ctx.moveTo(bis.x, bis.y);
  ctx.lineTo(
    bis.x - pfeilLaenge * Math.cos(winkel - Math.PI / 7),
    bis.y - pfeilLaenge * Math.sin(winkel - Math.PI / 7)
  );
  ctx.lineTo(
    bis.x - pfeilLaenge * Math.cos(winkel + Math.PI / 7),
    bis.y - pfeilLaenge * Math.sin(winkel + Math.PI / 7)
  );
  ctx.closePath();

  // Pfeilspitze füllen (gleiche Farbe wie Linie)
  ctx.fillStyle = ctx.strokeStyle as string;
  ctx.fill();

  // Pfeilbreite für Linienende anpassen (damit Linie nicht über Spitze hinausragt)
  void pfeilBreite; // Verwendung über pfeilLaenge bereits abgedeckt
}

// ============================================================
// Einzelnen Command zeichnen
// ============================================================

export function zeichneCommand(ctx: CanvasRenderingContext2D, cmd: DrawCommand): void {
  ctx.save();

  switch (cmd.typ) {
    case 'stift': {
      if (cmd.punkte.length === 0) break;
      ctx.strokeStyle = cmd.farbe;
      ctx.lineWidth = cmd.breite;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (cmd.gestrichelt) ctx.setLineDash([8, 4]);
      ctx.beginPath();
      ctx.moveTo(cmd.punkte[0].x, cmd.punkte[0].y);
      for (let i = 1; i < cmd.punkte.length; i++) {
        ctx.lineTo(cmd.punkte[i].x, cmd.punkte[i].y);
      }
      ctx.stroke();
      if (cmd.gestrichelt) ctx.setLineDash([]);
      break;
    }

    case 'linie': {
      ctx.strokeStyle = cmd.farbe;
      ctx.lineWidth = cmd.breite;
      ctx.lineCap = 'round';
      if (cmd.gestrichelt) ctx.setLineDash([8, 4]);
      ctx.beginPath();
      ctx.moveTo(cmd.von.x, cmd.von.y);
      ctx.lineTo(cmd.bis.x, cmd.bis.y);
      ctx.stroke();
      if (cmd.gestrichelt) ctx.setLineDash([]);
      break;
    }

    case 'pfeil': {
      ctx.strokeStyle = cmd.farbe;
      ctx.lineWidth = cmd.breite;
      ctx.lineCap = 'round';
      if (cmd.gestrichelt) ctx.setLineDash([8, 4]);

      // Linie zeichnen
      ctx.beginPath();
      ctx.moveTo(cmd.von.x, cmd.von.y);
      ctx.lineTo(cmd.bis.x, cmd.bis.y);
      ctx.stroke();
      if (cmd.gestrichelt) ctx.setLineDash([]);

      // Pfeilspitze zeichnen
      zeichnePfeilspitze(ctx, cmd.von, cmd.bis, cmd.breite);
      break;
    }

    case 'rechteck': {
      const x = Math.min(cmd.von.x, cmd.bis.x);
      const y = Math.min(cmd.von.y, cmd.bis.y);
      const w = Math.abs(cmd.bis.x - cmd.von.x);
      const h = Math.abs(cmd.bis.y - cmd.von.y);

      if (cmd.gestrichelt) ctx.setLineDash([8, 4]);
      if (cmd.gefuellt) {
        ctx.fillStyle = cmd.farbe;
        ctx.fillRect(x, y, w, h);
      } else {
        ctx.strokeStyle = cmd.farbe;
        ctx.lineWidth = cmd.breite;
        ctx.strokeRect(x, y, w, h);
      }
      if (cmd.gestrichelt) ctx.setLineDash([]);
      break;
    }

    case 'ellipse': {
      const cx = (cmd.von.x + cmd.bis.x) / 2;
      const cy = (cmd.von.y + cmd.bis.y) / 2;
      const rx = Math.abs(cmd.bis.x - cmd.von.x) / 2;
      const ry = Math.abs(cmd.bis.y - cmd.von.y) / 2;
      ctx.strokeStyle = cmd.farbe;
      ctx.lineWidth = cmd.breite;
      if (cmd.gestrichelt) ctx.setLineDash([8, 4]);
      ctx.beginPath();
      ctx.ellipse(cx, cy, Math.max(rx, 1), Math.max(ry, 1), 0, 0, Math.PI * 2);
      if (cmd.gefuellt) { ctx.fillStyle = cmd.farbe; ctx.fill(); }
      ctx.stroke();
      if (cmd.gestrichelt) ctx.setLineDash([]);
      break;
    }

    case 'text': {
      ctx.fillStyle = cmd.farbe;
      ctx.font = `${cmd.fett ? 'bold ' : ''}${cmd.groesse}px sans-serif`;
      ctx.textBaseline = 'alphabetic';
      if (cmd.rotation) {
        ctx.save();
        ctx.translate(cmd.position.x, cmd.position.y);
        ctx.rotate((cmd.rotation * Math.PI) / 180);
        ctx.fillText(cmd.text, 0, 0);
        ctx.restore();
      } else {
        ctx.fillText(cmd.text, cmd.position.x, cmd.position.y);
      }
      break;
    }

    case 'radierer': {
      if (cmd.punkte.length === 0) break;
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = cmd.breite;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(cmd.punkte[0].x, cmd.punkte[0].y);
      for (let i = 1; i < cmd.punkte.length; i++) {
        ctx.lineTo(cmd.punkte[i].x, cmd.punkte[i].y);
      }
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
      break;
    }
  }

  ctx.restore();
}

// ============================================================
// Vollständiges Canvas rendern
// ============================================================

export function renderCanvas(
  ctx: CanvasRenderingContext2D,
  state: CanvasState,
  hintergrundbild: HTMLImageElement | null | undefined,
  breite: number,
  hoehe: number
): void {
  ctx.clearRect(0, 0, breite, hoehe);

  if (hintergrundbild) {
    ctx.drawImage(hintergrundbild, 0, 0, breite, hoehe);
  }

  // Alle abgeschlossenen Commands zeichnen
  state.commands.forEach(cmd => zeichneCommand(ctx, cmd));

  // Aktiver (noch nicht abgeschlossener) Command zeichnen
  if (state.aktiverCommand) {
    zeichneCommand(ctx, state.aktiverCommand);
  }

  // Selektion: gestrichelter blauer Rahmen um selektierten Command
  if (state.selektierterCommand !== null) {
    const selektiert = state.commands.find(c => c.id === state.selektierterCommand);
    if (selektiert) {
      const bb = berechneBoundingBox(selektiert);
      if (bb) {
        ctx.save();
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 4]);
        ctx.strokeRect(bb.x, bb.y, bb.breite, bb.hoehe);
        ctx.restore();
      }
    }
  }
}
