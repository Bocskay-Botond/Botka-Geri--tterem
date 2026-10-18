// foglalasok oldal

let foglalasok = [];
let nezet = "tablazat";
let novekvo = true;

const kiiras = document.getElementById("kiiras");
const kereses = document.getElementById("kereses");
const szuresDatum = document.getElementById("szuresDatum");
const rendezesMezo = document.getElementById("rendezesMezo");
const rendezesGomb = document.getElementById("rendezesGomb");
const tablazatGomb = document.getElementById("tablazatGomb");
const kartyaGomb = document.getElementById("kartyaGomb");


async function betoltes() {
    try {
        const res = await fetch("./data/foglalasok.json");
        foglalasok = await res.json();
        megjelenites();
    } catch (err) {
        console.log(err);
        kiiras.innerHTML = `<div class="alert alert-danger">Nem sikerült betölteni a foglalásokat!</div>`;
    }
}


function szurtLista() {
    let keresett = kereses.value.toLowerCase();
    let datum = szuresDatum.value;
    let lista = [];

    for (let f of foglalasok) {
        if (f.torolt) continue;
        if (keresett != "" && !f.nev.toLowerCase().includes(keresett)) continue;
        if (datum != "" && f.datum != datum) continue;
        lista.push(f);
    }
    return lista;
}


function penz(szam) {
    return szam.toLocaleString("hu-HU") + " Ft";
}


function megjelenites() {
    let lista = szurtLista();

    if (lista.length == 0) {
        kiiras.innerHTML = `<div class="alert alert-info">Nincs találat.</div>`;
        return;
    }

    if (nezet == "tablazat") tablazatKiiras(lista);
    else kartyaKiiras(lista);
}


function tablazatKiiras(lista) {
    let html = `<div class="table-responsive">
    <table class="table table-striped table-hover align-middle">
        <thead class="table-dark">
            <tr>
                <th>Név</th>
                <th>Email</th>
                <th>Telefon</th>
                <th>Dátum</th>
                <th>Időpont</th>
                <th>Vendég</th>
                <th>Asztal</th>
                <th>Végösszeg</th>
            </tr>
        </thead>
        <tbody>`;

    for (let f of lista) {
        html += `<tr>
            <td>${f.nev}</td>
            <td>${f.email}</td>
            <td>${f.telefon}</td>
            <td>${f.datum}</td>
            <td>${f.idopont}</td>
            <td>${f.vendegszam} fő</td>
            <td>${f.asztalId}. asztal</td>
            <td>${penz(f.vegosszeg)}</td>
        </tr>`;
    }

    html += "</tbody></table></div>";
    kiiras.innerHTML = html;
}


function kartyaKiiras(lista) {
    let html = `<div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">`;

    for (let f of lista) {
        html += `<div class="col">
            <div class="card h-100 shadow-sm foglalas-kartya">
                <div class="card-body">
                    <h5 class="card-title">${f.nev}</h5>
                    <h6 class="card-subtitle mb-3 text-body-secondary">${f.datum}, ${f.idopont}</h6>
                    <p class="mb-1"><b>Vendégek:</b> ${f.vendegszam} fő</p>
                    <p class="mb-1"><b>Asztal:</b> ${f.asztalId}. asztal</p>
                    <p class="mb-1"><b>Email:</b> ${f.email}</p>
                    <p class="mb-0"><b>Telefon:</b> ${f.telefon}</p>
                </div>
                <div class="card-footer d-flex justify-content-between align-items-center">
                    <b>${penz(f.vegosszeg)}</b>
                </div>
            </div>
        </div>`;
    }

    html += "</div>";
    kiiras.innerHTML = html;
}


function rendezes() {
    let mezo = rendezesMezo.value;

    foglalasok.sort(function (a, b) {
        let e;
        if (mezo == "vendegszam" || mezo == "vegosszeg") {
            e = a[mezo] - b[mezo];
        } else {
            e = a[mezo].localeCompare(b[mezo], "hu");
        }
        return novekvo ? e : -e;
    });

    novekvo = !novekvo;
    rendezesGomb.textContent = novekvo ? "Rendezés ↑" : "Rendezés ↓";

    megjelenites();
}

rendezesMezo.addEventListener("change", function () {
    novekvo = true;
    rendezesGomb.textContent = "Rendezés ↑";
});


function nezetValtas(uj) {
    nezet = uj;
    if (nezet == "tablazat") {
        tablazatGomb.classList.add("active");
        kartyaGomb.classList.remove("active");
    } else {
        kartyaGomb.classList.add("active");
        tablazatGomb.classList.remove("active");
    }
    megjelenites();
}


kereses.addEventListener("input", megjelenites);
szuresDatum.addEventListener("input", megjelenites);
rendezesGomb.addEventListener("click", rendezes);
tablazatGomb.addEventListener("click", () => nezetValtas("tablazat"));
kartyaGomb.addEventListener("click", () => nezetValtas("kartya"));

betoltes();
