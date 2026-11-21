// ============================================================
// Laboratorio 5 · Buscador de personajes (variante A: mi nro de cedula termina en 3)
// ============================================================

// ---------- 1. Configuración ----------
const URL_PERSONAJES = "https://rickandmortyapi.com/api/character";
const TEXTO_DESCONOCIDO = "Desconocido";

const ESTADOS = {
  Alive: { texto: "Vivo", clase: "estado-vivo" },
  Dead: { texto: "Muerto", clase: "estado-muerto" },
  unknown: { texto: TEXTO_DESCONOCIDO, clase: "estado-desconocido" },
};

const GENEROS = {
  Female: "Femenino",
  Male: "Masculino",
  Genderless: "Sin género",
  unknown: TEXTO_DESCONOCIDO,
};

// ---------- 2. Elementos del DOM ----------
const formularioBusqueda = document.querySelector("#formulario-busqueda");
const campoNombre = document.querySelector("#campo-nombre");
const filtroEstado = document.querySelector("#filtro-estado");
const filtroGenero = document.querySelector("#filtro-genero");
const botonBuscar = document.querySelector("#boton-buscar");
const mensajeEstado = document.querySelector("#mensaje-estado");
const contadorResultados = document.querySelector("#contador-resultados");
const contenedorResultados = document.querySelector("#contenedor-resultados");

// ---------- 3. Criterios y acceso a la API (no tocan el DOM, salvo leerCriterios) ----------
const leerCriterios = () => ({
  nombre: campoNombre.value.trim(),
  estado: filtroEstado.value,
  genero: filtroGenero.value,
});

const hayCriterios = (criterios) =>
  Object.values(criterios).some((valor) => valor !== "");

// Solo se agregan los parámetros que tienen valor
const construirUrlBusqueda = ({ nombre, estado, genero }) => {
  const url = new URL(URL_PERSONAJES);
  if (nombre !== "") {
    url.searchParams.set("name", nombre);
  }
  if (estado !== "") {
    url.searchParams.set("status", estado);
  }
  if (genero !== "") {
    url.searchParams.set("gender", genero);
  }
  return url;
};

const buscarPersonajes = async (criterios) => {
  const respuesta = await fetch(construirUrlBusqueda(criterios));

  // 404 = "sin coincidencias", no es una falla
  if (respuesta.status === 404) {
    return { total: 0, personajes: [] };
  }

  // Cualquier otro código fuera de 200-299 es un error HTTP
  if (!respuesta.ok) {
    throw new Error(`El servidor respondió con el código ${respuesta.status}`);
  }

  const datos = await respuesta.json();
  return { total: datos.info.count, personajes: datos.results };
};

// ---------- 4. Formateo de datos ----------
const textoSeguro = (valor) => {
  if (!valor || valor === "unknown") {
    return TEXTO_DESCONOCIDO;
  }
  return valor;
};

const obtenerEstado = (estado) => ESTADOS[estado] ?? ESTADOS.unknown;
const obtenerGenero = (genero) => GENEROS[genero] ?? TEXTO_DESCONOCIDO;

// ---------- 5. Renderizado ----------
const crearDato = (etiqueta, valor) => {
  const termino = document.createElement("dt");
  termino.textContent = etiqueta;

  const descripcion = document.createElement("dd");
  descripcion.textContent = valor;

  return [termino, descripcion];
};

const crearTarjeta = (personaje) => {
  const tarjeta = document.createElement("article");
  tarjeta.classList.add("tarjeta");

  const imagen = document.createElement("img");
  imagen.src = personaje.image;
  imagen.alt = `Retrato de ${personaje.name}`;
  imagen.loading = "lazy";
  imagen.width = 300;
  imagen.height = 300;

  const cuerpo = document.createElement("div");
  cuerpo.classList.add("tarjeta-cuerpo");

  const titulo = document.createElement("h2");
  titulo.textContent = textoSeguro(personaje.name);

  const estado = obtenerEstado(personaje.status);
  const indicadorEstado = document.createElement("span");
  indicadorEstado.classList.add("estado", estado.clase);
  indicadorEstado.textContent = `${estado.texto} · ${textoSeguro(personaje.species)}`;

  const listaDatos = document.createElement("dl");
  const cantidadEpisodios = personaje.episode?.length ?? 0;
  listaDatos.append(
    ...crearDato("Género", obtenerGenero(personaje.gender)),
    ...crearDato("Origen", textoSeguro(personaje.origin?.name)),
    ...crearDato("Última ubicación", textoSeguro(personaje.location?.name)),
    ...crearDato("Episodios", `${cantidadEpisodios}`)
  );

  cuerpo.append(titulo, indicadorEstado, listaDatos);
  tarjeta.append(imagen, cuerpo);
  return tarjeta;
};

