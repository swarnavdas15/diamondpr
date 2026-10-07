const fs = require('fs');

function patchModal(file) {
  let data = fs.readFileSync(file, 'utf8');
  
  // Patch handleFileUpload
  const oldHandleFileUpload = `  const handleFileUpload = (e: any) => {
    let file;
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      file = e.dataTransfer.files[0];
    } else if (e.target && e.target.files && e.target.files.length > 0) {
      file = e.target.files[0];
    }`;

  const newHandleFileUpload = `  const handleFileUpload = (e: any) => {
    let file;
    const dt = e.dataTransfer || (e.nativeEvent && e.nativeEvent.dataTransfer);
    const target = e.target || (e.nativeEvent && e.nativeEvent.target);

    if (dt && dt.files && dt.files.length > 0) {
      file = dt.files[0];
    } else if (target && target.files && target.files.length > 0) {
      file = target.files[0];
    }`;

  // Use regex for spaces/newlines tolerance
  data = data.replace(/const handleFileUpload = \(e: any\) => \{\s*let file;\s*if \(e\.dataTransfer && e\.dataTransfer\.files && e\.dataTransfer\.files\.length > 0\) \{\s*file = e\.dataTransfer\.files\[0\];\s*\} else if \(e\.target && e\.target\.files && e\.target\.files\.length > 0\) \{\s*file = e\.target\.files\[0\];\s*\}/, newHandleFileUpload.trim());

  fs.writeFileSync(file, data);
}

patchModal('StickerSmash/src/components/CreateClientModal.tsx');
patchModal('StickerSmash/src/components/CreateOrderModal.tsx');
console.log("Done");
