<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Sistema Financiero Personal (SFP)</title>
  <link rel="icon" type="image/x-icon" href="recursos/ICONO.png">
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <div style="text-align:right; margin-bottom:.5rem;">
    <button id="btnTema" title="Cambiar tema">🌓</button>
  </div>
  <h1 style="text-align:center; margin-bottom:1rem;">Sistema Financiero Personal (SFP)</h1>
  <div class="sidebar">
    <nav class="side-tabs">
      <button class="side-tab active" onclick="mostrarSideTab('dashboard')">📊 Dashboard</button>
      <button class="side-tab" onclick="mostrarSideTab('movimientos')">💳 Movimientos</button>
      <button class="side-tab" onclick="mostrarSideTab('analisis')">📈 Análisis</button>
      <button class="side-tab" onclick="mostrarSideTab('presupuesto')">💰 Presupuesto</button>
      <button class="side-tab" onclick="mostrarSideTab('herramientas')">🛠️ Herramientas</button>
      <button class="side-tab" onclick="mostrarSideTab('config')">⚙️ Config</button>
    </nav>

    <div class="side-content active" id="side-dashboard">
      <section id="buscador">
        <input type="text" id="txtBuscar" placeholder="🔍 Buscar..." />
      </section>
      <section id="resumen">
        <h2>Resumen</h2>
        <p>Saldo actual: <strong id="saldo">Bs. 0,00</strong></p>
  <p id="saldoAviso" style="font-size: 0.875rem; color: var(--text-light); margin-top: 0.25rem; display: none;">
  💡 Este saldo incluye una comisión del 0.3% aplicada automáticamente a cada gasto.
  </p>

  <p style="font-size:0.85rem; color:var(--text-light); margin-top:0.5rem;">
  📁 <strong>¿Cuidas tus datos?</strong> Haz un backup: <a href="#" onclick="exportarBackup()" style="color:var(--primary); text-decoration:underline;">Exportar</a>
  </p>
        <div style="margin-top: 1rem; display: flex; gap: 1rem; flex-wrap: wrap; align-items: center;">
          <label style="font-size: 0.875rem; color: var(--text-light);">
            Convertir a:
            <select id="monedaDestino">
              <option value="USD">Dólar (USD)</option>
              <option value="EUR">Euro (EUR)</option>
              <option value="COP">Peso Colombiano (COP)</option>
              <option value="ARS">Peso Argentino (ARS)</option>
              <option value="MXN">Peso Mexicano (MXN)</option>
            </select>
          </label>


          <label style="font-size: 0.875rem; color: var(--text-light);">
    Tasa del día (Bs): 
    <input type="text" id="tasaCambio" 
           placeholder="Ej: 169,98 o 8333,33" 
           style="width: 100px; padding: 0.5rem; font-size: 1rem; border:1px solid #ccc; border-radius:8px;"
           title="Ingresa la tasa como la ves en tu app de banco: 169,98, 8.333,33, 8333.33 — ¡no se formatea!" />
    <div id="tasaActual" style="font-size: 0.875rem; color: var(--text-light); margin-top: 0.25rem;">
      Tasa actual: 1 USD = 0,00 Bs
    </div>
