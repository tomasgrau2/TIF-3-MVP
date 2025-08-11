# VenciScan - Web Application

Aplicación web para el seguimiento de fechas de vencimiento de productos farmacéuticos.

## Características

- 📊 Dashboard con productos organizados por urgencia de vencimiento
- 📅 Vista de calendario para visualizar fechas de vencimiento
- 🔍 Búsqueda de productos
- ➕ Agregar productos manualmente
- ✏️ Editar información de productos
- 🗑️ Eliminar productos
- 📈 Incrementar/decrementar cantidades

## Configuración

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# URL del backend
VITE_BACKEND_URL=http://192.168.1.17:8000
```

### 3. Asegúrate de que el backend esté funcionando

El backend debe estar ejecutándose en la URL especificada en `VITE_BACKEND_URL`.

## Desarrollo

### Ejecutar en modo desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

### Construir para producción

```bash
npm run build
```

### Vista previa de la build

```bash
npm run preview
```

## Uso

### Dashboard
- Los productos se organizan automáticamente por urgencia de vencimiento
- Productos vencidos (rojo)
- Productos que vencen hoy (rojo)
- Productos que vencen en 7 días (naranja)
- Productos que vencen en 30 días (amarillo)
- Otros productos (azul)

### Agregar Producto
1. Haz clic en "Agregar Nuevo Producto"
2. Completa el formulario con la información del producto
3. Guarda el producto

### Editar Producto
1. Haz clic en un producto para ver sus detalles
2. Haz clic en "Editar"
3. Modifica la información necesaria
4. Guarda los cambios

### Gestionar Cantidad
1. Abre los detalles de un producto
2. Usa los botones "+" y "-" para incrementar/decrementar la cantidad

### Búsqueda
- Usa la barra de búsqueda en la parte superior
- Busca por nombre, descripción o categoría

## Tecnologías

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Big Calendar

## Estructura del Proyecto

```
front-web-tif/
├── components/          # Componentes React
├── services/           # Servicios de API y IA
├── types.ts           # Definiciones de tipos TypeScript
├── constants.ts       # Constantes de la aplicación
├── App.tsx           # Componente principal
└── vite.config.ts    # Configuración de Vite
```

## API Endpoints

La aplicación se conecta a los siguientes endpoints del backend:

- `GET /products` - Obtener todos los productos
- `POST /products` - Crear nuevo producto
- `PUT /products/{id}/expiration` - Actualizar fecha de vencimiento
- `PUT /products/{id}/quantity` - Actualizar cantidad
- `PUT /products/{id}/increment` - Incrementar cantidad
- `PUT /products/{id}/decrement` - Decrementar cantidad
- `DELETE /products/{id}` - Eliminar producto
- `POST /get-product-by-barcode` - Buscar producto por código de barras
