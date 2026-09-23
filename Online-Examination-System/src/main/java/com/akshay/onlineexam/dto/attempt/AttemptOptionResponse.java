package com.akshay.onlineexam.dto.attempt;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AttemptOptionResponse {

    private Long id;

    private String optionLabel;

    private String optionText;
}