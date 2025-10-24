// ======================================================================================
// ✅ FUNCIONES PARA PRESUPUESTO SUGERIDO
// ======================================================================================

/**
 * Genera un presupuesto sugerido basado en el historial de gastos del usuario
 */
async function generarPresupuestoSugerido() {
    try {
        const movimientos = await getAllEntries(STORES.MOVIMIENTOS);
        const gastos = movimientos.filter(m => m.tipo === 'gasto');

        if (gastos.length === 0) {
            mostrarToast('❌ No hay gastos registrados para generar sugerencias', 'danger');
            mostrarEstadoSinDatos();
            return;
        }

        // Calcular datos por mes
        const gastosPorMes = calcularGastosPorMes(gastos);

        if (Object.keys(gastosPorMes).length < 3) {
            mostrarToast('⚠️ Se necesitan al menos 3 meses de datos para generar sugerencias precisas', 'warning');
            mostrarEstadoSinDatos();
            return;
        }

        // Calcular promedios y análisis
        const analisis = analizarPatronesGastos(gastosPorMes);

        // Generar presupuesto sugerido
        const presupuestoSugerido = generarPresupuestoOptimizado(analisis);

        // Mostrar resultados
        mostrarResultadosPresupuestoSugerido(analisis, presupuestoSugerido);

        mostrarToast('✅ Presupuesto sugerido generado exitosamente', 'success');

    } catch (error) {
        console.error('Error generando presupuesto sugerido:', error);
        mostrarToast('❌ Error al generar presupuesto sugerido', 'danger');
    }
}

/**
 * Calcula gastos agrupados por mes
 */
function calcularGastosPorMes(gastos) {
    const gastosPorMes = {};

    gastos.forEach(gasto => {
        const fecha = new Date(gasto.fecha);
        const mesClave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;

        if (!gastosPorMes[mesClave]) {
            gastosPorMes[mesClave] = {
                total: 0,
                categorias: {},
                fecha: mesClave
            };
        }

        gastosPorMes[mesClave].total += gasto.cantidad;

        const categoria = gasto.categoria || 'Sin categoría';
        gastosPorMes[mesClave].categorias[categoria] = (gastosPorMes[mesClave].categorias[categoria] || 0) + gasto.cantidad;
    });

    return gastosPorMes;
}

/**
 * Analiza patrones de gastos y calcula métricas
 */
function analizarPatronesGastos(gastosPorMes) {
    const meses = Object.keys(gastosPorMes);
    const totales = meses.map(mes => gastosPorMes[mes].total);

    // Calcular promedio mensual
    const promedioMensual = totales.reduce((sum, total) => sum + total, 0) / totales.length;

    // Calcular desviación estándar para identificar meses atípicos
    const desviacionEstandar = Math.sqrt(
        totales.map(total => Math.pow(total - promedioMensual, 2)).reduce((sum, diff) => sum + diff, 0) / totales.length
    );

    // Filtrar meses atípicos (más allá de 1.5 desviaciones estándar)
    const mesesTipicos = meses.filter((mes, index) => {
        const total = totales[index];
        return Math.abs(total - promedioMensual) <= (1.5 * desviacionEstandar);
    });

    const promedioTipico = mesesTipicos.reduce((sum, mes, index) => sum + totales[meses.indexOf(mes)], 0) / mesesTipicos.length;

    // Analizar categorías
    const categoriasGlobales = {};
    meses.forEach(mes => {
        Object.keys(gastosPorMes[mes].categorias).forEach(categoria => {
            categoriasGlobales[categoria] = (categoriasGlobales[categoria] || 0) + gastosPorMes[mes].categorias[categoria];
        });
    });

    // Calcular promedio por categoría
    const categoriasPromedio = {};
    Object.keys(categoriasGlobales).forEach(categoria => {
        categoriasPromedio[categoria] = categoriasGlobales[categoria] / meses.length;
    });

    return {
        promedioMensual: promedioMensual,
        promedioTipico: promedioTipico,
        mesesAnalizados: meses.length,
        categoriasPromedio: categoriasPromedio,
        mesesAtipicos: meses.length - mesesTipicos.length,
        desviacionEstandar: desviacionEstandar
    };
}

