function agregarMovimiento() {
  const concepto = document.getElementById('concepto').value.trim();
  const cantidad = parseFloat(document.getElementById('cantidad').value);
  const tipo = document.getElementById('tipo').value;

  let categoria = document.getElementById('categoria').value;
  if (categoria === 'Otro') {
    categoria = document.getElementById('nuevaCategoria').value.trim();
    if (categoria) {
      agregarCategoriaNueva(); // guarda y actualiza el select
      document.getElementById('categoria').value = categoria; // selecciona la nueva
    }
  }

  // Fecha y banco (igual que antes)
  let fechaInput = document.getElementById('fechaMov').value;
  let fecha = fechaInput ? new Date(fechaInput + 'T12:00:00') : new Date();

  const bancoRaw = agregarBancoSiEsNecesario();
  const banco = (bancoRaw && typeof bancoRaw === 'string') ? bancoRaw : '(Sin banco)';

  // Crear movimiento
  const mov = {
    concepto,
    cantidad,
    tipo,
    categoria: categoria || undefined,
    fecha: fecha.toISOString(),
    banco: banco
  };

  const lista = leerDatos();
  lista.push(mov);
  guardarDatos(lista);

  renderizar();
  limpiarForm();
}

function calcularSaldo() {
  const lista = leerDatos();
  return lista.reduce((acc, m) =>
    acc + (m.tipo === 'ingreso' ? m.cantidad : -m.cantidad), 0);
}

function actualizarSaldo() {
  document.getElementById('saldo').textContent = '$' + calcularSaldo().toFixed(2);

  const umbral = 500; // <-- cambiá este número al que quieras
  const alerta = document.getElementById('alertaSaldo');
  const saldoActual = calcularSaldo();
  document.getElementById('umbralAlerta').textContent = umbral;

  if (saldoActual < umbral) {
  alerta.style.display = 'block';
  } else {
  alerta.style.display = 'none';
}
}

function renderizar() {
  const lista = leerDatos();
  const ul = document.getElementById('lista');
  ul.innerHTML = '';

  const filtro = document.getElementById('filtroBanco').value;
  const texto = document.getElementById('txtBuscar').value.trim().toLowerCase();

  const listaFiltrada = lista.filter(m =>
    (filtro ? (m.banco || '(Sin banco)') === filtro : true) &&
    (texto ? (m.concepto + (m.categoria || '') + (m.banco || '')).toLowerCase().includes(texto) : true)
  );

  listaFiltrada.forEach(m => {
    const li = document.createElement('li');
    li.innerHTML = `
  <div style="display:flex; flex-direction:column; gap:.25rem; flex:1;">
    <input type="text" value="${m.concepto}" 
           onblur="guardarCambio(${lista.indexOf(m)}, 'concepto', this.value)"
           onkeypress="if(event.key==='Enter') this.blur();"
           style="width:100%; border:none; background:transparent; font:inherit;">
    <div style="font-size:.75rem; color:var(--text-light);">
      ${m.categoria || 'Sin cat'} · ${m.banco || 'Sin banco'} · ${new Date(m.fecha).toLocaleDateString()}
    </div>
  </div>
  <span>
    <input type="number" value="${m.cantidad}" step="0.01"
           onblur="guardarCambio(${lista.indexOf(m)}, 'cantidad', parseFloat(this.value))"
           onkeypress="if(event.key==='Enter') this.blur();"
           style="width:100%; border:none; background:transparent; font:inherit; text-align:right;">
  </span>
  <button onclick="borrar(${lista.indexOf(m)})">❌</button>
`;
    ul.appendChild(li);
  });

  actualizarSaldo();
  actualizarGrafico();
  actualizarBarChart();
  actualizarResumenBancosCompleto();
}

function limpiarForm() {
  document.getElementById('concepto').value = '';
  document.getElementById('cantidad').value = '';
  document.getElementById('tipo').value = 'ingreso'; // resetea a valor por defecto
  document.getElementById('categoria').value = '';    // vuelve a "(automática)"
  document.getElementById('nuevaCategoria').value = ''; // limpia input oculto
  document.getElementById('nuevaCategoria').style.display = 'none'; // lo oculta
  document.getElementById('banco').value = '';         // vuelve a "(Sin banco)"
  document.getElementById('nuevoBanco').value = '';     // limpia input oculto
  document.getElementById('nuevoBanco').style.display = 'none'; // lo oculta
  document.getElementById('fechaMov').value = '';      // limpia fecha

  // Opcional: enfocar de nuevo en concepto para flujo rápido
  document.getElementById('concepto').focus();
}

