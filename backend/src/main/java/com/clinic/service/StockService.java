package com.clinic.service;

import com.clinic.model.stock.*;
import com.clinic.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

/**
 * Stock Management Service
 *
 * Orchestrates the full inventory flow:
 *   Product Master → Purchase Orders → GRN Verification → Ledger → Returns
 */
@Service
@Transactional
public class StockService {

    private static final DateTimeFormatter DT_FMT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final StockProductRepository          productRepo;
    private final StockPurchaseOrderRepository    poRepo;
    private final StockGrnItemRepository          grnRepo;
    private final StockInventoryLedgerRepository  ledgerRepo;
    private final StockPurchaseReturnRepository   returnRepo;

    public StockService(StockProductRepository productRepo,
                        StockPurchaseOrderRepository poRepo,
                        StockGrnItemRepository grnRepo,
                        StockInventoryLedgerRepository ledgerRepo,
                        StockPurchaseReturnRepository returnRepo) {
        this.productRepo = productRepo;
        this.poRepo      = poRepo;
        this.grnRepo     = grnRepo;
        this.ledgerRepo  = ledgerRepo;
        this.returnRepo  = returnRepo;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 1. PRODUCT MASTER
    // ══════════════════════════════════════════════════════════════════════════

    public List<StockProduct> getAllProducts() {
        return productRepo.findAllByOrderByCreatedAtDesc();
    }

    public StockProduct createProduct(StockProduct p) {
        if (p.getId() == null || p.getId().isBlank())
            p.setId("PROD-" + System.currentTimeMillis());
        if (p.getCreatedAt() == null)
            p.setCreatedAt(now());
        
        StockProduct saved = productRepo.save(p);

        if (p.getInitialStock() != null && p.getInitialStock() > 0) {
            StockInventoryLedger entry = new StockInventoryLedger();
            entry.setId("LED-" + System.currentTimeMillis());
            entry.setProductId(saved.getId());
            entry.setProductName(saved.getName());
            entry.setTransactionType("INWARD");
            entry.setQuantity(p.getInitialStock());
            entry.setReferenceId("OPENING-BALANCE");
            entry.setTransactionDate(now());
            ledgerRepo.save(entry);
        }

        return saved;
    }

    public StockProduct updateProduct(String id, StockProduct p) {
        productRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
        p.setId(id);
        return productRepo.save(p);
    }

    public void deleteProduct(String id) {
        productRepo.deleteById(id);
    }

    /** Returns current on-hand stock quantity for a product */
    public Integer getCurrentStock(String productId) {
        return ledgerRepo.getCurrentStock(productId);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 2. PURCHASE ORDERS
    // ══════════════════════════════════════════════════════════════════════════

    public List<StockPurchaseOrder> getAllPOs() {
        return poRepo.findAllByOrderByCreatedAtDesc();
    }

    public List<StockPurchaseOrder> getPOsByStatus(String status) {
        return poRepo.findByStatus(status);
    }

    public StockPurchaseOrder createPO(StockPurchaseOrder po) {
        if (po.getId() == null || po.getId().isBlank())
            po.setId("PO-" + System.currentTimeMillis());
        if (po.getStatus() == null) po.setStatus("Draft");
        if (po.getCreatedAt() == null) po.setCreatedAt(now());

        // Link child items back to parent
        if (po.getItems() != null) {
            po.getItems().forEach(item -> {
                if (item.getId() == null || item.getId().isBlank())
                    item.setId("POI-" + System.currentTimeMillis() + "-" + (int)(Math.random() * 1000));
                if (item.getQuantityReceived() == null)
                    item.setQuantityReceived(0);
                item.setPurchaseOrder(po);
            });
        }
        return poRepo.save(po);
    }

    /** Approve a Draft PO → moves to Pending Approval */
    public StockPurchaseOrder approvePO(String id) {
        StockPurchaseOrder po = poRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "PO not found"));
        if (!"Draft".equals(po.getStatus()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only Draft POs can be approved");
        po.setStatus("Pending Approval");
        return poRepo.save(po);
    }

    /** Send a PO to vendor → moves from Pending Approval to Sent */
    public StockPurchaseOrder sendPO(String id) {
        StockPurchaseOrder po = poRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "PO not found"));
        if (!"Pending Approval".equals(po.getStatus()) && !"Draft".equals(po.getStatus()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only Draft or Pending Approval POs can be sent");
        po.setStatus("Sent");
        return poRepo.save(po);
    }

    /** Cancel a PO (any status except Completed) */
    public StockPurchaseOrder cancelPO(String id) {
        StockPurchaseOrder po = poRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "PO not found"));
        if ("Completed".equals(po.getStatus()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Completed POs cannot be cancelled");
        po.setStatus("Cancelled");
        return poRepo.save(po);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 3. GRN / INWARDING  — the core verification workflow
    // ══════════════════════════════════════════════════════════════════════════

    public List<StockGrnItem> getAllGrnItems() {
        return grnRepo.findAllByOrderByCreatedAtDesc();
    }

    public List<StockGrnItem> getGrnItemsByPo(String poId) {
        return grnRepo.findByPoId(poId);
    }

    /**
     * Save a GRN item after the user fills in batch/dates/received qty.
     * Automatically runs the Discrepancy Engine.
     */
    public StockGrnItem saveGrnItem(StockGrnItem item) {
        if (item.getId() == null || item.getId().isBlank())
            item.setId("GRN-" + System.currentTimeMillis() + "-" + (int)(Math.random() * 1000));
        if (item.getCreatedAt() == null) item.setCreatedAt(now());

        // ── Discrepancy Engine ──────────────────────────────────────────────
        if (item.getOrderedQuantity() != null && item.getReceivedQuantity() != null) {
            int ordered  = item.getOrderedQuantity();
            int received = item.getReceivedQuantity();
            if (received == ordered) {
                item.setDiscrepancyStatus("Matched");
            } else if (received < ordered) {
                item.setDiscrepancyStatus("Partial Fulfillment");
            } else {
                item.setDiscrepancyStatus("Over-delivered");
            }
        }

        item.setStatus("Pending QC");
        return grnRepo.save(item);
    }

    /**
     * QC Verify a GRN item — commits it to the active inventory ledger.
     *
     * Rules enforced:
     *   • batchNumber must not be blank
     *   • expiryDate must not be blank
     *
     * On success:
     *   • GRN item status → Verified
     *   • An INWARD ledger entry is inserted (qty = receivedQuantity)
     *   • StockPoItem quantityReceived is updated
     *   • PO status is updated (Partially Received / Completed)
     */
    public StockGrnItem verifyGrnItem(String grnItemId, Map<String, String> body) {
        StockGrnItem item = grnRepo.findById(grnItemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "GRN item not found"));

        // Mandatory field validation
        if (item.getBatchNumber() == null || item.getBatchNumber().isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Batch number is required before QC");
        if (item.getMfgDate() == null || item.getMfgDate().isBlank())
            item.setMfgDate(now().split("T")[0]);
        if (item.getExpiryDate() == null || item.getExpiryDate().isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Expiry date is required");
        if (!Boolean.TRUE.equals(item.getQcPassed()))
            item.setQcPassed(true);

        item.setStatus("Verified");
        item.setVerifiedBy(body != null ? body.getOrDefault("verifiedBy", "Staff") : "Staff");
        item.setReceivedDate(now());
        grnRepo.save(item);

        // ── Post INWARD entry to Inventory Ledger ───────────────────────────
        StockInventoryLedger entry = new StockInventoryLedger();
        entry.setId("LED-" + System.currentTimeMillis() + "-" + (int)(Math.random() * 1000));
        entry.setProductId(item.getProductId());
        entry.setProductName(item.getProductName());
        entry.setGrnItemId(item.getId());
        entry.setTransactionType("INWARD");
        entry.setQuantity(item.getReceivedQuantity());
        entry.setBatchNumber(item.getBatchNumber());
        entry.setExpiryDate(item.getExpiryDate());
        entry.setReferenceId(item.getPoId());
        entry.setTransactionDate(now());
        ledgerRepo.save(entry);

        // ── Update PO item quantityReceived & PO status ─────────────────────
        updatePoStatusAfterGrn(item);

        return item;
    }

    /**
     * After each GRN verification, update the matching line item's received quantity
     * and re-evaluate the PO status:
     *   - All items fully matched → Completed
     *   - Any item received → Partially Received
     */
    private void updatePoStatusAfterGrn(StockGrnItem item) {
        if (item.getPoId() == null) return;
        poRepo.findById(item.getPoId()).ifPresent(po -> {
            if (po.getItems() == null || po.getItems().isEmpty()) return;

            // Increment quantityReceived on matching StockPoItem
            for (StockPoItem poItem : po.getItems()) {
                boolean matchById = item.getPoItemId() != null && item.getPoItemId().equals(poItem.getId());
                boolean matchByProduct = item.getProductId() != null && item.getProductId().equals(poItem.getProductId());
                if (matchById || matchByProduct) {
                    int prev = poItem.getQuantityReceived() != null ? poItem.getQuantityReceived() : 0;
                    poItem.setQuantityReceived(prev + (item.getReceivedQuantity() != null ? item.getReceivedQuantity() : 0));
                    break;
                }
            }

            boolean allReceived = po.getItems().stream()
                    .allMatch(i -> i.getQuantityReceived() != null
                            && i.getQuantityReceived() >= (i.getQuantityRequired() != null ? i.getQuantityRequired() : 0));

            boolean anyReceived = po.getItems().stream()
                    .anyMatch(i -> i.getQuantityReceived() != null && i.getQuantityReceived() > 0);

            if (allReceived) {
                po.setStatus("Completed");
            } else if (anyReceived) {
                po.setStatus("Partially Received");
            }
            poRepo.save(po);
        });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 4. PURCHASE RETURNS (RTV / Wastage)
    // ══════════════════════════════════════════════════════════════════════════

    public List<StockPurchaseReturn> getAllReturns() {
        return returnRepo.findAllByOrderByCreatedAtDesc();
    }

    /**
     * Process a return:
     *   • Validates returnedQuantity ≤ original received qty
     *   • Inserts a negative RETURN ledger entry (deducts from active stock)
     *   • Marks debitNoteGenerated = true
     */
    public StockPurchaseReturn processReturn(StockPurchaseReturn ret) {
        if (ret.getId() == null || ret.getId().isBlank())
            ret.setId("RET-" + System.currentTimeMillis());
        if (ret.getCreatedAt() == null) ret.setCreatedAt(now());

        // Validate quantity
        if (ret.getGrnItemId() != null) {
            grnRepo.findById(ret.getGrnItemId()).ifPresent(grn -> {
                if (ret.getReturnedQuantity() > grn.getReceivedQuantity())
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Returned quantity exceeds received quantity for this batch");
            });
        }

        ret.setDebitNoteGenerated(true);
        StockPurchaseReturn saved = returnRepo.save(ret);

        // ── Post RETURN (negative) entry to Inventory Ledger ───────────────
        StockInventoryLedger entry = new StockInventoryLedger();
        entry.setId("LED-" + System.currentTimeMillis());
        entry.setProductId(ret.getProductId());
        entry.setProductName(ret.getProductName());
        entry.setGrnItemId(ret.getGrnItemId());
        entry.setTransactionType("RETURN");
        entry.setQuantity(-Math.abs(ret.getReturnedQuantity())); // always negative
        entry.setBatchNumber(ret.getBatchNumber());
        entry.setReferenceId(ret.getId());
        entry.setTransactionDate(now());
        ledgerRepo.save(entry);

        return saved;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Helpers
    // ══════════════════════════════════════════════════════════════════════════

    private String now() {
        return LocalDateTime.now().format(DT_FMT);
    }
}
