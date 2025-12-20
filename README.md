# MiTurno – Plataforma de Gestión de Turnos  
Proyecto – Práctica Profesional Supervisada (PPS)

---

## Descripción general

MiTurno es una plataforma web para la gestión de turnos entre usuarios y empresas de servicios.  
Permite a los clientes reservar turnos de forma simple y a las empresas administrar servicios, horarios y turnos desde un único sistema.

El proyecto fue desarrollado como trabajo final de la materia **Práctica Profesional Supervisada**, aplicando conceptos de ingeniería de software, desarrollo web y trabajo colaborativo.

---
##  Instalación y ejecución

###  Ejecutar con Live Server 

1. **Clonar el repositorio**:
   ```bash
   git clone [https://github.com/T-M-Barrick/pps.git](https://github.com/T-M-Barrick/pps.git)
   
2. Abrir el proyecto en Visual Studio Code.

3. Instalar la extensión Live Server de VS Code.

4. Abrir el archivo index.html en el editor y ejecutar “Open with Live Server”.

La aplicación se abrirá automáticamente en el navegador.
---

## Objetivos del proyecto

- Centralizar la gestión de turnos en una sola plataforma  
- Reducir errores de organización y superposición de turnos  
- Facilitar el uso del sistema para usuarios no técnicos  
- Aplicar metodologías ágiles y buenas prácticas de desarrollo  

---

## Usuarios y roles

### Usuario cliente
- Reserva turnos  
- Consulta historial  
- Visualiza estados de sus turnos  

### Empresa
- **Propietario**: administración general  
- **Gerente**: gestión operativa  
- **Empleado**: visualización y atención de turnos  

---

## Alcance del sistema

El sistema permite:
- Registro y autenticación de usuarios  
- Gestión de empresas y servicios  
- Reserva, modificación y cancelación de turnos  
- Control de acceso según roles  

Fuera del alcance actual:
- Pagos en línea  
- Notificaciones automáticas  
- Aplicación móvil nativa  

---

## Arquitectura del sistema

El sistema utiliza una arquitectura **cliente–servidor**:

- **Frontend**: interfaz visual del usuario  
- **Backend**: lógica del sistema y validación de datos  
- **Comunicación**: API REST con intercambio de datos en formato JSON  

---

## Tecnologías utilizadas

### Frontend
- HTML5  
- CSS3  
- JavaScript (Vanilla)

### Backend
- Python  
- FastAPI  

### Seguridad
- Autenticación basada en JWT

### Gestión del proyecto
- GitHub (control de versiones)  
- Trello (gestión de tareas)

---

## Estructura del proyecto

```text
/
├── index.html
├── pages/
│   ├── usuario/
│   ├── empresa/
├── css/
├── js/
├── config.js
├── Dockerfile
└── README.md

```
---
## Uso del sistema

### Cliente
1. Accede al sistema
2. Selecciona una empresa
3. Elige servicio, fecha y horario
4. Confirma el turno

### Empresa
1. Accede al panel de administración
2. Gestiona servicios y horarios
3. Visualiza y administra turnos

---

## Metodología de trabajo

Se utilizó una metodología ágil basada en SCRUM, con apoyo de tableros tipo Kanban en Trello para la organización y seguimiento de tareas.

---

## Requisitos del sistema

- Navegador web moderno
- Conexión a Internet
- Compatible con PC y dispositivos móviles
- No requiere hardware especializado

---

## Futuras mejoras

- Integración de pagos en línea

- Notificaciones automáticas de turnos

- Aplicación móvil

- Reportes y estadísticas para empresas

---

## Contexto académico

Proyecto desarrollado en el marco de la materia Práctica Profesional Supervisada, integrando conocimientos técnicos y metodológicos adquiridos durante la carrera.

## Autores

Proyecto desarrollado por el equipo de MiTurno. <br>

Estudiantes:<br>

Lucas Conte (Diseño)

Fiamma Micheloni (Diseño)

Eduardo Morales (Backend)

Agustina Del Castillo (Frontend)

Priscila Ohannecian (Frontend)

Tomás Rossi (Backend)


## Licencia

*Proyecto académico – uso educativo.*