function borrar(index) {
  const lista = leerDatos();
  lista.splice(index, 1);
  guardarDatos(lista);
  renderizar();
}

// Cargar lista al iniciar
renderizar();

function cargarSelectBancos() {
  const bancos = leerBancos();
  const select = document.getElementById('banco');
  // conservamos “(Sin banco)” y “+ Nuevo…”
  const sinBanco = select.options[0];
  const nuevoOpt = select.options[select.options.length - 1];
  select.innerHTML = '';
  select.appendChild(sinBanco);
  bancos.forEach(b => {
    const opt = document.createElement('option');
    opt.value = b;
    opt.textContent = b;
    select.appendChild(opt);
  });
  select.appendChild(nuevoOpt);

  cargarSelectBancoRegla(); // para mantener sincronizado
  cargarSelectEliminarBancos(); // y también el de eliminación
}

function agregarBancoSiEsNecesario() {
  let banco = document.getElementById('banco').value;
  if (banco === 'Otro') {
    banco = document.getElementById('nuevoBanco').value.trim();
    if (banco) {
      const bancos = leerBancos();
      if (!bancos.includes(banco)) {
        bancos.push(banco);
        guardarBancos(bancos);
        cargarSelectBancos();
        cargarSelectBancoRegla(); // para que también aparezca en reglas
      }
      document.getElementById('banco').value = banco;
    }
  }
  return banco;
}

// mostrar/ocultar campo nuevo banco
document.getElementById('banco').addEventListener('change', e => {
  document.getElementById('nuevoBanco').style.display =
    e.target.value === 'Otro' ? 'block' : 'none';
});

renderizarReglas();

function renderizarResumenBancos() {
  const lista = leerDatos();
  const filtro = document.getElementById('filtroBanco').value;
  const bancos = [...new Set(lista.map(m => (m.banco && typeof m.banco === 'string' ? m.banco : '(Sin banco)')))];

  // llenar select filtro
  const selectFiltro = document.getElementById('filtroBanco');
  const actual = selectFiltro.value;
  selectFiltro.innerHTML = '<option value="">Todos los bancos</option>';
  bancos.forEach(b => {
    const opt = document.createElement('option');
    opt.value = b;
    opt.textContent = b;
    selectFiltro.appendChild(opt);
  });
  selectFiltro.value = actual;

  // calcular saldo por banco
  const ul = document.getElementById('listaBancos');
  ul.innerHTML = '';
  bancos.forEach(b => {
    const ingresos = lista
      .filter(m => (m.banco || '(Sin banco)') === b && m.tipo === 'ingreso')
      .reduce((s, m) => s + m.cantidad, 0);
    const gastos = lista
      .filter(m => (m.banco || '(Sin banco)') === b && m.tipo === 'gasto')
      .reduce((s, m) => s + m.cantidad, 0);
    const saldo = ingresos - gastos;

    const nombreBanco = (b === '(Sin banco)' || !b || typeof b !== 'string') ? '(Sin banco)' : b;
    const li = document.createElement('li');
    li.innerHTML = `<span>${nombreBanco}</span><span>$${saldo.toFixed(2)}</span>`;
    ul.appendChild(li);
  });
}

cargarSelectBancos();
renderizarResumenBancos();

document.getElementById('filtroBanco').addEventListener('change', () => {
  renderizar();          // lista principal filtrada
  renderizarResumenBancos();
});

function guardarCambio(index, campo, valor) {
  if (isNaN(valor) && campo === 'cantidad') return; // validación simple
  const lista = leerDatos();
  lista[index][campo] = valor;
  guardarDatos(lista);
  renderizar();   // repintamos con los nuevos valores
}

