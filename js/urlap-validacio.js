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
