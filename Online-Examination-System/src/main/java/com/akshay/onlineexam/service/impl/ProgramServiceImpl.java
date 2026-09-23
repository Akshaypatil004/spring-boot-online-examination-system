package com.akshay.onlineexam.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.akshay.onlineexam.dto.program.ProgramRequest;
import com.akshay.onlineexam.dto.program.ProgramResponse;
import com.akshay.onlineexam.entity.AcademicProgram;
import com.akshay.onlineexam.entity.ProgramStatus;
import com.akshay.onlineexam.exception.DuplicateResourceException;
import com.akshay.onlineexam.exception.ResourceNotFoundException;
import com.akshay.onlineexam.repository.AcademicProgramRepository;
import com.akshay.onlineexam.service.ProgramService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProgramServiceImpl implements ProgramService {

    private final AcademicProgramRepository programRepository;

    @Override
    public ProgramResponse createProgram(ProgramRequest request) {

        if (programRepository.existsByCode(request.getCode())) {
            throw new DuplicateResourceException(
                "Program code already exists"
            );
        }

        AcademicProgram program = new AcademicProgram();

        program.setName(request.getName());
        program.setCode(request.getCode());
        program.setDurationYears(request.getDurationYears());
        program.setDepartment(request.getDepartment());

        // Set your entity's ACTIVE enum value
        program.setStatus(ProgramStatus.ACTIVE);

        AcademicProgram savedProgram =
            programRepository.save(program);

        return toResponse(savedProgram);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProgramResponse> getAllPrograms() {

        return programRepository.findAll()
            .stream()
            .map(this::toResponse)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ProgramResponse getProgramById(Long id) {

        AcademicProgram program =
            programRepository.findById(id)
                .orElseThrow(() ->
                    new ResourceNotFoundException(
                        "Academic program not found with id: " + id
                    )
                );

        return toResponse(program);
    }

    @Override
    public ProgramResponse updateProgram(
            Long id,
            ProgramRequest request) {

        AcademicProgram program =
            programRepository.findById(id)
                .orElseThrow(() ->
                    new ResourceNotFoundException(
                        "Academic program not found with id: " + id
                    )
                );

        if (!program.getCode().equals(request.getCode())
                && programRepository.existsByCode(request.getCode())) {

            throw new DuplicateResourceException(
                "Program code already exists"
            );
        }

        program.setName(request.getName());
        program.setCode(request.getCode());
        program.setDurationYears(request.getDurationYears());
        program.setDepartment(request.getDepartment());

        AcademicProgram updatedProgram =
            programRepository.save(program);

        return toResponse(updatedProgram);
    }

    @Override
    public void deleteProgram(Long id) {

        AcademicProgram program =
            programRepository.findById(id)
                .orElseThrow(() ->
                    new ResourceNotFoundException(
                        "Academic program not found with id: " + id
                    )
                );

        programRepository.delete(program);
    }

    private ProgramResponse toResponse(AcademicProgram program) {

        return new ProgramResponse(
            program.getId(),
            program.getName(),
            program.getCode(),
            program.getDurationYears(),
            program.getDepartment(),
            program.getStatus()
        );
    }
}