// =====================================================================
// urlap-validacio.js – a foglalási űrlap "Boti-féle" fele
//
// Geri része (urlap-asztalok.js): az űrlap HTML-je, vendégszám → asztal lista,
// élő végösszeg. Ez a fájl:
//   1. foglaltAsztalok(datum, idopont) – Geri ezt hívja az asztal lista szűréséhez
//   2. Validáció (üres mezők, email, telefon, dátum, időpont, foglalt asztal)
//   3. Beküldés: preventDefault, új foglalás push-olása, sikeres visszajelzés
//
// Egyeztetett id-k az űrlapban:
//   form:   foglalasUrlap
//   mezők:  nev, email, telefon, datum, idopont, vendegszam, asztal, osszeg
// =====================================================================


// ---------- 1. Foglalások betöltése ----------
// Az űrlap másik oldalon van, mint a foglalások listája, ezért itt is be kell olvasni a JSON-t.

let urlapFoglalasok = [];

fetch("./data/foglalasok.json")
    .then(function (valasz) {
        if (!valasz.ok) throw new Error("HTTP hiba: " + valasz.status);
        return valasz.json();
    })
    .then(function (adat) {
        urlapFoglalasok = adat;
    })
    .catch(function (hiba) {
        console.error("A foglalások betöltése nem sikerült:", hiba);
    });


// ---------- 2. A "szerződés" Gerivel ----------
// Bemenet: dátum ("2026-10-10") és időpont ("18:00")
// Kimenet: a foglalt asztalok id-jainak tömbje, pl. [1, 3]
// A törölt foglalások nem számítanak (soft delete!).

function foglaltAsztalok(datum, idopont) {
    return urlapFoglalasok
        .filter(function (f) {
            return !f.torolt && f.datum === datum && f.idopont === idopont;
        })
        .map(function (f) {
            return f.asztalId;
        });
}


// ---------- 3. Segédfüggvények ----------

// A mai dátum "ÉÉÉÉ-HH-NN" alakban, HELYI idő szerint.
// (A toISOString() UTC-ben számol, ezért éjfél körül rossz napot adhatna.)
function maiDatum() {
    const most = new Date();
    const ev = most.getFullYear();
    const honap = String(most.getMonth() + 1).padStart(2, "0"); // a hónap 0-tól számozódik!
    const nap = String(most.getDate()).padStart(2, "0");
    return ev + "-" + honap + "-" + nap;
}

// Mezőt pirosra állít, és alá írja a hibaüzenetet (Bootstrap: is-invalid + invalid-feedback)
function hibaJelzes(mezo, szoveg) {
    mezo.classList.add("is-invalid");

    // Ha még nincs a mező után visszajelző div, létrehozzuk
    let visszajelzes = mezo.parentElement.querySelector(".invalid-feedback");
    if (!visszajelzes) {
        visszajelzes = document.createElement("div");
        visszajelzes.className = "invalid-feedback";
        mezo.insertAdjacentElement("afterend", visszajelzes);
    }
    visszajelzes.textContent = szoveg;
}

function hibaTorles(mezo) {
    mezo.classList.remove("is-invalid");
}

// A végösszeg mezőt Geri kezeli; lehet input (value) vagy span (textContent).
// Mindkét esetben kiszedjük belőle a számjegyeket: "6 000 Ft" → 6000
function osszegKiolvasas(elem) {
    if (!elem) return 0;
    const szoveg = elem.value !== undefined ? elem.value : elem.textContent;
    return Number(String(szoveg).replace(/\D/g, "")) || 0;
}


// ---------- 4. Validáció ----------
// Visszaad egy tömböt a hibaüzenetekkel. Ha üres a tömb, minden rendben.

const EMAIL_MINTA = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Magyar telefonszám: +36 vagy 06, utána 8-9 számjegy (szóközök, kötőjelek nélkül)
const TELEFON_MINTA = /^(\+36|06)\d{8,9}$/;

