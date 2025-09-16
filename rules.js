// Aplica TODAS las reglas guardadas
function aplicarReglas(mov) {
  const reglas = leerReglas();
  for (const r of reglas) {
    if (!mov.categoria && mov.concepto.toLowerCase().includes(r.palabra.toLowerCase())) {
      mov.categoria = r.categoria;
      break; // primera coincidencia
    }
  }
  return mov;
}

// CRUD de reglas
function agregarRegla() {
  const palabra = document.getElementById('txtPalabra').value.trim();
  const cat     = document.getElementById('txtCat').value.trim();
  if (!palabra || !cat) return;

  const reglas = leerReglas();
  reglas.push({ palabra, categoria: cat });
  guardarReglas(reglas);

  renderizarReglas();
  // limpiar
  document.getElementById('txtPalabra').value = '';
  document.getElementById('txtCat').value   = '';
}

function borrarRegla(index) {
  const reglas = leerReglas();
  reglas.splice(index, 1);
  guardarReglas(reglas);
  renderizarReglas();
}

// Pintar reglas
function renderizarReglas() {
  const reglas = leerReglas();
  const ul = document.getElementById('listaReglas');
  ul.innerHTML = '';

  reglas.forEach((r, i) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span>Si contiene <b>${r.palabra}</b> → categoría <b>${r.categoria}</b></span>
      <button onclick="borrarRegla(${i})">❌</button>
    `;
    ul.appendChild(li);
  });
}