// Variable global para la base de datos
let db;
const DB_NAME = 'sfpDB';
const DB_VERSION = 3; // ✅ Versión actual de la base de datos

// (variable global)
let idRecordatorioEditando = null;
let sonidoPersonalizado = null; // almacenamos temporalmente el audio subido

// SONIDO DE LOS RECORDATORIOS
document.getElementById('uploadSonido').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (ev) {
    const base64 = ev.target.result;
    localStorage.setItem('sonidoPersonalizado', base64);
    mostrarToast('🎵 Sonido personalizado guardado', 'success');
    sonidoPersonalizado = base64;
  };
  reader.readAsDataURL(file);
});

document.getElementById('selectSonido').addEventListener('change', (e) => {
  localStorage.setItem('sonidoSeleccionado', e.target.value);
});

document.getElementById('btnProbarSonido').addEventListener('click', () => {
  reproducirSonidoAviso();
});

// Nombres de los almacenes de objetos
const STORES = {

    MOVIMIENTOS: 'movimientos',
    CATEGORIAS: 'categorias',
    BANCOS: 'bancos',
    REGLAS: 'reglas',
    SALDO_INICIAL: 'saldo_inicial',
    INVERSIONES: 'inversiones'
};

// ======================================================================================
// ✅ FUNCIONES MODERNAS PARA ALERTAS Y CONFIRMACIONES (Reemplazo de alert() y confirm())
// ======================================================================================

/**
 * Función para mostrar notificaciones estilo "Toast" (reemplazo de alert).
 * @param {string} mensaje - El texto del mensaje.
 * @param {string} [tipo='info'] - El tipo de mensaje: 'success', 'danger', o 'info'.
 */
function mostrarToast(mensaje, tipo = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return; 

    const toast = document.createElement('div');
    toast.className = `custom-toast ${tipo}`;
    toast.textContent = mensaje;
    
    container.appendChild(toast);
    
    // Forzar reflow para que la transición de entrada funcione
    void toast.offsetWidth; 
    toast.classList.add('show');

    // Desaparecer después de 3 segundos
    setTimeout(() => {
        toast.classList.remove('show');
        // Eliminar el toast del DOM después de que la transición haya terminado
        toast.addEventListener('transitionend', () => {
            toast.remove();
        }, { once: true });
    }, 3000);
}

/**
 * Función para mostrar un modal de confirmación personalizado (reemplazo de confirm).
 * @param {string} mensaje - El texto de la pregunta de confirmación.
 * @returns {Promise<boolean>} - Resuelve a true si se presiona Aceptar, false si se presiona Cancelar.
 */
function mostrarConfirmacion(mensaje) {
    const overlay = document.getElementById('custom-confirm');
    const messageEl = document.getElementById('confirm-message');
    const okBtn = document.getElementById('confirm-ok');
    const cancelBtn = document.getElementById('confirm-cancel');

    // Fallback al nativo si la estructura HTML no existe
    if (!overlay || !messageEl || !okBtn || !cancelBtn) {
        return Promise.resolve(window.confirm(mensaje));
    }

    messageEl.textContent = mensaje;
    overlay.classList.add('show'); 

    return new Promise(resolve => {
        const handleResult = (result) => {
            // Limpiar listeners y ocultar
            okBtn.removeEventListener('click', onOk);
            cancelBtn.removeEventListener('click', onCancel);
            overlay.classList.remove('show');
            
            // Resolver la promesa
            resolve(result);
        };

        const onOk = () => handleResult(true);
        const onCancel = () => handleResult(false);

        // Añadir listeners
        okBtn.addEventListener('click', onOk);
        cancelBtn.addEventListener('click', onCancel);

        // Permitir cerrar con ESC
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                handleResult(false);
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    });
}

// ✅ FUNCIONES PARA FORMATO VENEZOLANO (punto mil, coma decimal)
function formatNumberVE(num) {
    if (typeof num !== 'number' || isNaN(num)) return '0,00';
    const parts = num.toFixed(2).split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${integerPart},${parts[1]}`;
}

// ✅ FUNCIONES PARA LA HERRAMIENTA DE FORMATO DE NÚMEROS
function formatearNumero(input) {
    const valor = input.value.trim();
    if (!valor) {
        document.getElementById('numeroFormateado').textContent = '0,00';
        return;
    }

    // ✅ PASO 1: Detectar si el punto es separador de miles o decimal
    // Si hay coma, asumimos que es decimal (formato venezolano válido)
    if (valor.includes(',')) {
        // Ej: "1.111.783,99" → limpiamos puntos (miles), dejamos coma (decimal)
        const cleaned = valor.replace(/\./g, ''); // Elimina puntos (miles)
        const num = parseFloat(cleaned); // Convierte a número: 1111783.99
        if (isNaN(num)) {
            document.getElementById('numeroFormateado').textContent = 'Formato inválido';
            return;
        }
        document.getElementById('numeroFormateado').textContent = formatNumberVE(num);
        return;
    }

    // ✅ PASO 2: Si NO hay coma, pero sí hay punto, asumimos que es decimal (formato internacional)
    // Ej: "1111783.99" → asumimos que el punto es decimal → 1111783.99
    if (valor.includes('.')) {
        const num = parseFloat(valor); // 1111783.99
        if (isNaN(num)) {
            document.getElementById('numeroFormateado').textContent = 'Formato inválido';
            return;
        }
        document.getElementById('numeroFormateado').textContent = formatNumberVE(num);
        return;
    }

    // ✅ PASO 3: Si no hay ni punto ni coma, es un entero
    const num = parseFloat(valor);
    if (isNaN(num)) {
        document.getElementById('numeroFormateado').textContent = 'Formato inválido';
        return;
    }
    document.getElementById('numeroFormateado').textContent = formatNumberVE(num);
}

function copiarFormateado() {
    const texto = document.getElementById('numeroFormateado').textContent;
    if (texto === 'Formato inválido' || texto === '0,00') return;
    navigator.clipboard.writeText(texto).then(() => {
        mostrarToast('✅ Copiado al portapapeles: ' + texto, 'success');
    }).catch(() => {
        mostrarToast('❌ No se pudo copiar. Usa Ctrl+C.', 'danger');
    });
}
function usarEnCantidad() {
    const formateado = document.getElementById('numeroFormateado').textContent;
    if (formateado === 'Formato inválido' || formateado === '0,00') return;
    // Convertir de "1.111.783,99" a "1111783.99" para que parseNumberVE lo entienda
    const limpio = formateado.replace(/\./g, '').replace(',', '.');
    document.getElementById('cantidad').value = limpio;
    mostrarToast('✅ Valor aplicado al campo "Cantidad".', 'success');
    mostrarSideTab('movimientos');
    document.getElementById('cantidad').focus();
}
function usarEnSaldoInicial() {
    const formateado = document.getElementById('numeroFormateado').textContent;
    if (formateado === 'Formato inválido' || formateado === '0,00') return;
    // Convertir de "1.111.783,99" a "1111783.99" para que parseNumberVE lo entienda
    const limpio = formateado.replace(/\./g, '').replace(',', '.');
    document.getElementById('saldoInicial').value = limpio;
    mostrarToast('✅ Valor aplicado al campo "Saldo Inicial".', 'success');
    mostrarSideTab('movimientos');
    document.getElementById('saldoInicial').focus();
}
// ✅ Escuchar cambios en el input de herramientas
document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('inputNumero');
    if (input) {
        input.addEventListener('input', () => formatearNumero(input));
    }
});

// ✅ FUNCIONES PARA LA HERRAMIENTA DE FORMATO DE NÚMEROS

// ✅ Función para mostrar números según el modo de entrada configurado
function displayNumber(num, textoOriginal = null) {
    const modo = localStorage.getItem('numeroModo') || 'automatico';
    
    if (modo === 'literal') {
        // En modo literal, mostrar el texto original si existe
        if (textoOriginal) {
            return textoOriginal;
        }
        // Si no hay texto original, mostrar el número como string
        return num.toString();
    } else {
        // En modo automático, usar el formato venezolano estándar
        return formatNumberVE(num);
    }
}

function parseNumberVE(str) {
    if (!str || typeof str !== 'string') return 0;

    const modo = localStorage.getItem('numeroModo') || 'automatico';

    if (modo === 'literal') {
        let cleaned = str.trim().replace(/ /g, '');
        
        const regex = /^-?\d+(?:[.,]\d+)?$/;
        if (!regex.test(cleaned)) return 0;

        if (cleaned.includes('.')) {
            return parseFloat(cleaned);
        }

        if (cleaned.includes(',')) {
            cleaned = cleaned.replace(',', '.');
            return parseFloat(cleaned);
        }

        return parseFloat(cleaned);
    }

    let cleaned = str.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
}

//Versión del sistema:
const APP_VERSION = '1.1.0';

// ✅ Función para crear datos de backup (necesaria para el almacén)
async function crearBackupData() {
    try {
        const backupData = {
            version: APP_VERSION,
            fechaCreacion: new Date().toISOString(),
            datos: {
                movimientos: await getAllEntries(STORES.MOVIMIENTOS),
                categorias: await getAllEntries(STORES.CATEGORIAS),
                bancos: await getAllEntries(STORES.BANCOS),
                reglas: await getAllEntries(STORES.REGLAS),
                saldoInicial: await getAllEntries(STORES.SALDO_INICIAL),
                inversiones: await getAllEntries(STORES.INVERSIONES),
                configuracion: {
                    tasaCambio: localStorage.getItem('tasaCambio'),
                    numeroModo: localStorage.getItem('numeroModo'),
                    bloqueoActivo: localStorage.getItem('bloqueoActivo'),
                    tema: localStorage.getItem('agendaTema'),
                    presupuestoMeta: localStorage.getItem('presupuestoMeta'),
                    presupuestoGastado: localStorage.getItem('presupuestoGastado'),
                    sonidosActivados: localStorage.getItem('sonidosActivados'),
                    umbralAlerta: localStorage.getItem('umbralAlerta')
                }
            }
        };

        return backupData;
    } catch (error) {
        console.error('Error creando datos de backup:', error);
        throw error;
    }
}

// Configuración de paginación
const MOVIMIENTOS_POR_PAGINA = 10;          // para la lista general
let paginaActual = 1;


// ✅ Variable global para guardar el ID del movimiento que se está editando
let idMovimientoEditando = null; 

/**
 * ## 1. Inicialización de la base de datos
 * Esta es la primera y más importante función. Se encarga de abrir la base de datos
 * y crear los almacenes de objetos si no existen.
 * */
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            db = event.target.result;
            console.log('Creando o actualizando almacenes de objetos...');

            // Almacén para movimientos
            if (!db.objectStoreNames.contains(STORES.MOVIMIENTOS)) {
                const movimientosStore = db.createObjectStore(STORES.MOVIMIENTOS, { keyPath: 'id', autoIncrement: true });
                movimientosStore.createIndex('fechaIndex', 'fecha', { unique: false });
                movimientosStore.createIndex('tipoIndex', 'tipo', { unique: false });
                movimientosStore.createIndex('bancoIndex', 'banco', { unique: false }); // Nuevo índice
            }

            // Almacén para categorías (usamos el nombre como clave)
            if (!db.objectStoreNames.contains(STORES.CATEGORIAS)) {
                db.createObjectStore(STORES.CATEGORIAS, { keyPath: 'nombre' });
            }

            // Almacén para bancos (usamos el nombre como clave)
            if (!db.objectStoreNames.contains(STORES.BANCOS)) {
                db.createObjectStore(STORES.BANCOS, { keyPath: 'nombre' });
            }

            // Almacén para reglas (con id autoincremental)
            if (!db.objectStoreNames.contains(STORES.REGLAS)) {
                const reglasStore = db.createObjectStore(STORES.REGLAS, { keyPath: 'id', autoIncrement: true });
                reglasStore.createIndex('palabraIndex', 'palabra', { unique: false });
            }

            // Almacén para el saldo inicial (un solo registro)
            if (!db.objectStoreNames.contains(STORES.SALDO_INICIAL)) {
                db.createObjectStore(STORES.SALDO_INICIAL, { keyPath: 'id' });
            }

            // Pestaña Inversiones
            if (!db.objectStoreNames.contains(STORES.INVERSIONES)) {
                db.createObjectStore(STORES.INVERSIONES, { keyPath: 'id', autoIncrement: true });
            }

            // Almacén Recordatorios
            if (!db.objectStoreNames.contains('recordatorios')) {
                const recStore = db.createObjectStore('recordatorios', { keyPath: 'id', autoIncrement: true });
            recStore.createIndex('fechaIndex', 'fechaLimite', { unique: false });
            }
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            console.log('IndexedDB abierta y lista.');
            resolve(db);
        };

        request.onerror = (event) => {
            console.error('Error al abrir IndexedDB:', event.target.error);
            reject(event.target.error);
        };
    });
}

// Funciones genéricas para interactuar con la DB con manejo de errores mejorado
async function addEntry(storeName, entry) {
    try {
        // Verificar si el object store existe antes de intentar usarlo
        if (!db.objectStoreNames.contains(storeName)) {
            console.warn(`Object store '${storeName}' no existe. Creándolo...`);
            await crearObjectStoreSiNoExiste(storeName);
        }

        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.add(entry);
            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    } catch (error) {
        console.error(`Error en addEntry para ${storeName}:`, error);
        throw error;
    }
}

async function getAllEntries(storeName) {
    try {
        // Verificar si el object store existe antes de intentar usarlo
        if (!db.objectStoreNames.contains(storeName)) {
            console.warn(`Object store '${storeName}' no existe. Creándolo...`);
            await crearObjectStoreSiNoExiste(storeName);
        }

        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    } catch (error) {
        console.error(`Error en getAllEntries para ${storeName}:`, error);
        throw error;
    }
}

// Función auxiliar para crear object stores dinámicamente si no existen
async function crearObjectStoreSiNoExiste(storeName) {
    return new Promise((resolve, reject) => {
        // Necesitamos cerrar la conexión actual y reabrirla con una nueva versión
        db.close();

        const nuevaVersion = DB_VERSION + 1; // Incrementar versión para permitir cambios de esquema
        const request = indexedDB.open(DB_NAME, nuevaVersion);

        request.onupgradeneeded = (event) => {
            const dbUpgrade = event.target.result;

            // Crear el object store que falta
            if (!dbUpgrade.objectStoreNames.contains(storeName)) {
                if (storeName === STORES.INVERSIONES) {
                    dbUpgrade.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
                } else {
                    // Para otros stores, usar configuración por defecto
                    dbUpgrade.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
                }
                console.log(`Object store '${storeName}' creado exitosamente`);
            }
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            console.log(`Base de datos actualizada a versión ${nuevaVersion}`);
            resolve();
        };

        request.onerror = (event) => {
            console.error('Error al actualizar la base de datos:', event.target.error);
            reject(event.target.error);
        };
    });
}

// ✅ Función para obtener un solo registro por ID
function getEntry(storeName, id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.errorCode);
    });
}

// ✅ Función para actualizar un registro existente
function updateEntry(storeName, entry) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(entry);

        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.errorCode);
    });
}

// ✅ Función para eliminar un registro
function deleteEntry(storeName, id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.errorCode);
    });
}

async function updateEntry(storeName, entry) {
    try {
        // Verificar si el object store existe antes de intentar usarlo
        if (!db.objectStoreNames.contains(storeName)) {
            console.warn(`Object store '${storeName}' no existe. Creándolo...`);
            await crearObjectStoreSiNoExiste(storeName);
        }

        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.put(entry);
            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    } catch (error) {
        console.error(`Error en updateEntry para ${storeName}:`, error);
        throw error;
    }
}

async function deleteEntry(storeName, key) {
    try {
        // Verificar si el object store existe antes de intentar usarlo
        if (!db.objectStoreNames.contains(storeName)) {
            console.warn(`Object store '${storeName}' no existe. Creándolo...`);
            await crearObjectStoreSiNoExiste(storeName);
        }

        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.delete(key);
            request.onsuccess = () => resolve(true);
            request.onerror = (event) => reject(event.target.error);
        });
    } catch (error) {
        console.error(`Error en deleteEntry para ${storeName}:`, error);
        throw error;
    }
}

// ✅ Función para cargar un movimiento en el formulario para editar
async function cargarMovimientoParaEditar(id) {
    if (await mostrarConfirmacion("¿Deseas editar este movimiento?")) {
        try {
            // ✅ MEJORA: Limpiar formulario antes de cargar
            limpiarForm();
            
            mostrarSideTab('movimientos');

            const movimiento = await getEntry(STORES.MOVIMIENTOS, id);
            if (movimiento) {
                // ✅ MEJORA: Cargar datos con validación
                document.getElementById('concepto').value = movimiento.concepto || '';
                document.getElementById('cantidad').value = movimiento.textoOriginal || movimiento.cantidad.toString();
                document.getElementById('tipo').value = movimiento.tipo || 'ingreso';
                document.getElementById('categoria').value = movimiento.categoria || '';
                
                // ✅ MEJORA: Formatear fecha correctamente
                const fecha = new Date(movimiento.fecha);
                const fechaFormateada = fecha.toISOString().split('T')[0];
                document.getElementById('fechaMov').value = fechaFormateada;
                
                document.getElementById('banco').value = movimiento.banco || '';

                // ✅ MEJORA: Mostrar botones de edición
                document.getElementById('btnAgregar').style.display = 'none';
                document.getElementById('btnActualizar').style.display = 'block';
                document.getElementById('btnCancelarEdicion').style.display = 'block';
                
                idMovimientoEditando = id;

                // ✅ MEJORA: Hacer scroll suave al formulario
                const formSection = document.querySelector('#side-movimientos section:first-of-type');
                if (formSection) {
                    formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
                
                // ✅ MEJORA: Mostrar notificación
                mostrarToast(`✏️ Editando: ${movimiento.concepto}`, 'info');
            }
        } catch (error) {
            console.error("Error al cargar movimiento para editar:", error);
            mostrarToast("❌ Error al cargar el movimiento para editar", 'danger');
        }
    }
}

// ✅ Función para actualizar el movimiento en la base de datos
async function actualizarMovimiento() {
    if (!idMovimientoEditando) {
        mostrarToast("No hay un movimiento seleccionado para editar.", 'danger');
        return;
    }

    const concepto = document.getElementById('concepto').value.trim();
    const cantidad = parseNumberVE(document.getElementById('cantidad').value); // ✅ CAMBIO CLAVE
    const tipo = document.getElementById('tipo').value;
    const categoria = document.getElementById('categoria').value;
    const fecha = new Date(document.getElementById('fechaMov').value + 'T12:00:00');
    const banco = document.getElementById('banco').value;

    // ✅ AÑADE ESTA VALIDACIÓN JUSTO ABAJO
    if (isNaN(cantidad) || cantidad <= 0) {
        mostrarToast('Ingresa una cantidad válida mayor a 0.', 'danger');
    return;
    }

        // ✅ OBTENER EL TEXTO ORIGINAL EN MODO LITERAL
        const modo = localStorage.getItem('numeroModo') || 'automatico';
        let textoOriginal = null;
        
        if (modo === 'literal') {
          textoOriginal = document.getElementById('cantidad').value;
        }
    
        const movimientoActualizado = {
        id: idMovimientoEditando,
        concepto: concepto,
        cantidad: cantidad,
        tipo: tipo,
        categoria: categoria,
        fecha: fecha.toISOString(),
        banco: banco,
        // ✅ NUEVO: Guardar texto original para modo literal
        textoOriginal: textoOriginal,
        // ✅ Recalcular comisión si es gasto, o poner 0 si no lo es
        comision: tipo === 'gasto' ? (cantidad * 0.003) : 0
    };

    try {
        await updateEntry(STORES.MOVIMIENTOS, movimientoActualizado);
        await renderizar();
        limpiarForm();
        mostrarToast("Movimiento actualizado con éxito.", 'success');
    } catch (error) {
        console.error("Error al actualizar movimiento:", error);
        mostrarToast("Error al actualizar el movimiento. Intenta de nuevo.", 'danger');
    }
}

// ✅ Función para cancelar la edición con confirmación
async function cancelarEdicion() {
    if (await mostrarConfirmacion("¿Estás seguro de que quieres cancelar la edición? Los cambios no se guardarán.")) {
        limpiarForm();
        idMovimientoEditando = null;
    }
}

// ✅ Función para eliminar un movimiento con confirmación
async function eliminarMovimiento(id) {
    if (await mostrarConfirmacion("¿Estás seguro de que quieres eliminar este movimiento?")) {
        try {
            await deleteEntry(STORES.MOVIMIENTOS, id);
            await renderizar();
            await actualizarSaldo();
            mostrarToast("Movimiento eliminado con éxito.", 'success');
        } catch (error) {
            console.error("Error al eliminar el movimiento:", error);
            mostrarToast("Error al eliminar el movimiento. Intenta de nuevo.", 'danger');
        }
    }
}

// ------------------------------------------------------------------------------------------------------------------------------------
//                                 Funciones de tu app, adaptadas a IndexedDB
// ------------------------------------------------------------------------------------------------------------------------------------

// Modificaciones en las funciones de tu app
async function agregarMovimiento() {
  if (idMovimientoEditando) {
    await actualizarMovimiento();
    return;
  }

  const concepto = document.getElementById('concepto').value.trim();
  const tipo = document.getElementById('tipo').value; // puede ser 'ingreso', 'gasto', 'saldo_inicial'
  const categoria = document.getElementById('categoria').value;
  const banco = document.getElementById('banco').value;
  const fechaInput = document.getElementById('fechaMov').value;

  // Validación básica
  if (!concepto || !banco || !fechaInput) {
    mostrarToast('Por favor, completa el concepto, el banco y la fecha.', 'danger');
    return;
  }

  let monto;
 if (tipo === 'saldo_inicial') {
    const saldoInicial = parseNumberVE(document.getElementById('saldoInicial').value); // ✅ CAMBIO CLAVE
    if (isNaN(saldoInicial) || saldoInicial <= 0) {
        mostrarToast('Ingresa un saldo inicial válido mayor a 0.', 'danger');
        return;
    }
    monto = saldoInicial;
 } else {
    const cantidad = parseNumberVE(document.getElementById('cantidad').value);
    if (isNaN(cantidad) || cantidad <= 0) {
        mostrarToast('Ingresa una cantidad válida mayor a 0.', 'danger');
        return;
    }
    monto = cantidad;
 }

    // ✅ OBTENER EL TEXTO ORIGINAL EN MODO LITERAL
    const modo = localStorage.getItem('numeroModo') || 'automatico';
    let textoOriginal = null;
    
    if (modo === 'literal') {
      if (tipo === 'saldo_inicial') {
        textoOriginal = document.getElementById('saldoInicial').value;
      } else {
        textoOriginal = document.getElementById('cantidad').value;
      }
    }
  
    // Crear movimiento
    const movimiento = {
      concepto: tipo === 'saldo_inicial'
        ? `${concepto} (Saldo inicial: ${banco})`
        : concepto,
      cantidad: monto,
      tipo: tipo === 'saldo_inicial' ? 'ingreso' : tipo,
      categoria: categoria || 'Sin categoría',
      fecha: new Date(fechaInput + 'T12:00:00').toISOString(),
      banco: banco,
      // ✅ NUEVO: Guardar texto original para modo literal
      textoOriginal: textoOriginal,
      // ✅ NUEVO: Calcular y guardar la comisión solo una vez
      comision: tipo === 'gasto' ? (monto * 0.003) : 0
   };

     // ✅ CAPTURAR RECIBO (si se subió)
    const fileInput = document.getElementById('recibo');
    const file = fileInput.files[0];
    let reciboBase64 = null;
    
    if (file) {
        const reader = new FileReader();
        // ⚠️ ¡IMPORTANTE! Debemos usar una función asíncrona para esperar la lectura
        // Por eso, vamos a usar una función interna y retornar una promesa
        return new Promise((resolve, reject) => {
            reader.onload = function(e) {
                movimiento.recibo = e.target.result; // base64
                // Limpiar el input para la próxima vez
                fileInput.value = '';
                // Continuar con la inserción normal
                addEntry(STORES.MOVIMIENTOS, movimiento)
                    .then(() => {
                        renderizar();
                        actualizarSaldo();
                        limpiarForm();
                        mostrarToast("✅ Movimiento agregado con éxito.", 'success');
                        resolve();
                    })
                    .catch(error => {
                        console.error("Error al agregar movimiento:", error);
                        mostrarToast("Error al guardar el movimiento.", 'danger');
                        reject(error);
                    });
            };
            reader.onerror = () => {
                mostrarToast("❌ Error al leer el archivo.", 'danger');
                reject(new Error("Error al leer el archivo"));
            };
            reader.readAsDataURL(file); // Convierte a base64
        });
    }

  try {
    // Si hay un recibo, ya estamos dentro de una promesa → no hacemos nada aquí
    // Si no hay recibo, ejecutamos normalmente
    if (!document.getElementById('recibo').files[0]) {
        await addEntry(STORES.MOVIMIENTOS, movimiento);
        await renderizar();
        await actualizarSaldo();
        limpiarForm();
        mostrarToast("✅ Movimiento agregado con éxito.", 'success');
    }
  } catch (error) {
    console.error("Error al agregar movimiento:", error);
    mostrarToast("Error al guardar el movimiento.", 'danger');
  }
}

async function calcularSaldo() {
    const movimientos = await getAllEntries(STORES.MOVIMIENTOS);
    // ✅ Sumar solo las comisiones ya guardadas
    const totalComisiones = movimientos
        .filter(m => m.tipo === 'gasto')
        .reduce((sum, m) => sum + m.comision, 0);

    // ✅ Calcular saldo base: ingresos - gastos (sin volver a calcular comisión)
    const saldoBase = movimientos.reduce((acc, m) => {
        if (m.tipo === 'gasto') {
            return acc - m.cantidad; // Solo el gasto real
        } else {
            return acc + m.cantidad; // Ingresos y saldos iniciales
        }
    }, 0);

    // ✅ Restar solo las comisiones ya guardadas
    return saldoBase - totalComisiones;
}

async function actualizarSaldo() {
    const saldoBs = await calcularSaldo();
    document.getElementById('saldo').textContent = 'Bs. ' + formatNumberVE(saldoBs);

    // ✅ NUEVO: DETECTAR INCONSISTENCIA — Si hay movimientos pero saldo = 0, ¡reparar!
    const movimientos = await getAllEntries(STORES.MOVIMIENTOS);
    const tieneMovimientos = movimientos.length > 0;
    const saldoCero = Math.abs(saldoBs) < 0.01; // Consideramos 0 si es menor a 1 céntimo

    if (tieneMovimientos && saldoCero) {
        console.warn('⚠️ Inconsistencia detectada: Hay movimientos pero saldo = 0. Ejecutando reparación...');
        repararApp(); // ¡Llama a la reparación automática!
    }

    // ✅ NUEVO: Mostrar o ocultar aviso de comisión
    const aviso = document.getElementById('saldoAviso');
    if (aviso) {
        aviso.style.display = Math.abs(saldoBs) > 0.01 ? 'block' : 'none';
    }

    const umbral = 500;
    const alerta = document.getElementById('alertaSaldo');
    document.getElementById('umbralAlerta').textContent = umbral;
    if (saldoBs < umbral) {
        alerta.style.display = 'block';
    } else {
        alerta.style.display = 'none';
    }

    actualizarEquivalente();
}

async function renderizar() {
    const movimientos = await getAllEntries(STORES.MOVIMIENTOS);

    const ul = document.getElementById('listaMovimientos');
    ul.innerHTML = '';

    const filtro = document.getElementById('filtroBanco').value;
    const texto = document.getElementById('txtBuscar').value.trim().toLowerCase();

    // Filtrar movimientos reales
    let listaFiltrada = movimientos.filter(m =>
        (filtro ? (m.banco || '(Sin banco)') === filtro : true) &&
        (texto ? (m.concepto + (m.categoria || '') + (m.banco || '')).toLowerCase().includes(texto) : true)
    );

    // Ordenar por fecha descendente (los más recientes primero)
    listaFiltrada.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    // Paginación
    // Paginación
    const totalMovimientos = listaFiltrada.length;
    const totalPaginas = Math.ceil(totalMovimientos / MOVIMIENTOS_POR_PAGINA);
    
    paginaActual = Math.min(paginaActual, totalPaginas || 1);
    paginaActual = Math.max(paginaActual, 1);

    const inicio = (paginaActual - 1) * MOVIMIENTOS_POR_PAGINA;
    const fin = inicio + MOVIMIENTOS_POR_PAGINA;
    const movimientosPagina = listaFiltrada.slice(inicio, fin);

    // Renderizar movimientos de la página actual
    movimientosPagina.forEach(m => {
        if (m.oculto) return;

        const li = document.createElement('li');

        const esSaldoInicial = m.concepto.includes('Saldo inicial');
        const conceptoBase = esSaldoInicial ? m.concepto.split(' (')[0] : m.concepto;
        const saldoInicialTexto = esSaldoInicial ? m.concepto.split(' (')[1]?.replace(')', '') : '';

        // Calcular comisión si es gasto
        const esGasto = m.tipo === 'gasto';
        const comision = esGasto && m.comision !== undefined && !isNaN(m.comision) ? m.comision.toFixed(2) : null;

        li.innerHTML = `
    <div class="movimiento-card">
        <!-- Header con tipo de movimiento e ícono -->
        <div class="movimiento-header">
            <div class="movimiento-tipo ${m.tipo}">
                <span class="tipo-icon">${getMovementIcon(m.tipo)}</span>
                <span class="tipo-label">${getMovementTypeLabel(m.tipo)}</span>
            </div>
            <div class="movimiento-fecha">
                <span class="fecha-principal">${formatDate(m.fecha)}</span>
                <span class="fecha-relativa">${getRelativeDate(m.fecha)}</span>
            </div>
        </div>

        <!-- Contenido principal -->
        <div class="movimiento-contenido">
            <div class="movimiento-info">
                <h3 class="movimiento-concepto">${conceptoBase}</h3>
                ${saldoInicialTexto ? `<div class="movimiento-saldo-inicial">${saldoInicialTexto}</div>` : ''}
                <div class="movimiento-detalles">
                    <span class="categoria-tag ${m.categoria ? 'categoria-activa' : 'categoria-vacia'}">
                        <span class="categoria-icon">🏷️</span>
                        ${m.categoria || 'Sin categoría'}
                    </span>
                    <span class="banco-tag">
                        <span class="banco-icon">🏦</span>
                        ${m.banco || '(Sin banco)'}
                    </span>
                </div>
            </div>

            <!-- Cantidad destacada -->
            <div class="movimiento-cantidad ${m.tipo}">
                <span class="cantidad-valor">${displayNumber(m.cantidad, m.textoOriginal)} Bs</span>
                ${comision ? `<div class="cantidad-comision">Comisión: ${comision} Bs</div>` : ''}
            </div>
        </div>

        <!-- Footer con acciones -->
        <div class="movimiento-footer">
            ${m.recibo ? `
                <button onclick="verRecibo('${m.recibo}')" class="btn-recibo">
                    <span class="btn-icon">📎</span>
                    Ver recibo
                </button>
            ` : ''}
            <div class="acciones-principales">
                <button class="btn-editar-mov" data-id="${m.id}">
                    <span class="btn-icon">✏️</span>
                </button>
                <button class="btn-eliminar-mov" data-id="${m.id}">
                    <span class="btn-icon">🗑️</span>
                </button>
            </div>
        </div>
    </div>
`;
        ul.appendChild(li);
    });

    // ✅ Añadir Event Listeners para los botones de editar y eliminar
document.querySelectorAll('.btn-editar-mov').forEach(button => {
    button.addEventListener('click', e => {
        const id = parseInt(e.target.closest('button').dataset.id);
        cargarMovimientoParaEditar(id);
    });
});

document.querySelectorAll('.btn-eliminar-mov').forEach(button => {
    button.addEventListener('click', e => {
        const id = parseInt(e.target.closest('button').dataset.id);
        eliminarMovimiento(id);
    });
});

    // Renderizar controles de paginación
    renderizarControlesPaginacion(totalPaginas);

    // Verificar si hay movimientos para mostrar el botón de reporte
    const controlesReporte = document.getElementById('botonReporte');
    if (controlesReporte) {
        controlesReporte.style.display = totalMovimientos > 0 ? 'block' : 'none';
    }

    // Actualizar saldo y demás
    actualizarSaldo();
    actualizarGrafico();
    actualizarBarChart();
    actualizarResumenBancosCompleto();
}

function renderizarControlesPaginacion(totalPaginas) {
    const controles = document.getElementById('controlesPaginacion');
    if (!controles) return;

    // Solo mostrar controles si hay más de una página
    if (totalPaginas <= 1) {
        controles.innerHTML = '';
        return;
    }

    controles.innerHTML = `
        <div style="display:flex; gap:0.5rem; align-items:center; justify-content:center; margin-top:1rem; font-size:0.875rem;">
            <button onclick="cambiarPagina(${Math.max(1, paginaActual - 1)})" ${paginaActual <= 1 ? 'disabled' : ''} 
                    style="padding:0.3rem 0.6rem; font-size:0.875rem; background:#0b57d0; color:white; border:none; border-radius:4px; cursor:pointer;">
                ◀ Anterior
            </button>
            <span style="color:var(--text-light);">Página ${paginaActual} de ${totalPaginas}</span>
            <button onclick="cambiarPagina(${Math.min(totalPaginas, paginaActual + 1)})" ${paginaActual >= totalPaginas ? 'disabled' : ''} 
                    style="padding:0.3rem 0.6rem; font-size:0.875rem; background:#0b57d0; color:white; border:none; border-radius:4px; cursor:pointer;">
                Siguiente ▶
            </button>
        </div>
    `;
}

async function cambiarPagina(nuevaPagina) {
    paginaActual = nuevaPagina;
    await renderizar();

    // ✅ Scroll automático hacia la lista de movimientos después de cambiar página
    scrollToListaMovimientos();
}

async function borrar(id) {
    try {
        await deleteEntry(STORES.MOVIMIENTOS, id);
        await renderizar();     // ← Renderiza la lista
        await actualizarSaldo(); // ← ¡Asegura que el saldo se actualice!
    } catch (error) {
        console.error("Error al borrar el movimiento:", error);
    }
}

async function guardarCambio(id, campo, valor) {
    if (isNaN(valor) && campo === 'cantidad') return;
    try {
        const movimientos = await getAllEntries(STORES.MOVIMIENTOS);
        const mov = movimientos.find(m => m.id === id);
        if (mov) {
            mov[campo] = valor;
            await updateEntry(STORES.MOVIMIENTOS, mov);
            renderizar();
        }
    } catch (error) {
        console.error("Error al guardar el cambio:", error);
    }
}

async function cargarSelectBancos() {
    const bancos = (await getAllEntries(STORES.BANCOS)).map(b => b.nombre);
    // ✅ ORDENAR ALFABÉTICAMENTE
    bancos.sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
    
    const select = document.getElementById('banco');
    // Conservamos "(Sin banco)" y "+ Nuevo..." si existen
    const sinBancoOpt = select.querySelector('option[value=""]');
    const nuevoOpt = select.querySelector('option[value="Otro"]');
    select.innerHTML = '';
    if (sinBancoOpt) select.appendChild(sinBancoOpt);
    bancos.forEach(b => {
        const opt = document.createElement('option');
        opt.value = b;
        opt.textContent = b;
        select.appendChild(opt);
    });
    if (nuevoOpt) select.appendChild(nuevoOpt);

    cargarSelectBancoRegla();
    cargarSelectEliminarBancos();
}

async function renderizarResumenBancos() {
    const movimientos = await getAllEntries(STORES.MOVIMIENTOS);
    const bancos = [...new Set(movimientos.map(m => (m.banco && typeof m.banco === 'string' ? m.banco : '(Sin banco)')))];
    // ✅ ORDENAR ALFABÉTICAMENTE
    bancos.sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));

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

    const ul = document.getElementById('listaBancos');
    ul.innerHTML = '';
    bancos.forEach(b => {
        const ingresos = movimientos
            .filter(m => (m.banco || '(Sin banco)') === b && m.tipo === 'ingreso')
            .reduce((s, m) => s + m.cantidad, 0);
        const gastos = movimientos
            .filter(m => (m.banco || '(Sin banco)') === b && m.tipo === 'gasto')
            .reduce((s, m) => s + m.cantidad, 0);
        const saldo = ingresos - gastos;

        const nombreBanco = (b === '(Sin banco)' || !b || typeof b !== 'string') ? '(Sin banco)' : b;
        const li = document.createElement('li');
        li.innerHTML = `<span>${nombreBanco}</span><span>Bs. ${saldo.toFixed(2)}</span>`;
        ul.appendChild(li);
    });
}

async function actualizarGrafico() {
    if (typeof Chart === 'undefined') return;
    const movimientos = await getAllEntries(STORES.MOVIMIENTOS);
    const gastos = movimientos.filter(m => m.tipo === 'gasto');
    const totales = {};
    gastos.forEach(m => {
        const cat = m.categoria || 'Sin categoría';
        totales[cat] = (totales[cat] || 0) + m.cantidad;
    });
    const labels = Object.keys(totales);
    const data = Object.values(totales).map(n => n); // No cambiamos el array, solo lo usamos para el gráfico
    if (window.miGrafico) window.miGrafico.destroy();
    window.miGrafico = new Chart(document.getElementById('torta'), {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: ['#0b57d0', '#018642', '#b00020', '#ff9800', '#9c27b0']
            }]
        },
        options: { plugins: { legend: { position: 'bottom' } } }
    });
}

async function actualizarBarChart() {
    if (typeof Chart === 'undefined') return;
    const movimientos = await getAllEntries(STORES.MOVIMIENTOS);
    const ingresos = {};
    const gastos = {};
    movimientos.forEach(m => {
        const fecha = new Date(m.fecha);
        const clave = fecha.getFullYear() + '-' + String(fecha.getMonth() + 1).padStart(2, '0');
        if (m.tipo === 'ingreso') {
            ingresos[clave] = (ingresos[clave] || 0) + m.cantidad;
        } else {
            gastos[clave] = (gastos[clave] || 0) + m.cantidad;
        }
    });
    const meses = [...new Set([...Object.keys(ingresos), ...Object.keys(gastos)])].sort();
    const dataIng = meses.map(m => ingresos[m] || 0);
    const dataGas = meses.map(m => gastos[m] || 0);
    if (window.miBarChart) window.miBarChart.destroy();
    window.miBarChart = new Chart(document.getElementById('barChart'), {
        type: 'bar',
        data: {
            labels: meses,
            datasets: [{
                label: 'Ingresos',
                data: dataIng,
                backgroundColor: '#018642'
            }, {
                label: 'Gastos',
                data: dataGas,
                backgroundColor: '#b00020'
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'bottom' } },
            scales: { y: { beginAtZero: true } }
        }
    });
}

async function actualizarResumenBancosCompleto() {
    try {
        const movimientos = await getAllEntries(STORES.MOVIMIENTOS);
        const tbody = document.getElementById('tablaBancos').querySelector('tbody');
        tbody.innerHTML = '';

        // ✅ PASO 1: Agrupar movimientos por banco
        const bancos = [...new Set(movimientos.map(m => m.banco || '(Sin banco)'))];
        const resumenBancos = {};

        bancos.forEach(banco => {
            // Filtrar movimientos de este banco
            const movimientosBanco = movimientos.filter(m => m.banco === banco);

            // ✅ Calcular saldo inicial: suma de movimientos con concepto que contiene "(Saldo inicial:"
            const saldoInicial = movimientosBanco
                .filter(m => m.concepto.includes('(Saldo inicial:'))
                .reduce((sum, m) => sum + m.cantidad, 0);

            // ✅ Calcular ingresos: todos los movimientos de tipo "ingreso" que NO sean saldo inicial
            const ingresos = movimientosBanco
                .filter(m => m.tipo === 'ingreso' && !m.concepto.includes('(Saldo inicial:'))
                .reduce((sum, m) => sum + m.cantidad, 0);

            // ✅ Calcular gastos: todos los movimientos de tipo "gasto"
            const gastos = movimientosBanco
                .filter(m => m.tipo === 'gasto')
                .reduce((sum, m) => sum + m.cantidad, 0);

            // ✅ Calcular saldo final
            const saldoFinal = saldoInicial + ingresos - gastos;

            resumenBancos[banco] = { saldoInicial, ingresos, gastos, saldoFinal };
        });

        // ✅ PASO 2: Calcular el saldo general total
        const saldoGeneralTotal = Object.values(resumenBancos).reduce((sum, banco) => sum + banco.saldoFinal, 0);

        // ✅ PASO 3: Renderizar la tabla
        for (const banco in resumenBancos) {
            const data = resumenBancos[banco];
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${banco}</td>
                <td style="text-align:right; font-weight: 500;">
                    ${formatNumberVE(data.saldoInicial)} Bs
                </td>
                <td style="text-align:right; font-weight: 500; color: var(--success);">
                    +${formatNumberVE(data.ingresos)} Bs
                </td>
                <td style="text-align:right; font-weight: 500; color: var(--danger);">
                    -${formatNumberVE(data.gastos)} Bs
                </td>
                <td style="text-align:right; font-weight: 700;">
                    ${formatNumberVE(data.saldoFinal)} Bs
                </td>
            `;
            tbody.appendChild(tr);
        }

        // ✅ PASO 4: Actualizar el saldo global
        document.getElementById('saldo').textContent = `Bs. ${formatNumberVE(saldoGeneralTotal)}`;
        document.getElementById('totalGeneral').textContent = formatNumberVE(saldoGeneralTotal);

        // Actualizar el equivalente en otra moneda
        const tasaCambio = parseFloat(document.getElementById('tasaCambio').value);
        if (!isNaN(tasaCambio) && tasaCambio > 0) {
            const equivalente = saldoGeneralTotal / tasaCambio;
            document.getElementById('equivalente').textContent = formatNumberVE(equivalente);
        }
    } catch (error) {
        console.error("Error al actualizar el resumen por banco:", error);
    }
}

