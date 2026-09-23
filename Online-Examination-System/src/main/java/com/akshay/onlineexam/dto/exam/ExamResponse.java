package com.akshay.onlineexam.dto.exam;

import java.time.LocalDateTime;

import com.akshay.onlineexam.entity.ExamStatus;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ExamResponse {

    private Long id;

    private Long subjectId;
    private String subjectName;

    private String title;
    private String description;

    private Integer durationMinutes;
    private Integer totalMarks;
    private Integer passingMarks;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    private ExamStatus status;
}