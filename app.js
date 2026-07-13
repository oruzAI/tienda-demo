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

      if (
        fila.some(
          (valor) => String(valor).trim() !== ""
        )
      ) {
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

    if (
      fila.some(
        (valor) => String(valor).trim() !== ""
      )
    ) {
      filas.push(fila);
    }
  }

  return filas;
}

function escapar(texto = "") {
  return String(texto).replace(/[&<>"']/g, (caracter) => {
    const equivalencias = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };

    return equivalencias[caracter];
  });
}

function formatearPrecio(valor) {
  const numero = Number(
    String(valor)
      .trim()
      .replace(",", ".")
  );

  if (Number.isNaN(numero)) {
    return `S/ ${valor}`;
  }

  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numero);
}

function obtenerURLImagen(valor) {
  const imagen = String(valor || "").trim();

  const enlaceDrive = imagen.match(
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/
  );

  const enlaceConId = imagen.match(
    /[?&]id=([a-zA-Z0-9_-]+)/
  );

  const idArchivo =
    enlaceDrive?.[1] ||
    enlaceConId?.[1];

  if (idArchivo) {
    return `https://drive.google.com/thumbnail?id=${idArchivo}&sz=w1600`;
  }

  if (
    imagen.startsWith("https://") ||
    imagen.startsWith("http://")
  ) {
    return imagen;
  }

  return `assets/products/${imagen}`;
}

async function cargarProductos() {
  try {
    estado.style.display = "block";
    estado.textContent = "Cargando productos...";

    const respuesta = await fetch(
      `${CSV_URL}&actualizacion=${Date.now()}`,
      {
        cache: "no-store"
      }
    );

    if (!respuesta.ok) {
      throw new Error(
        `No se pudo cargar la hoja. Error ${respuesta.status}`
      );
    }

    const textoCSV = await respuesta.text();
    const filas = convertirCSV(textoCSV);

    if (filas.length < 2) {
      throw new Error(
        "La hoja no contiene productos."
      );
    }

    const encabezados = filas
      .shift()
      .map((valor) =>
        String(valor)
          .trim()
          .toLowerCase()
          .replace(/^\uFEFF/, "")
      );

    const productos = filas
      .filter((fila) =>
        fila.some(
          (celda) =>
            String(celda).trim() !== ""
        )
      )
      .map((fila) =>
        Object.fromEntries(
          encabezados.map(
            (encabezado, indice) => [
              encabezado,
              String(fila[indice] || "").trim()
            ]
          )
        )
      );

    if (productos.length === 0) {
      estado.textContent =
        "No existen productos para mostrar.";
      return;
    }

    productosContenedor.innerHTML = productos
      .map((producto) => {
        const disponible =
          String(producto.activo || "")
            .trim()
            .toUpperCase() === "SI";

        const claseStock = disponible
          ? ""
          : "sin-stock";

        const etiquetaStock = disponible
          ? ""
          : `
            <span class="estado-stock">
              SIN STOCK
            </span>
          `;

        const textoBoton = disponible
          ? "Ver producto"
          : "Agotado";

        const botonDesactivado = disponible
          ? ""
          : "disabled";

        return `
          <article class="producto ${claseStock}">

            ${etiquetaStock}

            <img
              class="producto-imagen"
              src="${escapar(
                obtenerURLImagen(producto.imagen)
              )}"
              alt="${escapar(producto.nombre)}"
              loading="lazy"
              onerror="this.style.display='none'"
            >

            <div class="producto-contenido">

              <span class="producto-id">
                PRODUCTO ${escapar(producto.id)}
              </span>

              <h2>
                ${escapar(producto.nombre)}
              </h2>

              <p class="producto-descripcion">
                ${escapar(producto.descripcion)}
              </p>

              <div class="producto-pie">

                <span class="precio">
                  ${formatearPrecio(
                    producto.precio
                  )}
                </span>

                <button
                  class="boton"
                  type="button"
                  ${botonDesactivado}
                >
                  ${textoBoton}
                </button>

              </div>
            </div>
          </article>
        `;
      })
      .join("");

    estado.style.display = "none";
  } catch (error) {
    console.error(
      "Error cargando productos:",
      error
    );

    productosContenedor.innerHTML = "";

    estado.style.display = "block";
    estado.innerHTML = `
      <div class="error">
        No se pudieron cargar los productos.
        <br><br>
        ${escapar(error.message)}
      </div>
    `;
  }
}

cargarProductos();