async function exportarExcel() {
    const movimientos = await getAllEntries(STORES.MOVIMIENTOS);
    if (!movimientos.length) return alert('No hay movimientos para exportar');
    const wb = XLSX.utils.book_new();
    const wsData = [
        ['Concepto', 'Cantidad', 'Tipo', 'Categoría', 'Banco', 'Fecha'],
    ];
    movimientos.forEach(m => {
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
    ws['!cols'] = [
        { wch: 25 }, { wch: 12 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 12 }
    ];
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
    XLSX.writeFile(wb, 'Agenda_Bancaria.xlsx');
}

// Funciones de UI/UX del código original
function limpiarForm() {
    document.getElementById('saldoInicial').value = '';
    document.getElementById('concepto').value = '';
    document.getElementById('cantidad').value = '';
    document.getElementById('tipo').value = 'ingreso';
    document.getElementById('categoria').value = '';
    document.getElementById('nuevaCategoria').value = '';
    document.getElementById('nuevaCategoria').style.display = 'none';
    document.getElementById('banco').value = '';
    document.getElementById('nuevoBanco').value = '';
    document.getElementById('nuevoBanco').style.display = 'none';
    

    // ✅ MANTENER LA FECHA ACTUAL EN EL CAMPO, NUNCA VACÍO
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('fechaMov').value = today;
    document.getElementById('recibo').value = ''; // ✅ LIMPIAR RECIBO AL CERRAR
    document.getElementById('concepto').focus();

    // ✅ Restaurar los botones del formulario y la variable global
    document.getElementById('btnAgregar').style.display = 'block';
    document.getElementById('btnActualizar').style.display = 'none';
    document.getElementById('btnCancelarEdicion').style.display = 'none';
    idMovimientoEditando = null;
}

function mostrarSideTab(id) {
    document.querySelectorAll('.side-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.side-tab').forEach(btn => btn.classList.remove('active'));
    document.getElementById('side-' + id).classList.add('active');
    document.querySelector(`[onclick="mostrarSideTab('${id}')"]`).classList.add('active');
    localStorage.setItem('agendaPestañaActiva', id);

    // ✅ Reproducir sonido al cambiar de pestaña
    reproducirSonidoCambioPestana();

    // ✅ ACTUALIZAR DINÁMICAMENTE LA PESTAÑA ACTIVA
    switch(id) {
        case 'dashboard':
            actualizarDashboard();
            break;
        case 'movimientos':
            renderizar();
            break;
        case 'analisis':
            actualizarGrafico();
            actualizarBarChart();
            renderizarResumenBancos();
            break;
        case 'presupuesto':
            actualizarPresupuesto();
            break;
        case 'presupuesto-sugerido':
                cargarCategoriasPresupuesto();
                setTimeout(() => {
                cargarPresupuestoSugeridoGuardado();
                mostrarHistorialPresupuestos();
                }, 300);
        break;

        case 'ahorro':
            calcularAhorroMensual();
            break;
        case 'comparacion':
            renderizarComparacionBancos();
            break;
        case 'herramientas':
            // No necesita acción específica
            break;
        case 'calendario': // ✅ ¡NUEVO CASO! - Esto es lo que faltaba
            renderizarCalendario();
            break;
        case 'inversiones':
            renderizarInversiones();
            break;
        case 'deudas':
            cargarDeudas();
            break;
        case 'config':
            // No necesita acción específica
            break;
            case 'cambios':
                // ✅ Mostrar información de versión del sistema
                mostrarInfoCambios();
                break;

        case 'recordatorios':
            (async () => {
                await renderizarRecordatoriosPestana();
                })();
                break;
        
    }

    // ✅ MOSTRAR VERSIÓN EN EL PANEL DE CONFIGURACIÓN
    const versionElementConfig = document.getElementById('versionConfig');
    if (versionElementConfig) {
        versionElementConfig.textContent = APP_VERSION;
    }

    if (id === 'presupuesto-sugerido') {
    cargarCategoriasPresupuesto();
}

}

// ======================================================================================
// 🎯 BUSCADOR ESPECÍFICO PARA MOVIMIENTOS
// ======================================================================================

// ======================================================================================
// ✅ BUSCADOR MEJORADO DE MOVIMIENTOS
// ======================================================================================

/**
 * Función mejorada para buscar movimientos en tiempo real
 * Busca en concepto, categoría, banco, monto, fecha y tipo
 */
function buscarMovimientos() {
    const query = document.getElementById('buscadorMovimientos').value.toLowerCase().trim();
    
    if (!query) {
        renderizar();
        ocultarContadorBusqueda();
        return;
    }

    try {
        const transaction = db.transaction([STORES.MOVIMIENTOS], 'readonly');
        const store = transaction.objectStore(STORES.MOVIMIENTOS);
        const request = store.getAll();

        request.onsuccess = function(event) {
            const movimientos = event.target.result;
            const resultados = movimientos.filter(movimiento => {
                return coincideConBusqueda(movimiento, query);
            });

            mostrarResultadosBusqueda(resultados, query);
        };

        request.onerror = function() {
            mostrarToast('❌ Error al buscar movimientos', 'danger');
        };

    } catch (error) {
        mostrarToast('❌ Error en la búsqueda: ' + error.message, 'danger');
    }
}

/**
 * Verifica si un movimiento coincide con la búsqueda
 */
function coincideConBusqueda(movimiento, query) {
    // Buscar en concepto (prioridad alta)
    if (movimiento.concepto && movimiento.concepto.toLowerCase().includes(query)) {
        return true;
    }

    // Buscar en categoría
    if (movimiento.categoria && movimiento.categoria.toLowerCase().includes(query)) {
        return true;
    }

    // Buscar en banco (prioridad alta para tu caso)
    if (movimiento.banco && movimiento.banco.toLowerCase().includes(query)) {
        return true;
    }

    // Buscar en tipo
    if (movimiento.tipo && movimiento.tipo.toLowerCase().includes(query)) {
        return true;
    }

    // Buscar en monto (números)
    if (query.match(/^\d/)) {
        const montoStr = movimiento.cantidad.toString();
        if (montoStr.includes(query.replace(/[.,]/g, ''))) {
            return true;
        }
    }

    // Buscar en fecha
    if (movimiento.fecha) {
        const fecha = new Date(movimiento.fecha);
        const fechaStr = fecha.toLocaleDateString('es-ES');
        if (fechaStr.toLowerCase().includes(query)) {
            return true;
        }
        
        // Buscar por componentes individuales
        if (fecha.getDate().toString().includes(query) || 
            (fecha.getMonth() + 1).toString().includes(query) ||
            fecha.getFullYear().toString().includes(query)) {
            return true;
        }
    }

    return false;
}

/**
 * Mostrar resultados de búsqueda
 */
function mostrarResultadosBusqueda(resultados, query) {
    const listaMovimientos = document.getElementById('listaMovimientos');
    
    if (resultados.length === 0) {
        listaMovimientos.innerHTML = generarMensajeSinResultados(query);
        mostrarContadorBusqueda(0, query);
        return;
    }

    let html = '';
    resultados.forEach(movimiento => {
        html += generarHTMLMovimiento(movimiento, query);
    });

    listaMovimientos.innerHTML = html;
    mostrarContadorBusqueda(resultados.length, query);
}

/**
 * Generar HTML para un movimiento con resaltado
 */
function generarHTMLMovimiento(movimiento, query) {
    const fecha = new Date(movimiento.fecha);
    const fechaFormateada = fecha.toLocaleDateString('es-ES');
    const montoFormateado = formatNumberVE(movimiento.cantidad);
    const tipoIcon = movimiento.tipo === 'ingreso' ? '💰' : '💸';
    const tipoClass = movimiento.tipo === 'ingreso' ? 'tipo-ingreso' : 'tipo-gasto';

    return `
        <li class="movimiento-item" data-id="${movimiento.id}">
            <div class="movimiento-header">
                <span class="movimiento-tipo ${tipoClass}">${tipoIcon} ${movimiento.tipo.toUpperCase()}</span>
                <span class="movimiento-fecha">${fechaFormateada}</span>
            </div>
            <div class="movimiento-contenido">
                <div class="movimiento-concepto">${resaltarCoincidencia(movimiento.concepto || 'Sin concepto', query)}</div>
                <div class="movimiento-detalles">
                    <span class="movimiento-categoria">🏷️ ${resaltarCoincidencia(movimiento.categoria || 'Sin categoría', query)}</span>
                    <span class="movimiento-banco">🏦 ${resaltarCoincidencia(movimiento.banco || 'Sin banco', query)}</span>
                </div>
            </div>
            <div class="movimiento-monto ${tipoClass}">
                ${tipoIcon} ${montoFormateado}
            </div>
            <div class="movimiento-acciones">
                <button onclick="editarMovimiento(${movimiento.id})" class="btn-editar" title="Editar">✏️</button>
                <button onclick="eliminarMovimiento(${movimiento.id})" class="btn-eliminar" title="Eliminar">🗑️</button>
            </div>
        </li>
    `;
}

/**
 * Generar mensaje cuando no hay resultados
 */
function generarMensajeSinResultados(query) {
    return `
        <div style="text-align: center; padding: 2rem; color: var(--text-light);">
            <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
            <h3>No se encontraron resultados</h3>
            <p>No hay movimientos que coincidan con: <strong>"${query}"</strong></p>
            <div style="background: var(--info-bg); padding: 1rem; border-radius: 8px; margin-top: 1rem; border-left: 4px solid var(--info);">
                <p style="margin: 0; color: var(--info-text); font-size: 0.9rem;">
                    💡 <strong>Consejos de búsqueda:</strong><br>
                    - Busca por nombre del banco<br>
                    - Escribe parte del concepto<br>
                    - Busca por monto aproximado<br>
                    - Usa fechas (día/mes/año)<br>
                    - Prueba términos más cortos
                </p>
            </div>
        </div>
    `;
}

/**
 * Resaltar texto que coincide con la búsqueda
 */
function resaltarCoincidencia(texto, query) {
    if (!query || !texto || !texto.toLowerCase().includes(query.toLowerCase())) {
        return texto;
    }
    
    const regex = new RegExp(`(${query})`, 'gi');
    return texto.replace(regex, '<mark style="background: #ffeb3b; color: #333; padding: 2px 4px; border-radius: 3px;">$1</mark>');
}

/**
 * Mostrar contador de resultados de búsqueda
 */
function mostrarContadorBusqueda(cantidad, query) {
    let contador = document.getElementById('contadorBusqueda');
    if (!contador) {
        contador = document.createElement('div');
        contador.id = 'contadorBusqueda';
        contador.style.cssText = `
            background: var(--primary-bg);
            color: var(--primary);
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-size: 0.9rem;
            font-weight: 500;
            margin-bottom: 1rem;
            text-align: center;
            border: 2px solid var(--primary);
        `;
        
        const buscador = document.getElementById('buscadorMovimientos');
        buscador.parentNode.insertBefore(contador, buscador.nextSibling);
    }

    if (cantidad === 0) {
        contador.style.display = 'none';
    } else {
        contador.innerHTML = `🔍 <strong>${cantidad}</strong> resultados para "<strong>${query}</strong>"`;
        contador.style.display = 'block';
    }
}

/**
 * Ocultar contador de búsqueda
 */
function ocultarContadorBusqueda() {
    const contador = document.getElementById('contadorBusqueda');
    if (contador) {
        contador.style.display = 'none';
    }
}

/**
 * Función auxiliar para formateo de números venezolano
 */
function formatNumberVE(numero) {
    if (typeof numero !== 'number') {
        numero = parseFloat(numero) || 0;
    }
    
    return numero.toLocaleString('es-VE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// ======================================================================================
// FIN DE BUSCADOR MEJORADO DE MOVIMIENTOS
// ======================================================================================

document.addEventListener('DOMContentLoaded', function() {
    const buscadorMovimientos = document.getElementById('buscadorMovimientos');
    if (buscadorMovimientos) {
        buscadorMovimientos.addEventListener('input', buscarMovimientos);
        buscadorMovimientos.addEventListener('paste', function() {
            setTimeout(buscarMovimientos, 10);
        });
    }
});

// ✅ Función para mostrar resultado de búsqueda
function mostrarResultadoBusquedaMovimientos(encontrados) {
    const buscador = document.getElementById('buscadorMovimientos');
    const placeholder = document.getElementById('placeholderBusqueda');
    
    if (!buscador) return;

    if (terminoBusquedaMovimientos && encontrados === 0) {
        buscador.style.borderColor = 'var(--danger)';
        buscador.placeholder = '❌ No se encontraron movimientos...';
    } else {
        buscador.style.borderColor = '';
        buscador.placeholder = '🔍 Buscar movimientos por concepto, categoría o banco...';
    }
}

// ======================================================================================
// 🎯 MEJORAS PARA NAVEGACIÓN DEL MENÚ LATERAL
// ======================================================================================

// Sistema mejorado para el menú lateral existente
class SidebarManager {
    constructor() {
        this.searchTerm = '';
        this.init();
    }

    init() {
        this.setupSearch();
        this.setupKeyboardShortcuts();
        this.setupTabNavigation();
    }

    // Configurar búsqueda en el menú
    setupSearch() {
        const searchInput = document.getElementById('navSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value.toLowerCase();
                this.filterTabs();
            });

            // Buscar también al pegar
            searchInput.addEventListener('paste', () => {
                setTimeout(() => this.filterTabs(), 10);
            });
        }
    }

    // Filtrar pestañas según búsqueda
    filterTabs() {
        const tabs = document.querySelectorAll('.side-tab');
        let visibleCount = 0;

        tabs.forEach(tab => {
            const text = tab.textContent.toLowerCase();
            const shouldShow = !this.searchTerm || text.includes(this.searchTerm);

            if (shouldShow) {
                tab.style.display = 'block';
                tab.style.opacity = '1';
                tab.style.transform = 'scale(1)';
                visibleCount++;
            } else {
                tab.style.display = 'none';
                tab.style.opacity = '0.3';
                tab.style.transform = 'scale(0.95)';
            }
        });

        // Mostrar resultado de búsqueda
        this.showSearchResults(visibleCount);
    }

    // Mostrar resultados de búsqueda
    showSearchResults(count) {
        const searchInput = document.getElementById('navSearch');
        if (this.searchTerm && count === 0) {
            searchInput.style.borderColor = 'var(--danger)';
            searchInput.placeholder = '❌ No encontrado...';
        } else {
            searchInput.style.borderColor = '';
            searchInput.placeholder = '🔍 Buscar pestañas...';
        }
    }

    // Atajos de teclado mejorados
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Solo si no estamos en input/textarea
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            const key = e.key.toLowerCase();
            const shortcuts = {
                'd': 'dashboard',
                'm': 'movimientos',
                'a': 'analisis',
                'p': 'presupuesto',
                'h': 'herramientas',
                'c': 'calendario',
                'i': 'inversiones',
                'u': 'deudas',
                'g': 'config',
                'b': 'cambios'
            };

            if (shortcuts[key] && !e.ctrlKey && !e.altKey) {
                e.preventDefault();
                mostrarSideTab(shortcuts[key]);
                mostrarToast(`⚡ ${shortcuts[key]}`, 'info');
            }

            // Ctrl+K para focus en búsqueda del menú
            if (e.ctrlKey && key === 'k') {
                e.preventDefault();
                const searchInput = document.getElementById('navSearch');
                if (searchInput) {
                    searchInput.focus();
                    searchInput.select();
                }
            }
        });
    }

    // Mejorar navegación de pestañas
    setupTabNavigation() {
        document.querySelectorAll('.side-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                // Limpiar búsqueda después de seleccionar
                const searchInput = document.getElementById('navSearch');
                if (searchInput) {
                    searchInput.value = '';
                    this.searchTerm = '';
                    this.filterTabs();
                }
            });
        });
    }
}

// Inicializar mejoras del menú lateral
document.addEventListener('DOMContentLoaded', function() {
    window.sidebarManager = new SidebarManager();
});

function actualizarEquivalente() {
    // 1. Obtener saldo actual (ya formateado en Bs.)
    const saldoBsText = document.getElementById('saldo').textContent.replace('Bs. ', '');
    // Limpiar: eliminar puntos (miles) y reemplazar coma por punto
    const cleaned = saldoBsText.replace(/\./g, '').replace(',', '.');
    const saldoBs = parseFloat(cleaned);
    if (isNaN(saldoBs)) {
        document.getElementById('equivalente').textContent = 'Tasa inválida';
        document.getElementById('tasaActual').textContent = 'Tasa actual: 1 USD = 0,00 Bs';
        return;
    }

    // 2. Obtener tasa del input (tal cual, sin tocar nada)
    const inputTasa = document.getElementById('tasaCambio').value.trim();
    let tasa;
    if (!inputTasa) {
        tasa = 0;
    } else {
        // Limpiar: eliminar puntos (miles) y reemplazar coma por punto
        const cleanedTasa = inputTasa.replace(/\./g, '').replace(',', '.');
        tasa = parseFloat(cleanedTasa);
    }

    // 3. Validar y calcular
    if (isNaN(tasa) || tasa <= 0) {
        document.getElementById('equivalente').textContent = 'Tasa inválida';
        document.getElementById('tasaActual').textContent = 'Tasa actual: 1 USD = 0,00 Bs';
        return;
    }

    // 4. Calcular equivalente
    const equivalente = saldoBs / tasa;

    // 5. Determinar moneda y símbolo
    const monedaDestino = document.getElementById('monedaDestino').value;
    let simbolo = '$';
    let nombreMoneda = 'USD';
    if (monedaDestino === 'EUR') { simbolo = '€'; nombreMoneda = 'EUR'; }
    if (monedaDestino === 'COP') { simbolo = 'COL$'; nombreMoneda = 'COP'; }
    if (monedaDestino === 'ARS') { simbolo = 'ARS$'; nombreMoneda = 'ARS'; }
    if (monedaDestino === 'MXN') { simbolo = 'MX$'; nombreMoneda = 'MXN'; }

    // ✅ 6. FORMATEAR EL EQUIVALENTE COMO QUIERES: 5.030,01
    // Convertir a string con 2 decimales
    const equivalenteStr = equivalente.toFixed(2); // "5030.01"
    const partes = equivalenteStr.split('.');
    const entera = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.'); // "5.030"
    const decimal = partes[1] ? ',' + partes[1] : ''; // ",01"
    const formatoEquivalente = entera + decimal; // "5.030,01"

    // 7. Mostrar resultados
    document.getElementById('equivalente').textContent = `${simbolo} ${formatoEquivalente}`;
    document.getElementById('tasaActual').textContent = `Tasa actual: 1 ${nombreMoneda} = ${formatNumberVE(tasa)} Bs`;

    // ✅ GUARDAR LA TASA EN localStorage PARA QUE NO SE PIERDA
    localStorage.setItem('tasaCambio', inputTasa); // ✅ Guardamos el TEXTO ORIGINAL
}

function aplicarTemaInicial() {
    const guardado = localStorage.getItem('agendaTema');
    if (guardado === 'claro') document.body.classList.add('modo-claro');
    else if (guardado === 'oscuro') document.body.classList.add('modo-oscuro');
}

// ---- Funciones para categorías (adaptadas) ----
async function agregarCategoria() {
    const input = document.getElementById('nuevaCategoria');
    const nombre = input.value.trim();

    if (!nombre) {
        alert('Por favor, ingresa un nombre para la categoría.');
        return;
    }

    try {
        await addEntry(STORES.CATEGORIAS, { nombre });
        await actualizarSelectCategorias();
        input.value = ''; // Limpiar campo
        input.style.display = 'none'; // Ocultar nuevamente
        document.getElementById('categoria').value = nombre; // Seleccionar la nueva categoría
        alert(`✅ Categoría "${nombre}" agregada.`);
    } catch (error) {
        console.error("Error al agregar categoría:", error);
        alert("Error al agregar la categoría.");
    }
}

async function actualizarSelectCategorias() {
    const cats = (await getAllEntries(STORES.CATEGORIAS)).map(c => c.nombre);
    // ✅ ORDENAR ALFABÉTICAMENTE (ignorando mayúsculas/minúsculas)
    cats.sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
    
    const select = document.getElementById('categoria');
    const optOtro = select.options[select.options.length - 1];
    while (select.options.length > 2) select.remove(1);
    cats.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        select.insertBefore(opt, optOtro);
    });
    cargarSelectEliminarCategorias();
}

async function eliminarCategoria() {
    const select = document.getElementById('selectEliminarCategoria');
    const categoria = select.value;
    if (!categoria) {
        alert('Selecciona una categoría para eliminar.');
        return;
    }
    if (!confirm(`¿Seguro que quieres eliminar la categoría "${categoria}"? Los movimientos que la usan quedarán sin categoría.`)) {
        return;
    }
    try {
        await deleteEntry(STORES.CATEGORIAS, categoria);
        const movimientos = await getAllEntries(STORES.MOVIMIENTOS);
        const movimientosActualizados = movimientos.map(m => {
            if (m.categoria === categoria) {
                m.categoria = 'Sin categoría';
            }
            return m;
        });
        const transaction = db.transaction([STORES.MOVIMIENTOS], 'readwrite');
        const store = transaction.objectStore(STORES.MOVIMIENTOS);
        movimientosActualizados.forEach(m => store.put(m));

        await actualizarSelectCategorias();
        await cargarSelectEliminarCategorias();
        await renderizar();
        alert(`Categoría "${categoria}" eliminada.`);
    } catch (error) {
        console.error("Error al eliminar categoría:", error);
    }
}

async function cargarSelectEliminarCategorias() {
    const select = document.getElementById('selectEliminarCategoria');
    const categorias = (await getAllEntries(STORES.CATEGORIAS)).map(c => c.nombre);
    // ✅ ORDENAR ALFABÉTICAMENTE
    categorias.sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
    
    while (select.options.length > 1) {
        select.remove(1);
    }
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

// ---- Funciones para bancos (adaptadas) ----
async function agregarBanco() {
    const input = document.getElementById('nuevoBanco');
    const nombre = input.value.trim();

    if (!nombre) {
        alert('Por favor, ingresa un nombre para el banco.');
        return;
    }

    try {
        await addEntry(STORES.BANCOS, { nombre });
        await cargarSelectBancos();
        input.value = ''; // Limpiar campo
        input.style.display = 'none'; // Ocultar nuevamente
        document.getElementById('banco').value = nombre; // Seleccionar el nuevo banco
        alert(`✅ Banco "${nombre}" agregado.`);
    } catch (error) {
        console.error("Error al agregar banco:", error);
        alert("Error al agregar el banco.");
    }
}

async function eliminarBanco() {
    const select = document.getElementById('selectEliminarBanco');
    const banco = select.value;
    if (!banco) {
        alert('Selecciona un banco para eliminar.');
        return;
    }
    const movimientos = await getAllEntries(STORES.MOVIMIENTOS);
    const afectados = movimientos.filter(m => m.banco === banco).length;
    if (!confirm(`¿Seguro que quieres eliminar el banco "${banco}"? \n\nSe quitará de ${afectados} movimiento${afectados !== 1 ? 's' : ''}.`)) {
        return;
    }
    try {
        await deleteEntry(STORES.BANCOS, banco);
        const transaction = db.transaction([STORES.MOVIMIENTOS], 'readwrite');
        const store = transaction.objectStore(STORES.MOVIMIENTOS);
        movimientos.forEach(m => {
            if (m.banco === banco) {
                m.banco = '(Sin banco)';
                store.put(m);
            }
        });
        await cargarSelectBancos();
        await cargarSelectBancoRegla();
        await cargarSelectEliminarBancos();
        await renderizar();
        alert(`✅ Banco "${banco}" eliminado.\nSe actualizó${afectados !== 1 ? 'ron' : ''} ${afectados} movimiento${afectados !== 1 ? 's' : ''}.`);
    } catch (error) {
        console.error("Error al eliminar el banco:", error);
    }
}

async function cargarSelectEliminarBancos() {
    const select = document.getElementById('selectEliminarBanco');
    const bancos = (await getAllEntries(STORES.BANCOS)).map(b => b.nombre);
    // ✅ ORDENAR ALFABÉTICAMENTE
    bancos.sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
    
    while (select.options.length > 1) {
        select.remove(1);
    }
    bancos.forEach(b => {
        const opt = document.createElement('option');
        opt.value = b;
        opt.textContent = b;
        select.appendChild(opt);
    });
}

async function cargarSelectBancoRegla() {
    const select = document.getElementById('txtBancoRegla');
    const bancos = (await getAllEntries(STORES.BANCOS)).map(b => b.nombre);
    // ✅ ORDENAR ALFABÉTICAMENTE
    bancos.sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
    
    const cualquierBanco = select.options[0];
    const nuevoOpt = select.options[select.options.length - 1];
    select.innerHTML = '';
    select.appendChild(cualquierBanco);
    bancos.forEach(b => {
        const opt = document.createElement('option');
        opt.value = b;
        opt.textContent = b;
        select.appendChild(opt);
    });
    select.appendChild(nuevoOpt);
}

// ---- Funciones para reglas (adaptadas) ----
async function agregarRegla() {
    const palabra = document.getElementById('txtPalabra').value.trim();
    const categoria = document.getElementById('txtCat').value.trim();
    const banco = document.getElementById('txtBancoRegla').value;
    if (!palabra || !categoria) {
        alert('Debes ingresar una palabra clave y una categoría.');
        return;
    }
    const nuevaRegla = { palabra, categoria, banco: banco === 'Otro' ? document.getElementById('nuevoBancoRegla').value.trim() : banco };
    try {
        await addEntry(STORES.REGLAS, nuevaRegla);
        alert('Regla guardada con éxito.');
        document.getElementById('txtPalabra').value = '';
        document.getElementById('txtCat').value = '';
        document.getElementById('txtBancoRegla').value = '';
        renderizarReglas();
    } catch (error) {
        console.error("Error al agregar la regla:", error);
    }
}

async function renderizarReglas() {
    const reglas = await getAllEntries(STORES.REGLAS);
    const ul = document.getElementById('listaReglas');
    ul.innerHTML = '';
    reglas.forEach(r => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>"${r.palabra}" &rarr; ${r.categoria} (${r.banco || 'cualquier banco'})</span>
            <button onclick="eliminarRegla(${r.id})">❌</button>
        `;
        ul.appendChild(li);
    });
}

async function eliminarRegla(id) {
    if (!confirm('¿Seguro que quieres eliminar esta regla?')) return;
    try {
        await deleteEntry(STORES.REGLAS, id);
        renderizarReglas();
    } catch (error) {
        console.error("Error al eliminar la regla:", error);
    }
}

async function eliminarSaldoInicial() {
    if (!confirm('¿Seguro que quieres eliminar el saldo inicial? Esto borrará la base contable.')) {
        return;
    }
    try {
        await deleteEntry(STORES.SALDO_INICIAL, 'saldo');
        alert('Saldo inicial eliminado.');
        await renderizar();
        await actualizarSaldo();
    } catch (error) {
        console.error("Error al eliminar saldo inicial:", error);
    }
}

function toggleLista() {
    const contenedor = document.getElementById('listaContenedor');
    const icono = document.getElementById('iconoFlecha');

    if (contenedor.style.display === 'none') {
        contenedor.style.display = 'block';
        icono.textContent = '▲'; // Flecha hacia arriba
    } else {
        contenedor.style.display = 'none';
        icono.textContent = '▼'; // Flecha hacia abajo
    }
}

// ------------------------------------------------------------------------------------------------------------------------------------
//                                 Funciones de Presupuesto
// ------------------------------------------------------------------------------------------------------------------------------------

async function actualizarPresupuesto() {
    const movimientos = await getAllEntries(STORES.MOVIMIENTOS);
    const fechaHoy = new Date();
    const fechaHace30Dias = new Date(fechaHoy.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Filtrar gastos de los últimos 30 días
    const gastosUltimos30Dias = movimientos.filter(m =>
        m.tipo === 'gasto' &&
        new Date(m.fecha) >= fechaHace30Dias &&
        new Date(m.fecha) <= fechaHoy
    );

    const totalGastado = gastosUltimos30Dias.reduce((sum, m) => sum + m.cantidad, 0);
    const meta = parseFloat(localStorage.getItem('metaPresupuesto')) || 0;

    // Actualizar elementos de la UI
    document.getElementById('presupuestoActual').value = formatNumberVE(totalGastado);
    document.getElementById('gastadoTexto').textContent = `Bs. ${formatNumberVE(totalGastado)}`;
    document.getElementById('metaTexto').textContent = `Bs. ${formatNumberVE(meta)}`;

    // Calcular porcentaje
    const porcentaje = meta > 0 ? Math.min(100, Math.max(0, (totalGastado / meta) * 100)) : 0;
    const porcentajeTexto = Math.round(porcentaje);
    document.getElementById('progresoTexto').textContent = `${porcentajeTexto}%`;
    document.getElementById('barraProgreso').style.width = `${porcentaje}%`;

    // Cambiar color de la barra según progreso
    const barra = document.getElementById('barraProgreso');
    if (porcentaje >= 90) {
        barra.style.background = 'linear-gradient(90deg, #b00020, #d93025)'; // Rojo
    } else if (porcentaje >= 70) {
        barra.style.background = 'linear-gradient(90deg, #ff9800, #ff6b00)'; // Naranja
    } else {
        barra.style.background = 'linear-gradient(90deg, #018642, #0b57d0)'; // Verde/Azul
    }

    // Renderizar detalles
    renderizarPresupuestoTarjetas();
}

function renderizarDetallesPresupuesto(gastos) {
    const ul = document.getElementById('listaPresupuestoDetalles');
    ul.innerHTML = '';

    if (gastos.length === 0) {
        ul.innerHTML = '<li style="text-align:center; color:var(--text-light); padding:1rem;">No hay gastos en los últimos 30 días.</li>';
        return;
    }

    // Agrupar por categoría
    const resumenCategorias = {};
    gastos.forEach(m => {
        const cat = m.categoria || 'Sin categoría';
        resumenCategorias[cat] = (resumenCategorias[cat] || 0) + m.cantidad;
    });

    // Ordenar por monto (de mayor a menor)
    const categoriasOrdenadas = Object.entries(resumenCategorias).sort((a, b) => b[1] - a[1]);

    categoriasOrdenadas.forEach(([categoria, monto]) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                <span style="font-weight:500;">${categoria}</span>
                <span style="font-weight:600; color:var(--danger);">Bs. ${formatNumberVE(monto)}</span>
            </div>
        `;
        ul.appendChild(li);
    });
}