function validalas(m) {
    const hibak = [];

    // --- Üres mezők ---
    const kotelezok = [
        [m.nev, "Add meg a neved!"],
        [m.email, "Add meg az email-címed!"],
        [m.telefon, "Add meg a telefonszámod!"],
        [m.datum, "Válassz dátumot!"],
        [m.idopont, "Válassz időpontot!"],
        [m.vendegszam, "Add meg a vendégek számát!"],
        [m.asztal, "Válassz asztalt!"],
    ];
    kotelezok.forEach(function (par) {
        const mezo = par[0];
        if (mezo.value.trim() === "") {
            hibaJelzes(mezo, par[1]);
            hibak.push(par[1]);
        }
    });

    // --- Formátumok (csak ha nem üres, különben dupla hibaüzenet lenne) ---
    if (m.nev.value.trim() !== "" && m.nev.value.trim().length < 3) {
        hibaJelzes(m.nev, "A név legalább 3 karakter legyen!");
        hibak.push("A név túl rövid.");
    }

    if (m.email.value.trim() !== "" && !EMAIL_MINTA.test(m.email.value.trim())) {
        hibaJelzes(m.email, "Hibás email-cím (pl. nev@pelda.hu)!");
        hibak.push("Hibás email-cím.");
    }

    const telefonTiszta = m.telefon.value.replace(/[\s-]/g, ""); // szóközök, kötőjelek ki
    if (telefonTiszta !== "" && !TELEFON_MINTA.test(telefonTiszta)) {
        hibaJelzes(m.telefon, "Hibás telefonszám (pl. +36 30 123 4567)!");
        hibak.push("Hibás telefonszám.");
    }

    // --- Dátum: nem lehet múltbeli, és hétfőn zárva vagyunk ---
    if (m.datum.value !== "") {
        if (m.datum.value < maiDatum()) {
            // "ÉÉÉÉ-HH-NN" szövegeket lehet sima < jellel hasonlítani!
            hibaJelzes(m.datum, "Múltbeli napra nem lehet foglalni!");
            hibak.push("Múltbeli dátum.");
        } else if (new Date(m.datum.value + "T00:00").getDay() === 1) {
            // getDay(): 0 = vasárnap, 1 = hétfő, ... 6 = szombat
            hibaJelzes(m.datum, "Hétfőn zárva vagyunk!");
            hibak.push("Hétfőn zárva.");
        }
    }

    // --- Időpont: ha ma foglal, nem lehet már elmúlt időpont ---
    if (m.datum.value === maiDatum() && m.idopont.value !== "") {
        const most = new Date();
        const mostIdo = String(most.getHours()).padStart(2, "0") + ":" + String(most.getMinutes()).padStart(2, "0");
        if (m.idopont.value <= mostIdo) {
            hibaJelzes(m.idopont, "Ez az időpont ma már elmúlt!");
            hibak.push("Elmúlt időpont.");
        }
    }

    // --- Vendégszám: egész szám 1 és 10 között ---
    if (m.vendegszam.value !== "") {
        const fo = Number(m.vendegszam.value);
        if (!Number.isInteger(fo) || fo < 1 || fo > 10) {
            hibaJelzes(m.vendegszam, "1 és 10 fő között lehet foglalni!");
            hibak.push("Hibás vendégszám.");
        }
    }

    // --- Biztonsági ellenőrzés: közben nem foglalták-e le az asztalt? ---
    if (m.asztal.value !== "" && m.datum.value !== "" && m.idopont.value !== "") {
        const foglaltak = foglaltAsztalok(m.datum.value, m.idopont.value);
        if (foglaltak.includes(Number(m.asztal.value))) {
            hibaJelzes(m.asztal, "Ez az asztal ebben az időpontban már foglalt!");
            hibak.push("Foglalt asztal.");
        }
    }

    return hibak;
}


// ---------- 5. Visszajelző doboz (alert) az űrlap fölött ----------

function uzenetDoboz(urlap) {
    let doboz = document.getElementById("urlapUzenet");
    if (!doboz) {
        doboz = document.createElement("div");
        doboz.id = "urlapUzenet";
        urlap.insertAdjacentElement("beforebegin", doboz);
    }
    return doboz;
}

function hibaUzenetKiiras(doboz, hibak) {
    doboz.innerHTML = "";
    const alert = document.createElement("div");
    alert.className = "alert alert-danger";
    alert.setAttribute("role", "alert");

    const cim = document.createElement("strong");
    cim.textContent = "Kérjük, javítsd a következőket:";
    alert.appendChild(cim);

    const ul = document.createElement("ul");
    ul.className = "mb-0 mt-2";
    hibak.forEach(function (h) {
        const li = document.createElement("li");
        li.textContent = h;
        ul.appendChild(li);
    });
    alert.appendChild(ul);
    doboz.appendChild(alert);
}