function exportarCSV() {
  const lista = leerDatos();
  if (!lista.length) return alert('No hay movimientos para exportar');

  // Encabezado
  let csv = 'Concepto,Cantidad,Tipo,Categoría,Banco,Fecha\n';
  lista.forEach(m => {
    csv += `"${m.concepto}",${m.cantidad},${m.tipo},${m.categoria || ''},${m.banco || ''},${m.fecha}\n`;
  });

  // Crear archivo y descargar
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', 'agenda_bancaria.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function actualizarGrafico() {
  if (typeof Chart === 'undefined') return;
  const lista = leerDatos();
  // Solo gastos
  const gastos = lista.filter(m => m.tipo === 'gasto');
  // Sumar por categoría
  const totales = {};
  gastos.forEach(m => {
    const cat = m.categoria || 'Sin categoría';
    totales[cat] = (totales[cat] || 0) + m.cantidad;
  });

  const labels = Object.keys(totales);
  const data   = Object.values(totales);

  // Si ya existe gráfico lo destruimos
  if (window.miGrafico) window.miGrafico.destroy();

  window.miGrafico = new Chart(document.getElementById('torta'), {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: ['#0b57d0','#018642','#b00020','#ff9800','#9c27b0']
      }]
    },
    options: { plugins: { legend: { position: 'bottom' } } }
  });
}

// Aplicar tema guardado (si existe)
(function aplicarTemaInicial() {
  const guardado = localStorage.getItem('agendaTema');
  if (guardado === 'claro') document.body.classList.add('modo-claro');
  else if (guardado === 'oscuro') document.body.classList.add('modo-oscuro');
  // si no hay nada, seguimos con el tema del sistema (ya estaba)
})();

// Botón cambiar tema
document.getElementById('btnTema').addEventListener('click', () => {
  const body = document.body;
  if (body.classList.contains('modo-claro')) {
    body.classList.remove('modo-claro');
    body.classList.add('modo-oscuro');
    localStorage.setItem('agendaTema', 'oscuro');
  } else if (body.classList.contains('modo-oscuro')) {
    body.classList.remove('modo-oscuro');
    localStorage.removeItem('agendaTema'); // vuelve al sistema
  } else {
    body.classList.add('modo-claro');
    localStorage.setItem('agendaTema', 'claro');
  }
});