async function guardarMetaPresupuesto() {
    const metaInput = document.getElementById('metaPresupuesto').value;
    const meta = parseFloat(metaInput);

    if (isNaN(meta) || meta < 0) {
        alert('Por favor, ingresa una meta válida (mayor o igual a 0).');
        return;
    }

    localStorage.setItem('metaPresupuesto', meta.toString());
    alert('✅ Meta de presupuesto guardada con éxito.');
    await actualizarPresupuesto(); // Actualizar inmediatamente
}

// Cargar la meta guardada al iniciar
async function cargarMetaPresupuesto() {
    const metaGuardada = localStorage.getItem('metaPresupuesto');
    const metaInput = document.getElementById('metaPresupuesto');
    const metaTexto = document.getElementById('metaTexto');
    const leyenda = document.getElementById('leyendaPresupuesto'); // ✅ Nueva referencia

    if (metaGuardada) {
        metaInput.value = parseFloat(metaGuardada).toFixed(2);
        metaTexto.textContent = `Bs. ${parseFloat(metaGuardada).toFixed(2)}`;
        if (leyenda) leyenda.style.display = 'none'; // Ocultar leyenda si hay meta
    } else {
        metaInput.value = '';
        metaTexto.textContent = 'Bs. 0';
        if (leyenda) leyenda.style.display = 'block'; // Mostrar leyenda si no hay meta
    }

    await actualizarPresupuesto(); // Inicializar el gráfico siempre
}

// ------------------------------------------------------------------------------------------------------------------------------------
//                                 Funciones de Presupuesto (continuación)
// ------------------------------------------------------------------------------------------------------------------------------------

async function eliminarMetaPresupuesto() {
    if (!confirm('¿Estás seguro de que quieres eliminar tu meta de presupuesto? Esto borrará tu objetivo mensual y la barra volverá a 0%.')) {
        return;
    }
    localStorage.removeItem('metaPresupuesto');
    document.getElementById('metaPresupuesto').value = '';
    document.getElementById('metaTexto').textContent = 'Bs. 0';
    document.getElementById('progresoTexto').textContent = '0%';
    document.getElementById('barraProgreso').style.width = '0%';
    document.getElementById('barraProgreso').style.background = 'linear-gradient(90deg, #018642, #0b57d0)'; // Volver a verde
    alert('✅ Meta de presupuesto eliminada con éxito.');
    await actualizarPresupuesto(); // Actualiza el gasto actual y el desglose
}

function mostrarModalReporte() {
    document.getElementById('modalReporte').style.display = 'flex';
}

function cerrarModalReporte() {
    document.getElementById('modalReporte').style.display = 'none';
    document.getElementById('formCategoria').style.display = 'none';
    document.getElementById('formFecha').style.display = 'none';
}

async function mostrarSeleccionCategoria() {
    const categorias = await getAllEntries(STORES.CATEGORIAS);
    // ✅ ORDENAR ALFABÉTICAMENTE
    categorias.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
    
    const select = document.getElementById('selectCategoriaReporte');
    select.innerHTML = '<option value="">Selecciona una categoría</option>';
    categorias.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.nombre;
        opt.textContent = c.nombre;
        select.appendChild(opt);
    });
    document.getElementById('formCategoria').style.display = 'block';
    document.getElementById('modalReporte').style.display = 'none';
}

function cerrarFormCategoria() {
    document.getElementById('formCategoria').style.display = 'none';
    document.getElementById('modalReporte').style.display = 'flex';
}

function mostrarSeleccionFecha() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const fechaActual = `${yyyy}-${mm}-${dd}`;
    
    document.getElementById('fechaDesde').value = '';
    document.getElementById('fechaHasta').value = fechaActual;
    
    document.getElementById('formFecha').style.display = 'block';
    document.getElementById('modalReporte').style.display = 'none';
}

function cerrarFormFecha() {
    document.getElementById('formFecha').style.display = 'none';
    document.getElementById('modalReporte').style.display = 'flex';
}

function generarReporteGeneral() {
    generarReporteBase(null, null, "Reporte Financiero General");
}

// ✅ Función para Reporte por Categoría
function generarReportePorCategoria() {
    const categoria = document.getElementById('selectCategoriaReporte').value;
    if (!categoria) {
        alert('Selecciona una categoría.');
        return;
    }
    generarReporteBase(categoria, null, `Reporte por Categoría: "${categoria}"`);
}

// ✅ Función para Reporte por Fecha
function generarReportePorFecha() {
    const desde = document.getElementById('fechaDesde').value;
    const hasta = document.getElementById('fechaHasta').value;
    if (!desde || !hasta) {
        alert('Selecciona las fechas.');
        return;
    }
    generarReporteBase(null, { desde, hasta }, `Reporte por Fecha: ${new Date(desde).toLocaleDateString()} a ${new Date(hasta).toLocaleDateString()}`);
}

// ✅ FUNCIÓN UNIFICADA PARA GENERAR CUALQUIER TIPO DE REPORTE (General, por Categoría, por Fecha)
async function generarReporteBase(categoriaFiltrada, rangoFechas, titulo) {
    const movimientos = await getAllEntries(STORES.MOVIMIENTOS);
    const tasaCambio = parseFloat(document.getElementById('tasaCambio').value) || 0;

    // Filtrar movimientos según categoría y/o rango de fechas
    let movimientosFiltrados = movimientos.filter(m => {
        let cumple = true;

        // Filtrar por categoría
        if (categoriaFiltrada && m.categoria !== categoriaFiltrada) {
            cumple = false;
        }

        // Filtrar por rango de fechas
        if (rangoFechas) {
            const fechaMov = new Date(m.fecha);
            if (fechaMov < new Date(rangoFechas.desde) || fechaMov > new Date(rangoFechas.hasta)) {
                cumple = false;
            }
        }

        return cumple;
    });

    // Agrupar movimientos por banco
    const bancos = [...new Set(movimientosFiltrados.map(m => m.banco || '(Sin banco)'))];
    const resumenBancos = {};

    bancos.forEach(banco => {
        const movimientosBanco = movimientosFiltrados.filter(m => m.banco === banco);

        // Saldo inicial: suma de movimientos con concepto que contiene "(Saldo inicial:"
        const saldoInicial = movimientosBanco
            .filter(m => m.concepto.includes('(Saldo inicial:'))
            .reduce((sum, m) => sum + m.cantidad, 0);

        // Ingresos: suma de movimientos de tipo "ingreso" que NO sean saldo inicial
        const ingresos = movimientosBanco
            .filter(m => m.tipo === 'ingreso' && !m.concepto.includes('(Saldo inicial:'))
            .reduce((sum, m) => sum + m.cantidad, 0);

        // Gastos: suma de movimientos de tipo "gasto"
        const gastos = movimientosBanco
            .filter(m => m.tipo === 'gasto')
            .reduce((sum, m) => sum + m.cantidad, 0);

        // Saldo final
        const saldoFinal = saldoInicial + ingresos - gastos;

        resumenBancos[banco] = { saldoInicial, ingresos, gastos, saldoFinal };
    });

    // Calcular la disponibilidad total (suma de todos los saldos finales)
    const disponibilidadTotal = Object.values(resumenBancos).reduce((sum, banco) => sum + banco.saldoFinal, 0);

    // Calcular equivalente en dólares
    const equivalenteDolares = tasaCambio > 0 ? disponibilidadTotal / tasaCambio : 0;

    // Crear contenido HTML para impresión
    const contenido = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${titulo} - SFP</title>
            <style>
                body { 
                    font-family: 'Roboto', sans-serif; 
                    padding: 1.5rem; 
                    color: var(--text); 
                    background: white; /* Fondo blanco para impresión */
                    line-height: 1.5;
                    font-size: 10pt;
                    margin: 0;
                }
                h1 { 
                    text-align: center; 
                    color: #0b57d0; 
                    margin-bottom: 0.5rem; 
                    font-size: 1.4rem;
                    font-weight: 500;
                    page-break-after: avoid;
                }
                .fecha-generacion {
                    text-align: center;
                    font-size: 0.85rem;
                    color: var(--text-light);
                    margin-bottom: 1.5rem;
                    page-break-after: avoid;
                }
                h2 { 
                    text-align: center; 
                    color: #0b57d0; 
                    margin: 1.5rem 0 1rem 0; 
                    font-weight: 600;
                    font-size: 1.1rem;
                    page-break-after: avoid;
                }
                .resumen-bancos {
                    margin-bottom: 2rem;
                    break-inside: avoid;
                }
                table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin-bottom: 2rem;
                    table-layout: fixed;
                    font-size: 9pt;
                    break-inside: avoid;
                }
                th, td { 
                    padding: 0.6rem; 
                    border-bottom: 1px solid #ddd;
                    word-break: keep-all; /* ✅ ¡CLAVE! Evita romper palabras */
                    white-space: nowrap; /* ✅ ¡CLAVE! Evita saltos de línea */
                    overflow: hidden; /* ✅ Oculta lo que se sale */
                    text-overflow: ellipsis; /* ✅ Añade "..." si se corta demasiado */
                    break-inside: avoid;
                }
                th { 
                    background: #0b57d0; 
                    color: white; 
                    font-weight: 600;
                    text-align: center;
                    font-size: 9pt;
                    padding: 0.6rem;
                }
                tr:nth-child(even) { 
                    background-color: #f9f9f9; 
                }
                /* ✅ ALINEACIÓN ESPECÍFICA POR COLUMNA */
                th:first-child, td:first-child {
                    width: 28%; /* Ancho fijo para el nombre del banco */
                    text-align: left; /* Alinear a la izquierda */
                    font-weight: 500;
                    word-break: keep-all;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 250px;
                    font-family: 'Roboto', sans-serif;
                }
                th:nth-child(2),
                td:nth-child(2),
                th:nth-child(3),
                td:nth-child(3),
                th:nth-child(4),
                td:nth-child(4),
                th:nth-child(5),
                td:nth-child(5) {
                    width: 18%; /* Ancho fijo para cada columna de monto */
                    text-align: right; /* Alinear a la derecha */
                    font-family: 'Space Mono', monospace; /* Fuente monoespaciada para números */
                    letter-spacing: -0.1px;
                    word-break: keep-all;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                /* ✅ Asegurar que el último td (saldo final) no se vea más ancho */
                td:last-child {
                    font-weight: 700;
                    text-align: right;
                }
                .total { 
                    font-weight: bold; 
                    font-size: 1rem; 
                    color: #0b57d0; 
                    text-align: right; 
                    margin-top: 1.5rem; 
                    padding-top: 1rem;
                    border-top: 2px solid #0b57d0;
                    break-inside: avoid;
                }
                .equivalente { 
                    font-weight: bold; 
                    font-size: 1rem; 
                    color: #0b57d0; 
                    text-align: right; 
                    margin-top: 0.5rem;
                    break-inside: avoid;
                }
                @media print {
                    body { padding: 0; margin: 0; }
                    button, .btn, .side-tab { display: none !important; }
                    * {
                        box-shadow: none !important;
                        text-shadow: none !important;
                        background: white !important;
                        color: black !important;
                    }
                    .resumen-bancos, table, th, td, tr, h1, h2, .total, .equivalente {
                        break-inside: avoid !important;
                        page-break-inside: avoid !important;
                    }
                }
            </style>
        </head>
        <body>
            <h1>${titulo}</h1>
            
            <div class="fecha-generacion">
                Generado el: ${new Date().toLocaleDateString('es-VE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} a las ${new Date().toLocaleTimeString('es-VE')}
            </div>

            <h2 style="text-align: center; margin-bottom: 1rem;">Resumen por Banco</h2>
            
            <div class="resumen-bancos">
                <table>
                    <thead>
                        <tr>
                            <th style="text-align: left;">Banco</th>
                            <th style="text-align: right;">Saldo Inicial</th>
                            <th style="text-align: right;">Ingresos</th>
                            <th style="text-align: right;">Gastos</th>
                            <th style="text-align: right;">Saldo Final</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.entries(resumenBancos).map(([banco, datos]) => `
                            <tr>
                                <td style="text-align: left; font-weight: 500;">
                                    ${banco}
                                </td>
                                <td style="text-align: right; font-weight: 500;">
                                    Bs. ${formatNumberVE(datos.saldoInicial)}
                                </td>
                                <td style="text-align: right; font-weight: 500; color: var(--success);">
                                    Bs. ${formatNumberVE(datos.ingresos)}
                                </td>
                                <td style="text-align: right; font-weight: 500; color: var(--danger);">
                                    Bs. ${formatNumberVE(datos.gastos)}
                                </td>
                                <td style="text-align: right; font-weight: 700;">
                                    Bs. ${formatNumberVE(datos.saldoFinal)}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <!-- Disponibilidad Total -->
            <div class="total">
                <strong>Disponibilidad Total (Suma de todos los bancos):</strong> Bs. ${formatNumberVE(disponibilidadTotal)}
            </div>

            <!-- Equivalente en Dólares -->
            <div class="equivalente">
                <strong>Equivalente en USD (Tasa: 1 USD = ${tasaCambio.toLocaleString('es-VE')} Bs):</strong> $ ${formatNumberVE(equivalenteDolares)}
            </div>

            <script>
                window.print();
            </script>
        </body>
        </html>
    `;

    // Abrir en nueva ventana para imprimir
    const ventana = window.open('', '_blank');
    ventana.document.write(contenido);
    ventana.document.close();
}

// ------------------------------------------------------------------------------------------------------------------------------------
//                                 Bloqueo de App (PIN Local)
// ------------------------------------------------------------------------------------------------------------------------------------

// Cargar configuración de bloqueo al iniciar
async function cargarConfigBloqueo() {
    const activado = localStorage.getItem('bloqueoActivo') === 'true';
    const pinGuardado = localStorage.getItem('bloqueoPIN');
    document.getElementById('bloqueoActivo').checked = activado;
    document.getElementById('bloqueoPINContainer').style.display = activado ? 'block' : 'none';

    // Si está activado, mostrar modal de bloqueo si no se ha desbloqueado aún
    if (activado && !localStorage.getItem('bloqueoDesbloqueado')) {
        mostrarModalBloqueo();
    }
}

// Mostrar el modal de bloqueo
function mostrarModalBloqueo() {
    document.getElementById('modalBloqueo').style.display = 'flex';
    document.getElementById('pinInput').value = '';
}

// Cerrar el modal de bloqueo
function cerrarModalBloqueo() {
    document.getElementById('modalBloqueo').style.display = 'none';
    document.getElementById('pinInput').value = '';
    document.getElementById('avisoPinOlvidado').style.display = 'none'; // ✅ REINICIAR AVISO
    localStorage.setItem('intentosFallidos', '0'); // ✅ REINICIAR CONTADOR
}

// Desbloquear la app con el PIN
async function desbloquearApp() {
    const pinIngresado = document.getElementById('pinInput').value.trim().toLowerCase();
    const pinGuardado = localStorage.getItem('bloqueoPIN');
    const aviso = document.getElementById('avisoPinOlvidado');

    // ✅ Reiniciar contador si se ingresa algo válido
    if (pinIngresado === 'reset' || (pinIngresado.length === 4 && pinIngresado === pinGuardado)) {
        localStorage.setItem('intentosFallidos', '0'); // Reiniciar contador
        aviso.style.display = 'none';
    }

    // ✅ MODO DE EMERGENCIA: Si se ingresa "reset", desactiva el bloqueo
    if (pinIngresado === 'reset') {
        if (confirm('⚠️ ¿Estás seguro de que quieres desactivar el bloqueo de la app? \n\nEsto eliminará tu PIN y permitirá el acceso sin restricciones. \n\nSolo haz esto si olvidaste tu PIN y no tienes otra copia de seguridad.')) {
            localStorage.removeItem('bloqueoPIN');
            localStorage.removeItem('bloqueoActivo');
            localStorage.removeItem('bloqueoDesbloqueado');
            alert('🔒 Bloqueo desactivado con éxito. Ahora puedes acceder sin PIN.');
            cerrarModalBloqueo();
        }
        return;
    }

    // Validación normal de PIN
    if (!pinIngresado || pinIngresado.length !== 4) {
        alert('Ingresa un PIN de 4 dígitos o escribe "reset" para desactivar el bloqueo.');
        return;
    }

    if (pinIngresado === pinGuardado) {
        localStorage.setItem('bloqueoDesbloqueado', 'true');
        localStorage.setItem('intentosFallidos', '0'); // Reiniciar contador
        aviso.style.display = 'none';
        cerrarModalBloqueo();
        const pestaña = localStorage.getItem('agendaPestañaActiva');
        if (pestaña) mostrarSideTab(pestaña);
    } else {
        // Contar intentos fallidos
        let intentos = parseInt(localStorage.getItem('intentosFallidos')) || 0;
        intentos++;
        localStorage.setItem('intentosFallidos', intentos.toString());

        // Mostrar aviso después de 2 intentos fallidos
        if (intentos >= 2) {
            aviso.style.display = 'block';
        }

        alert('PIN incorrecto. Intenta de nuevo.\n\n¿Olvidaste tu PIN? Escribe "reset" para desactivar el bloqueo.');
        document.getElementById('pinInput').value = '';
    }
}

// Guardar PIN
async function guardarPIN() {
    const pin = document.getElementById('bloqueoPIN').value.trim();
    const pinConfirm = document.getElementById('bloqueoPINConfirmar').value.trim();

    if (!pin || pin.length !== 4 || !pinConfirm || pinConfirm.length !== 4) {
        alert('El PIN debe tener exactamente 4 dígitos.');
        return;
    }

    if (pin !== pinConfirm) {
        alert('Los PINs no coinciden. Vuelve a intentarlo.');
        document.getElementById('bloqueoPIN').value = '';
        document.getElementById('bloqueoPINConfirmar').value = '';
        return;
    }

    localStorage.setItem('bloqueoPIN', pin);
    alert('✅ PIN guardado con éxito.');
    document.getElementById('bloqueoPIN').value = '';
    document.getElementById('bloqueoPINConfirmar').value = '';

    actualizarBotonBloqueo();
}

// Eliminar PIN
async function eliminarPIN() {
    if (!confirm('¿Estás seguro de que quieres eliminar tu PIN? Ya no podrás bloquear la app.')) return;
    localStorage.removeItem('bloqueoPIN');
    localStorage.removeItem('bloqueoDesbloqueado');
    document.getElementById('bloqueoPIN').value = '';
    document.getElementById('bloqueoPINConfirmar').value = '';
    alert('PIN eliminado.');

    actualizarBotonBloqueo();
}

// Controlar el checkbox de activación
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('bloqueoActivo').addEventListener('change', function() {
        const container = document.getElementById('bloqueoPINContainer');
        if (this.checked) {
            container.style.display = 'block';
            localStorage.setItem('bloqueoActivo', 'true');
            // Si ya hay un PIN guardado, no pedirlo hasta que se cierre y vuelva a abrir
            if (localStorage.getItem('bloqueoPIN')) {
                localStorage.removeItem('bloqueoDesbloqueado'); // Forzar bloqueo en próxima apertura
            }
        } else {
            container.style.display = 'none';
            localStorage.setItem('bloqueoActivo', 'false');
            localStorage.removeItem('bloqueoDesbloqueado'); // Limpiar estado
        }
    });
});

// ✅ Renderiza la lista de categorías editables (con clic para editar)
async function renderizarCategoriasEditables() {
    const ul = document.getElementById('listaCategoriasEditables');
    ul.innerHTML = '';
    const categorias = await getAllEntries(STORES.CATEGORIAS);
    if (categorias.length === 0) {
        ul.innerHTML = '<li style="color: var(--text-light); padding: 0.75rem;">No hay categorías aún.</li>';
        return;
    }
    categorias.forEach(cat => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="categoria-nombre" style="font-weight:500; cursor:pointer; padding:0.5rem; border-radius:6px; display:inline-block; margin-right:0.5rem;"
                  data-nombre="${cat.nombre}" 
                  ondblclick="editarCategoria('${cat.nombre}')">
                ${cat.nombre}
            </span>
            <button onclick="eliminarCategoriaPorNombre('${cat.nombre}')" style="padding:0.3rem 0.6rem; font-size:0.8rem; background:#b00020; color:white; border:none; border-radius:4px; cursor:pointer;">
                ❌
            </button>
        `;
        ul.appendChild(li);
    });
}

// ✅ Renderiza la lista de bancos editables (con clic para editar)
async function renderizarBancosEditables() {
    const ul = document.getElementById('listaBancosEditables');
    ul.innerHTML = '';
    const bancos = await getAllEntries(STORES.BANCOS);
    if (bancos.length === 0) {
        ul.innerHTML = '<li style="color: var(--text-light); padding: 0.75rem;">No hay bancos aún.</li>';
        return;
    }
    bancos.forEach(banco => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="banco-nombre" style="font-weight:500; cursor:pointer; padding:0.5rem; border-radius:6px; display:inline-block; margin-right:0.5rem;"
                  data-nombre="${banco.nombre}" 
                  ondblclick="editarBanco('${banco.nombre}')">
                ${banco.nombre}
            </span>
            <button onclick="eliminarBancoPorNombre('${banco.nombre}')" style="padding:0.3rem 0.6rem; font-size:0.8rem; background:#b00020; color:white; border:none; border-radius:4px; cursor:pointer;">
                ❌
            </button>
        `;
        ul.appendChild(li);
    });
}

// ✅ Función para editar una categoría (doble clic → transforma en input)
function editarCategoria(nombreActual) {
    const spans = document.querySelectorAll('.categoria-nombre');
    const span = Array.from(spans).find(s => s.getAttribute('data-nombre') === nombreActual);
    if (!span) return;

    // ✅ OCULTAR EL SPAN ORIGINAL (esto es clave para que guardarBanco lo encuentre)
    span.style.display = 'none';

    // Crear input
    const input = document.createElement('input');
    input.type = 'text';
    input.value = nombreActual;
    input.style.width = '100%';
    input.style.padding = '0.5rem';
    input.style.border = '1px solid #ccc';
    input.style.borderRadius = '6px';
    input.style.marginRight = '0.5rem';
    input.style.fontWeight = '500';
    input.style.backgroundColor = 'var(--card-bg)';
    input.style.color = 'var(--text)';

    // Reemplazar span por input
    span.parentNode.replaceChild(input, span);

    // Enfocar y seleccionar texto
    input.focus();
    input.select();

    // Guardar al presionar Enter o al perder foco
    input.addEventListener('blur', guardarCategoria);
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            guardarCategoria();
        }
    });
}

// ✅ Función para guardar la categoría editada
// ✅ Función para guardar la categoría editada
async function guardarCategoria() {
    const input = event.target;
    const nuevoNombre = input.value.trim();
    
    // Buscar el span original que fue reemplazado
    // ✅ Guardamos el nombre anterior ANTES de que se reemplace
    const spanOriginal = document.querySelector('.categoria-nombre[style*="display: none"]');
    if (!spanOriginal) {
        // Si no se encuentra el span oculto, buscar por el atributo data-nombre que estaba antes
        const spans = document.querySelectorAll('.categoria-nombre');
        const spanAnterior = Array.from(spans).find(s => s.style.display === 'none');
        if (spanAnterior) {
            const nombreAnterior = spanAnterior.getAttribute('data-nombre');
            if (nombreAnterior === nuevoNombre) {
                input.parentNode.replaceChild(spanAnterior, input);
                return;
            }
            // Si el nombre anterior es diferente, lo usamos
            if (nombreAnterior) {
                // Verificar duplicados
                const categorias = await getAllEntries(STORES.CATEGORIAS);
                if (categorias.some(c => c.nombre === nuevoNombre && c.nombre !== nombreAnterior)) {
                    alert(`Ya existe una categoría llamada "${nuevoNombre}".`);
                    input.parentNode.replaceChild(spanAnterior, input);
                    return;
                }
                // Actualizar en DB
                await deleteEntry(STORES.CATEGORIAS, nombreAnterior);
                await addEntry(STORES.CATEGORIAS, { nombre: nuevoNombre });
                // Actualizar movimientos
                const movimientos = await getAllEntries(STORES.MOVIMIENTOS);
                const transaction = db.transaction([STORES.MOVIMIENTOS], 'readwrite');
                const store = transaction.objectStore(STORES.MOVIMIENTOS);
                movimientos.forEach(m => {
                    if (m.categoria === nombreAnterior) {
                        m.categoria = nuevoNombre;
                        store.put(m);
                    }
                });
                // Refrescar
                renderizarCategoriasEditables();
                actualizarSelectCategorias();
                cargarSelectEliminarCategorias();
                alert(`✅ Categoría "${nombreAnterior}" renombrada como "${nuevoNombre}".`);
                return;
            }
        }
        // Si no encontramos el span anterior, es un error
        alert("Error al identificar la categoría original.");
        input.parentNode.replaceChild(input.previousElementSibling, input);
        return;
    }

    const nombreAnterior = spanOriginal.getAttribute('data-nombre');

    // Validar
    if (!nuevoNombre) {
        alert('El nombre de la categoría no puede estar vacío.');
        input.parentNode.replaceChild(spanOriginal, input);
        return;
    }

    if (nuevoNombre === nombreAnterior) {
        input.parentNode.replaceChild(spanOriginal, input);
        return;
    }

    // Verificar duplicados
    const categorias = await getAllEntries(STORES.CATEGORIAS);
    if (categorias.some(c => c.nombre === nuevoNombre && c.nombre !== nombreAnterior)) {
        alert(`Ya existe una categoría llamada "${nuevoNombre}".`);
        input.parentNode.replaceChild(spanOriginal, input);
        return;
    }

    // Actualizar en la base de datos
    try {
        await deleteEntry(STORES.CATEGORIAS, nombreAnterior);
        await addEntry(STORES.CATEGORIAS, { nombre: nuevoNombre });

        // Actualizar todos los movimientos con esta categoría
        const movimientos = await getAllEntries(STORES.MOVIMIENTOS);
        const transaction = db.transaction([STORES.MOVIMIENTOS], 'readwrite');
        const store = transaction.objectStore(STORES.MOVIMIENTOS);
        movimientos.forEach(m => {
            if (m.categoria === nombreAnterior) {
                m.categoria = nuevoNombre;
                store.put(m);
            }
        });

        // Refrescar interfaces
        renderizarCategoriasEditables();
        actualizarSelectCategorias();
        cargarSelectEliminarCategorias();
        alert(`✅ Categoría "${nombreAnterior}" renombrada como "${nuevoNombre}".`);
    } catch (error) {
        console.error("Error al actualizar categoría:", error);
        alert("Error al renombrar la categoría.");
    }
}

// ✅ Función para editar un banco (doble clic → transforma en input)
function editarBanco(nombreActual) {
    const spans = document.querySelectorAll('.banco-nombre');
    const span = Array.from(spans).find(s => s.getAttribute('data-nombre') === nombreActual);
    if (!span) return;

    // ✅ OCULTAR EL SPAN ORIGINAL (esto es clave para que guardarBanco lo encuentre)
    span.style.display = 'none';

    const input = document.createElement('input');
    input.type = 'text';
    input.value = nombreActual;
    input.style.width = '100%';
    input.style.padding = '0.5rem';
    input.style.border = '1px solid #ccc';
    input.style.borderRadius = '6px';
    input.style.marginRight = '0.5rem';
    input.style.fontWeight = '500';
    input.style.backgroundColor = 'var(--card-bg)';
    input.style.color = 'var(--text)';

    span.parentNode.replaceChild(input, span);

    input.focus();
    input.select();

    input.addEventListener('blur', guardarBanco);
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            guardarBanco();
        }
    });
}

// ✅ Función para guardar el banco editado
async function guardarBanco() {
    const input = event.target;
    const nuevoNombre = input.value.trim();
    
    // Buscar el span original que fue reemplazado
    const spanOriginal = document.querySelector('.banco-nombre[style*="display: none"]');
    if (!spanOriginal) {
        const spans = document.querySelectorAll('.banco-nombre');
        const spanAnterior = Array.from(spans).find(s => s.style.display === 'none');
        if (spanAnterior) {
            const nombreAnterior = spanAnterior.getAttribute('data-nombre');
            if (nombreAnterior === nuevoNombre) {
                input.parentNode.replaceChild(spanAnterior, input);
                return;
            }
            if (nombreAnterior) {
                const bancos = await getAllEntries(STORES.BANCOS);
                if (bancos.some(b => b.nombre === nuevoNombre && b.nombre !== nombreAnterior)) {
                    alert(`Ya existe un banco llamado "${nuevoNombre}".`);
                    input.parentNode.replaceChild(spanAnterior, input);
                    return;
                }
                await deleteEntry(STORES.BANCOS, nombreAnterior);
                await addEntry(STORES.BANCOS, { nombre: nuevoNombre });
                const movimientos = await getAllEntries(STORES.MOVIMIENTOS);
                const transaction = db.transaction([STORES.MOVIMIENTOS], 'readwrite');
                const store = transaction.objectStore(STORES.MOVIMIENTOS);
                movimientos.forEach(m => {
                    if (m.banco === nombreAnterior) {
                        m.banco = nuevoNombre;
                        store.put(m);
                    }
                });
                renderizarBancosEditables();
                cargarSelectBancos();
                cargarSelectBancoRegla();
                cargarSelectEliminarBancos();
                alert(`✅ Banco "${nombreAnterior}" renombrado como "${nuevoNombre}".`);
                return;
            }
        }
        alert("Error al identificar el banco original.");
        input.parentNode.replaceChild(input.previousElementSibling, input);
        return;
    }

    const nombreAnterior = spanOriginal.getAttribute('data-nombre');

    if (!nuevoNombre) {
        alert('El nombre del banco no puede estar vacío.');
        input.parentNode.replaceChild(spanOriginal, input);
        return;
    }

    if (nuevoNombre === nombreAnterior) {
        input.parentNode.replaceChild(spanOriginal, input);
        return;
    }

    const bancos = await getAllEntries(STORES.BANCOS);
    if (bancos.some(b => b.nombre === nuevoNombre && b.nombre !== nombreAnterior)) {
        alert(`Ya existe un banco llamado "${nuevoNombre}".`);
        input.parentNode.replaceChild(spanOriginal, input);
        return;
    }

    try {
        await deleteEntry(STORES.BANCOS, nombreAnterior);
        await addEntry(STORES.BANCOS, { nombre: nuevoNombre });

        const movimientos = await getAllEntries(STORES.MOVIMIENTOS);
        const transaction = db.transaction([STORES.MOVIMIENTOS], 'readwrite');
        const store = transaction.objectStore(STORES.MOVIMIENTOS);
        movimientos.forEach(m => {
            if (m.banco === nombreAnterior) {
                m.banco = nuevoNombre;
                store.put(m);
            }
        });

        renderizarBancosEditables();
        cargarSelectBancos();
        cargarSelectBancoRegla();
        cargarSelectEliminarBancos();
        alert(`✅ Banco "${nombreAnterior}" renombrado como "${nuevoNombre}".`);
    } catch (error) {
        console.error("Error al actualizar banco:", error);
        alert("Error al renombrar el banco.");
    }
}

// ✅ Funciones auxiliares para eliminar por nombre (para los botones de eliminar en las listas editables)
async function eliminarCategoriaPorNombre(nombre) {
    if (!confirm(`¿Estás seguro de que quieres eliminar la categoría "${nombre}"? Los movimientos quedarán sin categoría.`)) return;
    try {
        await deleteEntry(STORES.CATEGORIAS, nombre);
        const movimientos = await getAllEntries(STORES.MOVIMIENTOS);
        const transaction = db.transaction([STORES.MOVIMIENTOS], 'readwrite');
        const store = transaction.objectStore(STORES.MOVIMIENTOS);
        movimientos.forEach(m => {
            if (m.categoria === nombre) {
                m.categoria = 'Sin categoría';
                store.put(m);
            }
        });
        renderizarCategoriasEditables();
        actualizarSelectCategorias();
        cargarSelectEliminarCategorias();
        alert(`Categoría "${nombre}" eliminada.`);
    } catch (error) {
        console.error("Error al eliminar categoría:", error);
    }
}

async function eliminarBancoPorNombre(nombre) {
    const movimientos = await getAllEntries(STORES.MOVIMIENTOS);
    const afectados = movimientos.filter(m => m.banco === nombre).length;
    if (!confirm(`¿Seguro que quieres eliminar el banco "${nombre}"? 
Se quitará de ${afectados} movimiento${afectados !== 1 ? 's' : ''}.`)) return;

    try {
        await deleteEntry(STORES.BANCOS, nombre);
        const transaction = db.transaction([STORES.MOVIMIENTOS], 'readwrite');
        const store = transaction.objectStore(STORES.MOVIMIENTOS);
        movimientos.forEach(m => {
            if (m.banco === nombre) {
                m.banco = '(Sin banco)';
                store.put(m);
            }
        });
        renderizarBancosEditables();
        cargarSelectBancos();
        cargarSelectBancoRegla();
        cargarSelectEliminarBancos();
        alert(`✅ Banco "${nombre}" eliminado.
Se actualizó${afectados !== 1 ? 'ron' : ''} ${afectados} movimiento${afectados !== 1 ? 's' : ''}.`);
    } catch (error) {
        console.error("Error al eliminar banco:", error);
    }
}