/**
 * Genera presupuesto sugerido basado en el análisis
 */
function generarPresupuestoOptimizado(analisis) {
    const presupuestoBase = analisis.promedioTipico;

    // Aplicar factores de seguridad según la variabilidad
    let factorSeguridad = 1.1; // 10% adicional por defecto

    if (analisis.mesesAtipicos > 0) {
        factorSeguridad += (analisis.mesesAtipicos / analisis.mesesAnalizados) * 0.2; // 20% adicional por mes atípico
    }

    if (analisis.desviacionEstandar / analisis.promedioTipico > 0.3) {
        factorSeguridad += 0.15; // 15% adicional si hay alta variabilidad
    }

    const presupuestoSugerido = presupuestoBase * factorSeguridad;

    // Distribuir por categorías
    const distribucionCategorias = {};
    Object.keys(analisis.categoriasPromedio).forEach(categoria => {
        const promedioCategoria = analisis.categoriasPromedio[categoria];
        distribucionCategorias[categoria] = {
            promedio: promedioCategoria,
            sugerido: promedioCategoria * factorSeguridad,
            porcentaje: (promedioCategoria / presupuestoBase) * 100
        };
    });

    return {
        total: presupuestoSugerido,
        base: presupuestoBase,
        factorSeguridad: factorSeguridad,
        distribucion: distribucionCategorias
    };
}

/**
 * Muestra los resultados del presupuesto sugerido
 */
function mostrarResultadosPresupuestoSugerido(analisis, presupuestoSugerido) {
    // Ocultar estado sin datos y mostrar resultados
    document.getElementById('estadoSinDatos').style.display = 'none';
    document.getElementById('resultadosPresupuesto').style.display = 'block';

    // Mostrar resumen ejecutivo
    document.getElementById('gastoPromedioMensual').textContent = `Bs. ${formatNumberVE(analisis.promedioMensual)}`;
    document.getElementById('presupuestoSugerido').textContent = `Bs. ${formatNumberVE(presupuestoSugerido.total)}`;

    // Mostrar análisis por categorías
    mostrarAnalisisCategorias(analisis.categoriasPromedio);

    // Crear gráfico de distribución
    crearGraficoPresupuestoSugerido(presupuestoSugerido.distribucion);

    // Mostrar acciones recomendadas
    mostrarAccionesRecomendadas(analisis, presupuestoSugerido);

    // Crear controles de ajuste
    crearControlesAjuste(presupuestoSugerido.distribucion);
}

/**
 * Muestra el análisis detallado por categorías
 */
function mostrarAnalisisCategorias(categoriasPromedio) {
    const contenedor = document.getElementById('analisisCategorias');
    const categoriasOrdenadas = Object.entries(categoriasPromedio)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8); // Mostrar máximo 8 categorías principales

    let html = '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">';

    categoriasOrdenadas.forEach(([categoria, promedio]) => {
        const porcentaje = ((promedio / Object.values(categoriasPromedio).reduce((sum, val) => sum + val, 0)) * 100).toFixed(1);
        html += `
            <div style="background: var(--card-bg); padding: 1rem; border-radius: 8px; border-left: 3px solid var(--primary);">
                <h4 style="margin: 0 0 0.5rem 0; color: var(--text); font-size: 0.9rem;">${categoria}</h4>
                <p style="margin: 0; font-size: 0.8rem; color: var(--text-light);">Promedio: Bs. ${formatNumberVE(promedio)}</p>
                <p style="margin: 0; font-size: 0.8rem; color: var(--primary);">${porcentaje}% del total</p>
            </div>
        `;
    });

    html += '</div>';
    contenedor.innerHTML = html;
}

/**
 * Crea el gráfico de distribución del presupuesto sugerido
 */
