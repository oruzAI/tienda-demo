const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRRpSFGoY5UUmSbVSvOurGCmWkB5SV3ICO-UG1uHtjQPnQvxHPaXtsHXwUyTMSr6LMNBEQZ7aYgERXc/pub?gid=1714344078&single=true&output=csv";

const productosContenedor = document.getElementById("productos");
const estado = document.getElementById("estado");

function convertirCSV(texto) {
  const filas = [];
  let fila = [];
  let celda = "";
  let entreComillas = false;

  for (let i = 0; i < texto.length; i++) {
    const caracter = texto[i];
    const siguiente = texto[i + 1];

    if (caracter === '"') {
      if (entreComillas && siguiente === '"') {
        celda += '"';
        i++;
      } else {
        entreComillas = !entreComillas;
      }
    } else if (caracter === "," && !entreComillas) {
      fila.push(celda);
      celda = "";
    } else if (
      (caracter === "\n" || caracter === "\r") &&
      !entreComillas
    ) {
      if (caracter === "\r" && siguiente === "\n") {
        i++;
      }

      fila.push(celda);

      if (fila.some((valor) => valor.trim() !== "")) {
        filas.push(fila);
      }

      fila = [];
      celda = "";
    } else {
      celda += caracter;
    }
  }

  if (celda !== "" || fila.length > 0) {
    fila.push(celda);
    filas.push(fila);
  }

  return filas;
}

function escapar(texto = "") {
  return texto.replace(/[&<>"']/g, (caracter) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[caracter]);
}

function formatearPrecio(valor) {
  const numero = Number(String(valor).replace(",", "."));

  if (Number.isNaN(numero)) {
    return `S/ ${valor}`;
  }

  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN"
  }).format(numero);
}

async function cargarProductos() {
  try {
    const respuesta = await fetch(
      `${CSV_URL}&t=${Date.now()}`,
      {
        cache: "no-store"
      }
    );

    if (!respuesta.ok) {
      throw new Error(`Error HTTP ${respuesta.status}`);
    }

    const textoCSV = await respuesta.text();
    const filas = convertirCSV(textoCSV);

    if (filas.length < 2) {
      throw new Error("La hoja no contiene productos.");
    }

    const encabezados = filas.shift().map((valor) =>
      valor
        .trim()
        .toLowerCase()
        .replace(/^\uFEFF/, "")
    );

    const productos = filas
      .filter((fila) =>
        fila.some((celda) => celda.trim() !== "")
      )
      .map((fila) =>
        Object.fromEntries(
          encabezados.map((encabezado, indice) => [
            encabezado,
            (fila[indice] || "").trim()
          ])
        )
      )
      .filter(
        (producto) =>
          producto.activo.toUpperCase() === "SI"
      );

    productosContenedor.innerHTML = productos
      .map((producto) => `
        <article class="producto">
          <img
            class="producto-imagen"
            src="assets/products/${escapar(producto.imagen)}"
            alt="${escapar(producto.nombre)}"
            onerror="this.remove()"
          >

          <div class="producto-contenido">
            <span class="producto-id">
              PRODUCTO ${escapar(producto.id)}
            </span>

            <h2>${escapar(producto.nombre)}</h2>

            <p class="producto-descripcion">
              ${escapar(producto.descripcion)}
            </p>

            <div class="producto-pie">
              <span class="precio">
                ${formatearPrecio(producto.precio)}
              </span>

              <button class="boton" type="button">
                Ver producto
              </button>
            </div>
          </div>
        </article>
      `)
      .join("");

    estado.style.display = "none";
  } catch (error) {
    console.error(error);

    estado.innerHTML = `
      <div class="error">
        No se pudieron cargar los productos.
        <br>
        ${escapar(error.message)}
      </div>
    `;
  }
}

cargarProductos();