// ✅ EXPORTAR BACKUP COMPLETO (todo el estado de la app)
async function exportarBackup() {
    try {
        // Primero, guardar localmente
        await guardarBackupActual();
        
        // Luego, proceder con la descarga
        const movimientos = await getAllEntries(STORES.MOVIMIENTOS);
        const categorias = await getAllEntries(STORES.CATEGORIAS);
        const bancos = await getAllEntries(STORES.BANCOS);
        const reglas = await getAllEntries(STORES.REGLAS);
        const saldoInicial = await getAllEntries(STORES.SALDO_INICIAL);
        const metaPresupuesto = localStorage.getItem('metaPresupuesto');
        const tasaCambio = localStorage.getItem('tasaCambio');
        const bloqueoActivo = localStorage.getItem('bloqueoActivo') === 'true';
        const bloqueoPIN = localStorage.getItem('bloqueoPIN');
        const tema = localStorage.getItem('agendaTema');

        // Crear objeto de backup
        const backup = {
            version: '1.0',
            fecha: new Date().toISOString(),
            movimientos: movimientos,
            categorias: categorias,
            bancos: bancos,
            reglas: reglas,
            saldoInicial: saldoInicial.length > 0 ? saldoInicial[0] : null,
            metaPresupuesto: metaPresupuesto,
            tasaCambio: tasaCambio,
            bloqueoActivo: bloqueoActivo,
            bloqueoPIN: bloqueoPIN,
            tema: tema
        };

        // Convertir a JSON y descargar
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `SFP_Backup_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();

    } catch (error) {
        console.error("Error al exportar backup:", error);
        alert("❌ Error al exportar el backup. Revisa la consola.");
    }
}

// Función auxiliar para guardar el backup localmente
async function guardarBackupActual() {
    try {
        // Obtener todos los datos actuales
        const movimientos = await getAllEntries(STORES.MOVIMIENTOS);
        const categorias = await getAllEntries(STORES.CATEGORIAS);
        const bancos = await getAllEntries(STORES.BANCOS);
        const reglas = await getAllEntries(STORES.REGLAS);
        const saldoInicial = await getAllEntries(STORES.SALDO_INICIAL);
        const metaPresupuesto = localStorage.getItem('metaPresupuesto');
        const tasaCambio = localStorage.getItem('tasaCambio');
        const bloqueoActivo = localStorage.getItem('bloqueoActivo') === 'true';
        const bloqueoPIN = localStorage.getItem('bloqueoPIN');
        const tema = localStorage.getItem('agendaTema');

        // Crear objeto de backup
        const backup = {
            version: '1.0',
            fecha: new Date().toISOString(),
            movimientos: movimientos,
            categorias: categorias,
            bancos: bancos,
            reglas: reglas,
            saldoInicial: saldoInicial.length > 0 ? saldoInicial[0] : null,
            metaPresupuesto: metaPresupuesto,
            tasaCambio: tasaCambio,
            bloqueoActivo: bloqueoActivo,
            bloqueoPIN: bloqueoPIN,
            tema: tema
        };

        // Generar nombre único para el backup
        const fecha = new Date();
        const nombreBackup = `backup_${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}_${String(fecha.getHours()).padStart(2, '0')}${String(fecha.getMinutes()).padStart(2, '0')}.json`;
        
        // Guardar en localStorage
        localStorage.setItem(nombreBackup, JSON.stringify(backup));
        
        // Mostrar notificación
        alert(`✅ Backup guardado correctamente como \"${nombreBackup.replace('backup_', '').replace('.json', '')}\"`);
        return true;
        
    } catch (error) {
        console.error('Error al guardar backup:', error);
        alert('❌ Error al guardar el backup. Revisa la consola para más detalles.');
        return false;
    }
}

// ✅ IMPORTAR BACKUP COMPLETO (restaura todo)
async function importarBackup() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.style.display = 'none';
    document.body.appendChild(input);

    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const backup = JSON.parse(event.target.result);

                // Validar versión
                if (backup.version !== '1.0') {
                    alert("⚠️ Este archivo de backup no es compatible con esta versión de la app.");
                    return;
                }

                // Confirmar antes de sobrescribir
                if (!confirm("⚠️ ¡ADVERTENCIA! Esto borrará todos tus datos actuales y los reemplazará con los del backup. ¿Continuar?")) {
                    return;
                }

                // 1. Borrar todo lo existente
                const transaction = db.transaction([STORES.MOVIMIENTOS, STORES.CATEGORIAS, STORES.BANCOS, STORES.REGLAS, STORES.SALDO_INICIAL], 'readwrite');
                const movStore = transaction.objectStore(STORES.MOVIMIENTOS);
                const catStore = transaction.objectStore(STORES.CATEGORIAS);
                const banStore = transaction.objectStore(STORES.BANCOS);
                const regStore = transaction.objectStore(STORES.REGLAS);
                const salStore = transaction.objectStore(STORES.SALDO_INICIAL);

                // Limpiar almacenes
                movStore.clear();
                catStore.clear();
                banStore.clear();
                regStore.clear();
                salStore.clear();

                // 2. Restaurar categorías
                if (backup.categorias && backup.categorias.length > 0) {
                    for (const cat of backup.categorias) {
                        await addEntry(STORES.CATEGORIAS, cat);
                    }
                }

                // 3. Restaurar bancos
                if (backup.bancos && backup.bancos.length > 0) {
                    for (const ban of backup.bancos) {
                        await addEntry(STORES.BANCOS, ban);
                    }
                }

                // 4. Restaurar reglas
                if (backup.reglas && backup.reglas.length > 0) {
                    for (const reg of backup.reglas) {
                        await addEntry(STORES.REGLAS, reg);
                    }
                }

                // 5. Restaurar saldo inicial
                if (backup.saldoInicial) {
                    await addEntry(STORES.SALDO_INICIAL, backup.saldoInicial);
                }

                // 6. Restaurar movimientos
                if (backup.movimientos && backup.movimientos.length > 0) {
                    for (const mov of backup.movimientos) {
                        await addEntry(STORES.MOVIMIENTOS, mov);
                    }
                }

                // 7. Restaurar localStorage
                localStorage.setItem('metaPresupuesto', backup.metaPresupuesto || '');
                localStorage.setItem('tasaCambio', backup.tasaCambio || '');
                localStorage.setItem('bloqueoActivo', backup.bloqueoActivo ? 'true' : 'false');
                localStorage.setItem('bloqueoPIN', backup.bloqueoPIN || '');
                localStorage.setItem('agendaTema', backup.tema || '');

                // 8. Limpiar input y refrescar app
                input.remove();
                alert("✅ Backup importado con éxito. Recargando la app...");

                // Recargar la app para reflejar cambios
                location.reload();

            } catch (error) {
                console.error("Error al importar backup:", error);
                alert("❌ Error al importar el backup. El archivo puede estar corrupto o no compatible.");
                input.remove();
            }
        };
        reader.readAsText(file);
    };

    input.click();
}

// Cargar configuración de bloqueo al inicio
document.addEventListener('DOMContentLoaded', async function () {
    try {
        // ... (todo lo que ya tenías)

        // ✅ AÑADIR ESTA LÍNEA AL FINAL DE LA FUNCIÓN, JUSTO ANTES DEL CIERRE DEL TRY
        await cargarConfigBloqueo();

        let inactividadTimer;

function reiniciarTimer() {
    clearTimeout(inactividadTimer);
    inactividadTimer = setTimeout(() => {
        if (localStorage.getItem('bloqueoActivo') === 'true') {
            localStorage.removeItem('bloqueoDesbloqueado');
            mostrarModalBloqueo();
        }
    }, 5 * 60 * 1000); // 5 minutos
}

// Iniciar el timer
reiniciarTimer();

// Reiniciar al interactuar
document.addEventListener('mousemove', reiniciarTimer);
document.addEventListener('keypress', reiniciarTimer);
document.addEventListener('click', reiniciarTimer);

    } catch (error) {
        console.error("Error en la inicialización de la app:", error);
    }
});

// ✅ OCULTAR/MOSTRAR CAMPOS DINÁMICAMENTE SEGÚN EL TIPO DE MOVIMIENTO
document.addEventListener('DOMContentLoaded', function () {
  const tipoSelect = document.getElementById('tipo');
  const saldoInicialInput = document.getElementById('saldoInicial');
  const cantidadInput = document.getElementById('cantidad');
  const conceptoInput = document.getElementById('concepto');

  function actualizarCampos() {
    const tipo = tipoSelect.value;

    if (tipo === 'saldo_inicial') {
      // Mostrar solo saldoInicial, ocultar cantidad
      cantidadInput.style.display = 'none';
      cantidadInput.value = ''; // Limpiar para evitar errores
      saldoInicialInput.style.display = 'block';
      saldoInicialInput.setAttribute('placeholder', 'Saldo inicial del banco');
    } else {
      // Mostrar solo cantidad, ocultar saldoInicial
      saldoInicialInput.style.display = 'none';
      saldoInicialInput.value = '';
      cantidadInput.style.display = 'block';
      cantidadInput.setAttribute('placeholder', 'Cantidad');
      conceptoInput.setAttribute('placeholder', 'Concepto');
    }
  }

  // Escuchar cambios en el tipo
  tipoSelect.addEventListener('change', actualizarCampos);

  // Ejecutar al cargar para aplicar estado inicial
  actualizarCampos();
});

// ✅ FUNCION DE REPARACIÓN INTELIGENTE: Limpia y reinicia la app sin perder datos
async function repararApp() {
    alert('🔍 Se detectó una inconsistencia en la visualización. Reinitializando la app...');

    // 1. Forzar recarga de todos los datos
    await renderizar();           // Recarga la lista de movimientos
    await actualizarSaldo();      // Recalcula saldo con formato correcto
    await actualizarResumenBancosCompleto(); // Recalcula tabla de bancos
    await actualizarGrafico();    // Refresca gráfico de gastos
    await actualizarBarChart();   // Refresca gráfico mensual
    await renderizarResumenBancos(); // Refresca resumen de bancos en pestaña análisis
    await cargarMetaPresupuesto(); // Recarga meta de presupuesto
    await actualizarPresupuesto(); // Refresca barra de progreso

    // 2. Forzar renderizado de elementos que pueden quedar rotos
    document.getElementById('saldoAviso')?.style.display === 'none' && 
        document.getElementById('saldoAviso')?.style.display === 'block'; // Forzar display

    // 3. Limpiar posibles eventos colgantes (solo si hay error)
    const btnTema = document.getElementById('btnTema');
    if (btnTema) {
        btnTema.style.display = 'block'; // Asegurar que el botón de tema esté visible
    }

    // 4. Mostrar mensaje de éxito
    setTimeout(() => {
        alert('✅ App reparada con éxito. Todo debería verse correctamente ahora.');
    }, 500);

    // 5. (Opcional) Forzar un scroll para que el usuario vea el cambio
    window.scrollTo(0, 0);
}

function verRecibo(base64Data) {
    // Abrir en nueva pestaña
    const ventana = window.open('', '_blank');
    ventana.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Recibo Adjunto</title>
            <style>
                body { margin: 0; padding: 2rem; background: #f5f7fa; display:flex; justify-content:center; align-items:center; min-height:100vh; }
                img, embed { max-width: 100%; max-height: 90vh; object-fit: contain; }
                .cerrar { position: absolute; top: 1rem; right: 1rem; background:#b00020; color:white; border:none; border-radius:50%; width:3rem; height:3rem; font-size:1.5rem; cursor:pointer; display:flex; justify-content:center; align-items:center; }
            </style>
        </head>
        <body>
            <button class="cerrar" onclick="window.close()">✕</button>
            ${base64Data.startsWith('data:application/pdf') ? 
                `<embed src="${base64Data}" type="application/pdf" width="100%" height="90vh" />` : 
                `<img src="${base64Data}" alt="Recibo" />`}
        </body>
        </html>
    `);
    ventana.document.close();
}


// ✅ CALCULADORA DE AHORRO MENSUAL
function calcularAhorroMensual(meta) {
    try {
        // ✅ Verificar que los elementos existen antes de usarlos
        const ahorroMensualElement = document.getElementById('ahorroMensualMeta');
        const diasRestantesElement = document.getElementById('diasRestantesMeta');
        
        // Si los elementos no existen, salir silenciosamente
        if (!ahorroMensualElement || !diasRestantesElement) {
            return;
        }
        
        const diasRestantes = Math.ceil((meta.fechaLimite - new Date()) / (1000 * 60 * 60 * 24));
        const ahorroMensual = meta.montoObjetivo / Math.ceil((meta.fechaLimite - new Date()) / (1000 * 60 * 60 * 24 * 30));
        
        // ✅ Solo actualizar si los elementos existen
        ahorroMensualElement.textContent = formatearNumero(ahorroMensual);
        diasRestantesElement.textContent = diasRestantes;
        
    } catch (error) {
        console.error('Error en calcularAhorroMensual:', error);
        // No mostrar toast para evitar spam
    }
}

// ✅ Actualizar simulación cuando cambie la reducción
function actualizarSimulacion(reduccionPorcentaje) {
    const ingresos = parseFloat(document.getElementById('ingresosPromedio').textContent.replace('Bs. ', '').replace(/\./g, '').replace(',', '.'));
    const gastos = parseFloat(document.getElementById('gastosPromedio').textContent.replace('Bs. ', '').replace(/\./g, '').replace(',', '.'));
    
    const gastosSimulados = gastos * (1 - reduccionPorcentaje / 100);
    const ahorroSimulado = ingresos - gastosSimulados;
    
    document.getElementById('ingresosSimulado').textContent = `Bs. ${formatNumberVE(ingresos)}`;
    document.getElementById('gastosSimulado').textContent = `Bs. ${formatNumberVE(gastosSimulados)}`;
    document.getElementById('ahorroSimulado').textContent = `Bs. ${formatNumberVE(ahorroSimulado)}`;
}

// ✅ Renderizar gráfico de tendencia
function renderizarGraficoAhorro(porMes) {
    if (typeof Chart === 'undefined') return;
    
    const meses = Object.keys(porMes).sort();
    const ingresos = meses.map(m => porMes[m].ingresos);
    const gastos = meses.map(m => porMes[m].gastos);
    const ahorro = meses.map((m, i) => ingresos[i] - gastos[i]);
    
    if (window.graficoAhorro) window.graficoAhorro.destroy();
    
    window.graficoAhorro = new Chart(document.getElementById('graficoAhorro'), {
        type: 'line',
        data: {
            labels: meses.map(m => m.split('-')[1] + '/' + m.split('-')[0].slice(-2)), // "04/25"
            datasets: [
                {
                    label: 'Ingresos',
                    data: ingresos,
                    borderColor: '#018642',
                    backgroundColor: 'rgba(1, 134, 66, 0.1)',
                    tension: 0.3,
                    fill: true
                },
                {
                    label: 'Gastos',
                    data: gastos,
                    borderColor: '#b00020',
                    backgroundColor: 'rgba(176, 0, 37, 0.1)',
                    tension: 0.3,
                    fill: true
                },
                {
                    label: 'Ahorro',
                    data: ahorro,
                    borderColor: '#0b57d0',
                    backgroundColor: 'rgba(11, 87, 208, 0.1)',
                    tension: 0.3,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'Bs. ' + formatNumberVE(value);
                        }
                    }
                }
            }
        }
    });
}

// ✅ ELIMINAR TODOS LOS MOVIMIENTOS (con confirmación)
async function eliminarTodosLosMovimientos() {
    if (!confirm(
        "🚨 ¡ADVERTENCIA EXTREMA!\n\n" +
        "Estás a punto de eliminar TODOS tus movimientos:\n" +
        "- Ingresos\n" +
        "- Gastos\n" +
        "- Saldos iniciales\n\n" +
        "⚠️ Esto NO elimina:\n" +
        "- Categorías\n" +
        "- Bancos\n" +
        "- Reglas\n" +
        "- Tasa guardada\n" +
        "- Backup\n\n" +
        "¿Estás ABSOLUTAMENTE seguro? Esta acción NO se puede deshacer."
    )) {
        return;
    }

    try {
        // Abrir transacción en modo escritura
        const transaction = db.transaction([STORES.MOVIMIENTOS], 'readwrite');
        const store = transaction.objectStore(STORES.MOVIMIENTOS);

        // Borrar TODO el contenido del almacén
        const request = store.clear();

        request.onsuccess = async () => {
            alert("✅ ¡Todos los movimientos han sido eliminados!");
            // Actualizar la interfaz inmediatamente
            await renderizar();
            await actualizarSaldo();
            await actualizarResumenBancosCompleto();
            await actualizarGrafico();
            await actualizarBarChart();
            await renderizarResumenBancos();
            await actualizarPresupuesto();
        };

        request.onerror = (event) => {
            console.error("Error al eliminar todos los movimientos:", event.target.error);
            alert("❌ Error al eliminar los movimientos. Intenta de nuevo.");
        };

    } catch (error) {
        console.error("Error inesperado al eliminar movimientos:", error);
        alert("❌ Error inesperado. Por favor, recarga la app e intenta de nuevo.");
    }
}

// ✅ COMPARACIÓN DE BANCOS: Gráficos de Barras Apiladas y Torta
async function renderizarComparacionBancos() {
    const movimientos = await getAllEntries(STORES.MOVIMIENTOS);
    
    // Agrupar por banco: ingresos, gastos, saldo final
    const bancos = [...new Set(movimientos.map(m => m.banco || '(Sin banco)'))];
    const comparacion = {};
    
    bancos.forEach(banco => {
        const movimientosBanco = movimientos.filter(m => m.banco === banco);
        
        const ingresos = movimientosBanco
            .filter(m => m.tipo === 'ingreso' && !m.concepto.includes('(Saldo inicial:'))
            .reduce((sum, m) => sum + m.cantidad, 0);
            
        const gastos = movimientosBanco
            .filter(m => m.tipo === 'gasto')
            .reduce((sum, m) => sum + m.cantidad, 0);
            
        const saldoInicial = movimientosBanco
            .filter(m => m.concepto.includes('(Saldo inicial:'))
            .reduce((sum, m) => sum + m.cantidad, 0);
            
        const saldoFinal = saldoInicial + ingresos - gastos;
        
        comparacion[banco] = {
            ingresos,
            gastos,
            saldoFinal
        };
    });
    
    // Preparar datos para gráfico de barras apiladas
    const bancosLabels = Object.keys(comparacion);
    const ingresosData = bancosLabels.map(b => comparacion[b].ingresos);
    const gastosData = bancosLabels.map(b => comparacion[b].gastos);
    const saldoFinalData = bancosLabels.map(b => comparacion[b].saldoFinal);
    
    // Preparar datos para gráfico de torta (saldo final como porcentaje del total)
    const saldoTotal = Object.values(comparacion).reduce((sum, b) => sum + b.saldoFinal, 0);
    const porcentajes = bancosLabels.map(b => comparacion[b].saldoFinal / saldoTotal * 100);
    
    // Limpiar gráficos anteriores si existen
    if (window.graficoBarrasApiladas) window.graficoBarrasApiladas.destroy();
    if (window.graficoTortaBancos) window.graficoTortaBancos.destroy();
    
    // ✅ GRÁFICO DE BARRAS APILADAS
    window.graficoBarrasApiladas = new Chart(document.getElementById('graficoBarrasApiladas'), {
        type: 'bar',
        data: {
            labels: bancosLabels,
            datasets: [
                {
                    label: 'Ingresos',
                    data: ingresosData,
                    backgroundColor: '#018642',
                    borderColor: '#018642',
                    borderWidth: 1
                },
                {
                    label: 'Gastos',
                    data: gastosData,
                    backgroundColor: '#b00020',
                    borderColor: '#b00020',
                    borderWidth: 1
                },
                {
                    label: 'Saldo Final',
                    data: saldoFinalData,
                    backgroundColor: '#0b57d0',
                    borderColor: '#0b57d0',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': Bs. ' + formatNumberVE(context.raw);
                        }
                    }
                }
            },
            scales: {
                x: {
                    stacked: false,
                    title: {
                        display: true,
                        text: 'Banco'
                    }
                },
                y: {
                    stacked: false,
                    title: {
                        display: true,
                        text: 'Monto (Bs)'
                    },
                    ticks: {
                        callback: function(value) {
                            return 'Bs. ' + formatNumberVE(value);
                        }
                    }
                }
            }
        }
    });
    
    // ✅ GRÁFICO DE TORTA (Porcentaje del Saldo Total)
    window.graficoTortaBancos = new Chart(document.getElementById('graficoTortaBancos'), {
        type: 'pie',
        data: {
            labels: bancosLabels,
            datasets: [{
                data: porcentajes,
                backgroundColor: [
                    '#0b57d0', '#018642', '#b00020', '#ff9800', '#9c27b0',
                    '#607d8b', '#cddc39', '#ff5722', '#00bcd4', '#795548'
                ],
                borderColor: ['#fff'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
                            const porcentaje = Math.round((context.raw / total) * 100);
                            const banco = context.label;
                            const saldo = comparacion[banco].saldoFinal;
                            return `${banco}: ${porcentaje}% (${formatNumberVE(saldo)} Bs)`;
                        }
                    }
                }
            }
        }
    });

}

// ✅ MODULO: Modo de Entrada de Números (Automático o Literal)
function cargarModoEntradaNumeros() {
    const modoGuardado = localStorage.getItem('numeroModo') || 'automatico';
    document.getElementById('modoAutomatico').checked = modoGuardado === 'automatico';
    document.getElementById('modoLiteral').checked = modoGuardado === 'literal';
}

function guardarModoEntradaNumeros() {
    const modo = document.querySelector('input[name="numeroModo"]:checked').value;
    localStorage.setItem('numeroModo', modo);
}

// Escuchar cambios en los radios
document.addEventListener('DOMContentLoaded', function() {
    cargarModoEntradaNumeros();
    const radios = document.querySelectorAll('input[name="numeroModo"]');
    radios.forEach(radio => {
        radio.addEventListener('change', guardarModoEntradaNumeros);
    });
});

// ✅ Actualizar aviso de modo en los campos
function actualizarAvisoModo() {
    const modo = localStorage.getItem('numeroModo') || 'automatico';
    const texto = modo === 'literal' ? 'Literal' : 'Automático';
    document.getElementById('modoActualCantidad').textContent = texto;
    document.getElementById('modoActualSaldo').textContent = texto;
    document.getElementById('avisoModoCantidad').style.display = 'block';
    document.getElementById('avisoModoSaldo').style.display = 'block';
}

// Llamarlo al cargar la app y cuando cambie el modo
document.addEventListener('DOMContentLoaded', function() {
    actualizarAvisoModo();
    // También actualizar cuando cambie el modo en Configuración
    const radios = document.querySelectorAll('input[name="numeroModo"]');
    radios.forEach(radio => {
        radio.addEventListener('change', actualizarAvisoModo);
    });
});

//ACTUALIZAR EL DASHBOARD DINÁMICAMENTE:
// ✅ ACTUALIZAR TODO EL DASHBOARD EN TIEMPO REAL
async function actualizarDashboard() {

    // ✅ MOSTRAR VERSIÓN EN EL DASHBOARD
    const versionElement = document.getElementById('versionDashboard');
    if (versionElement) {
        versionElement.textContent = APP_VERSION;
    }

    // 1. Actualizar saldo
    await actualizarSaldo();

    // 2. Actualizar resumen por banco (tabla completa)
    await actualizarResumenBancosCompleto();

    // 3. Actualizar disponibilidad total (en la sección "Disponibilidad total")
    const movimientos = await getAllEntries(STORES.MOVIMIENTOS);
    const saldoTotal = movimientos.reduce((sum, m) => {
        if (m.tipo === 'gasto') return sum - m.cantidad;
        return sum + m.cantidad;
    }, 0);
    document.getElementById('totalGeneral').textContent = formatNumberVE(saldoTotal);

    // 4. Actualizar gráficos de gastos y resumen mensual
    await actualizarGrafico();
    await actualizarBarChart();

    // 5. Actualizar alerta de saldo bajo
    const saldoBs = parseFloat(document.getElementById('saldo').textContent.replace('Bs. ', '').replace(/\./g, '').replace(',', '.'));
    const umbral = 500;
    const alerta = document.getElementById('alertaSaldo');
    if (saldoBs < umbral) {
        alerta.style.display = 'block';
    } else {
        alerta.style.display = 'none';
    }

    // 6. Actualizar equivalente en otra moneda (si hay tasa)
    actualizarEquivalente();

    // 7. Actualizar aviso de comisión
    const avisoComision = document.getElementById('saldoAviso');
    if (avisoComision) {
        avisoComision.style.display = saldoTotal > 0 ? 'block' : 'none';
    }
}

// ✅ Event listener para los radio buttons del modo de entrada de números
document.addEventListener('DOMContentLoaded', function() {
    // Event listener para los radio buttons del modo de entrada
    const radioButtons = document.querySelectorAll('input[name="numeroModo"]');
    radioButtons.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.checked) {
                localStorage.setItem('numeroModo', this.value);
                console.log('Modo de entrada cambiado a:', this.value);
                
                // Mostrar confirmación al usuario
                const modoTexto = this.value === 'automatico' ? 'Automático' : 'Literal';
                alert(`✅ Modo de entrada cambiado a: ${modoTexto}`);
            }
        });
    });
    
    // Cargar el modo guardado al iniciar
    const modoGuardado = localStorage.getItem('numeroModo') || 'automatico';
    const radioGuardado = document.getElementById(modoGuardado === 'automatico' ? 'modoAutomatico' : 'modoLiteral');
    if (radioGuardado) {
        radioGuardado.checked = true;
    }
});

/* ----------  RENDERIZAR PRESUPUESTO CON TARJETAS  ---------- */
const TARJETAS_POR_PAGINA = 6;
let paginaActualPres = 1;

async function renderizarPresupuestoTarjetas() {
  const movimientos = await getAllEntries(STORES.MOVIMIENTOS);
  const fechaHoy = new Date();
  const fechaHace30Dias = new Date(fechaHoy.getTime() - 30 * 24 * 60 * 60 * 1000);

  const gastos = movimientos.filter(m =>
    m.tipo === 'gasto' &&
    new Date(m.fecha) >= fechaHace30Dias &&
    new Date(m.fecha) <= fechaHoy
  );

  // Agrupar por categoría
  const resumen = {};
  gastos.forEach(m => {
    const cat = m.categoria || 'Sin categoría';
    resumen[cat] = (resumen[cat] || 0) + m.cantidad;
  });

  const categorias = Object.entries(resumen).sort((a, b) => b[1] - a[1]);
  const totalPaginas = Math.ceil(categorias.length / TARJETAS_POR_PAGINA);
  paginaActualPres = Math.min(paginaActualPres, totalPaginas || 1);

  const inicio = (paginaActualPres - 1) * TARJETAS_POR_PAGINA;
  const fin = inicio + TARJETAS_POR_PAGINA;
  const pagina = categorias.slice(inicio, fin);

  // Renderizar tarjetas
  const container = document.getElementById('listaPresupuestoDetalles');
  container.innerHTML = '';

  const grid = document.createElement('div');
  grid.className = 'presupuesto-grid';

  pagina.forEach(([cat, monto]) => {
    const tarjeta = document.createElement('div');
    tarjeta.className = 'tarjeta-gasto';
    tarjeta.innerHTML = `
      <div class="tarjeta-emoji">${emojiCategoria(cat)}</div>
      <div class="tarjeta-categoria">${cat}</div>
      <div class="tarjeta-monto">Bs. ${formatNumberVE(monto)}</div>
    `;
    grid.appendChild(tarjeta);
  });

  container.appendChild(grid);

  // Paginación
  renderizarPaginacionPresupuesto(totalPaginas);
}

/* ----------  EMOJI POR CATEGORÍA (opcional)  ---------- */
function emojiCategoria(cat) {
  const map = {
    'Honorarios': '💰',
    'Laboratorios': '🧪',
    'Material': '🩺',
    'Servicios': '🔌',
    'Oficina': '🖥️',
    'Transporte': '🚗',
    'Comida': '🍔',
    'Otros': '📦'
  };
  return map[cat] || '📊';
}

/* ----------  RENDERIZAR PAGINACIÓN  ---------- */
function renderizarPaginacionPresupuesto(total) {
  const container = document.getElementById('paginacionPresupuesto') || document.createElement('div');
  container.id = 'paginacionPresupuesto';
  container.className = 'paginacion-presupuesto';

  if (total <= 1) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <button onclick="cambiarPaginaPresupuesto(-1)" ${paginaActualPres === 1 ? 'disabled' : ''}>←</button>
    <span class="paginacion-info">Página ${paginaActualPres} de ${total}</span>
    <button onclick="cambiarPaginaPresupuesto(1)" ${paginaActualPres === total ? 'disabled' : ''}>→</button>
  `;

  const detalles = document.getElementById('listaPresupuestoDetalles');
  detalles.parentNode.insertBefore(container, detalles.nextSibling);
}

/* ----------  CAMBIAR PÁGINA  ---------- */
function cambiarPaginaPresupuesto(direccion) {
  paginaActualPres += direccion;
  renderizarPresupuestoTarjetas();
}

// ================== BUSCADOR EN VIVO DEL DASHBOARD ==================
function filtrarDashboard() {
    const needle = document.getElementById('txtBuscar').value.trim().toLowerCase();
    if (!needle) {                       // sin texto → mostrar todo
      actualizarDashboard();             // recarga original
      return;
    }
  
    // 1️⃣ FILTRAR TABLA DE BANCOS
    const filas = document.querySelectorAll('#tablaBancos tbody tr');
    filas.forEach(tr => {
      const texto = tr.textContent.toLowerCase();
      tr.style.display = texto.includes(needle) ? '' : 'none';
    });
  
    // 2️⃣ FILTRAR LISTA RESUMEN POR BANCO
    const items = document.querySelectorAll('#listaBancos li');
    items.forEach(li => {
      const texto = li.textContent.toLowerCase();
      li.style.display = texto.includes(needle) ? '' : 'none';
    });
  
    // 3️⃣ (Opcional) Si en futuro pintas movimientos en dashboard, los filtras aquí
  }
  
  // Escuchar cada tecla
  document.getElementById('txtBuscar').addEventListener('input', filtrarDashboard);

// ------------------------------------------------------------------------------------------------------------------------------------
//                                 Funciones de ayuda modal para Presupuesto
// ------------------------------------------------------------------------------------------------------------------------------------

//FUNCIÓN PARA MOSTRAR AYUDA EN PRESUPUESTO
function mostrarAyudaPresupuesto() {
    document.getElementById('modalAyudaPresupuesto').style.display = 'flex';
}

function cerrarAyudaPresupuesto() {
    document.getElementById('modalAyudaPresupuesto').style.display = 'none';
}

// Cerrar modal al hacer clic fuera de él
document.addEventListener('DOMContentLoaded', function() {
    const modalPresupuesto = document.getElementById('modalAyudaPresupuesto');
    if (modalPresupuesto) {
        modalPresupuesto.addEventListener('click', function(e) {
            if (e.target === modalPresupuesto) {
                cerrarAyudaPresupuesto();
            }
        });
    }
    
    // Cerrar modal con tecla Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modalPresupuesto && modalPresupuesto.style.display === 'flex') {
            cerrarAyudaPresupuesto();
        }
    });
});

// ------------------------------------------------------------------------------------------------------------------------------------
//                                 Funciones de ayuda modal para otras pestañas
// ------------------------------------------------------------------------------------------------------------------------------------

function mostrarAyudaDashboard() {
    // Crear modal similar al de presupuesto pero para Dashboard
    const contenido = `
        <h2 style="color:var(--primary); margin-bottom:1.5rem; text-align:center;">📊 ¿Qué es el Dashboard?</h2>
        <div style="margin-bottom:1.5rem;">
            <h3 style="color:var(--text); margin-bottom:0.75rem;">🔍 Secciones principales:</h3>
            <ul style="color:var(--text-light); line-height:1.6; margin:0; padding-left:1.5rem;">
                <li><strong>Saldo actual:</strong> Tu balance financiero total incluyendo comisiones</li>
                <li><strong>Disponibilidad total:</strong> Suma de todos tus saldos en diferentes bancos</li>
                <li><strong>Conversor de moneda:</strong> Convierte tu saldo a otras monedas</li>
                <li><strong>Resumen por banco:</strong> Detalle de ingresos, gastos y saldos por entidad</li>
            </ul>
        </div>
        <div style="background:var(--primary-bg); padding:1rem; border-radius:8px; border-left:4px solid var(--primary); margin-top:1.5rem;">
            <p style="margin:0; color:var(--primary-text); font-size:0.875rem;">
                <strong>💡 Consejo:</strong> Usa el conversor de moneda para saber cuánto equivale tu saldo en dólares o euros.
            </p>
        </div>
    `;
    mostrarModalAyuda(contenido, 'modalAyudaDashboard');
}

function mostrarAyudaMovimientos() {
    // Crear modal para Movimientos
    const contenido = `
        <h2 style="color:var(--primary); margin-bottom:1.5rem; text-align:center;">📝 Gestión de Movimientos</h2>
        <div style="margin-bottom:1.5rem;">
            <h3 style="color:var(--text); margin-bottom:0.75rem;">✅ Funcionalidades:</h3>
            <ul style="color:var(--text-light); line-height:1.6; margin:0; padding-left:1.5rem;">
                <li><strong>Agregar movimientos:</strong> Ingresos, gastos y saldos iniciales</li>
                <li><strong>Clasificación automática:</strong> Por categorías y bancos</li>
                <li><strong>Gestión avanzada:</strong> Editar, eliminar y buscar movimientos</li>
                <li><strong>Exportación:</strong> Genera reportes Excel de tu actividad</li>
            </ul>
        </div>
        <div style="background:var(--success-bg); padding:1rem; border-radius:8px; border-left:4px solid var(--success); margin-top:1.5rem;">
            <p style="margin:0; color:var(--success-text); font-size:0.875rem;">
                <strong>🎯 Tip:</strong> Usa reglas de automatización para clasificar automáticamente tus movimientos frecuentes.
            </p>
        </div>
    `;
    mostrarModalAyuda(contenido, 'modalAyudaMovimientos');
}

function mostrarAyudaAnalisis() {
    // Crear modal para Análisis
    const contenido = `
        <h2 style="color:var(--primary); margin-bottom:1.5rem; text-align:center;">📈 Análisis Financiero</h2>
        <div style="margin-bottom:1.5rem;">
            <h3 style="color:var(--text); margin-bottom:0.75rem;">📊 Gráficos disponibles:</h3>
            <ul style="color:var(--text-light); line-height:1.6; margin:0; padding-left:1.5rem;">
                <li><strong>Gráfico circular:</strong> Distribución de gastos por categoría</li>
                <li><strong>Gráfico de barras:</strong> Evolución mensual de ingresos vs gastos</li>
                <li><strong>Resumen por banco:</strong> Análisis detallado por entidad financiera</li>
                <li><strong>Filtros avanzados:</strong> Visualiza datos específicos</li>
            </ul>
        </div>
        <div style="background:var(--warning-bg); padding:1rem; border-radius:8px; border-left:4px solid var(--warning); margin-top:1.5rem;">
            <p style="margin:0; color:var(--warning-text); font-size:0.875rem;">
                <strong>📊 Interpretación:</strong> Usa estos gráficos para identificar patrones de gasto y tomar decisiones financieras informadas.
            </p>
        </div>
    `;
    mostrarModalAyuda(contenido, 'modalAyudaAnalisis');
}

