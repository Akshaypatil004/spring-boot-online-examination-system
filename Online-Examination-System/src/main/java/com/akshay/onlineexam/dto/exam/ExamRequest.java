package com.akshay.onlineexam.dto.exam;

import java.time.LocalDateTime;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ExamRequest {

    @NotNull
    private Long subjectId;

    @NotBlank
    @Size(max = 150)
    private String title;

    @Size(max = 1000)
    private String description;

    @NotNull
    @Min(1)
    private Integer durationMinutes;

    @NotNull
    @Min(1)
    private Integer totalMarks;

    @NotNull
    @Min(1)
    private Integer passingMarks;

    @NotNull
    @Future
    private LocalDateTime startTime;

    @NotNull
    private LocalDateTime endTime;
}