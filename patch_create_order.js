const fs = require('fs');

let file = fs.readFileSync('StickerSmash/src/components/CreateOrderModal.tsx', 'utf8');

// Add quotationId to InitialOrderData
file = file.replace(
  /export interface InitialOrderData \{/,
  "export interface InitialOrderData {\n  quotationId?: string;"
);

// Destructure updateQuotation
file = file.replace(
  /const \{ clients, createOrder, refreshData \} = useERP\(\);/,
  "const { clients, createOrder, updateQuotation, refreshData } = useERP();"
);

// Update handleSubmit
const oldHandleSubmit = `  const handleSubmit = () => {
    if (!poNumber.trim() || !clientId) {
      setError('PO Number and Client selection are required.');
      return;
    }

    createOrder({
      poNumber,
      clientId,
      budget: budget ? parseFloat(budget) : undefined,
      technicalRequirements,
      materialRequirements,
      requiredQuantity: parseInt(requiredQuantity, 10) || 1,

      // Pipeline customizer selections
      purchaseRequired,
      productionRequired,
      qualityTestingRequired,
      dispatchRequired,
      customStages,

      items: [
        {
          itemName,
          size,
          quantity: parseInt(requiredQuantity, 10) || 1,
          unitPrice: unitPrice ? parseFloat(unitPrice) : undefined,
        },
      ],
    });

    onClose();
  };`;

const newHandleSubmit = `  const handleSubmit = async () => {
    if (!poNumber.trim() || !clientId) {
      setError('PO Number and Client selection are required.');
      return;
    }
    
    try {
      const newOrder = await createOrder({
        poNumber,
        clientId,
        budget: budget ? parseFloat(budget) : undefined,
        technicalRequirements,
        materialRequirements,
        requiredQuantity: parseInt(requiredQuantity, 10) || 1,

        purchaseRequired,
        productionRequired,
        qualityTestingRequired,
        dispatchRequired,
        customStages,

        items: [
          {
            itemName,
            size,
            quantity: parseInt(requiredQuantity, 10) || 1,
            unitPrice: unitPrice ? parseFloat(unitPrice) : undefined,
          },
        ],
      });

      if (initialData?.quotationId && newOrder?.id) {
        await updateQuotation(initialData.quotationId, {
          status: 'FULLY_CONVERTED',
          convertedOrderId: newOrder.id,
          convertedOrderValue: budget ? parseFloat(budget) : undefined,
          convertedOrderNumber: newOrder.orderNumber,
        });
      }

      onClose();
    } catch (e: any) {
      setError(e.message || 'Failed to create order');
    }
  };`;

if (file.includes('const handleSubmit = () => {')) {
  file = file.replace(/const handleSubmit = \(\) => \{[\s\S]*?onClose\(\);\n  \};/, newHandleSubmit);
  fs.writeFileSync('StickerSmash/src/components/CreateOrderModal.tsx', file);
  console.log("Patched CreateOrderModal.tsx");
} else {
  console.log("Could not find handleSubmit block");
}