function mostrarAyudaHerramientas() {
    // Crear modal para Herramientas
    const contenido = `
        <h2 style="color:var(--primary); margin-bottom:1.5rem; text-align:center;">🛠️ Herramientas Útiles</h2>
        <div style="margin-bottom:1.5rem;">
            <h3 style="color:var(--text); margin-bottom:0.75rem;">🔧 Funciones disponibles:</h3>
            <ul style="color:var(--text-light); line-height:1.6; margin:0; padding-left:1.5rem;">
                <li><strong>Formateador de números:</strong> Convierte números a formato venezolano</li>
                <li><strong>Calculadora de equivalente:</strong> Convierte tu saldo a otras monedas</li>
                <li><strong>Modo de entrada:</strong> Elige cómo ingresar cantidades (automático o literal)</li>
                <li><strong>Copia de seguridad:</strong> Exporta e importa tus datos</li>
            </ul>
        </div>
        <div style="background:var(--info-bg); padding:1rem; border-radius:8px; border-left:4px solid var(--info); margin-top:1.5rem;">
            <p style="margin:0; color:var(--info-text); font-size:0.875rem;">
                <strong>⚡ Productividad:</strong> Estas herramientas agilizan la entrada de datos y facilitan conversiones monetarias.
            </p>
        </div>
    `;
    mostrarModalAyuda(contenido, 'modalAyudaHerramientas');
}

function mostrarAyudaConfiguracion() {
    // Crear modal para Configuración
    const contenido = `
        <h2 style="color:var(--primary); margin-bottom:1.5rem; text-align:center;">⚙️ Configuración Avanzada</h2>
        <div style="margin-bottom:1.5rem;">
            <h3 style="color:var(--text); margin-bottom:0.75rem;">🛠️ Opciones disponibles:</h3>
            <ul style="color:var(--text-light); line-height:1.6; margin:0; padding-left:1.5rem;">
                <li><strong>Reglas de automatización:</strong> Crea reglas para clasificar movimientos automáticamente</li>
                <li><strong>Gestión de categorías:</strong> Crear, editar y eliminar categorías</li>
                <li><strong>Gestión de bancos:</strong> Administrar entidades financieras</li>
                <li><strong>Bloqueo de seguridad:</strong> Protege tu app con PIN</li>
                <li><strong>Modo de entrada:</strong> Configura cómo ingresar números</li>
            </ul>
        </div>
        <div style="background:var(--danger-bg); padding:1rem; border-radius:8px; border-left:4px solid var(--danger); margin-top:1.5rem;">
            <p style="margin:0; color:var(--danger-text); font-size:0.875rem;">
                <strong>⚠️ Importante:</strong> Las reglas de automatización te ahorran tiempo al clasificar movimientos frecuentes automáticamente.
            </p>
        </div>
    `;
    mostrarModalAyuda(contenido, 'modalAyudaConfiguracion');
}

// Función genérica para mostrar modales de ayuda
function mostrarModalAyuda(contenido, modalId) {
    // Crear modal dinámico si no existe
    let modal = document.getElementById(modalId);
    if (!modal) {
        modal = document.createElement('div');
        modal.id = modalId;
        modal.style.cssText = 'display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:1002; justify-content:center; align-items:center;';
        
        modal.innerHTML = `
            <div style="background:var(--card-bg); border-radius:var(--radius); box-shadow:var(--shadow-lg); padding:2rem; width:90%; max-width:500px; max-height:80vh; overflow-y:auto; position:relative;">
                <button onclick="document.getElementById('${modalId}').style.display='none';" 
        style="position:absolute; top:1rem; right:1rem; background:none; border:none; font-size:1.5rem; color:var(--text-light); cursor:pointer; padding:0.5rem; border-radius:50%; transition:background 0.2s;"
        title="Cerrar">✕</button>
                ${contenido}
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    modal.style.display = 'flex';
}

function mostrarAyudaInversiones() {
    // Crear modal para Inversiones
    const contenido = `
        <h2 style="color:var(--primary); margin-bottom:1.5rem; text-align:center;">📈 ¿Cómo funciona el Simulador de Inversiones?</h2>

        <div style="margin-bottom:1.5rem;">
            <h3 style="color:var(--text); margin-bottom:0.75rem;">🎯 ¿Qué es esto?</h3>
            <p style="color:var(--text-light); line-height:1.6; margin:0 0 1rem 0;">
                <strong>¡Es un simulador educativo!</strong> No inviertes dinero real, solo simulas inversiones para aprender y experimentar con diferentes estrategias.
            </p>
            <ul style="color:var(--text-light); line-height:1.6; margin:0; padding-left:1.5rem;">
                <li><strong>Precios simulados:</strong> Los precios cambian automáticamente cada vez que actualizas</li>
                <li><strong>Sin riesgo:</strong> Puedes experimentar con diferentes activos sin perder dinero</li>
                <li><strong>Educativo:</strong> Perfecto para aprender conceptos de inversión</li>
                <li><strong>Gráficos reales:</strong> Visualiza el rendimiento con gráficos profesionales</li>
            </ul>
        </div>

        <div style="margin-bottom:1.5rem;">
            <h3 style="color:var(--text); margin-bottom:0.75rem;">📊 ¿Qué puedes hacer aquí?</h3>
            <ul style="color:var(--text-light); line-height:1.6; margin:0; padding-left:1.5rem;">
                <li><strong>Agregar inversiones:</strong> Simula compra de acciones, cripto o fondos</li>
                <li><strong>Seguimiento automático:</strong> Los precios se actualizan periódicamente</li>
                <li><strong>Análisis visual:</strong> Ve gráficos de rendimiento y ganancias/pérdidas</li>
                <li><strong>Portafolio simulado:</strong> Gestiona múltiples inversiones como en la vida real</li>
            </ul>
        </div>

        <div style="margin-bottom:1.5rem;">
            <h3 style="color:var(--text); margin-bottom:0.75rem;">💡 Consejos para usar el simulador</h3>
            <ul style="color:var(--text-light); line-height:1.6; margin:0; padding-left:1.5rem;">
                <li>Empieza con cantidades pequeñas para experimentar</li>
                <li>Prueba diferentes tipos de activos (acciones, cripto, fondos)</li>
                <li>Observa cómo cambian los precios y afecta tu portafolio</li>
                <li>Usa fechas diferentes para simular inversiones a largo plazo</li>
            </ul>
        </div>

        <div style="background:var(--warning-bg); padding:1rem; border-radius:8px; border-left:4px solid var(--warning); margin-top:1.5rem;">
            <p style="margin:0; color:var(--warning-text); font-size:0.875rem;">
                <strong>⚠️ Recordatorio:</strong> Esto es solo un simulador educativo. No refleja inversiones reales ni precios de mercado actuales. ¡Es perfecto para aprender sin riesgos!
            </p>
        </div>
    `;
    mostrarModalAyuda(contenido, 'modalAyudaInversiones');
}

function cerrarAyudaInversiones() {
    document.getElementById('modalAyudaInversiones').style.display = 'none';
}

//PESTAÑA INVERSIONES SIMULADAS:
// Función para agregar una inversión
async function agregarInversion() {
    const activo = document.getElementById('activoInversion').value.trim();
    const cantidadInvertida = parseNumberVE(document.getElementById('cantidadInvertida').value);
    const fecha = new Date(document.getElementById('fechaInversion').value + 'T12:00:00');
    const tipoActivo = document.getElementById('tipoActivo').value;

    if (!activo || isNaN(cantidadInvertida) || !fecha) {
        mostrarToast('Por favor, completa todos los campos.', 'danger');
        return;
    }

    // Obtener el precio actual del activo
    let precioActual = 0;
    try {
        precioActual = await obtenerPrecioActivo(activo, tipoActivo);
    } catch (error) {
        console.error('Error al obtener precio:', error);
        mostrarToast('No se pudo obtener el precio del activo. Inténtalo de nuevo.', 'danger');
        return;
    }

    // Calcular la cantidad de activos comprados (por ejemplo, si invertiste 1000 Bs y el precio es 10 Bs por unidad, tienes 100 unidades)
    const cantidadUnidades = cantidadInvertida / precioActual;

    const inversion = {
        activo,
        cantidadInvertida,
        fecha: fecha.toISOString(),
        tipoActivo,
        precioCompra: precioActual,
        cantidadUnidades,
        precioActual: precioActual // Se actualizará periódicamente
    };

    try {
        await addEntry(STORES.INVERSIONES, inversion);
        mostrarToast('Inversión agregada con éxito.', 'success');
        limpiarFormularioInversion();
        renderizarInversiones();
    } catch (error) {
        console.error('Error al agregar inversión:', error);
        mostrarToast('Error al agregar la inversión.', 'danger');
    }
}

// Función para limpiar el formulario de inversión
function limpiarFormularioInversion() {
    document.getElementById('activoInversion').value = '';
    document.getElementById('cantidadInvertida').value = '';
    document.getElementById('fechaInversion').value = '';
    document.getElementById('tipoActivo').value = 'accion';
}

// Función para renderizar la lista de inversiones y el gráfico
async function renderizarInversiones() {
    try {
        const inversiones = await getAllEntries(STORES.INVERSIONES);
        const ul = document.getElementById('listaInversiones');
        ul.innerHTML = '';

        if (inversiones.length === 0) {
            ul.innerHTML = '<li style="text-align: center; color: var(--text-light);">No tienes inversiones simuladas.</li>';
            // Crear gráfico vacío
            actualizarGraficoInversiones([]);
            return;
        }

        // Actualizar los precios actuales de cada inversión
        for (const inversion of inversiones) {
            try {
                inversion.precioActual = await obtenerPrecioActivo(inversion.activo, inversion.tipoActivo);
                // Actualizar en la base de datos
                await updateEntry(STORES.INVERSIONES, inversion);
            } catch (error) {
                console.error(`Error al actualizar precio de ${inversion.activo}:`, error);
            }
        }

        // Renderizar cada inversión
        inversiones.forEach(inversion => {
            const valorActual = inversion.cantidadUnidades * inversion.precioActual;
            const gananciaPerdida = valorActual - inversion.cantidadInvertida;
            const porcentajeCambio = (gananciaPerdida / inversion.cantidadInvertida) * 100;

            const li = document.createElement('li');
            li.innerHTML = `
                <div style="flex: 1;">
                    <strong>${inversion.activo}</strong> (${inversion.tipoActivo})
                    <div style="font-size: 0.8rem; color: var(--text-light);">
                        Invertido: ${formatNumberVE(inversion.cantidadInvertida)} Bs
                        <br>Fecha: ${new Date(inversion.fecha).toLocaleDateString()}
                    </div>
                </div>
                <div style="text-align: right;">
                    <div>Valor actual: <strong>${formatNumberVE(valorActual)} Bs</strong></div>
                    <div style="color: ${gananciaPerdida >= 0 ? 'var(--success)' : 'var(--danger)'};">
                        ${gananciaPerdida >= 0 ? '+' : ''}${formatNumberVE(gananciaPerdida)} Bs (${porcentajeCambio.toFixed(2)}%)
                    </div>
                    <button onclick="eliminarInversion(${inversion.id})" style="background: var(--danger); color: white; border: none; border-radius: 4px; padding: 0.25rem 0.5rem; margin-top: 0.5rem;">Eliminar</button>
                </div>
            `;
            ul.appendChild(li);
        });

        // Actualizar gráfico
        actualizarGraficoInversiones(inversiones);
    } catch (error) {
        console.error('Error al renderizar inversiones:', error);
        mostrarToast('Error al cargar las inversiones. Inténtalo de nuevo.', 'danger');

        // Mostrar mensaje de error en la interfaz
        const ul = document.getElementById('listaInversiones');
        if (ul) {
            ul.innerHTML = '<li style="text-align: center; color: var(--danger);">Error al cargar inversiones. Verifica la consola para más detalles.</li>';
        }
    }
}

// ✅ NUEVA Y MEJORADA FUNCIÓN: RENDERIZAR CALENDARIO VISUAL INTERACTIVO (SOLO MES ACTUAL)
async function renderizarCalendario() {
    const container = document.getElementById('calendarContainer');
    const monthYearEl = document.getElementById('calendarMonthYear');
    const monthYearNavEl = document.getElementById('calendarMonthYearNav');
    const movimientosDiaContainer = document.getElementById('movimientosDiaContainer');
    const tarjetasContainer = document.getElementById('tarjetasMovimientos');
    const infoPaginacion = document.getElementById('infoPaginacion');
    const btnAnterior = document.getElementById('btnAnteriorTarjetas');
    const btnSiguiente = document.getElementById('btnSiguienteTarjetas');
    const fechaSeleccionadaEl = document.getElementById('fechaSeleccionada');
    if (!container || !monthYearEl || !monthYearNavEl || !movimientosDiaContainer || !tarjetasContainer) return;

    // Variable global para almacenar el estado actual del calendario
    let currentMonth = new Date().getMonth(); // 0-11
    let currentYear = new Date().getFullYear();

    // Función auxiliar para renderizar el calendario
    async function renderizarMes(month, year) {
        // Limpiar contenedores
        container.innerHTML = '';
        tarjetasContainer.innerHTML = '';
        movimientosDiaContainer.style.display = 'none';
        btnAnterior.disabled = true;
        btnSiguiente.disabled = true;
        infoPaginacion.textContent = 'Página 1 de 1';

        // Obtener todos los movimientos
        // ✅ NUEVO (rápido):
// Cargar movimientos UNA sola vez y reutilizar
if (!window.movimientosCache) {
    window.movimientosCache = await getAllEntries(STORES.MOVIMIENTOS);
}
const movimientos = window.movimientosCache;
        // Crear mapa de días con movimientos: { 'YYYY-MM-DD': [movimientos] }
        const diasConMovimientos = {};
        movimientos.forEach(m => {
            const fechaMov = new Date(m.fecha);
            const key = `${fechaMov.getFullYear()}-${String(fechaMov.getMonth() + 1).padStart(2, '0')}-${String(fechaMov.getDate()).padStart(2, '0')}`;
            if (!diasConMovimientos[key]) diasConMovimientos[key] = [];
            diasConMovimientos[key].push(m);
        });

        // Días de la semana (domingo a sábado)
        const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sab'];
        // ✅ NUEVO (reutilizar elementos):
// Crear días de semana SOLO una vez
if (!container.querySelector('.weekday')) {
    diasSemana.forEach(dia => {
        const dayEl = document.createElement('div');
        dayEl.className = 'weekday';
        dayEl.textContent = dia;
        container.appendChild(dayEl);
    });
}

        // Obtener primer día del mes y último día
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay(); // 0 (domingo) a 6 (sábado)

        // Días vacíos al inicio (solo si el mes no empieza en domingo)
        for (let i = 0; i < startingDayOfWeek; i++) {
            const emptyEl = document.createElement('div');
            emptyEl.className = 'empty';
            container.appendChild(emptyEl);
        }

        // Días del mes actual
        for (let dia = 1; dia <= daysInMonth; dia++) {
            const dayEl = document.createElement('div');
            const fechaStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
            const hoy = new Date();
            if (dia === hoy.getDate() && month === hoy.getMonth() && year === hoy.getFullYear()) {
                dayEl.className = 'today';
            } else if (diasConMovimientos[fechaStr]) {
                dayEl.className = 'day-with-movements';
            } else {
                dayEl.className = '';
            }
            dayEl.textContent = dia;

            // ✅ EVENTO CLICK: Mostrar movimientos de ese día
            dayEl.addEventListener('click', () => {
                // Mostrar contenedor de tarjetas
                movimientosDiaContainer.style.display = 'block';
                fechaSeleccionadaEl.textContent = `${dia} de ${meses[month]} ${year}`;
                // Obtener movimientos de ese día
                const movimientosDelDia = diasConMovimientos[fechaStr] || [];
                // Renderizar tarjetas
                renderizarTarjetasMovimientos(movimientosDelDia, 1);
                // Actualizar paginación
                actualizarPaginacionTarjetas(movimientosDelDia.length);
            });
            container.appendChild(dayEl);
        }

        // Actualizar título del mes
        const meses = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        monthYearEl.textContent = `${meses[month]} ${year}`;
        monthYearNavEl.textContent = `${meses[month]} ${year}`;
    }

    // Función auxiliar: CAMBIAR MES
    // ✅ NUEVO (actualizar solo lo necesario):
window.cambiarMes = function(direccion) {
    currentMonth += direccion;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    } else if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderizarMes(currentMonth, currentYear); // ← ¡Solo actualiza números!
};

    // Función auxiliar: RENDERIZAR TARJETAS DE MOVIMIENTOS POR DÍA
    function renderizarTarjetasMovimientos(movimientos, pagina) {
        const tarjetasContainer = document.getElementById('tarjetasMovimientos');
        const TARJETAS_POR_PAGINA = 6;
        const inicio = (pagina - 1) * TARJETAS_POR_PAGINA;
        const fin = inicio + TARJETAS_POR_PAGINA;
        const paginaActual = movimientos.slice(inicio, fin);
        // Limpiar
        tarjetasContainer.innerHTML = '';
        if (paginaActual.length === 0) {
            tarjetasContainer.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--text-light); font-style: italic;">
                    No hay movimientos registrados para este día.
                </div>
            `;
            return;
        }
        // Renderizar cada tarjeta
        paginaActual.forEach(m => {
            const tarjeta = document.createElement('div');
            tarjeta.className = 'tarjeta-movimiento';
            // Emoji por categoría (mismo sistema que Presupuesto)
            const emoji = emojiCategoria(m.categoria || 'Sin categoría');
            // ✅ NUEVO (moderno y atractivo):
const montoColor = m.tipo === 'ingreso' ? 'var(--success)' : 'var(--danger)';
const montoSigno = m.tipo === 'ingreso' ? '+' : '-';

tarjeta.innerHTML = `
    <div class="movement-list-item">
        
        <div class="list-item-left">
            <div class="list-item-icon">${emoji}</div>
            <div class="list-item-info">
                <div class="list-item-concept">${m.concepto}</div>
                <div class="list-item-category">${m.categoria || 'Sin categoría'}</div>
            </div>
        </div>
        
        <div class="list-item-right">
            
            <div class="list-item-amount-group">
                <div class="list-item-amount-value" style="color: ${montoColor};">
                    ${montoSigno} Bs. ${formatNumberVE(m.cantidad)}
                </div>
                ${m.banco ? `<div class="list-item-bank">${m.banco}</div>` : ''}
            </div>
            
            <div class="list-item-datetime">
                <span>${new Date(m.fecha).toLocaleDateString('es-VE', { day: 'numeric', month: 'short' })}</span>
                <span>${new Date(m.fecha).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            
        </div>
        
    </div>
`;
            tarjetasContainer.appendChild(tarjeta);
        });
    }

    // Función auxiliar: ACTUALIZAR PAGINACIÓN DE TARJETAS
    function actualizarPaginacionTarjetas(totalMovimientos) {
        const TARJETAS_POR_PAGINA = 6;
        const totalPaginas = Math.ceil(totalMovimientos / TARJETAS_POR_PAGINA);
        const paginaActual = 1;
        const infoPaginacion = document.getElementById('infoPaginacion');
        const btnAnterior = document.getElementById('btnAnteriorTarjetas');
        const btnSiguiente = document.getElementById('btnSiguienteTarjetas');
        infoPaginacion.textContent = `Página ${paginaActual} de ${totalPaginas}`;
        btnAnterior.disabled = true;
        btnSiguiente.disabled = totalPaginas <= 1;
        document.getElementById('paginacionTarjetas').style.display = totalPaginas > 1 ? 'flex' : 'none';
    }

    // Función auxiliar: CAMBIAR PÁGINA DE TARJETAS
    // Función auxiliar: CAMBIAR PÁGINA DE TARJETAS
window.cambiarPaginaTarjetas = function(direccion) {
    const tarjetasContainer = document.getElementById('tarjetasMovimientos');
    const infoPaginacion = document.getElementById('infoPaginacion');
    const btnAnterior = document.getElementById('btnAnteriorTarjetas');
    const btnSiguiente = document.getElementById('btnSiguienteTarjetas');
    
    // Recuperar la fecha seleccionada para obtener los movimientos
    const fechaTexto = document.getElementById('fechaSeleccionada').textContent;
    const partes = fechaTexto.split(' ');
    const dia = partes[0];
    const mesNombre = partes[2];
    const anio = partes[3];
    
    const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const mesIndex = meses.indexOf(mesNombre);
    
    // Obtener movimientos (usar cache si existe)
    const movimientos = window.movimientosCache || [];
    
    // Filtrar movimientos del día y mes seleccionado
    const movimientosDelDia = movimientos.filter(m => {
        const fechaMov = new Date(m.fecha);
        return fechaMov.getDate() == dia &&
               fechaMov.getMonth() == mesIndex &&
               fechaMov.getFullYear() == anio;
    });
    
    // Calcular nueva página
    const TARJETAS_POR_PAGINA = 6;
    const totalPaginas = Math.ceil(movimientosDelDia.length / TARJETAS_POR_PAGINA);
    let nuevaPagina = parseInt(infoPaginacion.textContent.split(' ')[1]) + direccion;
    
    if (nuevaPagina < 1) nuevaPagina = 1;
    if (nuevaPagina > totalPaginas) nuevaPagina = totalPaginas;
    
    // Renderizar
    renderizarTarjetasMovimientos(movimientosDelDia, nuevaPagina);
    
    // Actualizar paginación
    infoPaginacion.textContent = `Página ${nuevaPagina} de ${totalPaginas}`;
    btnAnterior.disabled = nuevaPagina <= 1;
    btnSiguiente.disabled = nuevaPagina >= totalPaginas;
};

    // Función auxiliar: EMOJI POR CATEGORÍA (igual que en Presupuesto)
    function emojiCategoria(cat) {
        const map = {
            'Honorarios': '💰',
            'Laboratorios': '🧪',
            'Material': '🩺',
            'Servicios': '🔌',
            'Oficina': '🖥️',
            'Transporte': '🚗',
            'Comida': '🍔',
            'Otros': '📦',
            'Sin categoría': '📊',
            'Ingreso': '📈',
            'Gasto': '📉',
            'Saldo inicial': '🏦'
        };
        return map[cat] || '📊';
    }

    // Renderizar el mes actual al cargar
    renderizarMes(currentMonth, currentYear);
}

// Función para actualizar el gráfico de inversiones
function actualizarGraficoInversiones(inversiones) {
    const canvas = document.getElementById('graficoInversiones');
    if (!canvas) {
        console.warn('Canvas de gráfico de inversiones no encontrado');
        return;
    }

    const ctx = canvas.getContext('2d');

    // Si ya hay un gráfico válido, destruirlo
    if (window.graficoInversiones && typeof window.graficoInversiones.destroy === 'function') {
        window.graficoInversiones.destroy();
    }

    // Si no hay inversiones, no crear gráfico
    if (!inversiones || inversiones.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '16px Arial';
        ctx.fillStyle = 'var(--text-light)';
        ctx.textAlign = 'center';
        ctx.fillText('No hay inversiones para mostrar', canvas.width / 2, canvas.height / 2);
        return;
    }

    const labels = inversiones.map(inv => inv.activo);
    const dataInvertido = inversiones.map(inv => inv.cantidadInvertida);
    const dataActual = inversiones.map(inv => inv.cantidadUnidades * inv.precioActual);

    try {
        window.graficoInversiones = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Invertido',
                        data: dataInvertido,
                        backgroundColor: 'rgba(54, 162, 235, 0.5)'
                    },
                    {
                        label: 'Valor actual',
                        data: dataActual,
                        backgroundColor: 'rgba(75, 192, 192, 0.5)'
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Comparación: Invertido vs Valor Actual'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Cantidad (Bs)'
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error al crear gráfico de inversiones:', error);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '14px Arial';
        ctx.fillStyle = 'var(--danger)';
        ctx.textAlign = 'center';
        ctx.fillText('Error al cargar el gráfico', canvas.width / 2, canvas.height / 2);
    }
}

// ======================================================================================
// ✅ SISTEMA DE WIDGETS PERSONALIZABLES
// ======================================================================================

// Widget types disponibles
const TIPOS_WIDGET = {
    RESUMEN_FINANCIERO: 'resumen_financiero',
    GRAFICO_GASTOS: 'grafico_gastos',
    ALERTA_SALDO: 'alerta_saldo',
    CONVERSOR_MONEDA: 'conversor_moneda',
    PROGRESO_PRESUPUESTO: 'progreso_presupuesto',
    ULTIMOS_MOVIMIENTOS: 'ultimos_movimientos'
};

// Función para obtener configuración de widgets del localStorage
function obtenerConfiguracionWidgets() {
    const config = localStorage.getItem('dashboardWidgets');
    return config ? JSON.parse(config) : [];
}

// Función para guardar configuración de widgets
function guardarConfiguracionWidgets(config) {
    localStorage.setItem('dashboardWidgets', JSON.stringify(config));
}

// Función para crear un widget básico
function crearWidget(id, tipo, titulo, configuracion = {}) {
    const widget = {
        id,
        tipo,
        titulo,
        configuracion,
        posicion: Date.now(), // Para ordenamiento
        activo: true
    };
    return widget;
}

// Función para agregar un nuevo widget
function agregarWidget() {
    const tipos = Object.values(TIPOS_WIDGET);
    const tipoSeleccionado = tipos[Math.floor(Math.random() * tipos.length)]; // Para demo
    
    const widget = crearWidget(
        'widget_' + Date.now(),
        tipoSeleccionado,
        obtenerTituloWidget(tipoSeleccionado)
    );
    
    const config = obtenerConfiguracionWidgets();
    config.push(widget);
    guardarConfiguracionWidgets(config);
    
    cargarWidgets();
    mostrarToast('✅ Widget agregado exitosamente', 'success');
}

// Función para obtener título según el tipo de widget
function obtenerTituloWidget(tipo) {
    const titulos = {
        [TIPOS_WIDGET.RESUMEN_FINANCIERO]: '📊 Resumen Financiero',
        [TIPOS_WIDGET.GRAFICO_GASTOS]: '📈 Gastos por Categoría',
        [TIPOS_WIDGET.ALERTA_SALDO]: '⚠️ Alerta de Saldo',
        [TIPOS_WIDGET.CONVERSOR_MONEDA]: '💱 Conversor de Moneda',
        [TIPOS_WIDGET.PROGRESO_PRESUPUESTO]: '🎯 Progreso del Presupuesto',
        [TIPOS_WIDGET.ULTIMOS_MOVIMIENTOS]: '📝 Últimos Movimientos'
    };
    return titulos[tipo] || 'Widget Personalizado';
}

// Función para renderizar un widget específico
function renderizarWidget(widget) {
    const contenedor = document.getElementById('contenedorWidgets');
    if (!contenedor) return;

    const widgetElement = document.createElement('div');
    widgetElement.className = 'widget-card';
    widgetElement.id = `widget-${widget.id}`;
    widgetElement.draggable = true;
    
    // Agregar estilos básicos para el widget
    widgetElement.style.cssText = `
        background: var(--card-bg);
        border-radius: var(--radius);
        padding: 1rem;
        box-shadow: var(--shadow-sm);
        transition: all var(--transition);
        cursor: move;
        border: 1px solid var(--text-light);
    `;
    
    // Header del widget
    const header = document.createElement('div');
    header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;';
    
    const titulo = document.createElement('h3');
    titulo.textContent = widget.titulo;
    titulo.style.cssText = 'font-size: 1rem; margin: 0; color: var(--text);';
    
    const controles = document.createElement('div');
    controles.style.cssText = 'display: flex; gap: 0.25rem;';
    
    // Botón configurar
    const btnConfig = document.createElement('button');
    btnConfig.innerHTML = '⚙️';
    btnConfig.style.cssText = 'background: none; border: none; color: var(--primary); cursor: pointer; padding: 0.25rem; border-radius: 4px; font-size: 0.8rem;';
    btnConfig.title = 'Configurar widget';
    btnConfig.onclick = () => configurarWidget(widget.id);
    
    // Botón eliminar
    const btnEliminar = document.createElement('button');
    btnEliminar.innerHTML = '🗑️';
    btnEliminar.style.cssText = 'background: none; border: none; color: var(--danger); cursor: pointer; padding: 0.25rem; border-radius: 4px; font-size: 0.8rem;';
    btnEliminar.title = 'Eliminar widget';
    btnEliminar.onclick = () => eliminarWidget(widget.id);
    
    controles.appendChild(btnConfig);
    controles.appendChild(btnEliminar);
    
    header.appendChild(titulo);
    header.appendChild(controles);
    
    // Contenido del widget según su tipo
    const contenido = document.createElement('div');
    contenido.className = 'widget-content';
    contenido.style.cssText = 'color: var(--text-light);';
    
    // Renderizar contenido según el tipo de widget
    switch (widget.tipo) {
        case TIPOS_WIDGET.RESUMEN_FINANCIERO:
            contenido.innerHTML = `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div>
                        <p style="font-size: 0.8rem; margin: 0 0 0.25rem 0;">Saldo Actual</p>
                        <p style="font-size: 1.2rem; font-weight: 600; color: var(--success); margin: 0;">Bs. ${formatNumberVE(0)}</p>
                    </div>
                    <div>
                        <p style="font-size: 0.8rem; margin: 0 0 0.25rem 0;">Este Mes</p>
                        <p style="font-size: 1.2rem; font-weight: 600; color: var(--primary); margin: 0;">Bs. ${formatNumberVE(0)}</p>
                    </div>
                </div>
            `;
            break;
            
        case TIPOS_WIDGET.ALERTA_SALDO:
            contenido.innerHTML = `
                <div style="text-align: center; padding: 1rem;">
                    <p style="margin: 0 0 0.5rem 0;">💰 Estado del Saldo</p>
                    <p style="font-size: 1.1rem; font-weight: 600; color: var(--success); margin: 0;">✓ Saldo Saludable</p>
                </div>
            `;
            break;
            
        case TIPOS_WIDGET.CONVERSOR_MONEDA:
            contenido.innerHTML = `
                <div style="text-align: center;">
                    <p style="margin: 0 0 0.5rem 0;">💱 Equivalente en USD</p>
                    <p style="font-size: 1.3rem; font-weight: 600; color: var(--primary); margin: 0;">$0.00</p>
                    <p style="font-size: 0.8rem; color: var(--text-light); margin: 0.25rem 0 0 0;">Tasa: 1 USD = Bs. 0,00</p>
                </div>
            `;
            break;
            
        default:
            contenido.innerHTML = `
                <div style="text-align: center; padding: 1rem;">
                    <p style="margin: 0;">📊 Widget ${widget.tipo}</p>
                    <p style="font-size: 0.8rem; color: var(--text-light); margin: 0.5rem 0 0 0;">Contenido personalizado</p>
                </div>
            `;
    }
    
    widgetElement.appendChild(header);
    widgetElement.appendChild(contenido);
    
    // Eventos de drag & drop
    widgetElement.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', widget.id);
        widgetElement.style.opacity = '0.5';
    });
    
    widgetElement.addEventListener('dragend', () => {
        widgetElement.style.opacity = '1';
        guardarOrdenWidgets();
    });
    
    widgetElement.addEventListener('dragover', (e) => {
        e.preventDefault();
    });
    
    widgetElement.addEventListener('drop', (e) => {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData('text/plain');
        const dropTarget = widgetElement;
        
        if (draggedId !== dropTarget.id.replace('widget-', '')) {
            reordenarWidgets(draggedId, dropTarget.id.replace('widget-', ''));
        }
    });
    
    return widgetElement;
}

// Función para cargar todos los widgets
function cargarWidgets() {
    const contenedor = document.getElementById('contenedorWidgets');
    const mensajeSinWidgets = document.getElementById('mensajeSinWidgets');
    
    if (!contenedor) return;
    
    // Limpiar contenedor
    contenedor.innerHTML = '';
    
    const config = obtenerConfiguracionWidgets();
    
    if (config.length === 0) {
        mensajeSinWidgets.style.display = 'block';
        return;
    }
    
    mensajeSinWidgets.style.display = 'none';
    
    // Ordenar widgets por posición
    config.sort((a, b) => a.posicion - b.posicion);
    
    // Renderizar cada widget
    config.forEach(widget => {
        if (widget.activo) {
            const widgetElement = renderizarWidget(widget);
            contenedor.appendChild(widgetElement);
        }
    });
}

// Función para eliminar un widget
function eliminarWidget(widgetId) {
    mostrarConfirmacion('¿Estás seguro de que quieres eliminar este widget?').then(confirmado => {
        if (confirmado) {
            const config = obtenerConfiguracionWidgets();
            const nuevosWidgets = config.filter(w => w.id !== widgetId);
            guardarConfiguracionWidgets(nuevosWidgets);
            
            cargarWidgets();
            mostrarToast('✅ Widget eliminado', 'success');
        }
    });
}

// Función para configurar un widget
function configurarWidget(widgetId) {
    mostrarToast('🔧 Configuración de widgets próximamente', 'info');
    // Aquí iría la lógica para configurar opciones específicas del widget
}

// Función para mostrar configuración general de widgets
function mostrarConfiguracionWidgets() {
    mostrarToast('⚙️ Configuración general próximamente', 'info');
    // Aquí iría un modal con opciones generales de widgets
}

// Función para guardar el orden de los widgets
function guardarOrdenWidgets() {
    const contenedor = document.getElementById('contenedorWidgets');
    if (!contenedor) return;
    
    const widgets = Array.from(contenedor.children);
    const config = obtenerConfiguracionWidgets();
    
    widgets.forEach((widget, index) => {
        const widgetId = widget.id.replace('widget-', '');
        const widgetConfig = config.find(w => w.id === widgetId);
        if (widgetConfig) {
            widgetConfig.posicion = index;
        }
    });
    
    guardarConfiguracionWidgets(config);
}

// Función para reordenar widgets mediante drag & drop
function reordenarWidgets(draggedId, targetId) {
    const config = obtenerConfiguracionWidgets();
    const draggedIndex = config.findIndex(w => w.id === draggedId);
    const targetIndex = config.findIndex(w => w.id === targetId);
    
    if (draggedIndex !== -1 && targetIndex !== -1) {
        // Intercambiar posiciones
        [config[draggedIndex], config[targetIndex]] = [config[targetIndex], config[draggedIndex]];
        
        // Actualizar posiciones
        config.forEach((widget, index) => {
            widget.posicion = index;
        });
        
        guardarConfiguracionWidgets(config);
        cargarWidgets();
    }
}

// Función para mostrar ayuda sobre widgets
function mostrarAyudaWidgets() {
    mostrarToast('❓ Los widgets son componentes personalizables que puedes agregar, eliminar y reorganizar en tu dashboard', 'info');
}

// Función para editar deuda (funcionalidad básica)
function editarDeuda(deudaId) {
    mostrarToast('✏️ Edición de deudas próximamente', 'info');
    // Aquí iría la lógica para editar una deuda existente
}

