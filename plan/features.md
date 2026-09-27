# Features de gscontrolwebadmin

Registro vivo de funcionalidades. Aquí se van agregando conforme se definan, y desde aquí pasan al
plan de trabajo cuando toca construirlas. El plan de la etapa actual está en
[gscontrolweb_plan.md](gscontrolweb_plan.md).

Cómo usar este archivo: agregar la funcionalidad en **Por definir** cuando surja la idea, moverla a
**En construcción** cuando se empiece, y a **Listo** cuando quede terminada y verificada.

---

## Etapa actual: panel interno de INTECONAYC

### En construcción

Nada en esta etapa.

### Listo

**Acceso exclusivo de INTECONAYC**
Login con correo y contraseña contra `usuarios_admin`. Sin registro público y sin acceso de clientes
todavía. Las cuentas se crean a mano desde el seed. Todo el panel queda detrás del login.

**Administración de empresas clientes**
Alta, edición y baja de empresas. Ficha con código, nombre comercial, razón social, RFC, datos de
contacto, estado y notas. Listado con búsqueda, filtro por estado y orden por columna.

**Parámetros de conexión por empresa**
Capturar cómo conectarse a la base que usará cada empresa: host, puerto, nombre de la base, usuario
y contraseña, más los datos de túnel SSH si vive en otro servidor. La contraseña se guarda cifrada
con AES-256-GCM, nunca en claro. Incluye una acción de probar conexión que registra la fecha de la
última verificación exitosa.

**Catálogo de planes**
Planes con código, nombre, descripción, precio, moneda, periodicidad sugerida y límites de
empleados, dispositivos y usuarios.

**Suscripciones**
Asignar un plan a una empresa con fecha de inicio, fecha de fin, precio pactado, periodicidad,
renovación automática y estado (prueba, activa, vencida, cancelada).

**Alertas de vencimiento**
Avisar cuando una suscripción está por vencer, a 30, 15 y 7 días, y cuando ya venció. Se muestran
como resumen en el tablero de inicio y como etiqueta de color en el listado de empresas.

**Interfaz limpia y actual**
Barra lateral fija, paleta neutra con un solo acento, color reservado para los estados, tema claro y
oscuro, tablas con filtros y formularios con validación en línea.

---

## Por definir

Ideas y necesidades ya mencionadas que aún no tienen diseño ni fecha.

### Sobre el panel de administración

- Envío de las alertas de vencimiento por correo, además de mostrarlas en pantalla.
- Aprovisionamiento automático: crear la base de datos de una empresa nueva desde una plantilla, sin hacerlo a mano.
- Facturación: importes, pagos, saldo y comprobantes ligados a la suscripción.
- Bitácora de auditoría de accesos y de cambios sobre las cuentas.
- Permisos finos por usuario dentro de INTECONAYC; hoy todas las cuentas tienen el mismo alcance.

### Sobre el producto para las empresas cliente

- Portal de acceso para cada empresa, con su propio login.
- Catálogos de RH: áreas, departamentos, puestos, sucursales y cuadrillas.
- Plantilla de empleados.
- Horarios y turnos.
- Programaciones y reglas de asignación de turnos.
- Kárdex de incidencias por empleado.
- Registro de asistencia y su cálculo contra el horario asignado.
- Reportes de asistencia e incidencias generados con IA, sobre un conjunto acotado de consultas
  parametrizadas en lugar de SQL libre.
- Prenómina y exportación hacia el sistema de nómina.

### Sobre la infraestructura

- Definir dónde se despliega la aplicación.
- Servicio independiente para la sincronización de los relojes biométricos, fuera de Next.js, por el
  volumen de registros que genera.
- Actualizar MariaDB: la versión 10.3 del servidor es de 2018 y ya no tiene soporte.
