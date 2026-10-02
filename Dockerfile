# שלב 1: בניית הפרויקט ויצירת קובץ ה-JAR
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# העתקת קובץ התלויות וקוד המקור
COPY pom.xml .
COPY src ./src

# קומפילציה ואריזה לקובץ JAR (דילוג על טסטים בזמן הבנייה)
RUN mvn clean package -DskipTests

# שלב 2: סביבת הריצה של הייצור (קלה ומאובטחת)
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# העתקת ה-JAR שנבנה בשלב הראשון
COPY --from=build /app/target/*.jar app.jar

# יצירת תיקיית הקבצים המועלים
RUN mkdir -p uploads

# חשיפת פורט 8080
EXPOSE 8080

# פקודת ההרצה של השרת
ENTRYPOINT ["java", "-jar", "app.jar"]