const fs = require('fs');

let appFile = fs.readFileSync('Backend/src/app.ts', 'utf8');

if (!appFile.includes('quotationRoutes')) {
  appFile = appFile.replace(
    "import drawingRoutes from './modules/drawings/drawing.routes';",
    "import drawingRoutes from './modules/drawings/drawing.routes';\nimport quotationRoutes from './modules/quotations/quotation.routes';"
  );
  appFile = appFile.replace(
    "app.use('/api/drawings', drawingRoutes);",
    "app.use('/api/drawings', drawingRoutes);\napp.use('/api/quotations', quotationRoutes);"
  );
  fs.writeFileSync('Backend/src/app.ts', appFile);
  console.log("Registered quotation routes in app.ts");
}
