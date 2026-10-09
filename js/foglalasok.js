// =====================================================================
// foglalasok.js – a Foglalások oldal logikája
//
// Mit csinál?
//   1. Beolvassa a data/foglalasok.json-t egy tömbbe (fetch).
//   2. Kiírja a foglalásokat táblázatban VAGY kártyákon (nézetváltó).
//   3. Szűr névre és dátumra.
//   4. Rendez a kiválasztott tulajdonság szerint (gombnyomásra).
//   5. Soft delete: törléskor csak "torolt = true" lesz, nem tűnik el a tömbből.
//
// Fontos: minden a memóriában történik. Újratöltéskor visszaáll az eredeti JSON.
// =====================================================================


// ---------- 1. Állapot (az oldal "memóriája") ----------

let foglalasok = [];          // ide töltjük be a JSON tartalmát
let nezet = "tablazat";       // "tablazat" vagy "kartya"
let rendezesNovekvo = true;   // true = A→Z / kicsi→nagy, false = fordítva


// ---------- 2. HTML elemek megkeresése ----------
// A script "defer"-rel van betöltve, ezért itt már létezik a teljes HTML.

const kiiras = document.getElementById("kiiras");
const uzenet = document.getElementById("uzenet");
const keresesMezo = document.getElementById("kereses");
const szuresDatumMezo = document.getElementById("szuresDatum");
const rendezesMezo = document.getElementById("rendezesMezo");
const rendezesGomb = document.getElementById("rendezesGomb");
const tablazatGomb = document.getElementById("tablazatGomb");
const kartyaGomb = document.getElementById("kartyaGomb");


// ---------- 3. Adatbetöltés ----------

function betoltes() {
    fetch("./data/foglalasok.json")
        .then(function (valasz) {
            // Ha pl. rossz az útvonal (404), a fetch nem dob hibát magától, ezért mi dobunk.
            if (!valasz.ok) {
                throw new Error("HTTP hiba: " + valasz.status);
            }
            return valasz.json(); // a szövegből JS tömb lesz
        })
        .then(function (adat) {
            foglalasok = adat;
            megjelenites();
        })
        .catch(function (hiba) {
            console.error(hiba);
            kiiras.innerHTML =
                '<div class="alert alert-danger">Nem sikerült betölteni a foglalásokat. ' +
                "Live Serverrel nyitottad meg az oldalt?</div>";
        });
}


// ---------- 4. Szűrés ----------
// Visszaadja azokat a foglalásokat, amiket ki kell írni:
// nem töröltek + illeszkednek a keresőre + illeszkednek a dátumra.

function szurtFoglalasok() {
    const keresett = keresesMezo.value.trim().toLowerCase();
    const datum = szuresDatumMezo.value; // "" ha üres, különben "2026-10-10" alakú

    return foglalasok.filter(function (f) {
        if (f.torolt) return false;
        if (keresett !== "" && !f.nev.toLowerCase().includes(keresett)) return false;
        if (datum !== "" && f.datum !== datum) return false;
        return true;
    });
}


// ---------- 5. Megjelenítés ----------

function megjelenites() {
    const lista = szurtFoglalasok();
    kiiras.innerHTML = ""; // előző tartalom törlése

    if (lista.length === 0) {
        kiiras.innerHTML = '<div class="alert alert-info">Nincs a feltételeknek megfelelő foglalás.</div>';
        return;
    }

    if (nezet === "tablazat") {
        tablazatRajzolas(lista);
    } else {
        kartyaRajzolas(lista);
    }
}

// Segédfüggvény: 3000 → "3 000 Ft"
function penz(osszeg) {
    return osszeg.toLocaleString("hu-HU") + " Ft";
}

// Segédfüggvény: egy törlés gomb létrehozása, ami a megadott id-jű foglalást törli
function torlesGomb(id) {
    const gomb = document.createElement("button");
    gomb.type = "button";
    gomb.className = "btn btn-sm btn-outline-danger";
    gomb.textContent = "Törlés";
    gomb.addEventListener("click", function () {
        torles(id);
    });
    return gomb;
}


// ---------- 5/a. Táblázatos nézet ----------
// createElement + textContent: így a nevekben lévő esetleges "<" jelek
// sem tudják elrontani a HTML-t (biztonságosabb, mint az innerHTML).

function tablazatRajzolas(lista) {
    const fejlecek = ["Név", "Email", "Telefon", "Dátum", "Időpont", "Vendég", "Asztal", "Végösszeg", ""];

    const tablazat = document.createElement("table");
    tablazat.className = "table table-striped table-hover align-middle";

    // Fejléc
    const thead = document.createElement("thead");
    thead.className = "table-dark";
    const fejlecSor = document.createElement("tr");
    fejlecek.forEach(function (szoveg) {
        const th = document.createElement("th");
        th.textContent = szoveg;
        fejlecSor.appendChild(th);
    });
    thead.appendChild(fejlecSor);
    tablazat.appendChild(thead);

    // Törzs: minden foglalás egy sor
    const tbody = document.createElement("tbody");
    lista.forEach(function (f) {
        const sor = document.createElement("tr");
        const cellak = [f.nev, f.email, f.telefon, f.datum, f.idopont,
                        f.vendegszam + " fő", f.asztalId + ". asztal", penz(f.vegosszeg)];

        cellak.forEach(function (ertek) {
            const td = document.createElement("td");
            td.textContent = ertek;
            sor.appendChild(td);
        });

        const muveletCella = document.createElement("td");
        muveletCella.appendChild(torlesGomb(f.id));
        sor.appendChild(muveletCella);

        tbody.appendChild(sor);
    });
    tablazat.appendChild(tbody);

    // A table-responsive mobilon vízszintesen görgethetővé teszi a táblázatot
    const doboz = document.createElement("div");
    doboz.className = "table-responsive";
    doboz.appendChild(tablazat);
    kiiras.appendChild(doboz);
}


