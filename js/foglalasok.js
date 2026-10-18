// foglalasok oldal

let foglalasok = [];

const kiiras = document.getElementById("kiiras");


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
    let lista = [];

    for (let f of foglalasok) {
        if (f.torolt) continue;
        lista.push(f);
    }
    return lista;
}


function penz(szam) {
    return szam.toLocaleString("hu-HU") + " Ft";
}


function megjelenites() {
    let lista = szurtLista();

    tablazatKiiras(lista);
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


betoltes();
