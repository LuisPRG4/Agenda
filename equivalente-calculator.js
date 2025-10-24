// 🚀 HERRAMIENTA INDEPENDIENTE: CÁLCULO DE EQUIVALENTE EN OTRA MONEDA
// ✅ No depende de app.js. Solo usa el DOM directamente.
// ✅ Toma el saldo de #totalGeneral (Disponibilidad Total) y lo divide por la tasa ingresada.

// ✅ FUNCIONES AUXILIARES (copiadas de app.js, pero aisladas)
function formatNumberVE(num) {
    if (typeof num !== 'number' || isNaN(num)) return '0,00';
    const parts = num.toFixed(2).split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${integerPart},${parts[1]}`;
}

function parseNumberVE(str) {
    if (!str || typeof str !== 'string') return 0;
    // Eliminar puntos (miles) y reemplazar coma por punto
    const cleaned = str.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
}

// ✅ FUNCION PRINCIPAL: Calcular equivalente desde la herramienta
function calcularEquivalenteDesdeHerramienta() {
    // 1. Obtener el saldo de disponibilidad total (el que está en la pestaña Dashboard)
    const totalGeneralText = document.getElementById('totalGeneral')?.textContent || '0,00';
    // Limpiar: eliminar "Bs. " y formatear para cálculo
    const cleanedTotal = totalGeneralText.replace('Bs. ', '').replace(/\./g, '').replace(',', '.');
    const totalGeneral = parseFloat(cleanedTotal);

    if (isNaN(totalGeneral) || totalGeneral <= 0) {
        alert('⚠️ No se pudo leer el saldo de disponibilidad total. Asegúrate de que hay movimientos.');
        return;
    }

    // 2. Obtener la tasa ingresada en esta herramienta
    const inputTasa = document.getElementById('tasaHerramienta').value.trim();
    let tasa;
    if (!inputTasa) {
        alert('Ingresa una tasa válida.');
        return;
    }
    const cleanedTasa = inputTasa.replace(/\./g, '').replace(',', '.');
    tasa = parseFloat(cleanedTasa);

    if (isNaN(tasa) || tasa <= 0) {
        alert('Ingresa una tasa válida mayor a 0.');
        return;
    }

    // 3. Calcular equivalente
    const equivalente = totalGeneral / tasa;

    // 4. Determinar moneda y símbolo
    const moneda = document.getElementById('monedaHerramienta').value;
    let simbolo = '$';
    if (moneda === 'EUR') simbolo = '€';
    if (moneda === 'COP') simbolo = 'COL$';
    if (moneda === 'ARS') simbolo = 'ARS$';
    if (moneda === 'MXN') simbolo = 'MX$';

    // 5. Formatear resultado en formato venezolano (con todos los decimales)
    // ✅ NUEVO: Convertir el número a string con 10 decimales, luego aplicar el formato venezolano
    const equivalenteStr = equivalente.toFixed(10); // Asegurar 10 decimales
    const partes = equivalenteStr.split('.');
    const entera = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.'); // Formato venezolano para la parte entera
    const decimal = partes[1] ? ',' + partes[1] : ''; // Coma decimal + parte decimal
    const formatoEquivalente = entera + decimal;

    // 6. Mostrar resultados
    document.getElementById('equivalenteHerramienta').textContent = `${simbolo} ${formatoEquivalente}`;
    document.getElementById('tasaActual').textContent = `Tasa actual: 1 ${moneda} = ${formatNumberVE(tasa)} Bs`;
    // ✅ GUARDAR LA TASA EN localStorage PARA QUE NO SE PIERDA
    localStorage.setItem('tasaHerramientaEquivalente', inputTasa); // ✅ Guardamos el TEXTO ORIGINAL
}

// ✅ LIMPIAR Y REINICIAR LA HERRAMIENTA
function limpiarEquivalenteHerramienta() {
    document.getElementById('equivalenteHerramienta').textContent = '--';
    document.getElementById('tasaHerramienta').value = '';
}

// ✅ CARGAR LA TASA GUARDADA (si existe)
function cargarTasaGuardada() {
    const tasaGuardada = localStorage.getItem('tasaHerramientaEquivalente');
    if (tasaGuardada) {
        document.getElementById('tasaHerramienta').value = tasaGuardada;
    }
}

// ✅ GUARDAR LA TASA CUANDO SE CAMBIE
function guardarTasaHerramienta() {
    const tasa = document.getElementById('tasaHerramienta').value.trim();
    if (tasa) {
        localStorage.setItem('tasaHerramientaEquivalente', tasa);
    }
}

// ✅ OBSERVAR CAMBIOS EN #totalGeneral (para actualizar automáticamente)
function observarSaldoTotal() {
    const targetNode = document.getElementById('totalGeneral');
    if (!targetNode) {
        console.warn('⚠️ Elemento #totalGeneral no encontrado. Reintentando...');
        setTimeout(observarSaldoTotal, 1000); // Reintentar después de 1 segundo
        return;
    }

    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' || mutation.type === 'characterData') {
                // Si cambió el saldo, recalcular automáticamente
                if (document.getElementById('tasaHerramienta').value) {
                    calcularEquivalenteDesdeHerramienta();
                }
            }
        });
    });

    observer.observe(targetNode, { childList: true, subtree: true, characterData: true });
}

// ✅ INICIALIZAR LA HERRAMIENTA
document.addEventListener('DOMContentLoaded', function() {
    // ✅ Asegurar que los elementos existen (solo si la pestaña de herramientas está cargada)
    const totalGeneral = document.getElementById('totalGeneral');
    const tasaInput = document.getElementById('tasaHerramienta');
    const monedaSelect = document.getElementById('monedaHerramienta');
    const btnCalcular = document.getElementById('btnCalcularEquivalente');
    const btnLimpiar = document.getElementById('btnLimpiarEquivalente');

    if (!totalGeneral || !tasaInput || !monedaSelect || !btnCalcular || !btnLimpiar) {
        console.warn('⚠️ Herramienta de equivalente: Elementos del DOM no encontrados. Asegúrate de que el HTML está bien.');
        return;
    }

    // ✅ Cargar tasa guardada al cargar
    cargarTasaGuardada();

    // ✅ Escuchar cambios en la tasa para guardarla
    tasaInput.addEventListener('input', guardarTasaHerramienta);

    // ✅ Escuchar clic en botón de calcular
    btnCalcular.addEventListener('click', calcularEquivalenteDesdeHerramienta);

    // ✅ Escuchar clic en botón de limpiar
    btnLimpiar.addEventListener('click', limpiarEquivalenteHerramienta);

    // ✅ Observar cambios en #totalGeneral para actualizar automáticamente
    observarSaldoTotal();

    // ✅ Actualizar inicialmente (si ya hay saldo)
    if (totalGeneral.textContent && totalGeneral.textContent !== '0,00') {
        if (document.getElementById('tasaHerramienta').value) {
            calcularEquivalenteDesdeHerramienta();
        }
    }

    console.log('✅ Herramienta de equivalente cargada y activa. Independiente de app.js.');
});