// Inicializar widgets cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    // Cargar widgets cuando se muestra el dashboard
    const dashboardTab = document.querySelector('[onclick="mostrarSideTab(\'dashboard\')"]');
    if (dashboardTab) {
        dashboardTab.addEventListener('click', cargarWidgets);
    }
    
    // También cargar si ya estamos en el dashboard
    if (document.getElementById('side-dashboard').classList.contains('active')) {
        cargarWidgets();
    }
});

// ======================================================================================
// ✅ SISTEMA DE GESTIÓN DE DEUDAS Y PRÉSTAMOS
// ======================================================================================

// Constantes para tipos de deuda
const TIPOS_DEUDA = {
    DEBO: 'debo',
    ME_DEBEN: 'me_deben'
};

const ESTADOS_DEUDA = {
    PENDIENTE: 'pendiente',
    PAGADA: 'pagada',
    VENCIDA: 'vencida'
};

// Función para obtener configuración de deudas del localStorage
function obtenerDeudas() {
    const deudas = localStorage.getItem('deudas');
    return deudas ? JSON.parse(deudas) : [];
}

// Función para guardar deudas en localStorage
function guardarDeudas(deudas) {
    localStorage.setItem('deudas', JSON.stringify(deudas));
}

// Función para limpiar el formulario de deuda
function limpiarFormularioDeuda() {
    document.getElementById('nombreDeudor').value = '';
    document.getElementById('montoDeuda').value = '';
    document.getElementById('fechaDeuda').value = '';
    document.getElementById('descripcionDeuda').value = '';
    document.getElementById('tieneInteres').checked = false;
    document.getElementById('tasaInteres').value = '';
    document.getElementById('tieneFechaVencimiento').checked = false;
    document.getElementById('fechaVencimiento').value = '';
    document.getElementById('camposInteres').style.display = 'none';
    document.getElementById('camposVencimiento').style.display = 'none';
    document.querySelector('input[name="tipoDeuda"][value="debo"]').checked = true;
}

// Función para guardar una nueva deuda
function guardarDeuda() {
    const nombre = document.getElementById('nombreDeudor').value.trim();
    const monto = document.getElementById('montoDeuda').value.trim();
    const moneda = document.getElementById('monedaDeuda').value;
    const fecha = document.getElementById('fechaDeuda').value;
    const descripcion = document.getElementById('descripcionDeuda').value.trim();
    const tipo = document.querySelector('input[name="tipoDeuda"]:checked').value;
    const tieneInteres = document.getElementById('tieneInteres').checked;
    const tasaInteres = tieneInteres ? parseFloat(document.getElementById('tasaInteres').value) : 0;
    const tieneVencimiento = document.getElementById('tieneFechaVencimiento').checked;
    const fechaVencimiento = tieneVencimiento ? document.getElementById('fechaVencimiento').value : null;

    // Validaciones
    if (!nombre || !monto || !fecha) {
        mostrarToast('❌ Por favor completa todos los campos obligatorios', 'danger');
        return;
    }

    if (tieneInteres && (isNaN(tasaInteres) || tasaInteres < 0)) {
        mostrarToast('❌ Ingresa una tasa de interés válida', 'danger');
        return;
    }

    // Crear objeto deuda
    const deuda = {
        id: 'deuda_' + Date.now(),
        nombre,
        monto: parseFloat(monto),
        moneda,
        fecha,
        descripcion,
        tipo,
        estado: ESTADOS_DEUDA.PENDIENTE,
        tieneInteres,
        tasaInteres,
        tieneVencimiento,
        fechaVencimiento,
        fechaCreacion: new Date().toISOString(),
        pagos: []
    };

    // Agregar deuda a la lista
    const deudas = obtenerDeudas();
    deudas.push(deuda);
    guardarDeudas(deudas);

    // Limpiar formulario y actualizar vista
    limpiarFormularioDeuda();
    cargarDeudas();
    mostrarToast('✅ Deuda registrada exitosamente', 'success');
}

// Función para cargar y mostrar todas las deudas
function cargarDeudas() {
    const contenedor = document.getElementById('contenedorDeudas');
    const filtroEstado = document.getElementById('filtroEstadoDeuda').value;
    const filtroTipo = document.getElementById('filtroTipoDeuda').value;
    
    if (!contenedor) return;

    const deudas = obtenerDeudas();
    
    // Aplicar filtros
    let deudasFiltradas = deudas;
    if (filtroEstado) {
        deudasFiltradas = deudasFiltradas.filter(d => d.estado === filtroEstado);
    }
    if (filtroTipo) {
        deudasFiltradas = deudasFiltradas.filter(d => d.tipo === filtroTipo);
    }

    // Limpiar contenedor
    contenedor.innerHTML = '';

    if (deudasFiltradas.length === 0) {
        contenedor.innerHTML = '<p style="text-align: center; color: var(--text-light); font-style: italic;">No hay deudas que coincidan con los filtros</p>';
        actualizarResumenDeudas(deudas);
        return;
    }

    // Crear tarjetas para cada deuda
    deudasFiltradas.forEach(deuda => {
        const tarjetaDeuda = crearTarjetaDeuda(deuda);
        contenedor.appendChild(tarjetaDeuda);
    });

    actualizarResumenDeudas(deudas);
    actualizarAlertasVencimiento(deudas);
    actualizarSelectorDeudas();
}

// Función para crear tarjeta de deuda
function crearTarjetaDeuda(deuda) {
    const tarjeta = document.createElement('div');
    tarjeta.className = 'tarjeta-deuda';
    tarjeta.style.cssText = `
        background: var(--card-bg);
        border-radius: var(--radius);
        padding: 1rem;
        margin-bottom: 1rem;
        border-left: 4px solid ${deuda.tipo === TIPOS_DEUDA.DEBO ? 'var(--danger)' : 'var(--success)'};
        box-shadow: var(--shadow-sm);
    `;

    const esVencida = deuda.tieneVencimiento && new Date(deuda.fechaVencimiento) < new Date() && deuda.estado === ESTADOS_DEUDA.PENDIENTE;
    if (esVencida) {
        tarjeta.style.borderLeftColor = 'var(--danger)';
    }

    const montoFormateado = formatNumberVE(deuda.monto);
    const simboloMoneda = deuda.moneda === 'USD' ? '$' : deuda.moneda === 'EUR' ? '€' : 'Bs.';

    tarjeta.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.75rem;">
            <div>
                <h3 style="margin: 0 0 0.25rem 0; color: var(--text);">${deuda.nombre}</h3>
                <p style="margin: 0; color: var(--text-light); font-size: 0.875rem;">
                    ${deuda.tipo === TIPOS_DEUDA.DEBO ? 'Debo' : 'Me deben'} ${simboloMoneda} ${montoFormateado}
                    ${deuda.tieneFechaVencimiento ? `• Vence: ${new Date(deuda.fechaVencimiento).toLocaleDateString()}` : ''}
                </p>
            </div>
            <div style="display: flex; gap: 0.25rem;">
                <button onclick="editarDeuda('${deuda.id}')" style="background: none; border: none; color: var(--primary); cursor: pointer; padding: 0.25rem;" title="Editar">
                    ✏️
                </button>
                <button onclick="marcarComoPagada('${deuda.id}')" style="background: none; border: none; color: var(--success); cursor: pointer; padding: 0.25rem;" title="Marcar como pagada">
                    ✅
                </button>
                <button onclick="eliminarDeuda('${deuda.id}')" style="background: none; border: none; color: var(--danger); cursor: pointer; padding: 0.25rem;" title="Eliminar">
                    🗑️
                </button>
            </div>
        </div>
        
        ${deuda.tieneInteres ? `<p style="margin: 0 0 0.5rem 0; font-size: 0.875rem; color: var(--text-light);">💰 Interés: ${deuda.tasaInteres}% anual</p>` : ''}
        
        ${deuda.descripcion ? `<p style="margin: 0 0 0.5rem 0; font-size: 0.875rem; color: var(--text-light);">📝 ${deuda.descripcion}</p>` : ''}
        
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: var(--text-light);">
            <span>Creada: ${new Date(deuda.fechaCreacion).toLocaleDateString()}</span>
            <span class="${esVencida ? 'vencida' : deuda.estado}">Estado: ${esVencida ? 'VENCIDA' : deuda.estado.toUpperCase()}</span>
        </div>
    `;

    return tarjeta;
}

// Función para actualizar resumen de deudas
function actualizarResumenDeudas(deudas) {
    const totalDebo = deudas
        .filter(d => d.tipo === TIPOS_DEUDA.DEBO && d.estado === ESTADOS_DEUDA.PENDIENTE)
        .reduce((sum, d) => sum + d.monto, 0);

    const totalMeDeben = deudas
        .filter(d => d.tipo === TIPOS_DEUDA.ME_DEBEN && d.estado === ESTADOS_DEUDA.PENDIENTE)
        .reduce((sum, d) => sum + d.monto, 0);

    document.getElementById('totalDebo').textContent = formatNumberVE(totalDebo);
    document.getElementById('totalMeDeben').textContent = formatNumberVE(totalMeDeben);
}

// Función para actualizar alertas de vencimiento
function actualizarAlertasVencimiento(deudas) {
    const alertasContenedor = document.getElementById('contenedorAlertas');
    const hoy = new Date();
    const proximosDias = 7; // Alertar si vence en los próximos 7 días

    const alertas = deudas.filter(d => {
        if (d.estado !== ESTADOS_DEUDA.PENDIENTE || !d.tieneVencimiento) return false;
        
        const fechaVencimiento = new Date(d.fechaVencimiento);
        const diferenciaDias = Math.ceil((fechaVencimiento - hoy) / (1000 * 60 * 60 * 24));
        
        return diferenciaDias <= proximosDias && diferenciaDias >= 0;
    });

    if (alertas.length === 0) {
        alertasContenedor.innerHTML = '<p style="text-align: center; color: var(--text-light); font-style: italic;">No hay alertas pendientes</p>';
        return;
    }

    alertasContenedor.innerHTML = '';
    alertas.forEach(alerta => {
        const fechaVencimiento = new Date(alerta.fechaVencimiento);
        const diferenciaDias = Math.ceil((fechaVencimiento - hoy) / (1000 * 60 * 60 * 24));
        
        const alertaDiv = document.createElement('div');
        alertaDiv.style.cssText = `
            background: ${diferenciaDias === 0 ? 'var(--danger)' : 'var(--warning)'};
            color: white;
            padding: 0.75rem;
            border-radius: 8px;
            margin-bottom: 0.5rem;
        `;
        
        alertaDiv.innerHTML = `
            <strong>🚨 ${alerta.nombre}</strong><br>
            Vence ${diferenciaDias === 0 ? 'HOY' : `en ${diferenciaDias} día${diferenciaDias !== 1 ? 's' : ''}`}
            ${alerta.tipo === TIPOS_DEUDA.DEBO ? `• Debo Bs. ${formatNumberVE(alerta.monto)}` : `• Me deben Bs. ${formatNumberVE(alerta.monto)}`}
        `;
        
        alertasContenedor.appendChild(alertaDiv);
    });
}

// Función para marcar deuda como pagada
function marcarComoPagada(deudaId) {
    mostrarConfirmacion('¿Marcar esta deuda como pagada?').then(confirmado => {
        if (confirmado) {
            const deudas = obtenerDeudas();
            const deuda = deudas.find(d => d.id === deudaId);
            
            if (deuda) {
                deuda.estado = ESTADOS_DEUDA.PAGADA;
                deuda.fechaPago = new Date().toISOString();
                guardarDeudas(deudas);
                cargarDeudas();
                mostrarToast('✅ Deuda marcada como pagada', 'success');
            }
        }
    });
}

// Función para eliminar deuda
function eliminarDeuda(deudaId) {
    mostrarConfirmacion('¿Estás seguro de que quieres eliminar esta deuda?').then(confirmado => {
        if (confirmado) {
            const deudas = obtenerDeudas();
            const nuevasDeudas = deudas.filter(d => d.id !== deudaId);
            guardarDeudas(nuevasDeudas);
            cargarDeudas();
            mostrarToast('✅ Deuda eliminada', 'success');
        }
    });
}

// Función para calcular intereses simples
function calcularIntereses() {
    const capital = parseFloat(document.getElementById('capitalInteres').value);
    const tasa = parseFloat(document.getElementById('tasaInteresCalc').value);
    const periodo = parseFloat(document.getElementById('periodoInteres').value);

    if (isNaN(capital) || isNaN(tasa) || isNaN(periodo)) {
        mostrarToast('❌ Ingresa valores válidos', 'danger');
        return;
    }

    if (capital <= 0 || tasa < 0 || periodo <= 0) {
        mostrarToast('❌ Los valores deben ser mayores a cero', 'danger');
        return;
    }

    const interes = (capital * tasa * periodo) / 100;
    const montoFinal = capital + interes;

    document.getElementById('montoFinalInteres').value = formatNumberVE(montoFinal);
    mostrarToast(`💰 Intereses: ${formatNumberVE(interes)} • Total: ${formatNumberVE(montoFinal)}`, 'success');
}

// Función para generar plan de pagos en PDF
function generarPlanPagosPDF() {
    const deudaId = document.getElementById('deudaParaPlan').value;
    const numPagos = parseInt(document.getElementById('numPagos').value);
    const frecuencia = document.getElementById('frecuenciaPagos').value;

    if (!deudaId || !numPagos) {
        mostrarToast('❌ Selecciona una deuda y número de pagos', 'danger');
        return;
    }

    const deudas = obtenerDeudas();
    const deuda = deudas.find(d => d.id === deudaId);
    
    if (!deuda) {
        mostrarToast('❌ Deuda no encontrada', 'danger');
        return;
    }

    // Crear contenido del PDF
    const contenido = generarContenidoPlanPagos(deuda, numPagos, frecuencia);
    
    // Crear y descargar PDF (usando jsPDF si está disponible)
    if (typeof jspdf !== 'undefined') {
        const { jsPDF } = jspdf;
        const doc = new jsPDF();
        
        doc.setFontSize(16);
        doc.text('PLAN DE PAGOS', 20, 20);
        
        doc.setFontSize(12);
        doc.text(`Deuda: ${deuda.nombre}`, 20, 35);
        doc.text(`Monto total: Bs. ${formatNumberVE(deuda.monto)}`, 20, 45);
        doc.text(`Número de pagos: ${numPagos}`, 20, 55);
        doc.text(`Frecuencia: ${frecuencia}`, 20, 65);
        
        doc.setFontSize(10);
        let yPosition = 85;
        
        contenido.forEach((pago, index) => {
            if (yPosition > 250) {
                doc.addPage();
                yPosition = 20;
            }
            
            doc.text(`Pago ${index + 1}: ${pago.fecha} - Bs. ${formatNumberVE(pago.monto)}`, 20, yPosition);
            yPosition += 10;
        });
        
        doc.save(`plan_pagos_${deuda.nombre.replace(/\s+/g, '_')}.pdf`);
        mostrarToast('📄 PDF generado exitosamente', 'success');
    } else {
        mostrarToast('❌ Librería jsPDF no disponible', 'danger');
    }
}

// Función para generar contenido del plan de pagos
function generarContenidoPlanPagos(deuda, numPagos, frecuencia) {
    const pagos = [];
    const montoPorPago = deuda.monto / numPagos;
    const fechaInicio = new Date();
    
    for (let i = 0; i < numPagos; i++) {
        const fechaPago = new Date(fechaInicio);
        
        switch (frecuencia) {
            case 'mensual':
                fechaPago.setMonth(fechaPago.getMonth() + i);
                break;
            case 'quincenal':
                fechaPago.setDate(fechaPago.getDate() + (i * 15));
                break;
            case 'semanal':
                fechaPago.setDate(fechaPago.getDate() + (i * 7));
                break;
        }
        
        pagos.push({
            fecha: fechaPago.toLocaleDateString(),
            monto: montoPorPago
        });
    }
    
    return pagos;
}

// Función para mostrar ayuda sobre deudas
function mostrarAyudaDeudas() {
    mostrarToast('💡 Gestiona tus préstamos personales: registra deudas que tienes o dinero que te deben', 'info');
}

// Función para actualizar selector de deudas
function actualizarSelectorDeudas() {
    const selector = document.getElementById('deudaParaPlan');
    const deudas = obtenerDeudas();
    
    selector.innerHTML = '<option value="">Selecciona una deuda</option>';
    
    deudas.filter(d => d.estado === ESTADOS_DEUDA.PENDIENTE).forEach(deuda => {
        const option = document.createElement('option');
        option.value = deuda.id;
        option.textContent = `${deuda.nombre} - Bs. ${formatNumberVE(deuda.monto)}`;
        selector.appendChild(option);
    });
}

// Eventos para mostrar/ocultar campos adicionales
document.addEventListener('DOMContentLoaded', function() {
    const checkboxInteres = document.getElementById('tieneInteres');
    const checkboxVencimiento = document.getElementById('tieneFechaVencimiento');
    
    if (checkboxInteres) {
        checkboxInteres.addEventListener('change', function() {
            document.getElementById('camposInteres').style.display = this.checked ? 'block' : 'none';
        });
    }
    
    if (checkboxVencimiento) {
        checkboxVencimiento.addEventListener('change', function() {
            document.getElementById('camposVencimiento').style.display = this.checked ? 'block' : 'none';
        });
    }
    
    // Cargar deudas cuando se muestra la pestaña
    const deudasTab = document.querySelector('[onclick="mostrarSideTab(\'deudas\')"]');
    if (deudasTab) {
        deudasTab.addEventListener('click', cargarDeudas);
    }
    
    // También cargar si ya estamos en deudas
    if (document.getElementById('side-deudas').classList.contains('active')) {
        cargarDeudas();
    }
});

function cerrarAyudaCalendario() {
    document.getElementById('modalAyudaCalendario').style.display = 'none';
}

// ✅ Función mejorada con contexto global
function reproducirSonidoCambioPestana() {
    if (!sonidosActivados) return; // No reproducir si están desactivados
    try {
        // Usar contexto global si existe, sino crear uno nuevo
        const audioContext = audioContextGlobal || new (window.AudioContext || window.webkitAudioContext)();
        
        // Crear oscilador para generar sonido sutil
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        // Configurar sonido tipo "click" sutil
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(300, audioContext.currentTime + 0.08);
        
        // Configurar volumen bajo
        gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.08);
        
        // Conectar y reproducir
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.08);
        
        console.log('✅ Sonido generado con Web Audio API');
        
    } catch (error) {
        console.error('❌ Error con Web Audio API:', error.message);
        mostrarIndicadorSonido();
    }
}

// ✅ Función auxiliar para indicador visual
function mostrarIndicadorSonido() {
    const titulo = document.querySelector('h1');
    if (titulo && !titulo.textContent.includes('🎵')) {
        const textoOriginal = titulo.textContent;
        titulo.textContent = '🎵 ' + textoOriginal;
        setTimeout(() => {
            titulo.textContent = textoOriginal;
        }, 300);
    }
}

// ✅ Variable global para el contexto de audio
let audioContextGlobal = null;

// ✅ Inicializar audio después de la primera interacción del usuario
document.addEventListener('DOMContentLoaded', function() {
    // Función para crear contexto de audio después de interacción
    const inicializarAudio = () => {
        try {
            if (!audioContextGlobal) {
                audioContextGlobal = new (window.AudioContext || window.webkitAudioContext)();
                console.log('✅ AudioContext creado correctamente');
            }
            // Remover listeners después de inicializar
            document.removeEventListener('click', inicializarAudio);
            document.removeEventListener('keydown', inicializarAudio);
            document.removeEventListener('touchstart', inicializarAudio);
        } catch (error) {
            console.log('❌ Error inicializando AudioContext:', error.message);
        }
    };
    
    // Escuchar primera interacción del usuario
    document.addEventListener('click', inicializarAudio);
    document.addEventListener('keydown', inicializarAudio);
    document.addEventListener('touchstart', inicializarAudio);
});

// ✅ Función para mostrar información de cambios y versión
function mostrarInfoCambios() {
    // Crear modal si no existe
    if (!document.getElementById('modalCambios')) {
        const modal = document.createElement('div');
        modal.id = 'modalCambios';
        modal.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 10000;">
                <div style="background: var(--card-bg); border-radius: var(--radius); padding: 2rem; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;">
                    <h2 style="text-align: center; margin-bottom: 1.5rem; color: var(--primary);">📋 Información del Sistema</h2>
                    
                    <div style="margin-bottom: 1.5rem;">
                        <h3 style="color: var(--primary); margin-bottom: 0.5rem;">📅 Versión Actual</h3>
                        <p><strong>Versión:</strong> ${APP_VERSION || '1.0.4'}</p>
                        <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
                    </div>
                    
                    <div style="margin-bottom: 1.5rem;">
                        <h3 style="color: var(--primary); margin-bottom: 0.5rem;">🎵 Características</h3>
                        <ul style="margin: 0; padding-left: 1.5rem;">
                            <li>✅ Tarjetas elegantes con diseño moderno</li>
                            <li>✅ Sonidos al cambiar de pestañas</li>
                            <li>✅ Scroll automático en paginación</li>
                            <li>✅ Fechas relativas inteligentes</li>
                            <li>✅ Tema oscuro/claro automático</li>
                            <li>✅ Compatibilidad con todos los navegadores</li>
                        </ul>
                    </div>
                    
                    <div style="margin-bottom: 1.5rem;">
                        <h3 style="color: var(--primary); margin-bottom: 0.5rem;">🔧 Mejoras Recientes</h3>
                        <ul style="margin: 0; padding-left: 1.5rem;">
                            <li>✅ Corrección de fechas relativas</li>
                            <li>✅ Web Audio API para sonidos</li>
                            <li>✅ Diseño responsivo mejorado</li>
                            <li>✅ Funciones de scroll automático</li>
                        </ul>
                    </div>
                    
                    <div style="text-align: center; margin-top: 2rem;">
                        <button onclick="cerrarModalCambios()" style="background: var(--primary); color: white; border: none; border-radius: 8px; padding: 0.75rem 2rem; font-size: 1rem; cursor: pointer;">
                            ✅ Cerrar
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    // Mostrar modal
    document.getElementById('modalCambios').style.display = 'flex';
}

// ✅ Función para cerrar modal de cambios
function cerrarModalCambios() {
    const modal = document.getElementById('modalCambios');
    if (modal) {
        modal.style.display = 'none';
    }
}

// ✅ Variable global para controlar sonidos
let sonidosActivados = true;

// ✅ Función para probar sonido
function probarSonido() {
    if (sonidosActivados) {
        reproducirSonidoCambioPestana();
    }
}

// ✅ Función para guardar configuración de sonidos
function guardarConfiguracionSonidos() {
    sonidosActivados = document.getElementById('sonidosActivados').checked;
    localStorage.setItem('sonidosActivados', sonidosActivados.toString());
    mostrarToast(sonidosActivados ? '🔊 Sonidos activados' : '🔇 Sonidos desactivados', 'success');
}

// ✅ Función para cargar configuración de sonidos
function cargarConfiguracionSonidos() {
    const guardado = localStorage.getItem('sonidosActivados');
    sonidosActivados = guardado !== 'false'; // Por defecto activados
    const checkbox = document.getElementById('sonidosActivados');
    if (checkbox) {
        checkbox.checked = sonidosActivados;
    }
}

// ✅ Inicializar configuración de sonidos al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    cargarConfiguracionSonidos();
});

// ✅ AÑADIR: Botón de limpiar búsqueda (Versión Mejorada)
const buscador = document.getElementById('buscadorMovimientos');
const botonLimpiar = document.getElementById('limpiarBusqueda');

if (buscador && botonLimpiar) {
    // Función para actualizar la visibilidad del botón
    function actualizarBotonLimpiar() {
        if (buscador.value.trim().length > 0) {
            botonLimpiar.style.display = 'flex'; // Muestra el botón
        } else {
            botonLimpiar.style.display = 'none'; // Oculta el botón
        }
    }

    // Escuchar cambios en el campo de búsqueda (al escribir)
    buscador.addEventListener('input', actualizarBotonLimpiar);

    // Escuchar también cuando se pega texto
    buscador.addEventListener('paste', function() {
        setTimeout(actualizarBotonLimpiar, 10);
    });

    // Escuchar cuando se borra el texto con la tecla "Supr" o "Backspace"
    buscador.addEventListener('keydown', function(e) {
        if (e.key === 'Backspace' || e.key === 'Delete') {
            // Esperamos un poco para que el valor del input se actualice
            setTimeout(actualizarBotonLimpiar, 1);
        }
    });

    // Función para limpiar el campo y la búsqueda
    botonLimpiar.addEventListener('click', function(e) {
        e.stopPropagation(); // Evita que el click se propague y active el input
        buscador.value = '';
        actualizarBotonLimpiar(); // Actualiza el estado del botón (lo oculta)
        buscarMovimientos(); // Llama a tu función de búsqueda con query vacío → renderizar()
        buscador.focus(); // Devuelve el foco al campo para seguir escribiendo
    });

    // Inicializar: Si al cargar la página ya hay texto, mostrar el botón
    actualizarBotonLimpiar();
}

// ✅ Función para mostrar/ocultar candado según estado del bloqueo
function actualizarBotonBloqueo() {
    const btnBloqueo = document.getElementById('btnBloqueoManual');
    const bloqueoActivo = localStorage.getItem('bloqueoActivo') === 'true' && localStorage.getItem('bloqueoPIN');
    
    if (btnBloqueo) {
        btnBloqueo.style.display = bloqueoActivo ? 'inline-block' : 'none';
    }
}

// ✅ Función para bloquear manualmente
function bloquearManual() {
    if (localStorage.getItem('bloqueoActivo') === 'true' && localStorage.getItem('bloqueoPIN')) {
        // Remover estado desbloqueado para forzar bloqueo
        localStorage.removeItem('bloqueoDesbloqueado');
        mostrarModalBloqueo();
    }
}

// ✅ Inicializar candado al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    actualizarBotonBloqueo();
    
    // Agregar evento al botón candado
    const btnBloqueo = document.getElementById('btnBloqueoManual');
    if (btnBloqueo) {
        btnBloqueo.addEventListener('click', bloquearManual);
    }
});

// ✅ Función para obtener tasas del BCV
async function obtenerTasasBCV() {
    const btn = document.querySelector('[onclick="obtenerTasasBCV()"]');
    const textoOriginal = btn.textContent;
    
    try {
        // Mostrar loading
        btn.textContent = '⏳ Consultando...';
        btn.disabled = true;
        
        // Obtener tasas del BCV (método scraping respetuoso)
        const tasas = await consultarTasasBCV();
        
        if (tasas.dolar && tasas.euro) {
            // Actualizar UI
            document.getElementById('tasaBCV').textContent = formatNumberVE(tasas.dolar);
            document.getElementById('fechaBCV').textContent = `Actualizado: ${new Date().toLocaleString('es-ES')}`;
            
            document.getElementById('tasaBCVEUR').textContent = formatNumberVE(tasas.euro);
            document.getElementById('fechaBCVEUR').textContent = `Actualizado: ${new Date().toLocaleString('es-ES')}`;
            
            // Guardar en historial
            guardarHistorialTasas(tasas);
            
            mostrarToast('✅ Tasas del BCV actualizadas', 'success');
        } else {
            mostrarToast('❌ No se pudieron obtener las tasas', 'error');
        }
        
    } catch (error) {
        console.error('Error obteniendo tasas BCV:', error);
        mostrarToast('❌ Error consultando BCV', 'error');
    } finally {
        // Restaurar botón
        btn.textContent = textoOriginal;
        btn.disabled = false;
    }
}

// ✅ Función para consultar tasas del BCV (scraping controlado)
async function consultarTasasBCV() {
    try {
        console.log('🔍 Consultando tasas oficiales del BCV...');

        // Método 1: Usar API pública de tasas (más confiable)
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            const tasaUSD = data.rates.VES || 179.43; // Tasa USD a VES

            // Para EUR, usar conversión aproximada
            const tasaEUR = tasaUSD * 1.08; // EUR típicamente ~8% más alto que USD

            console.log(`💱 Tasas desde API pública: USD ${tasaUSD}, EUR ${tasaEUR}`);

            return {
                dolar: tasaUSD,
                euro: tasaEUR,
                fecha: new Date().toISOString(),
                fuente: 'API Pública'
            };
        }

        // Método 2: Si falla la API, intentar BCV directamente (con timeout corto)
        console.log('⚠️ API pública falló, intentando BCV directo...');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos timeout

        try {
            const bcvResponse = await fetch('https://www.bcv.org.ve/', {
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3',
                    'Cache-Control': 'no-cache'
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (bcvResponse.ok) {
                const html = await bcvResponse.text();

                // Buscar tasas en el HTML del BCV
                const dolarRegex = /USD.*?(\d{1,3}(?:\.\d{3})*,\d{2})/s;
                const euroRegex = /EUR.*?(\d{1,3}(?:\.\d{3})*,\d{2})/s;

                const dolarMatch = html.match(dolarRegex);
                const euroMatch = html.match(euroRegex);

                if (dolarMatch && euroMatch) {
                    const dolar = parseFloat(dolarMatch[1].replace(/\./g, '').replace(',', '.'));
                    const euro = parseFloat(euroMatch[1].replace(/\./g, '').replace(',', '.'));

                    return {
                        dolar: dolar,
                        euro: euro,
                        fecha: new Date().toISOString(),
                        fuente: 'BCV Oficial'
                    };
                }
            }
        } catch (bcvError) {
            console.log('❌ BCV directo falló:', bcvError.message);
        }

        // Método 3: Fallback con datos actuales aproximados
        console.log('⚠️ Usando tasas aproximadas actuales');
        return {
            dolar: 179.43,
            euro: 195.20,
            fecha: new Date().toISOString(),
            fuente: 'Aproximado'
        };

    } catch (error) {
        console.error('❌ Error general consultando tasas:', error);

        // Fallback final: datos aproximados
        return {
            dolar: 179.43,
            euro: 195.20,
            fecha: new Date().toISOString(),
            fuente: 'Offline'
        };
    }
}

// ✅ Función para usar tasa en el sistema
function usarTasaBCV() {
    const tasaBCV = document.getElementById('tasaBCV').textContent;
    
    if (tasaBCV === '--') {
        mostrarToast('❌ Primero obtén las tasas del BCV', 'warning');
        return;
    }
    
    // Usar la tasa en el campo principal
    const inputTasa = document.getElementById('tasaCambio');
    if (inputTasa) {
        const tasaLimpia = tasaBCV.replace(/\./g, '').replace(',', '.');
        inputTasa.value = tasaLimpia;
        actualizarEquivalente();
        mostrarToast('✅ Tasa del BCV aplicada al sistema', 'success');
    }
}

// ✅ Función para guardar historial de tasas
function guardarHistorialTasas(tasas) {
    const historial = JSON.parse(localStorage.getItem('historialBCV') || '[]');
    
    const nuevaEntrada = {
        fecha: new Date().toISOString(),
        dolar: tasas.dolar,
        euro: tasas.euro
    };
    
    historial.unshift(nuevaEntrada);
    
    // Mantener solo últimas 7 entradas
    if (historial.length > 7) {
        historial.pop();
    }
    
    localStorage.setItem('historialBCV', JSON.stringify(historial));
    mostrarHistorialTasas();
}

// ✅ Función para mostrar historial
function mostrarHistorialTasas() {
    const historial = JSON.parse(localStorage.getItem('historialBCV') || '[]');
    const contenedor = document.getElementById('historialTasas');
    
    if (historial.length === 0) {
        contenedor.innerHTML = '<p style="text-align: center; color: var(--text-light); font-style: italic;">No hay historial aún. Consulta algunas tasas.</p>';
        return;
    }
    
    contenedor.innerHTML = historial.map((entrada, index) => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: ${index === 0 ? 'var(--primary-bg)' : 'transparent'}; border-radius: 6px; margin-bottom: 0.25rem;">
            <span style="font-size: 0.8rem; color: var(--text-light);">${new Date(entrada.fecha).toLocaleDateString('es-ES')}</span>
            <span style="font-weight: 500;">USD: ${formatNumberVE(entrada.dolar)} | EUR: ${formatNumberVE(entrada.euro)}</span>
        </div>
    `).join('');
}

// ✅ Inicializar historial al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    mostrarHistorialTasas();
});

// ✅ Función para limpiar historial de tasas
function limpiarHistorialBCV() {
    if (!confirm('¿Estás seguro de que quieres borrar todo el historial de tasas del BCV? Esta acción no se puede deshacer.')) {
        return;
    }
    
    try {
        // Limpiar historial del localStorage
        localStorage.removeItem('historialBCV');
        
        // Actualizar interfaz
        mostrarHistorialTasas();
        
        mostrarToast('✅ Historial de tasas borrado completamente', 'success');
        
    } catch (error) {
        console.error('Error limpiando historial:', error);
        mostrarToast('❌ Error al borrar historial', 'error');
    }
}

// ✅ Función para mostrar ayuda de tasas BCV
function mostrarAyudaBCV() {
    const modal = document.getElementById('modalAyudaBCV');
    if (modal) {
        modal.style.display = 'flex';
    }
}

// ✅ Funciones para gestión de metas de ahorro
function crearMetaAhorro() {
    const nombre = document.getElementById('nombreMeta').value.trim();
    const monto = document.getElementById('montoMeta').value.trim();
    const fecha = document.getElementById('fechaMeta').value;
    
    if (!nombre || !monto || !fecha) {
        mostrarToast('❌ Completa todos los campos', 'error');
        return;
    }
    
    const montoNum = parseFloat(monto.replace(/[.,]/g, ''));
    if (isNaN(montoNum) || montoNum <= 0) {
        mostrarToast('❌ Ingresa un monto válido', 'error');
        return;
    }
    
    const fechaLimite = new Date(fecha);
    const hoy = new Date();
    if (fechaLimite <= hoy) {
        mostrarToast('❌ La fecha debe ser futura', 'error');
        return;
    }
    
    const meta = {
        id: Date.now(),
        nombre,
        montoObjetivo: montoNum,
        montoActual: 0,
        fechaLimite,
        fechaCreacion: new Date(),
        activa: true
    };
    
    const metas = JSON.parse(localStorage.getItem('metasAhorro') || '[]');
    metas.push(meta);
    localStorage.setItem('metasAhorro', JSON.stringify(metas));
    
    // Limpiar formulario
    document.getElementById('nombreMeta').value = '';
    document.getElementById('montoMeta').value = '';
    document.getElementById('fechaMeta').value = '';
    
    cargarMetasAhorro();
    actualizarProgresoGeneral();
    generarSugerenciasAhorro();
    
    mostrarToast(`✅ Meta "${nombre}" creada`, 'success');
}

