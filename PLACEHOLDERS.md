# Placeholderek — mit kell kicserélni élesítés előtt

Az oldalon szándékosan nincs semmilyen valós céges adat. Az alábbi `{{PLACEHOLDER}}` tokenek szerepelnek az `index.html` fájlban (fejléc, meta tagek, JSON-LD, hero, CTA-k, ajánlatkérő űrlap, footer). Kicseréléskor egyszerű keresés-csere (`{{TOKEN}}` → valós érték) elvégzendő a teljes fájlban.

| Token | Jelentés | Hol fordul elő |
|---|---|---|
| `{{DOMAIN}}` | Az éles domain, protokoll nélkül (pl. `patkanymentes.hu`) | `<title>` körüli meta tagek, canonical, Open Graph URL-ek, JSON-LD `url`/`image` |
| `{{CEGNEV}}` | A cég / vállalkozás neve | `<title>`, meta description, logó (fejléc + footer), JSON-LD `name`, footer cégadatok |
| `{{TELEFON}}` | Telefonszám, `tel:` linkekhez formázva (pl. `+36301234567`) | Fejléc CTA gomb, hero CTA, sürgető CTA blokk, ajánlatkérő szekció telefon kártya, footer, JSON-LD `telephone` |
| `{{EMAIL}}` | E-mail cím | Footer, JSON-LD `email` |
| `{{CIM}}` | Postai / székhely cím | Footer, JSON-LD `address.streetAddress` |
| `{{ADOSZAM}}` | Adószám | Footer, JSON-LD `vatID` |
| `{{NYITVATARTAS}}` | Nyitvatartási idő szövege (pl. `H-P 7:00-19:00, hétvégén ügyelet`) | Ajánlatkérő szekció telefon kártya, footer, JSON-LD `openingHours` |
| `{{SZOLGALTATASI_TERULET}}` | A kiszolgált terület megnevezése (pl. `Budapest és Pest megye`) | Meta description, hero alatti stat badge, GYIK válaszok, footer, JSON-LD `areaServed` |
| `{{ADATKEZELESI_TAJEKOZTATO_URL}}` | Az adatkezelési tájékoztató oldal linkje | Ajánlatkérő űrlap checkbox linkje, footer link |

## Egyéb, nem tokenizált, de ellenőrizendő elemek

- **`send-form.php`** (`index.html` `<form action="…">`) — cseréld le a tényleges űrlapfeldolgozó végpontra (PHP script, form-beküldő szolgáltatás vagy saját backend). A kliensoldali JS (`script.js`) jelenleg csak validál és `preventDefault()`-ol demószerűen — éles használatban a `fetch`/natív submit logikát a választott backendhez kell igazítani.
- **Képek** — lásd [IMAGES.md](IMAGES.md): minden `images/*.jpg` fájlt valódi fotóra kell cserélni.
- **Vélemények szekció** — a `Kovács A.`, `Nagy B.`, `Szabó C.` névkezdemények és szövegeik placeholder tartalmak, valódi (engedélyezett) ügyfélvisszajelzésekre cserélendők.
- **JSON-LD** (`index.html` `<head>`) — a `priceRange` mező (`"$$"`) tájékoztató jellegű, igény szerint módosítható vagy eltávolítható.
