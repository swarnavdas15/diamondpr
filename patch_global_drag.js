const fs = require('fs');

const robustUseEffect = `  React.useEffect(() => {
    if (Platform.OS !== 'web' || !visible) {
      setIsDragging(false);
      return;
    }
    
    const preventDefaults = (e: any) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDragEnter = (e: any) => {
      preventDefaults(e);
      setIsDragging(true);
    };

    const handleDragLeave = (e: any) => {
      preventDefaults(e);
      // Only hide overlay if we are leaving the window entirely
      if (!e.relatedTarget || e.relatedTarget === document.documentElement) {
        setIsDragging(false);
      }
    };

    const handleDrop = (e: any) => {
      preventDefaults(e);
      setIsDragging(false);
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragover', preventDefaults);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragover', preventDefaults);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
      setIsDragging(false);
    };
  }, [visible]);`;

function patchFile(file) {
  let data = fs.readFileSync(file, 'utf8');

  const regex = /React\.useEffect\(\(\) => \{[\s\S]*?window\.removeEventListener\('dragenter', handleDragEnter\);\s*\}, \[visible\]\);/;
  
  if (regex.test(data)) {
    data = data.replace(regex, robustUseEffect.trim());
    fs.writeFileSync(file, data);
    console.log(`Patched ${file}`);
  } else {
    console.log(`Could not find useEffect to replace in ${file}`);
  }
}

patchFile('StickerSmash/src/components/CreateClientModal.tsx');
patchFile('StickerSmash/src/components/CreateOrderModal.tsx');
