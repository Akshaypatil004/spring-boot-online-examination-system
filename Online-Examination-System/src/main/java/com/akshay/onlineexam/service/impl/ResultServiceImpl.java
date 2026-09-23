package com.akshay.onlineexam.service.impl;

import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.akshay.onlineexam.dto.result.ResultResponse;
import com.akshay.onlineexam.entity.Result;
import com.akshay.onlineexam.entity.Student;
import com.akshay.onlineexam.entity.User;
import com.akshay.onlineexam.exception.InvalidRequestException;
import com.akshay.onlineexam.exception.ResourceNotFoundException;
import com.akshay.onlineexam.repository.ResultRepository;
import com.akshay.onlineexam.repository.StudentRepository;
import com.akshay.onlineexam.repository.UserRepository;
import com.akshay.onlineexam.service.ResultService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ResultServiceImpl implements ResultService {

    private final ResultRepository resultRepository;
    private final StudentRepository studentRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ResultResponse> getMyResults() {

        Student student = getAuthenticatedStudent();

        return resultRepository.findAll()
            .stream()
            .filter(result ->
                result.getAttempt()
                    .getStudent()
                    .getId()
                    .equals(student.getId())
            )
            .map(this::toResponse)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ResultResponse getMyResultById(Long resultId) {

        Student student = getAuthenticatedStudent();

        Result result =
            resultRepository.findById(resultId)
                .orElseThrow(() ->
                    new ResourceNotFoundException(
                        "Result not found with id: " + resultId
                    )
                );

        if (!result.getAttempt()
                .getStudent()
                .getId()
                .equals(student.getId())) {

            throw new InvalidRequestException(
                "You cannot access another student's result"
            );
        }

        return toResponse(result);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ResultResponse> getResultsByExam(Long examId) {

        return resultRepository.findAll()
            .stream()
            .filter(result ->
                result.getAttempt()
                    .getExam()
                    .getId()
                    .equals(examId)
            )
            .map(this::toResponse)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ResultResponse> getAllResults() {

        return resultRepository.findAll()
            .stream()
            .map(this::toResponse)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ResultResponse getResultById(Long resultId) {

        Result result =
            resultRepository.findById(resultId)
                .orElseThrow(() ->
                    new ResourceNotFoundException(
                        "Result not found with id: " + resultId
                    )
                );

        return toResponse(result);
    }

    private Student getAuthenticatedStudent() {

        Authentication authentication =
            SecurityContextHolder
                .getContext()
                .getAuthentication();

        String email = authentication.getName();

        User user =
            userRepository.findByEmail(email)
                .orElseThrow(() ->
                    new ResourceNotFoundException(
                        "User not found"
                    )
                );

        return studentRepository.findByUserId(user.getId())
            .orElseThrow(() ->
                new ResourceNotFoundException(
                    "Student profile not found"
                )
            );
    }

    private ResultResponse toResponse(Result result) {

        return new ResultResponse(
            result.getId(),
            result.getAttempt().getId(),
            result.getTotalQuestions(),
            result.getAttemptedQuestions(),
            result.getCorrectAnswers(),
            result.getWrongAnswers(),
            result.getUnansweredQuestions(),
            result.getScore(),
            result.getPercentage(),
            result.getResultStatus().name()
        );
    }
}