function actualizarBarChart() {
  if (typeof Chart === 'undefined') return;

  const lista = leerDatos();
  // Agrupar por mes/año
  const ingresos = {};
  const gastos   = {};

  lista.forEach(m => {
    const fecha = new Date(m.fecha);
    const clave = fecha.getFullYear() + '-' + String(fecha.getMonth() + 1).padStart(2, '0'); // 2025-05
    if (m.tipo === 'ingreso') {
      ingresos[clave] = (ingresos[clave] || 0) + m.cantidad;
    } else {
      gastos[clave]   = (gastos[clave]   || 0) + m.cantidad;
    }
  });

  // Ordenar meses
  const meses = [...new Set([...Object.keys(ingresos), ...Object.keys(gastos)])].sort();

  const dataIng = meses.map(m => ingresos[m] || 0);
  const dataGas = meses.map(m => gastos[m]   || 0);

  // Destruir anterior si existe
  if (window.miBarChart) window.miBarChart.destroy();

  window.miBarChart = new Chart(document.getElementById('barChart'), {
    type: 'bar',
    data: {
      labels: meses,
      datasets: [
        {
          label: 'Ingresos',
          data: dataIng,
          backgroundColor: '#018642'
        },
        {
          label: 'Gastos',
          data: dataGas,
          backgroundColor: '#b00020'
        }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom' } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

function actualizarResumenBancosCompleto() {
  const lista = leerDatos();

  // 1) Disponibilidad total
  const totalGeneral = lista.reduce((acc, m) =>
    acc + (m.tipo === 'ingreso' ? m.cantidad : -m.cantidad), 0);
  document.getElementById('totalGeneral').textContent = totalGeneral.toFixed(2);

  // 2) Ingresos vs Gastos por banco (protegido)
  const bancos = [...new Set(lista.map(m => (m.banco && typeof m.banco === 'string' ? m.banco : '(Sin banco)')))];

  const tbody = document.querySelector('#tablaBancos tbody');
  tbody.innerHTML = '';

  bancos.forEach(b => {
    const ingresos = lista
      .filter(m => (m.banco || '(Sin banco)') === b && m.tipo === 'ingreso')
      .reduce((s, m) => s + m.cantidad, 0);
    const gastos = lista
      .filter(m => (m.banco || '(Sin banco)') === b && m.tipo === 'gasto')
      .reduce((s, m) => s + m.cantidad, 0);
    const saldo = ingresos - gastos;

    const fila = document.createElement('tr');
    const nombreBanco = (b === '(Sin banco)' || !b) ? '(Sin banco)' : b;
    fila.innerHTML = `
      <td>${nombreBanco}</td>
      <td style="text-align:right; color:var(--success)">+$${ingresos.toFixed(2)}</td>
      <td style="text-align:right; color:var(--danger)">-$${gastos.toFixed(2)}</td>
      <td style="text-align:right; font-weight:500">$${saldo.toFixed(2)}</td>
    `;
    tbody.appendChild(fila);
  });
}

function exportarExcel() {
  const lista = leerDatos();
  if (!lista.length) return alert('No hay movimientos para exportar');

  // Crear libro y hoja
  const wb = XLSX.utils.book_new();
  const wsData = [
    // Encabezado con estilo (más adelante aplicamos formato)
    ['Concepto', 'Cantidad', 'Tipo', 'Categoría', 'Banco', 'Fecha'],
  ];

  lista.forEach(m => {
    wsData.push([
      m.concepto,
      m.cantidad,
      m.tipo,
      m.categoria || '',
      m.banco || '',
      new Date(m.fecha).toLocaleDateString()
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Ancho de columnas
  ws['!cols'] = [
    { wch: 25 }, // Concepto
    { wch: 12 }, // Cantidad
    { wch: 10 }, // Tipo
    { wch: 15 }, // Categoría
    { wch: 15 }, // Banco
    { wch: 12 }  // Fecha
  ];

  // Aplicar estilo al encabezado (fila 0)
  const headerRange = XLSX.utils.decode_range(ws['!ref']);
  for (let c = headerRange.s.c; c <= headerRange.e.c; c++) {
    const cell = ws[XLSX.utils.encode_cell({ r: 0, c })];
    if (cell) {
      cell.s = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '0B57D0' } },
        alignment: { horizontal: 'center' }
      };
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Movimientos');

  // Descargar
  XLSX.writeFile(wb, 'Agenda_Bancaria.xlsx');
}

function mostrarSideTab(id) {
  document.querySelectorAll('.side-content').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.side-tab').forEach(btn => btn.classList.remove('active'));
  document.getElementById('side-' + id).classList.add('active');
  document.querySelector(`[onclick="mostrarSideTab('${id}')"]`).classList.add('active');
}
// pestaña inicial
mostrarSideTab('dashboard');

// ---- CREAR CATEGORÍA NUEVA ----
function agregarCategoriaNueva() {
  const input = document.getElementById('nuevaCategoria');
  const nombre = input.value.trim();
  if (!nombre) return;

  const bancos = leerBancos();          // ya tenés esta función
  const categorias = JSON.parse(localStorage.getItem('agenda_categorias') || '[]');

  if (!categorias.includes(nombre)) {
    categorias.push(nombre);
    localStorage.setItem('agenda_categorias', JSON.stringify(categorias));
  }

  // Actualizar selector sin recargar
  actualizarSelectCategorias();
  input.value = '';
  input.style.display = 'none';
  document.getElementById('categoria').value = nombre;
}

// Actualizar selector de categorías
function actualizarSelectCategorias() {
  const cats = JSON.parse(localStorage.getItem('agenda_categorias') || '[]');
  const select = document.getElementById('categoria');
  const optOtro = select.options[select.options.length - 1]; // guardamos “+ Nueva…”
  // borramos todo excepto “(automática)” y “+ Nueva…”
  while (select.options.length > 2) select.remove(1);
  // agregamos las nuevas
  cats.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    select.insertBefore(opt, optOtro);
  });

  cargarSelectEliminarCategorias();
}

// Llamar al cargar la página
document.addEventListener('DOMContentLoaded', actualizarSelectCategorias);

// Mostrar/ocultar campo de nueva categoría
document.getElementById('categoria').addEventListener('change', function(e) {
  const inputNuevaCategoria = document.getElementById('nuevaCategoria');
  if (e.target.value === 'Otro') {
    inputNuevaCategoria.style.display = 'block';
    inputNuevaCategoria.focus(); // Enfocar automáticamente para mejor UX
  } else {
    inputNuevaCategoria.style.display = 'none';
  }
});

function eliminarCategoria() {
  const select = document.getElementById('selectEliminarCategoria');
  const categoria = select.value;

  if (!categoria) {
    alert('Selecciona una categoría para eliminar.');
    return;
  }

  if (!confirm(`¿Seguro que quieres eliminar la categoría "${categoria}"? Los movimientos que la usan quedarán sin categoría.`)) {
    return;
  }

  // Eliminar de localStorage
  let categorias = JSON.parse(localStorage.getItem('agenda_categorias') || '[]');
  categorias = categorias.filter(c => c !== categoria);
  localStorage.setItem('agenda_categorias', JSON.stringify(categorias));

  // Eliminar de los movimientos existentes
  const lista = leerDatos();
  lista.forEach(m => {
    if (m.categoria === categoria) {
      m.categoria = undefined; // o '' si prefieres
    }
  });
  guardarDatos(lista);

  // Actualizar UI
  actualizarSelectCategorias();
  cargarSelectEliminarCategorias(); // actualiza el select de eliminación
  renderizar(); // actualiza la lista de movimientos

  alert(`Categoría "${categoria}" eliminada.`);
}

function cargarSelectEliminarCategorias() {
  const select = document.getElementById('selectEliminarCategoria');
  const categorias = JSON.parse(localStorage.getItem('agenda_categorias') || '[]');

  // Limpiar opciones excepto la primera
  while (select.options.length > 1) {
    select.remove(1);
  }

  // Agregar categorías
  categorias.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    select.appendChild(opt);
  });

  const botonEliminar = document.querySelector('[onclick="eliminarCategoria()"]');
  if (categorias.length === 0) {
    botonEliminar.disabled = true;
    botonEliminar.textContent = "No hay categorías para eliminar";
  } else {
    botonEliminar.disabled = false;
    botonEliminar.textContent = "Eliminar";
  }
}

function eliminarBanco() {
  const select = document.getElementById('selectEliminarBanco');
  const banco = select.value;

  if (!banco) {
    alert('Selecciona un banco para eliminar.');
    return;
  }

  const lista = leerDatos();
  const afectados = lista.filter(m => m.banco === banco).length;

  if (!confirm(`¿Seguro que quieres eliminar el banco "${banco}"? \n\nSe quitará de ${afectados} movimiento${afectados !== 1 ? 's' : ''}.`)) {
    return;
  }

  // Eliminar de localStorage
  let bancos = leerBancos();
  bancos = bancos.filter(b => b !== banco);
  guardarBancos(bancos);

  // Quitar banco de los movimientos
  lista.forEach(m => {
    if (m.banco === banco) {
      m.banco = '(Sin banco)';
    }
  });
  guardarDatos(lista);

  // Actualizar UI
  cargarSelectBancos(); // actualiza select de movimientos
  cargarSelectBancoRegla(); // actualiza select de reglas (lo creamos abajo)
  cargarSelectEliminarBancos(); // actualiza este select
  renderizar(); // actualiza lista y resúmenes
  renderizarResumenBancos(); // actualiza filtro y resumen por banco

  alert(`✅ Banco "${banco}" eliminado.\nSe actualizó${afectados !== 1 ? 'ron' : ''} ${afectados} movimiento${afectados !== 1 ? 's' : ''}.`);
}

function cargarSelectEliminarBancos() {
  const select = document.getElementById('selectEliminarBanco');
  const bancos = leerBancos();

  // Limpiar opciones excepto la primera
  while (select.options.length > 1) {
    select.remove(1);
  }

  // Agregar bancos
  bancos.forEach(b => {
    const opt = document.createElement('option');
    opt.value = b;
    opt.textContent = b;
    select.appendChild(opt);
  });
}

function cargarSelectBancoRegla() {
  const select = document.getElementById('txtBancoRegla');
  const bancos = leerBancos();

  // Guardar opciones especiales
  const cualquierBanco = select.options[0];
  const nuevoOpt = select.options[select.options.length - 1];

  // Limpiar
  select.innerHTML = '';
  select.appendChild(cualquierBanco);

  // Agregar bancos
  bancos.forEach(b => {
    const opt = document.createElement('option');
    opt.value = b;
    opt.textContent = b;
    select.appendChild(opt);
  });

  // Volver a agregar "+ Nuevo..."
  select.appendChild(nuevoOpt);
}

document.addEventListener('DOMContentLoaded', function() {
  actualizarSelectCategorias();
  cargarSelectEliminarCategorias();
  cargarSelectEliminarBancos(); // <-- NUEVO
  cargarSelectBancoRegla();     // <-- NUEVO (por si hay bancos guardados)
});
