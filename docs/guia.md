Que Jira te envié correos de tickets sin asignar que te toqué
1.	Ir a ver todos los filtros en jira
https://neotel-us.atlassian.net/jira/filters
2.	Crear filtro con búsqueda JQL y guardarlo con un nombre, Ticktes nuevos (sin asignar)
3.	Crear la suscripción
4.	Añade suscripción con el intervalo deseado
5.	En Gmail crea un filtro para esos correos: jira-auto
6.	En asunto pon: Suscripción [JIRA]: Tickets nuevos (sin asignar)
7.	Verifica que el correo llegue con el filtro
8.	Crea el API token
9.	Entra a https://id.atlassian.com/manage-profile/profile-and-visibility 
10.	Entra a tokens de API y crea uno con un nombre como AppsScript-Jira-Auto
11.	Guarda el token
12.	Obtén tu accountID de jira, entra a perfil
13.	Cópialo de la URL que se genera https://home.atlassian.com/o/a4de150/people/accountID?cloudId=
14.	Ve a Apps Script de Google: https://script.google.com/home
15.	Crea un nuevo proyecto
16.	Entra a configuración de proyecto y crea los script properties, pega tu token y accoundId
| Property                    | Ejemplo                                       | Descripción |
|-----------------------------|-----------------------------------------------|-------------|
| `JIRA_BASE`                 | `https://tuorg.atlassian.net/`                | URL base de tu instancia de Jira |
| `JIRA_USER_EMAIL`           | `tu.email@empresa.com`                        | Correo Atlassian |
| `JIRA_API_TOKEN`            | `xxxxxxxx`                                    | Token de API de Atlassian |
| `JIRA_ASSIGNEE_ACCOUNT_ID`  | `xxxxxxxxxxxxxxxxxxxxxxxx`                    | AccountId del usuario asignado |
| `COMMENT_PUBLIC`            | `true`                                        | Habilitar comentario público |
17. Copia el codigo de Code.gs a tu proyecto Apps Script
18. Termina creando el trigger en tu proyecto Apps Script
