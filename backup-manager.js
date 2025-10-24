// ================== GESTIÓN DE BACKUPS GUARDADOS ==================

/**
 * Carga y muestra los backups guardados en el almacenamiento local
 */
async function cargarBackupsGuardados() {
    const listaBackups = document.getElementById('listaBackups');
    if (!listaBackups) return;
    
    try {
        // Obtener todos los backups guardados
        const backups = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('backup_')) {
                try {
                    const backup = JSON.parse(localStorage.getItem(key));
                    backups.push({
                        key: key,
                        fecha: new Date(backup.fecha),
                        nombre: key.replace('backup_', '').replace(/_/g, ' ').replace('.json', '')
                    });
                } catch (e) {
                    console.error(`Error al procesar backup ${key}:`, e);
                }
            }
        }
        
        // Ordenar por fecha (más reciente primero)
        backups.sort((a, b) => b.fecha - a.fecha);
        
        // Mostrar lista de backups
        if (backups.length === 0) {
            listaBackups.innerHTML = '<p style="text-align: center; color: var(--text-light);">No hay backups guardados.</p>';
            return;
        }
        
        let html = '<div style="display: flex; flex-direction: column; gap: 0.5rem;">';
        
        backups.forEach(backup => {
            const fechaFormateada = backup.fecha.toLocaleString();
            html += `
            <div style="display: flex; justify-content: space-between; align-items: center; background: var(--card-bg); padding: 0.75rem; border-radius: var(--radius); border: 1px solid var(--border-color);">
                <div>
                    <div style="font-weight: 500;">${backup.nombre}</div>
                    <div style="font-size: 0.8rem; color: var(--text-light);">${fechaFormateada}</div>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button onclick="restaurarBackup('${backup.key}')" style="background: var(--success); color: white; border: none; border-radius: 4px; padding: 0.4rem 0.6rem; cursor: pointer; font-size: 0.85rem; display: flex; align-items: center; gap: 0.25rem;">
                        <span style="font-size: 1rem;">↻</span> Restaurar
                    </button>
                    <button onclick="eliminarBackup('${backup.key}')" style="background: var(--danger); color: white; border: none; border-radius: 4px; padding: 0.4rem 0.6rem; cursor: pointer; font-size: 0.85rem; display: flex; align-items: center; gap: 0.25rem;">
                        <span style="font-size: 1rem;">🗑️</span>
                    </button>
                </div>
            </div>`;
        });
        
        html += '</div>';
        listaBackups.innerHTML = html;
        
    } catch (error) {
        console.error('Error al cargar backups:', error);
        listaBackups.innerHTML = '<p style="text-align: center; color: var(--danger);">Error al cargar los backups. Revisa la consola.</p>';
    }
}

/**
 * Guarda el estado actual de la aplicación como un backup local
 */
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
        
        // Actualizar la lista de backups
        await cargarBackupsGuardados();
        
        // Mostrar notificación
        alert(`✅ Backup guardado correctamente como "${nombreBackup.replace('backup_', '').replace('.json', '')}"`);
        return true;
        
    } catch (error) {
        console.error('Error al guardar backup:', error);
        alert('❌ Error al guardar el backup. Revisa la consola para más detalles.');
        return false;
    }
}

/**
 * Restaura un backup desde el almacenamiento local
 */
async function restaurarBackup(backupKey) {
    if (!confirm('⚠️ ¿Estás seguro de que deseas restaurar este backup? Se sobrescribirán todos los datos actuales.')) {
        return;
    }
    
    try {
        const backup = JSON.parse(localStorage.getItem(backupKey));
        
        if (!backup || backup.version !== '1.0') {
            alert('❌ El formato del backup no es válido o no es compatible.');
            return;
        }
        
        // Mostrar indicador de carga
        const listaBackups = document.getElementById('listaBackups');
        const originalContent = listaBackups.innerHTML;
        listaBackups.innerHTML = '<p style="text-align: center;">Restaurando backup, por favor espera...</p>';
        
        // Importar los datos
        await importarBackupFromData(backup);
        
        // Recargar la aplicación
        alert('✅ Backup restaurado correctamente. La aplicación se recargará.');
        location.reload();
        
    } catch (error) {
        console.error('Error al restaurar backup:', error);
        alert('❌ Error al restaurar el backup. Revisa la consola para más detalles.');
        if (listaBackups && originalContent) {
            listaBackups.innerHTML = originalContent;
        }
    }
}

/**
 * Función auxiliar para importar datos de un backup
 */
async function importarBackupFromData(backup) {
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
}

/**
 * Elimina un backup guardado
 */
async function eliminarBackup(backupKey) {
    if (!confirm('¿Estás seguro de que deseas eliminar este backup? Esta acción no se puede deshacer.')) {
        return;
    }
    
    try {
        localStorage.removeItem(backupKey);
        await cargarBackupsGuardados();
        alert('✅ Backup eliminado correctamente.');
    } catch (error) {
        console.error('Error al eliminar backup:', error);
        alert('❌ Error al eliminar el backup. Revisa la consola para más detalles.');
    }
}

// Cargar los backups al abrir la pestaña de configuración
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si estamos en la pestaña de configuración
    const configTab = document.querySelector('.side-tab[onclick*="configuracion"]');
    if (configTab) {
        configTab.addEventListener('click', function() {
            // Pequeño retraso para asegurar que la pestaña esté visible
            setTimeout(cargarBackupsGuardados, 100);
        });
    }
    
    // También cargar si ya estamos en la pestaña de configuración al cargar la página
    if (window.location.hash === '#configuracion') {
        setTimeout(cargarBackupsGuardados, 500);
    }
});
