package com.akshay.onlineexam.dto.subject;

import com.akshay.onlineexam.entity.SubjectStatus;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class SubjectResponse {

    private Long id;
    private String name;
    private String description;

    private Long academicProgramId;
    private String academicProgramName;

    private SubjectStatus status;
}