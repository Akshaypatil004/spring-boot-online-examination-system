package com.akshay.onlineexam.dto.question;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class QuestionResponse {

    private Long id;

    private Long examId;

    private String questionText;

    private Integer marks;

    private Integer questionOrder;

    private String status;
}