package com.akshay.onlineexam.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import com.akshay.onlineexam.dto.ApiResponse;
import com.akshay.onlineexam.dto.program.ProgramRequest;
import com.akshay.onlineexam.dto.program.ProgramResponse;
import com.akshay.onlineexam.service.ProgramService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/programs")
@RequiredArgsConstructor
@Validated
public class ProgramController {

    private final ProgramService programService;

    @PostMapping
    public ResponseEntity<ApiResponse<ProgramResponse>> createProgram(
            @Valid @RequestBody ProgramRequest request) {

        ProgramResponse program =
            programService.createProgram(request);

        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(
                new ApiResponse<>(
                    true,
                    "Academic program created successfully",
                    program
                )
            );
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProgramResponse>>> getAllPrograms() {

        List<ProgramResponse> programs =
            programService.getAllPrograms();

        return ResponseEntity.ok(
            new ApiResponse<>(
                true,
                "Academic programs fetched successfully",
                programs
            )
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProgramResponse>> getProgramById(
            @PathVariable Long id) {

        ProgramResponse program =
            programService.getProgramById(id);

        return ResponseEntity.ok(
            new ApiResponse<>(
                true,
                "Academic program fetched successfully",
                program
            )
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProgramResponse>> updateProgram(
            @PathVariable Long id,
            @Valid @RequestBody ProgramRequest request) {

        ProgramResponse program =
            programService.updateProgram(id, request);

        return ResponseEntity.ok(
            new ApiResponse<>(
                true,
                "Academic program updated successfully",
                program
            )
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProgram(
            @PathVariable Long id) {

        programService.deleteProgram(id);

        return ResponseEntity.noContent().build();
    }
}