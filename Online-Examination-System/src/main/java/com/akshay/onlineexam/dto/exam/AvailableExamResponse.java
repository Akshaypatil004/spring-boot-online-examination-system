package com.akshay.onlineexam.dto.exam;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AvailableExamResponse {

    private Long id;

    private String title;

    private String description;

    private Long subjectId;

    private String subjectName;

    private Integer durationMinutes;

    private Integer totalMarks;

    private Integer passingMarks;

    private LocalDateTime startTime;

    private LocalDateTime endTime;
}