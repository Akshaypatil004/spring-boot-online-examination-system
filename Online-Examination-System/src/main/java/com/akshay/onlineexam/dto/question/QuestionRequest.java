package com.akshay.onlineexam.dto.question;

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
public class QuestionRequest {

    @NotBlank
    @Size(max = 2000)
    private String questionText;

    @NotNull
    @Min(1)
    private Integer marks;

    @NotNull
    @Min(1)
    private Integer questionOrder;
}