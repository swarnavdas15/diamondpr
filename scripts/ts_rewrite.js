const { Project, SyntaxKind } = require('ts-morph');

const project = new Project();
const sourceFile = project.addSourceFileAtPath('d:/diamondpr/StickerSmash/src/context/ERPContext.tsx');

const targetFunctions = [
  { name: 'updateSalesWorkflowStage', body: 'await apiClient.patch(`/orders/${orderId}/sales-workflow`, { stage, remarks }); await fetchLiveDashboardData();' },
  { name: 'updatePurchaseStage', body: 'await apiClient.patch(`/orders/${orderId}/purchase`, { status, processedQty, vendorSelected, procurementNotes }); await fetchLiveDashboardData();' },
  { name: 'updateProductionStage', body: 'await apiClient.patch(`/orders/${orderId}/production`, { status, processedQty, isRework, shopFloorNotes }); await fetchLiveDashboardData();' },
  { name: 'updateQualityStage', body: 'await apiClient.patch(`/orders/${orderId}/quality`, { status, qcResult, processedQty, qcRemarks }); await fetchLiveDashboardData();' },
  { name: 'updateDispatchStage', body: 'await apiClient.patch(`/orders/${orderId}/dispatch`, { status, processedQty, logisticsEntry, transportRef, dispatchNotes }); await fetchLiveDashboardData();' },
  { name: 'verifyAndCloseOrder', body: 'await apiClient.patch(`/orders/${orderId}/verify-completion`, { remarks }); await fetchLiveDashboardData();' },
];

for (const target of targetFunctions) {
  const funcDecl = sourceFile.getFirstDescendant(d => d.getKind() === SyntaxKind.VariableDeclaration && d.getName() === target.name);
  if (funcDecl) {
    const init = funcDecl.getInitializerIfKind(SyntaxKind.ArrowFunction);
    if (init) {
      init.setIsAsync(true);
      init.setBodyText(`try { ${target.body} } catch (e) { console.error(e); }`);
      console.log(`Replaced ${target.name}`);
    }
  }
}

sourceFile.saveSync();
console.log('Saved');
