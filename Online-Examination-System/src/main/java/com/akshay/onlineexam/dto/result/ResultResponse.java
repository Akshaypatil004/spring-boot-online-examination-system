package com.akshay.onlineexam.dto.result;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ResultResponse {

    private Long resultId;

    private Long attemptId;

    private Integer totalQuestions;

    private Integer attemptedQuestions;

    private Integer correctAnswers;

    private Integer wrongAnswers;

    private Integer unansweredQuestions;

    private Integer score;

    private BigDecimal percentage;

    private String resultStatus;
}