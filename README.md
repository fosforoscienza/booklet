# Opuscolo

Converte un PDF di pagine singole (A4 o qualsiasi altro formato) in un libretto
pronto da stampare fronte/retro e piegare a metà: pagine affiancate a due a due
e già nell'ordine giusto per la piegatura.

È l'equivalente di BookletCreator, **senza il limite di 16 pagine**: qui non c'è
nessun limite, né di pagine né di dimensione del file.

Funziona interamente sul tuo Mac. Il PDF non viene mai caricato da nessuna parte
e l'app funziona anche senza connessione a internet.

## Come si usa

**Modo più veloce:** doppio clic su `index.html`. Si apre nel browser ed è
pronta all'uso.

**Come vera app Mac:** doppio clic su `crea-app.command`. Crea `Opuscolo.app`,
che puoi trascinare in *Applicazioni* e tenere nel Dock. L'app è autonoma:
contiene già tutto, quindi dopo averla creata puoi anche cancellare questa
cartella.

> Se al primo avvio macOS dice che lo script "non può essere aperto perché
> proviene da uno sviluppatore non identificato", fai clic destro sul file →
> **Apri** → **Apri**. Succede solo la prima volta.

Poi: trascina il PDF nell'app, regola le impostazioni se serve, premi **Crea
opuscolo** e scarica il risultato.

## L'anteprima

Appena scegli il PDF compare l'anteprima: ogni facciata è disegnata in scala,
con le miniature delle pagine nella posizione in cui verranno stampate e il
numero di pagina sotto ciascuna. Si vede a colpo d'occhio se l'ordine è quello
giusto, quanto margine resta e dove cadono le pagine bianche di riempimento.

Si aggiorna da sola a ogni cambio di impostazione: cambiando formato del foglio,
margine, spazio sulla piega o verso di lettura, il foglio cambia sotto gli occhi.
Con **Ribalta sul lato lungo** i retri sono mostrati capovolti, perché è così che
escono dalla stampante.

All'inizio vengono mostrate le prime otto facciate: il pulsante in fondo apre
tutte le altre. Le miniature vengono disegnate solo quando servono, quindi anche
un documento di centinaia di pagine si apre subito.

## Usarla su un altro computer

Nella cartella c'è **`Opuscolo.html`**: la stessa app, ma con librerie e motore
già incorporati in un unico file da 2 MB. Non ha bisogno di nient'altro.

Copialo dove vuoi — chiavetta USB, AirDrop, email, Dropbox — e aprilo con un
doppio clic. Funziona anche **su Windows e Linux**: è una normale pagina che
gira nel browser, e l'unica parte legata al Mac è `crea-app.command`.

Non serve installare niente, non serve internet (l'app non fa nessuna richiesta
di rete: puoi provarla con il Wi-Fi spento) e il PDF resta sul computer.

Se modifichi `index.html`, `booklet.js` o il logo, rigenera il file singolo con
`node crea-file-unico.js`.

## Crediti

In fondo alla pagina, sotto una linea sottile, ci sono i crediti a **Brown
Enterprises srls** con il logo: quello nero sullo sfondo chiaro, quello bianco
quando il Mac è in modalità scura. I due PNG vanno messi nella cartella `logo/`,
che spiega nomi e misure nel suo `README.md`. Finché non ci sono, in fondo resta
la sola scritta.

## Come stampare

1. Apri il PDF prodotto in Anteprima e premi ⌘P.
2. Attiva **Fronte-retro**, con rilegatura sul **lato corto**.
3. Imposta la scala su **100%** — *non* "adatta alla pagina", altrimenti
   aggiunge margini indesiderati.
4. Stampa, piega la pila a metà e graffa sulla piega.

Se le pagine sul retro escono capovolte rispetto a quelle sul fronte, rigenera
l'opuscolo scegliendo **Ribalta sul lato lungo**: alcune stampanti girano il
foglio nel verso opposto.

Se la stampante non fa il fronte/retro da sola, scegli **Due file: fronti e
retri**: stampi prima i fronti, rimetti la pila nel cassetto girata e senza
riordinarla, poi stampi i retri.

## Impostazioni

| Impostazione | A cosa serve |
| --- | --- |
| **Formato del foglio** | `Automatico` fa un foglio largo il doppio della pagina originale (due A4 → un A3). Scegli `A4 orizzontale` se stampi su A4: le pagine vengono rimpicciolite a A5. |
| **Fronte/retro della stampante** | Lato corto o lungo, a seconda di come la tua stampante gira il foglio. |
| **Verso di lettura** | Da destra a sinistra per documenti in arabo, ebraico o manga. |
| **File prodotti** | Un file unico, oppure due file separati per la stampa manuale. |
| **Margine esterno** | Bordo bianco lungo i lati esterni del foglio, in millimetri. Utile se la stampante non arriva a filo. |
| **Spazio sulla piega** | Bianco aggiunto al centro, dove il foglio si piega. Utile sui libretti spessi, dove le pagine interne "scappano" verso l'esterno. |
| **Tutte le pagine** | Spuntata di suo: converte il documento intero senza dover scrivere niente. Togliendola si attivano i due campi qui sotto. |
| **Dalla / alla pagina** | Converte solo una parte del documento. |
| **Linea di piega** | Traccia un tratteggio grigio al centro, come guida per piegare. |

## Come funziona l'ordine delle pagine

Il libretto è a piegatura unica (*saddle stitch*): tutti i fogli si infilano uno
dentro l'altro e si piegano insieme. Per un documento di 8 pagine i fogli sono:

| Foglio | Fronte | Retro |
| --- | --- | --- |
| 1 | 8 \| 1 | 2 \| 7 |
| 2 | 6 \| 3 | 4 \| 5 |

Il numero di pagine deve essere un multiplo di 4: se non lo è, vengono aggiunte
fino a 3 pagine bianche in fondo, quante ne servono per arrivare al primo
multiplo di 4. L'app te lo dice sempre nel riepilogo e te le mostra tratteggiate
nell'anteprima.

## File

| File | Contenuto |
| --- | --- |
| `Opuscolo.html` | **File unico autonomo**, da portare su altri computer |
| `index.html` | Interfaccia dell'app e anteprima |
| `booklet.js` | Motore di imposizione (calcolo dell'ordine e composizione dei fogli) |
| `vendor/pdf-lib.min.js` | [pdf-lib](https://pdf-lib.js.org), libreria PDF: compone il libretto (licenza MIT) |
| `vendor/pdf.min.js`, `vendor/pdf.worker.min.js` | [pdf.js](https://mozilla.github.io/pdf.js/) di Mozilla: disegna le miniature dell'anteprima (licenza Apache 2.0) |
| `crea-app.command` | Genera `Opuscolo.app` (solo macOS) |
| `crea-file-unico.js` | Rigenera `Opuscolo.html` |
| `icona.png` | Icona dell'app |
| `logo/` | Logo di Brown Enterprises mostrato in fondo alla pagina — vedi `logo/README.md` |

Nessuna installazione, nessun `npm install`: le librerie sono già incluse.
