package com.akshay.onlineexam.dto.attempt;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AttemptResponse {

    private Long id;

    private Long examId;

    private String examTitle;

    private LocalDateTime startedAt;

    private LocalDateTime submittedAt;

    private String status;
}