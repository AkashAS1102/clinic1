package com.clinic.controller;

import com.clinic.model.stock.*;
import com.clinic.repository.StockInventoryLedgerRepository;
import com.clinic.service.StockService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST Controller — Stock Management Module
 *
 * Base path: /api/stock
 *
 * Endpoints:
 *   Products     GET/POST/PUT/DELETE  /api/stock/products
 *   POs          GET/POST             /api/stock/po
 *   PO Actions   PUT                  /api/stock/po/{id}/approve
 *                PUT                  /api/stock/po/{id}/cancel
 *   GRN          GET/POST             /api/stock/grn
 *                PUT                  /api/stock/grn/{id}/verify
 *   Ledger       GET                  /api/stock/ledger
 *                GET                  /api/stock/ledger/{productId}/stock
 *   Returns      GET/POST             /api/stock/returns
 */
@RestController
@RequestMapping("/api/stock")
public class StockController {

    private final StockService service;
    private final StockInventoryLedgerRepository ledgerRepo;

    public StockController(StockService service,
                           StockInventoryLedgerRepository ledgerRepo) {
        this.service    = service;
        this.ledgerRepo = ledgerRepo;
    }

    // ── Product Master ────────────────────────────────────────────────────────

    @GetMapping("/products")
    public List<StockProduct> getProducts() {
        return service.getAllProducts();
    }

    @PostMapping("/products")
    @ResponseStatus(HttpStatus.CREATED)
    public StockProduct createProduct(@RequestBody StockProduct product) {
        return service.createProduct(product);
    }

    @PutMapping("/products/{id}")
    public StockProduct updateProduct(@PathVariable String id,
                                      @RequestBody StockProduct product) {
        return service.updateProduct(id, product);
    }

    @DeleteMapping("/products/{id}")
    public Map<String, Boolean> deleteProduct(@PathVariable String id) {
        service.deleteProduct(id);
        return Map.of("success", true);
    }

    // ── Purchase Orders ───────────────────────────────────────────────────────

    @GetMapping("/po")
    public List<StockPurchaseOrder> getPOs(
            @RequestParam(required = false) String status) {
        return status != null
                ? service.getPOsByStatus(status)
                : service.getAllPOs();
    }

    @PostMapping("/po")
    @ResponseStatus(HttpStatus.CREATED)
    public StockPurchaseOrder createPO(@RequestBody StockPurchaseOrder po) {
        return service.createPO(po);
    }

    @PutMapping("/po/{id}/approve")
    public StockPurchaseOrder approvePO(@PathVariable String id) {
        return service.approvePO(id);
    }

    @PutMapping("/po/{id}/send")
    public StockPurchaseOrder sendPO(@PathVariable String id) {
        return service.sendPO(id);
    }

    @PutMapping("/po/{id}/cancel")
    public StockPurchaseOrder cancelPO(@PathVariable String id) {
        return service.cancelPO(id);
    }

    // ── GRN / Inwarding ───────────────────────────────────────────────────────

    @GetMapping("/grn")
    public List<StockGrnItem> getGrnItems(
            @RequestParam(required = false) String poId) {
        return poId != null
                ? service.getGrnItemsByPo(poId)
                : service.getAllGrnItems();
    }

    @PostMapping("/grn")
    @ResponseStatus(HttpStatus.CREATED)
    public StockGrnItem saveGrnItem(@RequestBody StockGrnItem item) {
        return service.saveGrnItem(item);
    }

    /**
     * QC-verify a GRN item and post an INWARD entry to the ledger.
     * Body: { "verifiedBy": "Dr. Smith" }
     */
    @PutMapping("/grn/{id}/verify")
    public StockGrnItem verifyGrnItem(@PathVariable String id,
                                      @RequestBody Map<String, String> body) {
        return service.verifyGrnItem(id, body);
    }

    // ── Inventory Ledger ──────────────────────────────────────────────────────

    @GetMapping("/ledger")
    public List<StockInventoryLedger> getLedger() {
        return ledgerRepo.findAllByOrderByTransactionDateDesc();
    }

    /** Returns current on-hand stock quantity for a specific product */
    @GetMapping("/ledger/{productId}/stock")
    public Map<String, Integer> getCurrentStock(@PathVariable String productId) {
        return Map.of("currentStock", service.getCurrentStock(productId));
    }

    // ── Purchase Returns ──────────────────────────────────────────────────────

    @GetMapping("/returns")
    public List<StockPurchaseReturn> getReturns() {
        return service.getAllReturns();
    }

    @PostMapping("/returns")
    @ResponseStatus(HttpStatus.CREATED)
    public StockPurchaseReturn processReturn(@RequestBody StockPurchaseReturn ret) {
        return service.processReturn(ret);
    }
}
