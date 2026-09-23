package com.akshay.onlineexam.dto.attempt;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AnswerResponse {

    private Long questionId;
    private Long selectedOptionId;
    private String message;
}