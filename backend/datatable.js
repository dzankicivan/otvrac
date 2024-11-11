async function fetchData() {
    const response = await fetch('/api/players');
    const data = await response.json();
    displayData(data);
}

function applyFilter() {
    const searchValue = document.getElementById('searchValue').value.toLowerCase();
    const searchField = document.getElementById('searchField').value;

    fetch('/api/players')
        .then(response => response.json())
        .then(data => {
            const filteredData = data.filter(player => {
                if (!searchValue) return true;
                if (searchField) {
                    return player[searchField]?.toLowerCase().includes(searchValue);
                } else {
                    return Object.values(player).some(value => value.toLowerCase().includes(searchValue));
                }
            });
            displayData(filteredData);
        });
}

function displayData(data) {
    const tableBody = document.getElementById('dataTable').querySelector('tbody');
    tableBody.innerHTML = '';
    data.forEach(player => {
        const row = `<tr>
            <td>${player.Ime}</td>
            <td>${player.Prezime}</td>
            <td>${player.Pozicija}</td>
            <td>${player.Broj_dresa}</td>
            <td>${player.Visina}</td>
            <td>${player.Težina}</td>
            <td>${player.Datum_rođenja}</td>
            <td>${player.Nacionalnost}</td>
            <td>${player.Team}</td>
        </tr>`;
        tableBody.insertAdjacentHTML('beforeend', row);
    });
}

function downloadData(format) {
    fetch(`/api/download?format=${format}`)
        .then(response => response.blob())
        .then(obj => {
            const url = window.URL.createObjectURL(obj);
            const a = document.createElement('a');
            a.href = url;
            a.download = `nba_players.${format}`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        });
}

window.onload = fetchData;
