package com.akshay.onlineexam.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/student")
public class StudentTestController {

    @GetMapping("/test")
    public ResponseEntity<String> testStudentAccess() {
        return ResponseEntity.ok("STUDENT access granted");
    }
}