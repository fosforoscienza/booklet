/*
 * booklet.js — motore di imposizione "opuscolo" (saddle stitch).
 *
 * Prende un PDF di pagine singole e produce fogli orizzontali con due pagine
 * affiancate, nell'ordine giusto per la stampa fronte/retro e la piegatura
 * centrale. Nessun limite di pagine.
 *
 * Funziona sia nel browser (con vendor/pdf-lib.min.js caricato prima) sia in
 * Node (require('pdf-lib')), così la logica è testabile fuori dall'interfaccia.
 */
(function (root, factory) {
  var lib =
    (typeof PDFLib !== 'undefined' && PDFLib) ||
    (typeof require === 'function' && require('pdf-lib'));
  var api = factory(lib);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Booklet = api;
})(typeof self !== 'undefined' ? self : this, function (PDFLib) {
  'use strict';

  var PDFDocument = PDFLib.PDFDocument;
  var degrees = PDFLib.degrees;
  var rgb = PDFLib.rgb;

  var MM = 72 / 25.4; // millimetri -> punti PostScript

  // Formati foglio in punti, orientamento verticale (larghezza x altezza).
  var PAPER = {
    a3: [841.89, 1190.55],
    a4: [595.28, 841.89],
    a5: [419.53, 595.28],
    letter: [612, 792],
    legal: [612, 1008],
    tabloid: [792, 1224],
  };

  /**
   * Ordine di imposizione per un opuscolo a piegatura unica.
   * Restituisce un array di facciate; ogni facciata è { side, pages: [sx, dx] }
   * con numeri di pagina 1-based (null = pagina bianca di riempimento).
   */
  function sheetOrder(pageCount) {
    var total = Math.ceil(pageCount / 4) * 4; // il fascicolo richiede multipli di 4
    var sheets = total / 4;
    var out = [];
    for (var i = 0; i < sheets; i++) {
      var keep = function (n) {
        return n <= pageCount ? n : null;
      };
      out.push({ sheet: i, side: 'front', pages: [keep(total - 2 * i), keep(2 * i + 1)] });
      out.push({ sheet: i, side: 'back', pages: [keep(2 * i + 2), keep(total - 2 * i - 1)] });
    }
    return out;
  }

  /**
   * Geometria di un foglio: dimensioni e i due riquadri dove finiscono le
   * pagine. pageW/pageH sono le dimensioni viste della pagina sorgente più
   * grande, in punti.
   *
   * Sta qui, e non dentro convert, perché anche l'anteprima deve poter
   * disegnare esattamente lo stesso foglio senza rifare i conti a mano.
   */
  function sheetLayout(options, pageW, pageH) {
    var opt = options || {};
    var margin = (opt.margin || 0) * MM;
    var gutter = (opt.gutter || 0) * MM;

    var sheetW;
    var sheetH;
    if (opt.paper && opt.paper !== 'auto') {
      var size = PAPER[opt.paper];
      if (!size) throw new Error('Formato foglio sconosciuto: ' + opt.paper);
      sheetW = Math.max(size[0], size[1]); // foglio orizzontale
      sheetH = Math.min(size[0], size[1]);
    } else {
      sheetW = pageW * 2;
      sheetH = pageH;
    }

    var halfW = sheetW / 2 - margin - gutter / 2;
    var halfH = sheetH - margin * 2;
    if (halfW <= 1 || halfH <= 1) {
      throw new Error('Margine e piega centrale non lasciano spazio alle pagine.');
    }

    return {
      width: sheetW,
      height: sheetH,
      left: { x: margin, y: margin, w: halfW, h: halfH },
      right: { x: sheetW / 2 + gutter / 2, y: margin, w: halfW, h: halfH },
    };
  }

  /** Dimensione "vista" di una pagina, tenendo conto della sua rotazione. */
  function visualSize(box, rotation) {
    var turned = rotation === 90 || rotation === 270;
    return {
      w: turned ? box.height : box.width,
      h: turned ? box.width : box.height,
    };
  }

  /**
   * Disegna una pagina incorporata dentro un rettangolo, adattandola senza
   * deformarla e centrandola.
   *
   * pdf-lib applica le trasformazioni in ordine: traslazione, rotazione, scala.
   * Il punto (x, y) passato a drawPage è quindi il perno della rotazione, non
   * l'angolo in basso a sinistra del risultato: per rotazioni diverse da 0 va
   * compensato, altrimenti la pagina finisce fuori dal foglio.
   */
  function place(outPage, embedded, rotation, rect) {
    var w = embedded.width;
    var h = embedded.height;
    var vis = visualSize({ width: w, height: h }, rotation);
    var scale = Math.min(rect.w / vis.w, rect.h / vis.h);
    var drawnW = vis.w * scale;
    var drawnH = vis.h * scale;
    var x = rect.x + (rect.w - drawnW) / 2; // angolo in basso a sinistra voluto
    var y = rect.y + (rect.h - drawnH) / 2;

    if (rotation === 90) {
      x += h * scale;
    } else if (rotation === 180) {
      x += w * scale;
      y += h * scale;
    } else if (rotation === 270) {
      y += w * scale;
    }

    outPage.drawPage(embedded, {
      x: x,
      y: y,
      xScale: scale,
      yScale: scale,
      rotate: degrees(rotation),
    });
  }

  /** Ruota un rettangolo di 180° attorno al centro del foglio. */
  function mirror(rect, sheetW, sheetH) {
    return {
      x: sheetW - rect.x - rect.w,
      y: sheetH - rect.y - rect.h,
      w: rect.w,
      h: rect.h,
    };
  }

  function normalizeRotation(deg) {
    var r = Math.round(deg / 90) * 90 % 360;
    return r < 0 ? r + 360 : r;
  }

  /**
   * Converte un PDF in opuscolo.
   *
   * options:
   *   paper      'auto' | 'a3' | 'a4' | 'a5' | 'letter' | 'legal' | 'tabloid'
   *   binding    'left' (default) | 'right' (lettura da destra a sinistra)
   *   flip       'short' (default) | 'long'  — lato di ribaltamento della stampante
   *   margin     margine esterno in mm (default 0)
   *   gutter     spazio totale al centro, sulla piega, in mm (default 0)
   *   foldLine   true per tracciare una linea di piega tratteggiata
   *   split      true per ottenere due PDF separati (fronti e retri)
   *   from, to   intervallo di pagine 1-based (opzionale)
   *   onProgress callback(fatti, totali)
   *
   * Ritorna { front: Uint8Array, back: Uint8Array|null, sheets, pages, padded }.
   */
  async function convert(inputBytes, options) {
    var opt = options || {};
    var binding = opt.binding === 'right' ? 'right' : 'left';
    var flip = opt.flip === 'long' ? 'long' : 'short';
    var onProgress = opt.onProgress || function () {};

    var src = await PDFDocument.load(inputBytes, {
      ignoreEncryption: true,
      updateMetadata: false,
    });

    var all = src.getPages();
    var from = Math.max(1, opt.from || 1);
    var to = Math.min(all.length, opt.to || all.length);
    if (to < from) throw new Error('Intervallo di pagine non valido.');
    var selected = [];
    for (var i = from - 1; i < to; i++) selected.push(all[i]);
    if (!selected.length) throw new Error('Il PDF non contiene pagine da convertire.');

    // Geometria di ogni pagina sorgente: riquadro di ritaglio + rotazione.
    // Attenzione: /Rotate del PDF è in senso orario, mentre drawPage di pdf-lib
    // ruota in senso antiorario. Serve l'angolo complementare, altrimenti le
    // pagine a 90°/270° escono capovolte rispetto a come le mostra un lettore.
    var geom = selected.map(function (p) {
      var box = p.getCropBox();
      var rotation = (360 - normalizeRotation(p.getRotation().angle)) % 360;
      return { box: box, rotation: rotation, vis: visualSize(box, rotation) };
    });

    var maxW = Math.max.apply(null, geom.map(function (g) { return g.vis.w; }));
    var maxH = Math.max.apply(null, geom.map(function (g) { return g.vis.h; }));

    var layout = sheetLayout(opt, maxW, maxH);
    var sheetW = layout.width;
    var sheetH = layout.height;
    var leftRect = layout.left;
    var rightRect = layout.right;

    var order = sheetOrder(selected.length);
    var frontDoc = await PDFDocument.create();
    var backDoc = opt.split ? await PDFDocument.create() : null;

    // Ogni pagina sorgente compare una volta sola, quindi si incorpora al volo:
    // niente cache, e la memoria resta piatta anche su documenti lunghissimi.
    for (var s = 0; s < order.length; s++) {
      var face = order[s];
      var target = backDoc && face.side === 'back' ? backDoc : frontDoc;
      var outPage = target.addPage([sheetW, sheetH]);

      // Con ribaltamento sul lato lungo la stampante gira il foglio "a testa in
      // giù": si compensa ruotando di 180° il contenuto dei retri.
      var upside = flip === 'long' && face.side === 'back';
      var slots = binding === 'right' ? [face.pages[1], face.pages[0]] : face.pages;
      var rects = [leftRect, rightRect];

      for (var k = 0; k < 2; k++) {
        var pageNo = slots[k];
        if (!pageNo) continue; // pagina bianca di riempimento
        var g = geom[pageNo - 1];
        var rect = rects[k];
        if (upside) rect = mirror(rect, sheetW, sheetH);
        var embedded = await target.embedPage(selected[pageNo - 1], {
          left: g.box.x,
          bottom: g.box.y,
          right: g.box.x + g.box.width,
          top: g.box.y + g.box.height,
        });
        place(outPage, embedded, (g.rotation + (upside ? 180 : 0)) % 360, rect);
      }

      if (opt.foldLine) {
        outPage.drawLine({
          start: { x: sheetW / 2, y: 0 },
          end: { x: sheetW / 2, y: sheetH },
          thickness: 0.4,
          color: rgb(0.75, 0.75, 0.75),
          dashArray: [3, 3],
        });
      }

      onProgress(s + 1, order.length);
      if (typeof opt.yield === 'function') await opt.yield();
    }

    var padded = Math.ceil(selected.length / 4) * 4 - selected.length;
    return {
      front: await frontDoc.save(),
      back: backDoc ? await backDoc.save() : null,
      sheets: order.length / 2,
      pages: selected.length,
      padded: padded,
      sheetSize: { width: sheetW, height: sheetH },
    };
  }

  return {
    convert: convert,
    sheetOrder: sheetOrder,
    sheetLayout: sheetLayout,
    PAPER: PAPER,
    MM: MM,
  };
});
