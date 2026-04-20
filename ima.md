# 🛠️ CORRECCIÓN DE BUG EN FRONTEND (Track B): Select dinámico de "Tamaño"

Actuando como Desarrollador Frontend (Track B), necesito que corrijas un error lógico en las opciones del menú desplegable "Tamaño" dentro del formulario de mascota.

## Problema detectado:
Actualmente, cuando el usuario selecciona "Tipo: Gato" y una raza (ej. Siamés), el select de "Tamaño" muestra opciones estáticas correspondientes a perros (ej. "Mediano — 10 - 25 kg en adulto", "Gigante — Más de 45 kg"). Esto es incorrecto y contradice la "Tabla B: Peso ideal de Gatos" del SRS, donde los gatos solo se clasifican en `Mediano` o `Grande`, y sus pesos son radicalmente menores (3 a 11 kg máximo).

## Instrucciones de Solución (React):
1. **Limpieza de Opciones Estáticas:** Elimina el texto harcodeado de los pesos dentro de las etiquetas `<option>`. El texto visible solo debe ser el tamaño (ej. "Pequeño", "Mediano", "Grande"), ya que el rango de peso real depende de la raza, no solo de la complexión.
2. **Dependencia Tipo -> Tamaño:** Modifica el componente para que las opciones del campo "Tamaño" cambien dinámicamente según el `Tipo de Mascota` seleccionado:
   - Si `Tipo === 'Gato'`: El select SOLO debe mostrar las opciones `Mediano` y `Grande` (Según Tabla B).
   - Si `Tipo === 'Perro'`: El select debe mostrar `Mini`, `Pequeño`, `Mediano`, `Grande` y `Muy grande` (Según Tabla A y el catálogo del SRS).
3. **Auto-asignación (Mejora UX):** Basándonos en las Tablas A y B del SRS, cada Raza ya tiene un Tamaño fijo asignado (Ej. Siamés SIEMPRE es Mediano, Maine Coon SIEMPRE es Grande). Por lo tanto, crea un `useEffect` que detecte cuando el usuario elige la "Raza":
   - El formulario debe auto-seleccionar el "Tamaño" correspondiente en el estado.
   - El campo "Tamaño" debería ponerse en modo `disabled` (solo lectura) una vez que se auto-complete, ya que es un dato biológico fijo de la raza.

**Restricción de Track:** Realiza estos cambios estrictamente en los componentes de interfaz dentro de la carpeta `/frontend`. No modifiques modelos ni endpoints del `/backend`. Entrégame el código del componente React actualizado con los Mocks correspondientes de las Tablas A y B.