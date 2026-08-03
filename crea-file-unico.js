/*
 * Genera Opuscolo.html: la stessa app, ma con libreria e motore incorporati
 * in un unico file autonomo, comodo da copiare su un altro computer.
 *
 *   node crea-file-unico.js
 *
 * Serve solo a rigenerare il file dopo una modifica: chi usa l'app non ha
 * bisogno di Node, il file già pronto è nella cartella.
 */
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const read = (p) => fs.readFileSync(path.join(dir, p), 'utf8');

// Una sequenza "</script" dentro il codice chiuderebbe il tag in anticipo.
const safe = (js) => js.replace(/<\/script/gi, '<\\/script').replace(/\/\/# sourceMappingURL=\S+/g, '').trim();

// Ogni <script src="..."> diventa il contenuto del file, nello stesso ordine.
const conScript = read('index.html').replace(
  /<script src="([^"]+)"><\/script>/g,
  (_, src) => '<script>' + safe(read(src)) + '</script>'
);

// Il logo diventa un'immagine incorporata. Se manca, il file unico resta senza:
// l'app se ne accorge da sola e mostra solo la scritta.
const html = conScript.replace(/(src|srcset)="(logo\/[^"]+)"/g, (intero, attr, file) => {
  const completo = path.join(dir, file);
  if (!fs.existsSync(completo)) {
    console.warn('Attenzione: manca ' + file + ', il file unico resterà senza logo.');
    return intero;
  }
  return attr + '="data:image/png;base64,' + fs.readFileSync(completo).toString('base64') + '"';
});

if (html.includes('<script src=')) {
  console.error('Errore: è rimasto uno script esterno, il file non sarebbe autonomo.');
  process.exit(1);
}

const out = path.join(dir, 'Opuscolo.html');
fs.writeFileSync(out, html);
console.log('Creato', out, '(' + Math.round(html.length / 1024) + ' KB)');
