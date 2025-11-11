# 🏪 Kiosco App – Sistema Web de Ventas, Caja y Control de Stock

Aplicación web desarrollada en **Django (backend)** y **React (frontend)** para la gestión integral de un kiosco o pequeño comercio.

Permite registrar productos, realizar ventas, manejar caja diaria, clientes con cuenta corriente y obtener reportes detallados de movimientos.  
Está pensada para **uso personal o de pequeños emprendimientos**, pero con proyección a múltiples usuarios y negocios.

---

## 🚀 Características principales

✅ **Punto de venta (POS)** con interfaz simple e intuitiva.  
✅ **Apertura obligatoria de caja** al inicio del día.  
✅ **Movimientos de caja** (ingresos, egresos, cierres).  
✅ **Clientes y cuenta corriente** (sin límite de crédito).  
✅ **Gestión de productos** con stock y categorías.  
✅ **Reportes diarios y por producto/categoría/método de pago.**  
✅ **Configuración personalizable** (nombre del negocio, color, logo, impresión automática).  
✅ **Autenticación JWT** (admin y empleado).  
✅ **Interfaz adaptable** y moderna (React + Vite).

---

## 🧠 Objetivo del proyecto

Este sistema nació como una **solución personal** para organizar el kiosco y controlar ventas, stock y caja de forma eficiente, sin depender de planillas o software costoso.  
El objetivo a futuro es ofrecerlo como **herramienta para otros emprendedores** con necesidades similares.

---

## 🛠️ Tecnologías utilizadas

### 🔹 Backend (API REST)
- [Django 5](https://www.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [Simple JWT](https://django-rest-framework-simplejwt.readthedocs.io/)
- [Pillow](https://pillow.readthedocs.io/) (para manejo de imágenes)

### 🔹 Frontend
- [React 18](https://react.dev/)
- [Vite](https://vitejs.dev/)
- Axios para llamadas a la API
- Tailwind y CSS Utility para estilos

### 🔹 Base de datos
- SQLite (por defecto)  
- Soporte proyectado para PostgreSQL

---




---

## ⚙️ Instalación y ejecución

### 🔹 1. Clonar el repositorio

git clone https://github.com/anton-caceres/kiosco-app.git
cd kiosco-app

#BACKEND
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser  # crear usuario admin
python manage.py runserver

API disponible en: http://127.0.0.1:8000/api/
Admin Django: http://127.0.0.1:8000/admin/

#FRONTEND
cd ../frontend
npm install
npm run dev


Frontend en: http://localhost:5173

Usuario administrador: usuario admin — contraseña Admin2025!

Usuario empleado: usuario empleado — contraseña Empleado2025!



## 📂 Estructura del proyecto

