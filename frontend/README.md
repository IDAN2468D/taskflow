# TaskFlow Pro - Next.js 15 Frontend

ממשק המשתמש המודרני של **TaskFlow Pro**, שנבנה כדי להחליף את תבניות ה-HTML הישנות בטכנולוגיות המובילות:
* **Next.js 15 (App Router)**
* **React 19 & TypeScript**
* **Tailwind CSS & Lucide Icons**
* **ארכיטקטורת REST / WebSocket מול Spring Boot 3 Backend**

---

## 🚀 הרצה מקומית (Development)

1. התקנת תלויות:
```bash
npm install
```

2. הרצת שרת הפיתוח:
```bash
npm run dev
```
האפליקציה תהיה זמינה בכתובת: `http://localhost:3000`

---

## 🐳 הרצה באמצעות Docker

```bash
docker build -t taskflow-frontend .
docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL=http://localhost:8080/api taskflow-frontend
```

---

## 📁 מבנה התיקיות
```
frontend/
├── src/
│   ├── app/                 # Next.js App Router (דפים ונתיבים)
│   │   ├── page.tsx         # דשבורד ו-KPIs
│   │   ├── kanban/page.tsx  # לוח משימות Kanban אינטראקטיבי
│   │   ├── login/page.tsx   # מסך כניסה והרשמה מאובטח (JWT)
│   │   └── layout.tsx       # Root layout עם תמיכת RTL
│   ├── components/
│   │   ├── layout/          # Sidebar, Header
│   │   ├── kanban/          # KanbanBoard, TaskCard
│   │   └── tasks/           # TaskModal, AI Decomposition
│   ├── lib/
│   │   ├── api.ts           # לקוח ה-REST API מול ה-Backend
│   │   └── auth-context.tsx # ניהול Context לאימות וטוקנים
│   └── types/
│       └── index.ts         # טיפוסי נתונים תואמי Spring Boot DTOs
├── Dockerfile               # תמונת Docker מבוססת Alpine
├── package.json
└── tailwind.config.ts
```