function cargarMetasAhorro() {
    const contenedor = document.getElementById('listaMetasAhorro');
    const metas = JSON.parse(localStorage.getItem('metasAhorro') || '[]');
    
    if (metas.length === 0) {
        contenedor.innerHTML = '<p style="text-align: center; color: var(--text-light); font-style: italic;">No tienes metas de ahorro aún. ¡Crea tu primera meta!</p>';
        return;
    }
    
    let html = '';
    metas.forEach(meta => {
        const progreso = (meta.montoActual / meta.montoObjetivo) * 100;
        const diasRestantes = Math.ceil((meta.fechaLimite - new Date()) / (1000 * 60 * 60 * 24));
        const ahorroMensual = meta.montoObjetivo / Math.ceil((meta.fechaLimite - new Date()) / (1000 * 60 * 60 * 24 * 30));
        
        html += `
            <div style="border: 1px solid #ddd; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; background: var(--card-bg);">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.75rem;">
                    <div style="flex: 1;">
                        <h4 style="margin: 0 0 0.25rem 0; color: var(--text);">${meta.nombre}</h4>
                        <p style="margin: 0; color: var(--text-light); font-size: 0.8rem;">
                            🎯 Bs. ${formatearNumero(meta.montoActual)} / Bs. ${formatearNumero(meta.montoObjetivo)}
                        </p>
                        <p style="margin: 0; color: var(--text-light); font-size: 0.8rem;">
                            📅 ${diasRestantes} días restantes | 💰 Bs. ${formatearNumero(ahorroMensual)}/mes
                        </p>
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <button onclick="agregarProgresoMeta(${meta.id})" style="background: #10B981; color: white; border: none; border-radius: 6px; padding: 0.5rem; font-size: 0.8rem; cursor: pointer;" title="Agregar progreso">
                            ➕
                        </button>
                        <button onclick="editarMetaAhorro(${meta.id})" style="background: #ff9800; color: white; border: none; border-radius: 6px; padding: 0.5rem; font-size: 0.8rem; cursor: pointer;" title="Editar meta">
                            ✏️
                        </button>
                        <button onclick="eliminarMetaAhorro(${meta.id})" style="background: #dc2626; color: white; border: none; border-radius: 6px; padding: 0.5rem; font-size: 0.8rem; cursor: pointer;" title="Eliminar meta">
                            🗑️
                        </button>
                    </div>
                </div>
                <div style="width: 100%; height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden;">
                    <div style="height: 100%; width: ${Math.min(progreso, 100)}%; background: linear-gradient(90deg, #10B981, #059669); transition: width 0.5s ease;"></div>
                </div>
            </div>
        `;
    });
    
    contenedor.innerHTML = html;
}

function actualizarProgresoGeneral() {
    const metas = JSON.parse(localStorage.getItem('metasAhorro') || '[]');
    const activas = metas.filter(m => m.activa);
    
    if (activas.length === 0) {
        document.getElementById('barraProgresoGeneral').style.width = '0%';
        document.getElementById('textoProgresoGeneral').textContent = 'Bs. 0 / Bs. 0 (0%)';
        return;
    }
    
    const totalObjetivo = activas.reduce((sum, meta) => sum + meta.montoObjetivo, 0);
    const totalActual = activas.reduce((sum, meta) => sum + meta.montoActual, 0);
    const progreso = (totalActual / totalObjetivo) * 100;
    
    document.getElementById('barraProgresoGeneral').style.width = `${Math.min(progreso, 100)}%`;
    document.getElementById('textoProgresoGeneral').textContent = 
        `Bs. ${formatearNumero(totalActual)} / Bs. ${formatearNumero(totalObjetivo)} (${progreso.toFixed(1)}%)`;
}

function generarSugerenciasAhorro() {
    const sugerenciasContainer = document.getElementById('sugerenciasContainer');
    
    // Aquí iría la lógica para analizar gastos y generar sugerencias
    sugerenciasContainer.innerHTML = `
        <div style="margin-bottom: 0.75rem;">
            <strong>☕ Si dejas de gastar en cafés:</strong><br>
            <span style="font-size: 0.9rem;">Podrías ahorrar Bs. 2,400 en 6 meses</span>
        </div>
        <div style="margin-bottom: 0.75rem;">
            <strong>🍔 Reduce comidas fuera:</strong><br>
            <span style="font-size: 0.9rem;">Ahorra Bs. 4,800 mensuales hacia tu meta</span>
        </div>
        <div style="margin-bottom: 0.75rem;">
            <strong>💡 Optimiza suscripciones:</strong><br>
            <span style="font-size: 0.9rem;">Libera Bs. 1,200 al mes</span>
        </div>
    `;
}

function mostrarAyudaAhorro() {
    // Función para mostrar ayuda de la pestaña ahorro
    mostrarToast('💡 La pestaña de ahorro te ayuda a establecer metas y seguir tu progreso', 'info');
}

// ======================================================================================
// ✅ FUNCIONES PARA OPTIMIZACIÓN FISCAL SIMPLIFICADA
// ======================================================================================

/**
 * Clasificador automático de gastos deducibles
 * Analiza movimientos existentes para identificar gastos potencialmente deducibles
 */
function clasificarGastosDeducibles() {
    try {
        // Obtener todos los movimientos de la base de datos
        const transaction = db.transaction([STORES.MOVIMIENTOS], 'readonly');
        const store = transaction.objectStore(STORES.MOVIMIENTOS);
        const request = store.getAll();

        request.onsuccess = function(event) {
            const movimientos = event.target.result;
            const gastos = movimientos.filter(mov => mov.tipo === 'gasto');
            
            if (gastos.length === 0) {
                mostrarToast('❌ No hay gastos registrados para analizar', 'danger');
                return;
            }

            // Reglas de clasificación fiscal
            const reglasFiscales = {
                'educacion': {
                    palabras: ['universidad', 'colegio', 'escuela', 'curso', 'diploma', 'maestria', 'doctorado', 'libro', 'material educativo', 'matricula'],
                    porcentaje: 100,
                    descripcion: 'Gastos educativos y de formación'
                },
                'salud': {
                    palabras: ['medico', 'medicina', 'farmacia', 'hospital', 'clinica', 'consulta', 'examen', 'laboratorio', 'dentista', 'optica', 'terapia'],
                    porcentaje: 100,
                    descripcion: 'Gastos médicos y de salud'
                },
                'vivienda': {
                    palabras: ['alquiler', 'hipoteca', 'luz', 'agua', 'gas', 'telefono', 'internet', 'mantenimiento', 'reparacion hogar'],
                    porcentaje: 80,
                    descripcion: 'Gastos de vivienda y servicios básicos'
                },
                'transporte': {
                    palabras: ['transporte', 'gasolina', 'metro', 'bus', 'taxi', 'uber', 'mantenimiento vehiculo', 'seguro auto'],
                    porcentaje: 70,
                    descripcion: 'Gastos de transporte y movilidad'
                },
                'donaciones': {
                    palabras: ['donacion', 'caridad', 'ayuda', 'beneficencia', 'iglesia', 'fundacion'],
                    porcentaje: 100,
                    descripcion: 'Donaciones y obras de caridad'
                }
            };

            // Clasificar gastos
            const gastosClasificados = [];
            let totalDeducible = 0;

            gastos.forEach(gasto => {
                const concepto = gasto.concepto.toLowerCase();
                let clasificacion = null;
                let porcentajeMaximo = 0;

                // Buscar coincidencias con reglas fiscales
                Object.keys(reglasFiscales).forEach(categoria => {
                    const regla = reglasFiscales[categoria];
                    const tieneCoincidencia = regla.palabras.some(palabra => 
                        concepto.includes(palabra.toLowerCase())
                    );
                    
                    if (tieneCoincidencia && regla.porcentaje > porcentajeMaximo) {
                        porcentajeMaximo = regla.porcentaje;
                        clasificacion = {
                            categoria: categoria,
                            descripcion: regla.descripcion,
                            porcentaje: regla.porcentaje,
                            monto: gasto.cantidad,
                            concepto: gasto.concepto
                        };
                    }
                });

                if (clasificacion) {
                    gastosClasificados.push(clasificacion);
                    totalDeducible += (gasto.cantidad * clasificacion.porcentaje / 100);
                }
            });

            // Mostrar resultados
            mostrarResultadosClasificacion(gastosClasificados, totalDeducible, gastos.length);

        };

        request.onerror = function() {
            mostrarToast('❌ Error al acceder a los movimientos', 'danger');
        };

    } catch (error) {
        mostrarToast('❌ Error al clasificar gastos: ' + error.message, 'danger');
    }
}

/**
 * Mostrar resultados de clasificación fiscal
 */
function mostrarResultadosClasificacion(gastosClasificados, totalDeducible, totalGastos) {
    const resultadoDiv = document.getElementById('resultadoClasificacion');
    const resumenDiv = document.getElementById('resumenDeducibles');
    
    if (gastosClasificados.length === 0) {
        resumenDiv.innerHTML = `
            <p>❌ No se encontraron gastos potencialmente deducibles.</p>
            <p>Analizados: ${totalGastos} gastos</p>
        `;
    } else {
        const ahorroEstimado = totalDeducible * 0.34; // Asumiendo tasa del 34%
        
        resumenDiv.innerHTML = `
            <p>✅ <strong>${gastosClasificados.length}</strong> gastos potencialmente deducibles encontrados</p>
            <p>💰 <strong>Monto total deducible:</strong> Bs. ${formatNumberVE(totalDeducible)}</p>
            <p>🎯 <strong>Ahorro fiscal estimado:</strong> Bs. ${formatNumberVE(ahorroEstimado)}</p>
            <p>📊 <strong>Eficiencia fiscal:</strong> ${Math.round((gastosClasificados.length / totalGastos) * 100)}%</p>
        `;

        // Agregar detalles de cada gasto clasificado
        let detallesHTML = '<div style="margin-top: 1rem; max-height: 200px; overflow-y: auto;">';
        gastosClasificados.forEach(gasto => {
            detallesHTML += `
                <div style="background: rgba(16, 185, 129, 0.1); padding: 0.5rem; margin-bottom: 0.5rem; border-radius: 6px; border-left: 3px solid #10B981;">
                    <strong>${gasto.concepto}</strong><br>
                    <small>🏷️ ${gasto.descripcion} | 💰 Bs. ${formatNumberVE(gasto.monto)} | 📈 ${gasto.porcentaje}% deducible</small>
                </div>
            `;
        });
        detallesHTML += '</div>';
        resumenDiv.innerHTML += detallesHTML;
    }
    
    resultadoDiv.style.display = 'block';
}

/**
 * Simulador de escenarios fiscales
 */
function simularEscenarioFiscal() {
    const ingresosProyectados = parseNumberVE(document.getElementById('ingresosProyectados').value);
    const gastosDeduciblesProyectados = parseNumberVE(document.getElementById('gastosDeduciblesProyectados').value);
    
    if (isNaN(ingresosProyectados) || ingresosProyectados <= 0) {
        mostrarToast('❌ Ingresa ingresos anuales válidos', 'danger');
        return;
    }
    
    if (isNaN(gastosDeduciblesProyectados) || gastosDeduciblesProyectados < 0) {
        mostrarToast('❌ Ingresa gastos deducibles válidos', 'danger');
        return;
    }

    // Escenarios fiscales (tasas progresivas aproximadas)
    const escenarios = [
        {
            nombre: 'Conservador',
            tasa: 0.32,
            descripcion: 'Con deducciones mínimas aplicadas'
        },
        {
            nombre: 'Realista', 
            tasa: 0.28,
            descripcion: 'Con deducciones estándar aplicadas'
        },
        {
            nombre: 'Optimizado',
            tasa: 0.24,
            descripcion: 'Con máximas deducciones fiscales aplicadas'
        }
    ];

    // Calcular resultados para cada escenario
    const resultados = escenarios.map(escenario => {
        const baseImponible = ingresosProyectados - gastosDeduciblesProyectados;
        const impuestoEstimado = Math.max(0, baseImponible * escenario.tasa);
        const ahorroFiscal = (ingresosProyectados * 0.34) - impuestoEstimado; // Comparado con tasa máxima
        
        return {
            ...escenario,
            baseImponible: baseImponible,
            impuestoEstimado: impuestoEstimado,
            ahorroFiscal: ahorroFiscal
        };
    });

    mostrarResultadosSimulacion(resultados);
}

/**
 * Mostrar resultados de simulación fiscal
 */
function mostrarResultadosSimulacion(resultados) {
    const resultadoDiv = document.getElementById('resultadoSimulacion');
    const detalleDiv = document.getElementById('detalleSimulacion');
    
    let html = '<div style="margin-bottom: 1rem;">';
    html += '<p><strong>📊 Comparación de Escenarios Fiscales</strong></p>';
    html += '</div>';
    
    html += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">';
    
    resultados.forEach(resultado => {
        const ahorroColor = resultado.ahorroFiscal > 0 ? '#10B981' : '#EF4444';
        html += `
            <div style="background: rgba(59, 130, 246, 0.05); padding: 1rem; border-radius: 8px; border-left: 4px solid #3B82F6;">
                <h4 style="margin: 0 0 0.5rem 0; color: #3B82F6;">${resultado.nombre}</h4>
                <p style="font-size: 0.8rem; color: var(--text-light); margin-bottom: 0.5rem;">${resultado.descripcion}</p>
                <p><strong>Base imponible:</strong> Bs. ${formatNumberVE(resultado.baseImponible)}</p>
                <p><strong>Impuesto estimado:</strong> Bs. ${formatNumberVE(resultado.impuestoEstimado)}</p>
                <p style="color: ${ahorroColor};"><strong>Ahorro fiscal:</strong> Bs. ${formatNumberVE(resultado.ahorroFiscal)}</p>
            </div>
        `;
    });
    
    html += '</div>';
    
    detalleDiv.innerHTML = html;
    resultadoDiv.style.display = 'block';
}

/**
 * Proyección de impuesto anual
 */
function proyectarImpuestoAnual() {
    try {
        const transaction = db.transaction([STORES.MOVIMIENTOS], 'readonly');
        const store = transaction.objectStore(STORES.MOVIMIENTOS);
        const request = store.getAll();

        request.onsuccess = function(event) {
            const movimientos = event.target.result;
            const ingresos = movimientos.filter(mov => mov.tipo === 'ingreso');
            const gastos = movimientos.filter(mov => mov.tipo === 'gasto');
            
            if (ingresos.length === 0) {
                mostrarToast('❌ Necesitas ingresos registrados para hacer proyecciones', 'danger');
                return;
            }

            // Calcular proyecciones basadas en datos actuales
            const mesesConDatos = calcularMesesConDatos(movimientos);
            const proyeccionAnual = calcularProyeccionAnual(ingresos, gastos, mesesConDatos);
            
            mostrarResultadosProyeccion(proyeccionAnual);
        };

    } catch (error) {
        mostrarToast('❌ Error al proyectar impuestos: ' + error.message, 'danger');
    }
}

/**
 * Calcular meses con datos para proyección
 */
function calcularMesesConDatos(movimientos) {
    const meses = new Set();
    movimientos.forEach(mov => {
        const fecha = new Date(mov.fecha);
        meses.add(fecha.getMonth());
    });
    return meses.size;
}

/**
 * Calcular proyección anual basada en tendencias
 */
function calcularProyeccionAnual(ingresos, gastos, mesesConDatos) {
    const ingresosMensuales = ingresos.reduce((sum, ing) => sum + ing.cantidad, 0) / mesesConDatos;
    const gastosMensuales = gastos.reduce((sum, gas) => sum + gas.cantidad, 0) / mesesConDatos;
    
    const ingresosAnualesProyectados = ingresosMensuales * 12;
    const gastosAnualesProyectados = gastosMensuales * 12;
    const utilidadBrutaProyectada = ingresosAnualesProyectados - gastosAnualesProyectados;
    
    // Estimar gastos deducibles (30% promedio)
    const gastosDeduciblesProyectados = gastosAnualesProyectados * 0.3;
    const baseImponibleProyectada = utilidadBrutaProyectada - gastosDeduciblesProyectados;
    
    // Aplicar tasa fiscal progresiva aproximada
    let impuestoProyectado = 0;
    if (baseImponibleProyectada > 0) {
        if (baseImponibleProyectada <= 100000) {
            impuestoProyectado = baseImponibleProyectada * 0.15;
        } else if (baseImponibleProyectada <= 300000) {
            impuestoProyectado = 15000 + ((baseImponibleProyectada - 100000) * 0.25);
        } else {
            impuestoProyectado = 65000 + ((baseImponibleProyectada - 300000) * 0.34);
        }
    }

    return {
        ingresosAnuales: ingresosAnualesProyectados,
        gastosAnuales: gastosAnualesProyectados,
        utilidadBruta: utilidadBrutaProyectada,
        gastosDeducibles: gastosDeduciblesProyectados,
        baseImponible: baseImponibleProyectada,
        impuestoProyectado: impuestoProyectado,
        mesesBase: mesesConDatos
    };
}

/**
 * Mostrar resultados de proyección anual
 */
function mostrarResultadosProyeccion(proyeccion) {
    const resultadoDiv = document.getElementById('resultadoProyeccion');
    const detalleDiv = document.getElementById('detalleProyeccion');
    
    const html = `
        <div style="margin-bottom: 1rem;">
            <p><strong>📊 Proyección Anual basada en ${proyeccion.mesesBase} meses de datos</strong></p>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
            <div style="text-align: center;">
                <div style="font-size: 1.5rem; color: #10B981;">💰</div>
                <p style="font-size: 0.8rem; color: var(--text-light);">Ingresos Anuales</p>
                <p style="font-size: 1.1rem; font-weight: bold;">Bs. ${formatNumberVE(proyeccion.ingresosAnuales)}</p>
            </div>
            <div style="text-align: center;">
                <div style="font-size: 1.5rem; color: #EF4444;">💸</div>
                <p style="font-size: 0.8rem; color: var(--text-light);">Gastos Anuales</p>
                <p style="font-size: 1.1rem; font-weight: bold;">Bs. ${formatNumberVE(proyeccion.gastosAnuales)}</p>
            </div>
            <div style="text-align: center;">
                <div style="font-size: 1.5rem; color: #3B82F6;">📈</div>
                <p style="font-size: 0.8rem; color: var(--text-light);">Utilidad Bruta</p>
                <p style="font-size: 1.1rem; font-weight: bold;">Bs. ${formatNumberVE(proyeccion.utilidadBruta)}</p>
            </div>
            <div style="text-align: center;">
                <div style="font-size: 1.5rem; color: #8B5CF6;">🎯</div>
                <p style="font-size: 0.8rem; color: var(--text-light);">Impuesto Estimado</p>
                <p style="font-size: 1.1rem; font-weight: bold; color: #F59E0B;">Bs. ${formatNumberVE(proyeccion.impuestoProyectado)}</p>
            </div>
        </div>
        
        <div style="background: rgba(245, 158, 11, 0.1); padding: 1rem; border-radius: 8px; margin-top: 1rem;">
            <h4 style="margin: 0 0 0.5rem 0; color: #F59E0B;">📋 Detalle de Cálculo</h4>
            <p style="font-size: 0.9rem; margin-bottom: 0.25rem;">• Base imponible proyectada: Bs. ${formatNumberVE(proyeccion.baseImponible)}</p>
            <p style="font-size: 0.9rem; margin-bottom: 0.25rem;">• Gastos deducibles estimados: Bs. ${formatNumberVE(proyeccion.gastosDeducibles)}</p>
            <p style="font-size: 0.9rem;">• Tasa fiscal aplicada: ${proyeccion.impuestoProyectado > 0 ? 'Progresiva (15-34%)' : 'Sin impuesto (pérdidas)'}</p>
        </div>
    `;
    
    detalleDiv.innerHTML = html;
    resultadoDiv.style.display = 'block';
}

/**
 * Optimización de deducciones fiscales
 */
function optimizarDeducciones() {
    try {
        const transaction = db.transaction([STORES.MOVIMIENTOS], 'readonly');
        const store = transaction.objectStore(STORES.MOVIMIENTOS);
        const request = store.getAll();

        request.onsuccess = function(event) {
            const movimientos = event.target.result;
            const gastos = movimientos.filter(mov => mov.tipo === 'gasto');
            
            if (gastos.length === 0) {
                mostrarToast('❌ No hay gastos para optimizar', 'danger');
                return;
            }

            // Analizar oportunidades de optimización
            const oportunidades = analizarOportunidadesDeduccion(gastos);
            mostrarOportunidadesOptimizacion(oportunidades);
        };

    } catch (error) {
        mostrarToast('❌ Error al optimizar deducciones: ' + error.message, 'danger');
    }
}

/**
 * Analizar oportunidades de deducción
 */
function analizarOportunidadesDeduccion(gastos) {
    const oportunidades = [];
    
    // Categorías con mayor potencial deductivo
    const categoriasOptimizacion = {
        'educacion': { prioridad: 'alta', beneficio: 100, sugerencia: 'Documentar todos los gastos educativos' },
        'salud': { prioridad: 'alta', beneficio: 100, sugerencia: 'Guardar recibos de consultas médicas' },
        'vivienda': { prioridad: 'media', beneficio: 80, sugerencia: 'Registrar gastos de mantenimiento del hogar' },
        'donaciones': { prioridad: 'alta', beneficio: 100, sugerencia: 'Documentar todas las donaciones caritativas' },
        'profesional': { prioridad: 'media', beneficio: 70, sugerencia: 'Registrar gastos de herramientas de trabajo' }
    };

    // Analizar gastos actuales vs potencial
    Object.keys(categoriasOptimizacion).forEach(categoria => {
        const categoriaInfo = categoriasOptimizacion[categoria];
        const gastosCategoria = gastos.filter(gasto => 
            gasto.concepto.toLowerCase().includes(categoria) ||
            gasto.categoria?.toLowerCase().includes(categoria)
        );
        
        const gastosNoDeducibles = gastos.filter(gasto => {
            const concepto = gasto.concepto.toLowerCase();
            return !Object.values(categoriasOptimizacion).some(cat => 
                cat.palabras?.some(palabra => concepto.includes(palabra))
            );
        });

        if (gastosCategoria.length > 0 || categoria === 'profesional') {
            oportunidades.push({
                categoria: categoria,
                prioridad: categoriaInfo.prioridad,
                beneficio: categoriaInfo.beneficio,
                gastosActuales: gastosCategoria.length,
                montoTotal: gastosCategoria.reduce((sum, g) => sum + g.cantidad, 0),
                sugerencia: categoriaInfo.sugerencia,
                potencial: calcularPotencialOptimizacion(categoria, gastosCategoria)
            });
        }
    });

    return oportunidades.sort((a, b) => {
        const prioridades = { 'alta': 3, 'media': 2, 'baja': 1 };
        return prioridades[b.prioridad] - prioridades[a.prioridad];
    });
}

/**
 * Calcular potencial de optimización
 */
function calcularPotencialOptimizacion(categoria, gastosCategoria) {
    if (gastosCategoria.length === 0) return 0;
    
    const montoTotal = gastosCategoria.reduce((sum, g) => sum + g.cantidad, 0);
    const beneficioFiscal = montoTotal * 0.34; // Tasa promedio
    
    return beneficioFiscal;
}

/**
 * Mostrar oportunidades de optimización
 */
