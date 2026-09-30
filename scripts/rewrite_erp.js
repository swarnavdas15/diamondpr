const fs = require('fs');
const path = 'd:/diamondpr/StickerSmash/src/context/ERPContext.tsx';
let content = fs.readFileSync(path, 'utf8');

const replacements = [
  {
    find: /const updateSalesWorkflowStage = \([^\{]+ \{[\s\S]+?return \{\s*\.\.\.o,[\s\S]+?\}\);\s*\};/m,
    replace: `const updateSalesWorkflowStage = async (orderId: string, stage: SalesWorkflowStage, remarks?: string) => {
    try {
      await apiClient.patch(\`/orders/\${orderId}/sales-workflow\`, { stage, remarks });
      await fetchLiveDashboardData();
    } catch (e) {
      console.error(e);
      throw e;
    }
  };`
  },
  {
    find: /const updatePurchaseStage = \([^\{]+ \{[\s\S]+?return \{\s*\.\.\.o,[\s\S]+?\}\);\s*\};/m,
    replace: `const updatePurchaseStage = async (orderId: string, status: DepartmentStatus, processedQty\?: number, vendorSelected\?: string, procurementNotes\?: string) => {
    try {
      await apiClient.patch(\`/orders/\${orderId}/purchase\`, { status, processedQty, vendorSelected, procurementNotes });
      await fetchLiveDashboardData();
    } catch (e) {
      console.error(e);
      throw e;
    }
  };`
  },
  {
    find: /const updateProductionStage = \([^\{]+ \{[\s\S]+?return \{\s*\.\.\.o,[\s\S]+?\}\);\s*\};/m,
    replace: `const updateProductionStage = async (orderId: string, status: DepartmentStatus, processedQty\?: number, isRework\?: boolean, shopFloorNotes\?: string) => {
    try {
      await apiClient.patch(\`/orders/\${orderId}/production\`, { status, processedQty, isRework, shopFloorNotes });
      await fetchLiveDashboardData();
    } catch (e) {
      console.error(e);
      throw e;
    }
  };`
  },
  {
    find: /const updateQualityStage = \([^\{]+ \{[\s\S]+?return \{\s*\.\.\.o,[\s\S]+?\}\);\s*\};/m,
    replace: `const updateQualityStage = async (orderId: string, status: DepartmentStatus, qcResult: QCResult, processedQty\?: number, qcRemarks\?: string) => {
    try {
      await apiClient.patch(\`/orders/\${orderId}/quality\`, { status, qcResult, processedQty, qcRemarks });
      await fetchLiveDashboardData();
    } catch (e) {
      console.error(e);
      throw e;
    }
  };`
  },
  {
    find: /const updateDispatchStage = \([^\{]+ \{[\s\S]+?return \{\s*\.\.\.o,[\s\S]+?\}\);\s*\};/m,
    replace: `const updateDispatchStage = async (orderId: string, status: DepartmentStatus, processedQty\?: number, logisticsEntry\?: string, transportRef\?: string, dispatchNotes\?: string) => {
    try {
      await apiClient.patch(\`/orders/\${orderId}/dispatch\`, { status, processedQty, logisticsEntry, transportRef, dispatchNotes });
      await fetchLiveDashboardData();
    } catch (e) {
      console.error(e);
      throw e;
    }
  };`
  },
  {
    find: /const verifyAndCloseOrder = \([^\{]+ \{[\s\S]+?return \{\s*\.\.\.o,[\s\S]+?\}\);\s*\};/m,
    replace: `const verifyAndCloseOrder = async (orderId: string, remarks?: string) => {
    try {
      await apiClient.patch(\`/orders/\${orderId}/verify-completion\`, { remarks });
      await fetchLiveDashboardData();
    } catch (e) {
      console.error(e);
      throw e;
    }
  };`
  }
];

let newContent = content;
for (const r of replacements) {
  const matched = newContent.match(r.find);
  if (matched) {
    console.log('Replaced function matching', r.replace.split(' ')[1]);
    newContent = newContent.replace(r.find, r.replace);
  } else {
    console.log('Failed to match', r.replace.split(' ')[1]);
  }
}

fs.writeFileSync(path, newContent);
console.log('Done');