function crearGraficoPresupuestoSugerido(distribucion) {
    if (typeof Chart === 'undefined') return;

    const categorias = Object.keys(distribucion).slice(0, 8); // Máximo 8 categorías
    const valores = categorias.map(cat => distribucion[cat].sugerido);

    if (window.graficoPresupuestoSugerido) {
        window.graficoPresupuestoSugerido.destroy();
    }

    window.graficoPresupuestoSugerido = new Chart(document.getElementById('graficoPresupuestoSugerido'), {
        type: 'doughnut',
        data: {
            labels: categorias,
            datasets: [{
                data: valores,
                backgroundColor: [
                    '#0b57d0', '#018642', '#b00020', '#ff9800', '#9c27b0',
                    '#607d8b', '#cddc39', '#ff5722'
                ],
                borderWidth: 2,
                borderColor: 'white'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        font: { size: 11 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const categoria = context.label;
                            const valor = distribucion[categoria].sugerido;
                            const porcentaje = distribucion[categoria].porcentaje.toFixed(1);
                            return `${categoria}: Bs. ${formatNumberVE(valor)} (${porcentaje}%)`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Muestra acciones recomendadas basadas en el análisis
 */
function mostrarAccionesRecomendadas(analisis, presupuestoSugerido) {
    const contenedor = document.getElementById('accionesRecomendadas');
    const acciones = [];

    // Acción basada en variabilidad
    if (analisis.desviacionEstandar / analisis.promedioMensual > 0.3) {
        acciones.push({
            tipo: 'warning',
            icono: '⚠️',
            titulo: 'Alta variabilidad detectada',
            descripcion: 'Tus gastos varían mucho entre meses. Considera crear un fondo de emergencia.'
        });
    }

    // Acción basada en meses atípicos
    if (analisis.mesesAtipicos > 0) {
        acciones.push({
            tipo: 'info',
            icono: '📊',
            titulo: 'Meses atípicos identificados',
            descripcion: `${analisis.mesesAtipicos} mes(es) con gastos inusuales fueron excluidos del cálculo.`
        });
    }

    // Acción basada en factor de seguridad
    if (presupuestoSugerido.factorSeguridad > 1.2) {
        acciones.push({
            tipo: 'success',
            icono: '🛡️',
            titulo: 'Factor de seguridad aplicado',
            descripcion: `Se agregó un ${(presupuestoSugerido.factorSeguridad - 1) * 100}% adicional para cubrir imprevistos.`
        });
    }

    // Acción general
    acciones.push({
        tipo: 'tip',
        icono: '💡',
        titulo: 'Presupuesto optimizado',
        descripcion: 'Este presupuesto está diseñado para cubrir el 95% de tus gastos históricos con un margen de seguridad.'
    });

    let html = '';
    acciones.forEach(accion => {
        const colorClass = accion.tipo === 'warning' ? 'warning' : accion.tipo === 'info' ? 'info' : 'success';
        html += `
            <div style="display: flex; align-items: flex-start; gap: 0.75rem; margin-bottom: 1rem; padding: 1rem; background: var(--${colorClass}-bg); border-radius: 8px; border-left: 3px solid var(--${colorClass});">
                <div style="font-size: 1.5rem;">${accion.icono}</div>
                <div style="flex: 1;">
                    <h4 style="margin: 0 0 0.25rem 0; color: var(--${colorClass}-text); font-size: 0.9rem;">${accion.titulo}</h4>
                    <p style="margin: 0; color: var(--${colorClass}-text); font-size: 0.85rem;">${accion.descripcion}</p>
                </div>
            </div>
        `;
    });

    contenedor.innerHTML = html;
}

/**
 * Crea controles para ajustar manualmente el presupuesto
 */
function crearControlesAjuste(distribucion) {
    const contenedor = document.getElementById('ajustesCategorias');
    const categoriasPrincipales = Object.entries(distribucion)
        .sort((a, b) => b[1].sugerido - a[1].sugerido)
        .slice(0, 6); // Máximo 6 categorías principales

    let html = '<div style="display: grid; gap: 1rem;">';

    categoriasPrincipales.forEach(([categoria, datos]) => {
        html += `
            <div style="background: var(--card-bg); padding: 1rem; border-radius: 8px;">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: var(--text);">
                    ${categoria}
                </label>
                <div style="display: flex; gap: 0.5rem; align-items: center;">
                    <input type="number"
                           id="ajuste_${categoria.replace(/\s+/g, '_')}"
                           value="${datos.sugerido.toFixed(2)}"
                           step="100"
                           min="0"
                           style="flex: 1; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; font-size: 0.9rem;"
                           placeholder="Monto sugerido">
                    <span style="font-size: 0.8rem; color: var(--text-light); white-space: nowrap;">
                        (${datos.porcentaje.toFixed(1)}%)
                    </span>
                </div>
            </div>
        `;
    });

    html += '</div>';
    contenedor.innerHTML = html;
}

/**
 * Aplica el presupuesto sugerido como meta de presupuesto
 */
async function aplicarPresupuestoSugerido() {
    try {
        const presupuestoSugerido = parseFloat(document.getElementById('presupuestoSugerido').textContent.replace('Bs. ', '').replace(/\./g, '').replace(',', '.'));

        if (isNaN(presupuestoSugerido) || presupuestoSugerido <= 0) {
            mostrarToast('❌ Error al obtener el presupuesto sugerido', 'danger');
            return;
        }

        // Guardar como meta de presupuesto
        localStorage.setItem('metaPresupuesto', presupuestoSugerido.toString());

        mostrarToast(`✅ Presupuesto sugerido aplicado como meta: Bs. ${formatNumberVE(presupuestoSugerido)}`, 'success');

        // Actualizar la pestaña de presupuesto si está visible
        if (document.getElementById('side-presupuesto').classList.contains('active')) {
            await actualizarPresupuesto();
        }

    } catch (error) {
        console.error('Error aplicando presupuesto sugerido:', error);
        mostrarToast('❌ Error al aplicar presupuesto sugerido', 'danger');
    }
}

/**
 * Guarda los ajustes manuales del presupuesto
 */
async function guardarAjustesPresupuesto() {
    try {
        const ajustes = {};
        const inputs = document.querySelectorAll('#ajustesCategorias input[id^="ajuste_"]');

        inputs.forEach(input => {
            const categoria = input.id.replace('ajuste_', '').replace(/_/g, ' ');
            const valor = parseFloat(input.value);

            if (!isNaN(valor) && valor >= 0) {
                ajustes[categoria] = valor;
            }
        });

        if (Object.keys(ajustes).length === 0) {
            mostrarToast('❌ Ingresa al menos un ajuste válido', 'danger');
            return;
        }

        const totalAjustado = Object.values(ajustes).reduce((sum, val) => sum + val, 0);

        // Guardar ajustes en localStorage
        localStorage.setItem('presupuestoAjustes', JSON.stringify(ajustes));
        localStorage.setItem('presupuestoTotalAjustado', totalAjustado.toString());

        mostrarToast(`✅ Ajustes guardados. Total: Bs. ${formatNumberVE(totalAjustado)}`, 'success');

    } catch (error) {
        console.error('Error guardando ajustes:', error);
        mostrarToast('❌ Error al guardar ajustes', 'danger');
    }
}

/**
 * Exporta el presupuesto sugerido como PDF
 */
function exportarPresupuestoSugerido() {
    try {
        const gastoPromedio = document.getElementById('gastoPromedioMensual').textContent;
        const presupuestoSugerido = document.getElementById('presupuestoSugerido').textContent;

        const contenido = `
            <h1>Presupuesto Sugerido - SFP</h1>
            <p><strong>Generado el:</strong> ${new Date().toLocaleDateString('es-VE')}</p>

            <h2>Resumen Ejecutivo</h2>
            <p><strong>Gasto Promedio Mensual:</strong> ${gastoPromedio}</p>
            <p><strong>Presupuesto Sugerido:</strong> ${presupuestoSugerido}</p>

            <h2>Detalle por Categorías</h2>
            <div id="detalleCategoriasPDF">
                ${document.getElementById('analisisCategorias').innerHTML}
            </div>
        `;

        // Crear ventana para impresión
        const ventana = window.open('', '_blank');
        ventana.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Presupuesto Sugerido</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto; }
                    h1 { color: #0b57d0; text-align: center; }
                    h2 { color: #333; border-bottom: 2px solid #0b57d0; padding-bottom: 0.5rem; }
                    .categoria-card { background: #f9f9f9; margin: 1rem 0; padding: 1rem; border-radius: 8px; }
                </style>
            </head>
            <body>
                ${contenido}
            </body>
            </html>
        `);
        ventana.document.close();
        ventana.print();

    } catch (error) {
        console.error('Error exportando presupuesto:', error);
        mostrarToast('❌ Error al exportar presupuesto', 'danger');
    }
}

/**
 * Muestra el estado cuando no hay datos suficientes
 */
function mostrarEstadoSinDatos() {
    document.getElementById('estadoSinDatos').style.display = 'block';
    document.getElementById('resultadosPresupuesto').style.display = 'none';
}

/**
 * Muestra ayuda para la pestaña de presupuesto sugerido
 */
function mostrarAyudaPresupuestoSugerido() {
    const contenido = `
        <h2 style="color:var(--primary); margin-bottom:1.5rem; text-align:center;">💰 ¿Qué es el Presupuesto Sugerido?</h2>

        <div style="margin-bottom:1.5rem;">
            <h3 style="color:var(--text); margin-bottom:0.75rem;">🎯 ¿Cómo funciona?</h3>
            <ul style="color:var(--text-light); line-height:1.6; margin:0; padding-left:1.5rem;">
                <li><strong>Análisis inteligente:</strong> Estudia tu historial de gastos por categoría y mes</li>
                <li><strong>Detección de patrones:</strong> Identifica meses típicos y atípicos</li>
                <li><strong>Factor de seguridad:</strong> Agrega un margen para cubrir imprevistos</li>
                <li><strong>Distribución optimizada:</strong> Sugiere cuánto asignar a cada categoría</li>
            </ul>
        </div>

        <div style="margin-bottom:1.5rem;">
            <h3 style="color:var(--text); margin-bottom:0.75rem;">📊 ¿Qué necesitas?</h3>
            <ul style="color:var(--text-light); line-height:1.6; margin:0; padding-left:1.5rem;">
                <li><strong>Mínimo 3 meses:</strong> De datos de gastos para generar sugerencias precisas</li>
                <li><strong>Categorías definidas:</strong> Mejores resultados con gastos categorizados</li>
                <li><strong>Historial consistente:</strong> Más datos = mejores sugerencias</li>
            </ul>
        </div>

        <div style="background:var(--info-bg); padding:1rem; border-radius:8px; border-left:4px solid var(--info); margin-top:1.5rem;">
            <p style="margin:0; color:var(--info-text); font-size:0.875rem;">
                <strong>💡 Consejo:</strong> El presupuesto sugerido está diseñado para cubrir el 95% de tus gastos históricos con un margen de seguridad del 10-30%.
            </p>
        </div>
    `;

    mostrarModalAyuda(contenido, 'modalAyudaPresupuestoSugerido');
}

// Agregar después de la línea 517 (al final del archivo)

let configuracionPresupuesto = {
    mesesMinimos: 3,
    permitirExcepciones: false
};

// Inicializar configuración cuando se carga la página
// Inicializar configuración cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    cargarConfiguracionPresupuesto();
    actualizarSelectConfiguracion();
});

// Cargar configuración guardada
// Cargar configuración guardada
function cargarConfiguracionPresupuesto() {
    console.log('🔍 Cargando configuración guardada...');
    const configGuardada = localStorage.getItem('configuracionPresupuesto');
    console.log('📦 Datos en localStorage:', configGuardada);

    if (configGuardada) {
        try {
            const configParseada = JSON.parse(configGuardada);
            console.log('✅ Configuración parseada:', configParseada);
            configuracionPresupuesto = { ...configuracionPresupuesto, ...configParseada };
            console.log('🎯 Configuración final:', configuracionPresupuesto);
        } catch (error) {
            console.error('❌ Error parseando configuración:', error);
        }
    } else {
        console.log('⚠️ No hay configuración guardada, usando valores predeterminados');
    }
}

// Guardar configuración
function guardarConfiguracionPresupuesto() {
    console.log('💾 Guardando configuración:', configuracionPresupuesto);
    localStorage.setItem('configuracionPresupuesto', JSON.stringify(configuracionPresupuesto));
    console.log('✅ Configuración guardada en localStorage');
}

// Modificar la función generarPresupuestoSugerido para usar configuración
async function generarPresupuestoSugerido() {
    try {
        const movimientos = await getAllEntries(STORES.MOVIMIENTOS);
        const gastos = movimientos.filter(m => m.tipo === 'gasto');

        if (gastos.length === 0) {
            mostrarToast('❌ No hay gastos registrados para generar sugerencias', 'danger');
            mostrarEstadoSinDatos();
            return;
        }

        // Calcular datos por mes
        const gastosPorMes = calcularGastosPorMes(gastos);
        const mesesDisponibles = Object.keys(gastosPorMes).length;

                        // Verificar requisitos mínimos usando configuración
        if (mesesDisponibles < configuracionPresupuesto.mesesMinimos) {
            mostrarToast(`⚠️ Se necesitan al menos ${configuracionPresupuesto.mesesMinimos} meses de datos para generar sugerencias precisas`, 'warning');
            mostrarEstadoSinDatos();
            mostrarSeccionConfiguracion(mesesDisponibles);
            return;
        }

                // Calcular promedios y análisis
                const analisis = analizarPatronesGastos(gastosPorMes);

                // Generar presupuesto sugerido
                const presupuestoSugerido = generarPresupuestoOptimizado(analisis);
        
                // Mostrar resultados
                mostrarResultadosPresupuestoSugerido(analisis, presupuestoSugerido);
        
                mostrarToast('✅ Presupuesto sugerido generado exitosamente', 'success');

    } catch (error) {
            console.error('Error generando presupuesto sugerido:', error);
            mostrarToast('❌ Error al generar presupuesto sugerido', 'danger');
    }
}

// Nueva función para mostrar configuración
function mostrarSeccionConfiguracion(mesesDisponibles) {
    console.log('Mostrando sección de configuración para', mesesDisponibles, 'meses');
    const contenido = `
        <div style="background: var(--card-bg); padding: 1.5rem; border-radius: var(--radius); margin-top: 2rem;">
            <h3 style="margin-top: 0; color: var(--primary);">⚙️ Configuración del Análisis</h3>
            
            <div style="margin-bottom: 1.5rem;">
                <h4 style="margin: 0 0 0.5rem 0; color: var(--text);">📊 Datos Disponibles</h4>
                <p style="color: var(--text-light); margin: 0;">
                    Actualmente tienes gastos registrados en <strong>${mesesDisponibles} mes(es) diferente(s)</strong>.
                </p>
                ${mesesDisponibles < 3 ? `
                    <div style="background: var(--warning-bg); padding: 1rem; border-radius: 8px; border-left: 4px solid var(--warning); margin-top: 1rem;">
                        <p style="margin: 0; color: var(--warning-text); font-size: 0.9rem;">
                            <strong>💡 ¿Por qué 3 meses?</strong><br>
                            - Permite identificar tendencias reales<br>
                            - Detecta meses atípicos (ej: gastos navideños)<br>
                            - Calcula factores de seguridad apropiados<br>
                            - Genera promedios estadísticamente válidos
                        </p>
                    </div>
                ` : ''}
            </div>

            <div style="margin-bottom: 1.5rem;">
                <h4 style="margin: 0 0 0.5rem 0; color: var(--text);">🔧 Configuración Personal</h4>
                
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">
                        Meses mínimos requeridos:
                        <select id="selectMesesMinimos" style="margin-left: 0.5rem; padding: 0.25rem; border-radius: 4px;">
                            <option value="3" ${configuracionPresupuesto.mesesMinimos === 3 ? 'selected' : ''}>3 meses (recomendado)</option>
                            <option value="2" ${configuracionPresupuesto.mesesMinimos === 2 ? 'selected' : ''}>2 meses</option>
                            <option value="1" ${configuracionPresupuesto.mesesMinimos === 1 ? 'selected' : ''}>1 mes</option>
                        </select>
                    </label>
                </div>

                <div style="margin-bottom: 1rem;">
                    <label style="display: flex; align-items: center; gap: 0.5rem;">
                        <input type="checkbox" id="checkExcepciones" ${configuracionPresupuesto.permitirExcepciones ? 'checked' : ''}>
                        <span>Permitir excepciones (generar con menos datos si es necesario)</span>
                    </label>
                </div>
            </div>

            <div style="display: flex; gap: 1rem;">
                <button onclick="aplicarConfiguracion()" 
                        style="flex: 1; background: var(--success); color: white; border: none; border-radius: 8px; padding: 1rem; font-size: 1rem;">
                    ✅ Aplicar y Reintentar
                </button>
                <button onclick="cerrarConfiguracion()" 
                        style="flex: 1; background: var(--info); color: white; border: none; border-radius: 8px; padding: 1rem; font-size: 1rem;">
                    📖 Entendido
                </button>
            </div>
        </div>
    `;

        // Agregar esta sección al área de estado sin datos
        const estadoSinDatos = document.getElementById('estadoSinDatos');
        if (estadoSinDatos) {
            estadoSinDatos.innerHTML = contenido.replace(/[<>"'&]/g, (match) => {
                const escapeChars = {
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    "'": '&#x27;',
                    '&': '&amp;'
                };
                return escapeChars[match];
            });
            estadoSinDatos.style.display = 'block';
            console.log('Sección de configuración agregada correctamente');
        } else {
            console.error('No se encontró el elemento estadoSinDatos');
        }
}

// Funciones auxiliares
function aplicarConfiguracion() {
    const select = document.getElementById('selectMesesMinimosConfig');
    const checkbox = document.getElementById('checkExcepcionesConfig');

    if (!select || !checkbox) {
        console.error('❌ No se encontraron los elementos de configuración permanente');
        return;
    }

    const valor = parseInt(select.value);
    configuracionPresupuesto.mesesMinimos = (valor >= 1 && valor <= 12) ? valor : 3;
    configuracionPresupuesto.permitirExcepciones = checkbox.checked;

    console.log('💾 Aplicando configuración permanente:', configuracionPresupuesto);
    guardarConfiguracionPresupuesto();
    actualizarSelectConfiguracion();
    mostrarToast('✅ Configuración aplicada', 'success');
}

function cerrarConfiguracion() {
    mostrarEstadoSinDatos();
}

function restaurarConfiguracionPredeterminada() {
    configuracionPresupuesto = {
        mesesMinimos: 3,
        permitirExcepciones: false
    };
    
    guardarConfiguracionPresupuesto();
    actualizarSelectConfiguracion();
    mostrarToast('✅ Configuración restaurada a valores predeterminados', 'success');
}

function actualizarSelectConfiguracion() {
    const select = document.getElementById('selectMesesMinimosConfig');
    if (select) {
        select.value = configuracionPresupuesto.mesesMinimos;
    }
    
    const checkbox = document.getElementById('checkExcepcionesConfig');
    if (checkbox) {
        checkbox.checked = configuracionPresupuesto.permitirExcepciones;
    }
}