function sikerUzenetKiiras(doboz, f) {
    doboz.innerHTML = "";
    const alert = document.createElement("div");
    alert.className = "alert alert-success";
    alert.setAttribute("role", "alert");

    const cim = document.createElement("h5");
    cim.className = "alert-heading";
    cim.textContent = "Sikeres foglalás! 🎉";
    alert.appendChild(cim);

    const sorok = [
        ["Név", f.nev],
        ["Email", f.email],
        ["Telefon", f.telefon],
        ["Időpont", f.datum + ", " + f.idopont],
        ["Vendégek", f.vendegszam + " fő"],
        ["Asztal", f.asztalId + ". asztal"],
        ["Végösszeg", f.vegosszeg.toLocaleString("hu-HU") + " Ft"],
    ];
    const ul = document.createElement("ul");
    ul.className = "mb-0";
    sorok.forEach(function (par) {
        const li = document.createElement("li");
        const b = document.createElement("strong");
        b.textContent = par[0] + ": ";
        li.appendChild(b);
        li.appendChild(document.createTextNode(par[1]));
        ul.appendChild(li);
    });
    alert.appendChild(ul);
    doboz.appendChild(alert);
}


// ---------- 6. Indítás: eseménykezelők az űrlapra ----------

const urlap = document.getElementById("foglalasUrlap");

// Ha ezen az oldalon nincs űrlap, nem csinálunk semmit (így bárhova be lehet tölteni a fájlt)
if (urlap) {
    const mezok = {
        nev: document.getElementById("nev"),
        email: document.getElementById("email"),
        telefon: document.getElementById("telefon"),
        datum: document.getElementById("datum"),
        idopont: document.getElementById("idopont"),
        vendegszam: document.getElementById("vendegszam"),
        asztal: document.getElementById("asztal"),
    };
    const osszegElem = document.getElementById("osszeg");

    // A dátumválasztóban a múltbeli napok eleve ne legyenek kattinthatók
    mezok.datum.min = maiDatum();

    // Ha a felhasználó javít egy mezőt, tűnjön el róla a piros jelzés
    Object.values(mezok).forEach(function (mezo) {
        mezo.addEventListener("input", function () { hibaTorles(mezo); });
        mezo.addEventListener("change", function () { hibaTorles(mezo); });
    });

    // novalidate: a böngésző saját buborékjai helyett a mi Bootstrap-os jelzésünk látszik
    urlap.setAttribute("novalidate", "");

    urlap.addEventListener("submit", function (esemeny) {
        esemeny.preventDefault(); // ne töltse újra az oldalt!

        const doboz = uzenetDoboz(urlap);
        Object.values(mezok).forEach(hibaTorles);

        const hibak = validalas(mezok);
        if (hibak.length > 0) {
            hibaUzenetKiiras(doboz, hibak);
            doboz.scrollIntoView({ behavior: "smooth", block: "center" });
            return;
        }

        // Minden rendben: új foglalás objektum, ugyanazokkal a kulcsokkal, mint a JSON-ban
        const ujId = urlapFoglalasok.reduce(function (max, f) { return Math.max(max, f.id); }, 0) + 1;
        const uj = {
            id: ujId,
            nev: mezok.nev.value.trim(),
            email: mezok.email.value.trim(),
            telefon: mezok.telefon.value.trim(),
            datum: mezok.datum.value,
            idopont: mezok.idopont.value,
            vendegszam: Number(mezok.vendegszam.value),
            asztalId: Number(mezok.asztal.value),
            vegosszeg: osszegKiolvasas(osszegElem),
            torolt: false,
        };

        // "Elküldés" szimulálása: hozzáadjuk a memóriában lévő tömbhöz
        urlapFoglalasok.push(uj);
        console.log("Új foglalás mentve (memóriában):", uj);

        sikerUzenetKiiras(doboz, uj);
        doboz.scrollIntoView({ behavior: "smooth", block: "center" });
        urlap.reset();
        mezok.datum.min = maiDatum();
    });
}
