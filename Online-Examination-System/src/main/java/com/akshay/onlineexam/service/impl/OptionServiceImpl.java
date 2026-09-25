package com.akshay.onlineexam.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.akshay.onlineexam.dto.question.OptionRequest;
import com.akshay.onlineexam.dto.question.OptionResponse;
import com.akshay.onlineexam.entity.Option;
import com.akshay.onlineexam.entity.ExamStatus;
import com.akshay.onlineexam.entity.Question;
import com.akshay.onlineexam.exception.InvalidRequestException;
import com.akshay.onlineexam.exception.ResourceNotFoundException;
import com.akshay.onlineexam.repository.OptionRepository;
import com.akshay.onlineexam.repository.QuestionRepository;
import com.akshay.onlineexam.service.OptionService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OptionServiceImpl implements OptionService {

    private final OptionRepository optionRepository;
    private final QuestionRepository questionRepository;

    @Override
    public OptionResponse createOption(
            Long questionId,
            OptionRequest request) {

        Question question =
            questionRepository.findById(questionId)
                .orElseThrow(() ->
                    new ResourceNotFoundException(
                        "Question not found with id: " + questionId
                    )
                );

        if (question.getExam().getStatus() != ExamStatus.DRAFT) {
            throw new InvalidRequestException(
                "Options can only be changed while an exam is in DRAFT status"
            );
        }

        List<Option> existingOptions =
            optionRepository.findByQuestionId(questionId);

        if (existingOptions.size() >= 4) {
            throw new InvalidRequestException(
                "A question cannot have more than 4 options"
            );
        }

        Option option = new Option();

        option.setQuestion(question);
        option.setOptionText(request.getOptionText());
        option.setOptionLabel(request.getOptionLabel());
        option.setIsCorrect(request.isCorrect());

        Option savedOption =
            optionRepository.save(option);

        return toResponse(savedOption);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OptionResponse> getOptionsByQuestion(
            Long questionId) {

        if (!questionRepository.existsById(questionId)) {
            throw new ResourceNotFoundException(
                "Question not found with id: " + questionId
            );
        }

        return optionRepository.findByQuestionId(questionId)
            .stream()
            .map(this::toResponse)
            .toList();
    }

    @Override
    public OptionResponse updateOption(
            Long id,
            OptionRequest request) {

        Option option =
            optionRepository.findById(id)
                .orElseThrow(() ->
                    new ResourceNotFoundException(
                        "Option not found with id: " + id
                    )
                );

        if (option.getQuestion()
                .getExam()
                .getStatus()
                != ExamStatus.DRAFT) {

            throw new InvalidRequestException(
                "Options can only be changed while an exam is in DRAFT status"
            );
        }

        option.setOptionText(request.getOptionText());
        option.setOptionLabel(request.getOptionLabel());
        option.setIsCorrect(request.isCorrect());

        Option updatedOption =
            optionRepository.save(option);

        return toResponse(updatedOption);
    }

    @Override
    public void deleteOption(Long id) {

        Option option =
            optionRepository.findById(id)
                .orElseThrow(() ->
                    new ResourceNotFoundException(
                        "Option not found with id: " + id
                    )
                );

        if (option.getQuestion()
                .getExam()
                .getStatus()
                != ExamStatus.DRAFT) {

            throw new InvalidRequestException(
                "Options can only be changed while an exam is in DRAFT status"
            );
        }

        optionRepository.delete(option);
    }

    private OptionResponse toResponse(Option option) {

        return new OptionResponse(
            option.getId(),
            option.getOptionText(),
            option.getOptionLabel()
        );
    }
}
