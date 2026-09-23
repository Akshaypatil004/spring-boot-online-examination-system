package com.akshay.onlineexam.service;

import java.util.List;

import com.akshay.onlineexam.dto.question.OptionRequest;
import com.akshay.onlineexam.dto.question.OptionResponse;

public interface OptionService {

    OptionResponse createOption(
        Long questionId,
        OptionRequest request
    );

    List<OptionResponse> getOptionsByQuestion(Long questionId);

    OptionResponse updateOption(
        Long id,
        OptionRequest request
    );

    void deleteOption(Long id);
}