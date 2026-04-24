function search_devices() {
  const input = document.getElementById('input');
  const table = document.getElementById('device_table');

  if (!input || !table) {
    return;
  }

  const filter = input.value.trim().toLowerCase();
  const rows = table.getElementsByTagName('tr');

  for (let index = 1; index < rows.length; index += 1) {
    const rowText = (rows[index].textContent || rows[index].innerText || '').toLowerCase();
    const shouldShow = filter === '' || rowText.includes(filter);

    rows[index].style.display = shouldShow ? '' : 'none';
  }
}

window.search_devices = search_devices;