package com.akshay.onlineexam.dto.program;

import com.akshay.onlineexam.entity.ProgramStatus;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ProgramResponse {

    private Long id;
    private String name;
    private String code;
    private Integer durationYears;
    private String department;
    private ProgramStatus status;
}