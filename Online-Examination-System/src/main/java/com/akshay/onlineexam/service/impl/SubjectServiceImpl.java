package com.akshay.onlineexam.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.akshay.onlineexam.dto.subject.SubjectRequest;
import com.akshay.onlineexam.dto.subject.SubjectResponse;
import com.akshay.onlineexam.entity.AcademicProgram;
import com.akshay.onlineexam.entity.Subject;
import com.akshay.onlineexam.entity.SubjectStatus;
import com.akshay.onlineexam.exception.DuplicateResourceException;
import com.akshay.onlineexam.exception.ResourceNotFoundException;
import com.akshay.onlineexam.repository.AcademicProgramRepository;
import com.akshay.onlineexam.repository.SubjectRepository;
import com.akshay.onlineexam.service.SubjectService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SubjectServiceImpl implements SubjectService {

    private final SubjectRepository subjectRepository;
    private final AcademicProgramRepository programRepository;

    @Override
    public SubjectResponse createSubject(SubjectRequest request) {

        AcademicProgram program =
            programRepository.findById(request.getAcademicProgramId())
                .orElseThrow(() ->
                    new ResourceNotFoundException(
                        "Academic program not found with id: "
                        + request.getAcademicProgramId()
                    )
                );

        if (subjectRepository.existsByNameAndAcademicProgramId(
                request.getName(),
                request.getAcademicProgramId())) {

            throw new DuplicateResourceException(
                "Subject already exists for this academic program"
            );
        }

        Subject subject = new Subject();

        subject.setName(request.getName());
        subject.setDescription(request.getDescription());
        subject.setAcademicProgram(program);
        subject.setStatus(SubjectStatus.ACTIVE);

        Subject savedSubject =
            subjectRepository.save(subject);

        return toResponse(savedSubject);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SubjectResponse> getAllSubjects() {

        return subjectRepository.findAll()
            .stream()
            .map(this::toResponse)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<SubjectResponse> getSubjectsByProgram(Long programId) {

        // First verify that the program exists
        if (!programRepository.existsById(programId)) {
            throw new ResourceNotFoundException(
                "Academic program not found with id: " + programId
            );
        }

        return subjectRepository
            .findByAcademicProgramId(programId)
            .stream()
            .map(this::toResponse)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public SubjectResponse getSubjectById(Long id) {

        Subject subject =
            subjectRepository.findById(id)
                .orElseThrow(() ->
                    new ResourceNotFoundException(
                        "Subject not found with id: " + id
                    )
                );

        return toResponse(subject);
    }

    @Override
    public SubjectResponse updateSubject(
            Long id,
            SubjectRequest request) {

        Subject subject =
            subjectRepository.findById(id)
                .orElseThrow(() ->
                    new ResourceNotFoundException(
                        "Subject not found with id: " + id
                    )
                );

        AcademicProgram program =
            programRepository.findById(request.getAcademicProgramId())
                .orElseThrow(() ->
                    new ResourceNotFoundException(
                        "Academic program not found with id: "
                        + request.getAcademicProgramId()
                    )
                );

        boolean nameChanged =
            !subject.getName().equals(request.getName());

        boolean programChanged =
            !subject.getAcademicProgram().getId()
                .equals(request.getAcademicProgramId());

        if ((nameChanged || programChanged)
                && subjectRepository.existsByNameAndAcademicProgramId(
                    request.getName(),
                    request.getAcademicProgramId())) {

            throw new DuplicateResourceException(
                "Subject already exists for this academic program"
            );
        }

        subject.setName(request.getName());
        subject.setDescription(request.getDescription());
        subject.setAcademicProgram(program);

        Subject updatedSubject =
            subjectRepository.save(subject);

        return toResponse(updatedSubject);
    }

    @Override
    public void deleteSubject(Long id) {

        Subject subject =
            subjectRepository.findById(id)
                .orElseThrow(() ->
                    new ResourceNotFoundException(
                        "Subject not found with id: " + id
                    )
                );

        subjectRepository.delete(subject);
    }

    private SubjectResponse toResponse(Subject subject) {

        return new SubjectResponse(
            subject.getId(),
            subject.getName(),
            subject.getDescription(),
            subject.getAcademicProgram().getId(),
            subject.getAcademicProgram().getName(),
            subject.getStatus()
        );
    }
}