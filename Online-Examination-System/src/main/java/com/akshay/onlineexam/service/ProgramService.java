package com.akshay.onlineexam.service;

import java.util.List;

import com.akshay.onlineexam.dto.program.ProgramRequest;
import com.akshay.onlineexam.dto.program.ProgramResponse;

public interface ProgramService {

    ProgramResponse createProgram(ProgramRequest request);

    List<ProgramResponse> getAllPrograms();

    ProgramResponse getProgramById(Long id);

    ProgramResponse updateProgram(Long id, ProgramRequest request);

    void deleteProgram(Long id);
}