// Abstracción simple sobre localStorage
const KEY = 'agenda';

function leerDatos() {
  return JSON.parse(localStorage.getItem(KEY) || '[]');
}

function guardarDatos(lista) {
  localStorage.setItem(KEY, JSON.stringify(lista));
}

const KEY_REG = 'agenda_reglas';

function leerReglas() {
  return JSON.parse(localStorage.getItem(KEY_REG) || '[]');
}
function guardarReglas(lista) {
  localStorage.setItem(KEY_REG, JSON.stringify(lista));
}

const KEY_BANCOS = 'agenda_bancos';

function leerBancos() {
  return JSON.parse(localStorage.getItem(KEY_BANCOS) || '[]');
}
function guardarBancos(lista) {
  localStorage.setItem(KEY_BANCOS, JSON.stringify(lista));
}