package com.akshay.onlineexam.dto.question;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OptionRequest {

    @NotBlank
    @Size(max = 500)
    private String optionText;

    @NotBlank
    @Size(max = 5)
    private String optionLabel;

    private boolean correct;
}