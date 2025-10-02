// ✅ Funciones auxiliares para el nuevo diseño de tarjetas mejoradas
function getMovementIcon(tipo) {
    const icons = {
        'ingreso': '💰',
        'gasto': '💸',
        'saldo_inicial': '🏦'
    };
    return icons[tipo] || '📊';
}

function getMovementTypeLabel(tipo) {
    const labels = {
        'ingreso': 'Ingreso',
        'gasto': 'Gasto',
        'saldo_inicial': 'Saldo Inicial'
    };
    return labels[tipo] || 'Movimiento';
}

function formatDate(fecha) {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

function getRelativeDate(fecha) {
    const now = new Date();
    const date = new Date(fecha);

    // ✅ Normalizar fechas a medianoche para evitar problemas de horas
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const diffTime = today - targetDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
    return `Hace ${Math.floor(diffDays / 30)} meses`;
}

// ✅ Función auxiliar para hacer scroll automático hacia la lista de movimientos
function scrollToListaMovimientos() {
    setTimeout(() => {
        const listaMovimientos = document.getElementById('listaMovimientos');
        if (listaMovimientos) {
            listaMovimientos.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }, 100); // Pequeño delay para asegurar que la lista se haya renderizado
}