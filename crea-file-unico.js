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

const html = read('index.html')
  .replace('<script src="vendor/pdf-lib.min.js"></script>',
    () => '<script>' + safe(read('vendor/pdf-lib.min.js')) + '</script>')
  .replace('<script src="booklet.js"></script>',
    () => '<script>' + safe(read('booklet.js')) + '</script>');

if (html.includes('<script src=')) {
  console.error('Errore: è rimasto uno script esterno, il file non sarebbe autonomo.');
  process.exit(1);
}

const out = path.join(dir, 'Opuscolo.html');
fs.writeFileSync(out, html);
console.log('Creato', out, '(' + Math.round(html.length / 1024) + ' KB)');
