const { Project, SyntaxKind } = require('ts-morph');

const project = new Project();
const sourceFile = project.addSourceFileAtPath('d:/diamondpr/StickerSmash/src/context/ERPContext.tsx');

const targetFunctions = [
  { name: 'createOrder', body: 'const res = await apiClient.post(`/orders`, data); await fetchLiveDashboardData(); return res.data.order;' },
  { name: 'createClient', body: 'const res = await apiClient.post(`/orders/client`, data); await fetchLiveDashboardData(); return res.data.client;' },
];

for (const target of targetFunctions) {
  const funcDecl = sourceFile.getFirstDescendant(d => d.getKind() === SyntaxKind.VariableDeclaration && d.getName() === target.name);
  if (funcDecl) {
    const init = funcDecl.getInitializerIfKind(SyntaxKind.ArrowFunction);
    if (init) {
      init.setIsAsync(true);
      init.setBodyText(`try { ${target.body} } catch (e) { console.error(e); throw e; }`);
      console.log(`Replaced ${target.name}`);
    }
  }
}

sourceFile.saveSync();
console.log('Saved');
