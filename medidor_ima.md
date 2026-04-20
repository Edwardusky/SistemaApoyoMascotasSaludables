# 🛠️ CORRECCIÓN DE BUG EN FRONTEND (Track B): Componente IMA Dinámico

Actuando como Desarrollador Frontend (Track B), necesito que corrijas un bug visual y lógico en el componente del formulario de "Datos de la Mascota" (Registro de solicitud de apoyo).

## Problema detectado:
1. **Faltan estados en la UI:** Actualmente el medidor de ÍNDICE DE MASA ANIMAL (IMA) en la parte lateral derecha solo muestra 3 estados. Debe mostrar 4 estados exactos según el SRS: `Bajo peso`, `Peso ideal`, `Sobrepeso`, y `Obeso`.
2. **Falta de reactividad:** El medidor visual (slider/gauge) no aumenta ni disminuye. Es estático y no responde a lo que el usuario escribe en los inputs.

## Instrucciones de Solución (React):
1. **Corrección Visual:** Modifica el componente del medidor IMA para que su escala de colores y etiquetas abarque los 4 estados mencionados.
2. **Lógica Dinámica (Mock temporal):** - Crea un diccionario/mock temporal en el frontend que contenga los pesos ideales de las Tablas A y B del SRS (ej. Chihuahua: 2-3kg, Siamés: 3-5kg).
   - Utiliza `useEffect` para escuchar los cambios en los estados de `razaSeleccionada` y `pesoActual`.
3. **Algoritmo de Cálculo Frontend:** Cuando el usuario seleccione una raza y teclee un peso, calcula dinámicamente el estado:
   - Si `pesoActual` < `peso_min` -> Retorna "Bajo peso"
   - Si `pesoActual` >= `peso_min` y <= `peso_max` -> Retorna "Peso ideal"
   - Si `pesoActual` > `peso_max` pero <= (`peso_max` * 1.20) -> Retorna "Sobrepeso" (hasta 20% arriba del máximo).
   - Si `pesoActual` > (`peso_max` * 1.20) -> Retorna "Obeso".
4. **Enlace al Componente:** Pasa este resultado calculado como *prop* al componente visual del IMA para que el marcador (el punto en la barra) se mueva automáticamente en tiempo real a la zona de color correspondiente mientras el usuario escribe el peso.

**Restricción:** Realiza estos cambios estrictamente en los componentes de React (`/frontend`). No modifiques nada del backend en este paso. Dame el código del componente actualizado.