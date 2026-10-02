package com.example.taskflow.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path uploadDir = Paths.get("uploads");

    public FileStorageService() {
        try {
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }
        } catch (IOException e) {
            throw new RuntimeException("לא ניתן ליצור את תיקיית הקבצים", e);
        }
    }

    public String saveFile(MultipartFile file) throws IOException {
        String originalName = file.getOriginalFilename();
        String safeName = UUID.randomUUID().toString() + "_" + originalName;
        Path targetPath = uploadDir.resolve(safeName);
        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
        return safeName;
    }

    public Path getFile(String fileName) {
        return uploadDir.resolve(fileName);
    }
}