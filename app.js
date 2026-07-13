const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRRpSFGoY5UUmSbVSvOurGCmWkB5SV3ICO-UG1uHtjQPnQvxHPaXtsHXwUyTMSr6LMNBEQZ7aYgERXc/pub?gid=1714344078&single=true&output=csv";

const contenedor = document.getElementById("productos");
const estado = document.getElementById("estado");

async function cargarProductos() {
  try {
    estado.style.display = "block";
    estado.textContent = "Cargando productos...";

    const separador = CSV_URL.includes("?") ? "&" : "?";
    const urlActualizada =
      `${CSV_URL}${separador}actualizacion=${Date.now()}`;

    const respuesta = await fetch(urlActualizada, {
      cache: "no-store"
    });

    if (!respuesta.ok) {
      throw new Error(
        `No se pudo leer la hoja. Código: ${respuesta.status}`
      );
    }

    const textoCSV = await respuesta.text();
    const filas = convertirCSV(textoCSV);

    if (filas.length < 2) {
      throw new Error("La hoja no contiene productos.");
    }

    const encabezados = filas[0].map((encabezado, indice) => {
      let encabezadoLimpio = encabezado.trim().toLowerCase();

      // Elimina un carácter invisible que a veces añade Google Sheets.
      if (indice === 0) {
        encabezadoLimpio = encabezadoLimpio.replace(/^\uFEFF/, "");
      }

      return encabezadoLimpio;
    });

    const columnasNecesarias = [
      "id",
      "nombre",
      "descripcion",
      "precio",
      "imagen",
      "activo"
    ];

    const faltantes = columnasNecesarias.filter(
      (columna) => !encabezados.includes(columna)
    );

    if (faltantes.length > 0) {
      throw new Error(
        `Faltan columnas en la hoja: ${faltantes.join(", ")}`
      );
    }

    const productos = filas
      .slice(1)
      .filter((fila) =>
        fila.some((celda) => String(celda).trim() !== "")
      )
      .map((fila) => {
        const producto = {};

        encabezados.forEach((encabezado, indice) => {
          producto[encabezado] =
            String(fila[indice] ?? "").trim();
        });

        return producto;
      })
      .filter(
        (producto) =>
          producto.activo.toUpperCase() === "SI"
      );

    mostrarProductos(productos);
  } catch (error) {
    console.error("Error al cargar productos:", error);

    contenedor.innerHTML = "";
    estado.style.display = "block";
    estado.innerHTML = `
      <div class="error">
        <strong>No se pudieron cargar los productos.</strong>
        <br><br>
        ${escaparHTML(error.message)}
      </div>
    `;
  }
}

function mostrarProductos(productos) {
  contenedor.innerHTML = "";

  if (productos.length === 0) {
    estado.style.display = "block";
    estado.textContent = "No hay productos activos.";
    return;
  }

  estado.style.display = "none";

  productos.forEach((producto) => {
    const tarjeta = document.createElement("article");
    tarjeta.className = "producto";

    const imagen = document.createElement("img");
    imagen.className = "producto-imagen";
    imagen.src = `assets/products/${producto.imagen}`;
    imagen.alt = producto.nombre || "Imagen del producto";
    imagen.loading = "lazy";

    imagen.addEventListener("error", () => {
      imagen.remove();
    });

    const contenido = document.createElement("div");
    contenido.className = "producto-contenido";

    const identificador = document.createElement("span");
    identificador.className = "producto-id";
    identificador.textContent = `PRODUCTO ${producto.id}`;

    const nombre = document.createElement("h2");
    nombre.textContent = producto.nombre;

    const descripcion = document.createElement("p");
    descripcion.className = "producto-descripcion";
    descripcion.textContent = producto.descripcion;

    const pie = document.createElement("div");
    pie.className = "producto-pie";

    const precio = document.createElement("span");
    precio.className = "precio";
    precio.textContent = formatearPrecio(producto.precio);

    const boton = document.createElement("button");
    boton.className = "boton";
    boton.type = "button";
    boton.textContent = "Ver producto";

    boton.addEventListener("click", () => {
      alert(`Seleccionaste: ${producto.nombre}`);
    });

    pie.append(precio, boton);

    contenido.append(
      identificador,
      nombre,
      descripcion,
      pie
    );

    tarjeta.append(imagen, contenido);
    contenedor.appendChild(tarjeta);
  });
}

function formatearPrecio(valor) {
  const valorLimpio = String(valor)
    .trim()
    .replace(/\s/g, "")
    .replace(",", ".");

  const numero = Number(valorLimpio);

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

function convertirCSV(texto) {
  const filas = [];
  let fila = [];
  let celda = "";
  let dentroDeComillas = false;

  for (let i = 0; i < texto.length; i++) {
    const caracter = texto[i];
    const siguiente = texto[i + 1];

    if (caracter === '"') {
      if (dentroDeComillas && siguiente === '"') {
        celda += '"';
        i++;
      } else {
        dentroDeComillas = !dentroDeComillas;
      }
    } else if (
      caracter === "," &&
      !dentroDeComillas
    ) {
      fila.push(celda);
      celda = "";
    } else if (
      (caracter === "\n" || caracter === "\r") &&
      !dentroDeComillas
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

function escaparHTML(texto) {
  const elemento = document.createElement("div");
  elemento.textContent = texto;
  return elemento.innerHTML;
}

cargarProductos();
