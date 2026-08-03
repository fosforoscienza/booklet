# Logo

Qui vanno i due file del logo di Brown Enterprises, che compare in fondo
all'app. I nomi devono essere esattamente questi:

| File | Quando si vede |
| --- | --- |
| `brown-enterprises-nero.png` | sfondo chiaro (l'aspetto normale) |
| `brown-enterprises-bianco.png` | sfondo scuro (Mac in modalità scura) |

Consigli sul file: PNG con **sfondo trasparente**, alto almeno 60 pixel (meglio
90, così resta nitido sugli schermi Retina: nella pagina viene mostrato alto 30).
La larghezza è libera, il logo si adatta.

Puoi caricarli direttamente da GitHub: apri questa cartella, **Add file › Upload
files**, trascina i due PNG e conferma. Appena arrivano compaiono nell'app.

Dopo averli aggiunti, rigenera il file unico con `node crea-file-unico.js`: il
logo viene incorporato in `Opuscolo.html` insieme al resto, così resta anche
copiando il file su un altro computer.

Finché i file non ci sono l'app funziona lo stesso: in fondo resta la sola
scritta, senza immagine rotta.
