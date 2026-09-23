package com.akshay.onlineexam.dto.attempt;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AttemptQuestionResponse {

    private Long questionId;

    private String questionText;

    private Integer marks;

    private Integer questionOrder;

    private List<AttemptOptionResponse> options;
}