---
name: apple-design
description: Aplica el sistema de diseño de Apple (Human Interface Guidelines), estética minimalista, tipografía limpia, componentes bento box y micro-interacciones. Usa esta regla cuando el usuario pida diseñar componentes, landing pages o modificar estilos de interfaz.
---

# Apple Web & App Design System

Cuando construyas componentes de interfaz o páginas web, sigue estrictamente las siguientes directrices de diseño inspiradas en Apple:

## 1. Tipografía y Estructura
- **Fuentes:** Usa fuentes sans-serif neutras como `SF Pro Display`, `SF Pro Text`, `Inter` o fuentes del sistema (`-apple-system`, `BlinkMacSystemFont`).
- **Jerarquía:** Encabezados grandes (`text-4xl` a `text-6xl`), limpios, con un tracking estrecho (`tracking-tight`) y contraste alto sobre fondos claros u oscuros.

## 2. Paleta de Colores y Superficies
- **Fondos:** Fondos neutros de alto contraste (`#FFFFFF`, `#F5F5F7` para modo claro / `#000000`, `#161617` para modo oscuro).
- **Efectos de Cristal (Bento Box / Glassmorphism):** Utiliza bordes sutiles de `1px` (`border-black/5` o `border-white/10`), fondos semitransparentes con desenfoque (`backdrop-blur-md` o `backdrop-blur-xl`) y bordes muy redondeados (`rounded-2xl` o `rounded-3xl`).
- **Sombras:** Sombras extremadamente suaves y difuminadas (`shadow-sm` o sombras personalizadas con muy baja opacidad).

## 3. Espaciado y Layout
- Usa layouts organizados tipo **Bento Grid** (tarjetas modulares e independientes).
- Aplica un espaciado generoso (*whitespace*) para dar aire a los elementos. Evita recargar las pantallas.
- Asegura centrado visual impecable de textos e imágenes principales.

## 4. Botones e Interacciones
- Botones principales redondeados (`rounded-full`), con colores sólidos (azul Apple `#0071E3` o negro puro `#000000`).
- Animaciones fluidas, cortas e hiper-suaves mediante transiciones con `cubic-bezier` o `framer-motion` (`ease-out`, duración ~200ms - 300ms).
- Micro-interacciones sutiles al pasar el cursor (`hover:scale-[1.02] active:scale-[0.98]`).

## 5. Fotografía y Renderizado de Producto
- Presenta capturas o imágenes integradas dentro de maquetas con bordes curvos y sombras suaves.
- El producto siempre debe ser el héroe visual central de la sección.