const mostrarPersonajes = (personajes) => {
  contenedorResultados.replaceChildren(...personajes.map(crearTarjeta));
};

const limpiarResultados = () => {
  contenedorResultados.replaceChildren();
};

// ---------- 6. Estados de la interfaz ----------
const mostrarMensaje = (texto, esError = false) => {
  mensajeEstado.textContent = texto;
  mensajeEstado.classList.toggle("error", esError);
};

const mostrarContador = (total, mostrados) => {
  const encontrados =
    total === 1 ? "1 personaje encontrado" : `${total} personajes encontrados`;
  contadorResultados.textContent = `${encontrados} · se muestran ${mostrados}`;
  contadorResultados.hidden = false;
};

const ocultarContador = () => {
  contadorResultados.textContent = "";
  contadorResultados.hidden = true;
};

const activarCarga = (estaCargando) => {
  botonBuscar.disabled = estaCargando;
  botonBuscar.textContent = estaCargando ? "Buscando…" : "Buscar";
  contenedorResultados.setAttribute("aria-busy", String(estaCargando));
};

// ---------- 7. Manejador del formulario ----------
const CLAVE_ULTIMA_BUSQUEDA = "buscador:ultima-busqueda";

const guardarCriterios = (criterios) => {
  try {
    localStorage.setItem(CLAVE_ULTIMA_BUSQUEDA, JSON.stringify(criterios));
  } catch (error) {
    // Puede fallar en modo privado o con el almacenamiento lleno; la app sigue funcionando
    console.warn("No se pudo guardar la última búsqueda:", error);
  }
};

const cargarCriterios = () => {
  try {
    const texto = localStorage.getItem(CLAVE_ULTIMA_BUSQUEDA);
    if (texto === null) {
      return null;
    }
    const datos = JSON.parse(texto);
    return {
      nombre: typeof datos.nombre === "string" ? datos.nombre.slice(0, 40) : "",
      estado: typeof datos.estado === "string" ? datos.estado : "",
      genero: typeof datos.genero === "string" ? datos.genero : "",
    };
  } catch (error) {
    // JSON dañado o localStorage no disponible: se ignora y se empieza de cero
    console.warn("No se pudo leer la última búsqueda:", error);
    return null;
  }
};
const aplicarCriterios = ({ nombre, estado, genero }) => {
  campoNombre.value = nombre;
  filtroEstado.value = estado;
  filtroGenero.value = genero;
};
const ejecutarBusqueda = async () => {
  const criterios = leerCriterios();

  if (!hayCriterios(criterios)) {
    mostrarMensaje("Escribe un nombre o elige al menos un filtro para buscar.", true);
    ocultarContador();
    limpiarResultados();
    campoNombre.focus();
    return;
  }

  guardarCriterios(criterios); // se guarda solo si hay criterios válidos

  activarCarga(true);
  mostrarMensaje("Buscando personajes…");
  ocultarContador();
  limpiarResultados();

  try {
    const { total, personajes } = await buscarPersonajes(criterios);

    if (personajes.length === 0) {
      mostrarMensaje("No se encontraron personajes con esos criterios.");
      return;
    }

    mostrarPersonajes(personajes);
    mostrarMensaje("Búsqueda completada.");
    mostrarContador(total, personajes.length);
  } catch (error) {
    console.error("Error al buscar personajes:", error);
    const mensaje =
      error instanceof TypeError
        ? "No se pudo conectar con la API. Revisa tu conexión e inténtalo de nuevo."
        : `Ocurrió un problema al consultar la API (${error.message}).`;
    mostrarMensaje(mensaje, true);
  } finally {
    activarCarga(false);
  }
};

const manejarBusqueda = (evento) => {
  evento.preventDefault();
  ejecutarBusqueda();
};
const iniciar = () => {
  const guardados = cargarCriterios();
  if (guardados === null) {
    return;
  }
  aplicarCriterios(guardados);
  if (hayCriterios(guardados)) {
    ejecutarBusqueda();
  }
};

formularioBusqueda.addEventListener("submit", manejarBusqueda);
iniciar();


// ---------- 8. Eventos ----------
formularioBusqueda.addEventListener("submit", manejarBusqueda);

