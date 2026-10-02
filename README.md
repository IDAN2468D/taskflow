# 🚀 TaskFlow Pro - Distributed & AI-Powered Task Management System

![Java 17](https://img.shields.io/badge/Java-17-orange.svg)
![Spring Boot 3](https://img.shields.io/badge/Spring%20Boot-3.2.4-brightgreen.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)
![Apache Kafka](https://img.shields.io/badge/Apache%20Kafka-3.7-black.svg)
![Elasticsearch](https://img.shields.io/badge/Elasticsearch-8-yellow.svg)
![Docker](https://img.shields.io/badge/Docker-Enabled-blue.svg)

A production-grade, distributed task management platform architected in **Java 17** and **Spring Boot 3**. Fully containerized with Docker, featuring event-driven architecture with Apache Kafka, real-time full-text search with Elasticsearch, and AI task decomposition with Google Gemini.

---

## 🏛️ System Architecture

* **Core Framework:** Spring Boot 3 with layered MVC architecture (`Controller`, `Service`, `Repository`).
* **Security & Auth:** Spring Security 6 with stateless JWT authentication, BCrypt password hashing, and user-tenant data isolation.
* **Database & Persistence:** PostgreSQL 16 relational database with Spring Data JPA & Hibernate ORM.
* **Event-Driven Architecture:** Apache Kafka (KRaft mode) for real-time asynchronous event publishing (`TASK_CREATED`, `TASK_DELETED`).
* **Fast Full-Text Search:** Elasticsearch for multi-field, fuzzy, and search-as-you-type indexing across task titles and descriptions.
* **Asynchronous Operations:** Non-blocking background file processing (`@Async` threads) for attachments.
* **AI Integration:** Google Gemini 1.5 Flash API with Prompt Engineering for automated task decomposition.
* **Automated Testing:** Unit tests with **Mockito** and integration tests with **Spring MockMvc**.
* **Containerization:** Multi-stage `Dockerfile` and `docker-compose.yml` orchestrating the entire multi-service stack.

---

## 🚀 Quick Start (Running 100% in Docker)

Clone the repository and spin up the complete environment in one command:

\`\`\`bash
git clone https://github.com/<YOUR-USERNAME>/taskflow.git
cd taskflow
docker compose up --build -d
\`\`\`

Access the Web Application:
👉 **http://localhost:8080/**

API Documentation (Swagger UI):
👉 **http://localhost:8080/swagger-ui/index.html**