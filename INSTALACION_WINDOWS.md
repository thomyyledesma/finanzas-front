# Cómo poner el front a andar — Guía para Windows (desde cero)

Vos no tenés nada instalado todavía. Seguí estos pasos en orden. La primera vez
toma ~15 min; después arrancar el proyecto es un solo comando.

---

## Paso 1 — Instalar Node.js

Node.js es el motor que necesita el proyecto para correr.

1. Entrá a **https://nodejs.org**
2. Descargá la versión que dice **"LTS"** (a junio 2026 es Node 24). NO la "Current".
3. Ejecutá el instalador `.msi` que se descarga.
4. Tildá todo lo que viene por defecto y dale "Next" hasta "Install".
   - Si aparece una opción que dice "Automatically install the necessary tools…",
     dejala destildada, no la necesitás para esto.
5. Cuando termine, **reiniciá la compu** (o al menos cerrá todas las terminales).

**Verificá que quedó bien instalado:**
Abrí la terminal (apretá `Win`, escribí `cmd`, Enter) y escribí:

```
node --version
npm --version
```

Si te muestra dos números de versión (ej: `v24.x.x` y `10.x.x`), ya está. Node trae
npm incluido, no hay que instalarlo aparte.

> Si dice "node no se reconoce como comando", cerrá y reabrí la terminal. Si sigue,
> reiniciá la compu. Node necesita que se refresque el PATH.

---

## Paso 2 — Instalar un editor de código

Si no tenés, instalá **Visual Studio Code** desde **https://code.visualstudio.com**
(es gratis y es el estándar). Instalador normal, todo por defecto.

---

## Paso 3 — Descomprimir el proyecto

1. Tomá el archivo `finanzas-front.zip` que te pasé.
2. Click derecho → "Extraer todo…" → elegí una carpeta fácil de encontrar,
   por ejemplo `C:\Users\TuNombre\Documents\finanzas-front`.
3. Abrí VS Code → menú `File` → `Open Folder…` → elegí esa carpeta.

Deberías ver a la izquierda la estructura: `src/`, `package.json`, `index.html`, etc.

---

## Paso 4 — Instalar las dependencias del proyecto

Dentro de VS Code, abrí la terminal integrada: menú `Terminal` → `New Terminal`
(o `Ctrl + ñ`). Se abre abajo, ya parada en la carpeta del proyecto.

Escribí:

```
npm install
```

Esto baja React y todo lo que el proyecto necesita (lo lee de `package.json`).
Tarda 1-2 min y crea una carpeta `node_modules`. **Esto se hace una sola vez.**

---

## Paso 5 — Configurar la URL del backend

1. En la carpeta del proyecto vas a ver un archivo `.env.example`.
2. Hacé una copia y renombrala a `.env` (sin el `.example`).
   - En VS Code: click derecho sobre `.env.example` → Copy → Paste → renombrá a `.env`.
3. Abrilo. Tiene esta línea:
   ```
   VITE_API_URL=http://localhost:8080
   ```
   Si tu backend corre en el puerto 8080 (el default), dejalo así.

---

## Paso 6 — ¡Arrancar!

Con el backend de Spring Boot corriendo (en otra ventana, como ya lo venías
levantando con `./mvnw spring-boot:run`), en la terminal de VS Code escribí:

```
npm run dev
```

Te va a mostrar algo como:

```
  ➜  Local:   http://localhost:5173/
```

Abrí ese link en el navegador. Deberías ver la pantalla de **login**.
Probá crear una cuenta con "Crear una" → te registra y te lleva al dashboard.

Para frenar el servidor: en la terminal apretá `Ctrl + C`.

---

## El día a día (después de la primera vez)

Cada vez que quieras trabajar en el front:

1. Abrí VS Code en la carpeta del proyecto.
2. Asegurate de que el **backend esté corriendo**.
3. Terminal → `npm run dev`.
4. Listo. Los cambios que guardes se reflejan solos en el navegador (hot reload).

No hace falta volver a hacer `npm install` salvo que agreguemos una librería nueva.

---

## Problemas comunes

- **La pantalla de login carga pero al entrar dice "No se pudo conectar":**
  el backend no está corriendo, o está en otro puerto. Revisá que Spring esté
  levantado y que `VITE_API_URL` en `.env` apunte al puerto correcto.

- **Error de CORS en la consola del navegador (F12):**
  el backend tiene que permitir `http://localhost:5173`. Ya lo dejaste configurado
  en `SecurityConfig`, así que no debería pasar. Si cambiaste el puerto de Vite,
  actualizá `cors.allowed-origins` en el back.

- **"npm no se reconoce":** Node no quedó bien instalado o no reiniciaste. Volvé al Paso 1.

- **Cambié el `.env` y no toma:** frená el server (`Ctrl + C`) y volvé a `npm run dev`.
  Las variables de entorno se leen al arrancar.