</label>


          <div style="font-weight: 500; font-size: 1.1rem;">
            Equivalente: <span id="equivalente">--</span>
          </div>
        </div>
      </section>
      <section id="alertaSaldo" style="display:none;">
        <p style="color:var(--danger); font-weight:500;">
          ⚠️ Tu saldo está por debajo de Bs. <span id="umbralAlerta">500</span>
        </p>
      </section>
      <section id="disponibilidad">
        <h2>Disponibilidad total</h2>
        <p><strong>Bs. <span id="totalGeneral">0,00</span></strong> en todos los bancos</p>
      </section>
      <section id="ingGastPorBanco">
        <h2>Ingresos vs Gastos por banco</h2>
        <table id="tablaBancos" style="width:100%; border-collapse:collapse;">
  <thead>
    <tr style="border-bottom:1px solid var(--text-light);">
      <th style="text-align:left;">Banco</th>
      <th style="text-align:right;">Saldo inicial</th>
      <th style="text-align:right;">Ingresos</th>
      <th style="text-align:right;">Gastos</th>
      <th style="text-align:right;">Saldo final</th>
    </tr>
  </thead>
  <tbody></tbody>
  </table>
      </section>
    </div>



    <div class="side-content" id="side-movimientos">
      <section>
        <h2>Agregar Movimiento</h2>
        <label for="saldoInicial">Saldo Inicial (opcional, solo se aplica una vez):
          <input type="text" id="saldoInicial" placeholder="Ej: 3.220,90" style="width:100%; padding:.75rem; border:1px solid #ccc; border-radius:8px; font-size:1rem;" />
        </label>
        <input type="text" id="concepto" placeholder="Concepto" />
        <input type="text" id="cantidad" placeholder="Ej: 3.000,77" />
        <select id="tipo">
          <option value="ingreso">Ingreso</option>
          <option value="gasto">Gasto</option>
          <option value="saldo_inicial">Saldo Inicial</option>
        </select>
        <label>Categoría:
          <div style="display:flex; gap:.5rem;">
            <select id="categoria">
              <option value="">(automática)</option>
              <option value="Otro">+ Nueva…</option>
            </select>
            <button onclick="agregarCategoria()" style="padding:.5rem; border:none; background:#0b57d0; color:white; border-radius:50%; width:2rem; height:2rem; font-size:1rem;">+</button>
          </div>
        </label>
        <input type="text" id="nuevaCategoria" placeholder="Nombre nueva categoría" style="display:none;" />
        <label>Banco:
          <div style="display:flex; gap:.5rem;">
            <select id="banco">
              <option value="">(Sin banco)</option>
              <option value="Otro">+ Nuevo…</option>
            </select>
            <button onclick="agregarBanco()" style="padding:.5rem; border:none; background:#0b57d0; color:white; border-radius:50%; width:2rem; height:2rem; font-size:1rem;">+</button>
          </div>
        </label>
        <input type="text" id="nuevoBanco" placeholder="Nombre del banco" style="display:none;" />
        <label>Fecha:
          <input type="date" id="fechaMov" />
        </label>
        <div class="btn-group">
            <button onclick="agregarMovimiento()" id="btnAgregar">Agregar</button>
            <button onclick="actualizarMovimiento()" id="btnActualizar" style="display:none;">Guardar cambios</button>
            <button onclick="cancelarEdicion()" id="btnCancelarEdicion" style="display:none;">Cancelar</button>
        </div>
      </section>
      <section>
        <h2>
        Movimientos
        <button id="btnToggleLista" onclick="toggleLista()">
            <span id="iconoFlecha">▼</span>
        </button>
    </h2>
        <div id="listaContenedor" style="display: none;">
        <ul id="listaMovimientos"></ul>
        <div id="controlesPaginacion" style="margin-top: 1rem; text-align: center;"></div>
    </div>
        <div id="controlesPaginacion" style="margin-top: 1rem; text-align: center;"></div>
      </section>
      <div class="button-center">
        <button id="botonReporte" onclick="mostrarModalReporte()" style="display:none;">📄 Generar Reporte</button>

  <!-- Modal para selección de tipo de reporte -->
  <div id="modalReporte" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:1000; justify-content:center; align-items:center;">
    <div style="background:var(--card-bg); border-radius:var(--radius); box-shadow:var(--shadow-lg); padding:2rem; max-width:400px; width:90%; margin:2rem;">
        <h2 style="text-align:center; margin-bottom:1.5rem;">📋 Tipo de Reporte</h2>
        <div style="display:flex; flex-direction:column; gap:1rem;">

            <button onclick="generarReporteGeneral()" style="padding:1rem; border:none; border-radius:8px; background:#0b57d0; color:white; font-size:1rem; cursor:pointer; transition:background .2s;">
    📄 Reporte General (Todo)
</button>

            <button onclick="mostrarSeleccionCategoria()" style="padding:1rem; border:none; border-radius:8px; background:#018642; color:white; font-size:1rem; cursor:pointer; transition:background .2s;">
    🏷️ Reporte por Categoría
