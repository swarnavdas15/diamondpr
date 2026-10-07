const fs = require('fs');

let controller = fs.readFileSync('Backend/src/modules/quotations/quotation.controller.ts', 'utf8');
if (!controller.includes('handleDeleteQuotation')) {
  controller += `
export const handleDeleteQuotation = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    await quotationService.deleteQuotation(id);
    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('Error in handleDeleteQuotation:', err);
    return res.status(400).json({ success: false, error: err.message || 'Failed to delete quotation' });
  }
};
`;
  fs.writeFileSync('Backend/src/modules/quotations/quotation.controller.ts', controller);
}

let routes = fs.readFileSync('Backend/src/modules/quotations/quotation.routes.ts', 'utf8');
if (!routes.includes('handleDeleteQuotation')) {
  routes = routes.replace(
    "handleAddQuotationFollowUp,\n} from './quotation.controller';",
    "handleAddQuotationFollowUp,\n  handleDeleteQuotation,\n} from './quotation.controller';"
  );
  routes = routes.replace(
    "router.post('/:id/follow-up', handleAddQuotationFollowUp);",
    "router.post('/:id/follow-up', handleAddQuotationFollowUp);\nrouter.delete('/:id', handleDeleteQuotation);"
  );
  fs.writeFileSync('Backend/src/modules/quotations/quotation.routes.ts', routes);
}

console.log("Backend quotation routes patched!");
