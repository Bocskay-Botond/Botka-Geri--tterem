// urlap ellenorzes + bekuldes
// a foglaltAsztalok() fv-t Geri hivja az asztal listahoz

let urlapFoglalasok = [];

fetch("./data/foglalasok.json")
    .then(res => res.json())
    .then(adat => urlapFoglalasok = adat)
    .catch(err => console.log(err));


function foglaltAsztalok(datum, idopont) {
    let foglalt = [];
    for (let f of urlapFoglalasok) {
        if (!f.torolt && f.datum == datum && f.idopont == idopont) {
            foglalt.push(f.asztalId);
        }
    }
    return foglalt;
}


function maiDatum() {
    let d = new Date();
    let ho = d.getMonth() + 1;
    let nap = d.getDate();
    if (ho < 10) ho = "0" + ho;
    if (nap < 10) nap = "0" + nap;
    return d.getFullYear() + "-" + ho + "-" + nap;
}


function hibaJelzes(mezo, szoveg) {
    mezo.classList.add("is-invalid");

    let div = mezo.parentElement.querySelector(".invalid-feedback");
    if (div == null) {
        div = document.createElement("div");
        div.className = "invalid-feedback";
        mezo.parentElement.appendChild(div);
    }
    div.textContent = szoveg;
}


// Geri osszeg mezojebol kiszedi a szamot ("6 000 Ft" -> 6000)
function osszegKiolvasas(elem) {
    if (elem == null) return 0;
    let szoveg = elem.tagName == "INPUT" ? elem.value : elem.textContent;
    return Number(szoveg.replace(/\D/g, "")) || 0;
}


function validalas(m) {
    let hibak = [];

    function hiba(mezo, szoveg) {
        hibaJelzes(mezo, szoveg);
        hibak.push(szoveg);
    }

    let nev = m.nev.value.trim();
    if (nev == "") hiba(m.nev, "Add meg a neved!");
    else if (nev.length < 3) hiba(m.nev, "A név legalább 3 karakter legyen!");

    let email = m.email.value.trim();
    if (email == "") hiba(m.email, "Add meg az email címed!");
    else if (!/^\S+@\S+\.\S{2,}$/.test(email)) hiba(m.email, "Hibás email cím!");

    let tel = m.telefon.value.replaceAll(" ", "").replaceAll("-", "");
    if (tel == "") hiba(m.telefon, "Add meg a telefonszámod!");
    else if (!/^(\+36|06)\d{8,9}$/.test(tel)) hiba(m.telefon, "Hibás telefonszám! (pl. +36 30 123 4567)");

    let datum = m.datum.value;
    if (datum == "") hiba(m.datum, "Válassz dátumot!");
    else if (datum < maiDatum()) hiba(m.datum, "Múltbeli napra nem lehet foglalni!");
    else if (new Date(datum).getDay() == 1) hiba(m.datum, "Hétfőn zárva vagyunk!");

    let idopont = m.idopont.value;
    if (idopont == "") {
        hiba(m.idopont, "Válassz időpontot!");
    } else if (datum == maiDatum()) {
        let most = new Date();
        let ora = most.getHours();
        let perc = most.getMinutes();
        if (ora < 10) ora = "0" + ora;
        if (perc < 10) perc = "0" + perc;
        if (idopont <= ora + ":" + perc) hiba(m.idopont, "Ez az időpont ma már elmúlt!");
    }

    let fo = Number(m.vendegszam.value);
    if (m.vendegszam.value == "") hiba(m.vendegszam, "Add meg hány főre foglalsz!");
    else if (fo < 1 || fo > 10) hiba(m.vendegszam, "1 és 10 fő között lehet foglalni!");

    if (m.asztal.value == "") {
        hiba(m.asztal, "Válassz asztalt!");
    } else if (foglaltAsztalok(datum, idopont).includes(Number(m.asztal.value))) {
        hiba(m.asztal, "Ez az asztal már foglalt ekkor!");
    }

    return hibak;
}