</button>

            <button onclick="mostrarSeleccionFecha()" style="padding:1rem; border:none; border-radius:8px; background:#ff9800; color:white; font-size:1rem; cursor:pointer; transition:background .2s;">
    📅 Reporte por Fecha
</button>
        </div>
        <button onclick="cerrarModalReporte()" style="margin-top:1.5rem; padding:0.75rem; border:none; border-radius:8px; background:var(--danger); color:white; font-size:0.9rem; cursor:pointer; width:100%;">
            ❌ Cancelar
        </button>
    </div>
  </div>

  <!-- Formulario oculto para seleccionar categoría -->
  <div id="formCategoria" style="display:none;">
    <select id="selectCategoriaReporte">
        <option value="">Selecciona una categoría</option>
    </select>
    <button onclick="generarReportePorCategoria()">Generar</button>
    <button onclick="cerrarFormCategoria()">Cancelar</button>
  </div>

  <!-- Formulario oculto para seleccionar fechas -->
  <div id="formFecha" style="display:none;">
    <label>Desde: <input type="date" id="fechaDesde"></label>
    <label>Hasta: <input type="date" id="fechaHasta"></label>
    <button onclick="generarReportePorFecha()">Generar</button>
    <button onclick="cerrarFormFecha()">Cancelar</button>
  </div>
      </div>
      <div class="button-center">
        <button onclick="exportarExcel()">📊 Exportar Excel</button>
      </div>
    </div>
    <div class="side-content" id="side-analisis">
      <section id="grafico">
        <h2>Gastos por categoría</h2>
        <canvas id="torta" style="max-width:100%; height:auto;"></canvas>
      </section>
      <section id="barras">
        <h2>Resumen mensual</h2>
        <canvas id="barChart" style="max-width:100%; height:auto;"></canvas>
      </section>
      <section id="resumenBancos">
        <h2>Resumen por banco</h2>
        <select id="filtroBanco">
          <option value="">Todos los bancos</option>
        </select>
        <ul id="listaBancos"></ul>
      </section>
    </div>




    <div class="side-content" id="side-presupuesto">
      <section id="presupuestoMeta">
  <h2>🎯 Meta de Presupuesto</h2>
  <p style="margin-bottom: 1rem; color: var(--text-light);">Define tu meta mensual y tu progreso actual.</p>
  <div style="display:flex; gap:1rem; margin-bottom:1.5rem;">
    <div style="flex:1;">
      <label for="metaPresupuesto">Meta mensual (Bs):</label>
      <input type="number" id="metaPresupuesto" placeholder="Ej: 20000" step="100" min="0" />
    </div>
    <div style="flex:1;">
      <label for="presupuestoActual">Gasto actual (Bs):</label>
      <input type="number" id="presupuestoActual" placeholder="Automático" readonly style="background:var(--card-bg); color:var(--text-light); cursor:not-allowed;" />
    </div>
  </div>
  <div style="display:flex; gap:0.75rem; margin-bottom:1.5rem;">
    <button onclick="guardarMetaPresupuesto()" style="flex:1; background:#0b57d0; color:white; border:none; border-radius:8px; padding:0.75rem; font-size:0.9rem;">💾 Guardar Meta</button>
    <button onclick="eliminarMetaPresupuesto()" style="flex:1; background:#b00020; color:white; border:none; border-radius:8px; padding:0.75rem; font-size:0.9rem; opacity:0.9; transition:opacity 0.2s;">🗑️ Eliminar Meta</button>
  </div>
  </section>

      <section id="presupuestoGrafico">
        <h2>📊 Progreso del Presupuesto</h2>
        <div style="background:var(--card-bg); border-radius:var(--radius); padding:1.5rem; box-shadow:var(--shadow-sm); margin-bottom:1.5rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
            <span style="font-weight:500;">Gasto actual</span>
            <span id="progresoTexto" style="font-weight:700; color:var(--text);">0%</span>
          </div>
          <div style="height:20px; background:#e0e0e0; border-radius:10px; overflow:hidden; margin-bottom:1rem;">
            <div id="barraProgreso" style="height:100%; width:0%; background:linear-gradient(90deg, #018642, #0b57d0); transition:width 0.5s ease;"></div>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:0.875rem; color:var(--text-light);">
            <span>Meta: <span id="metaTexto">Bs. 0</span></span>
            <span>Gastado: <span id="gastadoTexto">Bs. 0</span></span>
          </div>
        </div>
      </section>

      <section id="presupuestoDetalles">
  <h2>🔍 Desglose de Gastos (últimos 30 días)</h2>
  <ul id="listaPresupuestoDetalles"></ul>
  <div style="text-align:center; margin-top:1rem;">
    <button onclick="actualizarPresupuesto()" style="background:#0b57d0; color:white; border:none; border-radius:8px; padding:0.5rem 1rem; font-size:0.9rem;">Actualizar</button>
  </div>
  <p id="leyendaPresupuesto" style="margin-top:1.5rem; font-size:0.85rem; color:var(--text-light); text-align:center; font-style:italic; max-width:400px; margin-left:auto; margin-right:auto; display:none;">
    📌 <strong>¿Sin meta?</strong> Esta pestaña muestra tu gasto real. Define una meta para ver tu progreso.
  </p>
  </section>

    </div>

    <!-- ✅ PEGA AQUÍ LO QUE COPIASTE (LA HERRAMIENTA) -->
  <div class="side-content" id="side-herramientas">
    <section>
      <h2>🛠️ Formateador de Números</h2>
      <p style="color: var(--text-light); margin-bottom: 1.5rem;">
        Pega o escribe cualquier número (ej: 1111783.99) y lo convertiremos automáticamente a formato venezolano: <strong>1.111.783,99</strong>.
      </p>
      <label for="inputNumero">Número sin formato:</label>
      <input type="text" id="inputNumero" placeholder="Ej: 1111783.99 o 1.111.783,99" 
             style="width:100%; padding:1rem; font-size:1.1rem; margin-bottom:1rem; border:1px solid #ccc; border-radius:8px;">
      <div style="background:var(--card-bg); padding:1.25rem; border-radius:8px; border:1px solid #eee; margin-bottom:1.5rem;">
        <label>Formateado (Venezuela):</label>
        <div id="numeroFormateado" style="font-family:'Space Mono', monospace; font-size:1.5rem; font-weight:600; color:var(--primary); padding:1rem; background:#f9f9f9; border-radius:6px; margin-top:0.5rem;">
          0,00
        </div>
      </div>
      <div style="display:flex; gap:0.75rem; margin-bottom:1.5rem;">
        <button onclick="copiarFormateado()" style="flex:1; background:#0b57d0; color:white; border:none; border-radius:8px; padding:1rem; font-size:1rem;">📋 Copiar al Portapapeles</button>
        <button onclick="usarEnCantidad()" style="flex:1; background:#018642; color:white; border:none; border-radius:8px; padding:1rem; font-size:1rem;">💸 Usar en Cantidad</button>
        <button onclick="usarEnSaldoInicial()" style="flex:1; background:#ff9800; color:white; border:none; border-radius:8px; padding:1rem; font-size:1rem;">🏦 Usar en Saldo Inicial</button>
      </div>
      <p style="font-size:0.85rem; color:var(--text-light); text-align:center;">
        ⚠️ Esta herramienta no guarda datos. Solo te ayuda a formatear antes de agregar un movimiento.
      </p>
    </section>
  </div>





    <div class="side-content" id="side-config">
      <section id="panelReglas">
        <h2>Reglas de automatización</h2>
        <ul id="listaReglas"></ul>

        <!-- ✅ NUEVA SECCIÓN: Editar Categorías -->
  <details>
    <summary>✏️ Editar categoría</summary>
    <ul id="listaCategoriasEditables" style="margin: 0.5rem 0; padding-left: 1rem;"></ul>
    <button onclick="agregarCategoria()" style="margin-top: 0.5rem; width:100%;">➕ Nueva categoría</button>
  </details>

  <!-- ✅ NUEVA SECCIÓN: Editar Bancos -->
  <details>
    <summary>✏️ Editar banco</summary>
    <ul id="listaBancosEditables" style="margin: 0.5rem 0; padding-left: 1rem;"></ul>
    <button onclick="agregarBanco()" style="margin-top: 0.5rem; width:100%;">➕ Nuevo banco</button>
  </details>

        <details>
          <summary>🗑️ Eliminar categoría</summary>
          <select id="selectEliminarCategoria">
            <option value="">Selecciona una categoría</option>
          </select>
          <button onclick="eliminarCategoria()">Eliminar</button>
        </details>
        <details>
          <summary>🗑️ Eliminar banco</summary>
          <select id="selectEliminarBanco">
            <option value="">Selecciona un banco</option>
          </select>
          <button onclick="eliminarBanco()">Eliminar</button>
        </details>
        <details>
          <summary>🗑️ Eliminar saldo inicial</summary>
          <button onclick="eliminarSaldoInicial()">Eliminar saldo inicial</button>
        </details>
        <details>
          <summary>➕ Nueva regla</summary>
          <input type="text" id="txtPalabra" placeholder="Palabra clave (ej. netflix)" />
          <input type="text" id="txtCat" placeholder="Categoría a asignar" />
          <label>Banco objetivo:
            <select id="txtBancoRegla">
              <option value="">Cualquier banco</option>
              <option value="Otro">+ Nuevo…</option>
            </select>
          </label>
          <input type="text" id="nuevoBancoRegla" placeholder="Nombre del banco" style="display:none;" />
          <button onclick="agregarRegla()">Guardar regla</button>
        </details>

              <details style="margin-top: 1.5rem;">
        <summary>🔒 Bloqueo de App (PIN)</summary>
        <p style="color: var(--text-light); margin-bottom: 1rem;">
          Activa un bloqueo con PIN para proteger tu app. Solo tú podrás acceder.
        </p>
        <div style="margin-bottom: 1rem;">
          <label>
            <input type="checkbox" id="bloqueoActivo" />
            Activar bloqueo de app
          </label>
        </div>
        <div id="bloqueoPINContainer" style="display: none; margin-top: 1rem; padding: 1rem; background: var(--card-bg); border-radius: var(--radius); border: 1px solid var(--text-light);">
          <label for="bloqueoPIN">Ingresa tu PIN de 4 dígitos:</label>
          <input type="password" id="bloqueoPIN" maxlength="4" minlength="4" placeholder="Ej: 1234" style="width:100%; margin-bottom:0.75rem;" />
          <label for="bloqueoPINConfirmar">Confirma tu PIN:</label>
          <input type="password" id="bloqueoPINConfirmar" maxlength="4" minlength="4" placeholder="Vuelve a ingresar" style="width:100%; margin-bottom:0.75rem;" />
          <button onclick="guardarPIN()" style="width:100%;">Guardar PIN</button>
          <button onclick="eliminarPIN()" style="width:100%; background:var(--danger); margin-top:0.5rem;">Eliminar PIN</button>
        </div>
        <p style="font-size:0.8rem; color:var(--text-light); margin-top:1rem;">
          ⚠️ Si olvidas tu PIN, no podrás acceder a tu app. <br>
          ¡Guarda tu PIN en un lugar seguro!
        </p>
      </details>

      <details style="margin-top: 1.5rem;">
  <summary>💾 Copia de Seguridad</summary>
  <p style="color: var(--text-light); margin-bottom: 1rem;">
    Exporta o importa tu historial completo. Ideal para cambiar de dispositivo o recuperar datos.
  </p>
  <button onclick="exportarBackup()" style="width:100%; padding:1rem; margin-bottom:0.75rem; background:#0b57d0; color:white; border:none; border-radius:8px; font-size:1rem;">
    📤 Exportar Backup
  </button>
  <button onclick="importarBackup()" style="width:100%; padding:1rem; background:#018642; color:white; border:none; border-radius:8px; font-size:1rem;">
    📥 Importar Backup
  </button>

  <button onclick="repararApp()" style="width:100%; padding:1rem; margin-top:1rem; background:#ff9800; color:white; border:none; border-radius:8px; font-size:1rem;">
    🛠️ Reparar Visualización (Firefox/Chrome)
  </button>
  </details>

      </section>
    </div>
  </div>
  <script src="chart.umd.min.js"></script>
  <script src="xlsx.full.min.js"></script>
  <script src="app.js"></script>

  <!-- Modal de bloqueo -->
  <div id="modalBloqueo" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:1001; justify-content:center; align-items:center;">
  <div style="background:var(--card-bg); border-radius:var(--radius); box-shadow:var(--shadow-lg); padding:2rem; width:90%; max-width:350px; text-align:center;">
    <h2>🔒 Bloqueo de App</h2>
    <p style="color:var(--text-light); margin-bottom:1.5rem;">Ingresa tu PIN de 4 dígitos para acceder.</p>
    <input type="password" id="pinInput" maxlength="4" minlength="4" placeholder="PIN de 4 dígitos" 
           style="width:100%; padding:1rem; font-size:1.5rem; text-align:center; margin-bottom:1.5rem; border:1px solid var(--text-light); border-radius:8px;"
           title="Escribe 'reset' si olvidaste tu PIN (solo para recuperación)">
    <button onclick="desbloquearApp()" style="width:100%; padding:1rem; font-size:1rem; background:#0b57d0; color:white; border:none; border-radius:8px;">Desbloquear</button>
    <button onclick="cerrarModalBloqueo()" style="width:100%; padding:0.75rem; margin-top:1rem; background:var(--danger); color:white; border:none; border-radius:8px; font-size:0.9rem;">Cancelar</button>
    <p id="avisoPinOlvidado" style="font-size:0.75rem; color:var(--text-light); margin-top:1.5rem; font-style:italic; display:none;">
      ⚠️ ¿Olvidaste tu PIN? Escribe <strong>"reset"</strong> para desactivar el bloqueo.
    </p>
  </div>
  </div>

    <div class="side-content" id="side-herramientas">
      <section>
        <h2>🛠️ Formateador de Números</h2>
        <p style="color: var(--text-light); margin-bottom: 1.5rem;">
          Pega o escribe cualquier número (ej: 1111783.99) y lo convertiremos automáticamente a formato venezolano: <strong>1.111.783,99</strong>.
        </p>

        <label for="inputNumero">Número sin formato:</label>
        <input type="text" id="inputNumero" placeholder="Ej: 1111783.99 o 1.111.783,99" 
               style="width:100%; padding:1rem; font-size:1.1rem; margin-bottom:1rem; border:1px solid #ccc; border-radius:8px;">

        <div style="background:var(--card-bg); padding:1.25rem; border-radius:8px; border:1px solid #eee; margin-bottom:1.5rem;">
          <label>Formateado (Venezuela):</label>
          <div id="numeroFormateado" style="font-family:'Space Mono', monospace; font-size:1.5rem; font-weight:600; color:var(--primary); padding:1rem; background:#f9f9f9; border-radius:6px; margin-top:0.5rem;">
            0,00
          </div>
        </div>

        <div style="display:flex; gap:0.75rem; margin-bottom:1.5rem;">
          <button onclick="copiarFormateado()" style="flex:1; background:#0b57d0; color:white; border:none; border-radius:8px; padding:1rem; font-size:1rem;">📋 Copiar al Portapapeles</button>
          <button onclick="usarEnCantidad()" style="flex:1; background:#018642; color:white; border:none; border-radius:8px; padding:1rem; font-size:1rem;">💸 Usar en Cantidad</button>
          <button onclick="usarEnSaldoInicial()" style="flex:1; background:#ff9800; color:white; border:none; border-radius:8px; padding:1rem; font-size:1rem;">🏦 Usar en Saldo Inicial</button>
        </div>

        <p style="font-size:0.85rem; color:var(--text-light); text-align:center;">
          ⚠️ Esta herramienta no guarda datos. Solo te ayuda a formatear antes de agregar un movimiento.
        </p>
      </section>
    </div>

</body>
</html>
