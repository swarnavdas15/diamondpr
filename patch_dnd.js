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

  if (data.includes(oldHandleFileUpload)) {
    data = data.replace(oldHandleFileUpload, newHandleFileUpload);
  } else {
    console.log("Could not find old handleFileUpload in " + file);
  }

  // Add useEffect for global drag
  if (!data.includes('window.addEventListener(\'dragenter\'')) {
    const useEffectString = `
  React.useEffect(() => {
    if (Platform.OS !== 'web' || !visible) return;
    
    const handleDragEnter = (e: any) => {
      e.preventDefault();
      setIsDragging(true);
    };

    window.addEventListener('dragenter', handleDragEnter);
    return () => window.removeEventListener('dragenter', handleDragEnter);
  }, [visible]);
`;
    // Insert after setIsDragging declaration
    data = data.replace("const [isDragging, setIsDragging] = useState(false);", "const [isDragging, setIsDragging] = useState(false);\n" + useEffectString);
  }

  // If it doesn't have React.useEffect, add React import if needed (but we used React.useEffect, so it should be fine)
  
  fs.writeFileSync(file, data);
}

patchModal('StickerSmash/src/components/CreateClientModal.tsx');
patchModal('StickerSmash/src/components/CreateOrderModal.tsx');
console.log("Done");
