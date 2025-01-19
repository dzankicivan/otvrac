

async function fetchData(filter = '', field = '') {
    const response = await fetch(`/api/players?search=${filter}&field=${field}`);
    const data = await response.json();
    const tableBody = document.getElementById('table-body');
    tableBody.innerHTML = data.response.map(player => `
        <tr>
            <td>${player.first_name}</td>
            <td>${player.last_name}</td>
            <td>${player.position}</td>
            <td>${player.jersey_number}</td>
            <td>${player.height_cm}</td>
            <td>${player.weight_kg}</td>
            <td>${player.birth_date}</td>
            <td>${player.nationality}</td>
            <td>${player.team}</td>
        </tr>`).join('');
}


function applyFilter() {
    const filterValue = document.getElementById('filter-input').value;
    const filterField = document.getElementById('field-select').value;
    fetchData(filterValue, filterField);
}


async function downloadData(format) {
    const filterValue = document.getElementById('filter-input').value;
    const filterField = document.getElementById('field-select').value;
    const response = await fetch(`/api/download?format=${format}&search=${filterValue}&field=${filterField}`);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nba_players_filtered.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

window.onload = () => fetchData();
