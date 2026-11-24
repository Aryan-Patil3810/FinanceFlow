package com.financeflow.transfer.controller;

import com.financeflow.transfer.dto.CreateTransferRequest;
import com.financeflow.transfer.dto.TransferResponse;
import com.financeflow.transfer.service.TransferService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/transfers")
public class TransferController {

    private final TransferService transferService;

    public TransferController(TransferService transferService) {
        this.transferService = transferService;
    }

    @PostMapping
    public ResponseEntity<TransferResponse> createTransfer(
            @RequestParam UUID userId,
            @Valid @RequestBody CreateTransferRequest request
    ) {
        TransferResponse response =
                transferService.createTransfer(userId, request);

        return ResponseEntity.status(201).body(response);
    }

    @GetMapping
    public ResponseEntity<List<TransferResponse>> getTransfers(
            @RequestParam UUID userId
    ) {
        return ResponseEntity.ok(
                transferService.getTransfers(userId)
        );
    }
}