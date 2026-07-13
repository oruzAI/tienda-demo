const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRRpSFGoY5UUmSbVSvOurGCmWkB5SV3ICO-UG1uHtjQPnQvxHPaXtsHXwUyTMSr6LMNBEQZ7aYgERXc/pub?gid=1714344078&single=true&output=csv";

const contenedor = document.getElementById("productos");
const estado = document.getElementById("estado");

async function cargarProductos() {
  try {
    // Date.now() evita que el navegador muestre precios antiguos.
    const respuesta = await fetch(`${CSV_URL}&actualizacion=${Date.now()}`, {
      cache: "no-store"
    });

    if (!respuesta.ok) {
      throw new Error("No se pudo leer la hoja de cálculo.");
    }

    const textoCSV = await respuesta.text();
    const filas = convertirCSV(textoCSV);

    if (filas.length < 2) {
      throw new Error("La hoja no contiene productos.");
    }

    const encabezados = filas[0].map((encabezado) =>
      encabezado.trim().toLowerCase()
    );

    const productos = filas
      .slice(1)
      .filter((fila) => fila.some((celda) => celda.trim() !== ""))
      .map((fila) => {
        const producto = {};

        encabezados.forEach((encabezado, indice) => {
          producto[encabezado] = fila[indice]?.trim() || "";
        });

        return producto;
      })
      .filter((producto) => producto.activo.toUpperCase() === "SI");

    mostrarProductos(productos);
  } catch (error) {
    console.error(error);

    estado.innerHTML = `
      <div class="error">
        No se pudieron cargar los productos.<br>
        Revisa que la hoja continúe publicada.
      </div>
    `;
  }
}

function mostrarProductos(productos) {
  estado.style.display = "none";
  contenedor.innerHTML = "";

  if (productos.length === 0) {
    estado.style.display = "block";
    estado.textContent = "No hay productos activos.";
    return;
  }

  productos.forEach((producto) => {
    const tarjeta = document.createElement("article");
    tarjeta.className = "producto";

    const imagen = document.createElement("img");
    imagen.className = "producto-imagen";
    imagen.src = `assets/products/${producto.imagen}`;
    imagen.alt = producto.nombre;
    imagen.loading = "lazy";

    imagen.addEventListener("error", () => {
      imagen.style.display = "none";
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

    pie.append(precio, boton);
    contenido.append(identificador, nombre, descripcion, pie);
    tarjeta.append(imagen, contenido
