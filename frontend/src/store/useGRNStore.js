/**
 * GRN State — plain React hook, no external state library required.
 *
 * Usage:
 *   const { state, initGRN, updateItem, verifyItem, submitGRN } = useGRNState();
 */
import { useReducer, useCallback } from 'react';
import { stockApi } from '../api/stockApi';

const initialState = {
  activeGRN: null,
  pendingItems: [],
  verifiedItems: [],
  submitting: false,
  error: null,
};

function discrepancyStatus(ordered, received) {
  if (received === ordered) return 'Matched';
  if (received < ordered)  return 'Partial Fulfillment';
  return 'Over-delivered';
}

function reducer(state, action) {
  switch (action.type) {
    case 'INIT_GRN':
      return {
        ...initialState,
        activeGRN: { poId: action.po.id, vendorName: action.po.vendorName },
        pendingItems: (action.po.items || []).map(item => ({
          ...item,
          receivedQuantity: item.quantityReceived ?? 0,
          orderedQuantity:  item.quantityRequired,
          batchNumber: '',
          mfgDate: '',
          expiryDate: '',
          qcPassed: false,
          discrepancyStatus: 'Pending',
        })),
      };

    case 'UPDATE_ITEM':
      return {
        ...state,
        pendingItems: state.pendingItems.map(item => {
          if (item.id !== action.id) return item;
          const updated = { ...item, ...action.updates };
          if (action.updates.receivedQuantity !== undefined) {
            updated.discrepancyStatus = discrepancyStatus(
              updated.orderedQuantity,
              Number(updated.receivedQuantity)
            );
          }
          return updated;
        }),
      };

    case 'VERIFY_ITEM': {
      const item = state.pendingItems.find(i => i.id === action.id);
      if (!item) return state;
      return {
        ...state,
        pendingItems:  state.pendingItems.filter(i => i.id !== action.id),
        verifiedItems: [...state.verifiedItems, item],
      };
    }

    case 'SUBMITTING':
      return { ...state, submitting: true, error: null };

    case 'SUBMIT_OK':
      return { ...initialState };

    case 'SUBMIT_FAIL':
      return { ...state, submitting: false, error: action.error };

    default:
      return state;
  }
}

export function useGRNState() {
  const [state, dispatch] = useReducer(reducer, initialState);

  /** Call when user picks a PO to inward */
  const initGRN = useCallback((po) => {
    dispatch({ type: 'INIT_GRN', po });
  }, []);

  /** Update a pending item's batch/dates/qty/QC flag */
  const updateItem = useCallback((id, updates) => {
    dispatch({ type: 'UPDATE_ITEM', id, updates });
  }, []);

  /** Move item to verifiedItems after client-side validation */
  const verifyItem = useCallback((id) => {
    const item = state.pendingItems.find(i => i.id === id);
    if (!item) return;
    if (!item.batchNumber?.trim()) {
      alert('Batch number is required before verification.');
      return;
    }
    if (!item.mfgDate?.trim() || !item.expiryDate?.trim()) {
      alert('Manufacturing date and expiry date are required.');
      return;
    }
    if (!item.qcPassed) {
      alert('Mark QC as Passed before verifying.');
      return;
    }
    dispatch({ type: 'VERIFY_ITEM', id });
  }, [state.pendingItems]);

  /**
   * Send all verified items to Java backend one-by-one.
   * Each item hits: PUT /api/stock/grn/{id}/verify
   */
  const submitGRN = useCallback(async () => {
    if (state.verifiedItems.length === 0) {
      alert('No verified items to submit.');
      return;
    }
    dispatch({ type: 'SUBMITTING' });
    try {
      for (const item of state.verifiedItems) {
        // First save the GRN item if it has no backend ID
        const savedItem = item.grnId
          ? item
          : await stockApi.saveGrnItem({
              poId:             state.activeGRN.poId,
              poItemId:         item.id,
              productId:        item.productId,
              productName:      item.productName,
              batchNumber:      item.batchNumber,
              mfgDate:          item.mfgDate,
              expiryDate:       item.expiryDate,
              orderedQuantity:  item.orderedQuantity,
              receivedQuantity: Number(item.receivedQuantity),
              qcPassed:         true,
            });
        // Then verify it → posts INWARD to ledger
        await stockApi.verifyGrnItem(savedItem.id, { verifiedBy: 'Current User' });
      }
      dispatch({ type: 'SUBMIT_OK' });
      alert('GRN submitted! Stock ledger updated successfully.');
    } catch (err) {
      dispatch({ type: 'SUBMIT_FAIL', error: err.message });
      alert('Submission failed: ' + err.message);
    }
  }, [state.verifiedItems, state.activeGRN]);

  return { state, initGRN, updateItem, verifyItem, submitGRN };
}
