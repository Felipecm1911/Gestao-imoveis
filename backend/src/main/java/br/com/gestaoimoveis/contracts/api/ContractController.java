package br.com.gestaoimoveis.contracts.api;

import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import br.com.gestaoimoveis.contracts.api.ContractDtos.AdjustRequest;
import br.com.gestaoimoveis.contracts.api.ContractDtos.ContractListItem;
import br.com.gestaoimoveis.contracts.api.ContractDtos.ContractRequest;
import br.com.gestaoimoveis.contracts.api.ContractDtos.ContractResponse;
import br.com.gestaoimoveis.contracts.api.ContractDtos.HistoryEntry;
import br.com.gestaoimoveis.contracts.api.ContractDtos.Stats;
import br.com.gestaoimoveis.contracts.api.ContractDtos.TerminateRequest;
import br.com.gestaoimoveis.contracts.domain.RentalContract.Situation;
import br.com.gestaoimoveis.contracts.repository.RentalContractRepository.Filter;
import br.com.gestaoimoveis.contracts.service.ContractService;
import br.com.gestaoimoveis.shared.web.PageResponse;

@RestController
@RequestMapping("/api/contracts")
@PreAuthorize("hasAnyRole('ADMIN','STAFF')")
class ContractController {

    private final ContractService service;

    ContractController(ContractService service) {
        this.service = service;
    }

    @GetMapping
    PageResponse<ContractListItem> list(@RequestParam(required = false) String q,
            @RequestParam(required = false) Situation situation, @RequestParam(required = false) UUID propertyId,
            @RequestParam(required = false) UUID tenantId,
            @PageableDefault(sort = "number", direction = Sort.Direction.DESC) Pageable pageable) {
        return service.search(new Filter(q, situation, propertyId, tenantId), pageable);
    }

    @GetMapping("/stats")
    Stats stats() {
        return service.stats();
    }

    @GetMapping("/{id}")
    ContractResponse get(@PathVariable UUID id) {
        return service.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    ContractResponse create(@Valid @RequestBody ContractRequest req) {
        return service.create(req);
    }

    @PutMapping("/{id}")
    ContractResponse update(@PathVariable UUID id, @Valid @RequestBody ContractRequest req) {
        return service.update(id, req);
    }

    @PostMapping("/{id}/activate")
    ContractResponse activate(@PathVariable UUID id) {
        return service.activate(id);
    }

    @PostMapping("/{id}/adjust")
    ContractResponse adjust(@PathVariable UUID id, @Valid @RequestBody AdjustRequest req) {
        return service.adjust(id, req);
    }

    /** Devolve o rascunho da renovação, não o contrato renovado. */
    @PostMapping("/{id}/renew")
    @ResponseStatus(HttpStatus.CREATED)
    ContractResponse renew(@PathVariable UUID id) {
        return service.renew(id);
    }

    @PostMapping("/{id}/terminate")
    ContractResponse terminate(@PathVariable UUID id, @Valid @RequestBody TerminateRequest req) {
        return service.terminate(id, req);
    }

    @PostMapping("/{id}/cancel")
    ContractResponse cancel(@PathVariable UUID id) {
        return service.cancel(id);
    }

    @GetMapping("/{id}/history")
    List<HistoryEntry> history(@PathVariable UUID id) {
        return service.history(id);
    }

    @GetMapping("/{id}/pdf")
    ResponseEntity<byte[]> pdf(@PathVariable UUID id) {
        ContractService.Pdf pdf = service.pdf(id);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.inline().filename(pdf.filename()).build().toString())
                .body(pdf.content());
    }
}