function mostrarOportunidadesOptimizacion(oportunidades) {
    const resultadoDiv = document.getElementById('resultadoOptimizacion');
    const detalleDiv = document.getElementById('detalleOptimizacion');
    
    if (oportunidades.length === 0) {
        detalleDiv.innerHTML = '<p>❌ No se encontraron oportunidades de optimización.</p>';
    } else {
        let html = '<div style="margin-bottom: 1rem;">';
        html += `<p><strong>💡 ${oportunidades.length} oportunidades de optimización encontradas</strong></p>`;
        html += '</div>';
        
        html += '<div style="space-y: 1rem;">';
        
        oportunidades.forEach(oportunidad => {
            const prioridadColor = {
                'alta': '#EF4444',
                'media': '#F59E0B', 
                'baja': '#10B981'
            };
            
            html += `
                <div style="background: rgba(139, 92, 246, 0.05); padding: 1rem; border-radius: 8px; border-left: 4px solid #8B5CF6;">
                    <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 0.5rem;">
                        <h4 style="margin: 0; color: #8B5CF6;">${tituloCategoria(optunidad.categoria)}</h4>
                        <span style="background: ${prioridadColor[oportunidad.prioridad]}; color: white; padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.8rem;">
                            ${oportunidad.prioridad.toUpperCase()}
                        </span>
                    </div>
                    <p style="font-size: 0.9rem; color: var(--text-light); margin-bottom: 0.5rem;">${oportunidad.sugerencia}</p>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; font-size: 0.9rem;">
                        <p><strong>Gastos actuales:</strong> ${oportunidad.gastosActuales}</p>
                        <p><strong>Beneficio potencial:</strong> Bs. ${formatNumberVE(oportunidad.potencial)}</p>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
    }
    
    detalleDiv.innerHTML = html;
    resultadoDiv.style.display = 'block';
}

/**
 * Convertir nombre de categoría a título legible
 */
function tituloCategoria(categoria) {
    const titulos = {
        'educacion': '📚 Educación y Formación',
        'salud': '🏥 Salud y Medicina',
        'vivienda': '🏠 Vivienda y Servicios',
        'donaciones': '🤝 Donaciones',
        'profesional': '💼 Desarrollo Profesional'
    };
    return titulos[categoria] || categoria;
}

/**
 * Generar recomendaciones de timing de gastos
 */
function generarRecomendacionesTiming() {
    try {
        const transaction = db.transaction([STORES.MOVIMIENTOS], 'readonly');
        const store = transaction.objectStore(STORES.MOVIMIENTOS);
        const request = store.getAll();

        request.onsuccess = function(event) {
            const movimientos = event.target.result;
            const gastos = movimientos.filter(mov => mov.tipo === 'gasto');
            
            if (gastos.length === 0) {
                mostrarToast('❌ No hay gastos para analizar timing', 'danger');
                return;
            }

            // Analizar patrones de gastos por mes
            const gastosPorMes = analizarGastosPorMes(gastos);
            const recomendaciones = generarRecomendacionesBasadasEnPatrones(gastosPorMes);
            
            mostrarRecomendacionesTiming(recomendaciones);
        };

    } catch (error) {
        mostrarToast('❌ Error al generar recomendaciones: ' + error.message, 'danger');
    }
}

/**
 * Analizar gastos por mes
 */
function analizarGastosPorMes(gastos) {
    const gastosPorMes = {};
    
    gastos.forEach(gasto => {
        const fecha = new Date(gasto.fecha);
        const mes = fecha.getMonth();
        
        if (!gastosPorMes[mes]) {
            gastosPorMes[mes] = [];
        }
        gastosPorMes[mes].push(gasto);
    });
    
    return gastosPorMes;
}

/**
 * Generar recomendaciones basadas en patrones
 */
function generarRecomendacionesBasadasEnPatrones(gastosPorMes) {
    const recomendaciones = [];
    const meses = Object.keys(gastosPorMes);
    
    if (meses.length < 2) {
        recomendaciones.push({
            tipo: 'general',
            titulo: '📊 Datos Insuficientes',
            descripcion: 'Necesitas más meses de datos para generar recomendaciones precisas de timing.',
            prioridad: 'media'
        });
        return recomendaciones;
    }
    
    // Encontrar meses con menos gastos (mejores para gastos deducibles)
    const gastosPorMesOrdenados = meses.map(mes => ({
        mes: mes,
        cantidad: gastosPorMes[mes].length,
        monto: gastosPorMes[mes].reduce((sum, g) => sum + g.cantidad, 0)
    })).sort((a, b) => a.cantidad - b.cantidad);
    
    const mesesBajosGastos = gastosPorMesOrdenados.slice(0, 2);
    const mesesAltosGastos = gastosPorMesOrdenados.slice(-2);
    
    // Recomendaciones específicas
    recomendaciones.push({
        tipo: 'timing',
        titulo: '⏰ Timing Óptimo para Gastos Deducibles',
        descripcion: `Los meses con menor actividad (${mesesBajosGastos.map(m => nombreMes(m.mes)).join(' y ')}) son ideales para realizar gastos educativos, médicos o de donación.`,
        prioridad: 'alta'
    });
    
    recomendaciones.push({
        tipo: 'planificacion',
        titulo: '📅 Planificación Anual',
        descripcion: 'Considera concentrar gastos deducibles en el primer trimestre para maximizar beneficios fiscales en la declaración anual.',
        prioridad: 'alta'
    });
    
    return recomendaciones;
}

/**
 * Mostrar recomendaciones de timing
 */
function mostrarRecomendacionesTiming(recomendaciones) {
    const resultadoDiv = document.getElementById('resultadoTiming');
    const detalleDiv = document.getElementById('detalleTiming');
    
    let html = '<div style="margin-bottom: 1rem;">';
    html += '<p><strong>⏰ Recomendaciones de Timing Fiscal</strong></p>';
    html += '</div>';
    
    html += '<div style="space-y: 1rem;">';
    
    recomendaciones.forEach(recomendacion => {
        const tipoIcon = recomendacion.tipo === 'timing' ? '⏰' : '📅';
        html += `
            <div style="background: rgba(16, 185, 129, 0.05); padding: 1rem; border-radius: 8px; border-left: 4px solid #10B981;">
                <h4 style="margin: 0 0 0.5rem 0; color: #10B981;">${tipoIcon} ${recomendacion.titulo}</h4>
                <p style="font-size: 0.9rem; color: var(--text-light);">${recomendacion.descripcion}</p>
            </div>
        `;
    });
    
    html += '</div>';
    
    detalleDiv.innerHTML = html;
    resultadoDiv.style.display = 'block';
}

/**
 * Convertir número de mes a nombre
 */
function nombreMes(numeroMes) {
    const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses[numeroMes] || 'Mes desconocido';
}

/**
 * Función de ayuda para la pestaña de optimización fiscal
 */
function mostrarAyudaOptimizacionFiscal() {
    mostrarToast('💡 La optimización fiscal te ayuda a maximizar beneficios fiscales legales', 'info');
}

// ======================================================================================
// FIN DE FUNCIONES PARA OPTIMIZACIÓN FISCAL SIMPLIFICADA
// ======================================================================================

// =============================================================
// 💰 FUNCIONALIDAD: PRESUPUESTO SUGERIDO
// =============================================================

// Cargar categorías disponibles en un <select multiple>
async function cargarCategoriasPresupuesto() {
    const categorias = await getAllEntries(STORES.CATEGORIAS);
    const select = document.getElementById('selectCategoriasPresupuesto');
    if (!select) return;

    select.innerHTML = ''; // Limpia las opciones previas
    categorias.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
    
    categorias.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.nombre;
        opt.textContent = cat.nombre;
        select.appendChild(opt);
    });
}

const REGISTROS_POR_PAGINA = 5;
let paginaHistorial = 1;


// ============================================
// 💰 PRESUPUESTO SUGERIDO — Corrección: rango hasta HOY e inclusivo
// ============================================
async function calcularPresupuestoSugerido() {
    const presupuestoInput = document.getElementById('presupuestoInicial');
    const porcentajeInput = document.getElementById('porcentajeExtra');
    const valorPresupuesto = parseNumberVE(presupuestoInput.value);
    const porcentajeExtra = parseFloat(porcentajeInput.value) || 0;

    if (isNaN(valorPresupuesto) || valorPresupuesto <= 0) {
        mostrarToast('Por favor, ingresa un presupuesto inicial válido.', 'danger');
        return;
    }

    const select = document.getElementById('selectCategoriasPresupuesto');
    const seleccionadas = Array.from(select.selectedOptions).map(opt => opt.value);
    if (seleccionadas.length === 0) {
        mostrarToast('Selecciona al menos una categoría para calcular.', 'danger');
        return;
    }

    const movimientos = await getAllEntries(STORES.MOVIMIENTOS);
    const gastosSeleccionados = movimientos.filter(m =>
        m.tipo === 'gasto' && seleccionadas.includes(m.categoria)
    );

    if (gastosSeleccionados.length === 0) {
        mostrarToast('No hay gastos registrados en las categorías seleccionadas.', 'info');
        return;
    }

    // Fechas: inicio = primera fecha de gasto; fin = HOY (según tu requerimiento)
    const fechas = gastosSeleccionados.map(m => new Date(m.fecha));
    const fechaInicio = new Date(Math.min(...fechas));
    const fechaFin = new Date(); // ← usar la fecha actual (hoy)
    
    // Normalizar horas para evitar fracciones por huso hora
    fechaInicio.setHours(0,0,0,0);
    fechaFin.setHours(0,0,0,0);

    const msPorDia = 1000 * 60 * 60 * 24;
    // +1 para contar inclusivamente desde fechaInicio hasta fechaFin
    let totalDias = Math.ceil((fechaFin - fechaInicio) / msPorDia) + 1;
    if (isNaN(totalDias) || totalDias < 1) totalDias = 1;

    // Total de gastos
    const totalGastos = gastosSeleccionados.reduce((s, m) => s + m.cantidad, 0);

    // Promedio diario y mensual proyectado a 30 días
    const promedioDiario = totalGastos / totalDias;
    const promedioMensual = promedioDiario * 30;

    // Porcentaje adicional aplicado
    const montoExtra = (promedioMensual * porcentajeExtra) / 100;
    const presupuestoSugerido = promedioMensual + montoExtra;

    // Restante respecto al presupuesto inicial
    const restante = valorPresupuesto - presupuestoSugerido;

    // Mostrar resultados (formateados)
    const resultado = document.getElementById('resultadoPresupuesto');
    if (resultado) {
        resultado.innerHTML = `
            <p><strong>Período analizado:</strong> ${fechaInicio.toLocaleDateString('es-VE')} → ${fechaFin.toLocaleDateString('es-VE')}</p>
            <p><strong>Total de días (inclusivo):</strong> ${totalDias} días</p>
            <p><strong>Total de gastos:</strong> Bs. ${formatNumberVE(totalGastos)}</p>
            <p><strong>Promedio diario:</strong> Bs. ${formatNumberVE(promedioDiario)}</p>
            <p><strong>Promedio mensual proyectado (30d):</strong> Bs. ${formatNumberVE(promedioMensual)}</p>
            <p><strong>Porcentaje adicional:</strong> ${porcentajeExtra}% (Bs. ${formatNumberVE(montoExtra)})</p>
            <p><strong>Presupuesto sugerido final:</strong> Bs. ${formatNumberVE(presupuestoSugerido)}</p>
            <p><strong>Presupuesto inicial:</strong> Bs. ${formatNumberVE(valorPresupuesto)}</p>
            <p><strong>Restante disponible:</strong> Bs. ${formatNumberVE(restante)}</p>
            <p style="margin-top:1rem; color:${restante > 0 ? 'var(--success)' : 'var(--danger)'};">
              ${restante > 0 ? '✅ Tienes margen para otros gastos o ahorro.' : '⚠️ El presupuesto no cubre tus gastos promedio.'}
            </p>
        `;
    }

    // === 💡 BARRA DE PROGRESO DEL PRESUPUESTO ===
const contenedorBarra = document.getElementById('barraPresupuestoContainer');
if (contenedorBarra) {
    const porcentajeUsado = (presupuestoSugerido / valorPresupuesto) * 100;
    const porcentajeTexto = porcentajeUsado.toFixed(1);
    
    // Determinar color según el nivel de gasto
    let color = '#4caf50'; // verde
    if (porcentajeUsado >= 80 && porcentajeUsado < 100) color = '#ffc107'; // amarillo
    if (porcentajeUsado >= 100) color = '#f44336'; // rojo

    contenedorBarra.innerHTML = `
        <div class="barra-presupuesto">
            <div class="barra-uso" style="width:${Math.min(porcentajeUsado, 100)}%; background-color:${color};"></div>
        </div>
        <div class="barra-label">Presupuesto usado: ${porcentajeTexto}%</div>
    `;
}


    // ✅ Guardar datos con estructura normalizada
const datosNormalizados = {
    version: '2.0', // opcional, para referencia futura
    fecha: new Date().toISOString(),
    categorias: Array.isArray(seleccionadas) ? seleccionadas : [],
    fechaInicio: fechaInicio.toISOString(),
    fechaFin: fechaFin.toISOString(),
    totalDias: Number(totalDias) || 0,
    totalGastos: Number(totalGastos) || 0,
    promedioDiario: Number(promedioDiario) || 0,
    promedioMensual: Number(promedioMensual) || 0,
    porcentajeExtra: Number(porcentajeExtra) || 0,
    montoExtra: Number(montoExtra) || 0,
    presupuestoSugerido: Number(presupuestoSugerido) || 0,
    presupuestoInicial: Number(valorPresupuesto) || 0,
    restante: Number(restante) || 0
};

localStorage.setItem('presupuestoSugeridoActual', JSON.stringify(datosNormalizados));
mostrarToast('💾 Presupuesto sugerido calculado correctamente.', 'success');
mostrarHistorialPresupuestos();

}


// ✅ Cargar configuración guardada al abrir la pestaña
// ✅ Restaurar cálculo guardado y reconstruir la UI completa (incluye barra)
function cargarPresupuestoSugeridoGuardado() {
    const guardadoRaw = localStorage.getItem('presupuestoSugeridoActual');
    if (!guardadoRaw) return;

    let datos;
    try {
        datos = JSON.parse(guardadoRaw);
    } catch (e) {
        console.error('Error parseando presupuestoSugeridoActual:', e);
        return;
    }

    // Aceptar varias formas de los datos (compatibilidad hacia atrás)
    // Campos esperados posibles:
    // - presupuestoInicial o presupuestoInicial (nombres usados antes/ahora)
    // - totalGastos o totalGastos
    // - promedioGastos OR promedioMensual / promedioDiario
    // - porcentajeExtra, montoExtra, presupuestoSugerido, restante, fechaInicio/fechaFin (ISO)
    const presupuestoInicial = (datos.presupuestoInicial ?? datos.presupuestoBase ?? datos.presupuesto) || 0;
    const totalGastos = datos.totalGastos ?? datos.total_gastos ?? 0;
    const promedioDiario = datos.promedioDiario ?? datos.promedio_diario ?? null;
    const promedioMensual = datos.promedioMensual ?? datos.promedio_mensual ?? datos.promedioMensual ?? null;
    const porcentajeExtra = datos.porcentajeExtra ?? datos.porcentaje ?? 0;
    const montoExtra = datos.montoExtra ?? datos.extra ?? 0;
    const presupuestoSugerido = datos.presupuestoSugerido ?? datos.sugerido ?? 0;
    const restante = datos.restante ?? (presupuestoInicial - presupuestoSugerido);
    const fechaInicioISO = datos.fechaInicio ?? datos.fecha_inicio ?? datos.fechaDesde ?? null;
    const fechaFinISO = datos.fechaFin ?? datos.fecha_fin ?? datos.fechaHasta ?? null;
    const totalDias = datos.totalDias ?? datos.dias ?? null;

    // Restaurar inputs (si existen)
    const inputPresupuesto = document.getElementById('presupuestoInicial');
    if (inputPresupuesto) {
        inputPresupuesto.value = formatNumberVE(Number(presupuestoInicial) || 0);
    }
    const inputPorcentaje = document.getElementById('porcentajeExtra');
    if (inputPorcentaje) {
        inputPorcentaje.value = porcentajeExtra ?? inputPorcentaje.value ?? 0;
    }

    // Restaurar selección de categorías (si existen)
    const select = document.getElementById('selectCategoriasPresupuesto');
    if (select && Array.isArray(datos.categorias)) {
        Array.from(select.options).forEach(opt => {
            opt.selected = datos.categorias.includes(opt.value);
        });
    }

    // Normalizar fechas si vienen en ISO
    let fechaInicioText = '';
    let fechaFinText = '';
    if (fechaInicioISO) {
        try {
            const d = new Date(fechaInicioISO);
            if (!isNaN(d)) fechaInicioText = d.toLocaleDateString('es-VE');
        } catch (e) { /* ignore */ }
    }
    if (fechaFinISO) {
        try {
            const d2 = new Date(fechaFinISO);
            if (!isNaN(d2)) fechaFinText = d2.toLocaleDateString('es-VE');
        } catch (e) { /* ignore */ }
    }

    // Si no viene fechaFin en los datos, asumimos hoy
    if (!fechaFinText) {
        fechaFinText = new Date().toLocaleDateString('es-VE');
    }

    // Decidir qué promedio mostrar: preferir promedio diario + mensual si están disponibles
    let promedioDiarioShow = promedioDiario;
    let promedioMensualShow = promedioMensual;
    if (!promedioMensualShow && promedioDiarioShow) promedioMensualShow = promedioDiarioShow * 30;
    if (!promedioDiarioShow && promedioMensualShow) promedioDiarioShow = promedioMensualShow / 30;

    // Renderizar el bloque de resultado completo
    const resultado = document.getElementById('resultadoPresupuesto');
    if (resultado) {
        resultado.innerHTML = `
            ${fechaInicioText ? `<p><strong>Período analizado:</strong> ${fechaInicioText} → ${fechaFinText}</p>` : ''}
            ${totalDias ? `<p><strong>Total de días (inclusivo):</strong> ${totalDias} días</p>` : ''}
            <p><strong>Total de gastos:</strong> Bs. ${formatNumberVE(Number(totalGastos) || 0)}</p>
            ${promedioDiarioShow !== null ? `<p><strong>Promedio diario:</strong> Bs. ${formatNumberVE(promedioDiarioShow)}</p>` : ''}
            ${promedioMensualShow !== null ? `<p><strong>Promedio mensual proyectado (30d):</strong> Bs. ${formatNumberVE(promedioMensualShow)}</p>` : ''}
            <p><strong>Porcentaje adicional:</strong> ${porcentajeExtra}% (Bs. ${formatNumberVE(Number(montoExtra) || 0)})</p>
            <p><strong>Presupuesto sugerido final:</strong> Bs. ${formatNumberVE(Number(presupuestoSugerido) || 0)}</p>
            <p><strong>Presupuesto inicial:</strong> Bs. ${formatNumberVE(Number(presupuestoInicial) || 0)}</p>
            <p><strong>Restante disponible:</strong> Bs. ${formatNumberVE(Number(restante) || 0)}</p>
        `;
    }

    // Volver a dibujar la barra de progreso usando la misma lógica que en el cálculo
    renderizarBarraPresupuesto(Number(presupuestoSugerido) || 0, Number(presupuestoInicial) || 0);

    // Actualizar historial UI por si no está cargado
    mostrarHistorialPresupuestos();
}

// ✅ Helper para dibujar la barra de progreso (reempleza la lógica embebida)
function renderizarBarraPresupuesto(presupuestoSugerido, presupuestoInicial) {
    const contenedorBarra = document.getElementById('barraPresupuestoContainer');
    if (!contenedorBarra) return;

    // Evitar división por cero
    const valorInicial = (typeof presupuestoInicial === 'number' && !isNaN(presupuestoInicial) && presupuestoInicial > 0)
        ? presupuestoInicial
        : 1;

    const porcentajeUsado = (presupuestoSugerido / valorInicial) * 100;
    const porcentajeTexto = isFinite(porcentajeUsado) ? porcentajeUsado.toFixed(1) : '0.0';

    let color = '#4caf50'; // verde
    if (porcentajeUsado >= 80 && porcentajeUsado < 100) color = '#ffc107'; // amarillo
    if (porcentajeUsado >= 100) color = '#f44336'; // rojo

    contenedorBarra.innerHTML = `
        <div class="barra-presupuesto">
            <div class="barra-uso" style="width:${Math.min(Math.max(porcentajeUsado, 0), 100)}%; background-color:${color};"></div>
        </div>
        <div class="barra-label">Presupuesto usado: ${porcentajeTexto}%</div>
    `;
}


// ✅ Guardar actual en historial
function guardarPresupuestoEnHistorial() {
    const guardado = localStorage.getItem('presupuestoSugeridoActual');
    if (!guardado) {
        mostrarToast('Primero realiza un cálculo antes de guardar en historial.', 'danger');
        return;
    }
    const datos = JSON.parse(guardado);
    const historial = JSON.parse(localStorage.getItem('historialPresupuestos') || '[]');
    historial.push(datos);
    localStorage.setItem('historialPresupuestos', JSON.stringify(historial));
    mostrarToast('📦 Presupuesto archivado en historial.', 'success');
    mostrarHistorialPresupuestos();
}

// ✅ Eliminar todo el historial
function eliminarHistorialPresupuestos() {
    if (!confirm('¿Seguro que deseas eliminar todo el historial de presupuestos?')) return;
    localStorage.removeItem('historialPresupuestos');
    mostrarToast('🗑️ Historial eliminado.', 'info');
    mostrarHistorialPresupuestos();
}

function mostrarHistorialPresupuestos() {
    const contenedor = document.getElementById('historialPresupuestos');
    if (!contenedor) return;

    const historial = JSON.parse(localStorage.getItem('historialPresupuestos') || '[]');
    contenedor.innerHTML = '';

    if (historial.length === 0) {
        contenedor.innerHTML = '<li style="color:var(--text-light);">No hay presupuestos archivados aún.</li>';
        document.getElementById('paginaActual').textContent = '—';
        return;
    }

    const totalPaginas = Math.ceil(historial.length / REGISTROS_POR_PAGINA);
    if (paginaHistorial > totalPaginas) paginaHistorial = totalPaginas;

    const inicio = (paginaHistorial - 1) * REGISTROS_POR_PAGINA;
    const fin = inicio + REGISTROS_POR_PAGINA;
    const pagina = historial.slice().reverse().slice(inicio, fin);

    pagina.forEach(item => {
        const fecha = new Date(item.fecha).toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' });
        const li = document.createElement('li');
        li.innerHTML = `
            <div style="padding:0.5rem; border:1px solid #ddd; border-radius:8px; margin-bottom:0.5rem; background:#fafafa;">
                <strong>${fecha}</strong><br>
                Categorías: ${item.categorias.join(', ')}<br>
                Total: Bs. ${formatNumberVE(item.totalGastos)}<br>
                Promedio: Bs. ${formatNumberVE(item.promedioGastos)}<br>
                Inicial: Bs. ${formatNumberVE(item.presupuestoInicial)}<br>
                Sugerido: Bs. ${formatNumberVE(item.presupuestoParaGastos)}<br>
                Restante: Bs. ${formatNumberVE(item.restante)}
            </div>
        `;
        contenedor.appendChild(li);
    });

    document.getElementById('paginaActual').textContent = `${paginaHistorial} / ${totalPaginas}`;
}

// ✅ Cambiar página
function cambiarPaginaHistorial(direccion) {
    const historial = JSON.parse(localStorage.getItem('historialPresupuestos') || '[]');
    const totalPaginas = Math.ceil(historial.length / REGISTROS_POR_PAGINA);
    paginaHistorial += direccion;
    if (paginaHistorial < 1) paginaHistorial = 1;
    if (paginaHistorial > totalPaginas) paginaHistorial = totalPaginas;
    mostrarHistorialPresupuestos();
}

// ✅ Reiniciar pestaña de Presupuesto Sugerido
function reiniciarPresupuestoSugerido() {
    // Limpiar localStorage del cálculo actual (sin borrar historial)
    localStorage.removeItem('presupuestoSugeridoActual');

    // Limpiar campos de entrada
    const inputPresupuesto = document.getElementById('presupuestoInicial');
    const inputPorcentaje = document.getElementById('porcentajeExtra');
    if (inputPresupuesto) inputPresupuesto.value = '';
    if (inputPorcentaje) inputPorcentaje.value = '';

    // Limpiar selección de categorías
    const select = document.getElementById('selectCategoriasPresupuesto');
    if (select) {
        Array.from(select.options).forEach(opt => (opt.selected = false));
    }

    // Limpiar resultados y barra
    const resultado = document.getElementById('resultadoPresupuesto');
    if (resultado) resultado.innerHTML = '';

    const contenedorBarra = document.getElementById('barraPresupuestoContainer');
    if (contenedorBarra) contenedorBarra.innerHTML = '';

    mostrarToast('🔄 Presupuesto reiniciado. Puedes hacer un nuevo cálculo.', 'info');
}


// ✅ Plegar o desplegar historial
function toggleHistorial() {
    const wrapper = document.getElementById('historialWrapper');
    const btn = document.getElementById('btnToggleHistorial');
    const visible = wrapper.style.display !== 'none';
    wrapper.style.display = visible ? 'none' : 'block';
    btn.textContent = visible ? '⬇️ Mostrar' : '⬆️ Ocultar';
}

// ✅ Exportar reporte del historial en PDF
async function exportarReportePresupuestos() {
    const historial = JSON.parse(localStorage.getItem('historialPresupuestos') || '[]');
    if (historial.length === 0) {
        mostrarToast('No hay datos en el historial para exportar.', 'danger');
        return;
    }

    // Importa jsPDF dinámicamente si no está cargado
    if (typeof window.jspdf === 'undefined') {
        await import('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    }
    const { jsPDF } = window.jspdf;

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const margen = 40;
    const ancho = doc.internal.pageSize.getWidth();
    const ahora = new Date();
    const fechaStr = ahora.toLocaleString('es-VE', { dateStyle: 'full', timeStyle: 'short' });

    // 🔹 Encabezado
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Reporte de Presupuestos Sugeridos', ancho / 2, 60, { align: 'center' });

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generado el ${fechaStr}`, ancho / 2, 80, { align: 'center' });

    // 🔹 Línea divisoria
    doc.setDrawColor(150);
    doc.line(margen, 90, ancho - margen, 90);

    // 🔹 Tabla de datos
    let y = 120;
    let totalGeneral = 0, totalRestante = 0, totalPromedio = 0;

    historial.forEach((item, i) => {
        const fecha = new Date(item.fecha).toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' });
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(`Registro ${i + 1}`, margen, y);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        y += 15;
        doc.text(`Fecha: ${fecha}`, margen, y);
        y += 12;
        doc.text(`Categorías: ${item.categorias.join(', ')}`, margen, y);
        y += 12;
        doc.text(`Inicial: Bs. ${formatNumberVE(item.presupuestoInicial)}`, margen, y);
        y += 12;
        doc.text(`Total gastos: Bs. ${formatNumberVE(item.totalGastos)}`, margen, y);
        y += 12;
        doc.text(`Promedio: Bs. ${formatNumberVE(item.promedioGastos)}`, margen, y);
        y += 12;
        doc.text(`Sugerido: Bs. ${formatNumberVE(item.presupuestoParaGastos)}`, margen, y);
        y += 12;
        doc.text(`Restante: Bs. ${formatNumberVE(item.restante)}`, margen, y);
        y += 18;
        doc.setDrawColor(230);
        doc.line(margen, y, ancho - margen, y);
        y += 15;

        // Suma para resumen
        totalGeneral += item.presupuestoParaGastos;
        totalRestante += item.restante;
        totalPromedio += item.promedioGastos;

        // Si nos pasamos del largo de página, crear nueva
        if (y > 740 && i < historial.length - 1) {
            doc.addPage();
            y = 60;
        }
    });

    // 🔹 Resumen final
    const promedioPromedio = totalPromedio / historial.length;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Resumen General', margen, y);
    y += 15;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Presupuestos totales: ${historial.length}`, margen, y); y += 14;
    doc.text(`Suma total sugerida: Bs. ${formatNumberVE(totalGeneral)}`, margen, y); y += 14;
    doc.text(`Promedio de promedios: Bs. ${formatNumberVE(promedioPromedio)}`, margen, y); y += 14;
    doc.text(`Total restante acumulado: Bs. ${formatNumberVE(totalRestante)}`, margen, y);

    // 🔹 Pie de página
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`© ${new Date().getFullYear()} — Sistema Financiero`, ancho / 2, 820, { align: 'center' });

    // 🔹 Descargar
    const nombreArchivo = `Reporte_Presupuestos_${ahora.getFullYear()}${(ahora.getMonth() + 1)
        .toString().padStart(2, '0')}${ahora.getDate().toString().padStart(2, '0')}.pdf`;
    doc.save(nombreArchivo);

    mostrarToast('📤 Reporte exportado correctamente.', 'success');
}

// =========================================================
// ⏰ SISTEMA DE RECORDATORIOS con anticipación configurable
// =========================================================
const STORES_RECORDATORIOS = {
  RECORDATORIOS: 'recordatorios'
};

/* ---------- CRUD ---------- */
async function addRecordatorio(rec) {
  return addEntry(STORES_RECORDATORIOS.RECORDATORIOS, rec);
}
async function getAllRecordatorios() {
  return getAllEntries(STORES_RECORDATORIOS.RECORDATORIOS);
}
async function updateRecordatorio(rec) {
  return updateEntry(STORES_RECORDATORIOS.RECORDATORIOS, rec);
}
async function deleteRecordatorio(id) {
  return deleteEntry(STORES_RECORDATORIOS.RECORDATORIOS, id);
}

/* ---------- Guardar desde form ---------- */
async function guardarRecordatorio() {
  const titulo = document.getElementById('tituloRecordatorio').value.trim();
  const descripcion = document.getElementById('descripcionRecordatorio').value.trim();
  const fecha = document.getElementById('fechaRecordatorio').value; // 'YYYY-MM-DD'
  const dias = parseInt(document.getElementById('diasAnticipacion').value) || 5;

  if (!titulo || !fecha) {
    mostrarToast('❌ Título y fecha son obligatorios', 'danger');
    return;
  }
  if (new Date(fecha + 'T12:00:00') <= new Date()) { // validar usando T12 para evitar shift timezone
    mostrarToast('❌ La fecha debe ser futura', 'danger');
    return;
  }

  const rec = {
    titulo,
    descripcion,
    fechaLimite: fecha,            // mantenemos 'YYYY-MM-DD' (más simple para inputs)
    diasAnticipacion: dias,
    avisado: false
  };

  if (idRecordatorioEditando) {
    // actualizar: preservar fechaCreacion si existe
    const todos = await getAllRecordatorios();
    const original = todos.find(r => r.id === idRecordatorioEditando) || {};
    rec.id = idRecordatorioEditando;
    rec.fechaCreacion = original.fechaCreacion || new Date().toISOString();
    await updateRecordatorio(rec);
    idRecordatorioEditando = null;
    mostrarToast('✅ Recordatorio actualizado', 'success');

    // Restaurar texto del botón (opcional)
    const btn = document.querySelector('#side-recordatorios button[onclick="guardarRecordatorio()"]');
    if (btn) btn.textContent = 'Guardar';
  } else {
    rec.fechaCreacion = new Date().toISOString();
    await addRecordatorio(rec);
    mostrarToast('✅ Recordatorio guardado', 'success');
  }

  limpiarFormRecordatorio();
  await renderizarRecordatorios();
  await renderizarProximosAvisos();
}


function limpiarFormRecordatorio() {
  document.getElementById('tituloRecordatorio').value = '';
  document.getElementById('descripcionRecordatorio').value = '';
  document.getElementById('fechaRecordatorio').value = '';
  document.getElementById('diasAnticipacion').value = localStorage.getItem('defaultAnticipacion') || 5;
}

/* ---------- Renderizado ---------- */
async function renderizarRecordatorios() {
  const lista = document.getElementById('listaRecordatorios');
  const todos = await getAllRecordatorios();
  if (!todos.length) {
    lista.innerHTML = '<p style="text-align:center;color:var(--text-light);font-style:italic;">No hay recordatorios aún.</p>';
    return;
  }
  let html = '';
  todos.forEach(r => {
    const fLim = new Date(r.fechaLimite + 'T12:00:00');
    const hoy = new Date();
    const diasRest = Math.ceil((fLim - hoy) / (1000 * 60 * 60 * 24));
    const clase = diasRest <= r.diasAnticipacion ? 'proximo' : '';
    html += `
      <div class="tarjeta-recordatorio ${clase}" style="background:var(--card-bg);border-radius:8px;padding:1rem;margin-bottom:0.75rem;border-left:4px solid ${clase ? 'var(--warning)' : 'var(--primary)'};">
        <div style="display:flex;justify-content:space-between;align-items:start;">
          <div>
            <strong>${r.titulo}</strong>
            ${r.descripcion ? `<br><small style="color:var(--text-light);">${r.descripcion}</small>` : ''}
            <br><small style="color:var(--text-light);">📅 ${fLim.toLocaleDateString('es-VE')} · ⏰ ${r.diasAnticipacion} días antes</small>
          </div>
          <div style="display:flex;gap:0.25rem;">
            <button onclick="editarRecordatorio(${r.id})" title="Editar">✏️</button>
            <button onclick="eliminarRecordatorio(${r.id})" title="Eliminar">🗑️</button>
          </div>
        </div>
      </div>`;
  });
  lista.innerHTML = html;
}

/* ---------- Editar ---------- */
async function editarRecordatorio(id) {
  const todos = await getAllRecordatorios();
  const rec = todos.find(r => r.id === id);
  if (!rec) return;

  document.getElementById('tituloRecordatorio').value = rec.titulo;
  document.getElementById('descripcionRecordatorio').value = rec.descripcion || '';

  // Si guardaste la fecha como ISO completa (p.ej "2025-10-23T..."), tomar solo la parte de fecha
  const fechaVal = (rec.fechaLimite && rec.fechaLimite.includes('T')) ? rec.fechaLimite.split('T')[0] : rec.fechaLimite;
  document.getElementById('fechaRecordatorio').value = fechaVal;

  document.getElementById('diasAnticipacion').value = rec.diasAnticipacion || localStorage.getItem('defaultAnticipacion') || 5;

  // marcar que estamos editando ese id
  idRecordatorioEditando = id;

  // (opcional) cambiar texto del botón para feedback
  const btn = document.querySelector('#side-recordatorios button[onclick="guardarRecordatorio()"]');
  if (btn) btn.textContent = 'Actualizar';

  // Scroll al formulario
  document.querySelector('#side-recordatorios section').scrollIntoView({behavior: 'smooth'});
}

/* ---------- Eliminar ---------- */
async function eliminarRecordatorio(id) {
  if (await mostrarConfirmacion('¿Eliminar este recordatorio?')) {
    await deleteRecordatorio(id);
    mostrarToast('🗑️ Recordatorio eliminado', 'info');
    await renderizarRecordatorios();
    await renderizarProximosAvisos();
  }
}

/* ---------- Mostrar próximos avisos ---------- */
async function renderizarProximosAvisos() {
  const ul = document.getElementById('ulProximosAvisos');
  const todos = await getAllRecordatorios();
  const hoy = new Date();
  const proximos = [];
  const modoAviso = localStorage.getItem('modoAvisoDiario') || 'unico'; // nuevo

  for (const r of todos) {
    const fLim = new Date(r.fechaLimite + 'T12:00:00');
    const dias = Math.ceil((fLim - hoy) / (1000 * 60 * 60 * 24));

    // condición de aviso
    const dentroRango = dias <= r.diasAnticipacion && dias >= 0;
    const puedeAvisar = modoAviso === 'repetido' ? dentroRango : (dentroRango && !r.avisado);

    if (puedeAvisar) {
      proximos.push({ ...r, diasRestantes: dias });

      if (localStorage.getItem('mostrarToast') !== '0') {
        mostrarToast(`🔔 Recordatorio próximo: ${r.titulo} (${dias === 0 ? 'HOY' : 'en ' + dias + ' días'})`, 'info');
      }
      reproducirSonidoAviso();

      if (modoAviso === 'unico') {
        r.avisado = true;
        await updateRecordatorio(r);
      }
    }
  }

  if (!proximos.length) {
    ul.innerHTML = '<li style="color:var(--text-light);font-style:italic;">No hay avisos próximos.</li>';
    return;
  }

  let html = '';
  proximos
    .sort((a, b) => a.diasRestantes - b.diasRestantes)
    .forEach(p => {
      html += `<li style="margin-bottom:0.5rem;">
        <strong>${p.titulo}</strong> — ${p.diasRestantes === 0 ? '¡HOY!' : p.diasRestantes + ' días'}
        ${p.descripcion ? `<br><small>${p.descripcion}</small>` : ''}
      </li>`;
    });

  ul.innerHTML = html;
}


/* ---------- Configuración global ---------- */
function guardarDefaultAnticipacion() {
  const d = document.getElementById('defaultAnticipacion').value;
  localStorage.setItem('defaultAnticipacion', d);
  mostrarToast('✅ Valor por defecto guardado', 'success');
}
async function aplicarDefaultATodos() {
  const def = parseInt(localStorage.getItem('defaultAnticipacion') || 5);
  const todos = await getAllRecordatorios();
  for (const r of todos) {
    r.diasAnticipacion = def;
    await updateRecordatorio(r);
  }
  mostrarToast(`✅ Anticipación de ${def} días aplicada a todos`, 'success');
  await renderizarRecordatorios();
}

/* ---------- Ayuda ---------- */
function mostrarAyudaRecordatorios() {
  mostrarModalAyuda(`
    <h2>⏰ ¿Cómo funcionan los Recordatorios?</h2>
    <ul>
      <li><strong>Anticipación configurable:</strong> Elige cuántos días antes quieres ser avisado (por defecto 5).</li>
      <li><strong>Global o individual:</strong> Puedes cambiar el valor para TODOS los recordatorios o solo para uno.</li>
      <li><strong>Avisos automáticos:</strong> Al cargar la pestaña se muestran los próximos eventos.</li>
    </ul>
    <p style="font-size:0.85rem;color:var(--text-light)">💡 Los recordatorios se guardan localmente (IndexedDB) y no se pierden al cerrar el navegador.</p>
  `, 'modalAyudaRecordatorios');
}
function cerrarAyudaRecordatorios() {
  const m = document.getElementById('modalAyudaRecordatorios');
  if (m) m.style.display = 'none';
}

/* ---------- Lanzar al mostrar pestaña ---------- */
async function renderizarRecordatoriosPestana() {
  // Primero renderizamos todo el HTML de la pestaña
  await renderizarRecordatorios();
  await renderizarProximosAvisos();

  // Lista de IDs de inputs y su valor por defecto si no existe en localStorage
  const inputs = [
    { id: 'defaultAnticipacion', default: 5 },
    { id: 'modoAvisoDiario', default: 'unico' },
    { id: 'prioridadRecordatorio', default: 'media' },
    { id: 'repeticionRecordatorio', default: 'ninguna' },
    // Agrega más campos aquí si es necesario
    // { id: 'otroInput', default: 'valorPorDefecto' }
  ];

  inputs.forEach(({ id, default: def }) => {
    const el = document.getElementById(id);
    if (el) {
      // Cargar valor desde localStorage o valor por defecto
      el.value = localStorage.getItem(id) ?? def;

      // Guardar automáticamente cambios en localStorage
      el.addEventListener('input', () => {
        localStorage.setItem(id, el.value);
      });
    }
  });

  // SONIDO SELECCIONADO
const selSonido = document.getElementById('selectSonido');
if(selSonido) {
  const valorGuardado = localStorage.getItem('sonidoSeleccionado') || 'default';
  selSonido.value = valorGuardado;

  selSonido.addEventListener('change', () => {
    localStorage.setItem('sonidoSeleccionado', selSonido.value);
  });
}


  // Renderizar lista con colores
  await renderizarListaRecordatorios();
}

// FUNCION PARA EL PIN
function mostrarAyudaPinOlvidado() {
  const aviso = document.getElementById('avisoPinOlvidado');
  aviso.style.display = aviso.style.display === 'block' ? 'none' : 'block';
}

// FUNCIÓN PARA REPRODUCIR EL SONIDO ELEGIDO EN LA PESTAÑA RECORDATORIOS
function reproducirSonidoAviso() {
  const seleccionado = localStorage.getItem('sonidoSeleccionado') || 'default';
  const personalizado = localStorage.getItem('sonidoPersonalizado');

  let audioSrc = '';

  if (personalizado && seleccionado === 'default') {
    audioSrc = personalizado;
  } else {
    switch (seleccionado) {
      case 'chime':
        audioSrc = 'sonidos/chime.mp3';
        break;
      case 'alert':
        audioSrc = 'sonidos/alert.mp3';
        break;
      case 'none':
        return; // sin sonido
      default:
        // sonido por defecto (si existe en tu carpeta)
        audioSrc = 'sonidos/default.mp3';
    }
  }

  try {
    const audio = new Audio(audioSrc);
    audio.play().catch(err => console.warn('No se pudo reproducir el sonido:', err));
  } catch (err) {
    console.error('Error al reproducir sonido:', err);
  }
}

// FUNCIONES AUXILIARES DE LA PESTAÑA DE RECORDATORIOS
function toggleAvisosVisuales() {
  const estado = document.getElementById('mostrarToast').checked;
  localStorage.setItem('mostrarToast', estado ? '1' : '0');
}

function toggleVencidos() {
  const estado = document.getElementById('mostrarVencidos').checked;
  localStorage.setItem('mostrarVencidos', estado ? '1' : '0');
}

function exportarRecordatorios() {
  getAllRecordatorios().then(data => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recordatorios_backup.json';
    a.click();
    URL.revokeObjectURL(url);
  });
}

function importarRecordatorios(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (e) => {
    const data = JSON.parse(e.target.result);
    for (const rec of data) {
      await addRecordatorio(rec);
    }
    mostrarToast('✅ Recordatorios importados correctamente', 'success');
    renderizarRecordatorios();
  };
  reader.readAsText(file);
}

function guardarModoAvisoDiario() {
  const modo = document.getElementById('modoAvisoDiario').value;
  localStorage.setItem('modoAvisoDiario', modo);
  mostrarToast('⚙️ Configuración de recordatorios actualizada', 'info');
}

// COLORACIÓN POR PRIORIDAD PARA LOS RECORDATORIOS
async function renderizarListaRecordatorios() {
  const lista = document.getElementById('listaRecordatorios');
  lista.innerHTML = ''; // limpiar lista antes de renderizar

  const recordatorios = await getAllRecordatorios(); // ahora usa tu IndexedDB

  if(!recordatorios.length) {
    lista.innerHTML = '<p style="text-align:center;color:var(--text-light);font-style:italic;">No hay recordatorios aún.</p>';
    return;
  }

  recordatorios.forEach(r => {
    const div = document.createElement('div');
    div.classList.add('recordatorio');

    // Asignar clase según prioridad
    if(r.prioridad) {
      div.classList.add(`recordatorio-${r.prioridad}`);
    }

    // Contenido
    div.innerHTML = `
      <strong>${r.titulo}</strong><br>
      ${r.descripcion ? r.descripcion + '<br>' : ''}
      📅 ${r.fechaLimite} - ⏰ ${r.diasAnticipacion} días de anticipación
    `;

    lista.appendChild(div);
  });
}



// ------------------------------------------------------------------------------------------------------------------------------------
//                                 Inicialización y Event Listeners
// ------------------------------------------------------------------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', async function () {
    try {
        // ✅ Establecer la fecha actual en el campo de fecha del formulario
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const fechaFormateada = `${yyyy}-${mm}-${dd}`;
        document.getElementById('fechaMov').value = fechaFormateada;

        // Inicializar la base de datos
        await openDB();

        // Cargar los selectores de la UI con datos de la DB
        await actualizarSelectCategorias();
        await cargarSelectBancos();
        await cargarSelectEliminarCategorias();
        await cargarSelectEliminarBancos();
        await cargarSelectBancoRegla();

        // Renderizar la información inicial en la interfaz
        await renderizar();
        await renderizarResumenBancos();
        await renderizarReglas();

         // Cargar meta de presupuesto y actualizar
        await cargarMetaPresupuesto();

        // Aplicar el tema guardado
        aplicarTemaInicial();

        // Asignar Event Listeners
        document.getElementById('tasaCambio').addEventListener('input', actualizarEquivalente);
        document.getElementById('monedaDestino').addEventListener('change', actualizarEquivalente);

                // ✅ CARGAR TASA GUARDADA AL INICIAR (sin formatearla)
        const tasaGuardada = localStorage.getItem('tasaCambio');
        if (tasaGuardada) {
            document.getElementById('tasaCambio').value = tasaGuardada; // ✅ Pone el texto exacto que guardaste
        } else {
            document.getElementById('tasaCambio').value = ''; // Vacío por defecto
        }

        // 4.  🔐  SEGURIDAD: si el bloqueo está activo → mostrar modal
    //     Esto se ejecuta SIEMPRE al recargar (F5, Ctrl+R, botón Recargar…)
    if (localStorage.getItem('bloqueoActivo') === 'true' && localStorage.getItem('bloqueoPIN')) {
      localStorage.removeItem('bloqueoDesbloqueado'); // fuerza bloqueo
      mostrarModalBloqueo();
    }

        // ✅ Inicializar equivalente al cargar
        actualizarEquivalente();


        document.getElementById('filtroBanco').addEventListener('change', renderizar);
        document.getElementById('btnTema').addEventListener('click', () => {
            const body = document.body;
            if (body.classList.contains('modo-claro')) {
                body.classList.remove('modo-claro');
                body.classList.add('modo-oscuro');
                localStorage.setItem('agendaTema', 'oscuro');
            } else if (body.classList.contains('modo-oscuro')) {
                body.classList.remove('modo-oscuro');
                localStorage.removeItem('agendaTema');
            } else {
                body.classList.add('modo-claro');
                localStorage.setItem('agendaTema', 'claro');
            }
        });

        // Eventos para mostrar/ocultar campos de texto
        document.getElementById('categoria').addEventListener('change', e => {
            const input = document.getElementById('nuevaCategoria');
            input.style.display = e.target.value === 'Otro' ? 'block' : 'none';
            if (input.style.display === 'block') input.focus();
        });

        document.getElementById('banco').addEventListener('change', e => {
            const input = document.getElementById('nuevoBanco');
            input.style.display = e.target.value === 'Otro' ? 'block' : 'none';
            if (input.style.display === 'block') input.focus();
        });

        document.getElementById('txtBancoRegla').addEventListener('change', e => {
            const input = document.getElementById('nuevoBancoRegla');
            input.style.display = e.target.value === 'Otro' ? 'block' : 'none';
            if (input.style.display === 'block') input.focus();
        });

        // ✅ Renderizar listas editables al cargar
        await renderizarCategoriasEditables();
        await renderizarBancosEditables();

        // Cargar la pestaña guardada, si existe
const pestañaGuardada = localStorage.getItem('agendaPestañaActiva');
if (pestañaGuardada) {
    mostrarSideTab(pestañaGuardada);
} else {
    mostrarSideTab('dashboard');
}

} catch (error) {
    console.error("Error en la inicialización de la app:", error);
}

});

// ✅ Inicialización de metas de ahorro
document.addEventListener('DOMContentLoaded', function() {
    // Cargar metas de ahorro cuando se carga la página
    setTimeout(() => {
        cargarMetasAhorro();
        actualizarProgresoGeneral();
        generarSugerenciasAhorro();
    }, 1000); // Pequeño delay para asegurar que todo esté cargado
});
