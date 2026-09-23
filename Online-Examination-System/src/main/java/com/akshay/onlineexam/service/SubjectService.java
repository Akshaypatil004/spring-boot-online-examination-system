package com.akshay.onlineexam.service;

import java.util.List;

import com.akshay.onlineexam.dto.subject.SubjectRequest;
import com.akshay.onlineexam.dto.subject.SubjectResponse;

public interface SubjectService {

    SubjectResponse createSubject(SubjectRequest request);

    List<SubjectResponse> getAllSubjects();

    List<SubjectResponse> getSubjectsByProgram(Long programId);

    SubjectResponse getSubjectById(Long id);

    SubjectResponse updateSubject(Long id, SubjectRequest request);

    void deleteSubject(Long id);
}