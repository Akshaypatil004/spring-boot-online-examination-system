package com.akshay.onlineexam.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.akshay.onlineexam.dto.ApiResponse;
import com.akshay.onlineexam.dto.question.OptionRequest;
import com.akshay.onlineexam.dto.question.OptionResponse;
import com.akshay.onlineexam.service.OptionService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/questions/{questionId}/options")
@RequiredArgsConstructor
public class OptionController {

    private final OptionService optionService;

    @PostMapping
    public ResponseEntity<ApiResponse<OptionResponse>> createOption(
            @PathVariable Long questionId,
            @Valid @RequestBody OptionRequest request) {

        OptionResponse option =
            optionService.createOption(questionId, request);

        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(
                new ApiResponse<>(
                    true,
                    "Option created successfully",
                    option
                )
            );
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<OptionResponse>>>
            getOptions(
                @PathVariable Long questionId) {

        return ResponseEntity.ok(
            new ApiResponse<>(
                true,
                "Options fetched successfully",
                optionService.getOptionsByQuestion(questionId)
            )
        );
    }
}