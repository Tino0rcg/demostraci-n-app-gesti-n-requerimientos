# 💻 OnlineDesk — Sistema Inteligente de Soporte Técnico y Control de SLA

> **Plataforma web y móvil para empresas que automatiza la atención de requerimientos informáticos y soporte técnico, garantizando que cada problema se resuelva dentro de los tiempos prometidos por contrato.**

---

## 🌟 ¿Qué es en pocas palabras?
**OnlineDesk** es una aplicación moderna (disponible para computadoras y teléfonos móviles) que ayuda a empresas de tecnología y áreas de soporte a **recibir, organizar y solucionar los problemas de sus clientes sin demoras ni mensajes perdidos**.

Funciona como un centro de control digital donde los clientes solicitan ayuda, el sistema asigna automáticamente al técnico idóneo según su especialidad y carga de trabajo, y ambas partes colaboran en un chat en vivo hasta que el problema queda resuelto y formalmente aprobado.

---

## 🛑 El problema que resuelve en la vida real
En la mayoría de las empresas, cuando a un trabajador se le corta internet, le falla el computador o un programa corporativo:
- Se envían correos electrónicos que tardan horas en ser leídos.
- Se escriben mensajes por WhatsApp que terminan dispersos o sin seguimiento.
- Los técnicos no tienen claridad sobre qué tarea priorizar.
- La gerencia no tiene forma de auditar si se están cumpliendo los tiempos acordados por contrato (**SLA / Acuerdos de Nivel de Servicio**).

👉 **OnlineDesk centraliza todo el ciclo de vida del incidente**: mide los tiempos de respuesta con cronómetros automáticos, asigna tareas equitativamente y envía notificaciones push al celular cuando hay novedades.

---

## 🚀 ¿Cómo funciona el recorrido?

1. **El usuario ingresa su solicitud**: Selecciona el tipo de servicio afectado (ej: *Internet, Computador, Software o Cuentas*) y puede adjuntar capturas de pantalla o fotos del error.
2. **Asignación inteligente del especialista**: El algoritmo analiza la categoría requerida y asigna el ticket al técnico calificado con menor número de casos activos.
3. **El cronómetro inicia su marcha (SLA)**: Cada servicio tiene un tiempo máximo garantizado de solución. La plataforma muestra indicadores visuales (verde, amarillo o rojo) según la proximidad del vencimiento.
4. **Colaboración en vivo**: Cliente y técnico disponen de un chat directo integrado en la solicitud, con soporte de notificaciones instantáneas y aviso de *"escribiendo..."*.
5. **Validación y cierre formal**: Una vez aplicada la solución técnica, el cliente recibe una solicitud de aprobación en pantalla para **Aceptar** o **Rechazar** el cierre según su conformidad.

---

## ✨ Funcionalidades Destacadas

- ⏱️ **Cronómetros de Compromiso (SLA) con Pausa Inteligente**: Supervisión de tiempos en tiempo real. Cuando el ticket pasa a *Espera de Aprobación*, el contador se congela automáticamente para no penalizar al técnico mientras el cliente evalúa la solución.
- 💬 **Chat Instantáneo de Latencia Cero**: Mensajería reactiva vía WebSockets y actualización optimista local (0 ms de espera para el emisor y entrega en <50 ms para el receptor).
- 🔔 **Notificaciones Push para Móviles (PWA)**: Compatible con Android e iPhone (iOS 16.4+ standalone), notificando al usuario en su celular incluso con la app cerrada.
- 🤖 **Balanceo Automático de Carga de Trabajo**: Distribución equitativa de tareas para evitar sobrecargas técnicas.
- 📊 **Panel de Analítica y Métricas**: Gráficos interactivos de demanda por empresa cliente, puntualidad técnica por categoría y alarmas de tickets en riesgo.
- 🏢 **Multi-Empresa con Roles (RBAC)**: Accesos segmentados para Administrador Global, Administrador de Empresa Cliente, Técnico de Soporte y Usuario Final.

---

## 🛠️ Tecnologías Utilizadas

- **Frontend**: Next.js 15 (App Router, Turbopack), React 19, TypeScript.
- **Diseño & UI**: Tailwind CSS, Radix UI, componentes Shadcn/UI, Lucide Icons.
- **Base de Datos & Backend**: Supabase (PostgreSQL, Row Level Security - RLS, Storage para imágenes).
- **Tiempo Real**: Supabase Realtime (WebSockets bidireccionales y canales de presencia).
- **Inteligencia Artificial**: Google Genkit (`@genkit-ai/google-genai`) para triage y clasificación.
- **Notificaciones**: Web Push API (VAPID + Service Worker), Nodemailer (SMTP), Twilio (SMS).
- **Visualización**: Recharts para tableros dinámicos.

---

## 💻 Instalación y Despliegue Local

1. **Clonar repositorio**:
   ```bash
   git clone https://github.com/Tino0rcg/Gesti-n-de-requerimientos-APP.git
   cd Gesti-n-de-requerimientos-APP
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Configurar variables de entorno** en `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
   SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=tu_vapid_public_key
   VAPID_PRIVATE_KEY=tu_vapid_private_key
   ```

4. **Ejecutar servidor de desarrollo**:
   ```bash
   npm run dev
   ```
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador.