// ---------- 5/b. Kártyás nézet ----------

function kartyaRajzolas(lista) {
    // row-cols-*: hány kártya legyen egy sorban (mobil: 1, tablet: 2, nagy kijelző: 3)
    const sor = document.createElement("div");
    sor.className = "row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3";

    lista.forEach(function (f) {
        const oszlop = document.createElement("div");
        oszlop.className = "col";

        const kartya = document.createElement("div");
        kartya.className = "card h-100 shadow-sm foglalas-kartya";

        // Kártya teste
        const torzs = document.createElement("div");
        torzs.className = "card-body";

        const cim = document.createElement("h5");
        cim.className = "card-title";
        cim.textContent = f.nev;
        torzs.appendChild(cim);

        const alcim = document.createElement("h6");
        alcim.className = "card-subtitle mb-3 text-body-secondary";
        alcim.textContent = f.datum + ", " + f.idopont;
        torzs.appendChild(alcim);

        // Adatsorok: [címke, érték] párok
        const adatok = [
            ["Vendégek", f.vendegszam + " fő"],
            ["Asztal", f.asztalId + ". asztal"],
            ["Email", f.email],
            ["Telefon", f.telefon],
        ];
        const adatLista = document.createElement("ul");
        adatLista.className = "list-unstyled mb-0";
        adatok.forEach(function (par) {
            const li = document.createElement("li");
            const cimke = document.createElement("strong");
            cimke.textContent = par[0] + ": ";
            li.appendChild(cimke);
            li.appendChild(document.createTextNode(par[1]));
            adatLista.appendChild(li);
        });
        torzs.appendChild(adatLista);
        kartya.appendChild(torzs);

        // Kártya lábléc: összeg + törlés
        const lablec = document.createElement("div");
        lablec.className = "card-footer d-flex justify-content-between align-items-center";
        const osszeg = document.createElement("span");
        osszeg.className = "fw-bold";
        osszeg.textContent = penz(f.vegosszeg);
        lablec.appendChild(osszeg);
        lablec.appendChild(torlesGomb(f.id));
        kartya.appendChild(lablec);

        oszlop.appendChild(kartya);
        sor.appendChild(oszlop);
    });

    kiiras.appendChild(sor);
}


// ---------- 6. Rendezés ----------

function rendezes() {
    const mezo = rendezesMezo.value; // pl. "nev" vagy "vendegszam"

    foglalasok.sort(function (a, b) {
        let eredmeny;
        if (typeof a[mezo] === "number") {
            eredmeny = a[mezo] - b[mezo];                 // számok: kivonással
        } else {
            eredmeny = a[mezo].localeCompare(b[mezo], "hu"); // szöveg: magyar ábécé szerint (á, ő...)
        }
        return rendezesNovekvo ? eredmeny : -eredmeny;
    });

    // Következő kattintásra fordított irány, és ezt a gombon is jelezzük
    rendezesNovekvo = !rendezesNovekvo;
    rendezesGomb.textContent = rendezesNovekvo ? "Rendezés ↑" : "Rendezés ↓";

    megjelenites();
}

// Ha másik mezőt választ, kezdjük újra növekvő sorrenddel
rendezesMezo.addEventListener("change", function () {
    rendezesNovekvo = true;
    rendezesGomb.textContent = "Rendezés ↑";
});


// ---------- 7. Soft delete ----------
// Nem töröljük a tömbből (splice), csak megjelöljük. A szűrés kihagyja a töröltet.

function torles(id) {
    const foglalas = foglalasok.find(function (f) { return f.id === id; });
    if (!foglalas) return;

    if (!confirm(foglalas.nev + " foglalását biztosan törlöd?")) return;

    foglalas.torolt = true;
    megjelenites();

    uzenet.innerHTML = "";
    const doboz = document.createElement("div");
    doboz.className = "alert alert-success alert-dismissible fade show";
    doboz.textContent = foglalas.nev + " foglalása törölve.";
    const bezar = document.createElement("button");
    bezar.type = "button";
    bezar.className = "btn-close";
    bezar.setAttribute("data-bs-dismiss", "alert");
    bezar.setAttribute("aria-label", "Bezárás");
    doboz.appendChild(bezar);
    uzenet.appendChild(doboz);
}


// ---------- 8. Nézetváltás ----------

function nezetValtas(ujNezet) {
    nezet = ujNezet;
    // Az aktív gomb kiemelése (classList.toggle(osztaly, feltetel))
    tablazatGomb.classList.toggle("active", nezet === "tablazat");
    kartyaGomb.classList.toggle("active", nezet === "kartya");
    megjelenites();
}


// ---------- 9. Eseménykezelők + indítás ----------

keresesMezo.addEventListener("input", megjelenites);     // minden leütésre újraszűr
szuresDatumMezo.addEventListener("input", megjelenites);
rendezesGomb.addEventListener("click", rendezes);
tablazatGomb.addEventListener("click", function () { nezetValtas("tablazat"); });
kartyaGomb.addEventListener("click", function () { nezetValtas("kartya"); });

betoltes();
