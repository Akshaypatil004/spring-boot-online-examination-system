package com.akshay.onlineexam.dto.question;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class OptionResponse {

    private Long id;

    private String optionText;

    private String optionLabel;
}