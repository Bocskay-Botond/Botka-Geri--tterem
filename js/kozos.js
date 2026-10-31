document.addEventListener('DOMContentLoaded', () => {
    const felGomb = document.getElementById('felGomb');
    if (felGomb) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 200) {
                felGomb.classList.add('lathato');
            } else {
                felGomb.classList.remove('lathato');
            }
        });

        felGomb.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    const form = document.getElementById('foglalasForm');
    if (!form) return;
    const nevInput = document.getElementById('nev');
    const emailInput = document.getElementById('email');
    const telefonInput = document.getElementById('telefon');
    const datumInput = document.getElementById('datum');
    const idopontSelect = document.getElementById('idopont');
    const asztalSelect = document.getElementById('asztal');
    const vendegszamInput = document.getElementById('vendegszam');
    const menuOpcioSelect = document.getElementById('menuOpcio');
    const osszegKijelzo = document.getElementById('osszegKijelzo');
    const alertBox = document.getElementById('alertBox');
    const sikerKartya = document.getElementById('sikerKartya');
    const foglalasReszletek = document.getElementById('foglalasReszletek');
    const ujFoglalasGomb = document.getElementById('ujFoglalasGomb');

    let asztalok = [];
    let jsonFoglalasok = [];
    let meglevoFoglalasok = JSON.parse(localStorage.getItem('foglalasok')) || [];

    fetch('./data/asztalok.json')
        .then(res => res.json())
        .then(adat => {
            asztalok = adat;
            return fetch('./data/foglalasok.json');
        })
        .then(res => res.json())
        .then(adat => {
            jsonFoglalasok = adat.filter(f => !f.torolt);
            frissitAsztalValasztek();
        })
        .catch(err => {
            console.log(err);
            showAlert('Nem sikerült betölteni az asztalokat!', 'danger');
        });

    function osszesFoglalas() {
        return jsonFoglalasok.concat(meglevoFoglalasok);
    }

    const most = new Date();
    let honap = most.getMonth() + 1;
    let nap = most.getDate();
    if (honap < 10) honap = '0' + honap;
    if (nap < 10) nap = '0' + nap;
    const ma = most.getFullYear() + '-' + honap + '-' + nap;
    datumInput.setAttribute('min', ma);

    function szamoldOsszeg() {
        const vendegek = parseInt(vendegszamInput.value) || 0;
        const egysegAr = parseInt(menuOpcioSelect.value) || 0;
        const vegosszeg = vendegek * egysegAr;
        
        osszegKijelzo.textContent = vegosszeg.toLocaleString('hu-HU') + ' Ft';
    }

    vendegszamInput.addEventListener('input', szamoldOsszeg);
    menuOpcioSelect.addEventListener('change', szamoldOsszeg);

    function frissitAsztalValasztek() {
        const valasztottDatum = datumInput.value;
        const valasztottIdopont = idopontSelect.value;
        const vendegek = parseInt(vendegszamInput.value) || 0;
        const elozoAsztal = asztalSelect.value;

        asztalSelect.innerHTML = '';

        if (!valasztottDatum || !valasztottIdopont) {
            asztalSelect.innerHTML = '<option value="" selected disabled>Először válasszon dátumot és időpontot!</option>';
            return;
        }

        let elerhetoCount = 0;
        asztalSelect.innerHTML = '<option value="" selected disabled>Válasszon asztalt...</option>';

        asztalok.forEach(asztal => {
            const isFoglalt = osszesFoglalas().some(f =>
                f.datum === valasztottDatum &&
                f.idopont === valasztottIdopont &&
                parseInt(f.asztalId) === asztal.id
            );
            const tulKicsi = asztal.ferohely < vendegek;

            const option = document.createElement('option');
            option.value = asztal.id;
            const szoveg = `${asztal.nev} (${asztal.ferohely} fős, ${asztal.elhelyezkedes})`;

            if (isFoglalt) {
                option.textContent = `${szoveg} - [FOGLALT]`;
                option.disabled = true; // Nem választható ki!
            } else if (tulKicsi) {
                option.textContent = `${szoveg} - [TÚL KICSI]`;
                option.disabled = true;
            } else {
                option.textContent = szoveg;
                if (String(asztal.id) === elozoAsztal) {
                    option.selected = true;
                }
                elerhetoCount++;
            }
            asztalSelect.appendChild(option);
        });

        if (elerhetoCount === 0) {
            showAlert(`A kiválasztott időpontban nincs szabad asztal ${vendegek} főre! Kérjük, válasszon másik időpontot.`, 'danger');
        } else {
            rejtAlert();
        }
    }

    datumInput.addEventListener('change', frissitAsztalValasztek);
    idopontSelect.addEventListener('change', frissitAsztalValasztek);
    vendegszamInput.addEventListener('input', frissitAsztalValasztek);

    function validalEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    function validalTelefon(tel) {
        const re = /^(\+36|06)?[0-9]{8,9}$/;
        return re.test(tel.replace(/[\s\-\(\)]/g, ''));
    }

    function showAlert(uzenet, tipus = 'danger') {
        alertBox.className = `alert alert-${tipus} alert-dismissible fade show mb-4`;
        alertBox.innerHTML = `
            <strong>${tipus === 'danger' ? 'Hiba!' : 'Figyelem!'}</strong> ${uzenet}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Bezárás"></button>
        `;
        alertBox.classList.remove('d-none');
    }

    function rejtAlert() {
        alertBox.classList.add('d-none');
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        let vanHiba = false;

        const inputs = form.querySelectorAll('.form-control, .form-select');
        inputs.forEach(input => input.classList.remove('is-invalid'));

        if (!nevInput.value.trim()) {
            nevInput.classList.add('is-invalid');
            vanHiba = true;
        }

        if (!validalEmail(emailInput.value.trim())) {
            emailInput.classList.add('is-invalid');
            vanHiba = true;
        }

        if (!validalTelefon(telefonInput.value.trim())) {
            telefonInput.classList.add('is-invalid');
            vanHiba = true;
        }

        if (!datumInput.value || datumInput.value < ma) {
            datumInput.classList.add('is-invalid');
            vanHiba = true;
        }

        if (!idopontSelect.value) {
            idopontSelect.classList.add('is-invalid');
            vanHiba = true;
        }

        if (!asztalSelect.value) {
            asztalSelect.classList.add('is-invalid');
            vanHiba = true;
        }

        const vSzam = parseInt(vendegszamInput.value);
        if (isNaN(vSzam) || vSzam < 1 || vSzam > 10) {
            vendegszamInput.classList.add('is-invalid');
            vanHiba = true;
        }

        if (vanHiba) {
            showAlert('Kérjük, javítsa a pirossal jelölt mezőket a folytatáshoz!', 'danger');
            return;
        }

        rejtAlert();

        const valasztottAsztalObj = asztalok.find(a => a.id === parseInt(asztalSelect.value));
        const kiszamoltVegosszeg = parseInt(vendegszamInput.value) * parseInt(menuOpcioSelect.value);

        const ujFoglalas = {
            nev: nevInput.value.trim(),
            email: emailInput.value.trim(),
            telefon: telefonInput.value.trim(),
            datum: datumInput.value,
            idopont: idopontSelect.value,
            asztalId: parseInt(asztalSelect.value),
            asztalNev: valasztottAsztalObj ? valasztottAsztalObj.nev : '',
            vendegszam: vendegszamInput.value,
            vegosszeg: kiszamoltVegosszeg,
            megjegyzes: document.getElementById('megjegyzes').value.trim()
        };

        // Mentés localstorage-ba
        meglevoFoglalasok.push(ujFoglalas);
        localStorage.setItem('foglalasok', JSON.stringify(meglevoFoglalasok));

        foglalasReszletek.innerHTML = `
            <ul class="list-group list-group-flush">
                <li class="list-group-item"><strong>Név:</strong> ${ujFoglalas.nev}</li>
                <li class="list-group-item"><strong>E-mail:</strong> ${ujFoglalas.email}</li>
                <li class="list-group-item"><strong>Telefonszám:</strong> ${ujFoglalas.telefon}</li>
                <li class="list-group-item"><strong>Időpont:</strong> ${ujFoglalas.datum} - ${ujFoglalas.idopont}</li>
                <li class="list-group-item"><strong>Lefoglalt ülőhely:</strong> ${ujFoglalas.asztalNev}</li>
                <li class="list-group-item"><strong>Vendégek száma:</strong> ${ujFoglalas.vendegszam} fő</li>
                <li class="list-group-item"><strong>Fizetendő összeg:</strong> ${ujFoglalas.vegosszeg.toLocaleString('hu-HU')} Ft</li>
                ${ujFoglalas.megjegyzes ? `<li class="list-group-item"><strong>Megjegyzés:</strong> ${ujFoglalas.megjegyzes}</li>` : ''}
            </ul>
        `;

        form.classList.add('d-none');
        sikerKartya.classList.remove('d-none');
    });

    ujFoglalasGomb.addEventListener('click', () => {
        form.reset();
        szamoldOsszeg();
        sikerKartya.classList.add('d-none');
        form.classList.remove('d-none');
        asztalSelect.innerHTML = '<option value="" selected disabled>Válasszon dátumot és időpontot először...</option>';
    });

    szamoldOsszeg();
});