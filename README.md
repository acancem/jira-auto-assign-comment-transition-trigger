# Jira Auto Assign, Comment & Transition Trigger

Automatización en **Google Apps Script** para gestionar tickets de Jira Cloud de forma automática:

- **Asigna** el ticket a un usuario específico.  
- **Transiciona** el estado del ticket (por nombre o por ID).  
- **Agrega comentarios públicos** en Jira Service Management.  
- Evita **comentarios duplicados** y reprocesar tickets.  

Todo esto a partir de correos entrantes de suscripciones de Jira filtrados en Gmail.

---

## 🚀 Características principales
- Detección de claves de issue (`ABC-123`) en asunto, cuerpo o enlaces.  
- Integración con **Jira Cloud REST API v3**.  
- Configuración sencilla usando **Script Properties**.  
- Uso de **GmailApp** para procesar correos con filtros.  
- Evita reprocesar tickets ya tratados (cache 4h).  

---

## 📂 Estructura del repositorio
jira-auto-assign-comment-transition-trigger/
│
├── src/
│ └── Code.gs # Script principal de Apps Script
│
├── docs/
│ ├── guia.md # Guía detallada de instalación y configuración
│ └── img/ # Carpeta para imágenes de la guía
│ ├── jira-filtro.png
│ ├── jira-suscripcion-menu.png
│ └── jira-suscripcion-intervalo.png
│
├── LICENSE # MIT License
└── README.md # Este archivo


---

## ⚙️ Configuración en Apps Script

1. Crea un proyecto nuevo en [Google Apps Script](https://script.google.com/).  
2. Copia el contenido de [`src/Code.gs`](src/Code.gs) en tu proyecto.  
3. Ve a **Project Settings → Script Properties** y añade las siguientes variables:

| Property                    | Ejemplo                                       | Descripción |
|-----------------------------|-----------------------------------------------|-------------|
| `JIRA_BASE`                 | `https://tuorg.atlassian.net/`                | URL base de tu instancia de Jira |
| `JIRA_USER_EMAIL`           | `tu.email@empresa.com`                        | Correo Atlassian |
| `JIRA_API_TOKEN`            | `xxxxxxxx`                                    | Token de API de Atlassian |
| `JIRA_ASSIGNEE_ACCOUNT_ID`  | `xxxxxxxxxxxxxxxxxxxxxxxx`                    | AccountId del usuario asignado |
| `COMMENT_PUBLIC`            | `true`                                        | Habilitar comentario público |


---

## ⏱️ Trigger en Google Apps Script
1. En el menú de Apps Script, entra a **Triggers**.  
2. Crea un nuevo trigger:  
   - Function: `checkJiraEmails`  
   - Event source: **Time-driven**  
   - Interval: cada 5–15 min (según necesidad).  

El trigger se encargará de buscar correos de Jira con el filtro configurado y procesarlos.

---

## 📘 Guía completa
La guía detallada de instalación y configuración está en [`docs/guia.md`](docs/guia.md).  

---

## 📄 Licencia
Este proyecto está bajo licencia [MIT](LICENSE).  
Puedes usarlo, modificarlo y compartirlo libremente, dando crédito al autor.

---

## ✨ Autor
Creado por **Aaron Cance**  
📧 Contacto: [aaron.cance@gmail.com](mailto:aaron.cance@gmail.com)
