# 🚀 CVcraft

**CVcraft** is a high-performance, full-stack resume builder designed to create professional, ATS-friendly resumes. Built using the **FARM Stack** (FastAPI, React, MongoDB), it features a modern UI with real-time preview and client-side PDF generation.

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

---

## 📸 Screenshots
| Dashboard | Editor Interface |
|:---:|:---:|
| ![Dashboard Shot](https://github.com/KartikSharma4448/CVCraft/blob/main/frontend/public/Screenshot%202025-12-01%20200944.png) | ![Editor Shot](https://github.com/KartikSharma4448/CVCraft/blob/main/frontend/public/Screenshot%202025-12-01%20201856.png) |

---

## ✨ Key Features

* **⚡ High-Performance Backend:** Powered by **FastAPI** and **Uvicorn** for lightning-fast API responses.
* **🎨 Modern UI/UX:** Built with **Shadcn/UI** and **Tailwind CSS** for a clean, accessible design.
* **📄 PDF Generation:** robust export functionality using `html2canvas` and `jspdf`.
* **🔄 Real-time Updates:** Instant preview of resume changes.
* **🗄️ Asynchronous Database:** Uses **Motor** (Async Python driver) for efficient non-blocking MongoDB queries.

---

## 🛠️ Tech Stack

### **Frontend (Client)**
* **Framework:** React.js (v18)
* **Styling:** Tailwind CSS
* **Components:** Shadcn/UI (Radix Primitives)
* **Icons:** Lucide React
* **Routing:** React Router DOM
* **Build Tool:** Create React App (via Craco)

### **Backend (Server)**
* **Language:** Python 3.x
* **Framework:** FastAPI
* **Server:** Uvicorn (ASGI)
* **Database:** MongoDB (Atlas/Local)
* **ODM:** Motor (Async Driver)

---

## ⚙️ Installation & Setup

Follow these steps to run the project locally.

### 1. Backend Setup (FastAPI)
Navigate to the server directory and install dependencies.

```bash
cd backend
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Run the server
uvicorn main:app --reload
